// Account API test:  node tools/account_api_test.js [http://127.0.0.1:8787]
// Registers a throw-away user, logs in, saves/merges a profile, checks auth failures.
const BASE = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const ORIGIN = 'http://127.0.0.1:8765';
let pass = 0, fail = 0;
function check(name, ok, extra) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (ok) pass++; else fail++; }
async function api(method, path, body, auth) {
  const h = { 'content-type': 'application/json', origin: ORIGIN };
  if (auth) h.authorization = 'Bearer ' + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch (e) { }
  return { status: r.status, j, cors: r.headers.get('access-control-allow-origin') };
}
(async () => {
  const user = 'test_' + Math.random().toString(36).slice(2, 8);
  const prof = { xp: 500, races: 3, wins: 1, unlocked: ['classic', 'midnight'], skin: 'midnight', records: { coast: { mixed: { lap: 51000, race: 160000 } } }, updatedAt: 1000 };

  let r = await api('OPTIONS', '/api/login');
  check('preflight', r.status === 204 && r.cors === ORIGIN, r.status + ' ' + r.cors);
  r = await api('POST', '/api/register', { user: 'x', pass: 'abcd' });
  check('register bad user', r.status === 400 && r.j.error === 'bad-user');
  r = await api('POST', '/api/register', { user, pass: '123' });
  check('register bad pass', r.status === 400 && r.j.error === 'bad-pass');
  r = await api('POST', '/api/register', { user, pass: 'hunter22', profile: prof });
  check('register ok', r.status === 200 && r.j.token && r.j.user === user && r.j.profile.xp === 500 && r.j.profile.skin === 'midnight', JSON.stringify(r.j).slice(0, 120));
  const tok1 = user + ':' + r.j.token;
  r = await api('POST', '/api/register', { user: user.toUpperCase(), pass: 'other' });
  check('register duplicate (case-insensitive)', r.status === 409 && r.j.error === 'taken');
  r = await api('POST', '/api/login', { user, pass: 'wrong' });
  check('login wrong pass', r.status === 401 && r.j.error === 'wrong-pass');
  r = await api('POST', '/api/login', { user: 'nb_' + user.slice(5), pass: 'hunter22' });
  check('login no user', r.status === 404 && r.j.error === 'no-user');
  // login from a "second device" with a different local profile -> merged
  const prof2 = { xp: 300, races: 5, wins: 0, unlocked: ['classic', 'lime'], skin: 'lime', records: { coast: { mixed: { lap: 49000, race: 170000 } }, neon: { speed: { lap: 60000 } } }, updatedAt: 2000 };
  r = await api('POST', '/api/login', { user, pass: 'hunter22', profile: prof2 });
  const p = r.j && r.j.profile;
  check('login ok + merge', r.status === 200 && p && p.xp === 500 && p.races === 5 && p.wins === 1, p && JSON.stringify(p).slice(0, 200));
  check('merge unlocks union', p && p.unlocked.includes('midnight') && p.unlocked.includes('lime') && p.unlocked.includes('classic'));
  check('merge records min', p && p.records.coast.mixed.lap === 49000 && p.records.coast.mixed.race === 160000 && p.records.neon.speed.lap === 60000);
  check('merge skin newest', p && p.skin === 'lime');
  const tok2 = user + ':' + r.j.token;
  r = await api('GET', '/api/profile', null, tok1);
  check('old token still valid?', r.status === 401, 'expected 401 (new login rotates token) got ' + r.status);
  r = await api('GET', '/api/profile', null, tok2);
  check('get profile', r.status === 200 && r.j.profile.xp === 500);
  r = await api('PUT', '/api/profile', { profile: { xp: 900, races: 6, unlocked: ['classic', 'carbon'], skin: 'carbon', updatedAt: 3000 } }, tok2);
  check('put profile merges', r.status === 200 && r.j.profile.xp === 900 && r.j.profile.races === 6 && r.j.profile.skin === 'carbon' && r.j.profile.unlocked.includes('lime'));
  r = await api('PUT', '/api/profile', { profile: { xp: 'nope', unlocked: 'bad', skin: 'gold', records: { coast: { mixed: { lap: -5 } } } } }, tok2);
  check('put garbage sanitized', r.status === 200 && r.j.profile.xp === 900 && r.j.profile.skin === 'carbon' && r.j.profile.records.coast.mixed.lap === 49000, JSON.stringify(r.j.profile).slice(0, 160));
  r = await api('PUT', '/api/profile', { profile: { pad: 'x'.repeat(40000) } }, tok2);
  check('put too big', r.status === 413);
  r = await api('GET', '/api/profile', null, user + ':' + 'f'.repeat(48));
  check('bad token', r.status === 401);
  r = await api('GET', '/api/profile', null, null);
  check('no auth', r.status === 401);
  r = await api('POST', '/api/logout', null, tok2);
  check('logout', r.status === 200 && r.j.ok);
  r = await api('GET', '/api/profile', null, tok2);
  check('token dead after logout', r.status === 401);
  r = await api('POST', '/api/login', { user, pass: 'hunter22' });
  check('login again keeps profile', r.status === 200 && r.j.profile.xp === 900 && r.j.profile.records.neon.speed.lap === 60000);
  const rf = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}' });
  check('foreign origin refused', rf.status === 403);
  // rate limit: 12 wrong passwords -> 429
  let last = 0;
  for (let i = 0; i < 13; i++) { const x = await api('POST', '/api/login', { user, pass: 'wrong' + i }); last = x.status; }
  check('brute force rate limit', last === 429, 'last=' + last);
  console.log((fail ? 'SOME FAILED' : 'ALL PASS') + ' (' + pass + '/' + (pass + fail) + ')');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e); process.exit(1); });
