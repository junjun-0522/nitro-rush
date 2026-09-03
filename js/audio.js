/* ============================================================
   NITRO RUSH - Audio (100% Web Audio API, no external files)
   ============================================================ */
(function (global) {
  'use strict';

  function AudioSys() {
    this.ctx = null;
    this.enabled = true;
    this.musicOn = true;
    this.volume = 0.8;
    this.musicVol = 0.5;
    this._engine = null;
    this._drift = null;
    this._music = null;
  }

  AudioSys.prototype.init = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    var ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.volume;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -12; this.comp.ratio.value = 6;
    this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.mus = ctx.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.master);
    // noise buffer
    var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  };

  AudioSys.prototype.setVolume = function (v) { this.volume = v; if (this.master) this.master.gain.value = v; };
  AudioSys.prototype.setMusicVolume = function (v) { this.musicVol = v; if (this.mus) this.mus.gain.value = v; };

  AudioSys.prototype._noise = function (dur, gainNode) {
    var ctx = this.ctx, src = ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    src.connect(gainNode);
    src.start(); src.stop(ctx.currentTime + dur + 0.05);
    return src;
  };

  AudioSys.prototype._tone = function (type, f0, f1, dur, vol, dest, attack) {
    var ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, ctx.currentTime);
    if (f1 !== null && f1 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(); o.stop(ctx.currentTime + dur + 0.05);
    return o;
  };

  // ------------------------------------------------------------ engine loop
  AudioSys.prototype.startEngine = function () {
    if (!this.ctx || this._engine) return;
    var ctx = this.ctx;
    var g = ctx.createGain(); g.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 2;
    var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 60;
    var o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 30;
    var g2 = ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.sfx);
    o1.start(); o2.start();
    // exhaust noise
    var ng = ctx.createGain(); ng.gain.value = 0;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 0.8;
    var ns = ctx.createBufferSource(); ns.buffer = this.noiseBuf; ns.loop = true;
    ns.connect(bp); bp.connect(ng); ng.connect(this.sfx); ns.start();
    this._engine = { g: g, o1: o1, o2: o2, lp: lp, ng: ng, bp: bp, ns: ns };
    // drift noise loop
    var dg = ctx.createGain(); dg.gain.value = 0;
    var dbp = ctx.createBiquadFilter(); dbp.type = 'bandpass'; dbp.frequency.value = 1800; dbp.Q.value = 1.2;
    var dns = ctx.createBufferSource(); dns.buffer = this.noiseBuf; dns.loop = true;
    dns.connect(dbp); dbp.connect(dg); dg.connect(this.sfx); dns.start();
    this._drift = { g: dg, bp: dbp };
    // boost wind loop
    var wg = ctx.createGain(); wg.gain.value = 0;
    var whp = ctx.createBiquadFilter(); whp.type = 'highpass'; whp.frequency.value = 2500;
    var wns = ctx.createBufferSource(); wns.buffer = this.noiseBuf; wns.loop = true;
    wns.connect(whp); whp.connect(wg); wg.connect(this.sfx); wns.start();
    this._wind = { g: wg };
  };

  AudioSys.prototype.stopEngine = function () {
    if (!this._engine) return;
    var e = this._engine, ctx = this.ctx;
    try { e.o1.stop(); e.o2.stop(); e.ns.stop(); } catch (x) { }
    this._engine = null; this._drift = null; this._wind = null;
  };

  /** rpm01: 0..1, throttle: 0..1, boosting: bool, drifting: 0..1, speed01 */
  AudioSys.prototype.updateEngine = function (rpm01, throttle, boosting, drifting, speed01, dt) {
    if (!this._engine) return;
    var e = this._engine, ctx = this.ctx, t = ctx.currentTime;
    var f = 55 + rpm01 * 170 + (boosting ? 40 : 0);
    e.o1.frequency.setTargetAtTime(f, t, 0.05);
    e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    e.lp.frequency.setTargetAtTime(500 + rpm01 * 1800 + throttle * 600, t, 0.08);
    e.g.gain.setTargetAtTime(0.06 + throttle * 0.06 + rpm01 * 0.05, t, 0.08);
    e.ng.gain.setTargetAtTime(0.02 + throttle * 0.04 + (boosting ? 0.05 : 0), t, 0.1);
    e.bp.frequency.setTargetAtTime(200 + rpm01 * 900, t, 0.1);
    if (this._drift) {
      this._drift.g.gain.setTargetAtTime(drifting * 0.12 * (0.4 + speed01), t, 0.05);
      this._drift.bp.frequency.setTargetAtTime(1200 + speed01 * 1500, t, 0.1);
    }
    if (this._wind) this._wind.g.gain.setTargetAtTime(Math.max(0, speed01 - 0.55) * 0.35 + (boosting ? 0.08 : 0), t, 0.1);
  };

  // ------------------------------------------------------------ one-shots
  AudioSys.prototype.boost = function (tier) {
    if (!this.ctx) return;
    var ctx = this.ctx;
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    var hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.Q.value = 0.7;
    hp.frequency.setValueAtTime(400, ctx.currentTime);
    hp.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.6);
    hp.connect(g); g.connect(this.sfx);
    this._noise(1, hp);
    this._tone('sawtooth', 200, 900 + (tier || 1) * 200, 0.5, 0.12);
    this._tone('sine', 120, 500, 0.4, 0.15);
  };

  AudioSys.prototype.driftTier = function (tier) {
    if (!this.ctx) return;
    var f = [0, 660, 880, 1175][tier] || 660;
    this._tone('square', f, f * 1.02, 0.12, 0.08);
    this._tone('sine', f * 2, f * 2, 0.15, 0.06);
  };

  AudioSys.prototype.pickup = function () {
    if (!this.ctx) return;
    var self = this, ctx = this.ctx;
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { if (self.ctx) self._tone('triangle', f, f, 0.18, 0.15); }, i * 60);
    });
  };

  AudioSys.prototype.roulette = function () {
    if (!this.ctx) return;
    this._tone('square', 900, 900, 0.05, 0.05);
  };

  AudioSys.prototype.hit = function (strength) {
    if (!this.ctx) return;
    var ctx = this.ctx, s = Math.min(1, strength || 0.5);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.25 * s + 0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    lp.connect(g); g.connect(this.sfx);
    this._noise(0.25, lp);
    this._tone('sine', 120, 40, 0.3, 0.3 * s + 0.05);
  };

  AudioSys.prototype.scrape = function () {
    if (!this.ctx) return;
    if (this._scrapeT && this.ctx.currentTime - this._scrapeT < 0.12) return;
    this._scrapeT = this.ctx.currentTime;
    var ctx = this.ctx, g = ctx.createGain(); g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 2;
    bp.connect(g); g.connect(this.sfx);
    this._noise(0.15, bp);
  };

  AudioSys.prototype.countdown = function (n) {
    if (!this.ctx) return;
    if (n > 0) this._tone('square', 440, 440, 0.18, 0.18);
    else { this._tone('square', 880, 880, 0.6, 0.2); this._tone('sine', 1760, 1760, 0.5, 0.1); }
  };

  AudioSys.prototype.lap = function () {
    if (!this.ctx) return;
    var self = this;
    this._tone('triangle', 784, 784, 0.12, 0.15);
    setTimeout(function () { if (self.ctx) self._tone('triangle', 1046, 1046, 0.25, 0.15); }, 120);
  };

  AudioSys.prototype.finish = function () {
    if (!this.ctx) return;
    var self = this;
    [[523, 0], [659, 120], [784, 240], [1046, 360], [1318, 600]].forEach(function (p) {
      setTimeout(function () { if (self.ctx) { self._tone('square', p[0], p[0], 0.35, 0.12); self._tone('triangle', p[0] / 2, p[0] / 2, 0.4, 0.12); } }, p[1]);
    });
  };

  AudioSys.prototype.rocket = function () {
    if (!this.ctx) return;
    var ctx = this.ctx, g = ctx.createGain(); g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1;
    bp.frequency.setValueAtTime(3000, ctx.currentTime); bp.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.7);
    bp.connect(g); g.connect(this.sfx);
    this._noise(0.7, bp);
    this._tone('sawtooth', 600, 150, 0.6, 0.1);
  };

  AudioSys.prototype.explode = function () {
    if (!this.ctx) return;
    var ctx = this.ctx, g = ctx.createGain(); g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2000, ctx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
    lp.connect(g); g.connect(this.sfx);
    this._noise(0.6, lp);
    this._tone('sine', 90, 30, 0.5, 0.35);
  };

  AudioSys.prototype.zap = function () {
    if (!this.ctx) return;
    var self = this;
    for (var i = 0; i < 6; i++) (function (i) {
      setTimeout(function () { if (self.ctx) self._tone('square', 2000 + Math.random() * 2000, 200, 0.08, 0.1); }, i * 40);
    })(i);
    this.explode();
  };

  AudioSys.prototype.shield = function () {
    if (!this.ctx) return;
    this._tone('sine', 400, 1600, 0.5, 0.15, null, 0.1);
    this._tone('triangle', 800, 2400, 0.5, 0.08, null, 0.1);
  };

  AudioSys.prototype.trap = function () {
    if (!this.ctx) return;
    this._tone('square', 300, 120, 0.2, 0.15);
  };

  AudioSys.prototype.spin = function () {
    if (!this.ctx) return;
    this._tone('sawtooth', 500, 80, 0.6, 0.15);
    this.hit(0.6);
  };

  AudioSys.prototype.respawn = function () {
    if (!this.ctx) return;
    this._tone('sine', 300, 900, 0.3, 0.15);
  };

  AudioSys.prototype.ui = function (kind) {
    if (!this.ctx) return;
    if (kind === 'hover') this._tone('sine', 700, 700, 0.05, 0.05);
    else if (kind === 'back') this._tone('triangle', 500, 300, 0.12, 0.12);
    else this._tone('triangle', 600, 900, 0.12, 0.14);
  };

  // ------------------------------------------------------------ music
  // A tiny step-sequencer: bass + arp + hats. Two moods.
  var MOODS = {
    coast: { bpm: 128, root: 0, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [2, 5, 9, 12]], lead: 'square', bass: 'triangle', base: 110 },
    neon: { bpm: 140, root: 0, prog: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [3, 7, 10, 14]], lead: 'sawtooth', bass: 'square', base: 82.4 }
  };

  AudioSys.prototype.startMusic = function (mood) {
    if (!this.ctx || !this.musicOn) return;
    this.stopMusic();
    var m = MOODS[mood] || MOODS.coast, ctx = this.ctx, self = this;
    var step = 60 / m.bpm / 4, stepIdx = 0, nextT = ctx.currentTime + 0.1;
    var lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 3200;
    lpf.connect(this.mus);
    var arpPat = [0, 2, 1, 3, 2, 3, 1, 2];
    function schedule() {
      while (nextT < ctx.currentTime + 0.25) {
        var bar = Math.floor(stepIdx / 16) % 4, s16 = stepIdx % 16;
        var chord = m.prog[bar];
        var f = function (semi, oct) { return m.base * Math.pow(2, (semi + m.root) / 12 + (oct || 0)); };
        // bass
        if (s16 % 4 === 0 || s16 === 14) {
          var bo = ctx.createOscillator(), bg = ctx.createGain(); bo.type = m.bass;
          bo.frequency.value = f(chord[0], -1);
          bg.gain.setValueAtTime(0.16, nextT); bg.gain.exponentialRampToValueAtTime(0.001, nextT + step * 3);
          bo.connect(bg); bg.connect(lpf); bo.start(nextT); bo.stop(nextT + step * 3.2);
        }
        // arp
        if (s16 % 2 === 0) {
          var semi = chord[arpPat[(s16 / 2) % 8]];
          var ao = ctx.createOscillator(), ag = ctx.createGain(); ao.type = m.lead;
          ao.frequency.value = f(semi, 1);
          ag.gain.setValueAtTime(0.05, nextT); ag.gain.exponentialRampToValueAtTime(0.001, nextT + step * 1.8);
          ao.connect(ag); ag.connect(lpf); ao.start(nextT); ao.stop(nextT + step * 2);
        }
        // hats
        var hg = ctx.createGain(); hg.gain.setValueAtTime(s16 % 4 === 2 ? 0.05 : 0.02, nextT);
        hg.gain.exponentialRampToValueAtTime(0.001, nextT + step * 0.6);
        var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
        var hn = ctx.createBufferSource(); hn.buffer = self.noiseBuf;
        hn.connect(hp); hp.connect(hg); hg.connect(self.mus);
        hn.start(nextT); hn.stop(nextT + step * 0.6);
        // kick
        if (s16 % 4 === 0) {
          var ko = ctx.createOscillator(), kg = ctx.createGain(); ko.type = 'sine';
          ko.frequency.setValueAtTime(150, nextT); ko.frequency.exponentialRampToValueAtTime(40, nextT + 0.12);
          kg.gain.setValueAtTime(0.35, nextT); kg.gain.exponentialRampToValueAtTime(0.001, nextT + 0.2);
          ko.connect(kg); kg.connect(self.mus); ko.start(nextT); ko.stop(nextT + 0.22);
        }
        nextT += step; stepIdx++;
      }
    }
    this._music = { timer: setInterval(schedule, 80), lpf: lpf };
    schedule();
  };

  AudioSys.prototype.stopMusic = function () {
    if (this._music) { clearInterval(this._music.timer); try { this._music.lpf.disconnect(); } catch (e) { } this._music = null; }
  };

  AudioSys.prototype.setMusicOn = function (on, mood) {
    this.musicOn = on;
    if (!on) this.stopMusic(); else if (mood) this.startMusic(mood);
  };

  global.AudioSys = AudioSys;
})(window);
