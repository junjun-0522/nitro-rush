/* ============================================================
   NITRO RUSH - AI drivers (imperfect on purpose)
   ============================================================ */
(function (global) {
  'use strict';

  var _t = new THREE.Vector3();

  function ensureSignedCurv(track) {
    if (track.curvSigned) return track.curvSigned;
    var path = track.path, N = path.N, C = new Float32Array(N), t = new THREE.Vector3();
    for (var j = 0; j < N; j++) {
      t.subVectors(path.T[path.open ? Math.min(N - 1, j + 8) : (j + 8) % N], path.T[path.open ? Math.max(0, j - 8) : (j - 8 + N) % N]);
      C[j] = t.dot(path.R[j]) / (16 * path.ds); // >0 turning right
    }
    track.curvSigned = C;
    return C;
  }

  function AIDriver(kart, opts) {
    this.k = kart;
    var rng = this.rng = U.rng(1000 + kart.index * 77 + (opts.seed || 0));
    this.skill = opts.skill;                       // 0.6 .. 1.1
    this.band = opts.band === undefined ? 1 : opts.band;
    this.baseScale = U.clamp(0.9 + this.skill * 0.09 + rng.range(-0.02, 0.02), 0.86, 1.02);
    this.lane = rng.range(-0.5, 0.5); this.laneTarget = this.lane; this.laneTimer = rng.range(1, 4);
    this.aggr = rng.range(0.3, 1);
    this.driftLike = rng() < 0.92 || this.k.isPlayer;
    this.itemTimer = rng.range(1, 4);
    this.mistakeTimer = rng.range(6, 16); this.mistake = 0;
    this.reverseTimer = 0; this.lastSteer = 0;
    this.noiseT = rng() * 100;
    this.useShortcut = rng() < 0.5 + this.skill * 0.4;
    this.aLat = 8 + 8 * this.skill;
    this.boostHold = 0;
  }

  AIDriver.prototype.update = function (dt, world) {
    var k = this.k, inp = k.input, path = world.path, track = world.track, L = path.length;
    if (track.open && k.finished) { inp.throttle = 0; inp.steer = 0; inp.drift = false; inp.boost = false; inp.item = false; inp.brake = k.s > track.finishS + 45 ? 1 : 0; return; }
    var rng = this.rng;
    inp.respawn = false; inp.boost = false;
    if (!world.raceOn) { inp.throttle = 0; inp.brake = 0; inp.steer = 0; inp.drift = false; return; }

    // rubber band vs player
    var diff = world.playerProgress - k.progress(L);
    var band = U.clamp(diff / 420, -0.10, 0.16) * this.band;
    if (k.finished) band = 0;
    k.speedScale = this.baseScale * (1 + band);

    // stuck / wrong way handling
    if (this.reverseTimer > 0) {
      this.reverseTimer -= dt;
      inp.throttle = 0; inp.brake = 1; inp.steer = -this.lastSteer; inp.drift = false;
      if (this.reverseTimer <= 0 && k.speed < 2) { inp.respawn = true; }
      return;
    }
    if (k.stuckTime > 1.6) { this.reverseTimer = 0.8; k.stuckTime = 0; return; }
    if (k.wrongWay > 2.5) { inp.respawn = true; return; }

    // lane wander
    this.laneTimer -= dt;
    if (this.laneTimer <= 0) { this.laneTimer = rng.range(2, 6); this.laneTarget = rng.range(-0.55, 0.55); }
    this.lane = U.damp(this.lane, this.laneTarget, 0.8, dt);
    this.noiseT += dt;

    var C = ensureSignedCurv(track);
    var look = 9 + k.speed * 0.5;
    var sT = k.s + look, idxT = path.idxOf(sT), idxC = path.idxOf(k.s + look * 1.8);
    var halfW = Math.max(2, path.W[idxT] / 2 - 2.2);
    var cs = C[idxC];
    // hug the inside of upcoming corners
    var inside = -Math.sign(cs) * Math.min(halfW * 0.7, Math.abs(cs) * 700) * (0.5 + this.skill * 0.5);
    var latT = this.lane * halfW * 0.8 + inside;
    // shortcut zones: aim into the dirt on the inside where allowed
    var zk = track.zoneKind[idxT];
    if (zk && this.useShortcut) {
      var mn = track.minLat[idxT] + 2.5, mx = track.maxLat[idxT] - 2.5;
      if (zk & 1) latT = U.lerp(latT, mn, 0.7);
      if (zk & 2) latT = U.lerp(latT, mx, 0.7);
    }
    // portals: shortcut-minded drivers line up with the gate
    if (track.portals && track.portals.length && this.useShortcut) {
      for (var pp = 0; pp < track.portals.length; pp++) {
        var po = track.portals[pp], dp = po.s - k.s; if (dp < -L / 2) dp += L; if (dp > L / 2) dp -= L;
        if (dp > 0 && dp < 75) { latT = U.lerp(latT, po.lat, Math.min(1, (75 - dp) / 40)); break; }
      }
    }
    latT = U.clamp(latT, track.minLat[idxT] + 2.2, track.maxLat[idxT] - 2.2);

    // avoidance: karts just ahead in a similar lane
    var karts = world.karts, kp = k.progress(L);
    for (var i = 0; i < karts.length; i++) {
      var o = karts[i]; if (o === k) continue;
      var d = o.progress(L) - kp;
      if (d > 0 && d < 12 && Math.abs(o.lat - k.lat) < 2.6) {
        var room = (track.maxLat[idxT] - o.lat) - (o.lat - track.minLat[idxT]);
        latT = o.lat + (room > 0 ? 3.2 : -3.2);
        if (d < 5 && k.speed > o.speed * 0.9 && !k.drifting && this.aggr < 0.5) inp.brake = 0.3;
      }
    }

    // steering toward the target point
    var target = path.posAt(sT, latT, _t);
    var ang = Math.atan2(target.x - k.pos.x, target.z - k.pos.z);
    var refYaw = k.drifting && k.speed > 5 ? Math.atan2(k.vel.x, k.vel.z) : k.yaw;
    var dYaw = U.wrapAngle(ang - refYaw);
    var steer = U.clamp(dYaw * 2.4, -1, 1);
    steer += Math.sin(this.noiseT * 3.1) * 0.05 * (1.2 - this.skill);
    if (this.mistake > 0) steer += Math.sin(this.noiseT * 9) * 0.5;
    inp.steer = U.clamp(steer, -1, 1);
    this.lastSteer = inp.steer;

    // speed planning
    var curv = path.lookaheadCurv(k.idx, 16 + k.speed * 1.15);
    var aLat = this.aLat * (k.drifting ? 2.4 : 1);
    var vMax = curv > 1e-4 ? Math.sqrt(aLat / curv) : 999;
    vMax = Math.max(vMax, 13);
    if (this.mistake > 0) vMax *= 1.3;
    var vT = Math.min(Kart.PARAMS.maxSpeed * 1.6, vMax);
    inp.throttle = k.speed < vT ? 1 : 0;
    inp.brake = k.speed > vT * 1.15 ? 1 : (inp.brake || 0);
    if (k.speed < 3) { inp.throttle = 1; inp.brake = 0; }

    // drifting: long corners are drift material
    var tt = Kart.PARAMS.driftTierTimes;
    if (!k.drifting) {
      var wantDrift = this.driftLike && curv > 0.0095 && k.speed > 17 && Math.abs(inp.steer) > 0.25 && !k.airborne && !k.offroad && rng() < 0.9;
      inp.drift = wantDrift;
      if (wantDrift && Math.abs(inp.steer) < 0.5) inp.steer = Math.sign(inp.steer || 1) * 0.5;
    } else {
      var stillCurvy = path.lookaheadCurv(k.idx, 10) > 0.005;
      var hold = stillCurvy || k.driftCharge < tt[0] + 0.15 + (1 - this.skill) * 0.3;
      if (k.driftCharge > tt[2] + 0.3) hold = false;
      if (k.speed < 9) hold = false;
      inp.drift = hold;
      // keep steering in the drift direction; adjust with target
      inp.steer = U.clamp(k.driftDir * 0.55 + dYaw * 1.2, -1, 1);
    }

    // boost when the road opens up
    if (k.boostStock > 0 && curv < 0.007 && !k.drifting) inp.boost = true;

    // items
    this.itemTimer -= dt;
    if (k.item && this.itemTimer <= 0) {
      var useIt = false, type = k.item;
      var aheadNear = false, behindNear = false;
      for (i = 0; i < karts.length; i++) {
        var oo = karts[i]; if (oo === k) continue;
        var dd = oo.progress(L) - kp;
        if (dd > 0 && dd < 180) aheadNear = true;
        if (dd < 0 && dd > -40) behindNear = true;
      }
      if (type === 'rocket') useIt = aheadNear || rng() < 0.02;
      else if (type === 'trap') useIt = behindNear || rng() < 0.03;
      else if (type === 'lightning') useIt = k.rank > 2 || rng() < 0.02;
      else if (type === 'shield') useIt = behindNear || rng() < 0.05;
      else useIt = curv < 0.008;
      if (useIt) { world.items.use(k, world); this.itemTimer = rng.range(1.5, 4); }
    }

    // mistakes
    this.mistakeTimer -= dt;
    if (this.mistake > 0) this.mistake -= dt;
    else if (this.mistakeTimer <= 0) { this.mistakeTimer = rng.range(8, 22) * (0.5 + this.skill); this.mistake = rng.range(0.5, 1.3) * (1.3 - this.skill); }
  };

  global.AIDriver = AIDriver;
})(window);
