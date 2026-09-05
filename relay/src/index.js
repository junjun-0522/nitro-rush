/* ============================================================
   NITRO RUSH relay — Cloudflare Worker + Durable Object
   One Durable Object per room code. Star topology: the host's
   socket talks to every peer socket through this object, so no
   player ever needs an inbound connection (works behind any NAT).

   Wire protocol (text frames):
     server -> host : "!ok|CODE"  "!open|PID"  "!close|PID"  "PID|<json>"
     host   -> server: "B|<json>" (all peers)  "X|PID|<json>" (all but PID)
                       "U|PID|<json>" (one peer)  "K|PID" (kick)
     peer   -> server: "<json>"           server -> peer: "!ok|CODE"  "!bye|why"  "<json>"
     keepalive       : "~ping" -> "~pong" (auto-answered, not billed)
   Close codes: 4404 no such room, 4409 code taken, 4013 room full,
                4000 host left, 4001 kicked
   /api/*  : account + cloud save endpoints (see account.js), friends + presence (social.js)
   ============================================================ */

import { Account, handleApi } from './account.js';
import { Social } from './social.js';
export { Account, Social };

const MAX_SOCKETS = 16;          // app-level limit is 8 players; keep headroom for retries
const MAX_MSG = 64 * 1024;       // bytes
const RATE_PER_SEC = 120;        // per socket; the game sends ~20/s

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('nitro-rush relay ok\n', { headers: { 'content-type': 'text/plain', 'access-control-allow-origin': '*' } });
    }
    if (url.pathname.startsWith('/api/')) return handleApi(req, env);
    const m = /^\/r\/([A-Za-z0-9]{4,8})$/.exec(url.pathname);
    if (!m) return new Response('not found', { status: 404 });
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('expected websocket', { status: 426 });
    const origin = req.headers.get('Origin');
    if (origin && env.ALLOWED_ORIGINS) {
      const ok = env.ALLOWED_ORIGINS.split(',').some((o) => o.trim() === origin);
      if (!ok) return new Response('forbidden origin', { status: 403 });
    }
    const code = m[1].toUpperCase();
    const id = env.ROOM.idFromName(code);
    return env.ROOM.get(id, { locationHint: 'apac' }).fetch(req);
  }
};

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    this.meta = new WeakMap();
    try { this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('~ping', '~pong')); } catch (e) { }
  }
  info(ws) {
    let m = this.meta.get(ws);
    if (!m) { m = ws.deserializeAttachment() || {}; m.n = 0; m.t = 0; this.meta.set(ws, m); }
    return m;
  }
  hostSock() {
    const hs = this.ctx.getWebSockets('host');
    for (const h of hs) if (h.readyState === 1) return h;
    return null;
  }
  static send(ws, s) { try { ws.send(s); } catch (e) { } }

  async fetch(req) {
    const url = new URL(req.url);
    const role = url.searchParams.get('role') === 'host' ? 'host' : 'peer';
    const code = (url.pathname.split('/').pop() || '').toUpperCase();
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    const refuse = (c, why) => { server.accept(); server.close(c, why); return new Response(null, { status: 101, webSocket: client }); };
    const host = this.hostSock();
    if (role === 'host') {
      if (host) return refuse(4409, 'taken');
      server.serializeAttachment({ role: 'host', code });
      this.ctx.acceptWebSocket(server, ['host']);
      Room.send(server, '!ok|' + code);
    } else {
      if (!host) return refuse(4404, 'noroom');
      const peers = this.ctx.getWebSockets('peer');
      if (peers.length >= MAX_SOCKETS) return refuse(4013, 'full');
      const used = new Set(peers.map((p) => this.info(p).pid));
      let pid;
      do { pid = Math.random().toString(36).slice(2, 6); } while (pid.length < 4 || used.has(pid));
      server.serializeAttachment({ role: 'peer', pid, code });
      this.ctx.acceptWebSocket(server, ['peer', 'p:' + pid]);
      Room.send(server, '!ok|' + code);
      Room.send(host, '!open|' + pid);
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MAX_MSG) return;
    const m = this.info(ws);
    const now = Date.now();
    if (now - m.t > 1000) { m.t = now; m.n = 0; }
    if (++m.n > RATE_PER_SEC) return;
    if (msg === '~ping') { Room.send(ws, '~pong'); return; }
    if (m.role === 'host') {
      const k = msg.charCodeAt(0);
      if (k === 66) {                                   // B|json
        const body = msg.slice(2);
        for (const p of this.ctx.getWebSockets('peer')) Room.send(p, body);
      } else if (k === 85 || k === 88) {                // U|pid|json  X|pid|json
        const j = msg.indexOf('|', 2); if (j < 0) return;
        const pid = msg.slice(2, j), body = msg.slice(j + 1);
        if (k === 85) { const t = this.ctx.getWebSockets('p:' + pid)[0]; if (t) Room.send(t, body); }
        else for (const p of this.ctx.getWebSockets('peer')) { if (this.info(p).pid !== pid) Room.send(p, body); }
      } else if (k === 75) {                            // K|pid
        const t = this.ctx.getWebSockets('p:' + msg.slice(2))[0];
        if (t) { Room.send(t, '!bye|kicked'); try { t.close(4001, 'kicked'); } catch (e) { } }
      }
    } else {
      const h = this.hostSock();
      if (h) Room.send(h, m.pid + '|' + msg);
    }
  }
  webSocketClose(ws) { this.gone(ws); }
  webSocketError(ws) { this.gone(ws); }
  gone(ws) {
    const m = this.info(ws);
    if (m.role === 'host') {
      for (const p of this.ctx.getWebSockets('peer')) { Room.send(p, '!bye|hostleft'); try { p.close(4000, 'hostleft'); } catch (e) { } }
    } else if (m.pid) {
      const h = this.hostSock();
      if (h) Room.send(h, '!close|' + m.pid);
    }
    try { ws.close(); } catch (e) { }
  }
}
