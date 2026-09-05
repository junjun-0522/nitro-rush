/* ============================================================
   NITRO RUSH - account client (cloud save)
   Talks to the relay Worker's /api/* endpoints. The session
   (user + token) is kept in localStorage; the profile itself is
   owned by Progress and merged on every pull.
   API: POST /api/register {user,pass,profile}  -> {token, profile}
        POST /api/login    {user,pass,profile}  -> {token, profile}
        GET  /api/profile  (Bearer user:token)  -> {profile}
        PUT  /api/profile  {profile}            -> {profile}
        POST /api/logout                        -> {ok}
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'nitroRush.account.v1';
  var Account = { user: null, token: null, admin: false, busy: false, lastSync: 0, status: 'offline', listeners: [] };

  function baseUrl() {
    var qs = /[?&]account=([^&]+)/.exec(location.search);
    if (qs) return decodeURIComponent(qs[1]).replace(/\/$/, '');
    var cfg = global.NITRO_CONFIG || {};
    if (cfg.accountUrl) return cfg.accountUrl.replace(/\/$/, '');
    var r = /[?&]relay=([^&]+)/.exec(location.search);
    var relay = r ? decodeURIComponent(r[1]) : cfg.relayUrl;
    if (!relay) return null;
    return relay.replace(/^ws/, 'http').replace(/\/$/, '');
  }
  Account.baseUrl = baseUrl;
  Account.available = function () { return !!baseUrl(); };
  Account.loggedIn = function () { return !!(Account.user && Account.token); };
  Account.onChange = function (fn) { Account.listeners.push(fn); };
  function emit() { Account.listeners.forEach(function (fn) { try { fn(Account); } catch (e) { } }); }

  Account.load = function () {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.user && s.token) { Account.user = s.user; Account.token = s.token; Account.admin = !!s.admin; } } catch (e) { }
    return Account.loggedIn();
  };
  function persist() { try { if (Account.loggedIn()) localStorage.setItem(KEY, JSON.stringify({ user: Account.user, token: Account.token, admin: Account.admin })); else localStorage.removeItem(KEY); } catch (e) { } }

  function errText(code) {
    return ({
      'bad-user': '아이디는 2~16자 (한글/영문/숫자/_)만 가능해요.', 'bad-pass': '비밀번호는 4자 이상이어야 해요.',
      'taken': '이미 있는 아이디예요.', 'no-user': '없는 아이디예요.', 'wrong-pass': '비밀번호가 틀렸어요.',
      'unauthorized': '로그인이 풀렸어요. 다시 로그인해주세요.', 'rate': '너무 많이 시도했어요. 잠시 후 다시 해주세요.',
      'too-big': '저장 데이터가 너무 커요.', 'network': '계정 서버에 연결할 수 없어요. 인터넷을 확인해주세요.'
    })[code] || ('계정 오류: ' + code);
  }
  Account.errText = errText;

  function req(method, path, body, auth) {
    var base = baseUrl();
    if (!base) return Promise.reject({ error: 'network' });
    var h = { 'content-type': 'application/json' };
    if (auth && Account.loggedIn()) h.authorization = 'Bearer ' + Account.user + ':' + Account.token;
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    return fetch(base + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return { error: 'http-' + r.status }; }).then(function (j) { if (!r.ok || j.error) throw { error: j.error || ('http-' + r.status) }; return j; }); })
      .catch(function (e) { if (e && e.error) throw e; throw { error: 'network' }; })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function applyRemote(j) {
    if (j && j.profile) Progress.merge(j.profile);
    if (j && typeof j.admin === 'boolean' && j.admin !== Account.admin) { Account.admin = j.admin; persist(); }
    Account.lastSync = Date.now(); Account.status = 'synced';
    // admin accounts own every skin at max level; push the granted profile back once
    if (Account.admin && Progress.grantAll()) Account.push();
    emit();
  }

  /** register or login; both send the local profile so the merged result comes back at once */
  Account.register = function (user, pass) { return Account._auth('/api/register', user, pass); };
  Account.login = function (user, pass) { return Account._auth('/api/login', user, pass); };
  Account._auth = function (path, user, pass) {
    Account.busy = true; emit();
    return req('POST', path, { user: user, pass: pass, profile: Progress.p }).then(function (j) {
      Account.user = j.user; Account.token = j.token; persist();
      applyRemote(j);
      Account.busy = false; emit();
      return j;
    }, function (e) { Account.busy = false; if (!Account.loggedIn()) Account.status = 'error'; emit(); throw e; });
  };
  Account.logout = function () {
    var was = Account.loggedIn();
    if (was) req('POST', '/api/logout', null, true).catch(function () { });
    Account.user = null; Account.token = null; Account.admin = false; Account.status = 'offline'; persist(); emit();
  };
  /** change password (server verifies the old one and rotates the token) */
  Account.changePassword = function (oldPass, newPass) {
    if (!Account.loggedIn()) return Promise.reject({ error: 'unauthorized' });
    Account.busy = true; emit();
    return req('POST', '/api/password', { pass: oldPass, newPass: newPass }, true).then(function (j) {
      Account.token = j.token; persist(); Account.busy = false; emit(); return j;
    }, function (e) { Account.busy = false; emit(); throw e; });
  };

  /** push the local profile (merged server-side) — debounced, safe to call after every race */
  var pushTimer = null;
  Account.push = function (now) {
    if (!Account.loggedIn()) return Promise.resolve(null);
    if (pushTimer) clearTimeout(pushTimer);
    return new Promise(function (res) {
      pushTimer = setTimeout(function () {
        pushTimer = null;
        req('PUT', '/api/profile', { profile: Progress.p }, true).then(function (j) { applyRemote(j); res(j); }, function (e) {
          if (e.error === 'unauthorized') Account.logout();
          Account.status = 'error'; emit(); res(null);
        });
      }, now ? 0 : 800);
    });
  };
  /** pull + merge + push back (used at startup) */
  Account.sync = function () {
    if (!Account.loggedIn()) return Promise.resolve(null);
    Account.busy = true; Account.status = 'syncing'; emit();
    return req('PUT', '/api/profile', { profile: Progress.p }, true).then(function (j) { Account.busy = false; applyRemote(j); return j; }, function (e) {
      Account.busy = false; Account.status = 'error'; emit();
      if (e.error === 'unauthorized') Account.logout();
      return null;
    });
  };

  global.Account = Account;
})(window);
