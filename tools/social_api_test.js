// Friends / presence API test:  node tools/social_api_test.js [http://127.0.0.1:8787]
// Registers two throw-away users, sends / accepts / declines requests, checks presence and auth failures.
const BASE = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const ORIGIN = 'http://127.0.0.1:8765';
let pass = 0, fail = 0;
function check(name, ok, extra) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (ok) pass++; else fail++; }
async function api(method, path, body, auth) {
  const h = { 'content-type': 'application/json', origin: ORIGIN };
  if (auth) h.authorization = 'Bearer ' + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch (e) { }
  return { status: r.status, j };
}
(async () => {
  const sfx = Math.random().toString(36).slice(2, 7);
  const A = 'fa_' + sfx, B = 'fb_' + sfx, C = 'fc_' + sfx;
  let r = await api('POST', '/api/register', { user: A, pass: 'hunter22' }); const tA = A + ':' + r.j.token;
  r = await api('POST', '/api/register', { user: B, pass: 'hunter22' }); const tB = B + ':' + r.j.token;
  r = await api('POST', '/api/register', { user: C, pass: 'hunter22' }); const tC = C + ':' + r.j.token;
  check('register 3 users', !!(tA && tB && tC));

  r = await api('GET', '/api/friends', null, null);
  check('friends needs auth', r.status === 401);
  r = await api('GET', '/api/friends', null, A + ':' + 'f'.repeat(48));
  check('friends bad token', r.status === 401);
  r = await api('GET', '/api/friends', null, tA);
  check('empty list', r.status === 200 && r.j.friends.length === 0 && r.j.incoming.length === 0 && r.j.outgoing.length === 0, JSON.stringify(r.j));

  r = await api('POST', '/api/friends/request', { to: A }, tA);
  check('request self refused', r.status === 400 && r.j.error === 'self');
  r = await api('POST', '/api/friends/request', { to: 'nobody_' + sfx }, tA);
  check('request unknown user', r.status === 404 && r.j.error === 'no-user');
  r = await api('POST', '/api/friends/request', { to: 'x' }, tA);
  check('request bad name', r.status === 400 && r.j.error === 'bad-user');

  r = await api('POST', '/api/friends/request', { to: B.toUpperCase() }, tA);
  check('A -> B request (case-insensitive)', r.status === 200 && r.j.status === 'sent' && r.j.outgoing.length === 1 && r.j.outgoing[0].user === B, JSON.stringify(r.j));
  r = await api('POST', '/api/friends/request', { to: B }, tA);
  check('duplicate request is idempotent', r.status === 200 && r.j.outgoing.length === 1);
  r = await api('GET', '/api/friends', null, tB);
  check('B sees incoming from A', r.status === 200 && r.j.incoming.length === 1 && r.j.incoming[0].user === A && r.j.pending === 1, JSON.stringify(r.j));
  r = await api('POST', '/api/friends/accept', { from: C }, tB);
  check('accept without request', r.status === 404 && r.j.error === 'no-request');
  r = await api('POST', '/api/friends/accept', { from: A }, tB);
  check('B accepts A', r.status === 200 && r.j.status === 'friends' && r.j.friends.length === 1 && r.j.friends[0].user === A && r.j.incoming.length === 0, JSON.stringify(r.j));
  r = await api('GET', '/api/friends', null, tA);
  check('A has B, no outgoing left', r.j.friends.length === 1 && r.j.friends[0].user === B && r.j.outgoing.length === 0);
  check('B offline before any heartbeat', r.j.friends[0].online === false && r.j.friends[0].state === '');

  // presence: B in a lobby -> A sees the room code
  r = await api('POST', '/api/presence', { state: 'lobby', room: 'ab12', host: true }, tB);
  check('B heartbeat returns list', r.status === 200 && r.j.friends.length === 1);
  r = await api('POST', '/api/presence', { state: 'menu' }, tA);
  const fb = r.j.friends[0];
  check('A sees B online in lobby with room', fb.online === true && fb.state === 'lobby' && fb.room === 'AB12' && fb.host === true && r.j.onlineCount === 1, JSON.stringify(fb));
  r = await api('POST', '/api/presence', { state: 'racing', room: 'zzzz' }, tB);
  r = await api('GET', '/api/friends', null, tA);
  check('state update', r.j.friends[0].state === 'racing' && r.j.friends[0].room === 'ZZZZ');
  r = await api('GET', '/api/friends', null, tB);
  check('B sees A online (menu)', r.j.friends[0].online === true && r.j.friends[0].state === 'menu');
  r = await api('GET', '/api/friends', null, tC);
  check('C sees nobody', r.j.friends.length === 0);

  // reverse request auto-accepts
  r = await api('POST', '/api/friends/request', { to: A }, tC);
  r = await api('POST', '/api/friends/request', { to: C }, tA);
  check('reverse request auto-accepts', r.status === 200 && r.j.status === 'friends' && r.j.friends.some((f) => f.user === C) && r.j.incoming.length === 0, JSON.stringify(r.j));
  r = await api('GET', '/api/friends', null, tC);
  check('C has A', r.j.friends.length === 1 && r.j.friends[0].user === A && r.j.outgoing.length === 0);
  // decline
  r = await api('POST', '/api/friends/request', { to: B }, tC);
  r = await api('POST', '/api/friends/decline', { from: C }, tB);
  check('B declines C', r.status === 200 && r.j.incoming.length === 0);
  r = await api('GET', '/api/friends', null, tC);
  check('C outgoing cleared after decline', r.j.outgoing.length === 0 && r.j.friends.length === 1);
  // cancel own request via decline
  r = await api('POST', '/api/friends/request', { to: B }, tC);
  r = await api('POST', '/api/friends/decline', { from: B }, tC);
  r = await api('GET', '/api/friends', null, tB);
  check('sender cancels request', r.j.incoming.length === 0);
  // remove
  r = await api('POST', '/api/friends/remove', { user: B }, tA);
  check('A removes B', r.status === 200 && r.j.friends.length === 1 && r.j.friends[0].user === C);
  r = await api('GET', '/api/friends', null, tB);
  check('B no longer has A', r.j.friends.length === 0);
  // already friends -> status friends
  r = await api('POST', '/api/friends/request', { to: C }, tA);
  check('request to existing friend', r.status === 200 && r.j.status === 'friends');
  // logout kills social access
  await api('POST', '/api/logout', null, tC);
  r = await api('GET', '/api/friends', null, tC);
  check('token dead after logout', r.status === 401);
  // rate limit on requests
  let last = 0;
  for (let i = 0; i < 12; i++) { const x = await api('POST', '/api/friends/request', { to: B }, tA); last = x.status; }
  check('request rate limit', last === 429, 'last=' + last);
  console.log((fail ? 'SOME FAILED' : 'ALL PASS') + ' (' + pass + '/' + (pass + fail) + ')');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e); process.exit(1); });
