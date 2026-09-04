// node harness.js <url> <durationSec> [shots "t:file,t:file"] [keys "t:Code:down|up|press,..."] [evalAtEnd]
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [,, url, durS, shotsArg, keysArg, evalArg] = process.argv;
const dur = parseFloat(durS || '10');
const port = 9333 + Math.floor(Math.random() * 500);
const prof = `${process.env.HARNESS_PROF_DIR || require('os').tmpdir()}/nitro_prof_${port}`;
const gpuFlags = process.env.GPU ? ['--ignore-gpu-blocklist'] : ['--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const chrome = spawn(CH, ['--headless=new'].concat(gpuFlags).concat(['--no-sandbox', '--no-first-run', '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1100,700', 'about:blank']), { stdio: 'ignore' });
function getJson(path) { return new Promise((res, rej) => { http.get({ host: '127.0.0.1', port, path }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KEYS = { KeyW: ['w', 87], KeyA: ['a', 65], KeyS: ['s', 83], KeyD: ['d', 68], Space: [' ', 32], ShiftLeft: ['Shift', 16], KeyE: ['e', 69], KeyR: ['r', 82], Enter: ['Enter', 13], Escape: ['Escape', 27], ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39], ArrowUp: ['ArrowUp', 38] };
setTimeout(() => { console.log('[watchdog] forcing exit'); chrome.kill('SIGKILL'); process.exit(2); }, (dur + 45) * 1000);
(async () => {
  let pages = null;
  for (let i = 0; i < 50; i++) { try { pages = await getJson('/json'); if (pages.length) break; } catch (e) { } await sleep(200); }
  if (!pages) { console.log('chrome did not start'); chrome.kill(); process.exit(1); }
  const page = pages.find(p => p.type === 'page' && /about:blank/.test(p.url)) || pages.find(p => p.type === 'page') || pages[0];
  console.log('[harness] chrome up, pages=' + pages.length + ' using ' + page.type + ' ' + page.url);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = {};
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending[i] = res; ws.send(JSON.stringify({ id: i, method, params })); });
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = e => { console.log('ws error', e.message || e); chrome.kill('SIGKILL'); process.exit(1); }; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m.result || m.error); delete pending[m.id]; return; }
    if (m.method === 'Runtime.consoleAPICalled') console.log('[console.' + m.params.type + ']', m.params.args.map(a => a.value !== undefined ? a.value : (a.description || a.type)).join(' '));
    if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; console.log('[EXCEPTION]', d.exception && d.exception.description || d.text, d.url, d.lineNumber); }
    if (m.method === 'Log.entryAdded' && m.params.entry.level !== 'verbose') console.log('[log.' + m.params.entry.level + ']', m.params.entry.text);
  };
  console.log('[harness] ws open');
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  console.log('[harness] domains enabled');
  try { const w = await send('Browser.getWindowForTarget', {}); if (w && w.windowId) await send('Browser.setWindowBounds', { windowId: w.windowId, bounds: { width: 1100, height: 700 } }); } catch (e) { }
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 700, deviceScaleFactor: 1, mobile: false });
  let nav = await send('Page.navigate', { url });
  for (let tries = 0; tries < 3 && nav && nav.errorText; tries++) { console.log('[harness] navigate failed (' + nav.errorText + '), retrying'); await sleep(1500); nav = await send('Page.navigate', { url }); }
  console.log('[harness] navigated', JSON.stringify(nav));
  const shots = (shotsArg || '').split(',').filter(Boolean).map(s => { const [t, f] = s.split(':'); return { t: parseFloat(t), f }; });
  const keys = (keysArg || '').split(',').filter(Boolean).map(s => { const [t, code, act] = s.split(':'); return { t: parseFloat(t), code, act }; });
  const t0 = Date.now();
  const events = [...shots.map(s => ({ ...s, kind: 'shot' })), ...keys.map(k => ({ ...k, kind: 'key' }))].sort((a, b) => a.t - b.t);
  async function key(code, type) {
    const [key, vk] = KEYS[code] || [code, 0];
    const mods = code.startsWith('Shift') ? 8 : 0;
    await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods, text: type === 'keyDown' && key.length === 1 ? key : undefined });
  }
  for (const e of events) {
    const wait = e.t * 1000 - (Date.now() - t0); if (wait > 0) await sleep(wait);
    if (e.kind === 'shot') { console.log('[shot] begin', e.f); const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1100, height: 700, scale: 1 } }); console.log('[shot] captured', r && r.data ? r.data.length : JSON.stringify(r)); if (r && r.data) { fs.writeFileSync(e.f, Buffer.from(r.data, 'base64')); console.log('[shot]', e.f, 'at', ((Date.now() - t0) / 1000).toFixed(1) + 's'); } else console.log('[shot failed]', JSON.stringify(r)); }
    else { if (e.act === 'press') { await key(e.code, 'keyDown'); await sleep(60); await key(e.code, 'keyUp'); } else await key(e.code, e.act === 'down' ? 'keyDown' : 'keyUp'); console.log('[key]', e.code, e.act, 'at', ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  }
  const rem = dur * 1000 - (Date.now() - t0); if (rem > 0) await sleep(rem);
  if (evalArg) { const r = await send('Runtime.evaluate', { expression: evalArg, returnByValue: true, awaitPromise: true }); console.log('[eval]', JSON.stringify(r && r.result && r.result.value)); }
  if (process.env.SHOT_AFTER) { await sleep(parseInt(process.env.SHOT_AFTER_MS || '600', 10)); const r2 = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1100, height: 700, scale: 1 } }); if (r2 && r2.data) { fs.writeFileSync(process.env.SHOT_AFTER, Buffer.from(r2.data, 'base64')); console.log('[shot-after]', process.env.SHOT_AFTER); } }
  const err = await send('Runtime.evaluate', { expression: "document.getElementById('err') ? document.getElementById('err').textContent : ''", returnByValue: true });
  if (err && err.result && err.result.value) console.log('[#err]', err.result.value);
  ws.close(); chrome.kill('SIGKILL');
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { }
  process.exit(0);
})().catch(e => { console.log('harness error', e); chrome.kill('SIGKILL'); process.exit(1); });
