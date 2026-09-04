/* ============================================================
   NITRO RUSH - online layer (host-relayed star topology)
   transport A: WebSocket relay (relay/ — Cloudflare Worker), used when
                NITRO_CONFIG.relayUrl is set (or ?relay=ws://...). Works behind any NAT.
   transport B: PeerJS / WebRTC direct P2P, used when no relay is configured (or ?net=p2p).
   Both expose the same connection shape to the host logic: {open, send(), close(), on()}.
   ============================================================ */
(function (global) {
  'use strict';

  var PREFIX = 'nitro-rush-v1-';
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var MAX_PLAYERS = 8;
  var RELAY_TIMEOUT = 12000, P2P_TIMEOUT = 20000, KEEPALIVE = 25000;

  // ---------------------------------------------------------- transport selection
  /** relay base url; '' means PeerJS. ?relay=ws://host:port overrides, ?net=p2p forces PeerJS */
  function relayUrl() {
    var qs = (global.location && global.location.search) || '';
    var m = /[?&]relay=([^&]+)/.exec(qs);
    if (m) return decodeURIComponent(m[1]);
    if (/[?&]net=p2p(&|$)/.test(qs)) return '';
    return (global.NITRO_CONFIG && global.NITRO_CONFIG.relayUrl) || '';
  }
  function wsUrl(base, code, role) {
    base = String(base).replace(/\/+$/, '').replace(/^http/, 'ws');
    return base + '/r/' + code + '?role=' + role;
  }
  function closeReason(ev, opened) {
    switch (ev && ev.code) {
      case 4404: return 'noroom';
      case 4409: return 'taken';
      case 4013: return 'full';
      case 4000: case 4001: return 'closed';
      default: return opened ? 'closed' : 'server';
    }
  }
  function mkErr(type) { var e = new Error(type); e.type = type; return e; }

  function peerOpts() {
    var ice = global.NITRO_ICE || (global.NITRO_CONFIG && global.NITRO_CONFIG.stunServers) || [{ urls: 'stun:stun.l.google.com:19302' }];
    return { debug: 0, config: { iceServers: ice, sdpSemantics: 'unified-plan' } };
  }
  /** wait (briefly) for the TURN credential fetch so the first connection already uses the relay */
  function whenIceReady(fn) {
    if (global.NITRO_ICE || !global.NITRO_ICE_READY) { fn(); return; }
    var fired = false, go = function () { if (!fired) { fired = true; fn(); } };
    global.NITRO_ICE_READY.then(go, go); setTimeout(go, 4000);
  }

  /** virtual per-peer connection multiplexed over the relay socket (same shape as a PeerJS DataConnection) */
  function RelayConn(peerId, sendFn, closeFn) {
    this.peer = peerId; this.open = false; this._h = {}; this._send = sendFn; this._close = closeFn;
  }
  RelayConn.prototype.on = function (ev, fn) { this._h[ev] = fn; };
  RelayConn.prototype.send = function (msg) { if (this.open) this._send(msg); };
  RelayConn.prototype.close = function () { if (this.open) { this.open = false; this._close(); } };
  RelayConn.prototype._fire = function (ev, a) { var f = this._h[ev]; if (f) f(a); };

  function Net() {
    this.peer = null; this.conn = null; this.conns = {};
    this.ws = null; this.relay = false; this._rconns = {}; this._kaTimer = null;
    this.isHost = false; this.myId = null; this.players = {}; this.lobby = null;
    this.handlers = {}; this.offset = 0; this.rtt = 0; this.state = 'idle'; this.code = null;
    this._pingTimer = null; this._best = null;
  }

  Net.randomCode = function () {
    var s = '';
    for (var i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  };
  /** 'relay' | 'p2p' — which transport a new Net() will use */
  Net.transport = function () { return relayUrl() ? 'relay' : 'p2p'; };
  Net.prototype.on = function (ev, fn) { this.handlers[ev] = fn; return this; };
  Net.prototype._emit = function (ev, a, b) { var h = this.handlers[ev]; if (h) h(a, b); };
  /** host-based clock (ms) */
  Net.prototype.now = function () { return performance.now() + this.offset; };

  Net.prototype.playerList = function () {
    var self = this;
    return Object.keys(this.players).map(function (k) { var p = self.players[k]; return { id: p.id, name: p.name, char: p.char || 'volt', pet: p.pet || null, kart: p.kart || 'nitro' }; })
      .sort(function (a, b) { return a.id - b.id; });
  };

  // ------------------------------------------------------------ host
  Net.prototype.host = function (profile, cb, forcedCode) {
    var self = this;
    if (relayUrl()) { this._hostRelay(profile, cb, forcedCode, 0); return; }
    whenIceReady(function () { self._host(profile, cb, forcedCode); });
  };
  Net.prototype._setupHost = function (profile, code) {
    this.isHost = true; this.myId = 0; this.nextId = 1; this.code = code; this.state = 'lobby';
    this.players = { 0: { id: 0, name: profile.name, char: profile.char, pet: profile.pet, kart: profile.kart || 'nitro' } };
  };
  Net.prototype._host = function (profile, cb, forcedCode) {
    var self = this, code = forcedCode || Net.randomCode();
    this._setupHost(profile, code);
    var done = false;
    this._emit('stage', 'signaling');
    var peer = this.peer = new Peer(PREFIX + code.toLowerCase(), peerOpts());
    peer.on('open', function () { if (!done) { done = true; cb(null, code); } });
    peer.on('error', function (err) { if (!done) { done = true; cb(err); } else self._emit('error', err); });
    peer.on('connection', function (conn) { self._accept(conn); });
    peer.on('disconnected', function () { try { if (self.peer && !self.peer.destroyed) self.peer.reconnect(); } catch (e) { } });
  };
  Net.prototype._hostRelay = function (profile, cb, forcedCode, attempt) {
    var self = this, code = forcedCode || Net.randomCode();
    this._setupHost(profile, code);
    this.relay = true; this._rconns = {};
    var done = false, ws;
    this._emit('stage', 'signaling');
    try { ws = this.ws = new WebSocket(wsUrl(relayUrl(), code, 'host')); } catch (e) { cb(e); return; }
    var timer = setTimeout(function () { if (!done) { done = true; self._closeWs(ws); cb(mkErr('server-timeout')); } }, RELAY_TIMEOUT);
    ws.onmessage = function (ev) {
      var s = ev.data; if (typeof s !== 'string') return;
      var c0 = s.charCodeAt(0);
      if (c0 === 126) return;                                  // ~pong keepalive
      if (c0 === 33) {                                         // control: !ok|CODE  !open|PID  !close|PID
        var i = s.indexOf('|'), k = s.slice(1, i), pid = s.slice(i + 1);
        if (k === 'ok') { clearTimeout(timer); if (!done) { done = true; self._startKeepalive(ws); cb(null, code); } }
        else if (k === 'open') {
          var conn = new RelayConn(pid,
            function (m) { try { ws.send('U|' + pid + '|' + JSON.stringify(m)); } catch (e) { } },
            function () { try { ws.send('K|' + pid); } catch (e) { } });
          conn.open = true; self._rconns[pid] = conn; self._accept(conn);
        } else if (k === 'close') {
          var c = self._rconns[pid];
          if (c) { delete self._rconns[pid]; c.open = false; c._fire('close'); }
        }
        return;
      }
      var j = s.indexOf('|'); if (j < 0) return;               // PID|json  (peer -> host)
      var rc = self._rconns[s.slice(0, j)]; if (!rc) return;
      var msg; try { msg = JSON.parse(s.slice(j + 1)); } catch (e) { return; }
      rc._fire('data', msg);
    };
    ws.onclose = function (ev) {
      clearTimeout(timer);
      if (self.ws !== ws) return;                              // closed by us
      self.ws = null;
      if (!done) {
        done = true;
        if (ev.code === 4409 && !forcedCode && attempt < 5) { self._hostRelay(profile, cb, forcedCode, attempt + 1); return; }
        cb(mkErr(closeReason(ev, false))); return;
      }
      for (var pid in self._rconns) { var c = self._rconns[pid]; c.open = false; c._fire('close'); }
      self._rconns = {};
      self._emit('error', mkErr('relay-closed'));
    };
    ws.onerror = function () { };                              // onclose follows
  };

  Net.prototype._accept = function (conn) {
    var self = this;
    conn.on('data', function (msg) { self._onHostData(conn, msg); });
    conn.on('close', function () { self._drop(conn); });
    conn.on('error', function () { self._drop(conn); });
  };

  Net.prototype._onHostData = function (conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'hello') {
      var count = Object.keys(this.players).length;
      if (this.state !== 'lobby' || count >= MAX_PLAYERS) {
        try { conn.send({ t: 'reject', reason: this.state !== 'lobby' ? 'inrace' : 'full' }); } catch (e) { }
        setTimeout(function () { try { conn.close(); } catch (e) { } }, 800);
        return;
      }
      var id = this.nextId++;
      conn.playerId = id; this.conns[id] = conn;
      this.players[id] = { id: id, name: String(msg.name || 'PLAYER').slice(0, 12), char: msg.char || 'volt', pet: msg.pet || null, kart: msg.kart || 'nitro' };
      conn.send({ t: 'welcome', id: id, players: this.playerList(), lobby: this.lobby, h: performance.now() });
      this.broadcast({ t: 'lobby', players: this.playerList(), lobby: this.lobby }, id);
      this._emit('players', this.playerList());
      return;
    }
    var pid = conn.playerId;
    if (pid === undefined) return;
    if (msg.t === 'ping') { conn.send({ t: 'pong', c: msg.c, h: performance.now() }); return; }
    msg.id = pid; // never trust the client's own id claim
    this._emit('msg', msg);
  };

  Net.prototype._drop = function (conn) {
    var id = conn.playerId;
    if (id === undefined || !this.conns[id]) return;
    delete this.conns[id]; delete this.players[id];
    this.broadcast({ t: 'lobby', players: this.playerList(), lobby: this.lobby });
    this._emit('players', this.playerList());
    this._emit('leave', id);
  };

  Net.prototype.setLobby = function (lobby) {
    this.lobby = lobby;
    if (this.isHost) this.broadcast({ t: 'lobby', players: this.playerList(), lobby: lobby });
  };

  // ------------------------------------------------------------ client
  Net.prototype.join = function (code, profile, cb) {
    var self = this;
    if (relayUrl()) { this._joinRelay(code, profile, cb); return; }
    whenIceReady(function () { self._join(code, profile, cb); });
  };
  /** shared client-side message handling; finish(err, welcome) fires once for welcome/reject */
  Net.prototype._clientHandler = function (finish) {
    var self = this;
    return function (msg) {
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'welcome') {
        self.myId = msg.id; self.players = {};
        msg.players.forEach(function (p) { self.players[p.id] = p; });
        self.lobby = msg.lobby; self.state = 'lobby';
        self.offset = msg.h - performance.now();
        self._startPing();
        finish(null, msg); return;
      }
      if (msg.t === 'reject') { finish(new Error(msg.reason)); return; }
      if (msg.t === 'lobby') {
        self.players = {}; msg.players.forEach(function (p) { self.players[p.id] = p; });
        self.lobby = msg.lobby; self._emit('players', msg.players); self._emit('lobby', msg.lobby); return;
      }
      if (msg.t === 'pong') {
        var now = performance.now(), rtt = now - msg.c;
        if (!self._best || rtt <= self._best + 15) {
          var off = msg.h + rtt / 2 - now;
          self.offset = self._best === null ? off : self.offset * 0.6 + off * 0.4;
          self._best = self._best === null ? rtt : Math.min(self._best, rtt);
        }
        self.rtt = rtt; return;
      }
      self._emit('msg', msg);
    };
  };
  Net.prototype._join = function (code, profile, cb) {
    var self = this, done = false;
    this.isHost = false; this.code = code; this.state = 'joining';
    function fail(err) { if (!done) { done = true; cb(err || new Error('failed')); } }
    this._emit('stage', 'signaling');
    var peer = this.peer = new Peer(peerOpts());
    peer.on('error', function (err) { if (!done) fail(err); else self._emit('error', err); });
    peer.on('open', function () {
      self._emit('stage', 'connecting');
      var conn = self.conn = peer.connect(PREFIX + code.toLowerCase(), { reliable: true, serialization: 'json' });
      var timer = setTimeout(function () {
        var ice = 'unknown';
        try { ice = conn.peerConnection ? conn.peerConnection.iceConnectionState : 'no-pc'; } catch (e) { }
        var err = mkErr('timeout'); err.ice = ice; fail(err);
      }, P2P_TIMEOUT);
      conn.on('open', function () { self._emit('stage', 'open'); conn.send({ t: 'hello', name: profile.name, char: profile.char, pet: profile.pet, kart: profile.kart }); });
      conn.on('data', self._clientHandler(function (err, welcome) {
        clearTimeout(timer);
        if (err) fail(err); else if (!done) { done = true; cb(null, welcome); }
      }));
      conn.on('close', function () { if (done) self._emit('hostLeft'); else fail(new Error('closed')); });
      conn.on('error', function (e) { fail(e); });
    });
  };
  Net.prototype._joinRelay = function (code, profile, cb) {
    var self = this, done = false, opened = false, ws;
    this.isHost = false; this.code = code; this.state = 'joining'; this.relay = true;
    function fail(err) { if (!done) { done = true; cb(err || new Error('failed')); } }
    this._emit('stage', 'signaling');
    try { ws = this.ws = new WebSocket(wsUrl(relayUrl(), code, 'join')); } catch (e) { fail(e); return; }
    var conn = this.conn = new RelayConn('host',
      function (m) { try { ws.send(JSON.stringify(m)); } catch (e) { } },
      function () { self._closeWs(ws); });
    var timer = setTimeout(function () { fail(mkErr('server-timeout')); self._closeWs(ws); }, RELAY_TIMEOUT);
    var onData = this._clientHandler(function (err, welcome) {
      clearTimeout(timer);
      if (err) fail(err); else if (!done) { done = true; cb(null, welcome); }
    });
    ws.onopen = function () { self._emit('stage', 'connecting'); };
    ws.onmessage = function (ev) {
      var s = ev.data; if (typeof s !== 'string') return;
      var c0 = s.charCodeAt(0);
      if (c0 === 126) return;                                  // ~pong
      if (c0 === 33) {                                         // !ok|CODE — room exists, host reachable; !bye|why — closed by server
        if (s.slice(1, 3) === 'ok') {
          opened = true; conn.open = true; self._emit('stage', 'open'); self._startKeepalive(ws);
          conn.send({ t: 'hello', name: profile.name, char: profile.char, pet: profile.pet, kart: profile.kart });
        } else if (s.slice(1, 4) === 'bye') {
          clearTimeout(timer); conn.open = false; self._closeWs(ws);
          if (done) self._emit('hostLeft'); else fail(mkErr('closed'));
        }
        return;
      }
      var msg; try { msg = JSON.parse(s); } catch (e) { return; }
      onData(msg);
    };
    ws.onclose = function (ev) {
      clearTimeout(timer);
      if (self.ws !== ws) return;                              // closed by us
      self.ws = null; conn.open = false;
      if (done) self._emit('hostLeft'); else fail(mkErr(closeReason(ev, opened)));
    };
    ws.onerror = function () { };
  };

  Net.prototype._startPing = function () {
    var self = this;
    this._best = null;
    this._pingTimer = setInterval(function () { if (self.conn && self.conn.open) { try { self.conn.send({ t: 'ping', c: performance.now() }); } catch (e) { } } }, 1000);
  };
  Net.prototype._startKeepalive = function (ws) {
    if (this._kaTimer) clearInterval(this._kaTimer);
    this._kaTimer = setInterval(function () { if (ws.readyState === 1) { try { ws.send('~ping'); } catch (e) { } } }, KEEPALIVE);
  };
  Net.prototype._closeWs = function (ws) {
    if (!ws) return;
    if (this.ws === ws) this.ws = null;
    try { ws.close(); } catch (e) { }
  };

  // ------------------------------------------------------------ common
  /** client -> host, or host -> everyone */
  Net.prototype.send = function (msg) {
    if (this.isHost) this.broadcast(msg);
    else if (this.conn && this.conn.open) { try { this.conn.send(msg); } catch (e) { } }
  };
  Net.prototype.broadcast = function (msg, exceptId) {
    if (this.relay) {
      if (!this.isHost || !this.ws || this.ws.readyState !== 1) return;
      var s = JSON.stringify(msg), ex = exceptId !== undefined ? this.conns[exceptId] : null;
      try { this.ws.send(ex ? 'X|' + ex.peer + '|' + s : 'B|' + s); } catch (e) { }
      return;
    }
    for (var id in this.conns) {
      if (exceptId !== undefined && +id === exceptId) continue;
      var c = this.conns[id];
      if (c.open) { try { c.send(msg); } catch (e) { } }
    }
  };
  Net.prototype.playerCount = function () { return Object.keys(this.players).length; };
  Net.prototype.close = function () {
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
    if (this._kaTimer) { clearInterval(this._kaTimer); this._kaTimer = null; }
    this.handlers = {};
    this._closeWs(this.ws);
    try { if (this.peer) this.peer.destroy(); } catch (e) { }
    this.peer = null; this.conn = null; this.conns = {}; this._rconns = {}; this.players = {}; this.state = 'idle';
    this.isHost = false; this.relay = false; this.myId = null; this.offset = 0; this._best = null;
  };

  global.Net = Net;
})(window);
