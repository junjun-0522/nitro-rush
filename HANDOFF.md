# NITRO RUSH — 작업 인수인계 (2026-09-05, 계정/XP/스킨 반영)

브라우저용 카트라이더풍 3D 아케이드 레이싱. 로컬 `~/nitro-rush`, GitHub `junjun-0522/nitro-rush`, 배포 **https://junjun-0522.github.io/nitro-rush/** (main에 push하면 ~1분 내 반영).

## 현재 상태 (전부 동작·배포됨)
- 트랙 9개: AZURE COAST(입문), NEON METROPOLIS(고수), SUNSET CANYON(중급), FROST PEAK(고수·빙판 그립 0.86), **SEOUL BLOSSOM(중급, 한국 테마: 광화문·경복궁·한강 대교/잠수교·롯데타워·63빌딩·DDP·남산 N타워·북촌 한옥·벚꽃길·태극기)**
- **SKY CRYSTAL(중상급, 포인트-투-포인트 3.0km, 2026-09-05)**: 카트라이더 러쉬플러스 비행 트랙 느낌(사용자 스크린샷 참고). 밝은 얼음 하늘 세계, 구름바다 위. **비행 구간 시스템**(`def.flights = [{a, b, w, gap}]`): 구간 안은 도로 없음(도로/대시/럼블/레일/포스트/스커트/교각은 `roadRuns` 단위로만 생성), 주행 한계 minLat/maxLat 를 폭 w 로 넓혀 보이지 않는 회랑을 활공, `flightMask[j]`, 카트 `flying` 플래그(오프로드 감속 없음, 최고속 +8%, 스티어에 따라 기체 롤·피치·부유 바운스, 스파클 트레일, TAKE OFF!/LANDING 메시지), 90m 간격 팔각 부스터 링(`boostPads` 에 `ring:true, w:17` 로 자동 등록, `<<` 표지 + 회전 디스크). 테마 도로 옵션: `road:'crystal'|'energy'`(util.tex), `roadOpacity/roadEm/roadEmI/roadRough/roadMetal`, `dash:false`, `rumble:false`(대신 발광 가장자리 선), `railGlow`, `ringColor`, `zoneTex/zoneTint/zoneEm`. 레이아웃 `tools/layout.js sky`. 구간: 얼음 정거장 → 프로스트 협곡(얼음 벽) → 비행1(절벽 이륙, 링) → 수정 다리 착지 → 얼음 동굴 터널 헤어핀 → 비행2(구름바다 장거리) → 수정 정원 헤어핀 → 시케인 → 비행3(오로라) → 하늘 궁전 FINISH(탑·관중석·착륙 링). 경관: 구름바다 판+구름 스프라이트(비행 회랑 옆 작은 구름 포함), 신광(god rays), 오로라 리본 3개(애니), 떠다니는 얼음 섬 90개(비행 회랑 근처 우선), 수정 군락, 눈송이.
- **ORBITAL RUN(고수, 포인트-투-포인트 5.8km, 2026-09-05)**: (2026-09-05 개정) 포탈 제거, 도로를 에너지 도로(`road:'energy'`, 반투명·발광 격자·대시 없음·발광 레일)로 교체, 무중력 구간과 행성 궤도 구간을 비행 구간으로 전환.: 첫 비순환 코스. `def.open: true` 면 TrackPath 가 열린 Catmull-Rom(랩 없음, `wrap` 은 클램프, `nb()` 이웃 인덱스 클램프), `Track.open/finishS`(= 길이 - runoff 120m), `cpS[0] = finishS` 나머지 체크포인트는 finishS 를 cpCount 등분, 그리드는 s=14+ 부터 앞으로 배치, 도로 스트립은 `FULL=[0,N-1]` 로 끝을 처음과 잇지 않음, `_buildFinish()` 가 결승선·FINISH 게이트·번호 체크포인트 아치·끝 벽을 세움. 카트는 결승 통과 후 관성 주행 → finishS+45m 부터 브레이크, 길 끝 8m 앞에서 정지(끝 벽). AI 도 동일. HUD 는 `CP n/10` + `TO FINISH x.xx KM`, 체크포인트 통과 시 메시지·사운드, 미니맵/미리보기는 열린 선 + 결승 표시, 결승 후 카메라가 카트 주위를 천천히 돎. `tools/layout.js space`(`open: true` 디자인은 클로저 생략). 9개 구간: 정거장 격납고(복도 바닥·벽·천장·조명·셔틀) → 발사 터널(스피드 링) → 무중력(에너지 브리지 글로우·소행성 260개 부유·중력 발생기) → 궤도 고속도로(아래 행성·달·위성) → 가스 행성 궤도(고리·위성 공전) → 우주선 교통(14대 왕복·비콘) → 중력 반전 터널(회전 링) → 정거장 외벽(거대 링·도킹 암·타워·태양광 패널) → 최종 직선(오비탈 게이트·홀로 링·관중석·조명탑·착륙 링) + 포탈 2개. 하늘 돔은 코스 중심·크기에 맞춰 자동(`skyDome(..., radius)`), 카메라 far 7000. 별·성운·태양은 돔 반지름 근처에 둘 것(가까우면 바닥처럼 보임). 홀로 링은 도로 위 8.5~9.5m(눈높이에 두면 튜브가 화면을 덮음).
- **NITRO LAB(고수, 1랩 3.3km, 2026-09-05)**: 거대 미래 과학실 안. `tools/layout.js lab`(사각 순환로 + 바깥 벌지: 실험대 y18 위 3연속 헤어핀 → 18m 낙하 점프, 반응로 더블 헤어핀, 300m 레이저 직선, 시험관 에스 4연속(폭 15), 현미경/DNA 헤어핀, 긴 피니시 직선). **워프 포탈** 2개(`def.portals = [{a, lat, r, to, toLat}]`, 진입 게이트 시안/출구 주황 링, `Track._buildPortals`): 카트가 링 안(|s-sA|<3.2, |lat-latA|<r)에 들어오면 `Kart.teleport` 로 출구에 소환(속도 유지, 체크포인트 cpPassed 를 출구 위치로 갱신, 2.5s 쿨다운, 'portal' 이벤트 → WARP! 연출·카메라 리셋). 원격 카트는 applyNetState 의 10m 스냅으로 자연스럽게 점프. AI 는 useShortcut 이면 75m 전부터 게이트 쪽으로 차선 이동. 경관: labFloor/periodic/formula 캔버스 텍스처, 벽 4면·천장 조명 패널, 실험대(현미경·책·페트리), 비커 5개(액체+버블 애니), 삼각플라스크, 시험관 랙, 반응로 코어/타워(회전 링), DNA 나선 3개(회전), 로봇팔(애니), 홀로 링, 드론 8대(트랙 따라 비행), 레이저 펜스, 거대 연필·자.
- **JEJU EDU CITY(중급, 2026-09-05)**: 사용자가 보낸 네이버 지도 스크린샷(제주영어교육도시)을 픽셀 단위로 따라 그린 1712m 순환로(`tools/jeju_map.js`, 실축척 39%). 북쪽 = -z 라서 미니맵/미리보기가 지도와 같은 방향. 지도 위치대로 이노에듀타운(안쪽 남쪽, 음식점 간판 거리)·한신더휴·SJA·BHA·KIS(안쪽), 삼정 G.edu·곶자왈도립공원·라온 타운하우스·꿈에그린·119센터(바깥 서쪽), 노리매공원·유채꽃밭(동쪽), 감귤밭+돌담, 돌하르방, 곶자왈 숲(instanced 900그루), 야자수, 오름, 한라산, 풍력발전기. 이름 간판은 `trackSign(key,text,f,lat,...)` 로 트랙 옆에 세우고 30 스테이션 뒤를 바라보게 해 다가오면서 읽힘. `box()` 는 도로와 너무 가까우면 건물을 건너뜀(autotest 로그 `jeju buildings skipped`).
- 모드 3개: ITEM + SPEED(기본) / SPEED RACE(아이템 없음, 부스터 2개 저장, 게이지 1.5배) / ITEM RACE(게이지·드리프트 부스터 없음)
- 카트 6종(`js/karts.js`: nitro/bullet/bigfoot/formula/hover/geobukseon — 차체 빌드 함수 + 능력치 배수 + 질량 + 바퀴 배치) × 캐릭터 8 + 펫 6 (`js/chars.js`). GARAGE 화면에서 선택, 온라인 프로필(hello/players)에 kart 포함, AI는 공유 RNG로 랜덤(aiLook). 능력치 = 카트 × 캐릭터 × 펫.
- 드리프트(Space+←→, 3단계 부스터), 자동 게이지 충전(속도 비례), 순위별 아이템 확률(선두=실드/트랩, 후미=라이트닝/로켓/스피드)
- 온라인: **WebSocket 릴레이(Cloudflare Worker, relay/)** 기본 + PeerJS/WebRTC P2P 폴백. 스타 토폴로지, 방 코드 4자리, 최대 8명, AI로 채움. 호스트가 AI/로켓 시뮬 + 20Hz 상태 방송, 각 피어는 자기 카트 시뮬.
- AI 7대(설정에서 최대 57대), 러버밴딩, 헤드리스 자동 테스트 하네스 포함
- **프로그레션(2026-09-05)**: `js/progress.js` — localStorage `nitroRush.profile.v1` 에 XP/레벨(최대 50, `xpForLevel(L)=300·(L-1)^1.4`)/카운터(races·finishes·wins·podiums·online·maxDrifts·laps·trackWins·trackPodiums)/트랙·모드별 개인기록(records[trackId][mode]={lap,race,date}, ms)/해금 스킨/선택 스킨. `Progress.award(ctx)` 가 결과 화면에서 1회 호출(race.award 가드) → XP 내역·레벨업·신기록·새 해금 반환, `renderAward` 가 `#resultsXp` 에 표시. 트랙 선택 카드에 현재 모드의 MY RECORD 표시.
- **스킨 16종** `js/skins.js` (classic 기본 + 레벨/우승/완주/온라인/MAX드리프트/서울 우승/전 트랙 포디움 해금). 스킨 = paint/accent 색 + 캔버스 패턴(stripes/flames/camo/carbon/galaxy/petals/neon/pixel/taeguk/hex) + metal/rough/emissive/glow. `buildKartMesh(..., skinId)` 가 적용, `Kart.skinId`, 온라인 hello/players 에 `skin` 포함, AI 는 aiLook 에서 30% 확률로 랜덤 스킨(공유 RNG 소비 순서 유지!). GARAGE 맨 위 SKIN · INVENTORY 카드(잠김 카드는 해금 조건+진행 바, 클릭 시 흔들림).
- **계정/클라우드 세이브** `js/account.js` + `relay/src/account.js`: 릴레이 Worker 의 `/api/register|login|profile|logout`, 사용자명별 Durable Object `Account`(SQLite, PBKDF2-SHA256 100k, 토큰 48hex, 로그인 12회/10분 제한, 프로필 32KB 제한, Origin 허용목록). 서버·클라이언트 모두 같은 병합 규칙(카운터 max, 기록 min, 해금 합집합, 스킨은 최신 updatedAt). 세션은 `nitroRush.account.v1`(admin 플래그 포함). **관리자 계정**: `relay/wrangler.jsonc` 의 `ADMIN_USERS`(현재 `junjun`) → 로그인/프로필 응답에 `admin:true` → 클라이언트 `Progress.grantAll()`(전 스킨 해금 + LV 50 XP) 후 서버에 push, 칭호 ADMIN·이름에 👑. `/api/password` 로 비밀번호 변경(토큰 회전). 메인 메뉴 프로필 바(레벨·XP 바·계정 버튼) → Account 화면(아이디 2~16자 한글/영문/숫자/_, 비번 4자+). 로그인/가입 시 로컬 프로필을 보내 병합된 결과를 받고, 이후 `Progress.onChange → Account.push()`(0.8s 디바운스), 시작 시 `Account.sync()`. 비밀번호 찾기 없음.

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
- 정적 뷰어 디버그: `tools/track_view.html?...&hide=sprite_points_shader_torusgeometry` 로 종류별 숨기기, 하네스 eval 에서 `__pick(nx, ny)` 로 화면 좌표에 그려진 오브젝트 확인(가려지는 원인 찾기).
- 헤드리스에서 rAF는 사실상 안 돌아감 → 논리 테스트는 반드시 `steps=N`(타이머 루프). CDP 스크린샷은 WebGL이 안 찍힘 → CLI 방식만.
- 계정 API 테스트: `node tools/account_api_test.js http://127.0.0.1:8787` (또는 프로덕션 URL) — 가입/로그인/병합/토큰 회전/로그아웃/속도 제한 23개 체크. 브라우저 쪽은 URL `?autotest&accscreen&account=http://127.0.0.1:8787&resetprofile&xp=1000&nosync` 로 열고 하네스 eval 에서 `Account.register(...)` 호출(하네스 eval 은 Promise 를 기다림, `SHOT_AFTER=파일 SHOT_AFTER_MS=2500` 로 eval 뒤 스크린샷).
- 프로그레션 테스트 파라미터: `resetprofile`(프로필 초기화) `xp=N` `skin=id`(강제 해금+장착) `nosync`(시작 동기화 생략). `__dbg.progress / __dbg.award / __dbg.account` 노출. 결과 화면 도달 시 `[AUTOTEST] XP +N lv a->b unlocked=... record=...` 로그.
- 배포: `git add -A && git commit && git push origin main` (커밋 서명은 Co-Authored-By: Claude 형식 유지). 릴레이/계정 서버는 `cd relay && npx wrangler@4 deploy` 별도 배포 (DO 마이그레이션 v1 Room, v2 Account).

## 코드 구조 (`js/`)
config(relayUrl/accountUrl/ICE/TURN) · karts(카트 차체) · skins(스킨·패턴) · progress(XP·기록·해금) · account(클라우드 세이브 클라이언트) · util(텍스처·RNG) · audio(Web Audio SFX/BGM) · path(스플라인, 뱅크) · tracks(트랙 정의·도로·경관) · chars(캐릭터·펫) · kart(메시·물리·원격 보간) · fx(파티클·스키드) · items · ai · net(릴레이 WS 또는 PeerJS) · game(상태·UI·HUD·온라인 통합)

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
실제 친구 테스트(릴레이·계정 동기화) → 스킨 해금 밸런스(레벨 커브·XP 양) 실플레이 피드백 → 서울 트랙 실주행 피드백(코너 난이도·장식 밀도) → 결과 화면 지연(rtt) 표시 → 카메라/조작감 피드백 반영 → 결과 화면 리플레이/기록 저장 → 모바일 터치 조작 → 추가 트랙/캐릭터
