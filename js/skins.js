/* ============================================================
   NITRO RUSH - kart skins (paint jobs)
   A skin recolours the kart's paint/accent materials and can add
   a canvas pattern, metal/emissive tweaks and a glow colour.
   Skins are unlocked through the XP / achievement system
   (see progress.js) and picked in the garage inventory.
   ============================================================ */
(function (global) {
  'use strict';

  function css(hex) { return '#' + hex.toString(16).padStart(6, '0'); }

  // pattern painters: (g, w, h, body, accent) -> draws a tileable-ish pattern on a canvas
  var PATTERNS = {
    stripes: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.fillStyle = c2; g.fillRect(w * 0.36, 0, w * 0.28, h);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(w * 0.30, 0, w * 0.04, h); g.fillRect(w * 0.66, 0, w * 0.04, h);
    },
    flames: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var rng = U.rng(7);
      for (var i = 0; i < 9; i++) {
        var x = (i / 9) * w + rng.range(-6, 6), base = h, tip = h * rng.range(0.15, 0.45);
        g.fillStyle = i % 2 ? c2 : '#ffe066';
        g.beginPath(); g.moveTo(x - w * 0.08, base); g.quadraticCurveTo(x - w * 0.02, h * 0.6, x, tip); g.quadraticCurveTo(x + w * 0.03, h * 0.6, x + w * 0.09, base); g.closePath(); g.fill();
      }
    },
    camo: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var rng = U.rng(19), cols = [c2, '#3b4a2a', '#8a8f6a', '#1f261a'];
      for (var i = 0; i < 26; i++) {
        g.fillStyle = cols[i % cols.length];
        g.beginPath(); var x = rng() * w, y = rng() * h;
        g.ellipse(x, y, rng.range(10, 26), rng.range(7, 16), rng() * 3, 0, 7); g.fill();
      }
    },
    carbon: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var s = 8;
      for (var y = 0; y < h; y += s) for (var x = 0; x < w; x += s) {
        var odd = ((x / s + y / s) % 2) === 0;
        g.fillStyle = odd ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.28)';
        g.fillRect(x, y, s, s);
        g.fillStyle = odd ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
        g.fillRect(x, y, s, s / 2);
      }
      g.fillStyle = c2; g.fillRect(0, h * 0.44, w, h * 0.06);
    },
    galaxy: function (g, w, h, c1, c2) {
      var grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, c1); grd.addColorStop(0.5, c2); grd.addColorStop(1, '#12002e');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      var rng = U.rng(33);
      for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(' + rng.int(120, 255) + ',' + rng.int(60, 160) + ',255,0.18)'; g.beginPath(); g.ellipse(rng() * w, rng() * h, rng.range(20, 50), rng.range(8, 22), rng() * 3, 0, 7); g.fill(); }
      for (i = 0; i < 90; i++) { var a = rng(); g.fillStyle = 'rgba(255,255,255,' + (0.4 + a * 0.6).toFixed(2) + ')'; var r = a < 0.9 ? 1 : 2; g.fillRect(rng() * w, rng() * h, r, r); }
    },
    petals: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var rng = U.rng(45);
      for (var i = 0; i < 34; i++) {
        var x = rng() * w, y = rng() * h, r = rng.range(3, 6), rot = rng() * 6.28;
        g.fillStyle = i % 4 === 0 ? '#ffffff' : c2;
        g.save(); g.translate(x, y); g.rotate(rot);
        for (var p = 0; p < 5; p++) { g.beginPath(); g.ellipse(Math.cos(p * 1.2566) * r, Math.sin(p * 1.2566) * r, r * 0.9, r * 0.55, p * 1.2566, 0, 7); g.fill(); }
        g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(0, 0, r * 0.35, 0, 7); g.fill();
        g.restore();
      }
    },
    neon: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.strokeStyle = c2; g.lineWidth = 2; g.shadowColor = c2; g.shadowBlur = 6;
      for (var i = -h; i < w + h; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h * 0.6, h); g.stroke(); }
      g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.8;
      for (i = 0; i < h; i += 16) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    },
    pixel: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var rng = U.rng(58), s = 12, cols = [c2, '#ffffff', '#111111', c1, c1];
      for (var y = 0; y < h; y += s) for (var x = 0; x < w; x += s) { g.fillStyle = rng.pick(cols); g.fillRect(x, y, s, s); }
    },
    taeguk: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.26, tilt = -Math.atan2(2, 3);
      g.save(); g.translate(cx, cy); g.rotate(tilt);
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(-r / 2, 0, r / 2, 0, 7); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(r / 2, 0, r / 2, 0, 7); g.fill();
      g.restore();
      // trigram bars at the four corners
      g.fillStyle = '#111';
      var bars = [[3, 3, 3], [3, 1, 3], [1, 3, 1], [1, 1, 1]]; // 건 리 감 곤 (simplified)
      [[w * 0.14, h * 0.2], [w * 0.86, h * 0.2], [w * 0.14, h * 0.8], [w * 0.86, h * 0.8]].forEach(function (p, i) {
        for (var b = 0; b < 3; b++) {
          var y = p[1] - 6 + b * 6, x0 = p[0] - 10;
          if (bars[i][b] === 3) g.fillRect(x0, y, 20, 3.5); else { g.fillRect(x0, y, 8.5, 3.5); g.fillRect(x0 + 11.5, y, 8.5, 3.5); }
        }
      });
    },
    hex: function (g, w, h, c1, c2) {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.strokeStyle = c2; g.lineWidth = 1.5;
      var r = 10, dx = r * 1.732, dy = r * 1.5;
      for (var row = -1; row < h / dy + 1; row++) for (var col = -1; col < w / dx + 1; col++) {
        var x = col * dx + (row % 2 ? dx / 2 : 0), y = row * dy;
        g.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.stroke();
      }
    }
  };

  // unlock: { level } | { wins } | { races } | { trackWin: id } | { podiumAll: true } | { maxDrifts } | { online } | { records }
  var SKINS = [
    { id: 'classic', name: 'CLASSIC', kr: '클래식', desc: '노랑 + 핑크 기본 도색.', color: 0xffd60a, accent: 0xff2e7e, unlock: null },
    { id: 'midnight', name: 'MIDNIGHT', kr: '미드나이트', desc: '한밤의 네이비에 시안 포인트.', color: 0x1b2a5a, accent: 0x2fe0ff, glow: 0x2fe0ff, unlock: { level: 2 } },
    { id: 'lime', name: 'LIME PUNCH', kr: '라임 펀치', desc: '눈이 아플 만큼 쨍한 라임.', color: 0xa8ff2e, accent: 0x111111, unlock: { level: 3 } },
    { id: 'victory', name: 'VICTORY RED', kr: '빅토리 레드', desc: '첫 우승을 기념하는 레드 + 골드.', color: 0xe0202a, accent: 0xffc83d, glow: 0xffc83d, unlock: { wins: 1 } },
    { id: 'racing', name: 'RACING STRIPES', kr: '레이싱 스트라이프', desc: '흰 바탕에 굵은 레이싱 줄.', color: 0xf4f4f4, accent: 0xff2e2e, pattern: 'stripes', stripes: false, unlock: { level: 5 } },
    { id: 'blossom', name: 'BEOTKKOT', kr: '벚꽃', desc: '서울 벚꽃길에서 우승한 자의 도색.', color: 0xffb7d5, accent: 0xff4f8e, pattern: 'petals', glow: 0xffa6c9, unlock: { trackWin: 'seoul' } },
    { id: 'camo', name: 'CAMO', kr: '카모', desc: '숲 위장 무늬. 눈에 안 띄는 건 아니다.', color: 0x556b3a, accent: 0x2d3a22, pattern: 'camo', unlock: { level: 7 } },
    { id: 'pixel', name: 'PIXEL', kr: '픽셀', desc: '친구들과 온라인 5판을 달린 기념.', color: 0x3b8bff, accent: 0xffe066, pattern: 'pixel', unlock: { online: 5 } },
    { id: 'carbon', name: 'CARBON', kr: '카본', desc: '카본 파이버 + 레드 라인. 가볍게 보인다.', color: 0x23262e, accent: 0xff2e2e, pattern: 'carbon', metal: 0.5, rough: 0.35, unlock: { level: 10 } },
    { id: 'flame', name: 'HELLFIRE', kr: '헬파이어', desc: '10승 달성. 불꽃이 차체를 핥는다.', color: 0x1a1010, accent: 0xff6a00, pattern: 'flames', glow: 0xff6a00, unlock: { wins: 10 } },
    { id: 'neon', name: 'NEON DRIFT', kr: '네온 드리프트', desc: 'MAX CHARGE 드리프트 100회의 증표.', color: 0x0d0d14, accent: 0xd25cff, pattern: 'neon', emissive: 0x7a1fff, emissiveI: 0.35, glow: 0xd25cff, unlock: { maxDrifts: 100 } },
    { id: 'galaxy', name: 'GALAXY', kr: '갤럭시', desc: '별이 흐르는 성운 도색.', color: 0x2a0a5e, accent: 0x5b2bd6, pattern: 'galaxy', emissive: 0x3a1a8a, emissiveI: 0.25, glow: 0x9b6bff, unlock: { level: 15 } },
    { id: 'veteran', name: 'VETERAN', kr: '베테랑', desc: '50레이스 완주. 헥사곤 아머 플레이트.', color: 0x6b6f3a, accent: 0xffa030, pattern: 'hex', unlock: { races: 50 } },
    { id: 'taeguk', name: 'TAEGUK', kr: '태극', desc: '모든 트랙에서 포디움에 오른 챔피언의 도색.', color: 0xf8f8f8, accent: 0xcd2e3a, pattern: 'taeguk', stripes: false, unlock: { podiumAll: true } },
    { id: 'gold', name: 'GOLD', kr: '골드', desc: '순금 도금. 레벨 20의 상징.', color: 0xffc23d, accent: 0x5a3a00, metal: 0.55, rough: 0.25, emissive: 0x4a3000, emissiveI: 0.25, glow: 0xffd66b, unlock: { level: 20 } },
    { id: 'chrome', name: 'CHROME', kr: '크롬', desc: '거울처럼 빛나는 은빛. 레벨 30.', color: 0xdfe4ee, accent: 0x2fe0ff, metal: 0.7, rough: 0.15, emissive: 0x303844, emissiveI: 0.3, glow: 0xffffff, unlock: { level: 30 } }
  ];

  function findSkin(id) { for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i]; return SKINS[0]; }

  /** three.js texture for a patterned skin (cached per skin id) */
  function skinTexture(skin) {
    if (!skin.pattern) return null;
    var draw = PATTERNS[skin.pattern];
    return U.canvasTexture('skin_' + skin.id, 128, function (g, w, h) { draw(g, w, h, css(skin.color), css(skin.accent)); }, { repeat: [1, 1] });
  }

  /** small preview image (data URL) for inventory cards */
  var _prev = {};
  function skinPreview(skin) {
    if (_prev[skin.id]) return _prev[skin.id];
    var c = document.createElement('canvas'); c.width = 128; c.height = 72;
    var g = c.getContext('2d');
    if (skin.pattern) PATTERNS[skin.pattern](g, c.width, c.height, css(skin.color), css(skin.accent));
    else { g.fillStyle = css(skin.color); g.fillRect(0, 0, c.width, c.height); g.fillStyle = css(skin.accent); g.fillRect(0, c.height - 14, c.width, 14); }
    if (skin.metal) { var grd = g.createLinearGradient(0, 0, c.width, c.height); grd.addColorStop(0, 'rgba(255,255,255,0.35)'); grd.addColorStop(0.5, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = grd; g.fillRect(0, 0, c.width, c.height); }
    _prev[skin.id] = c.toDataURL();
    return _prev[skin.id];
  }

  global.SKINS = SKINS; global.findSkin = findSkin; global.skinTexture = skinTexture; global.skinPreview = skinPreview;
})(window);
