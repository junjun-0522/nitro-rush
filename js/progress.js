/* ============================================================
   NITRO RUSH - progression: XP / levels / skin unlocks / records
   The profile lives in localStorage and (optionally) syncs to the
   account server through account.js. Everything here is pure data.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'nitroRush.profile.v1';
  var MAX_LEVEL = 50;

  function fresh() {
    return { v: 1, xp: 0, races: 0, finishes: 0, wins: 0, podiums: 0, online: 0, maxDrifts: 0, laps: 0,
      trackWins: {}, trackPodiums: {}, records: {}, unlocked: ['classic'], skin: 'classic', updatedAt: 0 };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var Progress = { p: fresh(), listeners: [] };

  Progress.load = function () {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') Progress.p = Progress.sanitize(s); } catch (e) { }
    Progress.checkUnlocks();
    return Progress.p;
  };
  Progress.save = function (silent) {
    Progress.p.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(Progress.p)); } catch (e) { }
    if (!silent) Progress.listeners.forEach(function (fn) { try { fn(Progress.p); } catch (e) { } });
  };
  Progress.onChange = function (fn) { Progress.listeners.push(fn); };
  Progress.reset = function () { Progress.p = fresh(); Progress.save(); };

  /** make sure every field exists and has the right type (also used for server data) */
  Progress.sanitize = function (s) {
    var f = fresh(), out = {};
    for (var k in f) {
      var v = s[k];
      if (typeof f[k] === 'number') out[k] = (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : f[k];
      else if (Array.isArray(f[k])) out[k] = Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : f[k].slice();
      else if (typeof f[k] === 'object') out[k] = (v && typeof v === 'object') ? clone(v) : {};
      else out[k] = typeof v === typeof f[k] ? v : f[k];
    }
    if (out.unlocked.indexOf('classic') < 0) out.unlocked.unshift('classic');
    if (!findSkin(out.skin) || out.unlocked.indexOf(out.skin) < 0) out.skin = 'classic';
    return out;
  };

  // ---------------------------------------------------------------- levels
  /** cumulative XP required to *reach* level L (level 1 = 0) */
  Progress.xpForLevel = function (L) { return L <= 1 ? 0 : Math.round(300 * Math.pow(L - 1, 1.4)); };
  Progress.levelFor = function (xp) {
    var L = 1;
    while (L < MAX_LEVEL && xp >= Progress.xpForLevel(L + 1)) L++;
    return L;
  };
  Progress.levelInfo = function (xp) {
    if (xp === undefined) xp = Progress.p.xp;
    var L = Progress.levelFor(xp), lo = Progress.xpForLevel(L), hi = L >= MAX_LEVEL ? lo : Progress.xpForLevel(L + 1);
    return { level: L, xp: xp, cur: xp - lo, need: Math.max(1, hi - lo), pct: L >= MAX_LEVEL ? 1 : (xp - lo) / (hi - lo), max: L >= MAX_LEVEL };
  };
  Progress.title = function (L) {
    if (global.Account && Account.admin) return 'ADMIN';
    return L >= 40 ? 'LEGEND' : L >= 30 ? 'CHAMPION' : L >= 20 ? 'PRO' : L >= 10 ? 'RACER' : L >= 5 ? 'ROOKIE' : 'NEWBIE';
  };

  // ---------------------------------------------------------------- records
  Progress.record = function (trackId, mode) {
    var r = Progress.p.records[trackId];
    return (r && r[mode]) ? r[mode] : null;
  };
  Progress.bestRecord = function (trackId) {
    var r = Progress.p.records[trackId], best = null;
    if (!r) return null;
    for (var m in r) { if (!best || (r[m].race && (!best.race || r[m].race < best.race))) best = r[m]; }
    return best;
  };

  // ---------------------------------------------------------------- unlocks
  Progress.isUnlocked = function (skinId) { return Progress.p.unlocked.indexOf(skinId) >= 0; };
  /** progress toward a skin: { text, done, pct } */
  Progress.unlockInfo = function (skin) {
    var u = skin.unlock, p = Progress.p, L = Progress.levelFor(p.xp);
    if (!u) return { text: '기본 제공', done: true, pct: 1 };
    if (u.level) return { text: '레벨 ' + u.level + ' 달성', done: L >= u.level, pct: Math.min(1, L / u.level), cur: 'Lv ' + L };
    if (u.wins) return { text: '레이스 ' + u.wins + '회 우승', done: p.wins >= u.wins, pct: Math.min(1, p.wins / u.wins), cur: p.wins + '/' + u.wins };
    if (u.races) return { text: '레이스 ' + u.races + '회 완주', done: p.finishes >= u.races, pct: Math.min(1, p.finishes / u.races), cur: p.finishes + '/' + u.races };
    if (u.online) return { text: '온라인 레이스 ' + u.online + '회', done: p.online >= u.online, pct: Math.min(1, p.online / u.online), cur: p.online + '/' + u.online };
    if (u.maxDrifts) return { text: 'MAX CHARGE 드리프트 ' + u.maxDrifts + '회', done: p.maxDrifts >= u.maxDrifts, pct: Math.min(1, p.maxDrifts / u.maxDrifts), cur: p.maxDrifts + '/' + u.maxDrifts };
    if (u.trackWin) {
      var t = null; for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === u.trackWin) t = TRACKS[i];
      var n = p.trackWins[u.trackWin] || 0;
      return { text: (t ? t.name : u.trackWin) + ' 우승', done: n >= 1, pct: n >= 1 ? 1 : 0, cur: n >= 1 ? '완료' : '미달성' };
    }
    if (u.podiumAll) {
      var have = 0; TRACKS.forEach(function (tr) { if ((p.trackPodiums[tr.id] || 0) >= 1) have++; });
      return { text: '모든 트랙에서 3위 안에 들기', done: have >= TRACKS.length, pct: have / TRACKS.length, cur: have + '/' + TRACKS.length + ' 트랙' };
    }
    return { text: '???', done: false, pct: 0 };
  };
  /** unlock everything whose condition is met; returns the newly unlocked skins */
  Progress.checkUnlocks = function () {
    var fresh = [];
    SKINS.forEach(function (s) {
      if (Progress.isUnlocked(s.id)) return;
      if (Progress.unlockInfo(s).done) { Progress.p.unlocked.push(s.id); fresh.push(s); }
    });
    return fresh;
  };
  /** admin: unlock every skin and max the level. returns true if anything changed */
  Progress.grantAll = function () {
    var p = Progress.p, changed = false;
    SKINS.forEach(function (s) { if (p.unlocked.indexOf(s.id) < 0) { p.unlocked.push(s.id); changed = true; } });
    var maxXp = Progress.xpForLevel(MAX_LEVEL);
    if (p.xp < maxXp) { p.xp = maxXp; changed = true; }
    if (changed) Progress.save(true);
    return changed;
  };
  Progress.setSkin = function (id) {
    if (!Progress.isUnlocked(id)) return false;
    Progress.p.skin = id; Progress.save(); return true;
  };

  // ---------------------------------------------------------------- race award
  /**
   * ctx: { trackId, trackTag, mode, rank, n, finished, laps, lapTimes[], raceTime, maxDrifts, online (real player count), difficulty }
   * returns a summary for the results screen
   */
  Progress.award = function (ctx) {
    var p = Progress.p, before = Progress.levelInfo(p.xp);
    var rows = [], sub = 0;
    function row(label, xp) { xp = Math.round(xp); if (xp === 0) return; rows.push({ label: label, xp: xp }); sub += xp; }
    row(ctx.finished ? '레이스 완주' : '레이스 참가', ctx.finished ? 80 : 30);
    if (ctx.finished && ctx.n > 1) row(U.ordinal(ctx.rank).toUpperCase() + ' PLACE', 220 * (ctx.n - ctx.rank) / (ctx.n - 1));
    if (ctx.finished && ctx.rank === 1) row('WINNER 보너스', 80);
    if (ctx.laps) row('랩 ' + ctx.laps + '회', 10 * ctx.laps);
    if (ctx.maxDrifts) row('MAX CHARGE 드리프트 ×' + ctx.maxDrifts, Math.min(90, 6 * ctx.maxDrifts));
    var mul = 1, tags = [];
    if (ctx.trackTag === 'INTERMEDIATE') { mul *= 1.15; tags.push('중급 트랙 ×1.15'); }
    if (ctx.trackTag === 'EXPERT') { mul *= 1.3; tags.push('상급 트랙 ×1.3'); }
    if (ctx.online >= 2) { mul *= 1.25; tags.push('온라인 ×1.25'); }
    else if (ctx.difficulty === 'hard') { mul *= 1.2; tags.push('HARD ×1.2'); }
    else if (ctx.difficulty === 'easy') { mul *= 0.8; tags.push('EASY ×0.8'); }
    var total = Math.round(sub * mul);
    if (mul !== 1) rows.push({ label: tags.join(' · '), xp: total - sub, mult: true });

    // records
    var rec = { lap: false, race: false };
    var recs = p.records[ctx.trackId] || (p.records[ctx.trackId] = {});
    var r = recs[ctx.mode] || (recs[ctx.mode] = {});
    var bestLap = ctx.lapTimes && ctx.lapTimes.length ? Math.min.apply(null, ctx.lapTimes) : null;
    if (bestLap && bestLap > 5 && (!r.lap || bestLap < r.lap)) { rec.lap = true; r.lap = +bestLap.toFixed(3); }
    if (ctx.finished && ctx.raceTime > 10 && (!r.race || ctx.raceTime < r.race)) { rec.race = true; r.race = +ctx.raceTime.toFixed(3); r.date = Date.now(); }
    if (rec.race) { rows.push({ label: 'NEW RECORD (레이스)', xp: 100 }); total += 100; }
    else if (rec.lap) { rows.push({ label: 'NEW RECORD (랩)', xp: 50 }); total += 50; }
    rec.lapTime = r.lap || null; rec.raceTime = r.race || null;

    // counters
    p.xp += total; p.races++; p.laps += ctx.laps || 0; p.maxDrifts += ctx.maxDrifts || 0;
    if (ctx.finished) p.finishes++;
    if (ctx.online >= 2) p.online++;
    if (ctx.finished && ctx.rank === 1) { p.wins++; p.trackWins[ctx.trackId] = (p.trackWins[ctx.trackId] || 0) + 1; }
    if (ctx.finished && ctx.rank <= 3) { p.podiums++; p.trackPodiums[ctx.trackId] = (p.trackPodiums[ctx.trackId] || 0) + 1; }
    var unlocked = Progress.checkUnlocks();
    var after = Progress.levelInfo(p.xp);
    Progress.save();
    return { rows: rows, total: total, before: before, after: after, levelUp: after.level > before.level, unlocked: unlocked, record: rec };
  };

  // ---------------------------------------------------------------- cloud merge
  /** merge a remote copy into the local profile (counters max, records min, unlocks union) */
  Progress.merge = function (remote) {
    if (!remote) return Progress.p;
    var a = Progress.p, b = Progress.sanitize(remote), out = fresh();
    ['xp', 'races', 'finishes', 'wins', 'podiums', 'online', 'maxDrifts', 'laps'].forEach(function (k) { out[k] = Math.max(a[k], b[k]); });
    ['trackWins', 'trackPodiums'].forEach(function (k) { var keys = {}; Object.keys(a[k]).concat(Object.keys(b[k])).forEach(function (t) { keys[t] = 1; }); for (var t in keys) out[k][t] = Math.max(a[k][t] || 0, b[k][t] || 0); });
    var tks = {}; Object.keys(a.records).concat(Object.keys(b.records)).forEach(function (t) { tks[t] = 1; });
    for (var t in tks) {
      out.records[t] = {}; var ra = a.records[t] || {}, rb = b.records[t] || {}, ms = {};
      Object.keys(ra).concat(Object.keys(rb)).forEach(function (m) { ms[m] = 1; });
      for (var m in ms) {
        var x = ra[m] || {}, y = rb[m] || {}, o = {};
        if (x.lap || y.lap) o.lap = Math.min(x.lap || 1e9, y.lap || 1e9);
        if (x.race || y.race) { o.race = Math.min(x.race || 1e9, y.race || 1e9); o.date = (x.race && x.race <= (y.race || 1e9)) ? x.date : y.date; }
        out.records[t][m] = o;
      }
    }
    var un = {}; a.unlocked.concat(b.unlocked).forEach(function (s) { un[s] = 1; });
    out.unlocked = SKINS.filter(function (s) { return un[s.id]; }).map(function (s) { return s.id; });
    out.skin = (b.updatedAt > a.updatedAt ? b.skin : a.skin);
    if (out.unlocked.indexOf(out.skin) < 0) out.skin = 'classic';
    out.updatedAt = Math.max(a.updatedAt, b.updatedAt);
    Progress.p = out;
    Progress.checkUnlocks();
    Progress.save(true);
    return out;
  };

  global.Progress = Progress;
})(window);
