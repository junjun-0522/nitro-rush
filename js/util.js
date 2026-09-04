/* ============================================================
   NITRO RUSH - utilities: math helpers, seeded RNG,
   procedural canvas textures (no external assets)
   ============================================================ */
(function (global) {
  'use strict';

  var U = {};
  U.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.smooth = function (t) { return t * t * (3 - 2 * t); };
  U.damp = function (a, b, k, dt) { return U.lerp(a, b, 1 - Math.exp(-k * dt)); };
  U.wrapAngle = function (a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  U.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  U.fmtTime = function (ms) {
    if (ms === null || ms === undefined || !isFinite(ms)) return '--:--.---';
    var m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), x = Math.floor(ms % 1000);
    return U.pad2(m) + ':' + U.pad2(s) + '.' + (x < 100 ? (x < 10 ? '00' : '0') : '') + x;
  };
  U.ordinal = function (n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  /** deterministic RNG (mulberry32) */
  U.rng = function (seed) {
    var a = seed >>> 0;
    var f = function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.range = function (lo, hi) { return lo + (hi - lo) * f(); };
    f.int = function (lo, hi) { return Math.floor(f.range(lo, hi + 1)); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    return f;
  };

  // ---------------------------------------------------------------- textures
  var texCache = {};
  U.canvasTexture = function (key, size, draw, opts) {
    if (texCache[key]) return texCache[key];
    opts = opts || {};
    var c = document.createElement('canvas');
    c.width = size; c.height = opts.height || size;
    var g = c.getContext('2d');
    draw(g, c.width, c.height);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    if (THREE.SRGBColorSpace && !opts.linear) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (opts.nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipMapLinearFilter; }
    texCache[key] = t;
    return t;
  };

  function grain(g, w, h, rng, count, alphaMax, light) {
    for (var i = 0; i < count; i++) {
      var v = rng.int(0, 255), a = rng() * alphaMax;
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + a + ')';
      g.fillRect(rng() * w, rng() * h, rng.range(1, 3), rng.range(1, 3));
    }
  }

  U.tex = {
    asphalt: function () {
      return U.canvasTexture('asphalt', 256, function (g, w, h) {
        var rng = U.rng(11);
        g.fillStyle = '#5a5e6c'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 6000, 0.35);
        // subtle tire lines
        g.fillStyle = 'rgba(20,20,26,0.18)';
        for (var i = 0; i < 20; i++) g.fillRect(rng() * w, 0, rng.range(1, 4), h);
      }, { repeat: [1, 1] });
    },
    asphaltNight: function () {
      return U.canvasTexture('asphaltNight', 256, function (g, w, h) {
        var rng = U.rng(12);
        g.fillStyle = '#343646'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 6000, 0.3);
      });
    },
    dirt: function () {
      return U.canvasTexture('dirt', 256, function (g, w, h) {
        var rng = U.rng(21);
        g.fillStyle = '#a8773f'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 7000, 0.4);
        g.fillStyle = 'rgba(80,50,20,0.35)';
        for (var i = 0; i < 300; i++) { g.beginPath(); g.arc(rng() * w, rng() * h, rng.range(1, 5), 0, 7); g.fill(); }
      });
    },
    grass: function () {
      return U.canvasTexture('grass', 256, function (g, w, h) {
        var rng = U.rng(31);
        g.fillStyle = '#4fbf49'; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 9000; i++) {
          var v = rng.int(-25, 25);
          g.fillStyle = 'rgba(' + (60 + v) + ',' + (180 + v) + ',' + (60 + v) + ',0.6)';
          g.fillRect(rng() * w, rng() * h, 2, rng.range(2, 6));
        }
      });
    },
    sand: function () {
      return U.canvasTexture('sand', 256, function (g, w, h) {
        var rng = U.rng(41);
        g.fillStyle = '#efd99a'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 5000, 0.25);
      });
    },
    rock: function () {
      return U.canvasTexture('rock', 256, function (g, w, h) {
        var rng = U.rng(71);
        g.fillStyle = '#c8804a'; g.fillRect(0, 0, w, h);
        var y = 0;
        while (y < h) { var bh = rng.range(6, 22); var c = ['#c8804a', '#b86a3c', '#d9945c', '#a85a34', '#e0a068'][rng.int(0, 4)]; g.fillStyle = c; g.fillRect(0, y, w, bh); y += bh; }
        grain(g, w, h, rng, 5000, 0.22);
      });
    },
    snow: function () {
      return U.canvasTexture('snow', 256, function (g, w, h) {
        var rng = U.rng(81);
        g.fillStyle = '#f4f8ff'; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 4000; i++) { var v = rng.int(-14, 6); g.fillStyle = 'rgba(' + (230 + v) + ',' + (238 + v) + ',255,0.5)'; g.fillRect(rng() * w, rng() * h, rng.range(1, 4), rng.range(1, 4)); }
      });
    },
    ice: function () {
      return U.canvasTexture('ice', 256, function (g, w, h) {
        var rng = U.rng(91);
        g.fillStyle = '#aebfd6'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 4000, 0.18, true);
        g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.5;
        for (var i = 0; i < 28; i++) { g.beginPath(); var x = rng() * w, y = rng() * h; g.moveTo(x, y); for (var k = 0; k < 4; k++) { x += rng.range(-30, 30); y += rng.range(-30, 30); g.lineTo(x, y); } g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,0.12)'; for (i = 0; i < 12; i++) { g.beginPath(); g.arc(rng() * w, rng() * h, rng.range(8, 30), 0, 7); g.fill(); }
      });
    },
    concrete: function () {
      return U.canvasTexture('concrete', 256, function (g, w, h) {
        var rng = U.rng(51);
        g.fillStyle = '#5a5d6b'; g.fillRect(0, 0, w, h);
        grain(g, w, h, rng, 4000, 0.25);
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
        g.strokeRect(2, 2, w - 4, h - 4);
      });
    },
    water: function () {
      return U.canvasTexture('water', 256, function (g, w, h) {
        var rng = U.rng(61);
        var grd = g.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, '#2fa8e6'); grd.addColorStop(1, '#1f7fd6');
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
        for (var i = 0; i < 40; i++) {
          g.beginPath();
          var x = rng() * w, y = rng() * h;
          g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 5, x + 26, y);
          g.stroke();
        }
      });
    },
    checker: function () {
      return U.canvasTexture('checker', 64, function (g, w, h) {
        for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) {
          g.fillStyle = (x + y) % 2 ? '#111' : '#f5f5f5';
          g.fillRect(x * 16, y * 16, 16, 16);
        }
      }, { nearest: true });
    },
    rumble: function () {
      return U.canvasTexture('rumble', 64, function (g, w, h) {
        g.fillStyle = '#ff2f4f'; g.fillRect(0, 0, w, h / 2);
        g.fillStyle = '#ffffff'; g.fillRect(0, h / 2, w, h / 2);
      }, { nearest: true });
    },
    stripe: function () {
      return U.canvasTexture('stripe', 64, function (g, w, h) {
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      });
    },
    windowsDay: function (seed) {
      return U.canvasTexture('winDay' + seed, 128, function (g, w, h) {
        var rng = U.rng(100 + seed);
        var base = ['#f6e9dc', '#ffd7c2', '#d7ecf7', '#fff3b0', '#e8dbff'][seed % 5];
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        for (var y = 6; y < h; y += 14) for (var x = 6; x < w; x += 14) {
          g.fillStyle = rng() < 0.8 ? '#4e8fc9' : '#2b4a68';
          g.fillRect(x, y, 8, 10);
        }
      });
    },
    windowsNight: function (seed) {
      return U.canvasTexture('winNight' + seed, 128, function (g, w, h) {
        var rng = U.rng(200 + seed);
        g.fillStyle = '#0b0d1c'; g.fillRect(0, 0, w, h);
        var cols = ['#ffd166', '#5ff5ff', '#ff5fd2', '#a0ff8f', '#ffffff'];
        for (var y = 6; y < h; y += 14) for (var x = 6; x < w; x += 14) {
          if (rng() < 0.55) { g.fillStyle = rng.pick(cols); g.fillRect(x, y, 8, 10); }
          else { g.fillStyle = '#141731'; g.fillRect(x, y, 8, 10); }
        }
      });
    },
    neonStrip: function () {
      return U.canvasTexture('neonStrip', 64, function (g, w, h) {
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      });
    },
    particle: function () {
      return U.canvasTexture('particle', 64, function (g, w, h) {
        var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.4, 'rgba(255,255,255,0.6)');
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
      }, { clamp: true, linear: true });
    },
    smoke: function () {
      return U.canvasTexture('smoke', 64, function (g, w, h) {
        var rng = U.rng(7);
        for (var i = 0; i < 18; i++) {
          var x = 16 + rng() * 32, y = 16 + rng() * 32, r = 10 + rng() * 14;
          var grd = g.createRadialGradient(x, y, 0, x, y, r);
          grd.addColorStop(0, 'rgba(255,255,255,0.28)');
          grd.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = grd; g.fillRect(0, 0, w, h);
        }
      }, { clamp: true, linear: true });
    },
    flame: function () {
      return U.canvasTexture('flame', 64, function (g, w, h) {
        var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255,255,255,1)');
        grd.addColorStop(0.3, 'rgba(255,220,120,0.9)');
        grd.addColorStop(0.7, 'rgba(255,90,30,0.4)');
        grd.addColorStop(1, 'rgba(255,60,0,0)');
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
      }, { clamp: true, linear: true });
    },
    billboard: function (seed) {
      return U.canvasTexture('bb' + seed, 256, function (g, w, h) {
        var rng = U.rng(300 + seed);
        var a = rng.pick(['#ff2fa0', '#2fe0ff', '#ffe22f', '#8f5cff', '#2fff9b']);
        var b = rng.pick(['#1a0033', '#001a33', '#330019', '#0b1f33']);
        var grd = g.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, a); grd.addColorStop(1, b);
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.font = 'bold 44px sans-serif'; g.textAlign = 'center';
        g.fillText(rng.pick(['NITRO', 'RUSH', 'DRIFT', 'TURBO', 'ZOOM', 'HYPER', 'VOLT']), w / 2, h / 2 + 14);
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      }, { clamp: true, height: 128 });
    },
    palmFrond: function () {
      return U.canvasTexture('frond', 128, function (g, w, h) {
        g.clearRect(0, 0, w, h);
        g.fillStyle = '#2fa84a';
        g.beginPath(); g.moveTo(0, h / 2);
        g.quadraticCurveTo(w / 2, 0, w, h / 2);
        g.quadraticCurveTo(w / 2, h, 0, h / 2); g.fill();
        g.strokeStyle = '#1d7a33'; g.lineWidth = 3;
        for (var i = 0; i < 10; i++) { g.beginPath(); g.moveTo(i * 12, h / 2); g.lineTo(i * 12 + 10, i % 2 ? 10 : h - 10); g.stroke(); }
      }, { clamp: true, height: 64 });
    },
    /** 태극기 (simplified but correctly oriented taeguk + four trigrams) */
    taegukgi: function () {
      return U.canvasTexture('taegukgi', 192, function (g, w, h) {
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
        var cx = w / 2, cy = h / 2, r = h * 0.25, tilt = Math.atan2(2, 3);
        g.save(); g.translate(cx, cy); g.rotate(tilt);
        g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill();
        g.fillStyle = '#0047a0'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
        g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(-r / 2, 0, r / 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#0047a0'; g.beginPath(); g.arc(r / 2, 0, r / 2, 0, Math.PI * 2); g.fill();
        g.restore();
        g.fillStyle = '#000';
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (b, i) {   // 건 감 리 곤
          var px = cx + b[0] * r * 1.55, py = cy + b[1] * r * 1.02;
          g.save(); g.translate(px, py); g.rotate(Math.atan2(b[1] * 1.02, b[0] * 1.55) + Math.PI / 2);
          for (var k = -1; k <= 1; k++) {
            var y = k * r * 0.24, solid = (i === 0) || (i === 1 && k === 0) || (i === 2 && k !== 0);
            if (solid) g.fillRect(-r * 0.34, y - r * 0.07, r * 0.68, r * 0.14);
            else { g.fillRect(-r * 0.34, y - r * 0.07, r * 0.29, r * 0.14); g.fillRect(r * 0.05, y - r * 0.07, r * 0.29, r * 0.14); }
          }
          g.restore();
        });
      }, { clamp: true, height: 128 });
    },
    label: function (key, text, color, bg) {
      return U.canvasTexture('label' + key, 256, function (g, w, h) {
        g.fillStyle = bg || 'rgba(0,0,0,0)'; g.fillRect(0, 0, w, h);
        g.fillStyle = color || '#fff'; g.font = 'bold 48px sans-serif'; g.textAlign = 'center';
        g.fillText(text, w / 2, h / 2 + 16);
      }, { clamp: true, height: 64 });
    }
  };

  global.U = U;
})(window);
