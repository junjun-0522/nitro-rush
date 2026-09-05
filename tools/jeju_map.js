// JEJU EDU CITY track: Naver-map pixel trace -> game pts.  node tools/jeju_map.js  (writes pts json to $OUT, prints lap fractions of landmarks)
// Map px -> m: 0.65 (real scale x0.39). Game: north = -z, east = +x (so the preview/minimap shows north up). Clockwise loop: outside = +R (maxLat), inside = -R (minLat).
const THREE = require(__dirname + '/../js/vendor/three.min.js');
const S = 0.65, OX = 448, OY = 1290;               // map px -> m, origin = start on the spine (이노에듀타운 앞)
// loop traced from the Naver map (px), north = up. Start heading north (-z), clockwise.
const px = [
  [448,1290],[452,1230],[455,1170],[452,1110],[444,1040],[434,970],[424,900],[416,840],[409,780],[402,730],
  [392,675],[380,615],[367,560],[355,505],[344,450],[338,405],[350,382],[385,378],[430,388],[485,415],
  [540,458],[590,515],[630,580],[662,650],[684,725],[697,800],[701,870],[697,940],[685,1010],[668,1080],
  [652,1150],[640,1215],[620,1280],[596,1345],[572,1405],[547,1460],[522,1510],[496,1550],[468,1568],[445,1548],
  [432,1505],[430,1450],[434,1400],[441,1345]
];
function toGame(p) { return [+((p[0]-OX)*S).toFixed(1), +((p[1]-OY)*S).toFixed(1)]; }
const g = px.map(toGame);
// elevation: gentle rise toward the north (한라산 방향)
const pts = g.map(([x,z]) => { const y = Math.max(0, Math.min(6, (-z - 120) / 420 * 6)); return [x, z, +y.toFixed(1)]; });
const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[2], p[1])), true, 'catmullrom', 0.5);
const M = 4000, cum = [0]; let prev = curve.getPoint(0);
for (let i = 1; i <= M; i++) { const q = curve.getPoint(i / M); cum.push(cum[i-1] + q.distanceTo(prev)); prev = q; }
const total = cum[M];
console.log('length', total.toFixed(0), 'm  pts', pts.length);
// fraction of each control point (closed catmull: cp i at t=i/n)
const n = pts.length;
pts.forEach((p, i) => { const t = i / n; const f = cum[Math.round(t * M)] / total; console.log(i, 'map', px[i].join(','), 'game', p.join(','), 'f=' + f.toFixed(3)); });
function fracAt(pxp) { // nearest sample to a map point
  const q = toGame(pxp); let best = 0, bd = 1e9; for (let i = 0; i <= M; i++) { const c = curve.getPoint(i / M); const d = Math.hypot(c.x - q[0], c.z - q[1]); if (d < bd) { bd = d; best = i; } } return (cum[best] / total).toFixed(3) + ' (dist ' + bd.toFixed(0) + 'm)';
}
console.log('cross streets f:', [760, 900, 1000, 1110, 1230, 1330, 1450].map(y => 'y' + y + ' spine=' + fracAt([410 + (y - 760) * 0.06, y]) + ' east=' + fracAt([700, y])).join('\n  '));
console.log('top corner f', fracAt([345, 395]), 'bottom curve f', fracAt([470, 1568]), 'KIS f', fracAt([545, 640]), 'SJA f', fracAt([600, 875]), 'BHA f', fracAt([430, 680]));
console.log('landmarks game coords: 삼정', toGame([275,1215]), '곶자왈공원', toGame([270,1370]), '라온', toGame([150,1375]), '꿈에그린', toGame([160,1500]), '이노', toGame([525,1370]), 'KIS고', toGame([545,640]), '중학교', toGame([455,540]), 'BHA(학교)', toGame([430,680]), 'SJA', toGame([600,875]), '노리매', toGame([810,880]), '119', toGame([435,1515]), 'mid street x', toGame([530,1000])[0]);
require('fs').writeFileSync((process.env.OUT || '/tmp/jeju_pts.json'), JSON.stringify(pts));
