/* ============================================================
   NITRO RUSH - items: boxes, rockets, traps, lightning, shield
   ============================================================ */
(function (global) {
  'use strict';

  var ITEMS = {
    speed: { name: 'SPEED BOOST', color: 0xffa640 },
    shield: { name: 'SHIELD', color: 0x66ccff },
    rocket: { name: 'ROCKET', color: 0xff4d4d },
    trap: { name: 'SPIKE TRAP', color: 0xb388ff },
    lightning: { name: 'LIGHTNING', color: 0xfff176 }
  };

  var _t = new THREE.Vector3(), _t2 = new THREE.Vector3();

  function ItemManager(scene, track, fx, audio) {
    this.scene = scene; this.track = track; this.path = track.path; this.fx = fx; this.audio = audio;
    this.group = new THREE.Group(); scene.add(this.group);
    this.boxes = []; this.rockets = []; this.traps = [];
    this.enabled = true;
    this.trapSeq = 0; this.remoteRockets = [];
    this._buildBoxes();
    this.rocketGeo = this._makeRocketGeo();
    this.trapGeo = this._makeTrapGeo();
  }

  ItemManager.prototype._buildBoxes = function () {
    var path = this.path, track = this.track, self = this;
    var geo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
    var inner = new THREE.OctahedronGeometry(0.42, 0);
    var innerMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffb300, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.6 });
    (this.track.def.itemRows || []).forEach(function (fr, row) {
      var s = fr * path.length, sm = path.sample(s), idx = sm.idx;
      var hw = path.W[idx] / 2 - 2.5;
      var k = Math.max(3, Math.min(5, Math.floor(path.W[idx] / 5)));
      for (var i = 0; i < k; i++) {
        var lat = -hw + (2 * hw) * (k === 1 ? 0.5 : i / (k - 1));
        var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.4, emissive: 0x3388ff, emissiveIntensity: 0.5, depthWrite: false });
        var m = new THREE.Mesh(geo, mat); m.castShadow = true;
        var im = new THREE.Mesh(inner, innerMat); m.add(im);
        var pos = new THREE.Vector3().copy(sm.pos).addScaledVector(sm.right, lat); pos.y += track.hExtra[idx] + 1.1;
        m.position.copy(pos);
        self.group.add(m);
        self.boxes.push({ mesh: m, inner: im, pos: pos, s: s, lat: lat, active: true, timer: 0, phase: Math.random() * 6.28, hue: (row * 0.13 + i * 0.07) % 1 });
      }
    });
  };

  ItemManager.prototype._makeRocketGeo = function () {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 10).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.3, metalness: 0.4 }));
    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 10).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }));
    nose.position.z = 0.85;
    g.add(body); g.add(nose);
    for (var i = 0; i < 3; i++) {
      var fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0xffe066 }));
      fin.position.z = -0.45; fin.rotation.z = i * Math.PI * 2 / 3; fin.position.x = Math.sin(i * Math.PI * 2 / 3) * 0.3; fin.position.y = Math.cos(i * Math.PI * 2 / 3) * 0.3;
      g.add(fin);
    }
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.tex.particle(), color: 0xff8855, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
    glow.scale.set(2.5, 2.5, 1); glow.position.z = -0.9; g.add(glow);
    return g;
  };

  ItemManager.prototype._makeTrapGeo = function () {
    var g = new THREE.Group();
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), new THREE.MeshStandardMaterial({ color: 0x2a2140, roughness: 0.5, metalness: 0.5 }));
    core.position.y = 0.5; g.add(core);
    var spikeMat = new THREE.MeshStandardMaterial({ color: 0xb388ff, emissive: 0x7c4dff, emissiveIntensity: 0.5, roughness: 0.3 });
    for (var i = 0; i < 8; i++) {
      var sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6), spikeMat);
      var a = i / 8 * Math.PI * 2;
      sp.position.set(Math.cos(a) * 0.65, 0.5 + Math.sin(a * 2) * 0.2, Math.sin(a) * 0.65);
      sp.lookAt(Math.cos(a) * 3, 0.5 + Math.sin(a * 2) * 0.6, Math.sin(a) * 3); sp.rotateX(Math.PI / 2);
      g.add(sp);
    }
    var top = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6), spikeMat); top.position.y = 1.2; g.add(top);
    var light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 })); light.position.y = 1.5; light.name = 'trapLight'; g.add(light);
    return g;
  };

  /** speed race: hide the boxes and ignore pickups */
  ItemManager.prototype.setEnabled = function (on) {
    this.enabled = on;
    this.boxes.forEach(function (b) { b.mesh.visible = on && b.active; });
  };

  ItemManager.prototype.clear = function () {
    var self = this;
    this.rockets.forEach(function (r) { self.group.remove(r.mesh); });
    this.traps.forEach(function (t) { self.group.remove(t.mesh); });
    this.rockets = []; this.traps = [];
    this.boxes.forEach(function (b) { b.active = true; b.timer = 0; b.mesh.visible = true; b.mesh.scale.set(1, 1, 1); });
  };

  ItemManager.prototype.dispose = function () {
    this.scene.remove(this.group);
  };

  /** random item weighted by rank position (0 = leader, 1 = last) */
  /** rank-weighted: leaders get defensive items, the back of the pack gets catch-up firepower */
  ItemManager.prototype.randomItem = function (r) {
    // weights at the front (r=0), the middle (r=0.5) and the back (r=1)
    var front = { speed: 12, shield: 42, rocket: 4, trap: 42, lightning: 0 };
    var mid = { speed: 30, shield: 18, rocket: 30, trap: 12, lightning: 10 };
    var back = { speed: 30, shield: 4, rocket: 30, trap: 0, lightning: 36 };
    var w = {}, k;
    for (k in mid) {
      w[k] = r < 0.5 ? front[k] + (mid[k] - front[k]) * (r / 0.5) : mid[k] + (back[k] - mid[k]) * ((r - 0.5) / 0.5);
    }
    var total = 0, k; for (k in w) total += w[k];
    var x = Math.random() * total;
    for (k in w) { x -= w[k]; if (x <= 0) return k; }
    return 'speed';
  };

  ItemManager.prototype._near = function (pos, player) {
    if (!player) return 1;
    var d = pos.distanceTo(player.pos);
    return d < 90 ? 1 - d / 120 : 0;
  };

  /** team race: teammates never hit each other with rockets / traps / lightning */
  function sameTeam(a, b) { return !!(a && b && a !== b && a.team >= 0 && a.team === b.team); }

  /** kart uses its item. Returns true if used. */
  ItemManager.prototype.use = function (kart, world) {
    if (!this.enabled || !kart.item || kart.itemRoulette > 0 || !world.raceOn || kart.spinTime > 0) return false;
    var type = kart.item, karts = world.karts, path = this.path, L = path.length;
    kart.item = null; kart.itemsUsed++;
    var P = Kart.PARAMS, near = this._near(kart.pos, world.player), isP = kart.isPlayer;
    var au = this.audio;
    if (type === 'speed') {
      kart.applyBoost(P.itemBoost[0], P.itemBoost[1], 'item');
      if (isP || near > 0.4) au.boost(3);
    } else if (type === 'shield') {
      kart.shieldTime = 8;
      if (isP || near > 0.4) au.shield();
    } else if (type === 'rocket') {
      if (world.net && !world.net.isHost) { world.sendEvent({ kind: 'rocket', from: kart.netId }); }
      else this.spawnRocket(kart, karts);
      if (isP || near > 0.2) au.rocket();
    } else if (type === 'trap') {
      var tm = this.trapGeo.clone();
      var tl = tm.getObjectByName('trapLight'); tl.material = tl.material.clone(); tm.userData.light = tl;
      var back = kart.forward(_t).multiplyScalar(-3.2);
      var sBack = path.wrap(kart.s - 3.2);
      var sm = path.sample(sBack);
      var lat = U.clamp(kart.lat, this.track.minLat[sm.idx] + 1.5, this.track.maxLat[sm.idx] - 1.5);
      tm.position.copy(sm.pos).addScaledVector(sm.right, lat); tm.position.y += this.track.hExtra[sm.idx];
      this.group.add(tm);
      var tid = (kart.netId >= 0 ? kart.netId : 900) * 1000 + (++this.trapSeq);
      this.traps.push({ mesh: tm, pos: tm.position.clone(), s: sBack, lat: lat, owner: kart, life: 30, age: 0, tid: tid });
      if (world.sendEvent) world.sendEvent({ kind: 'trap', tid: tid, s: sBack, lat: lat, owner: kart.netId });
      if (isP || near > 0.3) au.trap();
    } else if (type === 'lightning') {
      this.applyZap(kart.pos.x, kart.pos.z, kart.progress(L), kart, world);
      if (world.sendEvent) world.sendEvent({ kind: 'zap', x: +kart.pos.x.toFixed(1), z: +kart.pos.z.toFixed(1), p: +kart.progress(L).toFixed(1), from: kart.netId });
      if (isP || near > 0.2) au.zap();
    }
    function kp2(k) { return k.progress(L); }
    return true;
  };

  ItemManager.prototype.update = function (dt, world) {
    var karts = world.karts, player = world.player, t = world.clock, path = this.path, L = path.length, fx = this.fx, au = this.audio;
    var i, j, b, k;
    // ---- boxes ----------------------------------------------------------
    for (i = 0; i < this.boxes.length; i++) {
      b = this.boxes[i];
      if (!this.enabled) { b.mesh.visible = false; continue; }
      b.mesh.rotation.y = t * 1.3 + b.phase; b.mesh.rotation.x = t * 0.7 + b.phase;
      b.inner.rotation.y = -t * 2;
      b.mesh.position.y = b.pos.y + Math.sin(t * 2.2 + b.phase) * 0.15;
      b.mesh.material.color.setHSL((t * 0.15 + b.hue) % 1, 0.7, 0.75);
      b.mesh.material.emissive.setHSL((t * 0.15 + b.hue + 0.3) % 1, 0.9, 0.35);
      if (!b.active) {
        b.timer -= dt;
        if (b.timer <= 0) { b.active = true; b.mesh.visible = true; }
        else { var sc = Math.max(0.001, 1 - b.timer / 4); b.mesh.scale.set(sc, sc, sc); b.mesh.visible = b.timer < 4; }
        continue;
      }
      b.mesh.scale.set(1, 1, 1);
      if (!world.raceOn) continue;
      var pick = world.localKarts || karts;
      for (j = 0; j < pick.length; j++) {
        k = pick[j];
        if (k.item || k.itemRoulette > 0 || k.finished) continue;
        var dx = k.pos.x - b.pos.x, dz = k.pos.z - b.pos.z, dy = k.pos.y - (b.pos.y - 1.1);
        if (dx * dx + dz * dz < 5.3 && Math.abs(dy) < 3) {
          b.active = false; b.timer = 5; b.mesh.visible = false;
          if (world.sendEvent) world.sendEvent({ kind: 'box', i: i });
          k.itemRoulette = k.isPlayer ? 1.1 : 0.8;
          k.pendingRank = k.rank;
          fx.pickup(b.pos);
          if (k.isPlayer) au.pickup(); else if (this._near(b.pos, player) > 0.5) au.pickup();
          break;
        }
      }
    }
    // ---- roulette completion --------------------------------------------
    var n = karts.length;
    for (j = 0; j < n; j++) {
      k = karts[j];
      if (k.itemRoulette > 0) {
        k.itemRoulette -= dt;
        if (k.itemRoulette <= 0) {
          k.itemRoulette = 0;
          var r = n > 1 ? (k.rank - 1) / (n - 1) : 0;
          k.item = this.randomItem(r);
          if (k.isPlayer && world.onPlayerItem) world.onPlayerItem(k.item);
        }
      }
    }
    // ---- rockets ----------------------------------------------------------
    for (i = this.rockets.length - 1; i >= 0; i--) {
      var rk = this.rockets[i];
      rk.life -= dt; rk.age += dt;
      rk.s = path.wrap(rk.s + rk.speed * dt);
      var tgt = rk.target;
      if (tgt) {
        var dAhead = tgt.progress(L) - (rk.owner.progress(L) - (rk.owner.s - rk.s > L / 2 ? 0 : 0));
        var dLat = tgt.lat;
        rk.lat = U.damp(rk.lat, dLat, 3.5, dt);
        // give up if target got far ahead
        var gap = ((tgt.s - rk.s) % L + L) % L; if (gap > L / 2) gap -= L;
        if (gap > 300 || gap < -40) rk.target = null;
      } else rk.lat = U.damp(rk.lat, 0, 2, dt);
      var sm = path.sample(rk.s, rk._sm || (rk._sm = {}));
      var idx = sm.idx;
      rk.lat = U.clamp(rk.lat, this.track.minLat[idx] + 1.5, this.track.maxLat[idx] - 1.5);
      rk.mesh.position.copy(sm.pos).addScaledVector(sm.right, rk.lat); rk.mesh.position.y += this.track.hExtra[idx] + 0.9;
      _t.copy(sm.tan); if (rk.target) _t.addScaledVector(sm.right, (rk.target.lat - rk.lat) * 0.05);
      _t2.copy(rk.mesh.position).add(_t);
      rk.mesh.lookAt(_t2);
      rk.mesh.rotation.z += 0; 
      if (Math.random() < 0.9) fx.boostFlame(rk.mesh.position, _t.clone().negate(), 0.9, 0xff5a2a);
      var hit = null;
      for (j = 0; j < n; j++) {
        k = karts[j];
        if (k === rk.owner && rk.age < 1.0) continue;
        if (sameTeam(k, rk.owner)) continue;
        var gs = ((k.s - rk.s) % L + L) % L; if (gs > L / 2) gs -= L;
        if (Math.abs(gs) < 2.4 && Math.abs(k.lat - rk.lat) < 2.2 && Math.abs(k.pos.y - rk.mesh.position.y) < 3) { hit = k; break; }
      }
      if (hit || rk.life <= 0) {
        fx.explosion(rk.mesh.position, !!hit);
        if (hit) {
          if (hit.remote) { if (world.sendEvent) world.sendEvent({ kind: 'hit', id: hit.netId, src: 'rocket' }); }
          else { hit.spinOut('rocket'); if (hit.isPlayer && world.onPlayerHit) world.onPlayerHit('rocket'); }
        }
        if (world.sendEvent) world.sendEvent({ kind: 'boom', x: +rk.mesh.position.x.toFixed(1), y: +rk.mesh.position.y.toFixed(1), z: +rk.mesh.position.z.toFixed(1) });
        if (this._near(rk.mesh.position, player) > 0 || (hit && hit.isPlayer)) au.explode();
        this.group.remove(rk.mesh); this.rockets.splice(i, 1);
      }
    }
    // ---- traps ---------------------------------------------------------------
    for (i = this.traps.length - 1; i >= 0; i--) {
      var tr = this.traps[i];
      tr.life -= dt; tr.age += dt;
      tr.mesh.rotation.y = t * 1.5;
      tr.mesh.userData.light.material.color.setHex(Math.floor(t * 4) % 2 ? 0xff2020 : 0x550000);
      if (tr.life < 3) tr.mesh.visible = Math.floor(t * 8) % 2 === 0;
      var got = null, cand = world.localKarts || karts;
      for (j = 0; j < cand.length; j++) {
        k = cand[j];
        if (k === tr.owner && tr.age < 1.2) continue;
        if (sameTeam(k, tr.owner)) continue;
        if (k.airborne && k.pos.y - tr.pos.y > 1.5) continue;
        var ddx = k.pos.x - tr.pos.x, ddz = k.pos.z - tr.pos.z;
        if (ddx * ddx + ddz * ddz < 3.6) { got = k; break; }
      }
      if (got || tr.life <= 0) {
        if (got) {
          fx.explosion(tr.pos, false);
          got.spinOut('trap');
          if (got.isPlayer && world.onPlayerHit) world.onPlayerHit('trap');
          if (got.isPlayer || this._near(tr.pos, player) > 0.3) au.explode();
          if (world.sendEvent) world.sendEvent({ kind: 'trapHit', tid: tr.tid });
        }
        this.group.remove(tr.mesh); this.traps.splice(i, 1);
      }
    }
  };

  // ------------------------------------------------------------ network helpers
  ItemManager.prototype.spawnRocket = function (kart, karts) {
    var L = this.path.length, best = null, bestD = 1e9, kp = kart.progress(L);
    for (var i = 0; i < karts.length; i++) {
      var o = karts[i]; if (o === kart || sameTeam(o, kart)) continue;
      var d = o.progress(L) - kp;
      if (d > 1 && d < 260 && d < bestD) { bestD = d; best = o; }
    }
    var mesh = this.rocketGeo.clone();
    mesh.position.copy(kart.pos); mesh.position.y += 0.9;
    this.group.add(mesh);
    this.rockets.push({ mesh: mesh, s: kart.s, lat: kart.lat, speed: Math.max(kart.speed + 30, 72), target: best, owner: kart, life: 7, age: 0 });
  };

  ItemManager.prototype.applyZap = function (x, z, prog, from, world) {
    var karts = world.localKarts || world.karts, L = this.path.length, hitAny = false;
    for (var i = 0; i < karts.length; i++) {
      var ok = karts[i]; if (ok === from || ok.remote || sameTeam(ok, from)) continue;
      var dx = ok.pos.x - x, dz = ok.pos.z - z, ahead = ok.progress(L) - prog;
      if (dx * dx + dz * dz < 75 * 75 || (ahead > 0 && ahead < 75)) {
        if (ok.stun(2.6)) { this.fx.zapRing(ok.pos); hitAny = true; if (ok.isPlayer && world.onPlayerHit) world.onPlayerHit('lightning'); }
      }
    }
    this.fx.zapRing(new THREE.Vector3(x, 0.5, z));
    return hitAny;
  };

  ItemManager.prototype.addRemoteTrap = function (tid, s, lat, ownerKart) {
    for (var i = 0; i < this.traps.length; i++) if (this.traps[i].tid === tid) return;
    var tm = this.trapGeo.clone();
    var tl = tm.getObjectByName('trapLight'); tl.material = tl.material.clone(); tm.userData.light = tl;
    var sm = this.path.sample(s);
    tm.position.copy(sm.pos).addScaledVector(sm.right, lat); tm.position.y += this.track.hExtra[sm.idx];
    this.group.add(tm);
    this.traps.push({ mesh: tm, pos: tm.position.clone(), s: s, lat: lat, owner: ownerKart || null, life: 30, age: 0, tid: tid });
  };

  ItemManager.prototype.removeTrap = function (tid) {
    for (var i = 0; i < this.traps.length; i++) if (this.traps[i].tid === tid) { this.group.remove(this.traps[i].mesh); this.traps.splice(i, 1); return; }
  };

  ItemManager.prototype.takeBox = function (i) {
    var b = this.boxes[i]; if (!b || !b.active) return;
    b.active = false; b.timer = 5; b.mesh.visible = false;
  };

  /** clients mirror the host's rockets as simple proxies */
  ItemManager.prototype.setRemoteRockets = function (list) {
    list = list || [];
    while (this.remoteRockets.length < list.length) { var m = this.rocketGeo.clone(); this.group.add(m); this.remoteRockets.push({ mesh: m, init: false }); }
    while (this.remoteRockets.length > list.length) { var r = this.remoteRockets.pop(); this.group.remove(r.mesh); }
    for (var i = 0; i < list.length; i++) {
      var rr = this.remoteRockets[i], p = list[i];
      if (!rr.init) { rr.mesh.position.set(p.x, p.y, p.z); rr.init = true; }
      rr.target = p;
    }
  };
  ItemManager.prototype.updateRemoteRockets = function (dt) {
    for (var i = 0; i < this.remoteRockets.length; i++) {
      var rr = this.remoteRockets[i], p = rr.target; if (!p) continue;
      _t.set(p.x, p.y, p.z);
      rr.mesh.position.lerp(_t, 1 - Math.exp(-14 * dt));
      _t2.set(p.x + p.dx, p.y, p.z + p.dz); rr.mesh.lookAt(_t2);
      if (Math.random() < 0.8) this.fx.boostFlame(rr.mesh.position, _t.set(-p.dx, 0, -p.dz), 0.9, 0xff5a2a);
    }
  };
  ItemManager.prototype.rocketStates = function () {
    return this.rockets.map(function (r) { var d = new THREE.Vector3(); r.mesh.getWorldDirection(d); return { x: +r.mesh.position.x.toFixed(1), y: +r.mesh.position.y.toFixed(1), z: +r.mesh.position.z.toFixed(1), dx: +d.x.toFixed(2), dz: +d.z.toFixed(2) }; });
  };

  global.ITEMS = ITEMS;
  global.ItemManager = ItemManager;
})(window);
