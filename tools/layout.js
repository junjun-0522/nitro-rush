// Turtle layout generator for closed circuits.
//   node tools/layout.js korea            -> prints stats, ASCII map and the pts array for js/tracks.js
// Segments: ['S', len] straight, ['A', radius, angleDeg] arc (+ turns one way, - the other),
// the loop is closed automatically with a Hermite curve into an 80m straight that ends at the start.
// Elevation: profile = [[f0, f1, y0, y1], ...] smoothstep ramps by fraction of lap length (flat elsewhere = last y).
'use strict';
const DESIGNS = {
  korea: {
    width: 22,
    segs: [
      ['S', 120],        // 광화문 광장 직선 (출발)
      ['A', 55, 90],     // 스위퍼
      ['S', 60],         // 다리 진입 오르막
      ['S', 130],        // 한강 대교 (y 8)
      ['S', 60],         // 내리막
      ['A', 40, 90],
      ['S', 40],
      ['A', 38, -55],    // 롯데타워 앞 시케인
      ['A', 38, 55],
      ['S', 70], ['A', 80, 20], ['A', 80, -20], ['S', 60],   // 둔치 고속 구간
      ['A', 30, 80],     // 헤어핀 (안쪽 흙길 지름길)
      ['S', 170],        // 잠수교 (낮은 다리, y 1.5)
      ['A', 45, -60],    // 북촌 한옥마을 진입
      ['S', 60],         // 남산 오르막
      ['A', 35, 150],    // N타워 돌기 (y 20)
      ['S', 90],         // 벚꽃 내리막
      ['A', 70, -35], ['A', 70, 45]   // 여의도 벚꽃길 S자
    ],
    closeStraight: 80,
    profile: [[0.135, 0.174, 0, 8], [0.259, 0.298, 8, 0], [0.556, 0.578, 0, 1.5], [0.674, 0.69, 1.5, 0], [0.69, 0.75, 0, 12], [0.75, 0.79, 12, 20], [0.80, 0.862, 20, 4], [0.862, 0.92, 4, 0]]
  },
  jeju: {   // 제주영어교육도시: 이노에듀타운 출발 → KIS → 삼정 → 곶자왈/오름 → BHA → NLCS → 라온 → SJA → 한신
    width: 21,
    segs: [
      ['S', 110],        // 이노에듀타운 중앙로 (출발, 음식점 거리)
      ['A', 55, 90],     // KIS 진입 코너
      ['S', 100],        // KIS 운동장 옆 직선
      ['A', 45, -60], ['A', 45, 60],   // 삼정 시케인
      ['S', 50],
      ['A', 40, 90],     // 곶자왈 진입
      ['S', 120],        // 곶자왈 숲길 오르막 (좁음, 흙길 지름길)
      ['A', 55, -45], ['A', 55, 45],   // 오름 S자 (정상)
      ['S', 90],         // BHA 앞 내리막
      ['A', 45, 90],     // BHA 코너
      ['S', 140],        // NLCS 직선
      ['A', 60, -40], ['A', 60, 40],   // 라온 타운하우스 S자
      ['S', 70],         // SJA 앞
      ['A', 45, 80]      // 한신더휴 코너
    ],
    closeStraight: 80,
    profile: [[0.30, 0.37, 0, 7], [0.44, 0.50, 7, 0]]
  },
  lab: {   // NITRO LAB: 거대 과학실 안, 1랩 장거리 고난도. 사각 순환로 + 바깥으로 튀어나온 헤어핀/반응로 벌지, 포탈 지름길 2개
    width: 19,
    segs: [
      ['S', 150],                         // 출발 직선 (실험대 사이 바닥)
      ['A', 45, -50], ['A', 45, 50],      // 비커 시케인
      ['S', 60],
      ['A', 60, 90],                      // 북서 코너 → 동쪽
      ['S', 120],                         // 실험대 오르막 (y 0 → 18)
      ['A', 35, -70],                     // 실험대 위 진입
      ['A', 24, 160],                     // 실험대 헤어핀 1  ← 포탈1 입구 (헤어핀 3개 스킵)
      ['S', 45],
      ['A', 24, -160],                    // 헤어핀 2
      ['S', 45],
      ['A', 24, 160],                     // 헤어핀 3  → 포탈1 출구
      ['S', 30],
      ['A', 40, -90],                     // 동쪽으로
      ['S', 80],                          // 실험대 끝 점프 (y 18 → 2)
      ['A', 60, 90],                      // 북동 코너 → 남쪽
      ['S', 60],
      ['A', 45, -180],                    // 반응로 헤어핀 (넓음, 안쪽 지름길)
      ['S', 80],
      ['A', 45, 180],                     // 반응로 헤어핀 2
      ['S', 300],                         // 동쪽 장거리 직선 (레이저)
      ['A', 45, 90],                      // 남동 코너 → 서쪽
      ['S', 90],
      ['A', 50, 60], ['A', 50, -60], ['A', 50, 60], ['A', 50, -60],   // 시험관 랙 에스 4연속 (좁음)
      ['S', 70],
      ['A', 25, -150],                    // 현미경 헤어핀 (좁음)
      ['S', 50],
      ['A', 25, 150],
      ['S', 100],
      ['A', 35, -160],                    // DNA 헤어핀 ← 포탈2 입구
      ['S', 60],
      ['A', 35, 160],                     // → 포탈2 출구
      ['S', 120],
      ['A', 40, 90]                       // 남서 코너 → 북쪽, 긴 피니시 직선
    ],
    closeStraight: 90,
    profile: [[0.06, 0.10, 0, 18], [0.27, 0.30, 18, 2], [0.30, 0.34, 2, 0], [0.50, 0.53, 0, 8], [0.56, 0.60, 8, 0], [0.78, 0.81, 0, 5], [0.85, 0.88, 5, 0]]
  },
  space: {  // ORBITAL RUN: point-to-point (open). station interior → launch tunnel → zero-g → orbital → planet orbit → traffic → gravity tunnel → station exterior → final straight
    open: true, width: 20,
    segs: [
      ['S', 120], ['A', 60, 60], ['S', 80], ['A', 50, -90], ['S', 150], ['A', 45, 45],            // 1. 우주정거장 내부 (격납고 복도)
      ['S', 520],                                                                             // 2. 발사 터널 (직선, 오르막)
      ['A', 120, -70], ['A', 120, 70], ['S', 100], ['A', 90, -110], ['S', 150],                // 3. 무중력 구간 (큰 스위퍼, 고도 파동)
      ['S', 300], ['A', 200, 60], ['S', 250], ['A', 150, -50],                                  // 4. 궤도 고속 구간
      ['A', 180, 200], ['S', 120],                                                              // 5. 행성 궤도 (3/4 바퀴)
      ['A', 40, -60], ['A', 40, 60], ['S', 80], ['A', 40, 60], ['A', 40, -60], ['S', 120], ['A', 60, -90], ['S', 150],   // 6. 우주선 교통 구역 (시케인)
      ['S', 120], ['A', 70, 120], ['A', 70, -120], ['S', 150],                                  // 7. 중력 반전 터널 (S자 코크스크루)
      ['A', 90, -80], ['S', 200], ['A', 60, 90], ['S', 150], ['A', 80, 60], ['S', 100],          // 8. 거대 정거장 외부
      ['A', 50, -30], ['S', 600]                                                                // 9. 최종 직선 → FINISH (마지막 120m 는 런오프)
    ],
    closeStraight: 0,
    profile: [[0.09, 0.17, 0, 25], [0.17, 0.21, 25, 5], [0.21, 0.25, 5, 30], [0.25, 0.29, 30, 0], [0.32, 0.40, 0, -25], [0.40, 0.48, -25, -25], [0.48, 0.56, -25, 10], [0.60, 0.66, 10, 0], [0.70, 0.73, 0, 35], [0.73, 0.78, 35, -10], [0.78, 0.82, -10, 0], [0.86, 0.90, 0, 8], [0.92, 0.96, 8, 0]]
  },
  sky: {   // SKY CRYSTAL: point-to-point sky world with three flight sections (no road, glide through rings)
    open: true, width: 20,
    segs: [
      ['S', 110], ['A', 60, -60], ['A', 60, 60], ['S', 100], ['A', 45, 90],   // 얼음 정거장 → 얼음 협곡 S자 → 수정 동굴 코너
      ['S', 280], ['A', 150, -60], ['S', 120],                                  // 비행 1: 협곡 절벽에서 이륙 → 활공 → 수정 다리에 착지
      ['A', 40, -120], ['S', 100], ['A', 70, 70],                               // 얼음 동굴 헤어핀 (터널)
      ['S', 400], ['A', 130, 80], ['S', 120],                                   // 비행 2: 구름바다 위 긴 활공
      ['A', 35, -150], ['S', 100], ['A', 60, -70], ['A', 60, 70],               // 수정 정원 헤어핀 (지름길) + 시케인
      ['S', 320], ['A', 90, -40],                                               // 비행 3: 오로라 사이로
      ['S', 340]                                                                // 최종 직선 → 하늘 궁전 FINISH
    ],
    closeStraight: 0,
    profile: [[0.04, 0.08, 0, 14], [0.13, 0.17, 14, -10], [0.17, 0.22, -10, 6], [0.23, 0.26, 6, 0], [0.30, 0.33, 0, 4], [0.36, 0.42, 4, -18], [0.42, 0.47, -18, 12], [0.47, 0.52, 12, 0], [0.56, 0.58, 0, 5], [0.62, 0.64, 5, 0], [0.70, 0.75, 0, 22], [0.75, 0.82, 22, -8], [0.82, 0.86, -8, 10], [0.88, 0.93, 10, 0]]
  },
  volcano: {   // VOLCANIC INFERNO: point-to-point escape. wasteland → canyon (split routes) → lava falls → rockfall path → volcano climb → eruption (route change) → lava bridge (gaps) → final jump → plateau FINISH
    open: true, width: 20,
    segs: [
      ['S', 160], ['A', 80, 40], ['S', 60], ['A', 60, -70], ['S', 80], ['A', 55, 90], ['S', 70], ['A', 70, -45], ['S', 60],   // 1 wasteland drift corners
      ['A', 45, 60], ['S', 180], ['A', 50, -80], ['S', 100], ['A', 60, 70], ['S', 130], ['A', 40, -60],                       // 2 canyon: narrow, split 1 (corner), split 2 (straight)
      ['S', 180], ['A', 70, 50], ['S', 160], ['A', 70, -50], ['S', 60],                                                        // 3 lava waterfalls
      ['S', 120], ['A', 50, 70], ['S', 140], ['A', 50, -70], ['S', 100], ['A', 45, -45],                                       // 4 collapsing rock path
      ['S', 150], ['A', 60, 80], ['S', 120], ['A', 60, 80], ['S', 100], ['A', 50, -60],                                        // 5 climb toward the crater
      ['S', 80], ['S', 220], ['A', 55, -70], ['S', 80],                                                                        // 6 eruption: trigger, split (old road / new path), turn away, descent
      ['S', 340], ['A', 60, 35], ['S', 60],                                                                                    // 7 lava bridge (3 gaps)
      ['S', 240], ['S', 40], ['S', 60], ['S', 60], ['A', 70, -30], ['S', 200], ['S', 120]                                      // 8 boost straight, ramp, gap, landing, plateau, finish + runoff
    ],
    closeStraight: 0,
    profile: [[0.517, 0.549, 0, 30], [0.567, 0.593, 30, 55], [0.593, 0.611, 55, 62], [0.611, 0.633, 62, 72], [0.724, 0.741, 72, 44], [0.741, 0.80, 44, 42], [0.897, 0.910, 42, 24], [0.923, 0.931, 24, 20]]
  }
};
const name = process.argv[2] || 'korea';
const D = DESIGNS[name];
const DS = 0.5;
let x = 0, z = 0, th = 0;              // heading th: dir = (sin th, cos th); start heading +z
const dense = [{ x: 0, z: 0, s: 0, seg: -1 }];
let s = 0;
const segInfo = [];
function step(len, kappa) {            // kappa = signed curvature (1/r), 0 = straight
  const n = Math.round(len / DS);
  for (let i = 0; i < n; i++) {
    x += Math.sin(th) * DS; z += Math.cos(th) * DS; th += kappa * DS; s += DS;
    dense.push({ x, z, s });
  }
}
D.segs.forEach((sg, i) => {
  const s0 = s; let centre = null;
  if (sg[0] === 'S') step(sg[1], 0);
  else { const r = sg[1], ang = sg[2] * Math.PI / 180; const sg0 = Math.sign(ang); centre = [+(x + r * Math.cos(th) * sg0).toFixed(1), +(z - r * Math.sin(th) * sg0).toFixed(1)]; step(Math.abs(ang) * r, sg0 / r); }
  segInfo.push({ i, sg, s0, s1: s, x: +x.toFixed(1), z: +z.toFixed(1), headingDeg: +(th * 180 / Math.PI).toFixed(1), centre });
});
// ---- closure: Hermite from (x,z,th) to (0, -closeStraight, heading 0), then straight to (0,0)   (skipped for open / point-to-point designs)
const p1 = { x, z }, d1 = { x: Math.sin(th), z: Math.cos(th) };
if (D.open) { D.closeStraight = 0; }
const p0 = { x: 0, z: -D.closeStraight }, d0 = { x: 0, z: 1 };
const L = Math.hypot(p0.x - p1.x, p0.z - p1.z);
const m1 = { x: d1.x * L, z: d1.z * L }, m0 = { x: d0.x * L, z: d0.z * L };
function herm(t) {
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t, h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
  return { x: h00 * p1.x + h10 * m1.x + h01 * p0.x + h11 * m0.x, z: h00 * p1.z + h10 * m1.z + h01 * p0.z + h11 * m0.z };
}
let closeMinR = 1e9, closeLen = 0, prev = herm(0), prevDir = null;
const closeStart = s;
for (let i = 1; i <= (D.open ? 0 : 400); i++) {
  const q = herm(i / 400), dx = q.x - prev.x, dz = q.z - prev.z, dl = Math.hypot(dx, dz);
  if (dl < 1e-6) continue;
  const dir = { x: dx / dl, z: dz / dl };
  if (prevDir) { const dth = Math.atan2(prevDir.x * dir.z - prevDir.z * dir.x, prevDir.x * dir.x + prevDir.z * dir.z); const r = Math.abs(dth) > 1e-9 ? dl / Math.abs(dth) : 1e9; if (r < closeMinR) closeMinR = r; }
  prevDir = dir; s += dl; closeLen += dl; dense.push({ x: q.x, z: q.z, s }); prev = q;
}
if (!D.open) { x = p0.x; z = p0.z; th = 0; }
const straightStart = s;
if (!D.open) step(D.closeStraight, 0);
const total = s;
// ---- self-distance check (points at least 70m apart along the lap must be >= 45m apart in space)
let minSep = 1e9, minAt = null;
for (let i = 0; i < dense.length; i += 4) for (let j = i + 1; j < dense.length; j += 4) {
  const ds = D.open ? Math.abs(dense[i].s - dense[j].s) : Math.min(Math.abs(dense[i].s - dense[j].s), total - Math.abs(dense[i].s - dense[j].s));
  if (ds < 70) continue;
  const d = Math.hypot(dense[i].x - dense[j].x, dense[i].z - dense[j].z);
  if (d < minSep) { minSep = d; minAt = [dense[i].s / total, dense[j].s / total]; }
}
// ---- elevation
function yAt(f) {
  let y = 0;
  for (const [f0, f1, y0, y1] of D.profile) {
    if (f >= f1) y = y1; else if (f > f0) { const t = (f - f0) / (f1 - f0); y = y0 + (y1 - y0) * (t * t * (3 - 2 * t)); return y; }
  }
  return y;
}
// ---- control points: every ~16m on arcs / ~28m on straights, plus always at segment joins
const pts = [];
let acc = 0;
const isStraightAt = (ss) => { const sg = segInfo.find(g => ss >= g.s0 && ss < g.s1); return sg ? sg.sg[0] === 'S' : ss >= straightStart; };
let lastS = -1e9;
for (let i = 0; i < dense.length; i++) {
  const d = dense[i]; const spacing = isStraightAt(d.s) ? 28 : 16;
  if (d.s - lastS >= spacing && (D.open ? true : total - d.s > 8)) { pts.push([+d.x.toFixed(1), +d.z.toFixed(1), +yAt(d.s / total).toFixed(1)]); lastS = d.s; }
}
if (D.open) { const e = dense[dense.length - 1]; if (e.s - lastS > 4) pts.push([+e.x.toFixed(1), +e.z.toFixed(1), +yAt(1).toFixed(1)]); }
// ---- report
console.log('segments (fraction ranges):');
segInfo.forEach(g => console.log(`  #${g.i} ${g.sg.join(' ')}  f=${(g.s0 / total).toFixed(3)}..${(g.s1 / total).toFixed(3)}  end=(${g.x},${g.z}) heading=${g.headingDeg}${g.centre ? '  centre=(' + g.centre.join(',') + ')' : ''}`));
console.log(`closure: from (${p1.x.toFixed(1)},${p1.z.toFixed(1)}) heading ${(Math.atan2(d1.x, d1.z) * 180 / Math.PI).toFixed(1)} -> (0,${-D.closeStraight}); len=${closeLen.toFixed(0)} minR=${closeMinR.toFixed(1)}  f=${(closeStart / total).toFixed(3)}..${(straightStart / total).toFixed(3)}`);
console.log(`total length=${total.toFixed(0)}m  pts=${pts.length}  minSeparation=${minSep.toFixed(1)}m at f=${minAt && minAt.map(v => v.toFixed(3))}`);
const xs = dense.map(p => p.x), zs = dense.map(p => p.z);
console.log(`bbox x ${Math.min(...xs).toFixed(0)}..${Math.max(...xs).toFixed(0)}  z ${Math.min(...zs).toFixed(0)}..${Math.max(...zs).toFixed(0)}`);
// ASCII map (x to the right, z up), 100 x 40
const W = 100, H = 40, x0 = Math.min(...xs) - 10, x1 = Math.max(...xs) + 10, z0 = Math.min(...zs) - 10, z1 = Math.max(...zs) + 10;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
dense.forEach(p => { const cx = Math.floor((p.x - x0) / (x1 - x0) * (W - 1)), cz = H - 1 - Math.floor((p.z - z0) / (z1 - z0) * (H - 1)); const f = p.s / total; grid[cz][cx] = f < 0.05 ? 'S' : (yAt(f) > 3 ? '#' : '.'); });
console.log(grid.map(r => r.join('')).join('\n'));
console.log('\npts:'); console.log(JSON.stringify(pts));
