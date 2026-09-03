# NITRO RUSH — 브라우저 아케이드 카트 레이싱

## 실행
- `index.html` 더블클릭 (Chrome 권장) 또는
- `python3 -m http.server 8765` 실행 후 http://127.0.0.1:8765/index.html

외부 에셋 없음. Three.js / PeerJS는 `js/vendor/`에 포함.

## 조작
W/↑ 가속 · S/↓ 브레이크/후진 · A/D ←/→ 조향 · Space+←→ 드리프트 · Shift 부스터 · E 아이템 · R 복귀 · Esc 일시정지

## 온라인 (친구와)
1. 메인 메뉴 → ONLINE MULTIPLAYER → 닉네임 입력 → 방 만들기
2. 화면의 4자리 코드를 친구에게 전달
3. 친구는 같은 게임 파일을 열고 → ONLINE MULTIPLAYER → 코드 입력 → 참가
4. 방장이 트랙/모드/인원 설정 후 Start

연결은 브라우저끼리 직접(WebRTC, PeerJS 공개 시그널링 서버 사용). 학교/회사망처럼 P2P를 막는 네트워크에서는 연결이 안 될 수 있음.

## 자동 테스트 (개발용)
`node tools/harness.js "http://127.0.0.1:8765/index.html?autotest&norender&steps=4&track=0" 70`
- `autotest` AI가 플레이어 조종, `norender` 렌더 생략, `steps=N` N배속, `track=0|1`, `speed` 스피드전, `manual` 키 입력 유지
- 온라인 2인 테스트: `tools/online_test.sh`
