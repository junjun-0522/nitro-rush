// relay protocol test: node tools/relay_proto_test.js ws://127.0.0.1:8787   (or wss://nitro-rush-relay.nitro-rush-relay.workers.dev)
const BASE = process.argv[2] || 'ws://127.0.0.1:8787';
const ORIGIN = 'http://127.0.0.1:8765';
let fails = 0;
function ok(cond, name) { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) fails++; }
function open(code, role, origin) {
  const ws = new WebSocket(`${BASE}/r/${code}?role=${role}`, origin === undefined ? { headers: { Origin: ORIGIN } } : (origin ? { headers: { Origin: origin } } : undefined));
  const q = []; const waiters = [];
  ws.addEventListener('message', (e) => { const w = waiters.shift(); if (w) w(e.data); else q.push(e.data); });
  let closed = null; const closeWaiters = [];
  ws.addEventListener('close', (e) => { closed = { code: e.code, reason: e.reason }; closeWaiters.splice(0).forEach((w) => w(closed)); });
  ws.addEventListener('error', () => { });
  return {
    ws,
    next: (ms = 3000) => new Promise((res) => { if (q.length) return res(q.shift()); const t = setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) waiters.splice(i, 1); res(null); }, ms); const w = (d) => { clearTimeout(t); res(d); }; waiters.push(w); }),
    closeInfo: (ms = 15000) => new Promise((res) => { if (closed) return res(closed); const t = setTimeout(() => res(null), ms); closeWaiters.push((c) => { clearTimeout(t); res(c); }); }),
    send: (s) => ws.send(s), close: () => ws.close(),
  };
}
(async () => {
  const CODE = 'T' + Math.random().toString(36).slice(2, 5).toUpperCase();
  const host = open(CODE, 'host');
  ok((await host.next()) === '!ok|' + CODE, 'host gets !ok');
  const host2 = open(CODE, 'host');
  const c2 = await host2.closeInfo();
  ok(c2 && c2.code === 4409, 'second host on same code refused 4409 (' + JSON.stringify(c2) + ')');
  const ghost = open('ZZZZ', 'join');
  const cg = await ghost.closeInfo();
  ok(cg && cg.code === 4404, 'join unknown room refused 4404 (' + JSON.stringify(cg) + ')');
  const peer = open(CODE, 'join');
  ok((await peer.next()) === '!ok|' + CODE, 'peer gets !ok');
  const op = await host.next();
  ok(/^!open\|[a-z0-9]{4}$/.test(op || ''), 'host gets !open|pid (' + op + ')');
  const pid = (op || '').split('|')[1];
  peer.send('{"t":"hello","name":"B"}');
  ok((await host.next()) === pid + '|{"t":"hello","name":"B"}', 'peer->host framed with pid');
  host.send('U|' + pid + '|{"t":"welcome","id":1}');
  ok((await peer.next()) === '{"t":"welcome","id":1}', 'unicast U reaches peer');
  host.send('B|{"t":"lobby"}');
  ok((await peer.next()) === '{"t":"lobby"}', 'broadcast B reaches peer');
  host.send('X|' + pid + '|{"t":"skip"}');
  ok((await peer.next(700)) === null, 'broadcast-except X skips that peer');
  const peer2 = open(CODE, 'join');
  ok((await peer2.next()) === '!ok|' + CODE, 'second peer gets !ok');
  const op2 = await host.next(); const pid2 = (op2 || '').split('|')[1];
  host.send('X|' + pid + '|{"t":"only2"}');
  ok((await peer2.next()) === '{"t":"only2"}', 'X delivers to the other peer');
  peer.send('~ping');
  ok((await peer.next()) === '~pong', 'keepalive ~ping answered');
  host.send('K|' + pid2);
  const ck = await peer2.closeInfo();
  ok(ck && ck.code === 4001, 'kick closes peer2 with 4001 (' + JSON.stringify(ck) + ')');
  ok((await host.next()) === '!close|' + pid2, 'host notified !close for kicked peer');
  peer.close();
  ok((await host.next()) === '!close|' + pid, 'host notified !close when peer leaves');
  const peer3 = open(CODE, 'join'); await peer3.next(); await host.next();
  host.close();
  const c3 = await peer3.closeInfo();
  ok(c3 && c3.code === 4000, 'host leaving closes peers with 4000 (' + JSON.stringify(c3) + ')');
  const host3 = open(CODE, 'host');
  ok((await host3.next()) === '!ok|' + CODE, 'code reusable after host left');
  host3.close();
  const bad = open(CODE, 'host', 'https://evil.example');
  const cb = await bad.closeInfo();
  ok(cb && cb.code !== 4409 && cb.code !== 1000, 'foreign origin refused (' + JSON.stringify(cb) + ')');
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('ERROR', e); process.exit(2); });
