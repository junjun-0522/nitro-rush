/* ============================================================
   NITRO RUSH - dynamic hazards (VOLCANIC INFERNO)
   Falling rocks with warnings (dust, pebbles, pulsing marker, rumble) that
   land and stay as solid obstacles, bouncing pebble streams, road cracks,
   cliff collapses, lava splashes (spin-out), tremors with distant lava
   bursts, the eruption event (lighting + route change: the old mountain
   road sinks into lava, a boulder wall blows open the new path), lava
   bridge shake, waterfall sparks, lava bombs and meteors.
   Everything is simulated locally on each client. Landed rocks / dividers /
   active splashes live in track.obstacles: karts collide with them here,
   AI drivers steer around them (ai.js).
   Data: track.def.hazards = { crater, dividers, splashes, rockfalls, rockStreams,
         cracks, cliffs, tremors, eruption, bridgeShake, sparks }  (fractions of the course)
   ============================================================ */
(function (global) {
  'use strict';

  var _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), G = 28;

  function Hazards(track, scene, fx, audio, env) {
    this.track = track; this.scene = scene; this.fx = fx; this.audio = audio; this.env = env || {};
    this.def = track.def.hazards || {}; this.path = track.path; this.N = track.path.N; this.L = track.path.length;
    this.group = new THREE.Group(); scene.add(this.group);
    this.rng = U.rng(4242);
    this.time = 0; this.light = 0; this.player = null; this.ps = 0;
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x241f21, roughness: 0.95, flatShading: true });
    this.bombMat = new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 0.8, emissive: 0xff4a10, emissiveIntensity: 1.2, flatShading: true });
    this.glowMat = new THREE.SpriteMaterial({ map: U.tex.particle(), color: 0xff8030, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    this.flameMat = new THREE.SpriteMaterial({ map: U.tex.flame(), color: 0xffc060, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.smokeMat = new THREE.SpriteMaterial({ map: U.tex.smoke(), color: 0x2a1a16, transparent: true, opacity: 0.7, depthWrite: false });
    this.obstacles = track.obstacles; this.obstacles.length = 0;
    this.flashes = []; this.bombs = []; this.meteorT = 0; this.tremorT = 3; this.shakeT = 0; this.sparkT = 0; this.msgT = 0;
    this._buildDividers(); this._buildRockfalls(); this._buildPebbles(); this._buildSplashes(); this._buildCracks(); this._buildCliffs(); this._buildEruption();
  }
  Hazards.prototype.S = function (f) { return f * this.L; };
  Hazards.prototype.surf = function (s, lat, out) { return this.track.surfacePoint(this.path.idxOf(s), lat, out); };
  Hazards.prototype.addObstacle = function (x, y, z, r, s, lat) { var o = { x: x, y: y, z: z, r: r, s: s, lat: lat, off: false }; this.obstacles.push(o); return o; };
  Hazards.prototype.removeObstacle = function (o) { var i = this.obstacles.indexOf(o); if (i >= 0) this.obstacles.splice(i, 1); };
  Hazards.prototype.emit = function (name, data) { if (this.env.onEvent) this.env.onEvent(name, data); };
  Hazards.prototype.near = function (p, d) { return !!this.player && this.player.pos.distanceTo(p) < d; };

  // ---------------------------------------------------------------- lane dividers (solid rock ridge between the safe and the fast lane)
  Hazards.prototype._buildDividers = function () {
    var self = this, geos = [];
    (this.def.dividers || []).forEach(function (d) {
      var a = Math.round(d.a * self.N), b = Math.round(d.b * self.N);
      for (var j = a; j <= b; j += 3) {
        self.track.surfacePoint(j, d.lat, _v);
        var r = 1.6 + self.rng.range(-0.2, 0.3), rg = new THREE.IcosahedronGeometry(r, 0); rg.rotateY(self.rng() * 6); rg.translate(_v.x, _v.y + r * 0.55, _v.z); geos.push(rg);
        self.addObstacle(_v.x, _v.y + r * 0.55, _v.z, r, j * self.path.ds, d.lat);
      }
    });
    if (geos.length) { var m = new THREE.Mesh(mergeGeoms(geos), this.rockMat); m.castShadow = true; this.group.add(m); }
  };

  // ---------------------------------------------------------------- falling rocks
  Hazards.prototype._buildRockfalls = function () {
    var self = this; this.rocks = [];
    (this.def.rockfalls || []).forEach(function (d) {
      var s = self.S(d.a), r = d.r || 2, geo = new THREE.IcosahedronGeometry(r, 1), pa = geo.attributes.position;
      for (var i = 0; i < pa.count; i++) { var k = 1 + self.rng.range(-0.18, 0.18); pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k, pa.getZ(i) * k); }
      geo.computeVertexNormals();
      var mesh = new THREE.Mesh(geo, self.rockMat); mesh.castShadow = true; mesh.visible = false; self.group.add(mesh);
      var marker = new THREE.Mesh(new THREE.RingGeometry(r + 0.6, r + 1.8, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0, depthWrite: false })); marker.visible = false; self.group.add(marker);
      var rk = { d: d, s: s, lat: d.lat || 0, r: r, mesh: mesh, marker: marker, state: 'armed', t: 0, vy: 0, vx: 0, vz: 0, bounces: 0, impact: new THREE.Vector3(), top: 0, sImpact: s, rot: new THREE.Vector3(self.rng.range(-2, 2), self.rng.range(-2, 2), self.rng.range(-2, 2)) };
      if (!d.behind) { self.surf(s, rk.lat, rk.impact); rk.top = rk.impact.y + 38; }
      self.rocks.push(rk);
    });
  };
  Hazards.prototype._startFall = function (rk) {
    rk.state = 'fall'; rk.t = 0; rk.vy = 0; rk.vx = 0; rk.vz = 0; rk.mesh.visible = true; rk.mesh.position.set(rk.impact.x, rk.top, rk.impact.z);
    rk.marker.visible = true; rk.marker.position.set(rk.impact.x, rk.impact.y + 0.08, rk.impact.z); rk.marker.material.opacity = 0.9;
  };
  Hazards.prototype._rockfalls = function (dt, world) {
    var ps = this.ps, fx = this.fx, p = this.player;
    for (var i = 0; i < this.rocks.length; i++) {
      var rk = this.rocks[i], d = rk.d;
      if (rk.state === 'armed') {
        if (d.behind) {   // cinematic: drops right behind the player once they pass the point
          if (ps >= rk.s) { var bs = Math.max(20, ps - d.behind); rk.lat = this.rng.range(-3, 3); this.surf(bs, rk.lat, rk.impact); rk.sImpact = bs; rk.top = rk.impact.y + 30; this._startFall(rk); }
        } else if (ps >= rk.s - (d.trigger || 90) && ps < rk.s + 3) {
          rk.state = 'warn'; rk.t = 0; rk.marker.visible = true;
          if (this.near(rk.impact, 150)) { this.audio.hit(0.25); if (rk.r >= 2.5) this.emit('rockwarn'); }
        }
        continue;
      }
      if (rk.state === 'warn') {
        rk.t += dt;
        if (Math.random() < dt * 14) fx.smoke.emit(rk.impact.x + (Math.random() - 0.5) * rk.r * 2, rk.top - Math.random() * 12, rk.impact.z + (Math.random() - 0.5) * rk.r * 2, 0, -9, 0, { life: 1.1, size: 1.4, grow: 2.2, alpha: 0.35, color: fx.color(0x6a5a50), drag: 0.4 });
        if (Math.random() < dt * 6) { _v.set(rk.impact.x, rk.top - 4, rk.impact.z); fx.sparks(_v, 2, 0x8a7a70, 3); }
        rk.marker.material.opacity = 0.35 + Math.abs(Math.sin(rk.t * 12)) * 0.55; rk.marker.position.set(rk.impact.x, rk.impact.y + 0.08, rk.impact.z);
        if (this.near(rk.impact, 80)) fx.addShake(dt * 0.9);
        if (rk.t >= (d.warn || 1.5)) this._startFall(rk);
        continue;
      }
      if (rk.state === 'fall') {
        rk.vy -= G * dt; rk.mesh.position.y += rk.vy * dt; rk.mesh.position.x += rk.vx * dt; rk.mesh.position.z += rk.vz * dt;
        rk.mesh.rotation.x += rk.rot.x * dt; rk.mesh.rotation.z += rk.rot.z * dt;
        var lk = world.localKarts || world.karts;
        for (var k = 0; k < lk.length; k++) {
          var kt = lk[k]; if (kt.remote || kt.invulnTime > 0) continue;
          var dx = kt.pos.x - rk.mesh.position.x, dz = kt.pos.z - rk.mesh.position.z;
          if (dx * dx + dz * dz < (rk.r + 1.2) * (rk.r + 1.2) && rk.mesh.position.y - rk.r < kt.pos.y + 1.8 && rk.mesh.position.y > kt.pos.y - 1) { kt.vel.multiplyScalar(0.55); kt.invulnTime = 1.2; kt.events.push({ type: 'wall', impact: 8, side: 1 }); if (kt.isPlayer) fx.addShake(0.5); }
        }
        if (rk.mesh.position.y - rk.r <= rk.impact.y) {
          rk.mesh.position.y = rk.impact.y + rk.r;
          var big = rk.r >= 2.5, dist = p ? p.pos.distanceTo(rk.impact) : 999;
          fx.explosion(rk.impact, big); fx.dust(rk.impact, _v.set(0, 0, 0)); fx.dust(rk.impact, _v);
          if (dist < 160) { fx.addShake(U.clamp((big ? 0.9 : 0.45) * (1 - dist / 160), 0, 1)); if (big) this.audio.explode(); else this.audio.hit(0.6); }
          if (rk.bounces === 0 && rk.vy < -8) { rk.vy = -rk.vy * 0.28; var ang = Math.random() * 6.28; rk.vx = Math.cos(ang) * 1.8; rk.vz = Math.sin(ang) * 1.8; rk.bounces++; }
          else {
            rk.state = 'landed'; rk.vy = 0; rk.mesh.position.y = rk.impact.y + rk.r * 0.8; rk.marker.visible = false;
            var pr = this.path.project(rk.mesh.position, this.path.idxOf(rk.sImpact), {});
            rk.ob = this.addObstacle(rk.mesh.position.x, rk.mesh.position.y, rk.mesh.position.z, rk.r * 0.95, pr.s, pr.lat);
          }
        }
      }
    }
  };

  // ---------------------------------------------------------------- small rocks tumbling across the road (visual)
  Hazards.prototype._buildPebbles = function () {
    this.pebbles = []; this.streams = (this.def.rockStreams || []).map(function (st) { return { a: st.a, b: st.b, side: st.side || 1, t: 1 }; });
    for (var i = 0; i < 14; i++) { var r = this.rng.range(0.35, 0.7), m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), this.rockMat); m.visible = false; m.castShadow = true; this.group.add(m); this.pebbles.push({ mesh: m, r: r, on: false, vlat: 0, vy: 0, vs: 0, life: 0, lat: 0, s: 0 }); }
  };
  Hazards.prototype._pebbles = function (dt) {
    var self = this, ps = this.ps, path = this.path, track = this.track;
    this.streams.forEach(function (st) {
      var sa = self.S(st.a), sb = self.S(st.b);
      if (ps < sa - 70 || ps > sb) return;
      st.t -= dt; if (st.t > 0) return;
      st.t = self.rng.range(0.9, 2.2);
      var pb = null; for (var i = 0; i < self.pebbles.length; i++) if (!self.pebbles[i].on) { pb = self.pebbles[i]; break; }
      if (!pb) return;
      var s = U.clamp(ps + self.rng.range(25, 110), sa, sb), j = path.idxOf(s), lim = st.side > 0 ? track.maxLat[j] : track.minLat[j];
      pb.on = true; pb.life = 4; pb.s = s; pb.lat = lim + st.side * 5; pb.mesh.visible = true;
      track.surfacePoint(j, pb.lat, pb.mesh.position); pb.mesh.position.y += 12;
      pb.vlat = -st.side * self.rng.range(6, 10); pb.vy = 0; pb.vs = self.rng.range(-2, 2);
    });
    for (var i = 0; i < this.pebbles.length; i++) {
      var pb = this.pebbles[i]; if (!pb.on) continue;
      pb.life -= dt; pb.lat += pb.vlat * dt; pb.s += pb.vs * dt; pb.vy -= G * dt;
      var j = path.idxOf(pb.s); track.surfacePoint(j, pb.lat, _v); var gy = _v.y + pb.r;
      var y = pb.mesh.position.y + pb.vy * dt;
      if (y < gy) { y = gy; pb.vy = Math.max(2.5, -pb.vy * 0.45); if (this.near(_v, 60) && Math.random() < 0.5) this.fx.dust(_v, _v2.set(0, 0, 0)); }
      pb.mesh.position.set(_v.x, y, _v.z); pb.mesh.rotation.x += dt * 6; pb.mesh.rotation.z += dt * 4;
      var far = pb.vlat < 0 ? pb.lat < track.minLat[j] - 5 : pb.lat > track.maxLat[j] + 5;
      if (pb.life <= 0 || far) { pb.on = false; pb.mesh.visible = false; }
    }
  };

  // ---------------------------------------------------------------- lava splashes beside the road (bubble -> erupt -> idle)
  Hazards.prototype._buildSplashes = function () {
    var self = this; this.splashes = [];
    var poolMat = this.track.lavaMat || new THREE.MeshBasicMaterial({ color: 0xff7a20 });
    (this.def.splashes || []).forEach(function (d) {
      var s = self.S(d.a), pos = new THREE.Vector3(); self.surf(s, d.lat, pos);
      var glow = new THREE.Sprite(self.glowMat.clone()); glow.position.set(pos.x, pos.y + 0.6, pos.z); glow.scale.set(7, 5, 1); self.group.add(glow);
      var col = new THREE.Sprite(self.flameMat.clone()); col.position.set(pos.x, pos.y + 4, pos.z); col.scale.set(5, 10, 1); col.visible = false; self.group.add(col);
      var pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 16).rotateX(-Math.PI / 2), poolMat); pool.position.set(pos.x, pos.y + 0.07, pos.z); self.group.add(pool);
      var ob = self.addObstacle(pos.x, pos.y, pos.z, 2.6, s, d.lat); ob.off = true;
      self.splashes.push({ pos: pos, glow: glow, col: col, ob: ob, period: d.period || 5.5, phase: self.rng() * 5, r: d.r || 3.2, was: 'idle' });
    });
  };
  Hazards.prototype._splashes = function (dt, t, world) {
    var lk = world.localKarts || world.karts || [];
    for (var i = 0; i < this.splashes.length; i++) {
      var sp = this.splashes[i], c = (t + sp.phase) % sp.period, st = c < 1.6 ? 'warn' : (c < 2.6 ? 'splash' : 'idle');
      var nearP = this.near(sp.pos, 220);
      if (st === 'warn') { sp.glow.material.opacity = 0.35 + Math.abs(Math.sin(c * 14)) * 0.5; var gs = 7 + c * 2; sp.glow.scale.set(gs, gs * 0.7, 1); if (nearP && Math.random() < dt * 10) this.fx.sparks(sp.pos, 1, 0xffb040, 3); }
      else if (st === 'splash') {
        var f = (c - 1.6) / 1.0, h = Math.sin(f * Math.PI);
        sp.col.visible = true; sp.col.scale.set(4 + h * 3, 2 + h * 13, 1); sp.col.position.y = sp.pos.y + 1 + h * 6.5; sp.col.material.opacity = 0.6 + h * 0.4;
        sp.glow.material.opacity = 0.9; sp.glow.scale.set(12, 9, 1);
        if (sp.was !== 'splash' && nearP) { this.fx.sparks(sp.pos, 18, 0xffc040, 12); this.audio.hit(0.35); }
        for (var k = 0; k < lk.length; k++) {
          var kt = lk[k]; if (kt.remote || kt.invulnTime > 0 || kt.spinTime > 0) continue;
          var dx = kt.pos.x - sp.pos.x, dz = kt.pos.z - sp.pos.z;
          if (dx * dx + dz * dz < sp.r * sp.r && Math.abs(kt.pos.y - sp.pos.y) < 3) { kt.spinOut('lava'); kt.invulnTime = 1.0; this.fx.explosion(kt.pos, false); }
        }
      } else { sp.col.visible = false; sp.glow.material.opacity = 0.2 + Math.sin(t * 2 + i) * 0.05; sp.glow.scale.set(6, 4, 1); }
      sp.ob.off = st === 'idle'; sp.was = st;
    }
  };

  // ---------------------------------------------------------------- road cracks that light up when the mountain starts to break
  Hazards.prototype._buildCracks = function () {
    var c = this.def.cracks; if (!c) { this.cracks = null; return; }
    var a = Math.round(c.a * this.N), b = Math.round(c.b * this.N), geos = [], self = this;
    [-6, 0, 6].forEach(function (lat) { geos.push(self.track.strip(lat - 1.6, lat + 1.6, [a, b], 3)); });
    var t2 = U.tex.lavaCracks().clone(); t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.needsUpdate = true;
    var mat = new THREE.MeshBasicMaterial({ map: t2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    var m = new THREE.Mesh(mergeGeoms(geos), mat); m.position.y = 0.06; this.group.add(m);
    this.cracks = { mesh: m, mat: mat, trigger: this.S(c.trigger), on: false, t: 0 };
  };
  Hazards.prototype._cracks = function (dt, t) {
    var c = this.cracks; if (!c) return;
    if (!c.on) { if (this.ps >= c.trigger) { c.on = true; c.t = 0; this.fx.addShake(0.5); this.audio.hit(0.5); this.emit('cracks'); } return; }
    c.t += dt; c.mat.opacity = Math.min(1, c.t / 1.5) * (0.75 + Math.sin(t * 5) * 0.2);
  };

  // ---------------------------------------------------------------- cliff chunks that come down beside the road
  Hazards.prototype._buildCliffs = function () {
    var self = this; this.cliffs = [];
    (this.def.cliffs || []).forEach(function (d) {
      var s = self.S(d.a), j = self.path.idxOf(s), side = d.side || -1, lim = side > 0 ? self.track.maxLat[j] : self.track.minLat[j], chunks = [];
      for (var k = 0; k < 6; k++) {
        var w = self.rng.range(4, 8), h = self.rng.range(4, 9), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, self.rng.range(4, 8)), self.rockMat); m.castShadow = true;
        self.track.surfacePoint(Math.min(self.N - 1, j + (k - 3) * 3), lim + side * (9 + self.rng.range(0, 4)), _v);
        m.position.set(_v.x, _v.y + 14 + k * 4, _v.z); m.rotation.y = Math.atan2(self.path.T[j].x, self.path.T[j].z);
        m.userData = { rest: new THREE.Vector3(_v.x, _v.y + h / 2 - 0.5, _v.z), vy: 0, done: false, delay: k * 0.18 };
        self.group.add(m); chunks.push(m);
      }
      self.cliffs.push({ trigger: self.S(d.trigger), chunks: chunks, on: false, t: 0 });
    });
  };
  Hazards.prototype._cliffs = function (dt) {
    for (var i = 0; i < this.cliffs.length; i++) {
      var c = this.cliffs[i];
      if (!c.on) { if (this.ps >= c.trigger) { c.on = true; c.t = 0; this.fx.addShake(0.6); this.audio.explode(); this.emit('cliff'); } continue; }
      c.t += dt;
      for (var k = 0; k < c.chunks.length; k++) {
        var m = c.chunks[k], u = m.userData; if (u.done || c.t < u.delay) continue;
        u.vy -= G * dt; m.position.y += u.vy * dt; m.rotation.x += dt * 1.5; m.rotation.z += dt * 0.8;
        m.position.x += (u.rest.x - m.position.x) * dt * 2; m.position.z += (u.rest.z - m.position.z) * dt * 2;
        if (m.position.y <= u.rest.y) { m.position.y = u.rest.y; u.done = true; m.rotation.set(0, m.rotation.y, this.rng.range(-0.3, 0.3)); this.fx.explosion(m.position, false); if (this.near(m.position, 120)) this.fx.addShake(0.3); }
        else if (Math.random() < dt * 8) this.fx.dust(m.position, _v.set(0, 0, 0));
      }
    }
  };

  // ---------------------------------------------------------------- tremors + bursts on the volcano flank
  Hazards.prototype._tremors = function (dt) {
    var tr = this.def.tremors; if (!tr) return;
    if (this.ps < this.S(tr[0]) || this.ps > this.S(tr[1])) return;
    this.tremorT -= dt; if (this.tremorT > 0) return;
    this.tremorT = this.rng.range(2.5, 5.5);
    this.fx.addShake(0.22);
    var cr = this.def.crater; if (!cr) return;
    var ang = this.rng() * 6.28, rr = this.rng.range(90, 230), h = cr[1] * Math.max(0.05, 1 - rr / 300);
    this._burst(new THREE.Vector3(cr[0] + Math.cos(ang) * rr, h, cr[2] + Math.sin(ang) * rr), 30);
  };
  Hazards.prototype._burst = function (p, size) {
    var gl = new THREE.Sprite(this.glowMat.clone()); gl.position.copy(p); gl.scale.set(size, size, 1); this.group.add(gl); this.flashes.push({ sp: gl, t: 0, size: size });
    for (var i = 0; i < 6; i++) this._bomb(p, (Math.random() - 0.5) * 30, 25 + Math.random() * 30, (Math.random() - 0.5) * 30, false);
  };
  Hazards.prototype._bomb = function (p, vx, vy, vz, solid, target, tS, tLat) {
    var b = null; for (var i = 0; i < this.bombs.length; i++) if (!this.bombs[i].on) { b = this.bombs[i]; break; }
    if (!b) return null;
    b.on = true; b.solid = !!solid; b.target = target || null; b.tS = tS; b.tLat = tLat; b.life = 14;
    b.sp.visible = true; b.sp.position.copy(p); b.vx = vx; b.vy = vy; b.vz = vz;
    if (solid) { b.mesh.visible = true; b.mesh.position.copy(p); }
    return b;
  };
  Hazards.prototype._bombs = function (dt) {
    for (var i = 0; i < this.bombs.length; i++) {
      var b = this.bombs[i]; if (!b.on) continue;
      b.life -= dt; b.vy -= G * dt; b.sp.position.x += b.vx * dt; b.sp.position.y += b.vy * dt; b.sp.position.z += b.vz * dt;
      if (b.solid) { b.mesh.position.copy(b.sp.position); b.mesh.rotation.x += dt * 4; }
      var nearP = this.near(b.sp.position, 260);
      if (nearP && Math.random() < dt * 20) this.fx.sparks(b.sp.position, 1, 0xff9030, 3);
      var groundLv = b.target ? b.target.y : 0.5;
      if (b.sp.position.y < groundLv || b.life <= 0) {
        if (b.target) b.sp.position.copy(b.target);
        if (nearP || b.solid) this.fx.explosion(b.sp.position, b.solid);
        if (b.solid) {
          var r = 2.2, rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), this.rockMat); rock.position.copy(b.sp.position); rock.position.y += r * 0.7; rock.castShadow = true; this.group.add(rock);
          this.addObstacle(rock.position.x, rock.position.y, rock.position.z, r * 0.95, b.tS, b.tLat);
          if (this.near(rock.position, 220)) { this.fx.addShake(0.6); this.audio.explode(); }
          b.mesh.visible = false;
        }
        b.on = false; b.sp.visible = false;
      }
    }
    for (i = this.flashes.length - 1; i >= 0; i--) { var fl = this.flashes[i]; fl.t += dt; var f = fl.t / 1.2; fl.sp.scale.set(fl.size * (1 + f), fl.size * (1 + f), 1); fl.sp.material.opacity = 0.7 * (1 - f); if (f >= 1) { this.group.remove(fl.sp); this.flashes.splice(i, 1); } }
  };

  // ---------------------------------------------------------------- the eruption (route change)
  Hazards.prototype._buildEruption = function () {
    var e = this.def.eruption, i;
    for (i = 0; i < 40; i++) { var sp = new THREE.Sprite(this.flameMat); sp.scale.set(6, 8, 1); sp.visible = false; this.group.add(sp); var m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), this.bombMat); m.visible = false; this.group.add(m); this.bombs.push({ sp: sp, mesh: m, on: false }); }
    if (!e) { this.erupt = null; return; }
    var N = this.N, tr = this.track, path = this.path, W = path.W, extra = 12;
    var za = Math.round(e.zone.a * N), zb = Math.round(e.zone.b * N);
    // the original mountain road: slabs on the left lane (+lat), drivable until the eruption
    var roadTex = U.tex.basaltRoad(), slabMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9, emissive: 0xff5a14, emissiveIntensity: 0.3, emissiveMap: roadTex }), slabs = [];
    for (var j = za + 12; j < zb - 12; j += 10) { tr.surfacePoint(j, W[j] / 2 + extra / 2 + 0.3, _v); var sl = new THREE.Mesh(new THREE.BoxGeometry(extra - 0.6, 0.5, 10.2), slabMat); sl.position.set(_v.x, _v.y + 0.02, _v.z); sl.rotation.y = Math.atan2(path.T[j].x, path.T[j].z); sl.receiveShadow = true; this.group.add(sl); slabs.push(sl); }
    // boulder wall across the new path, blown apart by the eruption
    var wj = Math.round(e.wall * N), boulders = [];
    for (var lat = -W[wj] / 2 + 1.5; lat <= W[wj] / 2 - 1.5; lat += 3.4) { tr.surfacePoint(wj, lat, _v); var r = 1.8 + this.rng.range(0, 0.9), bm = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), this.rockMat); bm.position.set(_v.x, _v.y + r * 0.6, _v.z); bm.rotation.set(this.rng() * 3, this.rng() * 3, 0); bm.castShadow = true; this.group.add(bm); boulders.push({ m: bm, r: r, ob: this.addObstacle(bm.position.x, bm.position.y, bm.position.z, r, wj * path.ds, lat), v: null }); }
    for (lat = -W[wj] / 2 + 3; lat <= W[wj] / 2 - 3; lat += 4) { tr.surfacePoint(wj + 2, lat, _v); var r2 = 1.4 + this.rng.range(0, 0.6), bm2 = new THREE.Mesh(new THREE.IcosahedronGeometry(r2, 1), this.rockMat); bm2.position.set(_v.x, _v.y + r2 * 0.6 + 2.6, _v.z); bm2.castShadow = true; this.group.add(bm2); boulders.push({ m: bm2, r: r2, ob: null, v: null }); }
    // lava flow that swallows the old road
    var flowMat = new THREE.MeshBasicMaterial({ map: U.tex.lava(), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    var flow = new THREE.Mesh(tr.strip(function (k) { return W[k] / 2 + 0.2; }, function (k) { return W[k] / 2 + extra + 0.2; }, [za + 6, zb - 6], 10), flowMat); flow.position.y = -0.15; this.group.add(flow);
    var cloud = []; for (i = 0; i < 12; i++) { var cs = new THREE.Sprite(this.smokeMat.clone()); cs.visible = false; this.group.add(cs); cloud.push(cs); }
    tr.setLimits(za + 16, zb - 16, W[za] / 2 - 0.5, null, 18);   // before the eruption only the old road lane is open
    this.erupt = { e: e, za: za, zb: zb, wj: wj, slabs: slabs, boulders: boulders, flowMat: flowMat, cloud: cloud, state: 'armed', t: 0, triggerS: this.S(e.trigger), crater: new THREE.Vector3(this.def.crater[0], this.def.crater[1], this.def.crater[2]), fountainT: 0, bombsSent: false, rocksBlown: false, routed: false, W: W[za] };
  };
  Hazards.prototype._startEruption = function () {
    var E = this.erupt; E.state = 'erupting'; E.t = 0;
    this.fx.addShake(0.45); this.audio.explode();
    this._burst(E.crater, 260);
    this.emit('eruption', { crater: E.crater });
  };
  Hazards.prototype._eruption = function (dt, t, world) {
    var E = this.erupt, i; if (!E) return;
    if (E.state === 'armed') {
      var karts = world.karts || [];
      for (i = 0; i < karts.length; i++) if (karts[i].s > E.triggerS && karts[i].s < E.triggerS + 400) { this._startEruption(); break; }
      return;
    }
    E.t += dt; var T = E.t;
    this.light = Math.min(1, T / 3);
    if (T < 8) this.fx.addShake(dt * (T < 1.5 ? 0.5 : 0.18));
    E.fountainT -= dt; if (E.fountainT <= 0) { E.fountainT = T < 10 ? 0.08 : 0.35; this._bomb(E.crater, (Math.random() - 0.5) * 40, 55 + Math.random() * 45, (Math.random() - 0.5) * 40, false); }
    for (i = 0; i < E.cloud.length; i++) {
      var c = E.cloud[i], f = Math.min(1, T / 10), ang = i / E.cloud.length * 6.28; c.visible = true;
      c.position.set(E.crater.x + Math.cos(ang + t * 0.05) * (40 + f * 160), E.crater.y + 30 + f * (120 + i * 18) + Math.sin(t * 0.3 + i) * 10, E.crater.z + Math.sin(ang + t * 0.05) * (40 + f * 160));
      var s = 70 + f * 300; c.scale.set(s, s * 0.8, 1); c.material.opacity = 0.75 * Math.min(1, T / 2);
    }
    if (T > 0.8 && !E.bombsSent) { E.bombsSent = true; this._targetedBombs(); this.audio.explode(); }
    if (T > 2.4 && !E.rocksBlown) { E.rocksBlown = true; this._blowWall(); this.audio.explode(); this.emit('newroute'); }
    if (T > 1.4) {
      E.flowMat.opacity = Math.min(1, (T - 1.4) / 3) * 0.95;
      for (i = 0; i < E.slabs.length; i++) { var sl = E.slabs[i], d = T - 1.4 - i * 0.1; if (d <= 0) continue; sl.position.y -= (d * 6 + 3) * dt; sl.rotation.x += dt * 0.35 * (i % 2 ? 1 : -1); sl.rotation.z += dt * 0.25; if (sl.position.y < -40) sl.visible = false; }
      if (!E.routed && T > 2.0) { E.routed = true; this.track.setLimits(E.za + 6, E.zb - 6, null, E.W / 2 - 0.8, 18); }
    }
    for (i = 0; i < E.boulders.length; i++) { var b = E.boulders[i]; if (!b.v) continue; b.v.y -= G * dt; b.m.position.addScaledVector(b.v, dt); b.m.rotation.x += dt * 3; b.m.rotation.y += dt * 2; if (b.m.position.y < -30) b.m.visible = false; }
  };
  Hazards.prototype._blowWall = function () {
    var E = this.erupt;
    for (var i = 0; i < E.boulders.length; i++) { var b = E.boulders[i]; b.v = new THREE.Vector3(this.rng.range(-14, 14), this.rng.range(10, 22), this.rng.range(-14, 14)); if (b.ob) { this.removeObstacle(b.ob); b.ob = null; } }
    this.fx.explosion(E.boulders[Math.floor(E.boulders.length / 2)].m.position, true);
  };
  Hazards.prototype._targetedBombs = function () {
    var E = this.erupt, self = this;
    (E.e.bombsAt || []).forEach(function (bt) {
      var target = new THREE.Vector3(), s = self.S(bt[0]); self.surf(s, bt[1], target);
      var T = 3.6;
      self._bomb(E.crater, (target.x - E.crater.x) / T, (target.y - E.crater.y) / T + G * T / 2, (target.z - E.crater.z) / T, true, target, s, bt[1]);
    });
  };
  /** after the eruption: glowing rocks rain down into the lava beside the last sections */
  Hazards.prototype._meteors = function (dt) {
    var E = this.erupt; if (!E || E.state !== 'erupting' || this.ps < this.S(0.80)) return;
    this.meteorT -= dt; if (this.meteorT > 0) return;
    this.meteorT = this.rng.range(1.2, 2.4);
    var s = Math.min(this.ps + this.rng.range(60, 220), this.L - 5), lat = (this.rng() < 0.5 ? -1 : 1) * this.rng.range(40, 120);
    var target = new THREE.Vector3(); this.surf(s, lat, target); target.y = Math.max(0.5, target.y - 30);
    var start = new THREE.Vector3(target.x + this.rng.range(-200, 200), target.y + 220, target.z + this.rng.range(-200, 200)), T = 2.6;
    this._bomb(start, (target.x - start.x) / T, (target.y - start.y) / T + G * T / 2, (target.z - start.z) / T, false, target);
  };

  // ---------------------------------------------------------------- bridge shake, waterfall sparks
  Hazards.prototype._bridge = function (dt) {
    var bs = this.def.bridgeShake; if (!bs || !this.player) return;
    if (this.ps < this.S(bs[0]) || this.ps > this.S(bs[1])) return;
    this.shakeT -= dt; if (this.shakeT <= 0) { this.shakeT = 0.3; this.fx.addShake(0.05); }
    if (Math.random() < dt * 3) { var j = this.path.idxOf(this.ps + 10), sd = Math.random() < 0.5 ? -1 : 1; this.track.surfacePoint(j, sd * (this.path.W[j] / 2 - 0.5), _v); this.fx.dust(_v, _v2.set(0, 0, 0)); }
  };
  Hazards.prototype._sparks = function (dt) {
    var src = this.def.sparks; if (!src || !this.player) return;
    this.sparkT -= dt; if (this.sparkT > 0) return; this.sparkT = 0.1;
    for (var i = 0; i < src.length; i++) { var s = this.S(src[i].a); if (Math.abs(s - this.ps) > 90) continue; this.surf(s + this.rng.range(-8, 8), src[i].lat, _v); _v.y += this.rng.range(2, 40); this.fx.sparks(_v, 2, 0xffb040, 6); }
  };

  // ---------------------------------------------------------------- solid obstacles vs local karts
  Hazards.prototype.collide = function (karts) {
    var obs = this.obstacles; if (!obs.length || !karts) return;
    for (var k = 0; k < karts.length; k++) {
      var kt = karts[k]; if (kt.remote) continue;
      for (var i = 0; i < obs.length; i++) {
        var ob = obs[i]; if (ob.off) continue;
        var ds = ob.s - kt.s; if (ds < -14 || ds > 14) continue;
        var dx = kt.pos.x - ob.x, dz = kt.pos.z - ob.z, d = Math.sqrt(dx * dx + dz * dz), R = ob.r + 1.25;
        if (d >= R || d < 1e-4) continue;
        if (kt.pos.y > ob.y + ob.r + 0.6 || kt.pos.y < ob.y - ob.r - 2.5) continue;
        var nx = dx / d, nz = dz / d; kt.pos.x += nx * (R - d); kt.pos.z += nz * (R - d);
        var vn = kt.vel.x * nx + kt.vel.z * nz;
        if (vn < 0) {
          kt.vel.x -= nx * vn * 1.5; kt.vel.z -= nz * vn * 1.5;
          var imp = -vn;
          if (imp > 3 && kt.hitCooldown <= 0) { kt.hitCooldown = 0.3; kt.vel.multiplyScalar(1 - U.clamp(imp / 30, 0.08, 0.35)); kt.events.push({ type: 'wall', impact: imp * 0.6, side: 1 }); }
        }
      }
    }
  };

  Hazards.prototype.update = function (dt, t, world) {
    this.player = world.player || null; this.ps = this.player ? this.player.s : 0; this.time += dt;
    if (!world.raceOn) { this._splashes(dt, t, { karts: [] }); this._bombs(dt); return; }
    this._rockfalls(dt, world); this._pebbles(dt); this._splashes(dt, t, world); this._cracks(dt, t); this._cliffs(dt);
    this._tremors(dt); this._eruption(dt, t, world); this._bombs(dt); this._meteors(dt); this._bridge(dt); this._sparks(dt);
    this.collide(world.localKarts || world.karts);
  };
  Hazards.prototype.dispose = function () {
    this.scene.remove(this.group);
    this.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    this.obstacles.length = 0;
    this.track.setLimits(0, this.N - 1, null, null, 1);
  };

  global.Hazards = Hazards;
})(window);
