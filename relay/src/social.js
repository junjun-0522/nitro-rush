/* ============================================================
   NITRO RUSH friends + presence — one shared Durable Object.
   Friendships, pending requests and "last seen" live here so that
   accepting a request updates both sides atomically.
   Storage keys (all usernames lower-cased):
     name:<u>  display name        f:<u>   [friends]
     in:<u>    [incoming requests] out:<u> [outgoing requests]
     pres:<u>  { t, state, room, host }   rl:<u> request rate limit
   Routes (all need "Authorization: Bearer user:token", verified by the
   caller's Account object first — see account.js handleApi):
     GET  /api/friends                    -> list
     POST /api/presence {state,room,host} -> heartbeat + list
     POST /api/friends/request {to}       -> send (auto-accepts a reverse request)
     POST /api/friends/accept  {from}
     POST /api/friends/decline {from}
     POST /api/friends/remove  {user}
   ============================================================ */

const MAX_FRIENDS = 50, MAX_PENDING = 30, ONLINE_MS = 100000;
const JSONH = { 'content-type': 'application/json' };
const USER_RE = /^[\p{L}\p{N}_]{2,16}$/u;

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'content-type': 'application/json', ...(extra || {}) } });
}

/** Worker-level: validate, check the target account exists, forward to the shared object */
export async function handleSocial(env, cors, ctx) {
  const { user, name, path, method, body } = ctx;
  let op;
  if (path === '/friends' && method === 'GET') op = 'list';
  else if (path === '/presence' && method === 'POST') op = 'presence';
  else if (path.startsWith('/friends/') && method === 'POST') op = path.slice(9);
  else return json({ error: 'not-found' }, 404, cors);
  if (!['list', 'presence', 'request', 'accept', 'decline', 'remove'].includes(op)) return json({ error: 'not-found' }, 404, cors);
  const payload = { op, user, name, state: String(body.state || 'menu').slice(0, 16), room: String(body.room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8), host: !!body.host };
  if (op !== 'list' && op !== 'presence') {
    const other = String(body.to || body.from || body.user || '').normalize('NFC').trim();
    if (!USER_RE.test(other)) return json({ error: 'bad-user' }, 400, cors);
    if (other.toLowerCase() === user) return json({ error: 'self' }, 400, cors);
    payload.other = other.toLowerCase(); payload.otherName = other;
    if (op === 'request') {
      const id = env.ACCOUNT.idFromName(payload.other);
      const e = await (await env.ACCOUNT.get(id).fetch('https://account/exists', { method: 'POST', body: JSON.stringify({ op: 'exists' }), headers: JSONH })).json();
      if (!e.exists) return json({ error: 'no-user' }, 404, cors);
      payload.otherName = e.user || other;
    }
  }
  const res = await env.SOCIAL.get(env.SOCIAL.idFromName('global')).fetch('https://social/' + op, { method: 'POST', body: JSON.stringify(payload), headers: JSONH });
  const out = new Response(res.body, res);
  for (const k in cors) out.headers.set(k, cors[k]);
  return out;
}

export class Social {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  async fetch(req) {
    const b = await req.json(), st = this.ctx.storage, me = b.user, now = Date.now();
    const get = async (k, d) => { const v = await st.get(k); return v === undefined ? d : v; };
    const without = (arr, x) => arr.filter((y) => y !== x);
    if (b.name) await st.put('name:' + me, b.name);
    if (b.op === 'presence') await st.put('pres:' + me, { t: now, state: b.state, room: b.room, host: b.host });
    const other = b.other;
    if (b.op === 'request') {
      // 10 requests / 10 minutes per user
      let rl = await get('rl:' + me, { n: 0, t: now });
      if (now - rl.t > 600000) rl = { n: 0, t: now };
      if (++rl.n > 10) return json({ error: 'rate' }, 429);
      await st.put('rl:' + me, rl);
      const friends = await get('f:' + me, []);
      if (friends.includes(other)) return this.list(me, { status: 'friends' });
      if (friends.length >= MAX_FRIENDS) return json({ error: 'too-many' }, 400);
      if (b.otherName) await st.put('name:' + other, b.otherName);
      const myIn = await get('in:' + me, []);
      if (myIn.includes(other)) { await this.befriend(me, other); return this.list(me, { status: 'friends' }); }   // they asked first
      const theirIn = await get('in:' + other, []);
      if (!theirIn.includes(me)) {
        if (theirIn.length >= MAX_PENDING) return json({ error: 'too-many' }, 400);
        theirIn.push(me); await st.put('in:' + other, theirIn);
      }
      const myOut = await get('out:' + me, []);
      if (!myOut.includes(other)) { myOut.push(other); await st.put('out:' + me, myOut); }
      return this.list(me, { status: 'sent' });
    }
    if (b.op === 'accept') {
      const myIn = await get('in:' + me, []);
      if (!myIn.includes(other)) return json({ error: 'no-request' }, 404);
      if ((await get('f:' + me, [])).length >= MAX_FRIENDS) return json({ error: 'too-many' }, 400);
      await this.befriend(me, other);
      return this.list(me, { status: 'friends' });
    }
    if (b.op === 'decline') {
      await st.put('in:' + me, without(await get('in:' + me, []), other));
      await st.put('out:' + other, without(await get('out:' + other, []), me));
      // also lets a sender cancel their own request
      await st.put('out:' + me, without(await get('out:' + me, []), other));
      await st.put('in:' + other, without(await get('in:' + other, []), me));
      return this.list(me, { status: 'declined' });
    }
    if (b.op === 'remove') {
      await st.put('f:' + me, without(await get('f:' + me, []), other));
      await st.put('f:' + other, without(await get('f:' + other, []), me));
      return this.list(me, { status: 'removed' });
    }
    return this.list(me, {});
  }

  async befriend(a, b) {
    const st = this.ctx.storage;
    const get = async (k) => (await st.get(k)) || [];
    const without = (arr, x) => arr.filter((y) => y !== x);
    const fa = await get('f:' + a), fb = await get('f:' + b);
    if (!fa.includes(b)) fa.push(b); if (!fb.includes(a)) fb.push(a);
    await st.put({ ['f:' + a]: fa, ['f:' + b]: fb,
      ['in:' + a]: without(await get('in:' + a), b), ['in:' + b]: without(await get('in:' + b), a),
      ['out:' + a]: without(await get('out:' + a), b), ['out:' + b]: without(await get('out:' + b), a) });
  }

  async list(me, extra) {
    const st = this.ctx.storage, now = Date.now();
    const get = async (k, d) => { const v = await st.get(k); return v === undefined ? d : v; };
    const friends = await get('f:' + me, []), inc = await get('in:' + me, []), out = await get('out:' + me, []);
    const keys = [];
    friends.forEach((u) => keys.push('pres:' + u, 'name:' + u));
    inc.concat(out).forEach((u) => keys.push('name:' + u));
    const m = keys.length ? await st.get(keys.slice(0, 128)) : new Map();
    const rows = friends.map((u) => {
      const p = m.get('pres:' + u), online = !!p && now - p.t < ONLINE_MS;
      return { user: u, name: m.get('name:' + u) || u, online, state: online ? (p.state || 'menu') : '', room: online && p.room ? p.room : '', host: !!(online && p.host), seen: p ? p.t : 0 };
    });
    rows.sort((x, y) => (y.online - x.online) || (y.seen - x.seen) || x.name.localeCompare(y.name));
    const named = (u) => ({ user: u, name: m.get('name:' + u) || u });
    return json({ ok: true, ...extra, friends: rows, incoming: inc.map(named), outgoing: out.map(named), onlineCount: rows.filter((r) => r.online).length, pending: inc.length, now });
  }
}
