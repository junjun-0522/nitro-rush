/* ============================================================
   NITRO RUSH - TrackPath
   Arc-length parameterised closed spline used for track
   geometry, physics constraints, AI navigation and ranking.
   ============================================================ */
(function (global) {
  'use strict';

  var _v1 = new THREE.Vector3();
  var _v2 = new THREE.Vector3();
  var _v3 = new THREE.Vector3();
  var UP = new THREE.Vector3(0, 1, 0);

  function TrackPath(cps, opts) {
    opts = opts || {};
    this.cps = cps;
    var open = this.open = !!opts.open;   // point-to-point: no wrap-around, start != finish
    var pts = cps.map(function (c) { return new THREE.Vector3(c.x, c.y, c.z); });
    var curve = new THREE.CatmullRomCurve3(pts, !open, 'catmullrom', 0.5);
    this.curve = curve;

    var n = cps.length;
    var M = 6000;
    var raw = new Array(M + 1);
    var cum = new Float64Array(M + 1);
    for (var i = 0; i <= M; i++) raw[i] = curve.getPoint(i / M);
    for (i = 1; i <= M; i++) cum[i] = cum[i - 1] + raw[i].distanceTo(raw[i - 1]);
    var total = cum[M];
    this.length = total;

    var N = opts.stations || Math.max(700, Math.round(total));
    this.N = N;
    this.ds = total / N;

    // --- resample at uniform arc length --------------------------------
    var P = new Array(N), W = new Float32Array(N), Tt = new Float32Array(N);
    var k = 0;
    for (var j = 0; j < N; j++) {
      var target = j * this.ds;
      while (k < M && cum[k + 1] < target) k++;
      var seg = cum[k + 1] - cum[k];
      var f = seg > 1e-9 ? (target - cum[k]) / seg : 0;
      P[j] = raw[k].clone().lerp(raw[k + 1], f);
      var t = (k + f) / M;
      Tt[j] = t;
      // width from control points (closed catmull: cp i sits at t = i/n; open: t = i/(n-1))
      var fi = open ? t * (n - 1) : t * n, i0 = open ? Math.min(n - 1, Math.floor(fi)) : Math.floor(fi) % n, i1 = open ? Math.min(n - 1, i0 + 1) : (i0 + 1) % n, ff = fi - Math.floor(fi);
      W[j] = cps[i0].w * (1 - ff) + cps[i1].w * ff;
    }

    // --- frames ---------------------------------------------------------
    var T = new Array(N), R = new Array(N), U = new Array(N), B = new Float32Array(N);
    function nb(j, o) { return open ? Math.max(0, Math.min(N - 1, j + o)) : ((j + o) % N + N) % N; }
    this.nb = nb;
    for (j = 0; j < N; j++) {
      var a = P[nb(j, -1)], b = P[nb(j, 1)];
      T[j] = new THREE.Vector3().subVectors(b, a).normalize();
    }
    for (j = 0; j < N; j++) {
      // right = up x tangent  (outward on a CCW loop)
      R[j] = new THREE.Vector3().crossVectors(UP, T[j]).normalize();
    }
    var gain = opts.bankGain === undefined ? 30 : opts.bankGain;
    var maxB = opts.maxBank === undefined ? 0.16 : opts.maxBank;
    for (j = 0; j < N; j++) {
      var tPrev = T[nb(j, -1)], tNext = T[nb(j, 1)];
      _v1.subVectors(tNext, tPrev).multiplyScalar(1 / (2 * this.ds));
      var bank = -_v1.dot(R[j]) * gain;
      B[j] = Math.max(-maxB, Math.min(maxB, bank));
    }
    // smooth banking so the road does not twitch
    var Bs = new Float32Array(N);
    for (j = 0; j < N; j++) {
      var acc = 0, cnt = 0;
      for (var o = -12; o <= 12; o++) { acc += B[nb(j, o)]; cnt++; }
      Bs[j] = acc / cnt;
    }
    B = Bs;
    for (j = 0; j < N; j++) {
      var r = R[j].clone();
      var up0 = new THREE.Vector3().crossVectors(T[j], r).normalize();
      r.multiplyScalar(Math.cos(B[j])).addScaledVector(up0, Math.sin(B[j])).normalize();
      R[j] = r;
      U[j] = new THREE.Vector3().crossVectors(T[j], r).normalize();
      // banking lifts the outer edge only: keep the inner edge on the base height so the road
      // never sinks below the surrounding ground
      if (P[j].y < 0.05) P[j].y = 0.05;
      P[j].y += (W[j] / 2) * Math.abs(Math.sin(B[j]));
    }

    this.P = P; this.T = T; this.R = R; this.U = U; this.W = W; this.bank = B; this.tParam = Tt;

    // curvature magnitude per station (for AI speed planning)
    var C = new Float32Array(N);
    for (j = 0; j < N; j++) {
      var t0 = T[nb(j, -6)], t2 = T[nb(j, 6)];
      C[j] = Math.acos(Math.max(-1, Math.min(1, t0.dot(t2)))) / (12 * this.ds);
    }
    // forward-looking worst curvature (used by AI braking)
    this.curv = C;
  }

  TrackPath.prototype.idxOf = function (s) {
    var j = Math.floor(s / this.ds);
    if (this.open) return Math.max(0, Math.min(this.N - 1, j));
    return ((j % this.N) + this.N) % this.N;
  };

  TrackPath.prototype.wrap = function (s) {
    var L = this.length;
    if (this.open) return Math.max(0, Math.min(L - 0.001, s));
    return ((s % L) + L) % L;
  };

  /** interpolated frame at arc length s (allocates: use in cold paths) */
  TrackPath.prototype.sample = function (s, out) {
    out = out || {};
    s = this.wrap(s);
    var fi = s / this.ds, i0 = Math.floor(fi) % this.N, i1 = (i0 + 1) % this.N, f = fi - Math.floor(fi);
    if (this.open) { i0 = Math.min(this.N - 2, Math.floor(fi)); i1 = i0 + 1; f = Math.max(0, Math.min(1, fi - i0)); }
    out.pos = (out.pos || new THREE.Vector3()).copy(this.P[i0]).lerp(this.P[i1], f);
    out.tan = (out.tan || new THREE.Vector3()).copy(this.T[i0]).lerp(this.T[i1], f).normalize();
    out.right = (out.right || new THREE.Vector3()).copy(this.R[i0]).lerp(this.R[i1], f).normalize();
    out.up = (out.up || new THREE.Vector3()).copy(this.U[i0]).lerp(this.U[i1], f).normalize();
    out.width = this.W[i0] * (1 - f) + this.W[i1] * f;
    out.idx = i0;
    return out;
  };

  /** world position at (s, lateral) */
  TrackPath.prototype.posAt = function (s, lat, out) {
    var sm = this.sample(s, this._ps || (this._ps = {}));
    out = out || new THREE.Vector3();
    return out.copy(sm.pos).addScaledVector(sm.right, lat);
  };

  /** heading (yaw) of the track at s */
  TrackPath.prototype.yawAt = function (s) {
    var sm = this.sample(s, this._py || (this._py = {}));
    return Math.atan2(sm.tan.x, sm.tan.z);
  };

  /**
   * Project a world position onto the path.
   * hint = last known station index (local search window).
   */
  TrackPath.prototype.project = function (pos, hint, out) {
    out = out || {};
    var N = this.N, best = -1, bestD = Infinity, j, d;
    if (hint === undefined || hint === null || hint < 0) {
      for (j = 0; j < N; j++) {
        d = this.P[j].distanceToSquared(pos);
        if (d < bestD) { bestD = d; best = j; }
      }
    } else {
      var win = 90;
      for (var o = -win; o <= win; o++) {
        j = this.open ? Math.max(0, Math.min(N - 1, hint + o)) : ((hint + o) % N + N) % N;
        d = this.P[j].distanceToSquared(pos);
        if (d < bestD) { bestD = d; best = j; }
      }
      // safety: if we somehow drifted far, do a full scan
      if (bestD > 1.0e4) {
        for (j = 0; j < N; j++) {
          d = this.P[j].distanceToSquared(pos);
          if (d < bestD) { bestD = d; best = j; }
        }
      }
    }
    // refine along the two neighbouring segments
    var bi = best, bf = 0, bq = Infinity;
    for (var k = -1; k <= 0; k++) {
      var a = this.open ? Math.max(0, Math.min(N - 2, best + k)) : ((best + k) % N + N) % N, b = this.open ? a + 1 : (a + 1) % N;
      _v1.subVectors(this.P[b], this.P[a]);
      var len2 = _v1.lengthSq();
      _v2.subVectors(pos, this.P[a]);
      var t = len2 > 1e-9 ? _v2.dot(_v1) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      _v3.copy(this.P[a]).addScaledVector(_v1, t);
      var q = _v3.distanceToSquared(pos);
      if (q < bq) { bq = q; bi = a; bf = t; }
    }
    var i0 = bi, i1 = (bi + 1) % N;
    out.idx = i0;
    out.s = (i0 + bf) * this.ds;
    _v1.copy(this.P[i0]).lerp(this.P[i1], bf);
    out.center = (out.center || new THREE.Vector3()).copy(_v1);
    out.right = (out.right || new THREE.Vector3()).copy(this.R[i0]).lerp(this.R[i1], bf).normalize();
    out.tan = (out.tan || new THREE.Vector3()).copy(this.T[i0]).lerp(this.T[i1], bf).normalize();
    out.up = (out.up || new THREE.Vector3()).copy(this.U[i0]).lerp(this.U[i1], bf).normalize();
    out.width = this.W[i0] * (1 - bf) + this.W[i1] * bf;
    _v2.subVectors(pos, _v1);
    out.lat = _v2.dot(out.right);
    out.height = _v2.dot(out.up);
    return out;
  };

  /** max |curvature| looking ahead `dist` metres from station idx */
  TrackPath.prototype.lookaheadCurv = function (idx, dist) {
    var steps = Math.max(1, Math.round(dist / this.ds));
    var m = 0;
    for (var i = 0; i < steps; i++) {
      var c = this.curv[this.open ? Math.min(this.N - 1, idx + i) : (idx + i) % this.N];
      var w = 1 - i / (steps * 1.6);
      if (c * w > m) m = c * w;
    }
    return m;
  };

  global.TrackPath = TrackPath;
})(window);
