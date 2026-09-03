/* ============================================================
   NITRO RUSH - Track definitions, road/scenery construction
   ============================================================ */
(function (global) {
  'use strict';

  var UPV = new THREE.Vector3(0, 1, 0);

  // ------------------------------------------------------------------ defs
  // Layouts are explicit closed circuits: [x, z, y] control points (metres), start at index 0 heading +z.
  var TRACKS = [
    {
      id: 'coast', name: 'AZURE COAST', tag: 'BEGINNER', mood: 'coast', laps: 3,
      desc: '햇살 가득한 해안 도시. 긴 직선과 완만한 스위퍼, 언덕 위 터널, 마지막 헤어핀 안쪽 지름길.',
      pts: [[-195.9,85.2,0],[-195.9,135.2,0],[-195.9,185.2,0],[-193.5,206.3,0],[-186.5,226.4,0],[-175.2,244.4,0],[-160.1,259.5,0],[-142.1,270.8,0],[-122,277.8,0],[-100.9,280.2,0.2],[-47.9,280.2,0.7],[5.1,280.2,1.5],[58.1,280.2,2.7],[76.6,277.3,4.2],[93.4,268.7,5.4],[106.6,255.5,6.3],[115.2,238.7,6.8],[118.1,220.2,7],[118.1,170.2,7],[118.1,120.2,7],[118.1,70.2,7],[118.1,20.2,7],[121.7,-0.3,7],[132.1,-18.4,7],[148.1,-31.8,7],[164.1,-45.2,7],[174.5,-63.2,7],[178.1,-83.7,6.4],[178.1,-133.7,5],[178.1,-183.7,3],[178.1,-233.7,1.3],[173.9,-251.9,0.3],[162.3,-266.6,0],[145.4,-274.7,0],[126.8,-274.7,0],[109.9,-266.6,0],[98.3,-251.9,0],[94.1,-233.7,0],[94.1,-213.7,0],[90.7,-192.1,0],[80.7,-172.6,0.4],[65.2,-157.1,1.2],[45.7,-147.1,2.5],[24.1,-143.7,3.5],[-25.9,-143.7,3.9],[-75.9,-143.7,4],[-125.9,-143.7,3.6],[-147.5,-140.3,2.9],[-167,-130.4,1.9],[-182.5,-114.9,0.9],[-192.5,-95.4,0.3],[-195.9,-73.7,0],[-195.9,-51,0],[-195.9,-28.3,0],[-195.9,-5.6,0],[-195.9,17.1,0],[-195.9,39.8,0]],
      width: 25, narrow: [[0.555, 0.635, 22], [0.43, 0.50, 22]],
      zones: [
        { a: 0.56, b: 0.63, side: 1, extra: 22, kind: 'dirt' },    // inside of the hairpin
        { a: 0.655, b: 0.76, side: -1, extra: 18, kind: 'dirt' }   // inside of the double-left
      ],
      ramps: [{ a: 0.19, b: 0.203, h: 1.7 }],
      tunnels: [{ a: 0.32, b: 0.40 }],
      boostPads: [{ s: 0.60, lat: 19 }, { s: 0.715, lat: -18 }, { s: 0.03, lat: 0 }, { s: 0.355, lat: 4 }, { s: 0.95, lat: -4 }],
      itemRows: [0.04, 0.12, 0.21, 0.34, 0.42, 0.53, 0.66, 0.80, 0.93],
      theme: {
        sky: [0x35a7ff, 0xbfe9ff], fog: 0xbfe9ff, fogNear: 260, fogFar: 900,
        sun: 0xfff3d6, sunInt: 1.5, hemi: [0xbfe9ff, 0x6c8f4a], hemiInt: 0.75,
        road: 'asphalt', rail: 0xffffff, railEm: 0x000000, ground: 'grass'
      }
    },
    {
      id: 'neon', name: 'NEON METROPOLIS', tag: 'EXPERT', mood: 'neon', laps: 3,
      desc: '네온 불빛의 미래 도시. 헤어핀과 시케인, 하늘 위 고가도로, 네온 터널과 점프.',
      pts: [[-244.4,92.8,0],[-244.4,152.8,0],[-241,170,0],[-231.2,184.6,0],[-216.6,194.4,0],[-199.4,197.8,0],[-117.4,197.8,0],[-98.9,202.3,0],[-84.6,214.9,0],[-70.3,227.4,0],[-51.9,231.9,0],[28.1,231.9,0],[48.1,226.6,0],[62.8,211.9,0],[68.1,191.9,0],[68.1,131.9,0],[68.1,71.9,0],[73.6,54,0.7],[88.1,42.2,3.1],[106.8,40.6,5.4],[123.2,49.7,6],[131.6,66.4,5.3],[142.1,125.4,3.7],[149.5,143.4,1.6],[163.9,156.6,0.3],[182.5,162.5,0],[201.8,159.9,0],[258.2,139.4,0],[277.2,124.8,0],[284.5,101.8,0],[284.5,41.8,0],[284.5,-18.2,0],[284.5,-78.2,1.4],[284.5,-138.2,5.4],[284.5,-198.2,12.2],[280.3,-219.2,19.5],[268.4,-237.1,24.1],[250.5,-249,25.9],[229.5,-253.2,26],[177.5,-253.2,26],[125.5,-253.2,26],[73.5,-253.2,26],[21.5,-253.2,26],[-30.5,-253.2,26],[-50.5,-247.8,26],[-65.2,-233.2,25.7],[-95.2,-181.2,22.1],[-109.8,-166.6,14.2],[-129.8,-161.2,5.4],[-199.8,-161.2,0.8],[-217,-157.8,0],[-231.6,-148,0],[-241.4,-133.5,0],[-244.8,-116.2,0],[-244.8,-95.3,0],[-244.8,-74.4,0],[-244.7,-53.5,0],[-244.7,-32.6,0],[-244.6,-11.7,0],[-244.5,9.2,0],[-244.5,30.1,0],[-244.4,51,0]],
      width: 19, narrow: [[0.25, 0.31, 16], [0.05, 0.15, 17], [0.75, 0.88, 17]],
      zones: [
        { a: 0.25, b: 0.31, side: -1, extra: 20, kind: 'dirt' },
        { a: 0.33, b: 0.445, side: 1, extra: 16, kind: 'dirt' },
        { a: 0.755, b: 0.80, side: 1, extra: 14, kind: 'dirt' }
      ],
      ramps: [{ a: 0.215, b: 0.23, h: 2.4 }, { a: 0.585, b: 0.60, h: 2.0 }],
      tunnels: [{ a: 0.44, b: 0.50 }, { a: 0.62, b: 0.70 }],
      boostPads: [{ s: 0.28, lat: -16 }, { s: 0.40, lat: 14 }, { s: 0.78, lat: 12 }, { s: 0.52, lat: 0 }, { s: 0.66, lat: -3 }, { s: 0.95, lat: 0 }],
      itemRows: [0.02, 0.09, 0.16, 0.24, 0.33, 0.47, 0.64, 0.74, 0.92],
      theme: {
        sky: [0x05020f, 0x2b0f5a], fog: 0x0a0620, fogNear: 180, fogFar: 700,
        sun: 0x9fb4ff, sunInt: 0.75, hemi: [0x5a48b8, 0x101024], hemiInt: 0.8,
        road: 'asphaltNight', rail: 0x1a1a2a, railEm: 0x00e5ff, ground: 'concrete'
      }
    }
  ];

  // ------------------------------------------------------------- helpers
  function mergeGeoms(list) {
    var pos = [], nor = [], uv = [], idx = [], off = 0;
    list.forEach(function (g) {
      var p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv');
      for (var i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        nor.push(n.getX(i), n.getY(i), n.getZ(i));
        uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
      }
      var ix = g.getIndex();
      if (ix) for (i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off);
      else for (i = 0; i < p.count; i++) idx.push(i + off);
      off += p.count;
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  }

  function boxWithUV(w, h, d, uvScale) {
    var g = new THREE.BoxGeometry(w, h, d);
    var uv = g.getAttribute('uv');
    // faces: +x,-x,+y,-y,+z,-z ; 4 verts each
    var sc = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (var f = 0; f < 6; f++) for (var v = 0; v < 4; v++) {
      var i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * sc[f][0] / uvScale, uv.getY(i) * sc[f][1] / uvScale);
    }
    return g;
  }

  /** strip along path: edgeA(j,out), edgeB(j,out) fill world positions */
  function stripGeom(path, edgeA, edgeB, vScale, range) {
    var N = path.N, a0 = 0, a1 = N, closed = true;
    if (range) { a0 = range[0]; a1 = range[1]; closed = false; }
    var count = a1 - a0 + (closed ? 1 : 1);
    var pos = new Float32Array(count * 2 * 3), nor = new Float32Array(count * 2 * 3), uv = new Float32Array(count * 2 * 2);
    var idx = [];
    var va = new THREE.Vector3(), vb = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3();
    for (var k = 0; k < count; k++) {
      var j = (a0 + k) % N;
      edgeA(j, va); edgeB(j, vb);
      e1.subVectors(vb, va);
      n.crossVectors(path.T[j], e1).normalize();
      if (n.y < 0) n.negate();
      var o = k * 6;
      pos[o] = va.x; pos[o + 1] = va.y; pos[o + 2] = va.z;
      pos[o + 3] = vb.x; pos[o + 4] = vb.y; pos[o + 5] = vb.z;
      nor[o] = n.x; nor[o + 1] = n.y; nor[o + 2] = n.z; nor[o + 3] = n.x; nor[o + 4] = n.y; nor[o + 5] = n.z;
      var v = (a0 + k) * path.ds / vScale;
      uv[k * 4] = 0; uv[k * 4 + 1] = v; uv[k * 4 + 2] = 1; uv[k * 4 + 3] = v;
      if (k < count - 1) {
        var b = k * 2;
        // counter-clockwise seen from above so the front face points up
        idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  }

  /** arch/tube geometry over stations [a,b] */
  function archGeom(path, a, b, radiusFn, K, yBase) {
    var pos = [], nor = [], uv = [], idx = [];
    var p = new THREE.Vector3(), q = new THREE.Vector3();
    var rows = 0;
    for (var j = a; j <= b; j++) {
      var jj = j % path.N, r = radiusFn(jj);
      for (var k = 0; k <= K; k++) {
        var ang = Math.PI * k / K; // 0 = right side, PI = left side
        var lat = Math.cos(ang) * r, h = Math.sin(ang) * r * 0.75 + (yBase || 0);
        p.copy(path.P[jj]).addScaledVector(path.R[jj], lat).addScaledVector(path.U[jj], h);
        q.copy(path.R[jj]).multiplyScalar(-Math.cos(ang)).addScaledVector(path.U[jj], -Math.sin(ang));
        pos.push(p.x, p.y, p.z); nor.push(q.x, q.y, q.z);
        uv.push(k / K * 3, j * path.ds / 6);
      }
      rows++;
    }
    for (var rI = 0; rI < rows - 1; rI++) for (k = 0; k < K; k++) {
      var i0 = rI * (K + 1) + k, i1 = i0 + K + 1;
      idx.push(i0, i1, i0 + 1, i0 + 1, i1, i1 + 1);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  }

  function skyDome(colTop, colBot, stars) {
    var geo = new THREE.SphereGeometry(1800, 24, 12);
    var mat = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color(colTop) }, bot: { value: new THREE.Color(colBot) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; float t = smoothstep(-0.05, 0.55, h); gl_FragColor = vec4(mix(bot, top, t), 1.0); }',
      side: THREE.BackSide, depthWrite: false, fog: false
    });
    var m = new THREE.Mesh(geo, mat);
    m.renderOrder = -10;
    var g = new THREE.Group(); g.add(m);
    if (stars) {
      var rng = U.rng(99), sp = [], sc = [];
      for (var i = 0; i < 1400; i++) {
        var th = rng() * Math.PI * 2, ph = Math.acos(rng.range(0.08, 1));
        sp.push(1500 * Math.sin(ph) * Math.cos(th), 1500 * Math.cos(ph), 1500 * Math.sin(ph) * Math.sin(th));
        var b = rng.range(0.5, 1); sc.push(b, b, b + rng() * 0.2);
      }
      var sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
      var sm = new THREE.PointsMaterial({ size: 3, vertexColors: true, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 });
      g.add(new THREE.Points(sg, sm));
    }
    return g;
  }

  // ---------------------------------------------------------- Track class
  function Track(def, scene, quality) {
    this.def = def;
    this.theme = def.theme; this.theme.mood = def.mood;
    this.quality = quality || 'high';
    var n = def.pts.length, cps = [];
    for (var i = 0; i < n; i++) {
      var p = def.pts[i], f = i / n, w = def.width;
      (def.narrow || []).forEach(function (nr) { if (f >= nr[0] && f <= nr[1]) w = nr[2]; });
      cps.push({ x: p[0], y: p[2] || 0, z: p[1], w: w });
    }
    var path = this.path = new TrackPath(cps);
    this._buildEnvelope();
    var N = path.N;
    this.group = new THREE.Group();
    this.animated = [];
    this.laps = def.laps || 3;
    this.cpCount = 10;

    // ---- per-station drivable limits & surface extras -----------------
    var minLat = this.minLat = new Float32Array(N), maxLat = this.maxLat = new Float32Array(N);
    var zoneKind = this.zoneKind = new Int8Array(N); // 0 none, 1 dirt(left) 2 dirt(right) 3 both
    var hExtra = this.hExtra = new Float32Array(N);
    var tunnelMask = this.tunnelMask = new Uint8Array(N);
    for (var j = 0; j < N; j++) { minLat[j] = -path.W[j] / 2; maxLat[j] = path.W[j] / 2; }
    this.zones = (def.zones || []).map(function (z) {
      var a = Math.round(z.a * N), b = Math.round(z.b * N), ramp = 14;
      for (var j = a; j <= b; j++) {
        var jj = j % N, f = 1;
        if (j - a < ramp) f = (j - a) / ramp; else if (b - j < ramp) f = (b - j) / ramp;
        f = U.smooth(Math.max(0, Math.min(1, f)));
        var ex = z.extra * f;
        if (z.side < 0) { minLat[jj] = -path.W[jj] / 2 - ex; zoneKind[jj] |= 1; }
        else { maxLat[jj] = path.W[jj] / 2 + ex; zoneKind[jj] |= 2; }
      }
      return { a: a, b: b, side: z.side, extra: z.extra, kind: z.kind };
    });
    this.ramps = (def.ramps || []).map(function (rp) {
      var a = Math.round(rp.a * N), b = Math.round(rp.b * N);
      for (var j = a; j < b; j++) hExtra[j % N] = rp.h * (j - a) / (b - a);
      return { a: a, b: b, h: rp.h, slope: rp.h / ((b - a) * path.ds) };
    });
    this.tunnels = (def.tunnels || []).map(function (t) {
      var a = Math.round(t.a * N), b = Math.round(t.b * N);
      for (var j = a; j <= b; j++) tunnelMask[j % N] = 1;
      return { a: a, b: b };
    });
    this.boostPads = (def.boostPads || []).map(function (bp) {
      return { s: bp.s * path.length, lat: bp.lat, len: 7, w: 4 };
    });

    this._buildRoad();
    this._buildScenery();
    scene.add(this.group);
  }

  Track.prototype.dispose = function (scene) {
    scene.remove(this.group);
    this.group.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
    });
  };

  /** ground height (world y) at station idx, lateral lat */
  Track.prototype.groundY = function (idx, lat, right, center) {
    return center.y + lat * right.y + this.hExtra[idx];
  };

  Track.prototype.surfaceAt = function (idx, lat) {
    var hw = this.path.W[idx] / 2;
    if (lat < -hw - 0.3 || lat > hw + 0.3) return 'dirt';
    return 'road';
  };

  Track.prototype.gridSlot = function (i, total) {
    var path = this.path;
    var cols = total > 16 ? 4 : (total > 8 ? 3 : 2);
    var row = Math.floor(i / cols), col = i % cols;
    var wStart = path.W[0], spread = (wStart - 6) / cols;
    var lat = -wStart / 2 + 3 + spread * (col + 0.5);
    var s = path.length - 10 - row * 7 - (col % 2) * 2.5;
    return { s: s, lat: lat };
  };

  // ------------------------------------------------------------ road build
  Track.prototype._buildRoad = function () {
    var path = this.path, N = path.N, th = this.theme, self = this, tex = U.tex, j;
    var g = this.group, tmp = new THREE.Vector3();
    var minLat = this.minLat, maxLat = this.maxLat, hExtra = this.hExtra;

    function edge(latFn) {
      return function (j, out) {
        out.copy(path.P[j]).addScaledVector(path.R[j], latFn(j)); out.y += hExtra[j];
      };
    }
    var half = function (j) { return path.W[j] / 2; };

    // asphalt
    var roadTex = tex[th.road](); roadTex.repeat.set(1, 1);
    var road = new THREE.Mesh(
      stripGeom(path, edge(function (j) { return -half(j); }), edge(function (j) { return half(j); }), 10),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9, metalness: 0.05 })
    );
    road.receiveShadow = true; g.add(road);

    // centre dashed line
    var dashTex = U.canvasTexture('dash', 32, function (c, w, h) { c.fillStyle = 'rgba(255,255,255,0)'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe66d'; c.fillRect(0, 0, w, h / 2); }, { height: 64 });
    var center = new THREE.Mesh(
      stripGeom(path, edge(function () { return -0.25; }), edge(function () { return 0.25; }), 12),
      new THREE.MeshBasicMaterial({ map: dashTex, transparent: true, depthWrite: false })
    );
    center.position.y = 0.03; g.add(center);

    // rumble strips (both edges)
    var rumbleTex = tex.rumble();
    var rumbleMat = new THREE.MeshStandardMaterial({ map: rumbleTex, roughness: 0.7, emissive: th.railEm, emissiveIntensity: th.railEm ? 0.25 : 0 });
    var rumL = stripGeom(path, edge(function (j) { return -half(j) - 0.9; }), edge(function (j) { return -half(j) + 0.4; }), 3);
    var rumR = stripGeom(path, edge(function (j) { return half(j) - 0.4; }), edge(function (j) { return half(j) + 0.9; }), 3);
    var rum = new THREE.Mesh(mergeGeoms([rumL, rumR]), rumbleMat); rum.position.y = 0.02; g.add(rum);

    // dirt shoulders (shortcuts)
    var dirtTex = tex.dirt(); dirtTex.repeat.set(2, 1);
    var dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1 });
    var dirtGeos = [];
    this.zones.forEach(function (z) {
      var inner, outer;
      if (z.side < 0) { inner = function (j) { return minLat[j]; }; outer = function (j) { return -half(j) + 0.5; }; }
      else { inner = function (j) { return half(j) - 0.5; }; outer = function (j) { return maxLat[j]; }; }
      dirtGeos.push(stripGeom(path, edge(inner), edge(outer), 8, [z.a, z.b]));
    });
    if (dirtGeos.length) { var dirt = new THREE.Mesh(mergeGeoms(dirtGeos), dirtMat); dirt.position.y = -0.01; dirt.receiveShadow = true; g.add(dirt); }

    // guard rails
    var railMat = new THREE.MeshStandardMaterial({ color: th.rail, roughness: 0.4, metalness: 0.5, emissive: th.railEm, emissiveIntensity: th.railEm ? 0.9 : 0, side: THREE.DoubleSide });
    function railEdge(latFn, h) { return function (j, out) { out.copy(path.P[j]).addScaledVector(path.R[j], latFn(j)); out.y += hExtra[j] + h; }; }
    var rl = stripGeom(path, railEdge(function (j) { return minLat[j] - 0.7; }, 0.35), railEdge(function (j) { return minLat[j] - 0.7; }, 0.95), 4);
    var rr = stripGeom(path, railEdge(function (j) { return maxLat[j] + 0.7; }, 0.35), railEdge(function (j) { return maxLat[j] + 0.7; }, 0.95), 4);
    var rails = new THREE.Mesh(mergeGeoms([rl, rr]), railMat); rails.castShadow = true; g.add(rails);
    // rail posts
    var postGeo = new THREE.BoxGeometry(0.25, 1.0, 0.25);
    var postCount = Math.ceil(N / 8) * 2 + 2;
    var posts = new THREE.InstancedMesh(postGeo, new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.6 }), postCount);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), pi = 0;
    for (j = 0; j < N; j += 8) {
      [minLat[j] - 0.7, maxLat[j] + 0.7].forEach(function (lat) {
        tmp.copy(path.P[j]).addScaledVector(path.R[j], lat); tmp.y += hExtra[j] + 0.5;
        m4.compose(tmp, q, sc); posts.setMatrixAt(pi++, m4);
      });
    }
    posts.count = pi; g.add(posts);

    // skirts (embankment) & pillars for elevated parts
    var groundY = -0.3;
    var skirtMat = new THREE.MeshStandardMaterial({ map: tex[th.ground === 'grass' ? 'grass' : 'concrete'](), roughness: 1, side: THREE.DoubleSide });
    var skirtL = stripGeom(path, railEdge(function (j) { return minLat[j] - 1.2; }, 0), function (j, out) { out.copy(path.P[j]).addScaledVector(path.R[j], minLat[j] - 1.2 - Math.min(6, Math.max(1.5, path.P[j].y + hExtra[j]) * 0.6)); out.y = groundY; }, 6);
    var skirtR = stripGeom(path, railEdge(function (j) { return maxLat[j] + 1.2; }, 0), function (j, out) { out.copy(path.P[j]).addScaledVector(path.R[j], maxLat[j] + 1.2 + Math.min(6, Math.max(1.5, path.P[j].y + hExtra[j]) * 0.6)); out.y = groundY; }, 6);
    var skirt = new THREE.Mesh(mergeGeoms([skirtL, skirtR]), skirtMat); skirt.receiveShadow = true; g.add(skirt);
    // under-deck & pillars where high
    var pillarGeo = new THREE.CylinderGeometry(1.2, 1.5, 1, 10);
    var pillars = [];
    for (j = 0; j < N; j += 14) {
      var h = path.P[j].y + hExtra[j];
      if (h > 5) {
        [-path.W[j] / 3, path.W[j] / 3].forEach(function (lat) {
          var pg = pillarGeo.clone();
          pg.scale(1, h + 0.5, 1);
          tmp.copy(path.P[j]).addScaledVector(path.R[j], lat); tmp.y = (h + 0.5) / 2 + groundY;
          pg.translate(tmp.x, tmp.y, tmp.z);
          pillars.push(pg);
        });
      }
    }
    if (pillars.length) {
      var pm = new THREE.Mesh(mergeGeoms(pillars), new THREE.MeshStandardMaterial({ color: th.mood === 'neon' ? 0x1d1f33 : 0x9aa4b2, roughness: 0.8 }));
      pm.castShadow = true; g.add(pm);
    }

    // tunnels
    var tunMat = new THREE.MeshStandardMaterial({ color: th.mood === 'neon' ? 0x151a2e : 0x8d8f9b, roughness: 0.9, side: THREE.DoubleSide });
    var tunGeos = [], lightGeos = [];
    var stripMat = new THREE.MeshBasicMaterial({ color: th.mood === 'neon' ? 0xff3fd6 : 0xfff3b0 });
    this.tunnels.forEach(function (t) {
      tunGeos.push(archGeom(path, t.a, t.b, function (j) { return maxLat[j] + 3.5; }, 10, 0));
      // light ring strips every ~14 stations
      for (var j = t.a + 4; j < t.b - 2; j += 12) {
        lightGeos.push(archGeom(path, j, j + 1, function (jj) { return maxLat[jj] + 3.2; }, 10, 0));
      }
      // portal frames
      [t.a, t.b].forEach(function (j) {
        var jj = j % N;
        var frame = new THREE.Mesh(archGeom(path, jj - 2 + N, jj + 2 + N, function (k) { return maxLat[k % N] + 4.4; }, 10, 0), new THREE.MeshStandardMaterial({ color: th.mood === 'neon' ? 0x00e5ff : 0xff6b6b, emissive: th.mood === 'neon' ? 0x00e5ff : 0x000000, emissiveIntensity: 0.8, side: THREE.DoubleSide }));
        g.add(frame);
      });
    });
    if (tunGeos.length) { var tun = new THREE.Mesh(mergeGeoms(tunGeos), tunMat); tun.receiveShadow = true; g.add(tun); }
    if (lightGeos.length) { g.add(new THREE.Mesh(mergeGeoms(lightGeos), stripMat)); }

    // start / finish line + gate
    var checker = tex.checker(); checker.repeat.set(6, 1);
    var line = new THREE.Mesh(stripGeom(path, edge(function (j) { return -half(j); }), edge(function (j) { return half(j); }), 1, [0, 3]), new THREE.MeshBasicMaterial({ map: checker }));
    line.position.y = 0.04; g.add(line);
    var gateMat = new THREE.MeshStandardMaterial({ color: th.mood === 'neon' ? 0x2a2a44 : 0xffffff, emissive: th.mood === 'neon' ? 0x00e5ff : 0x000000, emissiveIntensity: 0.6 });
    var gateH = 9, gw = path.W[0] + 6;
    [-gw / 2, gw / 2].forEach(function (lat) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(1, gateH, 1), gateMat);
      post.position.copy(path.P[1]).addScaledVector(path.R[1], lat); post.position.y += gateH / 2; post.castShadow = true; g.add(post);
    });
    var banner = new THREE.Mesh(new THREE.BoxGeometry(gw + 1, 2.4, 1.2), new THREE.MeshStandardMaterial({ map: U.tex.label('finish', 'NITRO RUSH', '#ffffff', '#ff2f6d') }));
    banner.position.copy(path.P[1]); banner.position.y += gateH - 1.2;
    banner.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), path.T[1].clone().negate(), UPV));
    banner.castShadow = true; g.add(banner);
    var chk = new THREE.Mesh(new THREE.BoxGeometry(gw + 1, 0.8, 1.3), new THREE.MeshBasicMaterial({ map: tex.checker() }));
    chk.material.map = U.canvasTexture('checkerWide', 128, function (c, w, h) { for (var y = 0; y < 2; y++) for (var x = 0; x < 16; x++) { c.fillStyle = (x + y) % 2 ? '#111' : '#fff'; c.fillRect(x * 8, y * 8, 8, 8); } }, { nearest: true, height: 16 });
    chk.position.copy(banner.position); chk.position.y -= 1.6; chk.quaternion.copy(banner.quaternion); g.add(chk);

    // boost pads
    var padTex = U.canvasTexture('pad', 64, function (c, w, h) {
      c.fillStyle = '#1b6cff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#7dfcff';
      for (var i = 0; i < 3; i++) { var y = i * 20 + 4; c.beginPath(); c.moveTo(8, y); c.lineTo(32, y + 12); c.lineTo(56, y); c.lineTo(56, y + 6); c.lineTo(32, y + 18); c.lineTo(8, y + 6); c.fill(); }
    }, { clamp: true });
    var padMat = this.padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95 });
    var padGeo = new THREE.PlaneGeometry(1, 1);
    this.boostPads.forEach(function (bp) {
      var sm = path.sample(bp.s);
      var idx = sm.idx;
      var m = new THREE.Mesh(padGeo, padMat);
      m.position.copy(sm.pos).addScaledVector(sm.right, bp.lat); m.position.y += hExtra[idx] + 0.06;
      var look = new THREE.Matrix4().lookAt(new THREE.Vector3(), sm.up.clone().negate(), sm.tan);
      m.quaternion.setFromRotationMatrix(look);
      m.scale.set(bp.w, bp.len, 1);
      g.add(m);
      bp.mesh = m; bp.idx = idx;
    });

    // checkpoints visual (thin light beams for neon, flags for coast) - subtle
    this.cpS = [];
    for (var c = 0; c < this.cpCount; c++) this.cpS.push(c * path.length / this.cpCount);
  };

  // --------------------------------------------------------------- scenery
  /** radial envelope of the layout (max distance from origin per angle) + coarse station list for distance queries */
  Track.prototype._buildEnvelope = function () {
    var path = this.path, N = path.N, bins = 72, env = new Float32Array(bins);
    var maxR = 0;
    for (var j = 0; j < N; j++) {
      var p = path.P[j], r = Math.hypot(p.x, p.z), a = Math.atan2(p.z, p.x);
      var b = Math.floor(((a / (Math.PI * 2)) % 1 + 1) % 1 * bins) % bins;
      if (r > env[b]) env[b] = r;
      if (r > maxR) maxR = r;
    }
    // fill empty bins from neighbours and smooth
    for (var k = 0; k < 3; k++) {
      var e2 = new Float32Array(bins);
      for (b = 0; b < bins; b++) {
        var l = env[(b + bins - 1) % bins], c = env[b], rgt = env[(b + 1) % bins];
        if (c === 0) c = Math.max(l, rgt);
        e2[b] = Math.max(c, (l + c + rgt) / 3);
      }
      env = e2;
    }
    this.envelopeBins = env; this.maxRadius = maxR;
    var self = this;
    this.envelope = function (ang) {
      var t = ((ang / (Math.PI * 2)) % 1 + 1) % 1 * bins, i0 = Math.floor(t) % bins, i1 = (i0 + 1) % bins, f = t - Math.floor(t);
      return env[i0] * (1 - f) + env[i1] * f;
    };
    this.trackRadius = this.envelope;
    var coarse = this.coarse = [];
    for (j = 0; j < N; j += 4) coarse.push(path.P[j]);
    this.distToPath = function (x, z) {
      var best = 1e9;
      for (var i = 0; i < coarse.length; i++) { var dx = coarse[i].x - x, dz = coarse[i].z - z, d = dx * dx + dz * dz; if (d < best) best = d; }
      return Math.sqrt(best);
    };
  };

  Track.prototype._buildScenery = function () {
    var th = this.theme, g = this.group;
    var rng = U.rng(th.mood === 'neon' ? 777 : 333);
    g.add(skyDome(th.sky[0], th.sky[1], th.mood === 'neon'));
    var groundY = -0.3;
    if (th.mood === 'coast') this._sceneryCoast(rng, this.envelope, null, groundY);
    else this._sceneryNeon(rng, this.envelope, null, groundY);
  };

  function fanGeom(radiusFn, segments, y, inner) {
    var pos = [], nor = [], uv = [], idx = [];
    if (!inner) { pos.push(0, y, 0); nor.push(0, 1, 0); uv.push(0, 0); }
    for (var i = 0; i <= segments; i++) {
      var a = i / segments * Math.PI * 2, r = radiusFn(a);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (inner) { var ri = inner(a); pos.push(Math.cos(a) * ri, y, Math.sin(a) * ri); nor.push(0, 1, 0); uv.push(Math.cos(a) * ri / 20, Math.sin(a) * ri / 20); }
      pos.push(x, y, z); nor.push(0, 1, 0); uv.push(x / 20, z / 20);
    }
    if (!inner) { for (i = 0; i < segments; i++) idx.push(0, i + 2, i + 1); }
    else { for (i = 0; i < segments; i++) { var b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  }

  Track.prototype._sceneryCoast = function (rng, trackRadius, trackHeight, groundY) {
    var g = this.group, tex = U.tex, path = this.path;
    // island: grass fan to radius+22, sand ring to +55, water beyond
    var grass = new THREE.Mesh(fanGeom(function (a) { return trackRadius(a) + 24; }, 180, groundY), new THREE.MeshStandardMaterial({ map: tex.grass(), roughness: 1 }));
    grass.receiveShadow = true; g.add(grass);
    var sand = new THREE.Mesh(fanGeom(function (a) { return trackRadius(a) + 62 + Math.sin(a * 7) * 6; }, 180, groundY - 0.05, function (a) { return trackRadius(a) + 23; }), new THREE.MeshStandardMaterial({ map: tex.sand(), roughness: 1 }));
    sand.receiveShadow = true; g.add(sand);
    var waterTex = tex.water(); waterTex.repeat.set(80, 80);
    var water = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600), new THREE.MeshStandardMaterial({ map: waterTex, roughness: 0.15, metalness: 0.3, color: 0x9fdcff }));
    water.rotation.x = -Math.PI / 2; water.position.y = groundY - 0.9; g.add(water);
    this.animated.push(function (dt, t) { waterTex.offset.x = t * 0.01; waterTex.offset.y = Math.sin(t * 0.3) * 0.02; });

    // palms along both sides of the road
    var trunkGeo = new THREE.CylinderGeometry(0.25, 0.42, 7, 6); trunkGeo.translate(0, 3.5, 0);
    var frondGeo = new THREE.PlaneGeometry(5, 2.2); frondGeo.translate(2.5, 0, 0);
    var trunks = [], fronds = [];
    var tmp = new THREE.Vector3(), m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    var palmSpots = [];
    for (var j = 0; j < path.N; j += 10) {
      if (this.tunnelMask[j]) continue;
      if (rng() < 0.45) {
        var side = rng() < 0.5 ? -1 : 1;
        var lat = side > 0 ? this.maxLat[j] + rng.range(5, 13) : this.minLat[j] - rng.range(5, 13);
        tmp.copy(path.P[j]).addScaledVector(path.R[j], lat); tmp.y = groundY;
        palmSpots.push({ p: tmp.clone(), s: rng.range(0.8, 1.3), rot: rng() * 6.28 });
      }
    }
    var trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x9c6b3c, roughness: 1 }), palmSpots.length);
    var frondMesh = new THREE.InstancedMesh(frondGeo, new THREE.MeshStandardMaterial({ map: tex.palmFrond(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), palmSpots.length * 6);
    palmSpots.forEach(function (ps, i) {
      e.set(0, ps.rot, 0.12); q.setFromEuler(e); sc.set(ps.s, ps.s, ps.s);
      m4.compose(ps.p, q, sc); trunkMesh.setMatrixAt(i, m4);
      for (var k = 0; k < 6; k++) {
        e.set(0, k / 6 * Math.PI * 2 + ps.rot, -0.55 + rng() * 0.2); q.setFromEuler(e);
        tmp.copy(ps.p); tmp.y += 7 * ps.s;
        m4.compose(tmp, q, sc); frondMesh.setMatrixAt(i * 6 + k, m4);
      }
    });
    trunkMesh.castShadow = true; frondMesh.castShadow = true; g.add(trunkMesh); g.add(frondMesh);

    // colourful buildings inside the loop and along the coast
    var pastel = [0xff9aa2, 0xffd166, 0x9be7ff, 0xb5ead7, 0xe2c2ff, 0xfff5ba, 0xffb7b2, 0xc7ceea];
    var byVar = [[], [], [], [], []];
    var cnt = 0, tries = 0, self = this, startP = path.P[30];
    while (cnt < 110 && tries++ < 3000) {
      var a = rng() * Math.PI * 2, tr = trackRadius(a);
      var inside = rng() < 0.75;
      var r = inside ? rng.range(0, tr - 30) : rng.range(tr + 28, tr + 52);
      var w = rng.range(8, 22), d = rng.range(8, 22), h = inside ? rng.range(8, 42) : rng.range(6, 16);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (self.distToPath(x, z) < 24 + Math.max(w, d) * 0.7) continue;
      if (Math.hypot(x - startP.x, z - startP.z) < 70) continue; // grandstands live here
      var geo = boxWithUV(w, h, d, 6);
      geo.translate(x, h / 2 + groundY, z);
      geo.rotateY(0); // axis aligned looks city-like
      var vi = rng.int(0, 4);
      byVar[vi].push(geo);
      cnt++;
    }
    byVar.forEach(function (list, vi) {
      if (!list.length) return;
      var mat = new THREE.MeshStandardMaterial({ map: tex.windowsDay(vi), color: pastel[vi % pastel.length], roughness: 0.8 });
      var m = new THREE.Mesh(mergeGeoms(list), mat); m.castShadow = true; m.receiveShadow = true; g.add(m);
    });

    // grandstands near start line (both sides)
    var crowdTex = U.canvasTexture('crowd', 128, function (c, w, h) {
      var r2 = U.rng(5); var cols = ['#ff4d6d', '#ffd166', '#06d6a0', '#118ab2', '#ffffff', '#f4a261'];
      c.fillStyle = '#334'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 400; i++) { c.fillStyle = r2.pick(cols); c.beginPath(); c.arc(r2() * w, r2() * h, 3, 0, 7); c.fill(); }
    });
    crowdTex.repeat.set(6, 2);
    var standMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 1 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0xff2f6d, roughness: 0.6 });
    for (var side = -1; side <= 1; side += 2) {
      for (var jj = 8; jj < 60; jj += 2) {
        // build stepped stands using few boxes
      }
      var j0 = 6, j1 = 56, sm0 = path.P[j0], sm1 = path.P[j1];
      var len = sm0.distanceTo(sm1);
      var mid = sm0.clone().lerp(sm1, 0.5);
      var lat = side > 0 ? this.maxLat[30] + 9 : this.minLat[30] - 9;
      mid.addScaledVector(path.R[30], lat);
      var yaw = Math.atan2(path.T[30].x, path.T[30].z);
      for (var step = 0; step < 4; step++) {
        var box = new THREE.Mesh(new THREE.BoxGeometry(len, 1.6, 3), standMat);
        box.position.copy(mid); box.position.y = groundY + 0.8 + step * 1.6;
        box.position.addScaledVector(path.R[30], side * step * 2.6);
        box.rotation.y = yaw + Math.PI / 2; box.castShadow = true; box.receiveShadow = true; g.add(box);
      }
      var roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.5, 14), roofMat);
      roof.position.copy(mid).addScaledVector(path.R[30], side * 5); roof.position.y = groundY + 10;
      roof.rotation.y = yaw + Math.PI / 2; roof.castShadow = true; g.add(roof);
    }

    // clouds
    var cloudMat = new THREE.SpriteMaterial({ map: tex.smoke(), color: 0xffffff, opacity: 0.95, transparent: true, depthWrite: false, fog: false });
    for (var c = 0; c < 26; c++) {
      var a2 = rng() * Math.PI * 2, r2 = rng.range(200, 900);
      var cl = new THREE.Sprite(cloudMat);
      cl.position.set(Math.cos(a2) * r2, rng.range(90, 170), Math.sin(a2) * r2);
      var s2 = rng.range(50, 120); cl.scale.set(s2 * 1.6, s2 * 0.8, 1);
      g.add(cl);
    }
    // sun
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xfff1b0, transparent: true, fog: false }));
    sun.position.set(-600, 500, -900); sun.scale.set(260, 260, 1); g.add(sun);

    // hot air balloons
    for (var b = 0; b < 5; b++) {
      var ba = rng() * 6.28, br = rng.range(120, 260);
      var balloon = new THREE.Group();
      var env = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 10), new THREE.MeshStandardMaterial({ color: rng.pick(pastel), roughness: 0.7 }));
      var basket = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
      basket.position.y = -8.5; balloon.add(env); balloon.add(basket);
      balloon.position.set(Math.cos(ba) * br, rng.range(40, 80), Math.sin(ba) * br);
      g.add(balloon);
      (function (bl, ph) { this.animated.push(function (dt, t) { bl.position.y += Math.sin(t * 0.5 + ph) * 0.02; bl.position.x += Math.cos(t * 0.2 + ph) * 0.03; }); }).call(this, balloon, b);
    }
  };

  Track.prototype._sceneryNeon = function (rng, trackRadius, trackHeight, groundY) {
    var g = this.group, tex = U.tex, path = this.path, self = this;
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: (function () { var t = tex.concrete(); t.repeat.set(150, 150); return t; })(), color: 0x6a6f86, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = groundY; ground.receiveShadow = true; g.add(ground);
    // glowing street grid lines on the ground
    var gridTex = U.canvasTexture('grid', 256, function (c, w, h) {
      c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(0,229,255,0.5)'; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4);
    });
    gridTex.repeat.set(60, 60);
    var grid = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.35, depthWrite: false }));
    grid.rotation.x = -Math.PI / 2; grid.position.y = groundY + 0.02; g.add(grid);

    // dense neon skyline
    var neonCols = [0x00e5ff, 0xff2fd6, 0xffe22f, 0x8f5cff, 0x2fff9b, 0xff5f2f];
    var byVar = [[], [], [], [], []], strips = [];
    var cnt = 0, tries = 0, startP = path.P[30];
    while (cnt < 210 && tries++ < 6000) {
      var a = rng() * Math.PI * 2, tr = trackRadius(a);
      var inside = rng() < 0.5;
      var r = inside ? rng.range(0, tr - 26) : rng.range(tr + 24, tr + 170);
      var w = rng.range(8, 26), d = rng.range(8, 26), h = inside ? rng.range(15, 70) : rng.range(20, 120);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (self.distToPath(x, z) < 22 + Math.max(w, d) * 0.7) continue;
      if (Math.hypot(x - startP.x, z - startP.z) < 60) continue;
      var geo = boxWithUV(w, h, d, 5);
      geo.translate(x, h / 2 + groundY, z);
      byVar[rng.int(0, 4)].push(geo);
      // neon edge strips (vertical) on two corners
      var col = rng.pick(neonCols);
      for (var c2 = 0; c2 < 2; c2++) {
        var sx = x + (c2 ? w / 2 : -w / 2), sz = z + (c2 ? d / 2 : -d / 2);
        var sg = new THREE.BoxGeometry(0.5, h, 0.5); sg.translate(sx, h / 2 + groundY, sz);
        strips.push({ geo: sg, col: col });
      }
      // roof cap strip
      var rg = new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6); rg.translate(x, h + groundY, z);
      strips.push({ geo: rg, col: col });
      cnt++;
    }
    byVar.forEach(function (list, vi) {
      if (!list.length) return;
      var mat = new THREE.MeshStandardMaterial({ map: tex.windowsNight(vi), color: 0xffffff, emissive: 0xffffff, emissiveMap: tex.windowsNight(vi), emissiveIntensity: 0.9, roughness: 0.6 });
      var m = new THREE.Mesh(mergeGeoms(list), mat); m.castShadow = false; m.receiveShadow = true; g.add(m);
    });
    // group strips by colour
    var byCol = {};
    strips.forEach(function (s) { (byCol[s.col] = byCol[s.col] || []).push(s.geo); });
    Object.keys(byCol).forEach(function (col) {
      var m = new THREE.Mesh(mergeGeoms(byCol[col]), new THREE.MeshBasicMaterial({ color: parseInt(col) }));
      g.add(m);
    });

    // billboards near the track
    for (var b = 0; b < 16; b++) {
      var j = Math.floor(rng() * path.N);
      if (this.tunnelMask[j]) continue;
      var side = rng() < 0.5 ? -1 : 1;
      var lat = side > 0 ? this.maxLat[j] + rng.range(6, 12) : this.minLat[j] - rng.range(6, 12);
      var bb = new THREE.Group();
      var panel = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 0.6), new THREE.MeshBasicMaterial({ map: tex.billboard(b) }));
      panel.position.y = 9;
      var pole = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.8), new THREE.MeshStandardMaterial({ color: 0x222233 }));
      pole.position.y = 4.5;
      bb.add(panel); bb.add(pole);
      bb.position.copy(path.P[j]).addScaledVector(path.R[j], lat); bb.position.y = groundY;
      bb.lookAt(path.P[j].x, groundY, path.P[j].z);
      g.add(bb);
    }

    // neon lamp posts along the road
    var lampGeo = new THREE.BoxGeometry(0.3, 6, 0.3); lampGeo.translate(0, 3, 0);
    var headGeo = new THREE.BoxGeometry(1.6, 0.3, 0.5); headGeo.translate(0, 6, 0);
    var spots = [];
    for (j = 0; j < path.N; j += 24) {
      if (this.tunnelMask[j]) continue;
      spots.push({ j: j, lat: this.maxLat[j] + 2.2 }); spots.push({ j: j, lat: this.minLat[j] - 2.2 });
    }
    var lamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a3e }), spots.length);
    var heads = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x9dfbff }), spots.length);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), tmp = new THREE.Vector3(), e = new THREE.Euler();
    spots.forEach(function (sp, i) {
      tmp.copy(path.P[sp.j]).addScaledVector(path.R[sp.j], sp.lat); tmp.y += self.hExtra[sp.j];
      e.set(0, Math.atan2(path.T[sp.j].x, path.T[sp.j].z), 0); q.setFromEuler(e);
      m4.compose(tmp, q, sc); lamps.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
    });
    g.add(lamps); g.add(heads);

    // moon
    var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xdfe8ff, transparent: true, fog: false }));
    moon.position.set(700, 600, -800); moon.scale.set(160, 160, 1); g.add(moon);

    // rotating searchlights
    var beamMat = new THREE.MeshBasicMaterial({ color: 0x7fe7ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    for (var s = 0; s < 4; s++) {
      var beam = new THREE.Mesh(new THREE.ConeGeometry(14, 260, 12, 1, true), beamMat);
      beam.geometry.translate(0, 130, 0);
      var ba = rng() * 6.28, br = rng.range(60, 200);
      beam.position.set(Math.cos(ba) * br, groundY, Math.sin(ba) * br);
      beam.rotation.z = 0.5;
      g.add(beam);
      (function (bm, ph) { self.animated.push(function (dt, t) { bm.rotation.y = t * 0.4 + ph; }); })(beam, s);
    }

    // neon pulse on rails
    var railEmTarget = 0.9;
    this.animated.push(function (dt, t) { self.padMat.opacity = 0.75 + Math.sin(t * 6) * 0.2; });
  };

  Track.prototype.update = function (dt, t) {
    for (var i = 0; i < this.animated.length; i++) this.animated[i](dt, t);
    if (this.padMat) this.padMat.map.offset.y = -(t * 1.5) % 1;
  };

  global.TRACKS = TRACKS;
  global.Track = Track;
})(window);
