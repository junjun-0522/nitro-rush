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
    },
    {
      id: 'canyon', name: 'SUNSET CANYON', tag: 'ADVANCED', mood: 'canyon', laps: 3,
      desc: '석양의 붉은 협곡. 긴 고속 직선, 연속 헤어핀 스위치백, 협곡을 가로지르는 다리와 점프.',
      pts: [[-343.9,-34.5,0],[-343.9,25.5,0],[-343.9,85.5,0],[-340.5,107.1,0],[-330.5,126.6,0.3],[-315,142.1,1.6],[-295.5,152.1,3.6],[-273.9,155.5,4.8],[-217.1,155.5,5],[-160.3,155.5,5],[-103.4,155.5,5],[-46.6,155.5,5],[10.2,155.5,5],[67,155.5,5],[123.9,155.5,5],[180.7,155.5,5],[237.5,155.5,4.7],[256.7,151.7,3.2],[272.9,140.9,1],[283.7,124.6,0],[287.5,105.5,0],[287.5,25.5,0],[283.4,7.3,0],[271.7,-7.3,0],[254.9,-15.4,0],[236.2,-15.4,0],[219.3,-7.3,0],[207.7,7.3,0],[203.5,25.5,0],[203.5,95.5,0],[199.4,113.7,0],[187.7,128.3,0],[170.9,136.4,0],[152.2,136.4,0],[135.3,128.3,0],[123.7,113.7,0],[119.5,95.5,0],[119.5,50.5,0],[119.5,5.5,1.3],[116.2,-13.3,5.8],[106.7,-29.9,10.5],[92,-42.1,12],[77.4,-54.4,12],[67.8,-71,12],[64.5,-89.8,12],[64.5,-166.4,12],[61.6,-184.9,12],[53.1,-201.6,12],[39.8,-214.9,12],[23.1,-223.4,12],[4.5,-226.4,12],[-50.5,-226.4,12],[-105.5,-226.4,11],[-122.4,-222.6,6.7],[-136.1,-212.1,1.8],[-168.3,-173.8,0],[-182,-163.2,0],[-198.9,-159.5,0],[-278.9,-159.5,0],[-299,-156.3,0],[-317.1,-147.1,0],[-331.5,-132.7,0],[-340.7,-114.6,0],[-343.9,-94.5,0]],
      width: 22, narrow: [[0.41, 0.47, 18], [0.51, 0.56, 18]],
      zones: [
        { a: 0.41, b: 0.465, side: 1, extra: 20, kind: 'dirt' },
        { a: 0.51, b: 0.56, side: -1, extra: 20, kind: 'dirt' },
        { a: 0.81, b: 0.85, side: 1, extra: 16, kind: 'dirt' }
      ],
      ramps: [{ a: 0.30, b: 0.315, h: 2.0 }, { a: 0.795, b: 0.81, h: 2.2 }],
      tunnels: [{ a: 0.17, b: 0.24 }],
      boostPads: [{ s: 0.44, lat: 18 }, { s: 0.535, lat: -18 }, { s: 0.12, lat: 0 }, { s: 0.70, lat: 0 }, { s: 0.83, lat: 12 }, { s: 0.97, lat: 0 }],
      itemRows: [0.03, 0.10, 0.20, 0.28, 0.35, 0.48, 0.58, 0.70, 0.80, 0.90],
      theme: {
        sky: [0x4a2a7a, 0xffa64a], fog: 0xf0b07a, fogNear: 220, fogFar: 820,
        sun: 0xffd2a0, sunInt: 1.3, sunDir: [-0.8, 0.45, -0.4], hemi: [0xffc9a0, 0x8a5a3a], hemiInt: 0.7, exposure: 1.0,
        road: 'asphalt', roadTint: 0xd9c2a8, rail: 0xff8c42, railEm: 0x000000, ground: 'sand', skirt: 'dirt',
        tunnel: 0x9a6a45, tunnelLight: 0xffe0b0, portal: 0x8a5a3a, portalEm: 0x000000, pillar: 0xb07a50, gate: 0xffffff, gateEm: 0x000000,
        time: 'SUNSET', stars: false, seed: 555, preview: ['rgba(255,160,80,0.5)', '#5a4636', '#ffd9a0']
      }
    },
    {
      id: 'frost', name: 'FROST PEAK', tag: 'EXPERT', mood: 'frost', laps: 3,
      desc: '눈 덮인 산길. 22m 오르막과 빙판 내리막 에스, 얼음 동굴 터널, 미끄러운 노면.',
      pts: [[-284.9,-92.8,0],[-284.9,-38.7,0],[-284.9,15.3,0],[-284.9,69.4,0],[-284.9,123.5,0],[-284.9,177.5,0.3],[-281.1,196.7,0.9],[-270.3,212.9,2],[-254,223.7,3.4],[-234.9,227.5,5.2],[-189.9,227.5,7.4],[-144.9,227.5,10],[-124,220.6,12.8],[-111.4,202.6,15.3],[-112,180.6,17.4],[-132.5,124.2,19.1],[-133.2,102.2,20.4],[-120.5,84.1,21.3],[-99.6,77.2,21.8],[-40.3,77.2,22],[19,77.2,22],[78.4,77.2,22],[137.7,77.2,22],[197,77.2,22],[256.4,77.2,22],[273.6,73.8,22],[288.2,64,22],[298,49.4,22],[301.4,32.2,22],[301.4,-27.8,22],[296.3,-46.8,22],[282.4,-60.7,22],[263.4,-65.8,21.9],[244.4,-60.7,21.4],[230.5,-46.8,20.3],[225.4,-27.8,18.6],[225.4,22.2,16.3],[220.3,41.2,13.5],[206.4,55.1,10.6],[187.4,60.2,8.1],[168.4,55.1,6.3],[154.5,41.2,4.9],[149.4,22.2,4.2],[149.4,-24.5,4],[149.4,-71.1,3.7],[149.4,-117.8,3.1],[145.6,-136.9,2],[134.7,-153.2,0.9],[118.5,-164,0.3],[99.4,-167.8,0],[49.4,-167.8,0],[-0.6,-167.8,0],[-50.6,-167.8,0],[-100.6,-167.8,0],[-120.6,-173.2,0],[-135.3,-187.8,0],[-149.9,-202.4,0],[-169.9,-207.8,0],[-229.9,-207.8,0],[-250.9,-203.6,0],[-268.8,-191.7,0],[-280.7,-173.8,0],[-284.9,-152.8,0]],
      width: 20, narrow: [[0.51, 0.56, 16]],
      zones: [
        { a: 0.215, b: 0.25, side: 1, extra: 16, kind: 'dirt' },
        { a: 0.515, b: 0.55, side: 1, extra: 18, kind: 'dirt' },
        { a: 0.595, b: 0.63, side: -1, extra: 16, kind: 'dirt' }
      ],
      ramps: [{ a: 0.47, b: 0.485, h: 2.2 }, { a: 0.70, b: 0.715, h: 1.8 }],
      tunnels: [{ a: 0.36, b: 0.44 }, { a: 0.80, b: 0.85 }],
      boostPads: [{ s: 0.235, lat: 14 }, { s: 0.53, lat: 14 }, { s: 0.61, lat: -14 }, { s: 0.40, lat: 0 }, { s: 0.82, lat: 0 }, { s: 0.04, lat: 0 }],
      itemRows: [0.04, 0.10, 0.19, 0.31, 0.42, 0.57, 0.66, 0.78, 0.92],
      theme: {
        sky: [0x6fb4ff, 0xe8f4ff], fog: 0xdbeeff, fogNear: 200, fogFar: 760,
        sun: 0xffffff, sunInt: 1.4, sunDir: [0.4, 1, -0.6], hemi: [0xd8ecff, 0x9fb3c8], hemiInt: 0.8, exposure: 1.05,
        road: 'ice', roadTint: 0xffffff, rail: 0xdde8f5, railEm: 0x000000, ground: 'snow', skirt: 'snow',
        tunnel: 0xbfe0ff, tunnelLight: 0xa0f0ff, portal: 0x9fd0ff, portalEm: 0x3399ff, pillar: 0x9fb3c8, gate: 0xffffff, gateEm: 0x000000,
        time: 'DAY', stars: false, seed: 999, gripMul: 0.86, preview: ['rgba(160,220,255,0.6)', '#8fa8c0', '#ffffff']
      }
    },
    {
      id: 'seoul', name: 'SEOUL BLOSSOM', tag: 'INTERMEDIATE', mood: 'seoul', laps: 3,
      desc: '벚꽃 핀 봄날의 서울. 광화문 광장에서 출발해 한강 대교, 롯데타워 시케인, 잠수교, 남산 터널을 지나 N서울타워를 돌고 벚꽃 내리막으로.',
      pts: [[0,0,0],[0,28,0],[0,56,0],[0,84,0],[0,112,0],[0.5,128,0],[5,143.3,0],[13.7,156.6,0],[25.9,166.9,0],[40.5,173.3,0],[68.4,175.2,1],[96.4,175.2,6.2],[124.4,175.1,8],[152.4,175.1,8],[180.4,175,8],[208.4,175,8],[236.4,174.9,8],[264.4,174.8,5.9],[292.4,174.8,0.8],[308.4,174.6,0],[323.6,170.2,0],[335.9,160.2,0],[343.4,146.1,0],[344.9,118.3,0],[344.8,94.8,0],[347.9,79.2,0],[357.1,66.3,0],[368.9,55.5,0],[375.8,41.2,0],[376.7,13.3,0],[376.6,-14.7,0],[376.4,-37.7,0],[374.8,-53.6,0],[370.2,-68.9,0],[366.9,-84.5,0],[366.3,-112.5,0],[366.1,-140.5,0],[365.8,-156.5,0],[359.6,-171.1,0],[346.9,-180.5,0.1],[319.5,-185.7,1.5],[291.9,-190.3,1.5],[264.2,-194.9,1.5],[236.6,-199.5,1.5],[209,-204.1,1.5],[181.4,-208.7,1.5],[165.7,-212,1.2],[151.9,-219.8,0],[141.6,-232,0.9],[131.2,-257.9,5.5],[121.3,-284.1,10.5],[115.3,-298.9,11.9],[104.8,-310.8,12.7],[90.1,-316.8,15.4],[74.3,-315.7,18.4],[60.6,-307.7,20],[51.8,-294.5,20],[46.5,-267,16.9],[41.9,-239.4,10.1],[37.3,-211.8,4.7],[34.6,-196,4],[29.5,-180.9,3.5],[21.1,-167.3,2.6],[10.5,-155.4,1.5],[2.2,-141.7,0.5],[-2.8,-126.6,0],[-4.3,-110.6,0],[-1.9,-94.8,0],[0,-66.5,0],[0,-38.5,0],[0,-10.5,0]],
      width: 22, narrow: [[0.366, 0.414, 19], [0.744, 0.804, 18]],
      zones: [
        { a: 0.298, b: 0.340, side: 1, extra: 16, kind: 'dirt' },   // 스위퍼 안쪽
        { a: 0.535, b: 0.563, side: 1, extra: 18, kind: 'dirt' }    // 헤어핀 안쪽
      ],
      ramps: [{ a: 0.248, b: 0.259, h: 1.8 }, { a: 0.855, b: 0.864, h: 1.4 }],
      tunnels: [{ a: 0.708, b: 0.742 }],
      boostPads: [{ s: 0.21, lat: 0 }, { s: 0.43, lat: -4 }, { s: 0.55, lat: 16 }, { s: 0.61, lat: 0 }, { s: 0.83, lat: 0 }, { s: 0.96, lat: 0 }],
      itemRows: [0.05, 0.13, 0.22, 0.32, 0.43, 0.52, 0.62, 0.72, 0.83, 0.93],
      theme: {
        sky: [0x5fb2ff, 0xffe6f0], fog: 0xf3dfe8, fogNear: 260, fogFar: 950,
        sun: 0xfff6e0, sunInt: 1.4, sunDir: [-0.45, 1, -0.55], hemi: [0xdaeeff, 0x8fa870], hemiInt: 0.8, exposure: 1.05,
        road: 'asphalt', roadTint: 0xffffff, rail: 0xffffff, railEm: 0x000000, ground: 'grass', skirt: 'grass',
        tunnel: 0xb4b8c0, tunnelLight: 0xfff3b0, portal: 0xc9ccd2, portalEm: 0x000000, pillar: 0xb4b9c2, gate: 0xa8382c, gateEm: 0x000000,
        time: 'DAY', stars: false, seed: 2026, gripMul: 1, preview: ['rgba(255,160,200,0.55)', '#5a6f4a', '#ff9ec8']
      }
    }
  ];

  // fill theme defaults (older two tracks used mood-based choices)
  function themeDefaults(th, mood) {
    var neon = mood === 'neon';
    var d = { tunnel: neon ? 0x151a2e : 0x8d8f9b, tunnelLight: neon ? 0xff3fd6 : 0xfff3b0, portal: neon ? 0x00e5ff : 0xff6b6b, portalEm: neon ? 0x00e5ff : 0x000000,
      pillar: neon ? 0x1d1f33 : 0x9aa4b2, gate: neon ? 0x2a2a44 : 0xffffff, gateEm: neon ? 0x00e5ff : 0x000000, skirt: th.ground === 'grass' ? 'grass' : 'concrete',
      stars: neon, time: neon ? 'NIGHT' : 'DAY', sunDir: neon ? [0.35, 1, 0.45] : [-0.5, 1, -0.7], exposure: neon ? 1.15 : 1.05, seed: neon ? 777 : 333, gripMul: 1, roadTint: 0xffffff,
      preview: neon ? ['rgba(143,92,255,0.5)', '#1b1d33', '#00e5ff'] : ['rgba(47,224,255,0.4)', '#3d4049', '#ffe66d'] };
    for (var k in d) if (th[k] === undefined) th[k] = d[k];
    th.mood = mood;
  }
  TRACKS.forEach(function (t) { themeDefaults(t.theme, t.mood); });

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

  /** ground height (world y) at station idx, lateral lat (shoulders beyond the road edge are flat) */
  Track.prototype.groundY = function (idx, lat, right, center) {
    var hw = this.path.W[idx] / 2, lc = lat < -hw ? -hw : (lat > hw ? hw : lat);
    return center.y + lc * right.y + this.hExtra[idx];
  };

  /** world position of the drivable surface at station j, lateral lat */
  Track.prototype.surfacePoint = function (j, lat, out) {
    var path = this.path, hw = path.W[j] / 2, lc = lat < -hw ? -hw : (lat > hw ? hw : lat), ex = lat - lc;
    out.copy(path.P[j]).addScaledVector(path.R[j], lc);
    if (ex !== 0) { var r = path.R[j], len = Math.hypot(r.x, r.z) || 1; out.x += r.x / len * ex; out.z += r.z / len * ex; }
    out.y += this.hExtra[j];
    return out;
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
      return function (j, out) { self.surfacePoint(j, latFn(j), out); };
    }
    var half = function (j) { return path.W[j] / 2; };

    // asphalt
    var roadTex = tex[th.road](); roadTex.repeat.set(1, 1);
    var road = new THREE.Mesh(
      stripGeom(path, edge(function (j) { return -half(j); }), edge(function (j) { return half(j); }), 10),
      new THREE.MeshStandardMaterial({ map: roadTex, color: th.roadTint, roughness: th.road === 'ice' ? 0.35 : 0.9, metalness: th.road === 'ice' ? 0.2 : 0.05 })
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
    function railEdge(latFn, h) { return function (j, out) { self.surfacePoint(j, latFn(j), out); out.y += h; }; }
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
        self.surfacePoint(j, lat, tmp); tmp.y += 0.5;
        m4.compose(tmp, q, sc); posts.setMatrixAt(pi++, m4);
      });
    }
    posts.count = pi; g.add(posts);

    // skirts (embankment) & pillars for elevated parts
    var groundY = -0.3;
    var skirtMat = new THREE.MeshStandardMaterial({ map: tex[th.skirt](), roughness: 1, side: THREE.DoubleSide });
    var skirtL = stripGeom(path, railEdge(function (j) { return minLat[j] - 1.2; }, 0), function (j, out) { self.surfacePoint(j, minLat[j] - 1.2 - Math.min(8, Math.max(1.5, path.P[j].y + hExtra[j]) * 0.8), out); out.y = groundY; }, 6);
    var skirtR = stripGeom(path, railEdge(function (j) { return maxLat[j] + 1.2; }, 0), function (j, out) { self.surfacePoint(j, maxLat[j] + 1.2 + Math.min(8, Math.max(1.5, path.P[j].y + hExtra[j]) * 0.8), out); out.y = groundY; }, 6);
    var skirt = new THREE.Mesh(mergeGeoms([skirtL, skirtR]), skirtMat); skirt.receiveShadow = true; g.add(skirt);
    // under-deck & pillars where high
    var pillarGeo = new THREE.CylinderGeometry(1.2, 1.5, 1, 10);
    var pillars = [];
    for (j = 0; j < N; j += 14) {
      var h = path.P[j].y + hExtra[j];
      if (h > 5) {
        [-path.W[j] / 3, path.W[j] / 3].forEach(function (lat) {
          // pillar top stays 0.6m under the real (banked) road surface at that lateral, so it never pokes through the deck
          self.surfacePoint(j, lat, tmp);
          var H = tmp.y - 0.6 - groundY;
          if (H < 1) return;
          var pg = pillarGeo.clone();
          pg.scale(1, H, 1);
          pg.translate(tmp.x, H / 2 + groundY, tmp.z);
          pillars.push(pg);
        });
      }
    }
    if (pillars.length) {
      var pm = new THREE.Mesh(mergeGeoms(pillars), new THREE.MeshStandardMaterial({ color: th.pillar, roughness: 0.8 }));
      pm.castShadow = true; g.add(pm);
    }

    // tunnels
    var tunMat = new THREE.MeshStandardMaterial({ color: th.tunnel, roughness: 0.9, side: THREE.DoubleSide });
    var tunGeos = [], lightGeos = [];
    var stripMat = new THREE.MeshBasicMaterial({ color: th.tunnelLight });
    this.tunnels.forEach(function (t) {
      tunGeos.push(archGeom(path, t.a, t.b, function (j) { return maxLat[j] + 3.5; }, 10, 0));
      // light ring strips every ~14 stations
      for (var j = t.a + 4; j < t.b - 2; j += 12) {
        lightGeos.push(archGeom(path, j, j + 1, function (jj) { return maxLat[jj] + 3.2; }, 10, 0));
      }
      // portal frames
      [t.a, t.b].forEach(function (j) {
        var jj = j % N;
        var frame = new THREE.Mesh(archGeom(path, jj - 2 + N, jj + 2 + N, function (k) { return maxLat[k % N] + 4.4; }, 10, 0), new THREE.MeshStandardMaterial({ color: th.portal, emissive: th.portalEm, emissiveIntensity: 0.8, side: THREE.DoubleSide }));
        g.add(frame);
      });
    });
    if (tunGeos.length) { var tun = new THREE.Mesh(mergeGeoms(tunGeos), tunMat); tun.receiveShadow = true; g.add(tun); }
    if (lightGeos.length) { g.add(new THREE.Mesh(mergeGeoms(lightGeos), stripMat)); }

    // start / finish line + gate
    var checker = tex.checker(); checker.repeat.set(6, 1);
    var line = new THREE.Mesh(stripGeom(path, edge(function (j) { return -half(j); }), edge(function (j) { return half(j); }), 1, [0, 3]), new THREE.MeshBasicMaterial({ map: checker }));
    line.position.y = 0.04; g.add(line);
    var gateMat = new THREE.MeshStandardMaterial({ color: th.gate, emissive: th.gateEm, emissiveIntensity: 0.6 });
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
      for (var i = 0; i < 3; i++) { var y = i * 20 + 22; c.beginPath(); c.moveTo(8, y); c.lineTo(32, y - 12); c.lineTo(56, y); c.lineTo(56, y - 6); c.lineTo(32, y - 18); c.lineTo(8, y - 6); c.fill(); }
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
    var rng = U.rng(th.seed);
    g.add(skyDome(th.sky[0], th.sky[1], th.stars));
    var groundY = -0.3;
    var fn = { coast: this._sceneryCoast, neon: this._sceneryNeon, canyon: this._sceneryCanyon, frost: this._sceneryFrost, seoul: this._scenerySeoul }[th.mood] || this._sceneryCoast;
    fn.call(this, rng, this.envelope, null, groundY);
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

  // ---------------------------------------------------------- canyon (sunset desert)
  Track.prototype._sceneryCanyon = function (rng, envelope, _unused, groundY) {
    var g = this.group, tex = U.tex, path = this.path, self = this;
    var sandTex = tex.sand(); sandTex.repeat.set(140, 140);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400), new THREE.MeshStandardMaterial({ map: sandTex, color: 0xe0a060, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = groundY; ground.receiveShadow = true; g.add(ground);
    // mesas: layered sandstone blocks, big ones far out, a few inside the loop
    var mesas = [], tries = 0, count = 0;
    while (count < 70 && tries++ < 4000) {
      var a = rng() * Math.PI * 2, tr = envelope(a);
      var inside = rng() < 0.3;
      var r = inside ? rng.range(0, Math.max(0, tr - 60)) : rng.range(tr + 40, tr + 320);
      var w = rng.range(18, 90), d = rng.range(18, 90), h = inside ? rng.range(10, 30) : rng.range(15, 70);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (self.distToPath(x, z) < 30 + Math.max(w, d) * 0.7) continue;
      var geo = boxWithUV(w, h, d, 12); geo.translate(x, h / 2 + groundY, z);
      mesas.push(geo);
      // stepped top
      if (rng() < 0.6) { var g2 = boxWithUV(w * 0.6, h * 0.35, d * 0.6, 12); g2.translate(x + rng.range(-w * 0.1, w * 0.1), h + h * 0.175 + groundY, z); mesas.push(g2); }
      count++;
    }
    if (mesas.length) { var mm = new THREE.Mesh(mergeGeoms(mesas), new THREE.MeshStandardMaterial({ map: tex.rock(), roughness: 1 })); mm.castShadow = true; mm.receiveShadow = true; g.add(mm); }
    // boulders near the road
    var rockGeo = new THREE.DodecahedronGeometry(1, 0);
    var spots = [];
    for (var j = 0; j < path.N; j += 9) {
      if (this.tunnelMask[j]) continue;
      if (rng() < 0.5) { var side = rng() < 0.5 ? -1 : 1; spots.push({ j: j, lat: side > 0 ? this.maxLat[j] + rng.range(4, 14) : this.minLat[j] - rng.range(4, 14), s: rng.range(0.8, 3.2), rot: rng() * 6.28 }); }
    }
    var rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0xb5734a, roughness: 1, flatShading: true }), spots.length);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), tmp = new THREE.Vector3(), e = new THREE.Euler();
    spots.forEach(function (sp, i) {
      self.surfacePoint(sp.j, sp.lat, tmp); tmp.y = groundY + sp.s * 0.5;
      e.set(rng() * 0.5, sp.rot, 0); q.setFromEuler(e); sc.set(sp.s, sp.s * 0.7, sp.s);
      m4.compose(tmp, q, sc); rocks.setMatrixAt(i, m4);
    });
    rocks.castShadow = true; g.add(rocks);
    // cacti
    var trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 5, 7); trunkGeo.translate(0, 2.5, 0);
    var armGeo = mergeGeoms([new THREE.CylinderGeometry(0.22, 0.25, 1.4, 6).translate(1.0, 3.6, 0), new THREE.CylinderGeometry(0.22, 0.25, 1.2, 6).rotateZ(Math.PI / 2).translate(0.6, 2.9, 0), new THREE.CylinderGeometry(0.22, 0.25, 1.2, 6).translate(-0.9, 3.0, 0), new THREE.CylinderGeometry(0.22, 0.25, 1.0, 6).rotateZ(Math.PI / 2).translate(-0.5, 2.4, 0)]);
    var cs = [];
    for (j = 0; j < path.N; j += 12) { if (this.tunnelMask[j]) continue; if (rng() < 0.4) { var sd = rng() < 0.5 ? -1 : 1; cs.push({ j: j, lat: sd > 0 ? this.maxLat[j] + rng.range(5, 18) : this.minLat[j] - rng.range(5, 18), s: rng.range(0.7, 1.4), rot: rng() * 6.28 }); } }
    var cactMat = new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.9 });
    var trunks = new THREE.InstancedMesh(trunkGeo, cactMat, cs.length), arms = new THREE.InstancedMesh(armGeo, cactMat, cs.length);
    cs.forEach(function (c, i) { self.surfacePoint(c.j, c.lat, tmp); tmp.y = groundY; e.set(0, c.rot, 0); q.setFromEuler(e); sc.set(c.s, c.s, c.s); m4.compose(tmp, q, sc); trunks.setMatrixAt(i, m4); arms.setMatrixAt(i, m4); });
    trunks.castShadow = arms.castShadow = true; g.add(trunks); g.add(arms);
    // low sun and haze
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xffb060, transparent: true, fog: false }));
    sun.position.set(-1000, 170, -520); sun.scale.set(420, 420, 1); g.add(sun);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xff8a40, transparent: true, opacity: 0.35, fog: false, blending: THREE.AdditiveBlending }));
    halo.position.copy(sun.position); halo.scale.set(1100, 700, 1); g.add(halo);
    // circling birds (tiny sprites)
    for (var b = 0; b < 3; b++) {
      var bird = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0x2a1a10, transparent: true }));
      bird.scale.set(3, 1.2, 1); g.add(bird);
      (function (bs, ph) { self.animated.push(function (dt, t) { bs.position.set(Math.cos(t * 0.25 + ph) * 160, 70 + Math.sin(t * 0.5 + ph) * 8, Math.sin(t * 0.25 + ph) * 160); }); })(bird, b * 2.1);
    }
  };

  // ---------------------------------------------------------- frost (snowy peak)
  Track.prototype._sceneryFrost = function (rng, envelope, _unused, groundY) {
    var g = this.group, tex = U.tex, path = this.path, self = this;
    var snowTex = tex.snow(); snowTex.repeat.set(120, 120);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400), new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = groundY; ground.receiveShadow = true; g.add(ground);
    // distant mountains
    var mountMat = new THREE.MeshStandardMaterial({ color: 0xe6f0ff, roughness: 1, flatShading: true });
    var mounts = [];
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * Math.PI * 2 + rng.range(-0.1, 0.1), r = envelope(a) + rng.range(200, 380);
      var rad = rng.range(120, 260), h = rng.range(160, 340);
      var cg = new THREE.ConeGeometry(rad, h, 7); cg.translate(Math.cos(a) * r, h / 2 + groundY, Math.sin(a) * r);
      mounts.push(cg);
    }
    g.add(new THREE.Mesh(mergeGeoms(mounts), mountMat));
    // pine forest
    var trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 6); trunkGeo.translate(0, 1.5, 0);
    var folGeo = mergeGeoms([new THREE.ConeGeometry(2.4, 4.5, 8).translate(0, 4, 0), new THREE.ConeGeometry(1.8, 3.8, 8).translate(0, 6.4, 0), new THREE.ConeGeometry(1.1, 3.0, 8).translate(0, 8.4, 0)]);
    var spots = [], tries = 0;
    for (var j = 0; j < path.N; j += 6) {
      if (this.tunnelMask[j]) continue;
      if (rng() < 0.55) { var side = rng() < 0.5 ? -1 : 1; spots.push({ j: j, lat: side > 0 ? this.maxLat[j] + rng.range(5, 20) : this.minLat[j] - rng.range(5, 20), s: rng.range(0.7, 1.5), rot: rng() * 6.28, j2: true }); }
    }
    while (spots.length < 420 && tries++ < 6000) {
      var aa = rng() * Math.PI * 2, tr = envelope(aa), rr = rng() < 0.4 ? rng.range(0, Math.max(0, tr - 40)) : rng.range(tr + 25, tr + 200);
      var x = Math.cos(aa) * rr, z = Math.sin(aa) * rr;
      if (self.distToPath(x, z) < 22) continue;
      spots.push({ x: x, z: z, s: rng.range(0.7, 1.6), rot: rng() * 6.28 });
    }
    var trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 1 }), spots.length);
    var fol = new THREE.InstancedMesh(folGeo, new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.9 }), spots.length);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), tmp = new THREE.Vector3(), e = new THREE.Euler();
    spots.forEach(function (sp, i) {
      if (sp.j2) { self.surfacePoint(sp.j, sp.lat, tmp); tmp.y = groundY; } else tmp.set(sp.x, groundY, sp.z);
      e.set(0, sp.rot, 0); q.setFromEuler(e); sc.set(sp.s, sp.s, sp.s);
      m4.compose(tmp, q, sc); trunks.setMatrixAt(i, m4); fol.setMatrixAt(i, m4);
    });
    trunks.castShadow = fol.castShadow = true; g.add(trunks); g.add(fol);
    // snow caps on the foliage (small white cones)
    var capGeo = new THREE.ConeGeometry(1.2, 1.2, 8); capGeo.translate(0, 9.3, 0);
    var caps = new THREE.InstancedMesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), spots.length);
    spots.forEach(function (sp, i) { fol.getMatrixAt(i, m4); caps.setMatrixAt(i, m4); });
    g.add(caps);
    // ice crystals glowing near the road
    var cryGeo = new THREE.OctahedronGeometry(1, 0); cryGeo.translate(0, 1.2, 0);
    var cspots = [];
    for (j = 0; j < path.N; j += 20) { if (this.tunnelMask[j]) continue; if (rng() < 0.6) { var sd = rng() < 0.5 ? -1 : 1; cspots.push({ j: j, lat: sd > 0 ? this.maxLat[j] + rng.range(3, 7) : this.minLat[j] - rng.range(3, 7), s: rng.range(0.8, 2.2), rot: rng() * 6.28 }); } }
    var cry = new THREE.InstancedMesh(cryGeo, new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x66ccff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.85 }), cspots.length);
    cspots.forEach(function (c, i) { self.surfacePoint(c.j, c.lat, tmp); tmp.y = groundY; e.set(0, c.rot, 0.2); q.setFromEuler(e); sc.set(c.s, c.s * 1.6, c.s); m4.compose(tmp, q, sc); cry.setMatrixAt(i, m4); });
    g.add(cry);
    // pale sun + gentle snowfall sprites around the track centre
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xffffff, transparent: true, fog: false }));
    sun.position.set(500, 700, -700); sun.scale.set(220, 220, 1); g.add(sun);
    var flakeMat = new THREE.SpriteMaterial({ map: tex.particle(), color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
    var flakes = [];
    for (var f = 0; f < 60; f++) { var fl = new THREE.Sprite(flakeMat); fl.scale.set(0.5, 0.5, 1); fl.position.set(rng.range(-500, 500), rng.range(5, 60), rng.range(-500, 500)); fl.userData.v = rng.range(1.5, 3.5); fl.userData.ph = rng() * 6.28; g.add(fl); flakes.push(fl); }
    this.animated.push(function (dt, t) {
      for (var i = 0; i < flakes.length; i++) { var fl = flakes[i]; fl.position.y -= fl.userData.v * dt; fl.position.x += Math.sin(t + fl.userData.ph) * dt * 2; if (fl.position.y < 0) fl.position.y = 60; }
    });
  };


  // ---------------------------------------------------------- seoul (spring, cherry blossoms, landmarks)
  Track.prototype._scenerySeoul = function (rng, envelope, _unused, groundY) {
    var g = this.group, tex = U.tex, path = this.path, self = this, N = path.N;
    var tmp = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), e = new THREE.Euler();
    function mesh(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0xa9a7a2, roughness: 1 });
    var graniteMat = new THREE.MeshStandardMaterial({ color: 0x8f8d88, roughness: 0.95 });
    var redMat = new THREE.MeshStandardMaterial({ color: 0xa8382c, roughness: 0.7 });
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xf1e6cf, roughness: 0.9 });
    var danMat = new THREE.MeshStandardMaterial({ color: 0x1f8f73, roughness: 0.6 });
    var tileMat = new THREE.MeshStandardMaterial({ color: 0x3c4047, roughness: 0.9 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.9 });
    var woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.9 });
    var glassMat = new THREE.MeshStandardMaterial({ color: 0xd8ecf8, metalness: 0.2, roughness: 0.2, emissive: 0x224466, emissiveIntensity: 0.25 });

    // ---- ground + 광화문광장 pavement beside the start straight
    var grassTex = tex.grass(); grassTex.repeat.set(160, 160);
    var ground = mesh(new THREE.PlaneGeometry(3400, 3400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }), 0, groundY, 0);
    ground.castShadow = false; g.add(ground);
    function edge(latFn) { return function (j, out) { self.surfacePoint(j, latFn(j), out); }; }
    var pa = Math.round(0.925 * N), pb = N + Math.round(0.08 * N);
    var paveMat = new THREE.MeshStandardMaterial({ map: tex.concrete(), color: 0xd8d4cc, roughness: 1 });
    var plaza = new THREE.Mesh(mergeGeoms([
      stripGeom(path, edge(function (j) { return self.minLat[j] - 36; }), edge(function (j) { return self.minLat[j] - 1.6; }), 12, [pa, pb]),
      stripGeom(path, edge(function (j) { return self.maxLat[j] + 1.6; }), edge(function (j) { return self.maxLat[j] + 36; }), 12, [pa, pb])]), paveMat);
    plaza.position.y = 0.01; plaza.receiveShadow = true; g.add(plaza);

    // ---- 한강: river band along z, stone banks, 유람선
    var RX0 = 175, RX1 = 245, RC = (RX0 + RX1) / 2;
    var waterTex = tex.water(); waterTex.repeat.set(4, 120);
    var waterMat = new THREE.MeshStandardMaterial({ map: waterTex, color: 0x8ec4ea, roughness: 0.2, metalness: 0.3 });
    var water = mesh(new THREE.PlaneGeometry(RX1 - RX0, 3000).rotateX(-Math.PI / 2), waterMat, RC, groundY + 0.02, -60);
    water.castShadow = false; g.add(water);
    this.animated.push(function (dt, t) { waterTex.offset.y = t * 0.02; waterTex.offset.x = Math.sin(t * 0.3) * 0.01; });
    [RX0 - 1.5, RX1 + 1.5].forEach(function (x) { g.add(mesh(new THREE.BoxGeometry(3, 0.7, 3000), stoneMat, x, groundY + 0.35, -60)); });
    var boat = new THREE.Group();
    boat.add(mesh(new THREE.BoxGeometry(16, 2.2, 5), new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.6 }), 0, 1.1, 0));
    boat.add(mesh(new THREE.BoxGeometry(9, 2.4, 4), new THREE.MeshStandardMaterial({ color: 0x3b7dd8, roughness: 0.6 }), -1, 3.4, 0));
    boat.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 2, 8), redMat, -4, 5.5, 0));
    boat.position.set(RC, groundY, -5); g.add(boat);
    this.animated.push(function (dt, t) { var ph = t * 0.06; boat.position.z = -5 + Math.sin(ph) * 150; boat.rotation.y = Math.cos(ph) >= 0 ? Math.PI / 2 : -Math.PI / 2; });
    // 대교 arches over the high bridge
    var arches = [];
    for (var fa = 0.185; fa < 0.25; fa += 0.016) { var ja = Math.round(fa * N); arches.push(archGeom(path, ja, ja + 2, function (jj) { return self.maxLat[jj] + 2.5; }, 12, 0)); }
    g.add(new THREE.Mesh(mergeGeoms(arches), new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.5, side: THREE.DoubleSide })));

    // ---- traditional architecture helpers (hip roofs with flared eaves)
    function hipRoof(w, d, h) { var geo = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.22, Math.SQRT1_2, 1, 4, 1); geo.rotateY(Math.PI / 4); geo.scale(w, h, d); return geo; }
    function eaveGeo(w, d) { var geo = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2 * 0.9, 1, 4, 1); geo.rotateY(Math.PI / 4); geo.scale(w, 0.5, d); return geo; }
    var pillarGeo = new THREE.CylinderGeometry(0.45, 0.5, 1, 8);
    function pavilion(x, z, y0, W, D, tiers) {
      var grp = new THREE.Group(); grp.position.set(x, y0, z);
      var w = W, d = D, y = 0;
      for (var t = 0; t < tiers; t++) {
        var ph = t === 0 ? 5.5 : 4.5, last = t === tiers - 1;
        grp.add(mesh(new THREE.BoxGeometry(w + 1, 0.5, d + 1), stoneMat, 0, y + 0.25, 0));
        var nx = Math.max(2, Math.round(w / 6)), nz = Math.max(2, Math.round(d / 6));
        for (var i = 0; i <= nx; i++) for (var k = 0; k <= nz; k++) {
          if (i > 0 && i < nx && k > 0 && k < nz) continue;
          var pl = mesh(pillarGeo, redMat, -w / 2 + i * w / nx, y + 0.5 + ph / 2, -d / 2 + k * d / nz); pl.scale.y = ph; grp.add(pl);
        }
        grp.add(mesh(new THREE.BoxGeometry(w - 2.4, ph, d - 2.4), wallMat, 0, y + 0.5 + ph / 2, 0));
        grp.add(mesh(new THREE.BoxGeometry(w + 1.4, 0.8, d + 1.4), danMat, 0, y + 0.5 + ph + 0.4, 0));
        grp.add(mesh(eaveGeo(w + 6, d + 6), tileMat, 0, y + ph + 1.3, 0));
        var rh = last ? 4.5 : 2.8;
        grp.add(mesh(hipRoof(w + 5, d + 5, rh), tileMat, 0, y + ph + 1.55 + rh / 2, 0));
        if (last) grp.add(mesh(new THREE.BoxGeometry(w * 0.45, 0.6, 1.2), darkMat, 0, y + ph + 1.55 + rh, 0));
        y += ph + 1.55 + rh * 0.55; w *= 0.8; d *= 0.78;
      }
      return grp;
    }

    // ---- 광화문 (gate with three arches, two-tier pavilion), 해태, 광장, 경복궁 근정전, 북악산
    var GX = -46, GZ = 152;
    g.add(mesh(new THREE.BoxGeometry(46, 9, 14), graniteMat, GX, groundY + 4.5, GZ));
    g.add(mesh(new THREE.BoxGeometry(48, 0.8, 16), stoneMat, GX, groundY + 9.2, GZ));
    [[0, 6.5, 7.2], [-14, 5, 6], [14, 5, 6]].forEach(function (a) {
      var bh = a[2] - a[1] / 2;
      g.add(mesh(new THREE.BoxGeometry(a[1], bh, 1.2), darkMat, GX + a[0], groundY + bh / 2, GZ - 7.2));
      g.add(mesh(new THREE.CylinderGeometry(a[1] / 2, a[1] / 2, 1.2, 14).rotateX(Math.PI / 2), darkMat, GX + a[0], groundY + bh, GZ - 7.2));
    });
    g.add(pavilion(GX, GZ, groundY + 9.6, 38, 9, 2));
    var haetae = new THREE.MeshStandardMaterial({ color: 0xc9b98a, roughness: 0.9 });
    [-1, 1].forEach(function (sd) {
      var st = new THREE.Group(); st.position.set(GX + sd * 20, groundY, GZ - 16);
      st.add(mesh(new THREE.BoxGeometry(2.6, 1.2, 3.4), stoneMat, 0, 0.6, 0));
      st.add(mesh(new THREE.BoxGeometry(2, 1.6, 2.6), haetae, 0, 2.0, 0));
      st.add(mesh(new THREE.SphereGeometry(1.0, 10, 8), haetae, 0, 3.3, 0.9));
      g.add(st);
    });
    g.add(mesh(new THREE.BoxGeometry(64, 0.16, 44), new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 1 }), GX, groundY + 0.08, GZ - 38));
    g.add(mesh(new THREE.BoxGeometry(58, 3, 42), stoneMat, GX, groundY + 1.5, GZ + 70));
    g.add(pavilion(GX, GZ + 70, groundY + 3, 40, 26, 2));
    var mtMat = new THREE.MeshStandardMaterial({ color: 0x4f7f4a, roughness: 1, flatShading: true });
    [[-70, 540, 200, 170], [140, 590, 170, 120], [-300, 500, 180, 130], [90, -820, 240, 150], [460, 600, 180, 110], [-520, -320, 200, 120]].forEach(function (m) { g.add(mesh(new THREE.ConeGeometry(m[2], m[3], 7), mtMat, m[0], groundY + m[3] / 2, m[1])); });
    // 태극기 along the plaza
    var flagMat = new THREE.MeshBasicMaterial({ map: tex.taegukgi(), side: THREE.DoubleSide });
    var poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.4 });
    var flagGeo = new THREE.PlaneGeometry(4, 2.7); flagGeo.translate(2, 0, 0);
    var flags = [];
    for (var fi = 0; fi < 12; fi++) {
      var fx = fi < 6 ? -30 : 30, fz = 10 + (fi % 6) * 18;
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 12, 6), poleMat, fx, groundY + 6, fz));
      var fl = mesh(flagGeo, flagMat, fx, groundY + 10.5, fz); fl.castShadow = false; g.add(fl); flags.push(fl);
    }
    this.animated.push(function (dt, t) { for (var i = 0; i < flags.length; i++) flags[i].rotation.y = 0.3 + Math.sin(t * 2.2 + i) * 0.3; });

    // ---- 63빌딩, 롯데월드타워 + 석촌호수, DDP
    g.add(mesh(new THREE.BoxGeometry(22, 96, 14), new THREE.MeshStandardMaterial({ color: 0xe6b640, metalness: 0.35, roughness: 0.3, emissive: 0x5a3a08, emissiveIntensity: 0.35 }), 292, groundY + 48, 232));
    var lotteTex = tex.windowsDay(3).clone(); lotteTex.repeat.set(10, 70); lotteTex.needsUpdate = true;
    g.add(mesh(new THREE.CylinderGeometry(3.5, 14, 200, 8), new THREE.MeshStandardMaterial({ map: lotteTex, color: 0xcfe4f5, roughness: 0.4, metalness: 0.1 }), 445, groundY + 100, 40));
    g.add(mesh(new THREE.ConeGeometry(3.5, 26, 8), glassMat, 445, groundY + 213, 40));
    g.add(mesh(new THREE.BoxGeometry(30, 9, 22), glassMat, 445, groundY + 4.5, 40));
    var lake = mesh(new THREE.CircleGeometry(36, 32).rotateX(-Math.PI / 2), waterMat, 452, groundY + 0.02, -52); lake.castShadow = false; g.add(lake);
    var ddp = mesh(new THREE.SphereGeometry(26, 24, 14), new THREE.MeshStandardMaterial({ color: 0xd8dbe0, metalness: 0.3, roughness: 0.35 }), 100, groundY + 4, 262); ddp.scale.set(1.7, 0.42, 1); g.add(ddp);

    // ---- 남산 + N서울타워 (inside the tower loop)
    var HX = 84.6, HZ = -282;
    g.add(mesh(new THREE.CylinderGeometry(9, 27, 17, 24), new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 1 }), HX, groundY + 8.5, HZ));
    g.add(mesh(new THREE.CylinderGeometry(24, 48, 8, 24), new THREE.MeshStandardMaterial({ color: 0x4a8a44, roughness: 1 }), HX, groundY + 4, HZ));
    var twMat = new THREE.MeshStandardMaterial({ color: 0xe3e6ea, roughness: 0.5, metalness: 0.2 });
    var ty = groundY + 17;
    g.add(mesh(new THREE.CylinderGeometry(6, 8, 3, 12), stoneMat, HX, ty + 1.5, HZ));
    g.add(mesh(new THREE.CylinderGeometry(2.2, 3.4, 58, 12), twMat, HX, ty + 32, HZ));
    g.add(mesh(new THREE.CylinderGeometry(7.5, 5.5, 7, 16), twMat, HX, ty + 64.5, HZ));
    g.add(mesh(new THREE.CylinderGeometry(7.7, 7.7, 2.2, 16), glassMat, HX, ty + 66, HZ));
    g.add(mesh(new THREE.CylinderGeometry(0.5, 1.0, 42, 8), new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.5 }), HX, ty + 89, HZ));
    g.add(mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 1.5 }), HX, ty + 110, HZ));

    // ---- 북촌 한옥마을 (south-west quarter, below 남산)
    var walls = [], roofs = [], bases = [], hspots = [], tries = 0;
    while (hspots.length < 75 && tries++ < 6000) {
      var hx = rng.range(-60, 160), hz = rng.range(-345, -105);
      if (self.distToPath(hx, hz) < 21 || Math.hypot(hx - HX, hz - HZ) < 48) continue;
      var ok = true; for (var hi = 0; hi < hspots.length; hi++) if (Math.hypot(hspots[hi][0] - hx, hspots[hi][1] - hz) < 17) { ok = false; break; }
      if (!ok) continue;
      hspots.push([hx, hz]);
      var w = rng.range(8, 14), d = rng.range(6, 10), rot = rng.pick([0, Math.PI / 2, 0.3, -0.3]);
      var wg = new THREE.BoxGeometry(w, 3.2, d); wg.rotateY(rot); wg.translate(hx, groundY + 1.6, hz); walls.push(wg);
      var bg = new THREE.BoxGeometry(w + 0.5, 0.9, d + 0.5); bg.rotateY(rot); bg.translate(hx, groundY + 0.45, hz); bases.push(bg);
      var band = new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2); band.rotateY(rot); band.translate(hx, groundY + 3.05, hz); bases.push(band);
      var eg = eaveGeo(w + 3.5, d + 3.5); eg.rotateY(rot); eg.translate(hx, groundY + 3.45, hz); roofs.push(eg);
      var rg = hipRoof(w + 3, d + 3, 2.6); rg.rotateY(rot); rg.translate(hx, groundY + 5.0, hz); roofs.push(rg);
    }
    if (walls.length) { g.add(mesh(mergeGeoms(walls), wallMat, 0, 0, 0)); g.add(mesh(mergeGeoms(bases), woodMat, 0, 0, 0)); g.add(mesh(mergeGeoms(roofs), tileMat, 0, 0, 0)); }

    // ---- city blocks: 잠실 (east of the river), 종로 (north-west), 명동 (inside the loop)
    var byVar = [[], [], [], [], []], pastel = [0xdfe6ee, 0xe8e0d6, 0xd6e4f0, 0xf0e6e0, 0xe2e8e2];
    function block(x, z, w, d, h) { var geo = boxWithUV(w, h, d, 6); geo.translate(x, h / 2 + groundY, z); byVar[rng.int(0, 4)].push(geo); }
    function scatter(count, xr, zr, wr, hr, margin, reject) {
      var c = 0, tr = 0;
      while (c < count && tr++ < 6000) {
        var x = rng.range(xr[0], xr[1]), z = rng.range(zr[0], zr[1]), w = rng.range(wr[0], wr[1]), d = rng.range(wr[0], wr[1]), h = rng.range(hr[0], hr[1]);
        if (self.distToPath(x, z) < margin + Math.max(w, d) * 0.6) continue;
        if (x > RX0 - 16 && x < RX1 + 16) continue;
        if (reject && reject(x, z)) continue;
        block(x, z, w, d, h); c++;
      }
    }
    scatter(70, [262, 540], [-240, 260], [12, 24], [22, 70], 30, function (x, z) { return Math.hypot(x - 445, z - 40) < 58 || Math.hypot(x - 452, z + 52) < 58 || Math.hypot(x - 292, z - 232) < 32; });
    scatter(45, [-280, 160], [120, 340], [10, 22], [10, 36], 28, function (x, z) { return Math.hypot(x - GX, z - GZ) < 72 || Math.hypot(x - GX, z - GZ - 70) < 62 || Math.hypot(x - 100, z - 262) < 62; });
    scatter(35, [30, 160], [-95, 105], [10, 20], [12, 40], 40, null);
    scatter(30, [-300, -50], [-200, 100], [10, 22], [8, 30], 30, null);
    byVar.forEach(function (list, vi) { if (!list.length) return; var mm = new THREE.Mesh(mergeGeoms(list), new THREE.MeshStandardMaterial({ map: tex.windowsDay(vi), color: pastel[vi], roughness: 0.8 })); mm.castShadow = true; mm.receiveShadow = true; g.add(mm); });

    // ---- 벚꽃: instanced trees with per-instance pink, falling petals
    var trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 3.6, 6); trunkGeo.translate(0, 1.8, 0);
    var canopyGeo = mergeGeoms([new THREE.IcosahedronGeometry(2.6, 1).translate(0, 5.2, 0), new THREE.IcosahedronGeometry(2.0, 1).translate(1.5, 4.3, 0.7), new THREE.IcosahedronGeometry(1.9, 1).translate(-1.3, 4.5, -0.9), new THREE.IcosahedronGeometry(1.6, 1).translate(0.3, 6.6, -0.4)]);
    var spots = [];
    function treeAt(j, lat, s) { self.surfacePoint(j, lat, tmp); spots.push({ x: tmp.x, y: Math.max(groundY, tmp.y - 1.4), z: tmp.z, s: s, rot: rng() * 6.28, c: rng() }); }
    for (var j = Math.round(0.806 * N); j < Math.round(0.86 * N); j += 3) { treeAt(j, self.maxLat[j] + rng.range(2.5, 4), rng.range(1.0, 1.4)); treeAt(j, self.minLat[j] - rng.range(2.5, 4), rng.range(1.0, 1.4)); }
    for (j = Math.round(0.862 * N); j < N + Math.round(0.078 * N); j += 6) { var jj = j % N; if (rng() < 0.8) treeAt(jj, self.maxLat[jj] + rng.range(5, 14), rng.range(0.8, 1.3)); if (rng() < 0.8) treeAt(jj, self.minLat[jj] - rng.range(5, 14), rng.range(0.8, 1.3)); }
    for (j = Math.round(0.414 * N); j < Math.round(0.535 * N); j += 5) { if (rng() < 0.7) treeAt(j, self.maxLat[j] + rng.range(4, 12), rng.range(0.8, 1.3)); }
    for (j = Math.round(0.674 * N); j < Math.round(0.706 * N); j += 5) { if (rng() < 0.7) treeAt(j, self.minLat[j] - rng.range(4, 10), rng.range(0.8, 1.2)); }
    tries = 0;
    while (spots.length < 340 && tries++ < 4000) {
      var tx = rng() < 0.5 ? rng.range(RX0 - 30, RX0 - 6) : rng.range(RX1 + 6, RX1 + 30), tz = rng.range(-180, 300);
      if (self.distToPath(tx, tz) < 16) continue;
      spots.push({ x: tx, y: groundY, z: tz, s: rng.range(0.7, 1.2), rot: rng() * 6.28, c: rng() });
    }
    var trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5c4030, roughness: 1 }), spots.length);
    var canopy = new THREE.InstancedMesh(canopyGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), spots.length);
    var col = new THREE.Color(), pinkA = new THREE.Color(0xffc4dc), pinkB = new THREE.Color(0xff9ec8);
    spots.forEach(function (sp, i) {
      tmp.set(sp.x, sp.y, sp.z); e.set(0, sp.rot, 0); q.setFromEuler(e); sc.set(sp.s, sp.s, sp.s);
      m4.compose(tmp, q, sc); trunks.setMatrixAt(i, m4); canopy.setMatrixAt(i, m4);
      canopy.setColorAt(i, col.copy(pinkA).lerp(pinkB, sp.c));
    });
    trunks.castShadow = canopy.castShadow = true; g.add(trunks); g.add(canopy);
    var petalMat = new THREE.SpriteMaterial({ map: tex.particle(), color: 0xffc0d8, transparent: true, opacity: 0.85, depthWrite: false });
    var petals = [];
    for (var pi = 0; pi < 150; pi++) { var pt = new THREE.Sprite(petalMat); pt.scale.set(0.45, 0.35, 1); pt.position.set(rng.range(-120, 500), rng.range(2, 45), rng.range(-380, 280)); pt.userData.v = rng.range(0.8, 1.8); pt.userData.ph = rng() * 6.28; g.add(pt); petals.push(pt); }
    this.animated.push(function (dt, t) {
      for (var i = 0; i < petals.length; i++) { var pt = petals[i]; pt.position.y -= pt.userData.v * dt; pt.position.x += Math.sin(t * 1.3 + pt.userData.ph) * dt * 2.5; pt.position.z += Math.cos(t * 0.9 + pt.userData.ph) * dt * 1.5; if (pt.position.y < 0) pt.position.y = 45; }
    });

    // ---- 한글 간판 along the 둔치 straight
    [['서울', '#ffffff', '#cd2e3a'], ['어서오세요', '#ffffff', '#0047a0'], ['한강공원', '#112233', '#ffe066'], ['NITRO RUSH', '#ffffff', '#ff2f6d']].forEach(function (sg, i) {
      var j = Math.round((0.42 + i * 0.03) * N), bb = new THREE.Group();
      bb.add(mesh(new THREE.BoxGeometry(14, 4.5, 0.5), new THREE.MeshBasicMaterial({ map: tex.label('kr' + i, sg[0], sg[1], sg[2]) }), 0, 8, 0));
      bb.add(mesh(new THREE.BoxGeometry(0.7, 6, 0.7), new THREE.MeshStandardMaterial({ color: 0x555a66 }), 0, 3, 0));
      self.surfacePoint(j, self.minLat[j] - 9, tmp); bb.position.set(tmp.x, groundY, tmp.z); bb.lookAt(path.P[j].x, groundY, path.P[j].z); g.add(bb);
    });

    // ---- sky: clouds + sun
    var cloudMat = new THREE.SpriteMaterial({ map: tex.smoke(), color: 0xffffff, opacity: 0.95, transparent: true, depthWrite: false, fog: false });
    for (var c = 0; c < 24; c++) {
      var a2 = rng() * Math.PI * 2, r2 = rng.range(300, 900), cl = new THREE.Sprite(cloudMat);
      cl.position.set(190 + Math.cos(a2) * r2, rng.range(110, 190), -70 + Math.sin(a2) * r2);
      var s2 = rng.range(50, 120); cl.scale.set(s2 * 1.6, s2 * 0.8, 1); g.add(cl);
    }
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.particle(), color: 0xfff1b0, transparent: true, fog: false }));
    sun.position.set(-500, 520, -800); sun.scale.set(240, 240, 1); g.add(sun);
  };

  Track.prototype.update = function (dt, t) {
    for (var i = 0; i < this.animated.length; i++) this.animated[i](dt, t);
    if (this.padMat) this.padMat.map.offset.y = -(t * 1.5) % 1;
  };

  global.TRACKS = TRACKS;
  global.Track = Track;
})(window);
