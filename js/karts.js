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

  function findKart(id) { for (var i = 0; i < KARTS.length; i++) if (KARTS[i].id === id) return KARTS[i]; return KARTS[0]; }
  global.KARTS = KARTS; global.findKart = findKart;
})(window);
