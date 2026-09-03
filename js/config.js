/* NITRO RUSH - network config. 학교 와이파이/휴대폰 데이터처럼 P2P 직접 연결을 막는 망에서도
   접속되게 하려면 TURN 서버를 아래 iceServers에 추가하세요 (예: metered.ca 무료 플랜).
   { urls: 'turn:relay.example.com:443?transport=tcp', username: 'xxx', credential: 'yyy' } */
window.NITRO_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ]
};
