# NITRO RUSH — 작업 인수인계 (2026-09-03, 릴레이 서버 반영)

브라우저용 카트라이더풍 3D 아케이드 레이싱. 로컬 `~/nitro-rush`, GitHub `junjun-0522/nitro-rush`, 배포 **https://junjun-0522.github.io/nitro-rush/** (main에 push하면 ~1분 내 반영).

## 현재 상태 (전부 동작·배포됨)
- 트랙 5개: AZURE COAST(입문), NEON METROPOLIS(고수), SUNSET CANYON(중급), FROST PEAK(고수·빙판 그립 0.86), **SEOUL BLOSSOM(중급, 한국 테마: 광화문·경복궁·한강 대교/잠수교·롯데타워·63빌딩·DDP·남산 N타워·북촌 한옥·벚꽃길·태극기)**
- 모드 3개: ITEM + SPEED(기본) / SPEED RACE(아이템 없음, 부스터 2개 저장, 게이지 1.5배) / ITEM RACE(게이지·드리프트 부스터 없음)
- 카트 6종(`js/karts.js`: nitro/bullet/bigfoot/formula/hover/geobukseon — 차체 빌드 함수 + 능력치 배수 + 질량 + 바퀴 배치) × 캐릭터 8 + 펫 6 (`js/chars.js`). GARAGE 화면에서 선택, 온라인 프로필(hello/players)에 kart 포함, AI는 공유 RNG로 랜덤(aiLook). 능력치 = 카트 × 캐릭터 × 펫.
- 드리프트(Space+←→, 3단계 부스터), 자동 게이지 충전(속도 비례), 순위별 아이템 확률(선두=실드/트랩, 후미=라이트닝/로켓/스피드)
- 온라인: **WebSocket 릴레이(Cloudflare Worker, relay/)** 기본 + PeerJS/WebRTC P2P 폴백. 스타 토폴로지, 방 코드 4자리, 최대 8명, AI로 채움. 호스트가 AI/로켓 시뮬 + 20Hz 상태 방송, 각 피어는 자기 카트 시뮬.
- AI 7대(설정에서 최대 57대), 러버밴딩, 헤드리스 자동 테스트 하네스 포함

## 온라인 연결 방식 (2026-09-03 교체 완료): WebSocket 릴레이 서버
- 친구 접속 실패(NAT/P2P 불가)를 TURN 대신 **릴레이 서버**로 해결. 양쪽 다 서버로 나가는 연결만 맺으므로 휴대폰 데이터·학교 와이파이에서도 붙음.
- 서버: `relay/` — Cloudflare Worker + Durable Object(방 코드당 객체 1개). 배포 주소 **wss://nitro-rush-relay.nitro-rush-relay.workers.dev** (`js/config.js`의 `relayUrl`). 계정 로그인은 이 Mac의 wrangler에 저장돼 있음(`npx wrangler@4 whoami`).
  - 배포: `cd relay && npx wrangler@4 deploy` · 로컬: `npx wrangler@4 dev --port 8787` 후 게임 URL에 `&relay=ws://127.0.0.1:8787`
  - 허용 Origin은 `relay/wrangler.jsonc`의 `ALLOWED_ORIGINS` (github.io + 127.0.0.1:8765 + localhost:8765).
  - 무료 한도: 하루 10만 요청. 들어오는 WS 메시지 20개=1요청, 나가는 건 무료. 20Hz 기준 2명 약 14시간/일, 8명 약 3.5시간/일.
  - 프로토콜: 서버 코드 상단 주석 참고 (`!ok/!open/!close/!bye`, 호스트→서버 `B|`,`X|pid|`,`U|pid|`,`K|pid`). 프로토콜 테스트: `node tools/relay_proto_test.js wss://nitro-rush-relay.nitro-rush-relay.workers.dev` → ALL PASS 여야 함.
- 클라이언트: `js/net.js`가 relayUrl이 있으면 릴레이, 없으면(또는 `?net=p2p`) 기존 PeerJS P2P. 호스트 로직은 공통(가상 커넥션 객체 RelayConn). TURN 설정(`turnServers`)은 P2P 모드에서만 의미 있음 — metered.ca 건은 보류.
- 검증: 로컬 릴레이·실서버 릴레이 모두 2인 온라인 테스트(방 생성→접속→레이스 시작→상태 동기화) 통과.

## 실행 / 테스트 / 배포
- 로컬: `cd ~/nitro-rush && python3 -m http.server 8765` → http://127.0.0.1:8765/index.html
- 회귀 테스트(헤드리스, 렌더 생략, 4배속): `node tools/harness.js "http://127.0.0.1:8765/index.html?autotest&norender&steps=4&track=0" 32 "" "" "document.getElementById('hudLapN').textContent"`
  - URL 파라미터: `autotest`(AI가 플레이어 조종) `norender` `steps=N` `track=0..3` `mode=mixed|speed|item` `char=kiki&pet=flap` `manual`(키 입력 유지) `garage` `online=host|join&room=CODE&name=X`
  - 키 입력 테스트: 4번째 인자 `"1:KeyW:down,6:Space:down,6:ArrowLeft:down,10:Space:up"`
  - 2인 온라인 테스트: `OUT=/some/dir tools/online_test.sh 70` → `$OUT/online_summary.txt` (기본 relay). `EXTRA="&net=p2p"`로 PeerJS 경로, `EXTRA="&relay=ws://127.0.0.1:8787"`로 로컬 릴레이 테스트
- GPU 스크린샷(정적 화면만 게임 시간이 안 흐름): `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --ignore-gpu-blocklist --no-sandbox --mute-audio --user-data-dir=./p --window-size=1280,800 --timeout=7000 --screenshot=./x.png "URL"`
- 헤드리스에서 rAF는 사실상 안 돌아감 → 논리 테스트는 반드시 `steps=N`(타이머 루프). CDP 스크린샷은 WebGL이 안 찍힘 → CLI 방식만.
- 배포: `git add -A && git commit && git push origin main` (커밋 서명은 Co-Authored-By: Claude 형식 유지)

## 코드 구조 (`js/`)
config(relayUrl/ICE/TURN) · karts(카트 차체) · util(텍스처·RNG) · audio(Web Audio SFX/BGM) · path(스플라인, 뱅크) · tracks(트랙 정의·도로·경관) · chars(캐릭터·펫) · kart(메시·물리·원격 보간) · fx(파티클·스키드) · items · ai · net(릴레이 WS 또는 PeerJS) · game(상태·UI·HUD·온라인 통합)

## 꼭 알아야 할 규약/함정
- three.js에서 +Z를 볼 때 +X는 **왼쪽**. 코드의 `right = up × T`는 실제로 왼쪽이며 전체가 그 규약으로 일관됨. 사람 입력만 `steer = left - right`로 뒤집혀 있음. 건드리지 말 것.
- 뱅크는 바깥 가장자리만 올림(`path.js`), 도로 밖 어깨는 평평(`Track.surfacePoint`). 이걸 바꾸면 잔디 밑으로 꺼지는 버그 재발.
- 트랙 레이아웃은 터틀(직선/호) 명령 → `def.pts` [x,z,y]. 출발 직선은 반드시 곧게, 최소 코너 반경 ≥ 20m. 생성 도구는 이전 세션 스크래치에 있었고(turtle.js) 현재 저장소엔 없음 — 필요하면 재작성(Catmull-Rom + 곡률 분석 + Hermite/free-straight 클로저).
- 온라인 AI 캐릭터 선택 등 공유 RNG는 모든 피어가 동일하게 소비해야 함.
- 헤드리스 하네스는 `/json`에서 `about:blank` 페이지 타깃을 골라야 함(아니면 ERR_ABORTED).
- 고가 구간 교각(pillar)은 `surfacePoint`로 실제 노면 높이를 구해 그 0.6m 아래에서 끝냄. 예전엔 노면 위로 0.2~1.5m 튀어나왔음(2026-09-04 수정).
- 트랙 레이아웃 생성기: `node tools/layout.js korea` — 터틀 세그먼트(['S',len]/['A',r,deg]) → Hermite 닫힘 + 80m 출발 직선, 자기교차/최소반경 검사, 고도 프로파일, ASCII 지도, pts 출력. 새 트랙은 DESIGNS에 추가.
- 정적 스크린샷: `tools/shot.sh "http://127.0.0.1:8765/tools/track_view.html?track=4&s=0.2&h=3.5&back=10[&yaw=0.3][&kart=hover&char=kiki][&x=&y=&z=&lx=&ly=&lz=]" out.png` (GPU 렌더, 게임 루프 없음). 카트 외형/트랙 장식 확인용. Chrome이 PNG를 쓰고 안 죽으므로 스크립트가 파일 생기면 kill함.

## 다음에 할 만한 것
실제 친구 테스트(릴레이) → 서울 트랙 실주행 피드백(코너 난이도·장식 밀도) → 결과 화면 지연(rtt) 표시 → 카메라/조작감 피드백 반영 → 결과 화면 리플레이/기록 저장 → 모바일 터치 조작 → 추가 트랙/캐릭터
