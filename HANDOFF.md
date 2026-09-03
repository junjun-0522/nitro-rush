# NITRO RUSH — 작업 인수인계 (2026-09-03)

브라우저용 카트라이더풍 3D 아케이드 레이싱. 로컬 `~/nitro-rush`, GitHub `junjun-0522/nitro-rush`, 배포 **https://junjun-0522.github.io/nitro-rush/** (main에 push하면 ~1분 내 반영).

## 현재 상태 (전부 동작·배포됨)
- 트랙 4개: AZURE COAST(입문), NEON METROPOLIS(고수), SUNSET CANYON(중급), FROST PEAK(고수·빙판 그립 0.86)
- 모드 3개: ITEM + SPEED(기본) / SPEED RACE(아이템 없음, 부스터 2개 저장, 게이지 1.5배) / ITEM RACE(게이지·드리프트 부스터 없음)
- 캐릭터 8 + 펫 6 (`js/chars.js`, GARAGE 화면, 능력치 배수·펫 퍼크), 온라인에서도 상대 캐릭터/펫 표시
- 드리프트(Space+←→, 3단계 부스터), 자동 게이지 충전(속도 비례), 순위별 아이템 확률(선두=실드/트랩, 후미=라이트닝/로켓/스피드)
- 온라인: PeerJS 공개 시그널링(0.peerjs.com) + WebRTC 스타 토폴로지. 방 코드 4자리, 최대 8명, AI로 채움. 호스트가 AI/로켓 시뮬 + 20Hz 상태 방송, 각 피어는 자기 카트 시뮬.
- AI 7대(설정에서 최대 57대), 러버밴딩, 헤드리스 자동 테스트 하네스 포함

## ★ 미완료: TURN(중계) 서버 설정 — 친구와 온라인 접속 실패 해결
- 증상: 친구 접속 시 "방은 찾았지만 P2P 직접 연결 실패" → NAT 때문. 무료 공개 TURN은 전부 죽어 있음(6곳 확인).
- 사용자가 metered.ca 가입 완료, 앱 이름 **`nitrorush0522`** (도메인 `nitrorush0522.metered.live` 존재 확인).
- 사용자가 붙여넣은 키는 API가 `Invalid API Key`로 거부 → Secret Key가 아니었음. **다음 할 일:** 대시보드 왼쪽 **TURN Server → Add Credential** 로 username/credential 받기 (API Key 공개 노출 없이 가장 안전).
- 값을 받으면 `js/config.js`의 `turnServers`에 넣고 push:
  ```js
  turnServers: [
    { urls: 'turn:global.relay.metered.ca:80', username: 'USER', credential: 'PASS' },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'USER', credential: 'PASS' },
    { urls: 'turn:global.relay.metered.ca:443', username: 'USER', credential: 'PASS' },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'USER', credential: 'PASS' }
  ]
  ```
  (API Key 방식이면 `turnApiUrl: 'https://nitrorush0522.metered.live/api/v1/turn/credentials?apiKey=SECRET'` — Developers 메뉴의 Secret Key여야 함)
- 검증법: `tools/turn_test.html`의 iceServers를 바꿔 `node tools/harness.js "http://127.0.0.1:8765/tools/turn_test.html" 40` → `[TURN] ... {"relay":N}` 이 나와야 성공. 온라인 화면 하단에 "중계(TURN) 서버: 설정됨" 표시되면 적용된 것.

## 실행 / 테스트 / 배포
- 로컬: `cd ~/nitro-rush && python3 -m http.server 8765` → http://127.0.0.1:8765/index.html
- 회귀 테스트(헤드리스, 렌더 생략, 4배속): `node tools/harness.js "http://127.0.0.1:8765/index.html?autotest&norender&steps=4&track=0" 32 "" "" "document.getElementById('hudLapN').textContent"`
  - URL 파라미터: `autotest`(AI가 플레이어 조종) `norender` `steps=N` `track=0..3` `mode=mixed|speed|item` `char=kiki&pet=flap` `manual`(키 입력 유지) `garage` `online=host|join&room=CODE&name=X`
  - 키 입력 테스트: 4번째 인자 `"1:KeyW:down,6:Space:down,6:ArrowLeft:down,10:Space:up"`
  - 2인 온라인 테스트: `BASE=... tools/online_test.sh 70` → `online_summary.txt`
- GPU 스크린샷(정적 화면만 게임 시간이 안 흐름): `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --ignore-gpu-blocklist --no-sandbox --mute-audio --user-data-dir=./p --window-size=1280,800 --timeout=7000 --screenshot=./x.png "URL"`
- 헤드리스에서 rAF는 사실상 안 돌아감 → 논리 테스트는 반드시 `steps=N`(타이머 루프). CDP 스크린샷은 WebGL이 안 찍힘 → CLI 방식만.
- 배포: `git add -A && git commit && git push origin main` (커밋 서명은 Co-Authored-By: Claude 형식 유지)

## 코드 구조 (`js/`)
config(ICE/TURN) · util(텍스처·RNG) · audio(Web Audio SFX/BGM) · path(스플라인, 뱅크) · tracks(트랙 정의·도로·경관) · chars(캐릭터·펫) · kart(메시·물리·원격 보간) · fx(파티클·스키드) · items · ai · net(PeerJS) · game(상태·UI·HUD·온라인 통합)

## 꼭 알아야 할 규약/함정
- three.js에서 +Z를 볼 때 +X는 **왼쪽**. 코드의 `right = up × T`는 실제로 왼쪽이며 전체가 그 규약으로 일관됨. 사람 입력만 `steer = left - right`로 뒤집혀 있음. 건드리지 말 것.
- 뱅크는 바깥 가장자리만 올림(`path.js`), 도로 밖 어깨는 평평(`Track.surfacePoint`). 이걸 바꾸면 잔디 밑으로 꺼지는 버그 재발.
- 트랙 레이아웃은 터틀(직선/호) 명령 → `def.pts` [x,z,y]. 출발 직선은 반드시 곧게, 최소 코너 반경 ≥ 20m. 생성 도구는 이전 세션 스크래치에 있었고(turtle.js) 현재 저장소엔 없음 — 필요하면 재작성(Catmull-Rom + 곡률 분석 + Hermite/free-straight 클로저).
- 온라인 AI 캐릭터 선택 등 공유 RNG는 모든 피어가 동일하게 소비해야 함.
- 헤드리스 하네스는 `/json`에서 `about:blank` 페이지 타깃을 골라야 함(아니면 ERR_ABORTED).

## 다음에 할 만한 것
TURN 적용(최우선) → 실제 친구 테스트 → 카메라/조작감 피드백 반영 → 결과 화면 리플레이/기록 저장 → 모바일 터치 조작 → 추가 트랙/캐릭터
