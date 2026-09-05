/* ============================================================
   NITRO RUSH accounts — one Durable Object per username.
   Stores: auth {salt, hash, iter}, token, profile, created, attempts.
   Passwords are PBKDF2-SHA256 (100k) hashed; tokens are random and
   compared in constant time. The profile is merged (counters max,
   records min, unlocks union) so several devices never clobber each other.
   ============================================================ */

const enc = new TextEncoder();
const PBKDF2_ITER = 100000;
const MAX_PROFILE = 32 * 1024;
const USER_RE = /^[\p{L}\p{N}_]{2,16}$/u;

function hex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function randHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
async function pbkdf2(pass, saltHex, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256));
}
function safeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'content-type': 'application/json', ...(extra || {}) } });
}

// ---- profile merge (mirror of Progress.merge in js/progress.js) ----
const NUM = ['xp', 'races', 'finishes', 'wins', 'podiums', 'online', 'maxDrifts', 'laps'];
function num(v) { return (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : 0; }
function sanitize(p) {
  p = (p && typeof p === 'object') ? p : {};
  const out = { v: 1 };
  for (const k of NUM) out[k] = num(p[k]);
  for (const k of ['trackWins', 'trackPodiums']) {
    out[k] = {};
    if (p[k] && typeof p[k] === 'object') for (const t of Object.keys(p[k]).slice(0, 64)) out[k][String(t).slice(0, 32)] = num(p[k][t]);
  }
  out.records = {};
  if (p.records && typeof p.records === 'object') {
    for (const t of Object.keys(p.records).slice(0, 64)) {
      const modes = p.records[t]; if (!modes || typeof modes !== 'object') continue;
      out.records[String(t).slice(0, 32)] = {};
      for (const m of Object.keys(modes).slice(0, 8)) {
        const r = modes[m] || {}, o = {};
        if (typeof r.lap === 'number' && r.lap > 0) o.lap = r.lap;
        if (typeof r.race === 'number' && r.race > 0) { o.race = r.race; if (typeof r.date === 'number') o.date = r.date; }
        out.records[String(t).slice(0, 32)][String(m).slice(0, 16)] = o;
      }
    }
  }
  out.unlocked = Array.isArray(p.unlocked) ? [...new Set(p.unlocked.filter((s) => typeof s === 'string').map((s) => s.slice(0, 32)))].slice(0, 128) : ['classic'];
  if (!out.unlocked.includes('classic')) out.unlocked.unshift('classic');
  out.skin = typeof p.skin === 'string' && out.unlocked.includes(p.skin) ? p.skin.slice(0, 32) : 'classic';
  out.updatedAt = num(p.updatedAt);
  return out;
}
function merge(a, b) {
  a = sanitize(a); b = sanitize(b);
  const out = { v: 1, trackWins: {}, trackPodiums: {}, records: {} };
  for (const k of NUM) out[k] = Math.max(a[k], b[k]);
  for (const k of ['trackWins', 'trackPodiums']) for (const t of new Set([...Object.keys(a[k]), ...Object.keys(b[k])])) out[k][t] = Math.max(a[k][t] || 0, b[k][t] || 0);
  for (const t of new Set([...Object.keys(a.records), ...Object.keys(b.records)])) {
    const ra = a.records[t] || {}, rb = b.records[t] || {}; out.records[t] = {};
    for (const m of new Set([...Object.keys(ra), ...Object.keys(rb)])) {
      const x = ra[m] || {}, y = rb[m] || {}, o = {};
      if (x.lap || y.lap) o.lap = Math.min(x.lap || 1e9, y.lap || 1e9);
      if (x.race || y.race) { o.race = Math.min(x.race || 1e9, y.race || 1e9); o.date = (x.race && x.race <= (y.race || 1e9)) ? x.date : y.date; }
      out.records[t][m] = o;
    }
  }
  out.unlocked = [...new Set([...a.unlocked, ...b.unlocked])];
  out.skin = b.updatedAt >= a.updatedAt ? b.skin : a.skin;
  if (!out.unlocked.includes(out.skin)) out.skin = 'classic';
  out.updatedAt = Math.max(a.updatedAt, b.updatedAt);
  return out;
}

// ---- Worker-level router ---------------------------------------------------
export function corsHeaders(req, env) {
  const origin = req.headers.get('Origin');
  const h = { 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-max-age': '86400', 'vary': 'Origin' };
  if (!origin) return h;
  const allowed = !env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.split(',').some((o) => o.trim() === origin);
  if (allowed) h['access-control-allow-origin'] = origin;
  return h;
}

export async function handleApi(req, env) {
  const url = new URL(req.url);
  const cors = corsHeaders(req, env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const origin = req.headers.get('Origin');
  if (origin && !cors['access-control-allow-origin']) return json({ error: 'forbidden-origin' }, 403, cors);
  const path = url.pathname.replace(/^\/api/, '');
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const text = await req.text();
    if (text.trim()) { try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad-json' }, 400, cors); } }
    if (!body || typeof body !== 'object') body = {};
  }
  let user = null;
  if (path === '/register' || path === '/login') {
    user = String(body.user || '').normalize('NFC').trim();
    if (!USER_RE.test(user)) return json({ error: 'bad-user' }, 400, cors);
    const pass = String(body.pass || '');
    if (pass.length < 4 || pass.length > 64) return json({ error: 'bad-pass' }, 400, cors);
  } else if (path === '/profile' || path === '/logout' || path === '/password') {
    const m = /^Bearer\s+(.+?):([0-9a-f]{48})$/.exec(req.headers.get('Authorization') || '');
    if (!m) return json({ error: 'unauthorized' }, 401, cors);
    user = m[1].normalize('NFC');
    if (!USER_RE.test(user)) return json({ error: 'unauthorized' }, 401, cors);
    body.token = m[2];
  } else return json({ error: 'not-found' }, 404, cors);
  if (path === '/password') {
    const np = String(body.newPass || '');
    if (np.length < 4 || np.length > 64) return json({ error: 'bad-pass' }, 400, cors);
  }
  body.user = user; body.op = path.slice(1); body.method = req.method;
  body.admin = !!(env.ADMIN_USERS && env.ADMIN_USERS.split(',').some((a) => a.trim().toLowerCase() === user.toLowerCase()));
  const id = env.ACCOUNT.idFromName(user.toLowerCase());
  const res = await env.ACCOUNT.get(id).fetch('https://account/' + body.op, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  const out = new Response(res.body, res);
  for (const k in cors) out.headers.set(k, cors[k]);
  return out;
}

// ---- Durable Object ----------------------------------------------------------
export class Account {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  async fetch(req) {
    const b = await req.json();
    const st = this.ctx.storage;
    const op = b.op;
    if (op === 'register' || op === 'login') {
      // brute-force guard: 12 attempts / 10 minutes per account
      const now = Date.now();
      let att = (await st.get('attempts')) || { n: 0, t: now };
      if (now - att.t > 600000) att = { n: 0, t: now };
      if (att.n >= 12) return json({ error: 'rate' }, 429);
      const auth = await st.get('auth');
      if (op === 'register') {
        if (auth) return json({ error: 'taken' }, 409);
        const salt = randHex(16);
        const hash = await pbkdf2(b.pass, salt, PBKDF2_ITER);
        await st.put('auth', { salt, hash, iter: PBKDF2_ITER });
        await st.put('created', now);
        await st.put('user', b.user);
      } else {
        if (!auth) return json({ error: 'no-user' }, 404);
        const hash = await pbkdf2(b.pass, auth.salt, auth.iter || PBKDF2_ITER);
        if (!safeEq(hash, auth.hash)) { att.n++; await st.put('attempts', att); return json({ error: 'wrong-pass' }, 401); }
      }
      await st.put('attempts', { n: 0, t: now });
      const token = randHex(24);
      await st.put('token', token);
      const profile = merge((await st.get('profile')) || {}, b.profile || {});
      await st.put('profile', profile);
      return json({ ok: true, user: (await st.get('user')) || b.user, token, profile, admin: !!b.admin });
    }
    // authenticated ops
    const token = await st.get('token');
    if (!token || !safeEq(token, b.token)) return json({ error: 'unauthorized' }, 401);
    if (op === 'logout') { await st.delete('token'); return json({ ok: true }); }
    if (op === 'password') {
      const auth = await st.get('auth');
      const hash = await pbkdf2(String(b.pass || ''), auth.salt, auth.iter || PBKDF2_ITER);
      if (!safeEq(hash, auth.hash)) return json({ error: 'wrong-pass' }, 401);
      const salt = randHex(16);
      await st.put('auth', { salt, hash: await pbkdf2(b.newPass, salt, PBKDF2_ITER), iter: PBKDF2_ITER });
      const token = randHex(24); await st.put('token', token);
      return json({ ok: true, token });
    }
    if (op === 'profile') {
      let profile = (await st.get('profile')) || {};
      if (b.method === 'PUT') {
        if (JSON.stringify(b.profile || {}).length > MAX_PROFILE) return json({ error: 'too-big' }, 413);
        profile = merge(profile, b.profile || {});
        await st.put('profile', profile);
      }
      return json({ ok: true, user: (await st.get('user')) || b.user, profile, admin: !!b.admin });
    }
    return json({ error: 'not-found' }, 404);
  }
}
