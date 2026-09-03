/* ============================================================
   NITRO RUSH - online layer (PeerJS / WebRTC, host-relayed star)
   ============================================================ */
(function (global) {
  'use strict';

  var PREFIX = 'nitro-rush-v1-';
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
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var MAX_PLAYERS = 8;

  function Net() {
    this.peer = null; this.conn = null; this.conns = {};
    this.isHost = false; this.myId = null; this.players = {}; this.lobby = null;
    this.handlers = {}; this.offset = 0; this.rtt = 0; this.state = 'idle'; this.code = null;
    this._pingTimer = null; this._best = null;
  }

  Net.randomCode = function () {
    var s = '';
    for (var i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return s;
  };
  Net.prototype.on = function (ev, fn) { this.handlers[ev] = fn; return this; };
  Net.prototype._emit = function (ev, a, b) { var h = this.handlers[ev]; if (h) h(a, b); };
  /** host-based clock (ms) */
  Net.prototype.now = function () { return performance.now() + this.offset; };

  Net.prototype.playerList = function () {
    var self = this;
    return Object.keys(this.players).map(function (k) { var p = self.players[k]; return { id: p.id, name: p.name, char: p.char || 'volt', pet: p.pet || null }; })
      .sort(function (a, b) { return a.id - b.id; });
  };

  // ------------------------------------------------------------ host
  Net.prototype.host = function (profile, cb, forcedCode) {
    var self = this;
    whenIceReady(function () { self._host(profile, cb, forcedCode); });
  };
  Net.prototype._host = function (profile, cb, forcedCode) {
    var self = this, code = forcedCode || Net.randomCode();
    this.isHost = true; this.myId = 0; this.nextId = 1; this.code = code; this.state = 'lobby';
    this.players = { 0: { id: 0, name: profile.name, char: profile.char, pet: profile.pet } };
    var done = false;
    this._emit('stage', 'signaling');
    var peer = this.peer = new Peer(PREFIX + code.toLowerCase(), peerOpts());
    peer.on('open', function () { if (!done) { done = true; cb(null, code); } });
    peer.on('error', function (err) { if (!done) { done = true; cb(err); } else self._emit('error', err); });
    peer.on('connection', function (conn) { self._accept(conn); });
    peer.on('disconnected', function () { try { if (self.peer && !self.peer.destroyed) self.peer.reconnect(); } catch (e) { } });
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
      this.players[id] = { id: id, name: String(msg.name || 'PLAYER').slice(0, 12), char: msg.char || 'volt', pet: msg.pet || null };
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
    whenIceReady(function () { self._join(code, profile, cb); });
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
        var err = new Error('timeout'); err.type = 'timeout'; err.ice = ice; fail(err);
      }, 20000);
      conn.on('open', function () { self._emit('stage', 'open'); conn.send({ t: 'hello', name: profile.name, char: profile.char, pet: profile.pet }); });
      conn.on('data', function (msg) {
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'welcome') {
          clearTimeout(timer);
          self.myId = msg.id; self.players = {};
          msg.players.forEach(function (p) { self.players[p.id] = p; });
          self.lobby = msg.lobby; self.state = 'lobby';
          self.offset = msg.h - performance.now();
          self._startPing();
          if (!done) { done = true; cb(null, msg); }
          return;
        }
        if (msg.t === 'reject') { clearTimeout(timer); fail(new Error(msg.reason)); return; }
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
      });
      conn.on('close', function () { if (done) self._emit('hostLeft'); else fail(new Error('closed')); });
      conn.on('error', function (e) { fail(e); });
    });
  };

  Net.prototype._startPing = function () {
    var self = this;
    this._best = null;
    this._pingTimer = setInterval(function () { if (self.conn && self.conn.open) { try { self.conn.send({ t: 'ping', c: performance.now() }); } catch (e) { } } }, 1000);
  };

  // ------------------------------------------------------------ common
  /** client -> host, or host -> everyone */
  Net.prototype.send = function (msg) {
    if (this.isHost) this.broadcast(msg);
    else if (this.conn && this.conn.open) { try { this.conn.send(msg); } catch (e) { } }
  };
  Net.prototype.broadcast = function (msg, exceptId) {
    for (var id in this.conns) {
      if (exceptId !== undefined && +id === exceptId) continue;
      var c = this.conns[id];
      if (c.open) { try { c.send(msg); } catch (e) { } }
    }
  };
  Net.prototype.playerCount = function () { return Object.keys(this.players).length; };
  Net.prototype.close = function () {
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
    try { if (this.peer) this.peer.destroy(); } catch (e) { }
    this.peer = null; this.conn = null; this.conns = {}; this.players = {}; this.state = 'idle';
    this.isHost = false; this.myId = null; this.offset = 0; this._best = null; this.handlers = {};
  };

  global.Net = Net;
})(window);
