/* NITRO RUSH - network config
   기본 연결 방식은 relayUrl(WebSocket 릴레이)이며 NAT/방화벽과 무관하게 붙습니다. 아래 TURN 설정은 P2P 모드에서만 쓰입니다.
   P2P 직접 연결이 막히는 망(휴대폰 데이터, 학교/회사 와이파이, 일부 공유기)에서도 접속되려면
   TURN(중계) 서버가 필요합니다. 무료 계정으로 받을 수 있는 곳: https://www.metered.ca/stun-turn (Open Relay)

   방법 A) metered.ca API 키 방식 — 아래 turnApiUrl 에 넣기 (앱 이름과 API 키 부분만 바꾸면 됨)
     turnApiUrl: 'https://<앱이름>.metered.live/api/v1/turn/credentials?apiKey=<API키>'
   방법 B) 고정 자격증명 방식 — turnServers 배열에 직접 넣기
     { urls: 'turn:global.relay.metered.ca:443?transport=tcp', username: '...', credential: '...' }
*/
window.NITRO_CONFIG = {
  /* 릴레이 서버(relay/ 폴더의 Cloudflare Worker) 주소. 비워 두면 PeerJS P2P를 씁니다.
     배포 후: 'wss://nitro-rush-relay.<계정>.workers.dev'   테스트: URL에 ?relay=ws://127.0.0.1:8787 */
  relayUrl: 'wss://nitro-rush-relay.nitro-rush-relay.workers.dev',
  /* 계정/클라우드 세이브 API 주소. 비워 두면 relayUrl 의 https 주소(/api/...)를 그대로 씁니다. */
  accountUrl: '',
  stunServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ],
  turnApiUrl: '',
  turnServers: []
};

// resolve the final ICE server list (STUN + any TURN) once at startup
window.NITRO_ICE = null;
window.NITRO_ICE_READY = (function () {
  var cfg = window.NITRO_CONFIG, list = cfg.stunServers.slice().concat(cfg.turnServers || []);
  function done(extra) {
    if (extra && extra.length) list = list.concat(extra);
    window.NITRO_ICE = list;
    window.NITRO_TURN_OK = list.some(function (s) { return /^turns?:/.test(Array.isArray(s.urls) ? s.urls[0] : s.urls); });
    return list;
  }
  if (!cfg.turnApiUrl) return Promise.resolve(done([]));
  return fetch(cfg.turnApiUrl).then(function (r) { return r.json(); }).then(function (servers) {
    return done(Array.isArray(servers) ? servers.filter(function (s) { return /^turns?:/.test(Array.isArray(s.urls) ? s.urls[0] : s.urls); }) : []);
  }).catch(function (e) { console.warn('TURN credential fetch failed', e); return done([]); });
})();
