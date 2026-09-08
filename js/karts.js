/* ============================================================
   NITRO RUSH - kart bodies (chassis types)
   Each kart: stat multipliers, mass, wheel layout, driver seat,
   exhaust positions and a build(ctx) that adds the body parts.
   ctx = { add(geo, mat, x, y, z), G(key, make), m: materials, isPlayer, variant, color, accent }
   Kart frame: +z forward, +y up, origin on the ground under the kart centre.
   ============================================================ */
(function (global) {
  'use strict';

  function taper(w, h, d, fx, fy) {
    // box whose +z half is scaled (fx, fy) -> wedge / nose shapes
    var g = new THREE.BoxGeometry(w, h, d), p = g.getAttribute('position');
    for (var i = 0; i < p.count; i++) if (p.getZ(i) > 0) { p.setX(i, p.getX(i) * fx); p.setY(i, p.getY(i) * fy - (1 - fy) * h * 0.15); }
    g.computeVertexNormals(); return g;
  }
  var STD_WHEELS = [[-0.82, 0.9], [0.82, 0.9], [-0.86, -0.85], [0.86, -0.85]];

  // ---- helpers for the sleek bodies ----------------------------------------------
  /** smooth bevelled hull from a side profile ([z, y] points, +z forward), extruded across the width */
  function hull(pts, width, bevel) {
    bevel = bevel || 0.12;
    var sh = new THREE.Shape(); pts.forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); }); sh.closePath();
    var depth = Math.max(0.2, width - bevel * 2);
    var g = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 });
    g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0); g.computeVertexNormals();
    return g;
  }
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  /** rear wing with end plates + two struts */
  function wing(c, key, w, y, z, tilt) {
    var m = c.m, add = c.add, G = c.G;
    add(G(key + 'W', function () { return box(w, 0.07, 0.44); }), m.acc, 0, y, z).rotation.x = tilt || -0.15;
    add(G(key + 'P', function () { return box(0.05, 0.4, 0.5); }), m.dark, -w / 2, y - 0.1, z);
    add(G(key + 'P', function () { return box(0.05, 0.4, 0.5); }), m.dark, w / 2, y - 0.1, z);
    add(G(key + 'S', function () { return box(0.07, y - 0.75, 0.07); }), m.dark, -0.42, (y + 0.75) / 2 - 0.05, z);
    add(G(key + 'S', function () { return box(0.07, y - 0.75, 0.07); }), m.dark, 0.42, (y + 0.75) / 2 - 0.05, z);
  }
  function lamps(c, key, x, y, z, w) { var m = c.m; c.add(c.G(key, function () { return box(w || 0.3, 0.07, 0.06); }), m.lamp, -x, y, z); c.add(c.G(key, function () { return box(w || 0.3, 0.07, 0.06); }), m.lamp, x, y, z); }
  function canopy(c, key, x, y, z, sx, sy, sz) { var d = c.add(c.G(key, function () { return new THREE.SphereGeometry(0.45, 14, 10); }), c.m.glass, x, y, z); d.scale.set(sx, sy, sz); return d; }

  var KARTS = [
    {
      id: 'nitro', name: 'NITRO S1', kr: '니트로 S1', desc: '기본형 카트. 모든 성능이 고르게 균형 잡혀 있다.',
      stat: { speed: 1.0, accel: 1.0, handling: 1.0, gauge: 1.0 }, mass: 1.0,
      wheel: { r: 0.33, w: 0.32, pos: STD_WHEELS }, driver: [0, 1.2, -0.35], stripes: true,
      exhausts: [[-0.32, 0.5, -1.35], [0.32, 0.5, -1.35]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('floor', function () { return new THREE.BoxGeometry(1.5, 0.12, 2.5); }), m.dark, 0, 0.32, 0);
        add(G('tub', function () { return new THREE.BoxGeometry(1.1, 0.42, 1.5); }), m.paint, 0, 0.55, -0.15);
        add(G('nose', function () { return taper(0.9, 0.32, 1.1, 0.55, 0.6); }), m.paint, 0, 0.55, 1.05);
        add(G('wing', function () { return new THREE.BoxGeometry(1.7, 0.1, 0.4); }), m.acc, 0, 0.36, 1.45);
        add(G('wingLip', function () { return new THREE.BoxGeometry(1.7, 0.16, 0.08); }), m.acc, 0, 0.42, 1.62);
        add(G('pod', function () { return new THREE.BoxGeometry(0.35, 0.3, 1.0); }), m.acc, -0.72, 0.5, -0.1);
        add(G('pod', function () { return new THREE.BoxGeometry(0.35, 0.3, 1.0); }), m.acc, 0.72, 0.5, -0.1);
        add(G('engine', function () { return new THREE.BoxGeometry(0.8, 0.45, 0.6); }), m.dark, 0, 0.62, -0.95);
        add(G('engineTop', function () { return new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8); }), m.chrome, 0.2, 0.9, -0.95);
        add(G('engineTop', function () { return new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8); }), m.chrome, -0.2, 0.9, -0.95);
        add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), m.dark, -0.55, 1.05, -1.15);
        add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), m.dark, 0.55, 1.05, -1.15);
        add(G('spoiler', function () { return new THREE.BoxGeometry(1.7, 0.08, 0.45); }), m.acc, 0, 1.3, -1.15).rotation.x = -0.2;
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, -0.28, 0.5, 1.6);
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, 0.28, 0.5, 1.6);
        add(G('tail', function () { return new THREE.BoxGeometry(0.7, 0.08, 0.05); }), m.tail, 0, 0.72, -1.27);
      }
    },
    {
      id: 'bullet', name: 'BULLET', kr: '불릿', desc: '총알형 유선 차체. 최고속이 가장 높지만 코너에서 미끄러진다.',
      stat: { speed: 1.06, accel: 0.97, handling: 0.94, gauge: 1.0 }, mass: 0.95,
      wheel: { r: 0.3, w: 0.28, pos: [[-0.78, 0.85], [0.78, 0.85], [-0.82, -0.9], [0.82, -0.9]] }, driver: [0, 1.15, -0.35], stripes: true,
      exhausts: [[-0.2, 0.62, -1.85], [0.2, 0.62, -1.85]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('bFloor', function () { return new THREE.BoxGeometry(1.3, 0.1, 2.2); }), m.dark, 0, 0.32, 0);
        add(G('bFus', function () { return new THREE.CylinderGeometry(0.5, 0.55, 2.4, 12).rotateX(Math.PI / 2); }), m.paint, 0, 0.62, 0);
        add(G('bNose', function () { return new THREE.ConeGeometry(0.5, 1.0, 12).rotateX(Math.PI / 2); }), m.acc, 0, 0.62, 1.7);
        add(G('bTail', function () { return new THREE.ConeGeometry(0.55, 0.6, 12).rotateX(-Math.PI / 2); }), m.dark, 0, 0.62, -1.5);
        var can = add(G('bCanopy', function () { return new THREE.SphereGeometry(0.4, 12, 8); }), m.glass, 0, 0.98, 0.35); can.scale.set(1, 0.55, 1.3);
        add(G('bFin', function () { return new THREE.BoxGeometry(1.3, 0.06, 0.5); }), m.acc, 0, 0.62, -1.1);
        add(G('bVfin', function () { return new THREE.BoxGeometry(0.06, 0.65, 0.55); }), m.acc, 0, 1.05, -1.2);
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, 0, 0.75, 2.1);
        add(G('bTailL', function () { return new THREE.TorusGeometry(0.42, 0.05, 6, 16); }), m.tail, 0, 0.62, -1.62);
      }
    },
    {
      id: 'bigfoot', name: 'BIGFOOT', kr: '빅풋', desc: '거대한 바퀴의 몬스터 트럭. 무거워서 부딪혀도 밀리지 않지만 가속이 느리다.',
      stat: { speed: 0.97, accel: 0.96, handling: 0.95, gauge: 1.0 }, mass: 1.5,
      wheel: { r: 0.52, w: 0.45, pos: [[-0.95, 0.95], [0.95, 0.95], [-0.95, -0.95], [0.95, -0.95]] }, driver: [0, 1.6, -0.4], stripes: false,
      exhausts: [[-0.4, 0.95, -1.45], [0.4, 0.95, -1.45]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('tFrame', function () { return new THREE.BoxGeometry(1.4, 0.16, 2.6); }), m.dark, 0, 0.78, 0);
        add(G('tCab', function () { return new THREE.BoxGeometry(1.5, 0.5, 1.1); }), m.paint, 0, 1.1, 0.35);
        add(G('tHood', function () { return new THREE.BoxGeometry(1.35, 0.35, 0.9); }), m.paint, 0, 1.2, 1.05);
        add(G('tBed', function () { return new THREE.BoxGeometry(1.5, 0.38, 1.2); }), m.paint, 0, 1.05, -0.8);
        add(G('tGrille', function () { return new THREE.BoxGeometry(1.1, 0.32, 0.08); }), m.chrome, 0, 1.05, 1.52);
        add(G('tBumper', function () { return new THREE.BoxGeometry(1.7, 0.18, 0.15); }), m.chrome, 0, 0.82, 1.58);
        add(G('tBumper', function () { return new THREE.BoxGeometry(1.7, 0.18, 0.15); }), m.chrome, 0, 0.82, -1.5);
        [[-0.55, -0.05], [0.55, -0.05], [-0.55, -0.95], [0.55, -0.95]].forEach(function (p) { add(G('tPost', function () { return new THREE.BoxGeometry(0.08, 0.75, 0.08); }), m.dark, p[0], 1.72, p[1]); });
        add(G('tBar', function () { return new THREE.BoxGeometry(1.2, 0.08, 0.08); }), m.dark, 0, 2.1, -0.05);
        add(G('tBar', function () { return new THREE.BoxGeometry(1.2, 0.08, 0.08); }), m.dark, 0, 2.1, -0.95);
        add(G('tSide', function () { return new THREE.BoxGeometry(0.08, 0.08, 0.98); }), m.dark, -0.55, 2.1, -0.5);
        add(G('tSide', function () { return new THREE.BoxGeometry(0.08, 0.08, 0.98); }), m.dark, 0.55, 2.1, -0.5);
        [-0.35, 0, 0.35].forEach(function (x) { add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, x, 2.16, 0.0); });
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, -0.45, 1.12, 1.57);
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, 0.45, 1.12, 1.57);
        add(G('tail', function () { return new THREE.BoxGeometry(0.7, 0.08, 0.05); }), m.tail, 0, 1.15, -1.42);
        add(G('tAxle', function () { return new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6).rotateZ(Math.PI / 2); }), m.chrome, 0, 0.52, 0.95);
        add(G('tAxle', function () { return new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6).rotateZ(Math.PI / 2); }), m.chrome, 0, 0.52, -0.95);
      }
    },
    {
      id: 'formula', name: 'FORMULA X', kr: '포뮬러 X', desc: '넓은 윙의 포뮬러 머신. 코너링이 가장 날카롭다.',
      stat: { speed: 1.02, accel: 1.0, handling: 1.08, gauge: 0.98 }, mass: 0.9,
      wheel: { r: 0.36, w: 0.4, pos: [[-0.95, 1.0], [0.95, 1.0], [-0.98, -0.95], [0.98, -0.95]] }, driver: [0, 1.05, -0.3], stripes: false,
      exhausts: [[-0.25, 0.55, -1.3], [0.25, 0.55, -1.3]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('fFloor', function () { return new THREE.BoxGeometry(1.6, 0.06, 2.4); }), m.dark, 0, 0.3, 0);
        add(G('fMono', function () { return new THREE.BoxGeometry(0.7, 0.4, 2.2); }), m.paint, 0, 0.55, 0.1);
        add(G('fNose', function () { return taper(0.6, 0.3, 1.5, 0.45, 0.55); }), m.paint, 0, 0.5, 1.7);
        add(G('fFWing', function () { return new THREE.BoxGeometry(2.1, 0.06, 0.5); }), m.acc, 0, 0.3, 2.15);
        add(G('fFPlate', function () { return new THREE.BoxGeometry(0.06, 0.25, 0.5); }), m.dark, -1.05, 0.4, 2.15);
        add(G('fFPlate', function () { return new THREE.BoxGeometry(0.06, 0.25, 0.5); }), m.dark, 1.05, 0.4, 2.15);
        add(G('fRWing', function () { return new THREE.BoxGeometry(2.0, 0.08, 0.5); }), m.acc, 0, 1.2, -1.3);
        add(G('fRPlate', function () { return new THREE.BoxGeometry(0.06, 0.5, 0.55); }), m.dark, -1.0, 1.02, -1.3);
        add(G('fRPlate', function () { return new THREE.BoxGeometry(0.06, 0.5, 0.55); }), m.dark, 1.0, 1.02, -1.3);
        add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), m.dark, -0.3, 0.95, -1.3);
        add(G('strut', function () { return new THREE.BoxGeometry(0.08, 0.5, 0.08); }), m.dark, 0.3, 0.95, -1.3);
        add(G('fPod', function () { return new THREE.BoxGeometry(0.5, 0.3, 1.1); }), m.acc, -0.62, 0.5, -0.2);
        add(G('fPod', function () { return new THREE.BoxGeometry(0.5, 0.3, 1.1); }), m.acc, 0.62, 0.5, -0.2);
        add(G('fAir', function () { return new THREE.BoxGeometry(0.4, 0.35, 0.55); }), m.paint, 0, 1.3, -0.75);
        add(G('tail', function () { return new THREE.BoxGeometry(0.7, 0.08, 0.05); }), m.tail, 0, 0.62, -1.22);
      }
    },
    {
      id: 'hover', name: 'HOVER', kr: '호버', desc: '바퀴 없이 떠다니는 호버 카트. 가볍고 드리프트 게이지가 빨리 찬다.',
      stat: { speed: 1.0, accel: 1.04, handling: 1.0, gauge: 1.1 }, mass: 0.85, hover: true,
      wheel: { r: 0, w: 0, hidden: true, pos: [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]] }, driver: [0, 1.05, -0.2], stripes: false,
      exhausts: [[-0.5, 0.65, -1.45], [0.5, 0.65, -1.45]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('hDisk', function () { return new THREE.CylinderGeometry(1.05, 1.15, 0.28, 18); }), m.paint, 0, 0.55, 0);
        add(G('hRim', function () { return new THREE.TorusGeometry(1.12, 0.06, 8, 28).rotateX(Math.PI / 2); }), m.glow, 0, 0.55, 0);
        var dome = add(G('hDome', function () { return new THREE.SphereGeometry(0.62, 14, 10); }), m.glass, 0, 0.72, 0.5); dome.scale.set(1, 0.5, 1.25);
        add(G('hDeck', function () { return new THREE.BoxGeometry(1.1, 0.12, 1.2); }), m.dark, 0, 0.7, -0.45);
        add(G('hThr', function () { return new THREE.CylinderGeometry(0.18, 0.24, 0.6, 10).rotateX(Math.PI / 2); }), m.chrome, -0.5, 0.65, -1.15);
        add(G('hThr', function () { return new THREE.CylinderGeometry(0.18, 0.24, 0.6, 10).rotateX(Math.PI / 2); }), m.chrome, 0.5, 0.65, -1.15);
        add(G('hFin', function () { return new THREE.BoxGeometry(0.06, 0.45, 0.6); }), m.acc, -0.85, 0.9, -0.6);
        add(G('hFin', function () { return new THREE.BoxGeometry(0.06, 0.45, 0.6); }), m.acc, 0.85, 0.9, -0.6);
        [[-0.7, 0.75], [0.7, 0.75], [-0.7, -0.75], [0.7, -0.75]].forEach(function (p) { add(G('hPad', function () { return new THREE.TorusGeometry(0.3, 0.05, 6, 16).rotateX(Math.PI / 2); }), m.glow, p[0], 0.36, p[1]); });
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, -0.3, 0.6, 1.12);
        add(G('lamp', function () { return new THREE.BoxGeometry(0.18, 0.1, 0.06); }), m.lamp, 0.3, 0.6, 1.12);
      }
    },
    {
      id: 'geobukseon', name: 'GEOBUKSEON', kr: '거북선', desc: '용머리와 철갑 등껍질을 단 거북선 카트. 묵직하고 출발이 빠르다.',
      stat: { speed: 0.99, accel: 1.03, handling: 0.98, gauge: 1.02 }, mass: 1.4,
      wheel: { r: 0.33, w: 0.32, pos: STD_WHEELS }, driver: [0, 1.15, -0.15], stripes: false,
      exhausts: [[-0.3, 0.62, -1.78], [0.3, 0.62, -1.78]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('gHull', function () { return new THREE.BoxGeometry(1.4, 0.5, 2.8); }), m.wood, 0, 0.55, 0);
        add(G('gBow', function () { return taper(1.3, 0.45, 0.9, 0.4, 0.8); }), m.wood, 0, 0.58, 1.75);
        add(G('gTrim', function () { return new THREE.BoxGeometry(1.46, 0.12, 2.82); }), m.paint, 0, 0.75, 0);
        add(G('gStern', function () { return new THREE.BoxGeometry(1.4, 0.65, 0.35); }), m.wood, 0, 0.7, -1.55);
        var shell = add(G('gShell', function () { return new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); }), m.green, 0, 0.8, -0.85); shell.scale.set(0.78, 0.55, 0.95);
        [[-0.5, -1.45], [0, -1.55], [0.5, -1.45], [-0.55, -0.95], [0, -1.05], [0.55, -0.95], [-0.45, -0.45], [0, -0.5], [0.45, -0.45]].forEach(function (p) {
          var nx = p[0] / 0.78, nz = (p[1] + 0.85) / 0.95, y = 0.8 + 0.55 * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
          add(G('gSpike', function () { return new THREE.ConeGeometry(0.06, 0.26, 5); }), m.chrome, p[0], y + 0.1, p[1]);
        });
        var neck = add(G('gNeck', function () { return new THREE.CylinderGeometry(0.18, 0.26, 0.7, 8); }), m.green, 0, 0.9, 1.75); neck.rotation.x = -0.5;
        add(G('gHead', function () { return new THREE.BoxGeometry(0.5, 0.42, 0.7); }), m.green, 0, 1.12, 2.05);
        add(G('gJaw', function () { return new THREE.BoxGeometry(0.44, 0.14, 0.55); }), m.red, 0, 0.9, 2.15);
        add(G('gEye', function () { return new THREE.SphereGeometry(0.07, 8, 6); }), m.lamp, -0.18, 1.2, 2.35);
        add(G('gEye', function () { return new THREE.SphereGeometry(0.07, 8, 6); }), m.lamp, 0.18, 1.2, 2.35);
        add(G('gHorn', function () { return new THREE.ConeGeometry(0.05, 0.32, 5); }), m.chrome, -0.15, 1.42, 1.85).rotation.x = -0.5;
        add(G('gHorn', function () { return new THREE.ConeGeometry(0.05, 0.32, 5); }), m.chrome, 0.15, 1.42, 1.85).rotation.x = -0.5;
        [0.6, -0.15, -0.9].forEach(function (z) {
          add(G('gOar', function () { return new THREE.BoxGeometry(0.85, 0.06, 0.07); }), m.wood, -1.05, 0.5, z).rotation.y = 0.5;
          add(G('gOar', function () { return new THREE.BoxGeometry(0.85, 0.06, 0.07); }), m.wood, 1.05, 0.5, z).rotation.y = -0.5;
        });
        add(G('gPole', function () { return new THREE.CylinderGeometry(0.02, 0.02, 1.3, 4); }), m.chrome, 0, 1.6, -1.6);
        add(G('gFlag', function () { return new THREE.BoxGeometry(0.02, 0.36, 0.55); }), m.flag, 0, 2.05, -1.35);
        add(G('gCannon', function () { return new THREE.CylinderGeometry(0.07, 0.09, 0.4, 8).rotateZ(Math.PI / 2); }), m.dark, -0.72, 0.62, 0.3);
        add(G('gCannon', function () { return new THREE.CylinderGeometry(0.07, 0.09, 0.4, 8).rotateZ(Math.PI / 2); }), m.dark, 0.72, 0.62, 0.3);
      }
    }
  ];

  // ---- the sleek generation (tiered, unlocked through progression) ----------------
  KARTS.push(
    {
      id: 'rally', name: 'RALLY GT', kr: '랠리 GT', desc: '스완넥 윙을 단 GT 레이서. 코너에서 가장 안정적이다.', tier: 'rare', unlock: { level: 10 },
      stat: { speed: 1.02, accel: 1.01, handling: 1.06, gauge: 1.0 }, mass: 1.0,
      wheel: { r: 0.34, w: 0.34, pos: [[-0.86, 1.0], [0.86, 1.0], [-0.88, -0.95], [0.88, -0.95]] }, driver: [0, 1.15, -0.35], stripes: false,
      exhausts: [[-0.3, 0.55, -1.7], [0.3, 0.55, -1.7]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('rgHull', function () { return hull([[-1.5, 0.3], [-1.55, 0.75], [-1.1, 0.95], [-0.4, 1.02], [0.4, 0.95], [1.4, 0.62], [1.9, 0.48], [1.95, 0.3]], 1.35); }), m.paint, 0, 0, 0);
        add(G('rgFloor', function () { return box(1.5, 0.08, 3.1); }), m.dark, 0, 0.3, 0.1);
        add(G('rgSplit', function () { return box(1.6, 0.08, 0.5); }), m.dark, 0, 0.36, 1.95);
        add(G('rgScoop', function () { return box(0.4, 0.22, 0.5); }), m.acc, 0, 1.1, -0.9);
        wing(c, 'rg', 2.0, 1.4, -1.3, -0.18);
        canopy(c, 'rgCan', 0, 0.98, 0.3, 1.1, 0.45, 1.3);
        add(G('rgNum', function () { return box(0.04, 0.4, 0.5); }), m.acc, -0.7, 0.72, 0.2); add(G('rgNum', function () { return box(0.04, 0.4, 0.5); }), m.acc, 0.7, 0.72, 0.2);
        lamps(c, 'rgLamp', 0.42, 0.55, 1.9, 0.3);
        add(G('rgTail', function () { return box(1.2, 0.06, 0.05); }), m.tail, 0, 0.7, -1.57);
      }
    },
    {
      id: 'blade', name: 'BLADE', kr: '블레이드', desc: '칼날처럼 낮고 날카로운 쐐기 차체. 최고속과 코너링을 겸비.', tier: 'rare', unlock: { level: 12 },
      stat: { speed: 1.04, accel: 0.98, handling: 1.03, gauge: 1.0 }, mass: 0.95,
      wheel: { r: 0.34, w: 0.34, pos: [[-0.86, 1.0], [0.86, 1.0], [-0.9, -0.95], [0.9, -0.95]] }, driver: [0, 1.15, -0.35], stripes: false,
      exhausts: [[-0.3, 0.55, -1.75], [0.3, 0.55, -1.75]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('blHull', function () { return hull([[-1.5, 0.3], [-1.55, 0.72], [-1.2, 0.86], [-0.55, 0.98], [0.1, 0.92], [1.1, 0.62], [1.95, 0.42], [2.0, 0.3]], 1.25); }), m.paint, 0, 0, 0);
        add(G('blFloor', function () { return box(1.5, 0.08, 3.2); }), m.dark, 0, 0.3, 0.1);
        add(G('blSplit', function () { return taper(1.4, 0.12, 0.6, 0.5, 0.6); }), m.acc, 0, 0.4, 2.1);
        add(G('blPod', function () { return box(0.34, 0.26, 1.3); }), m.acc, -0.8, 0.5, -0.2); add(G('blPod', function () { return box(0.34, 0.26, 1.3); }), m.acc, 0.8, 0.5, -0.2);
        wing(c, 'bl', 1.9, 1.35, -1.35, -0.15);
        canopy(c, 'blCan', 0, 0.9, 0.35, 1.1, 0.45, 1.4);
        lamps(c, 'blLamp', 0.4, 0.5, 1.95, 0.34);
        add(G('blTail', function () { return box(1.1, 0.06, 0.05); }), m.tail, 0, 0.72, -1.57);
      }
    },
    {
      id: 'cotton', name: 'COTTON PUFF', kr: '코튼 퍼프', desc: '동글동글 솜사탕 카트. 가볍고 게이지가 아주 빨리 찬다.', tier: 'rare', unlock: { level: 15 },
      stat: { speed: 0.98, accel: 1.05, handling: 1.02, gauge: 1.12 }, mass: 0.9,
      wheel: { r: 0.3, w: 0.3, pos: [[-0.78, 0.8], [0.78, 0.8], [-0.8, -0.8], [0.8, -0.8]] }, driver: [0, 1.2, -0.3], stripes: false,
      exhausts: [[-0.3, 0.6, -1.45], [0.3, 0.6, -1.45]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        var b = add(G('coBody', function () { return new THREE.SphereGeometry(1, 16, 12); }), m.paint, 0, 0.72, 0.1); b.scale.set(0.7, 0.42, 1.35);
        add(G('coFloor', function () { return box(1.3, 0.08, 2.4); }), m.dark, 0, 0.32, 0.05);
        var n = add(G('coNose', function () { return new THREE.SphereGeometry(0.45, 12, 8); }), m.acc, 0, 0.6, 1.45); n.scale.set(1.2, 0.7, 0.8);
        add(G('coBump', function () { return new THREE.TorusGeometry(0.5, 0.08, 8, 20); }), m.chrome, 0, 0.55, 1.7);
        canopy(c, 'coCan', 0, 0.95, 0.35, 1.0, 0.6, 1.1);
        add(G('coHeart', function () { return new THREE.SphereGeometry(0.12, 8, 6); }), m.tail, -0.2, 0.95, -0.9); add(G('coHeart', function () { return new THREE.SphereGeometry(0.12, 8, 6); }), m.tail, 0.2, 0.95, -0.9);
        add(G('coWing', function () { return box(1.4, 0.06, 0.35); }), m.acc, 0, 1.05, -1.25);
        lamps(c, 'coLamp', 0.3, 0.6, 1.85, 0.2);
      }
    },
    {
      id: 'beast', name: 'BEAST', kr: '비스트', desc: '후드 스쿱과 광폭 펜더의 머슬 카트. 출발 가속이 압도적이다.', tier: 'rare', unlock: { level: 20 },
      stat: { speed: 1.0, accel: 1.08, handling: 0.96, gauge: 1.0 }, mass: 1.3,
      wheel: { r: 0.4, w: 0.42, pos: [[-0.92, 1.0], [0.92, 1.0], [-0.95, -0.95], [0.95, -0.95]] }, driver: [0, 1.25, -0.35], stripes: false,
      exhausts: [[-0.45, 0.6, -1.7], [0.45, 0.6, -1.7]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('beHull', function () { return hull([[-1.5, 0.3], [-1.55, 0.85], [-1.0, 1.0], [-0.3, 1.05], [0.4, 1.0], [1.3, 0.8], [1.8, 0.65], [1.85, 0.3]], 1.5); }), m.paint, 0, 0, 0);
        add(G('beFloor', function () { return box(1.7, 0.1, 3.0); }), m.dark, 0, 0.3, 0.1);
        add(G('beScoop', function () { return box(0.5, 0.2, 0.7); }), m.dark, 0, 1.1, 1.0);
        [[-0.85, 1.0], [0.85, 1.0], [-0.88, -0.95], [0.88, -0.95]].forEach(function (p) { add(G('beFender', function () { return box(0.5, 0.35, 1.0); }), m.paint, p[0], 0.75, p[1]); });
        add(G('beBar', function () { return box(1.8, 0.16, 0.14); }), m.chrome, 0, 0.6, 1.9);
        add(G('beBar2', function () { return box(0.12, 0.45, 0.12); }), m.chrome, -0.5, 0.85, 1.9); add(G('beBar2', function () { return box(0.12, 0.45, 0.12); }), m.chrome, 0.5, 0.85, 1.9);
        wing(c, 'be', 1.8, 1.4, -1.3, -0.1);
        lamps(c, 'beLamp', 0.5, 0.75, 1.86, 0.3);
        add(G('beTail', function () { return box(1.3, 0.07, 0.05); }), m.tail, 0, 0.8, -1.57);
      }
    },
    {
      id: 'knight', name: 'SHADOW KNIGHT', kr: '섀도우 나이트', desc: '검은 갑주를 두른 기사 카트. 푸른 눈빛이 어둠을 가른다.', tier: 'epic', unlock: { level: 25 },
      stat: { speed: 1.05, accel: 1.02, handling: 1.0, gauge: 1.03 }, mass: 1.1,
      wheel: { r: 0.35, w: 0.36, pos: [[-0.88, 1.0], [0.88, 1.0], [-0.9, -0.95], [0.9, -0.95]] }, driver: [0, 1.18, -0.35], stripes: false,
      exhausts: [[-0.32, 0.58, -1.8], [0.32, 0.58, -1.8]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('knHull', function () { return hull([[-1.5, 0.3], [-1.55, 0.8], [-1.3, 1.0], [-0.6, 1.05], [0.0, 1.0], [0.8, 0.8], [1.7, 0.6], [1.95, 0.45], [1.95, 0.3]], 1.35, 0.08); }), m.paint, 0, 0, 0);
        add(G('knFloor', function () { return box(1.6, 0.1, 3.2); }), m.dark, 0, 0.3, 0.1);
        [[-0.78, 0.4], [0.78, 0.4]].forEach(function (p, i) { var a = add(G('knArmor', function () { return box(0.22, 0.5, 1.6); }), m.dark, p[0], 0.7, p[1]); a.rotation.z = i ? -0.35 : 0.35; });
        add(G('knVisor', function () { return box(0.9, 0.07, 0.08); }), m.glow, 0, 0.62, 1.93);
        add(G('knCrest', function () { return box(0.08, 0.45, 0.9); }), m.acc, 0, 1.25, -1.0);
        add(G('knFin', function () { return box(0.06, 0.55, 0.6); }), m.acc, -0.7, 1.15, -1.3); add(G('knFin', function () { return box(0.06, 0.55, 0.6); }), m.acc, 0.7, 1.15, -1.3);
        add(G('knWing', function () { return box(1.8, 0.06, 0.4); }), m.dark, 0, 1.35, -1.35).rotation.x = -0.15;
        [[-0.88, 1.0], [0.88, 1.0], [-0.9, -0.95], [0.9, -0.95]].forEach(function (p) { add(G('knSpike', function () { return new THREE.ConeGeometry(0.07, 0.3, 5).rotateZ(p[0] < 0 ? Math.PI / 2 : -Math.PI / 2); }), m.chrome, p[0] * 1.25, 0.35, p[1]); });
        add(G('knTail', function () { return box(1.2, 0.06, 0.05); }), m.tail, 0, 0.75, -1.57);
      }
    },
    {
      id: 'sonic', name: 'SONIC WAVE', kr: '소닉 웨이브', desc: '음속을 노리는 초저상 광폭 차체. 직선에서는 아무도 못 따라온다.', tier: 'epic', unlock: { wins: 20 },
      stat: { speed: 1.07, accel: 0.98, handling: 0.97, gauge: 1.0 }, mass: 0.95,
      wheel: { r: 0.32, w: 0.36, pos: [[-1.0, 1.05], [1.0, 1.05], [-1.02, -1.0], [1.02, -1.0]] }, driver: [0, 1.05, -0.4], stripes: false,
      exhausts: [[-0.5, 0.5, -1.85], [0.5, 0.5, -1.85]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('soHull', function () { return hull([[-1.6, 0.28], [-1.65, 0.62], [-1.0, 0.72], [0.0, 0.8], [1.0, 0.62], [2.1, 0.4], [2.15, 0.28]], 1.6); }), m.paint, 0, 0, 0);
        add(G('soFloor', function () { return box(1.9, 0.06, 3.6); }), m.dark, 0, 0.28, 0.1);
        [[-0.95, 0.2, 0.35], [0.95, 0.2, -0.35]].forEach(function (p) { var f = add(G('soFin', function () { return box(0.06, 0.3, 1.4); }), m.acc, p[0], 0.62, p[1] ); f.rotation.z = p[2]; });
        add(G('soStrip', function () { return box(0.05, 0.04, 2.8); }), m.glow, -0.82, 0.7, 0.1); add(G('soStrip', function () { return box(0.05, 0.04, 2.8); }), m.glow, 0.82, 0.7, 0.1);
        add(G('soWing', function () { return box(2.3, 0.05, 0.4); }), m.acc, 0, 1.05, -1.5).rotation.x = -0.12;
        add(G('soPlate', function () { return box(0.05, 0.3, 0.45); }), m.dark, -1.15, 0.95, -1.5); add(G('soPlate', function () { return box(0.05, 0.3, 0.45); }), m.dark, 1.15, 0.95, -1.5);
        canopy(c, 'soCan', 0, 0.8, 0.4, 1.0, 0.35, 1.5);
        lamps(c, 'soLamp', 0.5, 0.42, 2.1, 0.4);
        add(G('soTail', function () { return box(1.5, 0.05, 0.05); }), m.tail, 0, 0.6, -1.67);
      }
    },
    {
      id: 'burst', name: 'NEON BURST', kr: '네온 버스트', desc: '네온 라인이 흐르는 사이버 카트. 드리프트 게이지 충전 최강.', tier: 'epic', unlock: { maxDrifts: 150 },
      stat: { speed: 1.02, accel: 1.03, handling: 1.0, gauge: 1.15 }, mass: 0.9,
      wheel: { r: 0.33, w: 0.34, pos: [[-0.84, 1.0], [0.84, 1.0], [-0.86, -0.95], [0.86, -0.95]] }, driver: [0, 1.15, -0.35], stripes: false,
      exhausts: [[-0.35, 0.62, -1.75], [0.35, 0.62, -1.75]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('nbHull', function () { return hull([[-1.45, 0.3], [-1.5, 0.7], [-0.9, 0.9], [0.2, 0.95], [1.2, 0.7], [1.85, 0.5], [1.9, 0.3]], 1.2, 0.08); }), m.paint, 0, 0, 0);
        add(G('nbFloor', function () { return box(1.5, 0.08, 3.1); }), m.dark, 0, 0.3, 0.1);
        [[-0.66, 0.85], [0.66, 0.85], [-0.66, 0.55], [0.66, 0.55]].forEach(function (p) { add(G('nbLine', function () { return box(0.05, 0.05, 2.6); }), m.glow, p[0], p[1], 0.15); });
        add(G('nbLineF', function () { return box(1.1, 0.05, 0.05); }), m.glow, 0, 0.55, 1.88);
        add(G('nbThr', function () { return new THREE.CylinderGeometry(0.2, 0.26, 0.5, 10).rotateX(Math.PI / 2); }), m.chrome, -0.5, 0.65, -1.55); add(G('nbThr', function () { return new THREE.CylinderGeometry(0.2, 0.26, 0.5, 10).rotateX(Math.PI / 2); }), m.chrome, 0.5, 0.65, -1.55);
        add(G('nbDisc', function () { return new THREE.CircleGeometry(0.18, 12); }), m.glow, -0.5, 0.65, -1.81).rotation.y = Math.PI; add(G('nbDisc', function () { return new THREE.CircleGeometry(0.18, 12); }), m.glow, 0.5, 0.65, -1.81).rotation.y = Math.PI;
        wing(c, 'nb', 1.7, 1.3, -1.25, -0.2);
        canopy(c, 'nbCan', 0, 0.95, 0.35, 1.05, 0.45, 1.3);
        lamps(c, 'nbLamp', 0.35, 0.5, 1.9, 0.3);
      }
    },
    {
      id: 'phantom', name: 'PHANTOM X', kr: '팬텀 X', desc: '각진 스텔스 차체. 조향이 날카롭고 소리 없이 파고든다.', tier: 'epic', unlock: { races: 100 },
      stat: { speed: 1.04, accel: 1.0, handling: 1.05, gauge: 1.0 }, mass: 0.95,
      wheel: { r: 0.34, w: 0.34, pos: [[-0.9, 1.0], [0.9, 1.0], [-0.92, -0.95], [0.92, -0.95]] }, driver: [0, 1.15, -0.35], stripes: false,
      exhausts: [[-0.3, 0.55, -1.8], [0.3, 0.55, -1.8]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('phHull', function () { return hull([[-1.5, 0.3], [-1.55, 0.7], [-1.0, 0.95], [-0.3, 1.0], [0.5, 0.8], [1.6, 0.5], [2.0, 0.35], [2.0, 0.3]], 1.4, 0.05); }), m.paint, 0, 0, 0);
        add(G('phFloor', function () { return box(1.6, 0.08, 3.3); }), m.dark, 0, 0.3, 0.1);
        [[-0.55, 1.2, -1.2], [0.55, 1.2, -1.2]].forEach(function (p, i) { var f = add(G('phFin', function () { return box(0.06, 0.6, 0.7); }), m.acc, p[0], p[1], p[2]); f.rotation.z = i ? 0.45 : -0.45; });
        add(G('phWing', function () { return box(1.6, 0.05, 0.4); }), m.dark, 0, 1.38, -1.35).rotation.x = -0.12;
        add(G('phSlit', function () { return box(1.2, 0.04, 0.05); }), m.lamp, 0, 0.45, 1.98);
        add(G('phSkirt', function () { return box(0.12, 0.2, 2.6); }), m.dark, -0.78, 0.4, 0.1); add(G('phSkirt', function () { return box(0.12, 0.2, 2.6); }), m.dark, 0.78, 0.4, 0.1);
        canopy(c, 'phCan', 0, 0.98, 0.3, 1.0, 0.4, 1.3);
        add(G('phTail', function () { return box(1.3, 0.05, 0.05); }), m.tail, 0, 0.7, -1.57);
      }
    },
    {
      id: 'dragon', name: 'DRAGONFIRE', kr: '드래곤파이어', desc: '황금 용의 머리와 날개를 단 전설급 카트. 모든 능력치가 높다.', tier: 'legend', unlock: { wins: 50 },
      stat: { speed: 1.06, accel: 1.04, handling: 1.02, gauge: 1.05 }, mass: 1.05,
      wheel: { r: 0.35, w: 0.36, pos: [[-0.88, 1.0], [0.88, 1.0], [-0.9, -0.95], [0.9, -0.95]] }, driver: [0, 1.18, -0.3], stripes: false,
      exhausts: [[-0.32, 0.58, -1.8], [0.32, 0.58, -1.8]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('drHull', function () { return hull([[-1.5, 0.3], [-1.6, 0.8], [-1.2, 0.95], [-0.4, 1.0], [0.4, 0.85], [1.4, 0.62], [1.9, 0.5], [1.95, 0.3]], 1.3); }), m.paint, 0, 0, 0);
        add(G('drFloor', function () { return box(1.5, 0.08, 3.2); }), m.dark, 0, 0.3, 0.1);
        add(G('drHead', function () { return box(0.55, 0.42, 0.7); }), m.chrome, 0, 0.85, 2.05);
        add(G('drJaw', function () { return box(0.48, 0.14, 0.55); }), m.acc, 0, 0.62, 2.12);
        add(G('drEye', function () { return new THREE.SphereGeometry(0.07, 8, 6); }), m.tail, -0.18, 0.95, 2.35); add(G('drEye', function () { return new THREE.SphereGeometry(0.07, 8, 6); }), m.tail, 0.18, 0.95, 2.35);
        add(G('drHorn', function () { return new THREE.ConeGeometry(0.05, 0.36, 5); }), m.chrome, -0.16, 1.2, 1.85).rotation.x = -0.6; add(G('drHorn', function () { return new THREE.ConeGeometry(0.05, 0.36, 5); }), m.chrome, 0.16, 1.2, 1.85).rotation.x = -0.6;
        [[-0.75, 0.35], [0.75, -0.35]].forEach(function (p) { var w = add(G('drWing', function () { return taper(1.1, 0.05, 0.9, 0.3, 1); }), m.acc, p[0], 1.25, -1.0); w.rotation.z = p[1]; w.rotation.y = p[0] < 0 ? -0.5 : 0.5; });
        [-1.3, -0.9, -0.5, -0.1].forEach(function (z) { add(G('drSpine', function () { return new THREE.ConeGeometry(0.06, 0.24, 5); }), m.chrome, 0, 1.08, z); });
        add(G('drTailFin', function () { return box(0.06, 0.5, 0.7); }), m.acc, 0, 1.15, -1.45);
        add(G('drTail', function () { return box(1.2, 0.06, 0.05); }), m.tail, 0, 0.72, -1.6);
      }
    },
    {
      id: 'paragon', name: 'PARAGON', kr: '파라곤', desc: '최고 등급 슈퍼카. 4기통 배기와 액티브 윙. 정점의 성능.', tier: 'legend', unlock: { level: 50 },
      stat: { speed: 1.08, accel: 1.03, handling: 1.04, gauge: 1.05 }, mass: 1.0,
      wheel: { r: 0.35, w: 0.38, pos: [[-0.92, 1.05], [0.92, 1.05], [-0.95, -1.0], [0.95, -1.0]] }, driver: [0, 1.15, -0.35], stripes: false,
      exhausts: [[-0.5, 0.55, -1.85], [-0.2, 0.55, -1.85], [0.2, 0.55, -1.85], [0.5, 0.55, -1.85]],
      build: function (c) {
        var m = c.m, add = c.add, G = c.G;
        add(G('pgHull', function () { return hull([[-1.55, 0.3], [-1.6, 0.78], [-1.25, 0.92], [-0.5, 1.02], [0.3, 0.95], [1.3, 0.65], [2.05, 0.45], [2.1, 0.3]], 1.4); }), m.paint, 0, 0, 0);
        add(G('pgFloor', function () { return box(1.7, 0.08, 3.5); }), m.dark, 0, 0.3, 0.1);
        add(G('pgDiff', function () { return taper(1.5, 0.3, 0.6, 1, 0.3); }), m.dark, 0, 0.42, -1.6);
        add(G('pgSplit', function () { return box(1.7, 0.06, 0.5); }), m.chrome, 0, 0.34, 2.05);
        add(G('pgSkirt', function () { return box(0.1, 0.15, 2.8); }), m.chrome, -0.78, 0.4, 0.1); add(G('pgSkirt', function () { return box(0.1, 0.15, 2.8); }), m.chrome, 0.78, 0.4, 0.1);
        add(G('pgIntake', function () { return box(0.3, 0.2, 0.6); }), m.dark, -0.62, 0.9, -0.5); add(G('pgIntake', function () { return box(0.3, 0.2, 0.6); }), m.dark, 0.62, 0.9, -0.5);
        wing(c, 'pg', 2.0, 1.42, -1.4, -0.2);
        add(G('pgGold', function () { return box(0.05, 0.05, 2.2); }), m.chrome, -0.6, 0.98, 0.3); add(G('pgGold', function () { return box(0.05, 0.05, 2.2); }), m.chrome, 0.6, 0.98, 0.3);
        canopy(c, 'pgCan', 0, 1.0, 0.3, 1.15, 0.45, 1.4);
        lamps(c, 'pgLamp', 0.45, 0.5, 2.05, 0.36);
        add(G('pgTail', function () { return box(1.4, 0.06, 0.05); }), m.tail, 0, 0.74, -1.62);
      }
    }
  );
  KARTS.forEach(function (k) { if (!k.tier) k.tier = 'common'; });
  findKart('hover').tier = 'rare'; findKart('hover').unlock = { level: 5 };
  findKart('geobukseon').tier = 'rare'; findKart('geobukseon').unlock = { level: 8 };

  function findKart(id) { for (var i = 0; i < KARTS.length; i++) if (KARTS[i].id === id) return KARTS[i]; return KARTS[0]; }
  global.KARTS = KARTS; global.findKart = findKart;
})(window);
