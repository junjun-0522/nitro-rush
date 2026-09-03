/* ============================================================
   NITRO RUSH - original characters (drivers) and pets
   ============================================================ */
(function (global) {
  'use strict';

  function mat(color, opts) {
    var o = { color: color, roughness: 0.55, metalness: 0.1 };
    if (opts) for (var k in opts) o[k] = opts[k];
    return new THREE.MeshStandardMaterial(o);
  }
  function add(parent, geo, m, x, y, z) { var mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; }
  function eyes(parent, y, z, spread, r, color) {
    var m = mat(color || 0x111111, { roughness: 0.3 });
    add(parent, new THREE.SphereGeometry(r || 0.045, 8, 6), m, -spread, y, z);
    add(parent, new THREE.SphereGeometry(r || 0.045, 8, 6), m, spread, y, z);
  }
  var BLACK = 0x111111, WHITE = 0xffffff;

  // stat: multipliers (1 = neutral). speed / accel / handling / gauge
  var CHARS = [
    {
      id: 'volt', name: 'VOLT', kr: '볼트', desc: '반짝이는 바이저의 레이싱 로봇. 최고속이 높다.',
      stat: { speed: 1.04, accel: 0.98, handling: 0.97, gauge: 1.0 }, mass: 1.0, body: 0x9aa3b5,
      build: function (g, c) {
        var m = mat(0xb8c2d6, { metalness: 0.6, roughness: 0.3 });
        add(g, new THREE.BoxGeometry(0.46, 0.42, 0.42), m, 0, 0.22, 0);
        add(g, new THREE.BoxGeometry(0.4, 0.1, 0.05), mat(0x00e5ff, { emissive: 0x00e5ff, emissiveIntensity: 1.2 }), 0, 0.26, 0.22);
        add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), m, 0.15, 0.55, 0);
        add(g, new THREE.SphereGeometry(0.05, 8, 6), mat(0xff2f6d, { emissive: 0xff2f6d, emissiveIntensity: 1 }), 0.15, 0.68, 0);
        add(g, new THREE.BoxGeometry(0.1, 0.16, 0.1), m, -0.28, 0.2, 0); add(g, new THREE.BoxGeometry(0.1, 0.16, 0.1), m, 0.28, 0.2, 0);
      }
    },
    {
      id: 'kiki', name: 'KIKI', kr: '키키', desc: '재빠른 고양이 드라이버. 코너링이 날카롭다.',
      stat: { speed: 0.98, accel: 1.0, handling: 1.07, gauge: 1.0 }, mass: 0.9, body: 0xfff1d6,
      build: function (g, c) {
        var fur = mat(0xfff1d6), pink = mat(0xffa3c2);
        add(g, new THREE.SphereGeometry(0.27, 14, 10), fur, 0, 0.22, 0);
        var e1 = add(g, new THREE.ConeGeometry(0.09, 0.2, 4), fur, -0.16, 0.5, 0); e1.rotation.z = 0.35;
        var e2 = add(g, new THREE.ConeGeometry(0.09, 0.2, 4), fur, 0.16, 0.5, 0); e2.rotation.z = -0.35;
        add(g, new THREE.ConeGeometry(0.05, 0.12, 4), pink, -0.16, 0.48, 0.02).rotation.z = 0.35;
        add(g, new THREE.ConeGeometry(0.05, 0.12, 4), pink, 0.16, 0.48, 0.02).rotation.z = -0.35;
        eyes(g, 0.26, 0.24, 0.1, 0.04);
        add(g, new THREE.SphereGeometry(0.03, 6, 5), pink, 0, 0.18, 0.27);
      }
    },
    {
      id: 'bruno', name: 'BRUNO', kr: '브루노', desc: '묵직한 곰. 출발 가속이 좋고 부딪히면 밀리지 않는다.',
      stat: { speed: 0.97, accel: 1.07, handling: 0.97, gauge: 1.0 }, mass: 1.35, body: 0x8b5a2b,
      build: function (g, c) {
        var fur = mat(0x8b5a2b), tan = mat(0xd9b27c);
        add(g, new THREE.SphereGeometry(0.29, 14, 10), fur, 0, 0.22, 0);
        add(g, new THREE.SphereGeometry(0.09, 8, 6), fur, -0.2, 0.45, 0); add(g, new THREE.SphereGeometry(0.09, 8, 6), fur, 0.2, 0.45, 0);
        add(g, new THREE.SphereGeometry(0.12, 10, 8), tan, 0, 0.14, 0.22);
        add(g, new THREE.SphereGeometry(0.04, 6, 5), mat(BLACK), 0, 0.17, 0.33);
        eyes(g, 0.28, 0.24, 0.1, 0.04);
      }
    },
    {
      id: 'nova', name: 'NOVA', kr: '노바', desc: '우주비행사. 드리프트 게이지가 빨리 찬다.',
      stat: { speed: 1.0, accel: 1.0, handling: 1.0, gauge: 1.12 }, mass: 1.0, body: 0xf4f6ff,
      build: function (g, c) {
        var suit = mat(0xf4f6ff, { roughness: 0.4 });
        add(g, new THREE.SphereGeometry(0.29, 16, 12), suit, 0, 0.22, 0);
        var visor = add(g, new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x1a2a6c, { roughness: 0.1, metalness: 0.7, emissive: 0x2244aa, emissiveIntensity: 0.3 }), 0, 0.2, 0.12);
        visor.rotation.x = Math.PI / 2 - 0.3;
        add(g, new THREE.BoxGeometry(0.34, 0.3, 0.16), mat(0xc9d1e8, { metalness: 0.4 }), 0, -0.02, -0.26);
        add(g, new THREE.BoxGeometry(0.1, 0.06, 0.06), mat(0xff2f6d, { emissive: 0xff2f6d, emissiveIntensity: 0.8 }), 0.12, 0.02, -0.35);
      }
    },
    {
      id: 'zed', name: 'ZED', kr: '제드', desc: '모히칸 펑크. 빠르지만 거칠다.',
      stat: { speed: 1.06, accel: 1.02, handling: 0.94, gauge: 0.98 }, mass: 1.0, body: 0xffd9b3,
      build: function (g, c) {
        var skin = mat(0xffd9b3);
        add(g, new THREE.SphereGeometry(0.26, 14, 10), skin, 0, 0.22, 0);
        add(g, new THREE.BoxGeometry(0.08, 0.26, 0.4), mat(0xff2fd6, { emissive: 0xff2fd6, emissiveIntensity: 0.3 }), 0, 0.5, -0.02);
        add(g, new THREE.BoxGeometry(0.4, 0.09, 0.08), mat(0x111111, { roughness: 0.2, metalness: 0.6 }), 0, 0.26, 0.23);
        add(g, new THREE.TorusGeometry(0.03, 0.01, 6, 10), mat(0xffd700, { metalness: 0.9, roughness: 0.2 }), -0.26, 0.16, 0.02);
      }
    },
    {
      id: 'lulu', name: 'LULU', kr: '룰루', desc: '긴 귀 토끼. 모든 능력이 고르다.',
      stat: { speed: 1.0, accel: 1.02, handling: 1.02, gauge: 1.03 }, mass: 0.9, body: 0xffe6f0,
      build: function (g, c) {
        var fur = mat(0xffe6f0), pink = mat(0xff9fc4);
        add(g, new THREE.SphereGeometry(0.26, 14, 10), fur, 0, 0.22, 0);
        var e1 = add(g, new THREE.BoxGeometry(0.1, 0.42, 0.06), fur, -0.11, 0.6, -0.02); e1.rotation.z = 0.18;
        var e2 = add(g, new THREE.BoxGeometry(0.1, 0.42, 0.06), fur, 0.11, 0.6, -0.02); e2.rotation.z = -0.18;
        add(g, new THREE.BoxGeometry(0.05, 0.3, 0.02), pink, -0.11, 0.6, 0.02).rotation.z = 0.18;
        add(g, new THREE.BoxGeometry(0.05, 0.3, 0.02), pink, 0.11, 0.6, 0.02).rotation.z = -0.18;
        eyes(g, 0.26, 0.23, 0.09, 0.04);
        add(g, new THREE.SphereGeometry(0.04, 6, 5), pink, -0.16, 0.16, 0.2); add(g, new THREE.SphereGeometry(0.04, 6, 5), pink, 0.16, 0.16, 0.2);
      }
    },
    {
      id: 'rex', name: 'REX', kr: '렉스', desc: '초록 공룡. 무겁고 강하다.',
      stat: { speed: 1.02, accel: 1.0, handling: 0.96, gauge: 1.0 }, mass: 1.3, body: 0x3fbf5a,
      build: function (g, c) {
        var skin = mat(0x3fbf5a), belly = mat(0xc9f5a0);
        add(g, new THREE.BoxGeometry(0.42, 0.36, 0.5), skin, 0, 0.22, 0.05);
        add(g, new THREE.BoxGeometry(0.3, 0.14, 0.2), belly, 0, 0.1, 0.25);
        for (var i = 0; i < 3; i++) add(g, new THREE.ConeGeometry(0.06, 0.16, 4), mat(0xffe066), 0, 0.46, -0.16 + i * 0.14);
        for (i = 0; i < 4; i++) add(g, new THREE.BoxGeometry(0.04, 0.06, 0.03), mat(WHITE), -0.12 + i * 0.08, 0.06, 0.31);
        eyes(g, 0.32, 0.31, 0.12, 0.045);
      }
    },
    {
      id: 'pip', name: 'PIP', kr: '핍', desc: '작은 펭귄. 반응이 빠르고 가볍다.',
      stat: { speed: 0.98, accel: 1.04, handling: 1.03, gauge: 1.0 }, mass: 0.85, body: 0x1d2233,
      build: function (g, c) {
        var body = mat(0x1d2233), face = mat(0xffffff);
        add(g, new THREE.SphereGeometry(0.27, 14, 10), body, 0, 0.22, 0);
        var f = add(g, new THREE.SphereGeometry(0.2, 12, 8), face, 0, 0.19, 0.1); f.scale.set(1, 0.9, 0.6);
        add(g, new THREE.ConeGeometry(0.06, 0.16, 6), mat(0xff9f1c), 0, 0.18, 0.32).rotation.x = Math.PI / 2;
        eyes(g, 0.28, 0.25, 0.09, 0.04);
      }
    }
  ];

  var PETS = [
    {
      id: 'spark', name: 'SPARK', kr: '스파크', desc: '반짝이는 빛 구슬. 드리프트 게이지 +5%',
      perk: { gauge: 1.05 },
      build: function () {
        var g = new THREE.Group();
        var core = add(g, new THREE.SphereGeometry(0.2, 12, 10), mat(0xfff2a0, { emissive: 0xffd000, emissiveIntensity: 1.4 }), 0, 0, 0);
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.tex.particle(), color: 0xffe066, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.scale.set(1.4, 1.4, 1); g.add(glow);
        var ring = add(g, new THREE.TorusGeometry(0.34, 0.025, 6, 20), mat(0xffffff, { emissive: 0xffe066, emissiveIntensity: 1 }), 0, 0, 0);
        return { root: g, animate: function (dt, t) { ring.rotation.x = t * 2; ring.rotation.y = t * 1.3; core.scale.setScalar(1 + Math.sin(t * 6) * 0.1); glow.material.opacity = 0.6 + Math.sin(t * 5) * 0.2; }, sparkle: true };
      }
    },
    {
      id: 'bitsy', name: 'BITSY', kr: '빗시', desc: '꼬마 드론. 가속 +3%',
      perk: { accel: 1.03 },
      build: function () {
        var g = new THREE.Group();
        add(g, new THREE.BoxGeometry(0.34, 0.18, 0.34), mat(0x2fe0ff, { metalness: 0.5, roughness: 0.3 }), 0, 0, 0);
        add(g, new THREE.SphereGeometry(0.05, 8, 6), mat(0xff2f6d, { emissive: 0xff2f6d, emissiveIntensity: 1.2 }), 0, 0.06, 0.18);
        var props = [];
        [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].forEach(function (p) {
          add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), mat(0x444455), p[0], 0.12, p[1]);
          props.push(add(g, new THREE.BoxGeometry(0.26, 0.01, 0.05), mat(0xdddddd, { transparent: true, opacity: 0.7 }), p[0], 0.18, p[1]));
        });
        return { root: g, animate: function (dt, t) { for (var i = 0; i < props.length; i++) props[i].rotation.y = t * 30 + i; } };
      }
    },
    {
      id: 'mochi', name: 'MOCHI', kr: '모찌', desc: '말랑한 찹쌀떡. 코너링 +3%',
      perk: { handling: 1.03 },
      build: function () {
        var g = new THREE.Group();
        var b = add(g, new THREE.SphereGeometry(0.26, 14, 10), mat(0xfffaf0, { roughness: 0.9 }), 0, 0, 0);
        eyes(g, 0.05, 0.22, 0.09, 0.035);
        add(g, new THREE.SphereGeometry(0.035, 6, 5), mat(0xffb3c6), -0.15, -0.03, 0.2); add(g, new THREE.SphereGeometry(0.035, 6, 5), mat(0xffb3c6), 0.15, -0.03, 0.2);
        return { root: g, animate: function (dt, t) { var s = 1 + Math.sin(t * 4) * 0.08; b.scale.set(s, 1 / s, s); } };
      }
    },
    {
      id: 'flap', name: 'FLAP', kr: '플랩', desc: '작은 새. 최고속 +2%',
      perk: { speed: 1.02 },
      build: function () {
        var g = new THREE.Group();
        add(g, new THREE.SphereGeometry(0.2, 12, 10), mat(0x2fa8ff), 0, 0, 0);
        add(g, new THREE.SphereGeometry(0.15, 10, 8), mat(0xffffff), 0, -0.02, 0.1).scale.set(1, 0.8, 0.5);
        add(g, new THREE.ConeGeometry(0.05, 0.14, 6), mat(0xff9f1c), 0, 0, 0.25).rotation.x = Math.PI / 2;
        eyes(g, 0.06, 0.16, 0.08, 0.03);
        var wL = add(g, new THREE.BoxGeometry(0.34, 0.02, 0.16), mat(0x2fa8ff), -0.25, 0.05, 0); var wR = add(g, new THREE.BoxGeometry(0.34, 0.02, 0.16), mat(0x2fa8ff), 0.25, 0.05, 0);
        add(g, new THREE.BoxGeometry(0.08, 0.02, 0.2), mat(0x2fa8ff), 0, 0.02, -0.22);
        return { root: g, animate: function (dt, t) { var a = Math.sin(t * 14) * 0.7; wL.rotation.z = a; wR.rotation.z = -a; wL.position.y = 0.05 + Math.abs(a) * 0.05; wR.position.y = wL.position.y; } };
      }
    },
    {
      id: 'ghostie', name: 'GHOSTIE', kr: '고스티', desc: '장난꾸러기 유령. 게이지 +3%, 최고속 +1%',
      perk: { gauge: 1.03, speed: 1.01 },
      build: function () {
        var g = new THREE.Group();
        var m = mat(0xe8f4ff, { transparent: true, opacity: 0.75, emissive: 0x88bbff, emissiveIntensity: 0.25 });
        add(g, new THREE.SphereGeometry(0.24, 14, 10), m, 0, 0.05, 0);
        var tail = add(g, new THREE.ConeGeometry(0.22, 0.4, 10, 1, true), m, 0, -0.2, 0); tail.rotation.x = Math.PI;
        eyes(g, 0.08, 0.2, 0.08, 0.04, 0x223355);
        add(g, new THREE.SphereGeometry(0.035, 6, 5), mat(0x223355), 0, -0.02, 0.23);
        return { root: g, animate: function (dt, t) { m.opacity = 0.6 + Math.sin(t * 3) * 0.15; tail.rotation.y = t * 2; } };
      }
    },
    {
      id: 'starlet', name: 'STARLET', kr: '스탈렛', desc: '빙글빙글 별. 부스터 지속 +8%',
      perk: { boostDur: 1.08 },
      build: function () {
        var g = new THREE.Group();
        var m = mat(0xffe066, { emissive: 0xffb300, emissiveIntensity: 1.0, metalness: 0.3, roughness: 0.3 });
        var s = add(g, new THREE.OctahedronGeometry(0.28, 0), m, 0, 0, 0); s.scale.set(1, 1.4, 1);
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.tex.particle(), color: 0xffe066, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.scale.set(1.2, 1.2, 1); g.add(glow);
        return { root: g, animate: function (dt, t) { s.rotation.y = t * 3; s.rotation.z = Math.sin(t * 2) * 0.3; }, sparkle: true };
      }
    }
  ];

  function findChar(id) { for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === id) return CHARS[i]; return CHARS[0]; }
  function findPet(id) { for (var i = 0; i < PETS.length; i++) if (PETS[i].id === id) return PETS[i]; return null; }

  /** driver group: origin at the seat, +z forward, +y up */
  function buildDriver(charId, accent) {
    var def = findChar(charId), g = new THREE.Group();
    // torso in the kart's accent colour, then the character's head/details
    var torso = add(g, new THREE.BoxGeometry(0.5, 0.45, 0.35), mat(accent, { roughness: 0.5 }), 0, -0.22, 0);
    def.build(g, def);
    return { group: g, def: def, torso: torso };
  }

  function buildPet(petId) {
    var def = findPet(petId);
    if (!def) return null;
    var built = def.build();
    built.root.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    built.def = def;
    return built;
  }

  global.CHARS = CHARS; global.PETS = PETS;
  global.findChar = findChar; global.findPet = findPet;
  global.buildDriver = buildDriver; global.buildPet = buildPet;
})(window);
