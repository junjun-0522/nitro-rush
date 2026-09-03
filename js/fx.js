/* ============================================================
   NITRO RUSH - particles, skid marks, screen shake
   ============================================================ */
(function (global) {
  'use strict';

  var VERT = [
    'attribute float aSize; attribute float aAlpha; attribute vec3 aColor;',
    'varying float vA; varying vec3 vC;',
    'void main(){ vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0);',
    ' gl_PointSize = aSize * (320.0 / max(1.0,-mv.z)); gl_Position = projectionMatrix * mv; }'
  ].join('\n');
  var FRAG = [
    'uniform sampler2D map; varying float vA; varying vec3 vC;',
    'void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb, t.a * vA); if (gl_FragColor.a < 0.01) discard; }'
  ].join('\n');

  function PSystem(scene, max, texture, additive) {
    this.max = max; this.count = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.size = new Float32Array(max); this.size0 = new Float32Array(max); this.grow = new Float32Array(max);
    this.alpha = new Float32Array(max); this.alpha0 = new Float32Array(max);
    this.col = new Float32Array(max * 3);
    this.grav = new Float32Array(max); this.drag = new Float32Array(max);
    var geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    var mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: texture } }, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  PSystem.prototype.emit = function (x, y, z, vx, vy, vz, o) {
    var i;
    if (this.count < this.max) i = this.count++;
    else i = Math.floor(Math.random() * this.max);
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = this.maxLife[i] = o.life || 1;
    this.size[i] = this.size0[i] = o.size || 1; this.grow[i] = o.grow || 0;
    this.alpha[i] = this.alpha0[i] = o.alpha === undefined ? 1 : o.alpha;
    var c = o.color; this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
    this.grav[i] = o.gravity || 0; this.drag[i] = o.drag || 0;
  };

  PSystem.prototype.update = function (dt) {
    var n = this.count;
    for (var i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        n--;
        if (i !== n) this._swap(i, n);
        i--; continue;
      }
      var k = this.drag[i] > 0 ? Math.exp(-this.drag[i] * dt) : 1;
      this.vel[i * 3] *= k; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.grav[i] * dt; this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      var f = this.life[i] / this.maxLife[i];
      this.size[i] = this.size0[i] * (1 + this.grow[i] * (1 - f));
      this.alpha[i] = this.alpha0[i] * (f < 0.5 ? f * 2 : 1);
    }
    this.count = n;
    this.geo.setDrawRange(0, n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
  };

  PSystem.prototype._swap = function (a, b) {
    var arrs3 = [this.pos, this.vel, this.col], arrs1 = [this.life, this.maxLife, this.size, this.size0, this.grow, this.alpha, this.alpha0, this.grav, this.drag];
    for (var k = 0; k < arrs3.length; k++) { var A = arrs3[k]; for (var c = 0; c < 3; c++) { var t = A[a * 3 + c]; A[a * 3 + c] = A[b * 3 + c]; A[b * 3 + c] = t; } }
    for (k = 0; k < arrs1.length; k++) { var B = arrs1[k]; var t2 = B[a]; B[a] = B[b]; B[b] = t2; }
  };

  // ------------------------------------------------------------ skid marks
  var SKID_VERT = 'attribute float aAlpha; varying float vA; void main(){ vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
  var SKID_FRAG = 'varying float vA; void main(){ gl_FragColor = vec4(0.05,0.05,0.06, vA); }';

  function SkidMarks(scene, maxQuads) {
    this.max = maxQuads; this.head = 0;
    this.pos = new Float32Array(maxQuads * 4 * 3); this.alpha = new Float32Array(maxQuads * 4);
    var idx = new Uint32Array(maxQuads * 6);
    for (var i = 0; i < maxQuads; i++) { var b = i * 4, o = i * 6; idx[o] = b; idx[o + 1] = b + 1; idx[o + 2] = b + 2; idx[o + 3] = b + 1; idx[o + 4] = b + 3; idx[o + 5] = b + 2; }
    var geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    var mat = new THREE.ShaderMaterial({ vertexShader: SKID_VERT, fragmentShader: SKID_FRAG, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 1;
    scene.add(this.mesh);
    this.tracks = {}; // key -> {l:Vector3, r:Vector3, active}
    this.dirty = false;
  }

  /** add a segment for wheel key; l/r = edges of the contact patch */
  SkidMarks.prototype.add = function (key, lx, ly, lz, rx, ry, rz, alpha) {
    var tr = this.tracks[key];
    if (!tr) tr = this.tracks[key] = { l: new THREE.Vector3(), r: new THREE.Vector3(), active: false };
    if (tr.active) {
      var q = this.head; this.head = (this.head + 1) % this.max;
      var o = q * 12;
      this.pos[o] = tr.l.x; this.pos[o + 1] = tr.l.y; this.pos[o + 2] = tr.l.z;
      this.pos[o + 3] = tr.r.x; this.pos[o + 4] = tr.r.y; this.pos[o + 5] = tr.r.z;
      this.pos[o + 6] = lx; this.pos[o + 7] = ly; this.pos[o + 8] = lz;
      this.pos[o + 9] = rx; this.pos[o + 10] = ry; this.pos[o + 11] = rz;
      var a = q * 4; this.alpha[a] = this.alpha[a + 1] = this.alpha[a + 2] = this.alpha[a + 3] = alpha;
      this.dirty = true;
    }
    tr.l.set(lx, ly, lz); tr.r.set(rx, ry, rz); tr.active = true;
  };
  SkidMarks.prototype.end = function (key) { var tr = this.tracks[key]; if (tr) tr.active = false; };
  SkidMarks.prototype.clear = function () { this.pos.fill(0); this.alpha.fill(0); this.head = 0; this.tracks = {}; this.dirty = true; };
  SkidMarks.prototype.update = function () {
    if (this.dirty) { this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aAlpha.needsUpdate = true; this.dirty = false; }
  };

  // ------------------------------------------------------------ FX facade
  function FX(scene) {
    this.scene = scene;
    var tex = U.tex;
    this.smoke = new PSystem(scene, 1500, tex.smoke(), false);
    this.spark = new PSystem(scene, 800, tex.particle(), true);
    this.flame = new PSystem(scene, 1200, tex.flame(), true);
    this.glow = new PSystem(scene, 300, tex.particle(), true);
    this.skid = new SkidMarks(scene, 900);
    this.shake = 0;
    this._c = new THREE.Color();
  }

  FX.prototype.color = function (hex) { return this._c.setHex(hex); };

  FX.prototype.tireSmoke = function (p, vel, intensity, tint) {
    var c = this._c.setHex(tint || 0xffffff);
    for (var i = 0; i < 2; i++) {
      this.smoke.emit(p.x + (Math.random() - 0.5) * 0.3, p.y + 0.1, p.z + (Math.random() - 0.5) * 0.3,
        vel.x * 0.15 + (Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 1.2, vel.z * 0.15 + (Math.random() - 0.5) * 1.5,
        { life: 0.7 + Math.random() * 0.5, size: 1.4, grow: 2.5, alpha: 0.35 * intensity, color: c, drag: 2 });
    }
  };

  FX.prototype.dust = function (p, vel) {
    this.smoke.emit(p.x, p.y + 0.1, p.z, vel.x * 0.2 + (Math.random() - 0.5), 1.5 + Math.random(), vel.z * 0.2 + (Math.random() - 0.5),
      { life: 0.8, size: 1.6, grow: 2, alpha: 0.4, color: this._c.setHex(0xc9a36a), drag: 2 });
  };

  FX.prototype.sparks = function (p, n, colorHex, spread) {
    var c = this._c.setHex(colorHex || 0xffcc66); spread = spread || 8;
    for (var i = 0; i < n; i++) {
      this.spark.emit(p.x, p.y + 0.3, p.z, (Math.random() - 0.5) * spread, Math.random() * spread * 0.8, (Math.random() - 0.5) * spread,
        { life: 0.3 + Math.random() * 0.5, size: 0.5, grow: -0.5, alpha: 1, color: c, gravity: 15, drag: 1 });
    }
  };

  FX.prototype.boostFlame = function (p, back, intensity, hue) {
    var c = this._c.setHex(hue || 0xff8a3a);
    for (var i = 0; i < 2; i++) {
      this.flame.emit(p.x + (Math.random() - 0.5) * 0.2, p.y, p.z + (Math.random() - 0.5) * 0.2,
        back.x * 8 + (Math.random() - 0.5) * 2, 0.5 + Math.random(), back.z * 8 + (Math.random() - 0.5) * 2,
        { life: 0.25 + Math.random() * 0.25, size: 1.3 * intensity, grow: 1.5, alpha: 0.9, color: c, drag: 3 });
    }
    this.glow.emit(p.x, p.y, p.z, back.x * 3, 0, back.z * 3, { life: 0.2, size: 2.4 * intensity, grow: 0.5, alpha: 0.45, color: this._c.setHex(0x66b3ff) });
  };

  FX.prototype.driftSpark = function (p, tier, side) {
    var col = [0x66ccff, 0x66ccff, 0xffa030, 0xd25cff][tier] || 0x66ccff;
    var c = this._c.setHex(col);
    for (var i = 0; i < (1 + tier); i++) {
      this.spark.emit(p.x, p.y + 0.15, p.z, side.x * 3 + (Math.random() - 0.5) * 3, 1 + Math.random() * 3, side.z * 3 + (Math.random() - 0.5) * 3,
        { life: 0.25 + Math.random() * 0.3, size: 0.55 + tier * 0.1, grow: -0.6, alpha: 1, color: c, gravity: 12, drag: 1 });
    }
  };

  FX.prototype.explosion = function (p, big) {
    var n = big ? 60 : 30;
    this.sparks(p, n, 0xffb347, big ? 22 : 14);
    var c = this._c.setHex(0xff6a2a);
    for (var i = 0; i < (big ? 14 : 8); i++) {
      this.flame.emit(p.x, p.y + 0.5, p.z, (Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8,
        { life: 0.5 + Math.random() * 0.4, size: 3, grow: 2.5, alpha: 1, color: c, drag: 3 });
    }
    var s = this._c.setHex(0x888888);
    for (i = 0; i < 12; i++) {
      this.smoke.emit(p.x, p.y + 0.5, p.z, (Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6,
        { life: 1.2, size: 3, grow: 2, alpha: 0.5, color: s, drag: 2 });
    }
    this.glow.emit(p.x, p.y + 0.6, p.z, 0, 0, 0, { life: 0.35, size: big ? 14 : 8, grow: 1.5, alpha: 0.8, color: this._c.setHex(0xffe0a0) });
  };

  FX.prototype.zapRing = function (p) {
    var c = this._c.setHex(0xa0f0ff);
    for (var i = 0; i < 40; i++) {
      var a = i / 40 * Math.PI * 2;
      this.spark.emit(p.x, p.y + 0.5, p.z, Math.cos(a) * 18, 4, Math.sin(a) * 18, { life: 0.5, size: 1.2, grow: 1, alpha: 1, color: c, drag: 2 });
    }
    this.glow.emit(p.x, p.y + 1, p.z, 0, 0, 0, { life: 0.4, size: 20, grow: 2, alpha: 0.9, color: this._c.setHex(0xd0ffff) });
  };

  FX.prototype.pickup = function (p) {
    var c = this._c.setHex(0xffe66d);
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * Math.PI * 2;
      this.spark.emit(p.x, p.y + 0.8, p.z, Math.cos(a) * 5, 3 + Math.random() * 3, Math.sin(a) * 5, { life: 0.5, size: 0.9, grow: 0.5, alpha: 1, color: c, gravity: 6 });
    }
    this.glow.emit(p.x, p.y + 0.8, p.z, 0, 0, 0, { life: 0.3, size: 7, grow: 1, alpha: 0.8, color: this._c.setHex(0xffffff) });
  };

  FX.prototype.confetti = function (p) {
    var cols = [0xff4d6d, 0xffd166, 0x06d6a0, 0x118ab2, 0xffffff, 0xf4a261];
    for (var i = 0; i < 40; i++) {
      this.spark.emit(p.x + (Math.random() - 0.5) * 6, p.y + 6, p.z + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, Math.random() * 5, (Math.random() - 0.5) * 6,
        { life: 1.5 + Math.random(), size: 0.8, grow: 0, alpha: 1, color: this._c.setHex(cols[i % cols.length]), gravity: 3, drag: 1 });
    }
  };

  FX.prototype.addShake = function (a) { this.shake = Math.min(1.5, this.shake + a); };

  FX.prototype.update = function (dt) {
    this.smoke.update(dt); this.spark.update(dt); this.flame.update(dt); this.glow.update(dt);
    this.skid.update();
    this.shake = Math.max(0, this.shake - dt * 2.5);
  };

  FX.prototype.clear = function () {
    this.smoke.count = 0; this.spark.count = 0; this.flame.count = 0; this.glow.count = 0;
    this.skid.clear();
  };

  global.FX = FX;
})(window);
