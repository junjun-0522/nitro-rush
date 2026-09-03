/* ============================================================
   NITRO RUSH - Kart: original low-poly kart mesh + arcade physics
   ============================================================ */
(function (global) {
  'use strict';

  var PARAMS = {
    maxSpeed: 46, maxReverse: 12, accel: 19, brake: 46, coast: 7,
    steerRate: 2.3, steerLowSpeed: 7,
    gripNormal: 10, gripDrift: 3.0, gripDirt: 6, gripAir: 0.3,
    driftMinSpeed: 10, driftYaw: 1.45, driftSteerYaw: 0.85, driftSpeedLoss: 0.1,
    driftTierTimes: [0.8, 1.8, 2.9],
    driftBoost: [[1.14, 0.9], [1.22, 1.4], [1.32, 2.0]],
    driftGaugeGain: [0.22, 0.4, 0.6],
    gaugeBoost: [1.38, 2.4],
    padBoost: [1.25, 1.3],
    itemBoost: [1.48, 2.6],
    dirtSpeed: 0.7, gravity: 28, radius: 1.45, wallHalf: 1.0
  };

  var _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _tmp = new THREE.Vector3(), _tmp2 = new THREE.Vector3();
  var _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
  var UPV = new THREE.Vector3(0, 1, 0);

  // ------------------------------------------------------------ mesh
  var _geo = {};
  function G(key, make) { return _geo[key] || (_geo[key] = make()); }

  function buildKartMesh(color, accent, isPlayer, variant, charId) {
    var root = new THREE.Group();
    var body = new THREE.Group(); root.add(body);
    var paint = new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.25 });
    var acc = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4, metalness: 0.2 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x1d1f26, roughness: 0.7, metalness: 0.3 });
    var chrome = new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.2, metalness: 0.9 });
    var rubber = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.95 });
    var skin = new THREE.MeshStandardMaterial({ color: 0xffd9b3, roughness: 0.8 });
    var visor = new THREE.MeshStandardMaterial({ color: 0x66e0ff, roughness: 0.1, metalness: 0.6, emissive: 0x1a5fff, emissiveIntensity: 0.3 });
    var lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c0, emissiveIntensity: 1.2 });
    var tailMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 1.0 });

    function add(geo, mat, x, y, z, parent) {
      var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || body).add(m); return m;
    }
    variant = variant || 0;
    // chassis floor
    add(G('floor', function () { return new THREE.BoxGeometry(1.5, 0.12, 2.5); }), dark, 0, 0.32, 0);
    // main tub
    var tub = add(G('tub', function () { return new THREE.BoxGeometry(1.1, 0.42, 1.5); }), paint, 0, 0.55, -0.15);
    // nose (tapered): scale a box
    var nose = add(G('nose', function () { var g = new THREE.BoxGeometry(0.9, 0.32, 1.1); var p = g.getAttribute('position'); for (var i = 0; i < p.count; i++) { if (p.getZ(i) > 0) { p.setX(i, p.getX(i) * 0.55); p.setY(i, p.getY(i) * 0.6 - 0.05); } } g.computeVertexNormals(); return g; }), paint, 0, 0.55, 1.05);
    // front bumper / wing
    add(G('wing', function () { return new THREE.BoxGeometry(1.7, 0.1, 0.4); }), acc, 0, 0.36, 1.45);
    add(G('wingLip', function () { return new THREE.BoxGeometry(1.7, 0.16, 0.08); }), acc, 0, 0.42, 1.62);
    // side pods
    add(G('pod', function () { return new THREE.BoxGeometry(0.35, 0.3, 1.0); }), acc, -0.72, 0.5, -0.1);
    add(G('pod', function () { return new THREE.BoxGeometry(0.35, 0.3, 1.0); }), acc, 0.72, 0.5, -0.1);
    // engine block
    add(G('engine', function () { return new THREE.BoxGeometry(0.8, 0.45, 0.6); }), dark, 0, 0.62, -0.95);
    add(G('engineTop', function () { return new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8); }), chrome, 0.2, 0.9, -0.95);
    add(G('engineTop', function () { return new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8); }), chrome, -0.2, 0.9, -0.95);
    // exhausts
    var exL = add(G('exh', function () { return new THREE.CylinderGeometry(0.09, 0.11, 0.5, 8).rotateX(Math.PI / 2); }), chrome, -0.32, 0.5, -1.35);
    var exR = add(G('exh', function () { return new THREE.CylinderGeometry(0.09, 0.11, 0.5, 8).rotateX(Math.PI / 2); }), chrome, 0.32, 0.5, -1.35);
    // rear spoiler
    add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), dark, -0.55, 1.05, -1.15);
    add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), dark, 0.55, 1.05, -1.15);
    var spoiler = add(G('spoiler', function () { return new THREE.BoxGeometry(1.7, 0.08, 0.45); }), acc, 0, 1.3, -1.15);
    spoiler.rotation.x = -0.2;
    // headlights & tail lights
    add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), lampMat, -0.28, 0.5, 1.6);
    add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), lampMat, 0.28, 0.5, 1.6);
    add(G('tail', function () { return new THREE.BoxGeometry(0.7, 0.08, 0.05); }), tailMat, 0, 0.72, -1.27);
    // seat + driver
    add(G('seat', function () { return new THREE.BoxGeometry(0.62, 0.55, 0.22); }), dark, 0, 0.9, -0.55);
    var driver = buildDriver(charId, accent);
    driver.group.position.set(0, 1.2, -0.35); body.add(driver.group);
    var head = driver.group;
    add(G('arm', function () { return new THREE.BoxGeometry(0.12, 0.12, 0.5); }), skin, -0.28, 0.95, 0.0);
    add(G('arm', function () { return new THREE.BoxGeometry(0.12, 0.12, 0.5); }), skin, 0.28, 0.95, 0.0);
    var wheelRing = add(G('swheel', function () { return new THREE.TorusGeometry(0.17, 0.035, 6, 14); }), dark, 0, 1.0, 0.28);
    wheelRing.rotation.x = -1.1;
    // stripes for the player / decoration for AI
    if (isPlayer) {
      add(G('stripe', function () { return new THREE.BoxGeometry(0.28, 0.02, 2.4); }), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), 0, 0.77, 0.15);
      add(G('stripe2', function () { return new THREE.BoxGeometry(0.08, 0.02, 2.4); }), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), 0.3, 0.77, 0.15);
      add(G('stripe2', function () { return new THREE.BoxGeometry(0.08, 0.02, 2.4); }), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), -0.3, 0.77, 0.15);
      // roof flag / antenna
      var ant = add(G('ant', function () { return new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4); }), chrome, -0.6, 1.5, -1.0);
      add(G('flag', function () { return new THREE.BoxGeometry(0.02, 0.28, 0.42); }), new THREE.MeshBasicMaterial({ color: 0xffe600 }), -0.6, 2.0, -0.8);
    } else if (variant % 3 === 1) {
      add(G('stripeX', function () { return new THREE.BoxGeometry(1.1, 0.02, 0.3); }), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), 0, 0.77, 0.4);
    } else if (variant % 3 === 2) {
      add(G('stripeD', function () { return new THREE.BoxGeometry(0.2, 0.02, 2.4); }), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }), 0.25, 0.77, 0.15);
    }

    // wheels
    var wheelGeo = G('wheel', function () { return new THREE.CylinderGeometry(0.33, 0.33, 0.32, 14).rotateZ(Math.PI / 2); });
    var hubGeo = G('hub', function () { return new THREE.CylinderGeometry(0.2, 0.2, 0.34, 8).rotateZ(Math.PI / 2); });
    var wheels = [], pivots = [];
    var wpos = [[-0.82, 0.33, 0.9], [0.82, 0.33, 0.9], [-0.86, 0.33, -0.85], [0.86, 0.33, -0.85]];
    wpos.forEach(function (p, i) {
      var piv = new THREE.Group(); piv.position.set(p[0], p[1], p[2]); root.add(piv);
      var w = new THREE.Mesh(wheelGeo, rubber); w.castShadow = true; piv.add(w);
      var hub = new THREE.Mesh(hubGeo, isPlayer ? new THREE.MeshStandardMaterial({ color: accent, roughness: 0.3, metalness: 0.6 }) : chrome); w.add(hub);
      wheels.push(w); pivots.push(piv);
    });

    // boost flames
    var flameMat = new THREE.MeshBasicMaterial({ color: 0xffa640, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    var flameGeo = G('flame', function () { return new THREE.ConeGeometry(0.16, 1.4, 8).rotateX(-Math.PI / 2).translate(0, 0, -0.7); });
    var flames = [];
    [exL, exR].forEach(function (ex) {
      var f = new THREE.Mesh(flameGeo, flameMat); f.position.copy(ex.position); f.position.z -= 0.25; f.visible = false; body.add(f);
      var g2 = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      g2.scale.set(0.6, 0.6, 0.7); f.add(g2);
      flames.push(f);
    });
    // shield bubble
    var shield = new THREE.Mesh(G('shield', function () { return new THREE.SphereGeometry(1.9, 18, 14); }), new THREE.MeshStandardMaterial({ color: 0x66ccff, emissive: 0x2288ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide }));
    shield.position.y = 0.8; shield.visible = false; root.add(shield);
    // underglow sprite (adds pop)
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.tex.particle(), color: accent, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(4, 2.2, 1); glow.position.y = 0.15; root.add(glow);

    return { root: root, body: body, wheels: wheels, pivots: pivots, flames: flames, shield: shield, glow: glow, exhausts: [exL, exR], paint: paint, head: head };
  }

  // ------------------------------------------------------------ Kart
  function Kart(opts) {
    this.name = opts.name; this.isPlayer = !!opts.isPlayer; this.index = opts.index;
    this.remote = !!opts.remote; this.netId = opts.netId !== undefined ? opts.netId : -1;
    this.netTarget = null; this.netTime = 0; this.netInit = false;
    this.color = opts.color; this.accent = opts.accent;
    this.charId = opts.char || 'volt'; this.petId = opts.pet || null;
    this.charDef = findChar(this.charId);
    this.mesh = buildKartMesh(opts.color, opts.accent, this.isPlayer, opts.index, this.charId);
    // stat multipliers: character + pet perk
    var st = { speed: 1, accel: 1, handling: 1, gauge: 1, boostDur: 1 }, cs = this.charDef.stat, k;
    for (k in cs) st[k] *= cs[k];
    this.pet = this.petId ? buildPet(this.petId) : null;
    if (this.pet) { for (k in this.pet.def.perk) st[k] *= this.pet.def.perk[k]; this.petRoot = this.pet.root; this.petPos = new THREE.Vector3(); this.petInit = false; }
    else this.petRoot = null;
    this.statMul = st; this.mass = this.charDef.mass || 1;
    this.root = this.mesh.root;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.yaw = 0; this.hint = -1; this.proj = {};
    this.upSmooth = new THREE.Vector3(0, 1, 0);
    this.input = { throttle: 0, brake: 0, steer: 0, drift: false, boost: false, item: false, respawn: false };
    this.events = [];
    this.speedScale = 1;   // rubber-band multiplier (AI)
    this.skill = 1;
    this.reset();
  }

  Kart.prototype.reset = function () {
    this.vel.set(0, 0, 0); this.vf = 0; this.vl = 0; this.speed = 0;
    this.s = 0; this.lat = 0; this.idx = 0; this.prevS = 0;
    this.lapsCompleted = 0; this.cpPassed = 0; this.lapTimes = []; this.lapStart = 0;
    this.finished = false; this.finishTime = 0; this.rank = 1;
    this.item = null; this.itemRoulette = 0;
    this.boostGauge = 0; this.boostStock = 0; this.boostTime = 0; this.boostMul = 1; this.boostKind = '';
    if (this.maxStock === undefined) { this.maxStock = 1; this.gaugeMul = 1; }
    this.drifting = false; this.driftDir = 0; this.driftCharge = 0; this.driftTier = 0;
    this.airborne = false; this.vy = 0; this.prevY = 0;
    this.shieldTime = 0; this.stunTime = 0; this.spinTime = 0; this.spinDir = 1; this.invulnTime = 0; this.hitCooldown = 0;
    this.offroad = false; this.wallContact = 0; this.stuckTime = 0; this.respawnCooldown = 0; this.wrongWay = 0;
    this.lastGoodS = 0; this.lastGoodLat = 0;
    this.wheelSpin = 0; this.steerVis = 0; this.yawRate = 0; this.accVis = 0;
    this.upSmooth.set(0, 1, 0);
    this.itemsUsed = 0; this.hits = 0;
    this.stats = { drifts: 0, driftBoosts: 0, gaugeBoosts: 0, pads: 0, walls: 0, spins: 0, respawns: 0, jumps: 0 };
    this.aiState = null;
  };

  Kart.prototype.placeAt = function (path, s, lat) {
    this.reset();
    path.posAt(s, lat, this.pos);
    this.yaw = path.yawAt(s);
    this.hint = path.idxOf(s); this.s = path.wrap(s); this.prevS = this.s; this.lastGoodS = this.s;
    this.lapStart = 0;
    this.updateVisual(0, 0);
  };

  Kart.prototype.forward = function (out) { return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); };
  Kart.prototype.rightVec = function (out) { return out.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); };

  Kart.prototype.progress = function (L) {
    var s = this.s;
    if (this.cpPassed === 0 && s > L * 0.5) s -= L;
    return this.lapsCompleted * L + s;
  };

  /** feed the boost gauge; a full gauge becomes a stored boost (up to maxStock) */
  Kart.prototype.addGauge = function (v) {
    this.boostGauge += v * this.gaugeMul * this.statMul.gauge;
    while (this.boostGauge >= 1 && this.boostStock < this.maxStock) {
      this.boostGauge -= 1; this.boostStock++;
      this.events.push({ type: 'stock', stock: this.boostStock });
    }
    if (this.boostGauge > 1) this.boostGauge = 1;
  };

  Kart.prototype.applyBoost = function (mul, dur, kind) {
    if (this.boostTime > 0 && this.boostMul > mul) { this.boostTime = Math.max(this.boostTime, dur); return; }
    this.boostMul = mul; this.boostTime = dur * this.statMul.boostDur; this.boostKind = kind || '';
    this.events.push({ type: 'boost', kind: kind, mul: mul });
  };

  Kart.prototype.spinOut = function (source) {
    if (this.invulnTime > 0 || this.spinTime > 0) return false;
    if (this.shieldTime > 0) { this.shieldTime = 0; this.events.push({ type: 'shieldBreak' }); return false; }
    this.spinTime = 1.3; this.spinDir = Math.random() < 0.5 ? -1 : 1;
    this.drifting = false; this.driftCharge = 0; this.driftTier = 0; this.boostTime = 0;
    this.invulnTime = 2.2; this.hits++; this.stats.spins++;
    this.events.push({ type: 'spin', source: source });
    return true;
  };

  Kart.prototype.stun = function (dur) {
    if (this.shieldTime > 0) { this.shieldTime = 0; this.events.push({ type: 'shieldBreak' }); return false; }
    this.stunTime = Math.max(this.stunTime, dur); this.boostTime = 0;
    this.events.push({ type: 'stun' });
    return true;
  };

  Kart.prototype.respawn = function (path, track) {
    var s = this.lastGoodS;
    path.posAt(s, 0, this.pos);
    var sm = path.sample(s);
    this.pos.y += track.hExtra[sm.idx];
    this.yaw = path.yawAt(s);
    this.vel.set(0, 0, 0); this.vf = 0; this.vl = 0; this.airborne = false; this.vy = 0;
    this.drifting = false; this.driftCharge = 0; this.driftTier = 0; this.spinTime = 0; this.stunTime = 0;
    this.hint = sm.idx; this.invulnTime = 2; this.respawnCooldown = 1; this.stats.respawns++;
    this.events.push({ type: 'respawn' });
  };

  function crossedForward(prev, now, cp, L) {
    var d = ((now - prev) % L + L) % L; if (d > L / 2) d -= L;
    if (d > 0) { var e = ((cp - prev) % L + L) % L; return e > 0 && e <= d ? 1 : 0; }
    if (d < 0) { var e2 = ((prev - cp) % L + L) % L; return e2 >= 0 && e2 < -d ? -1 : 0; }
    return 0;
  }

  // ------------------------------------------------------------ network
  /** compact state for replication */
  Kart.prototype.netState = function () {
    return {
      id: this.netId, x: +this.pos.x.toFixed(2), y: +this.pos.y.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(3),
      vx: +this.vel.x.toFixed(2), vz: +this.vel.z.toFixed(2), vf: +this.vf.toFixed(1), sp: +this.speed.toFixed(1),
      d: this.drifting ? this.driftDir : 0, dt: this.driftTier, b: this.boostTime > 0 ? 1 : 0, bm: +this.boostMul.toFixed(2), bk: this.boostKind || '',
      sh: +Math.max(0, this.shieldTime).toFixed(1), sn: this.spinTime > 0 ? 1 : 0, su: this.stunTime > 0 ? 1 : 0, it: this.item || null,
      g: +this.boostGauge.toFixed(2), st: this.boostStock, lap: this.lapsCompleted, cp: this.cpPassed, s: +this.s.toFixed(1),
      f: this.finished ? 1 : 0, ft: this.finishTime, air: this.airborne ? 1 : 0, or: this.offroad ? 1 : 0, lt: this.lapTimes
    };
  };

  /** apply a replicated state (remote karts) */
  Kart.prototype.applyNetState = function (s, recvTime) {
    this.netTarget = s; this.netTime = recvTime;
    this.drifting = !!s.d; if (s.d) this.driftDir = s.d; this.driftTier = s.dt || 0;
    this.boostTime = s.b ? 0.25 : 0; this.boostMul = s.bm || 1.3; this.boostKind = s.bk || '';
    this.shieldTime = s.sh || 0; this.spinTime = s.sn ? 0.5 : 0; this.stunTime = s.su ? 0.5 : 0;
    this.item = s.it || null; this.boostGauge = s.g || 0; this.boostStock = s.st || 0;
    this.lapsCompleted = s.lap || 0; this.cpPassed = s.cp || 0; this.s = s.s || 0;
    this.finished = !!s.f; this.finishTime = s.ft || 0; this.airborne = !!s.air; this.offroad = !!s.or;
    this.speed = s.sp || 0; this.vf = s.vf || 0;
    if (s.lt && s.lt.length !== this.lapTimes.length) this.lapTimes = s.lt.slice();
    if (!this.netInit) { this.pos.set(s.x, s.y, s.z); this.yaw = s.yaw; this.netInit = true; }
  };

  Kart.prototype.updateRemote = function (dt, world) {
    var ev = this.events; ev.length = 0;
    var s = this.netTarget;
    if (s) {
      var age = Math.min(0.25, (performance.now() - this.netTime) / 1000);
      _tmp.set(s.x + s.vx * age, s.y, s.z + s.vz * age);
      if (this.pos.distanceTo(_tmp) > 10) this.pos.copy(_tmp);
      else this.pos.lerp(_tmp, 1 - Math.exp(-12 * dt));
      this.yaw += U.wrapAngle(s.yaw - this.yaw) * Math.min(1, 14 * dt);
      this.vel.set(s.vx, 0, s.vz);
      if (this.boostTime > 0) this.boostTime -= dt;
      if (this.spinTime > 0) this.spinTime -= dt;
      if (this.stunTime > 0) this.stunTime -= dt;
      if (this.shieldTime > 0) this.shieldTime -= dt;
    }
    var pr = world.path.project(this.pos, this.hint, this.proj);
    this.hint = pr.idx; this.idx = pr.idx; this.lat = pr.lat;
    if (!s) this.s = pr.s;
    if (!this.airborne) { var gy = world.track.groundY(pr.idx, this.lat, pr.right, pr.center); this.pos.y = U.damp(this.pos.y, gy, 25, dt); }
    this.yawRate = 0; this.accVis = 0; this.wrongWay = 0;
  };

  /** main physics step */
  Kart.prototype.update = function (dt, world) {
    if (this.remote) return this.updateRemote(dt, world);
    var P = PARAMS, path = world.path, track = world.track, inp = this.input, ev = this.events;
    ev.length = 0;
    dt = Math.min(dt, 1 / 30);
    var raceOn = world.raceOn;

    if (this.boostTime > 0) this.boostTime -= dt;
    if (this.shieldTime > 0) this.shieldTime -= dt;
    if (this.stunTime > 0) this.stunTime -= dt;
    if (this.spinTime > 0) this.spinTime -= dt;
    if (this.invulnTime > 0) this.invulnTime -= dt;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.respawnCooldown > 0) this.respawnCooldown -= dt;
    var spinning = this.spinTime > 0;
    var control = raceOn && !spinning;

    // respawn request
    if (inp.respawn && this.respawnCooldown <= 0 && raceOn) { this.respawn(path, track); return; }

    var idx = this.idx, halfW = path.W[idx] / 2;
    var maxS = P.maxSpeed * this.speedScale * this.statMul.speed;
    if (this.stunTime > 0) maxS *= 0.55;
    if (this.offroad) maxS *= P.dirtSpeed;
    if (this.boostTime > 0) maxS *= this.boostMul;

    this.forward(_fwd); this.rightVec(_right);
    var vf = this.vel.dot(_fwd), vl = this.vel.dot(_right);
    var accVis = 0;

    // ---- throttle / brake ------------------------------------------------
    if (!control) {
      vf = U.damp(vf, 0, spinning ? 1.6 : 0.8, dt);
    } else {
      var thr = inp.throttle, brk = inp.brake;
      if (thr > 0) {
        if (vf < maxS) {
          var ratio = Math.max(0, vf / maxS);
          var a = P.accel * thr * (1.2 - 0.9 * ratio * ratio) * (this.boostTime > 0 ? 2.0 : 1) * this.statMul.accel;
          if (this.offroad) a *= 0.8;
          vf += a * dt; accVis = a;
          if (vf > maxS) vf = maxS;
        } else vf = U.damp(vf, maxS, this.boostTime > 0 ? 3 : 1.4, dt);
      } else if (brk > 0) {
        if (vf > 0.4) { vf -= P.brake * brk * dt; accVis = -P.brake; if (vf < 0) vf = 0; }
        else vf = Math.max(-P.maxReverse, vf - P.accel * 0.7 * dt);
      } else {
        var c = P.coast * dt; if (vf > c) vf -= c; else if (vf < -c) vf += c; else vf = 0;
        if (vf > maxS) vf = U.damp(vf, maxS, 1.4, dt);
      }
    }
    if (this.offroad && vf > maxS) vf = U.damp(vf, maxS, 3.5, dt);

    // ---- drift ------------------------------------------------------------
    var steer = control ? inp.steer : 0;
    var absV = Math.abs(vf);
    if (!this.drifting && control && inp.drift && steer !== 0 && vf > P.driftMinSpeed && !this.airborne) {
      this.drifting = true; this.driftDir = steer > 0 ? 1 : -1; this.driftCharge = 0; this.driftTier = 0;
      ev.push({ type: 'driftStart' }); this.stats.drifts++;
    }
    if (this.drifting) {
      var end = !inp.drift || vf < 6 || !control;
      if (end) {
        if (this.driftTier > 0 && control) {
          var b = P.driftBoost[this.driftTier - 1];
          this.applyBoost(b[0], b[1], 'drift');
          this.addGauge(P.driftGaugeGain[this.driftTier - 1]);
          ev.push({ type: 'driftBoost', tier: this.driftTier }); this.stats.driftBoosts++;
        } else if (control) this.addGauge(this.driftCharge * 0.12);
        this.drifting = false; this.driftCharge = 0; this.driftTier = 0;
        ev.push({ type: 'driftEnd' });
      } else {
        this.driftCharge += dt * (0.85 + 0.35 * Math.abs(steer)) * (this.offroad ? 0.5 : 1);
        var tier = 0;
        for (var t = 0; t < 3; t++) if (this.driftCharge >= P.driftTierTimes[t]) tier = t + 1;
        if (tier > this.driftTier) { this.driftTier = tier; ev.push({ type: 'driftTier', tier: tier }); }
        // little charge trickles into the gauge continuously
        this.addGauge(dt * 0.03);
      }
    }

    // ---- passive charge: the gauge trickles up while driving, faster at speed -------
    if (control && !this.finished && !this.drifting) this.addGauge(dt * (0.018 + 0.03 * U.clamp(this.speed / P.maxSpeed, 0, 1)));

    // ---- boost trigger ------------------------------------------------------
    if (control && inp.boost && this.boostStock > 0 && !this.airborne) {
      this.boostStock--; this.stats.gaugeBoosts++;
      this.applyBoost(P.gaugeBoost[0], P.gaugeBoost[1], 'gauge');
    }

    // ---- steering ------------------------------------------------------------
    // understeer builds with speed: full-throttle turning radius ~50 m at top speed, drifting turns tighter
    var speedFac = U.clamp(absV / P.steerLowSpeed, 0, 1) * (1 - 0.6 * U.clamp(absV / P.maxSpeed, 0, 1));
    var yawRate;
    if (spinning) yawRate = this.spinDir * 9.5 * Math.min(1, this.spinTime / 1.3 + 0.2);
    else if (this.drifting) yawRate = this.driftDir * (P.driftYaw + steer * this.driftDir * P.driftSteerYaw) * Math.max(0.62, speedFac);
    else yawRate = steer * P.steerRate * speedFac;
    if (!spinning) yawRate *= this.statMul.handling;
    if (vf < -0.5 && !spinning) yawRate = -yawRate;
    if (this.airborne) yawRate *= 0.25;
    this.yaw += yawRate * dt;
    this.yawRate = yawRate;

    // ---- rebuild velocity in the new frame + grip -----------------------------
    var spdBefore = Math.sqrt(vf * vf + vl * vl);
    _tmp.copy(_fwd).multiplyScalar(vf).addScaledVector(_right, vl); // world velocity (xz)
    this.forward(_fwd); this.rightVec(_right);
    var vf2 = _tmp.dot(_fwd), vl2 = _tmp.dot(_right);
    var grip = this.airborne ? P.gripAir : (this.drifting ? P.gripDrift : (this.offroad ? P.gripDirt : P.gripNormal));
    vl2 *= Math.exp(-grip * dt);
    if (this.drifting && !this.airborne) {
      // keep momentum through the slide
      var spdNow = Math.sqrt(vf2 * vf2 + vl2 * vl2);
      var target = spdBefore * (1 - P.driftSpeedLoss * dt);
      if (spdNow > 0.01) { var k = target / spdNow; vf2 *= k; vl2 *= k; }
    }
    this.vf = vf2; this.vl = vl2;
    this.vel.copy(_fwd).multiplyScalar(vf2).addScaledVector(_right, vl2);
    this.speed = Math.sqrt(vf2 * vf2 + vl2 * vl2);
    this.accVis = U.damp(this.accVis, accVis, 6, dt);

    // ---- integrate ---------------------------------------------------------------
    var prevY = this.pos.y;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;

    // ---- project & constrain ---------------------------------------------------------
    var pr = path.project(this.pos, this.hint, this.proj);
    this.hint = pr.idx; idx = this.idx = pr.idx;
    this.prevS = this.s; this.s = pr.s; this.lat = pr.lat;
    halfW = pr.width / 2;
    var minL = track.minLat[idx] + P.wallHalf, maxL = track.maxLat[idx] - P.wallHalf;
    this.offroad = pr.lat < -halfW - 0.4 || pr.lat > halfW + 0.4;
    this.wallContact = 0;
    var pen = 0, sign = 0;
    if (pr.lat > maxL) { pen = pr.lat - maxL; sign = 1; }
    else if (pr.lat < minL) { pen = minL - pr.lat; sign = -1; }
    if (sign !== 0) {
      this.pos.addScaledVector(pr.right, -sign * pen);
      this.lat = sign > 0 ? maxL : minL;
      var vr = this.vel.dot(pr.right) * sign;
      if (vr > 0) {
        this.vel.addScaledVector(pr.right, -sign * vr * 1.35);
        var impact = vr;
        this.wallContact = impact;
        if (impact > 3 && this.hitCooldown <= 0) {
          // a real hit: lose speed once, then slide along the wall
          this.vel.multiplyScalar(1 - U.clamp(impact / 18, 0.08, 0.45));
          this.hitCooldown = 0.25; ev.push({ type: 'wall', impact: impact, side: sign }); this.stats.walls++;
        } else {
          this.vel.multiplyScalar(Math.max(0, 1 - 0.9 * dt));
          ev.push({ type: 'scrape', side: sign });
        }
        if (this.drifting && impact > 10) { this.drifting = false; this.driftCharge = 0; this.driftTier = 0; ev.push({ type: 'driftEnd' }); }
      }
      // gently align with the wall so beginners do not stick to it
      var tyaw = Math.atan2(pr.tan.x, pr.tan.z);
      this.yaw += U.wrapAngle(tyaw - this.yaw) * Math.min(1, 4.5 * dt);
      // refresh vf/vl from constrained velocity
      this.forward(_fwd); this.rightVec(_right);
      this.vf = this.vel.dot(_fwd); this.vl = this.vel.dot(_right); this.speed = Math.hypot(this.vf, this.vl);
    }

    // ---- ground / air ------------------------------------------------------------------
    var gy = track.groundY(idx, this.lat, pr.right, pr.center);
    if (!this.airborne) {
      var dy = this.pos.y - gy;
      var climb = (this.pos.y - prevY) / Math.max(dt, 1e-4);
      if (dy > 0.45 && climb > 2) { this.airborne = true; this.vy = climb * 0.9 + 1; ev.push({ type: 'jump' }); this.stats.jumps++; }
      else this.pos.y = gy;
    }
    if (this.airborne) {
      this.vy -= P.gravity * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= gy) {
        this.pos.y = gy; this.airborne = false;
        ev.push({ type: 'land', impact: -this.vy });
        this.vy = 0;
      }
    }

    // ---- boost pads -------------------------------------------------------------------------
    if (raceOn && !this.airborne) {
      var pads = track.boostPads;
      for (var p = 0; p < pads.length; p++) {
        var bp = pads[p];
        var ds = this.s - bp.s; if (ds > path.length / 2) ds -= path.length; if (ds < -path.length / 2) ds += path.length;
        if (Math.abs(ds) < bp.len / 2 + 1 && Math.abs(this.lat - bp.lat) < bp.w / 2 + 0.8) {
          if (!(this.boostTime > 0 && this.boostKind !== 'pad' && this.boostMul >= P.padBoost[0])) {
            if (!(this.boostKind === 'pad' && this.boostTime > 0.6)) {
              this.applyBoost(P.padBoost[0], P.padBoost[1], 'pad');
              ev.push({ type: 'pad' }); this.stats.pads++;
            }
          }
        }
      }
    }

    // ---- progress / checkpoints / laps --------------------------------------------------------
    if (raceOn && !this.finished) {
      var L = path.length, cps = track.cpS, n = cps.length;
      for (var c = 0; c < n; c++) {
        var dir = crossedForward(this.prevS, this.s, cps[c], L);
        if (dir === 1) {
          if (c === 0) {
            if (this.cpPassed === n - 1) {
              this.lapsCompleted++; this.cpPassed = 0;
              var lapT = world.time - this.lapStart; this.lapTimes.push(lapT); this.lapStart = world.time;
              if (this.lapsCompleted >= track.laps) { this.finished = true; this.finishTime = world.time; ev.push({ type: 'finish' }); }
              else ev.push({ type: 'lap', lap: this.lapsCompleted, time: lapT });
            }
          } else if (c === this.cpPassed + 1) this.cpPassed = c;
        } else if (dir === -1) {
          if (c === 0) { if (this.cpPassed === 0 && this.lapsCompleted > 0) { this.lapsCompleted--; this.cpPassed = n - 1; this.lapStart = world.time - (this.lapTimes.pop() || 0); } }
          else if (c === this.cpPassed) this.cpPassed = c - 1;
        }
      }
    }
    if (!this.offroad && !this.airborne && !spinning && this.speed > 2) { this.lastGoodS = this.s; }

    // wrong way detection
    if (raceOn && this.vf > 4 && _fwd.dot(pr.tan) < -0.2) this.wrongWay += dt; else this.wrongWay = 0;
    // stuck detection (used by AI)
    if (raceOn && this.speed < 1.5 && inp.throttle > 0.5) this.stuckTime += dt; else this.stuckTime = 0;
  };

  // ------------------------------------------------------------ visuals
  Kart.prototype.updateVisual = function (dt, t) {
    var m = this.mesh, root = this.root;
    root.position.copy(this.pos);
    // orientation: yaw about smoothed ground up
    var up = this.proj.up || UPV;
    if (this.airborne) { this.upSmooth.lerp(UPV, Math.min(1, dt * 1.5)); }
    else this.upSmooth.lerp(up, Math.min(1, dt * 10));
    this.upSmooth.normalize();
    this.forward(_fwd);
    _tmp.copy(_fwd).addScaledVector(this.upSmooth, -_fwd.dot(this.upSmooth)).normalize();
    _tmp2.crossVectors(this.upSmooth, _tmp).normalize();
    _m.makeBasis(_tmp2, this.upSmooth, _tmp);
    root.quaternion.setFromRotationMatrix(_m);

    // body lean / pitch / bounce
    var latAcc = this.yawRate * this.vf;
    var roll = U.clamp(latAcc * 0.0045, -0.16, 0.16) + (this.drifting ? this.driftDir * 0.05 : 0);
    var pitch = U.clamp(-this.accVis * 0.006, -0.08, 0.1);
    if (this.airborne) pitch += U.clamp(-this.vy * 0.02, -0.25, 0.25);
    m.body.rotation.z = U.damp(m.body.rotation.z, roll, 10, dt);
    m.body.rotation.x = U.damp(m.body.rotation.x, pitch, 8, dt);
    var bounce = this.offroad && !this.airborne ? Math.sin(t * 45 + this.index) * 0.04 * Math.min(1, this.speed / 8) : 0;
    m.body.position.y = bounce;

    // wheels
    this.wheelSpin += this.vf / 0.33 * dt;
    var steerVis = this.input.steer * 0.42 + (this.drifting ? -this.driftDir * 0.3 : 0);
    this.steerVis = U.damp(this.steerVis, steerVis, 12, dt);
    for (var i = 0; i < 4; i++) {
      m.wheels[i].rotation.x = this.wheelSpin;
      if (i < 2) m.pivots[i].rotation.y = this.steerVis;
      m.pivots[i].position.y = 0.33 + bounce * (i % 2 ? -1 : 1);
    }
    // flames
    var boosting = this.boostTime > 0;
    for (i = 0; i < 2; i++) {
      var f = m.flames[i];
      f.visible = boosting;
      if (boosting) {
        var sc = 0.7 + Math.random() * 0.5 + (this.boostMul - 1) * 2;
        f.scale.set(sc * 0.8, sc * 0.8, sc * (1 + this.speed / 40));
      }
    }
    m.glow.material.opacity = boosting ? 0.6 : 0.3;
    m.glow.material.color.setHex(boosting ? 0x66ccff : this.accent);
    // shield
    m.shield.visible = this.shieldTime > 0;
    if (m.shield.visible) { var ss = 1 + Math.sin(t * 8) * 0.04; m.shield.scale.set(ss, ss, ss); m.shield.material.opacity = 0.25 + Math.sin(t * 10) * 0.08; }
    // stun squash
    var sScale = this.stunTime > 0 ? 0.62 : 1;
    root.scale.x = U.damp(root.scale.x, sScale, 8, dt); root.scale.y = root.scale.x; root.scale.z = root.scale.x;
    // invuln blink
    root.visible = !(this.invulnTime > 0 && this.spinTime <= 0 && Math.floor(t * 14) % 2 === 0 && !this.finished);
    // pet: hovers beside the kart with a soft lag, bobbing and banking
    if (this.petRoot) {
      this.rightVec(_tmp2);
      _tmp.copy(this.pos).addScaledVector(_tmp2, -2.0).addScaledVector(_fwd, -0.3);
      _tmp.y += 1.5 + Math.sin(t * 3 + this.index) * 0.15;
      if (!this.petInit) { this.petPos.copy(_tmp); this.petInit = true; }
      else this.petPos.lerp(_tmp, 1 - Math.exp(-5 * dt));
      this.petRoot.position.copy(this.petPos);
      var pyaw = this.yaw + (this.drifting ? this.driftDir * 0.3 : 0);
      this.petRoot.rotation.set(0, pyaw, 0);
      this.petRoot.rotation.z = U.clamp(-latAcc * 0.003, -0.35, 0.35);
      this.petRoot.visible = root.visible;
      if (this.pet.animate) this.pet.animate(dt, t, this.speed);
    }
  };

  /** world-space rear wheel contact position (i=0 left, 1 right) */
  Kart.prototype.wheelWorld = function (i, out) {
    var p = this.mesh.pivots[i];
    return p.getWorldPosition(out);
  };

  Kart.prototype.exhaustWorld = function (i, out) {
    return this.mesh.exhausts[i].getWorldPosition(out);
  };

  Kart.PARAMS = PARAMS;
  global.Kart = Kart;
  global.buildKartMesh = buildKartMesh;
})(window);
