/* ============================================================
   NITRO RUSH - time attack ghost
   Records the player's best solo run (15 Hz: x y z yaw progress flags)
   and replays it as a translucent kart. One ghost per track, kept in
   localStorage (nitroRush.ghost.v1.<trackId>), ~40 KB per minute.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'nitroRush.ghost.v1.';
  var HZ = 15, STRIDE = 6;
  var Ghost = { HZ: HZ, STRIDE: STRIDE };

  function b64(f32) {
    var u8 = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength), s = '';
    for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) {
    var bin = atob(s), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Float32Array(u8.buffer);
  }

  /** load the stored ghost for a track: { time, date, hz, n, samples, laps, char, kart, skin } or null */
  Ghost.load = function (trackId) {
    try {
      var j = JSON.parse(localStorage.getItem(KEY + trackId) || 'null');
      if (!j || !j.data) return null;
      j.samples = unb64(j.data); delete j.data;
      j.n = Math.floor(j.samples.length / STRIDE); j.hz = j.hz || HZ;
      return j.n >= 2 ? j : null;
    } catch (e) { return null; }
  };
  Ghost.save = function (trackId, rec) {
    try {
      localStorage.setItem(KEY + trackId, JSON.stringify({ time: rec.time, date: Date.now(), hz: HZ, char: rec.char, kart: rec.kart, skin: rec.skin, laps: rec.laps || [], data: b64(rec.samples) }));
      return true;
    } catch (e) { return false; }
  };
  Ghost.clear = function (trackId) { try { localStorage.removeItem(KEY + trackId); } catch (e) { } };

  /** recorder: push(kart, raceTimeMs, progress) every frame; keeps one sample per 1/HZ s */
  function Recorder() { this.buf = []; this.next = 0; }
  Recorder.prototype.push = function (k, t, prog) {
    if (t < this.next) return;
    this.next += 1000 / HZ;
    if (this.next < t - 2000 / HZ) this.next = t;               // resync after a stall (tab hidden)
    var flags = (k.drifting ? 1 : 0) | (k.boostTime > 0 ? 2 : 0) | (k.driftDir > 0 ? 4 : 0) | (k.airborne ? 8 : 0) | (k.flying ? 16 : 0);
    this.buf.push(k.pos.x, k.pos.y, k.pos.z, k.yaw, prog, flags);
  };
  Recorder.prototype.finish = function () { return new Float32Array(this.buf); };
  Ghost.Recorder = Recorder;

  /** replayer over a loaded ghost */
  function Player(g) { this.g = g; }
  Player.prototype.at = function (tMs, out) {
    var g = this.g, S = g.samples, n = g.n, f = tMs * g.hz / 1000;
    var i = Math.floor(f), a = f - i;
    if (i < 0) { i = 0; a = 0; }
    if (i >= n - 1) { i = n - 1; a = 0; }
    var o = i * STRIDE, o2 = Math.min(n - 1, i + 1) * STRIDE;
    out.x = S[o] + (S[o2] - S[o]) * a; out.y = S[o + 1] + (S[o2 + 1] - S[o + 1]) * a; out.z = S[o + 2] + (S[o2 + 2] - S[o + 2]) * a;
    var y0 = S[o + 3], d = S[o2 + 3] - y0;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    out.yaw = y0 + d * a;
    out.prog = S[o + 4] + (S[o2 + 4] - S[o + 4]) * a;
    out.flags = S[o + 5] | 0;
    out.done = f >= n - 1;
    return out;
  };
  /** race time (ms) at which the ghost reached progress p */
  Player.prototype.timeAtProgress = function (p) {
    var g = this.g, S = g.samples, lo = 0, hi = g.n - 1, dt = 1000 / g.hz;
    if (p <= S[4]) return 0;
    if (p >= S[hi * STRIDE + 4]) return hi * dt;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (S[mid * STRIDE + 4] <= p) lo = mid; else hi = mid; }
    var p0 = S[lo * STRIDE + 4], p1 = S[hi * STRIDE + 4], a = p1 > p0 ? (p - p0) / (p1 - p0) : 0;
    return (lo + a) * dt;
  };
  Player.prototype.duration = function () { return (this.g.n - 1) * 1000 / this.g.hz; };
  Ghost.Player = Player;

  global.Ghost = Ghost;
})(window);
