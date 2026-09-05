/* ============================================================
   NITRO RUSH - friends + presence client
   Needs a logged-in Account. Sends a heartbeat (POST /api/presence)
   every 25 s and whenever the player's state changes (menu / lobby
   with room code / racing ...); the reply carries the friend list with
   each friend's online status, so no separate polling is needed.
   ============================================================ */
(function (global) {
  'use strict';

  var HEARTBEAT = 40000;   // server counts you online for 100 s after the last beat
  var Social = { friends: [], incoming: [], outgoing: [], onlineCount: 0, pending: 0, status: 'idle', lastAt: 0, serverNow: 0, listeners: [], state: 'menu', room: '', host: false, busy: false };
  var timer = null, inflight = null;

  Social.onChange = function (fn) { Social.listeners.push(fn); };
  function emit() { Social.listeners.forEach(function (fn) { try { fn(Social); } catch (e) { } }); }
  Social.available = function () { return global.Account && Account.loggedIn(); };

  function apply(j) {
    Social.friends = j.friends || []; Social.incoming = j.incoming || []; Social.outgoing = j.outgoing || [];
    Social.onlineCount = j.onlineCount || 0; Social.pending = j.pending || 0; Social.serverNow = j.now || Date.now();
    Social.lastAt = Date.now(); Social.status = 'ok';
    emit();
    return j;
  }
  function fail(e) {
    Social.status = e && e.error === 'unauthorized' ? 'unauthorized' : 'error';
    emit();
    throw e;
  }

  /** heartbeat: presence + friend list (deduped while one is in flight) */
  Social.refresh = function () {
    if (!Social.available()) { Social.clear(); return Promise.resolve(null); }
    if (inflight) return inflight;
    inflight = Account.request('POST', '/api/presence', { state: Social.state, room: Social.room, host: Social.host })
      .then(apply, fail).finally(function () { inflight = null; });
    return inflight;
  };
  /** tell friends what we are doing: 'menu' | 'lobby' | 'racing' | 'timeattack' | 'garage' */
  Social.setState = function (state, room, host) {
    room = room || ''; host = !!host;
    if (state === Social.state && room === Social.room && host === Social.host) return;
    Social.state = state; Social.room = room; Social.host = host;
    if (Social.available()) Social.refresh().catch(function () { });
  };
  Social.start = function () {
    if (timer) return;
    timer = setInterval(function () { if (Social.available() && !document.hidden) Social.refresh().catch(function () { }); }, HEARTBEAT);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && Social.available() && Date.now() - Social.lastAt > 15000) Social.refresh().catch(function () { }); });
    if (Social.available()) Social.refresh().catch(function () { });
  };
  Social.stop = function () { if (timer) { clearInterval(timer); timer = null; } };
  Social.clear = function () { Social.friends = []; Social.incoming = []; Social.outgoing = []; Social.onlineCount = 0; Social.pending = 0; Social.lastAt = 0; Social.status = 'idle'; emit(); };

  function action(path, body) {
    if (!Social.available()) return Promise.reject({ error: 'unauthorized' });
    Social.busy = true; emit();
    return Account.request('POST', path, body).then(function (j) { Social.busy = false; return apply(j); }, function (e) { Social.busy = false; return fail(e); });
  }
  Social.request = function (name) { return action('/api/friends/request', { to: name }); };
  Social.accept = function (user) { return action('/api/friends/accept', { from: user }); };
  Social.decline = function (user) { return action('/api/friends/decline', { from: user }); };
  Social.remove = function (user) { return action('/api/friends/remove', { user: user }); };

  Social.find = function (user) { for (var i = 0; i < Social.friends.length; i++) if (Social.friends[i].user === user) return Social.friends[i]; return null; };
  /** "3분 전" style relative time */
  Social.ago = function (t) {
    if (!t) return '기록 없음';
    var d = Math.max(0, (Social.serverNow || Date.now()) - t) / 1000;
    if (d < 90) return '방금 전';
    if (d < 3600) return Math.round(d / 60) + '분 전';
    if (d < 86400) return Math.round(d / 3600) + '시간 전';
    return Math.round(d / 86400) + '일 전';
  };
  Social.stateText = function (f) {
    if (!f.online) return '오프라인 · ' + Social.ago(f.seen);
    switch (f.state) {
      case 'lobby': return f.room ? (f.host ? '방 만들고 대기 중 · ' + f.room : '방 ' + f.room + ' 에서 대기 중') : '방 대기 중';
      case 'racing': return '레이스 중';
      case 'timeattack': return '타임어택 중';
      case 'garage': return '가라지에서 꾸미는 중';
      default: return '온라인 · 메뉴';
    }
  };

  if (global.Account) Account.onChange(function (a) { if (!a.loggedIn()) Social.clear(); else if (!Social.lastAt && !inflight) Social.refresh().catch(function () { }); });

  global.Social = Social;
})(window);
