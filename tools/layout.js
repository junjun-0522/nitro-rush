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
// ---- closure: Hermite from (x,z,th) to (0, -closeStraight, heading 0), then straight to (0,0)
const p1 = { x, z }, d1 = { x: Math.sin(th), z: Math.cos(th) };
const p0 = { x: 0, z: -D.closeStraight }, d0 = { x: 0, z: 1 };
const L = Math.hypot(p0.x - p1.x, p0.z - p1.z);
const m1 = { x: d1.x * L, z: d1.z * L }, m0 = { x: d0.x * L, z: d0.z * L };
function herm(t) {
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t, h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
  return { x: h00 * p1.x + h10 * m1.x + h01 * p0.x + h11 * m0.x, z: h00 * p1.z + h10 * m1.z + h01 * p0.z + h11 * m0.z };
}
let closeMinR = 1e9, closeLen = 0, prev = herm(0), prevDir = null;
const closeStart = s;
for (let i = 1; i <= 400; i++) {
  const q = herm(i / 400), dx = q.x - prev.x, dz = q.z - prev.z, dl = Math.hypot(dx, dz);
  if (dl < 1e-6) continue;
  const dir = { x: dx / dl, z: dz / dl };
  if (prevDir) { const dth = Math.atan2(prevDir.x * dir.z - prevDir.z * dir.x, prevDir.x * dir.x + prevDir.z * dir.z); const r = Math.abs(dth) > 1e-9 ? dl / Math.abs(dth) : 1e9; if (r < closeMinR) closeMinR = r; }
  prevDir = dir; s += dl; closeLen += dl; dense.push({ x: q.x, z: q.z, s }); prev = q;
}
x = p0.x; z = p0.z; th = 0;
const straightStart = s;
step(D.closeStraight, 0);
const total = s;
// ---- self-distance check (points at least 70m apart along the lap must be >= 45m apart in space)
let minSep = 1e9, minAt = null;
for (let i = 0; i < dense.length; i += 4) for (let j = i + 1; j < dense.length; j += 4) {
  const ds = Math.min(Math.abs(dense[i].s - dense[j].s), total - Math.abs(dense[i].s - dense[j].s));
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
  if (d.s - lastS >= spacing && total - d.s > 8) { pts.push([+d.x.toFixed(1), +d.z.toFixed(1), +yAt(d.s / total).toFixed(1)]); lastS = d.s; }
}
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
