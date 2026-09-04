/* ============================================================
   NITRO RUSH - main game controller
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var SETTINGS_KEY = 'nitroRush.settings.v1';
  var settings = { racers: 8, difficulty: 'normal', quality: 'high', volume: 0.8, music: true, track: 0, mode: 'mixed', char: 'volt', pet: 'spark', kart: 'nitro' };
  var MODES = {
    mixed: { label: 'ITEM + SPEED', desc: '아이템 + 드리프트 부스터 (부스터 1개 저장)', items: true, gauge: true, stock: 1, gaugeMul: 1 },
    speed: { label: 'SPEED RACE', desc: '아이템 없음 · 드리프트로 부스터 충전 · 부스터 2개 저장', items: false, gauge: true, stock: 2, gaugeMul: 1.5 },
    item: { label: 'ITEM RACE', desc: '아이템만 · 부스터 게이지 없음 (부스트 패드는 유지)', items: true, gauge: false, stock: 0, gaugeMul: 0 }
  };
  var MODE_ORDER = ['mixed', 'speed', 'item'];
  function modeInfo(m) { return MODES[m] || MODES.mixed; }
  function nextMode(m) { return MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length]; }
  try { var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); for (var k in saved) if (k in settings) settings[k] = saved[k]; } catch (e) { }
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { } }

  var AI_NAMES = ['BLAZE', 'VORTEX', 'PIXEL', 'MANGO', 'COMET', 'ZIPPY', 'NOVA', 'BOLT', 'JUNO', 'REX', 'KIWI', 'TURBO', 'ECHO', 'FLASH', 'GIZMO', 'HAZEL', 'IRIS', 'JET', 'KOBE', 'LUNA', 'MILO', 'NEO', 'OZZY', 'PEPPER', 'QUILL', 'ROXY', 'SKYE', 'TANK', 'ULA', 'VIPER', 'WREN', 'XENO', 'YUKI', 'ZANE', 'ASTRO', 'BEAN', 'CHILI', 'DASH', 'EMBER', 'FROST', 'GUST', 'HOPPER', 'INKY', 'JOLT', 'KARMA', 'LOOP', 'MOCHA', 'NIMBUS', 'ORBIT', 'PUNCH', 'QUARK', 'RIFF', 'SONIC', 'TWIST', 'UMBRA', 'VELVET', 'WISP'];
  var AI_COLORS = [0xff3b3b, 0x3b8bff, 0x2ecc71, 0xff8c00, 0x9b59b6, 0x1abc9c, 0xe84393, 0x95a5a6, 0x00cec9, 0xd35400, 0x6c5ce7, 0xc0392b, 0x2980b9, 0x27ae60, 0x8e44ad, 0xf39c12, 0x16a085, 0x7f8c8d, 0xff6b6b, 0x48dbfb];
  var AI_ACCENTS = [0xffffff, 0x111111, 0xffe066, 0x66ccff, 0xff9ff3, 0x1dd1a1];
  var PLAYER_COLORS = [0xffd60a, 0x2fe0ff, 0x2ecc71, 0xff8c00, 0xd25cff, 0xff3b3b, 0xf8f8f8, 0x1abc9c];
  var PLAYER_ACCENTS = [0xff2e7e, 0x111111, 0xffffff, 0x111111, 0xffffff, 0xffe066, 0xff2e7e, 0xffffff];
  var online = null; // { net, isHost, myId, lobby, startAt, cfg, kartById, sendTimer }

  var ICONS = {
    speed: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 4l7 8-7 8h5l7-8-7-8zM11 4l7 8-7 8h5l7-8-7-8z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c3 2 5 6 5 11l3 3v4l-4-2c-1 1-2.5 1.5-4 1.5S9 19 8 18l-4 2v-4l3-3c0-5 2-9 5-11zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg>',
    trap: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2 4 4-2-1 4.5L21 10l-3.5 2.5L21 16l-4-1-1 4.5-4-2.5L8 19.5 7 15l-4 1 3.5-3.5L3 10l4-1.5L6 4l4 2z"/></svg>',
    lightning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>'
  };
  var ICON_COLORS = { speed: '#ffa640', shield: '#66ccff', rocket: '#ff4d4d', trap: '#b388ff', lightning: '#fff176' };
  var ITEM_ORDER = ['speed', 'shield', 'rocket', 'trap', 'lightning'];

  // ---------------------------------------------------------------- state
  var renderer, scene, camera, sun, hemi, fx, audio, track, items;
  var karts = [], ais = [], player = null, playerAI = null;
  var state = 'loading', trackIndex = settings.track || 0;
  var clock = { last: performance.now(), t: 0 };
  var race = { time: 0, raceOn: false, countdown: 0, cdShown: -1, finishedAt: null, allDoneAt: null, results: null };
  var keys = {}, edges = {};
  var cam = { fov: 72, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false };
  var world = {};
  var sunDir = new THREE.Vector3(-0.5, 1, -0.7).normalize();
  var _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
  var boardTimer = 0, shadowTimer = 0, rouletteTimer = 0, rouletteIdx = 0, lastItemShown = null;
  var minimap = { pts: null, scale: 1, ox: 0, oy: 0 };

  // ---------------------------------------------------------------- init
  function init() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      $('err').textContent = 'WebGL을 초기화할 수 없습니다: ' + e.message; return;
    }
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.3, 2600);
    hemi = new THREE.HemisphereLight(0xbfe9ff, 0x6c8f4a, 0.75); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff3d6, 1.5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 5; sun.shadow.camera.far = 420;
    sun.shadow.camera.left = -70; sun.shadow.camera.right = 70; sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun); scene.add(sun.target);
    fx = new FX(scene);
    audio = new AudioSys();
    audio.volume = settings.volume; audio.musicOn = settings.music;

    bindUI(); bindInput(); applyQuality();
    window.addEventListener('resize', resize); resize();
    loadTrack(trackIndex);
    showScreen('menu');
    $('loading').classList.add('hidden');
    requestAnimationFrame(loop);
    var qs = location.search;
    if (/autotest/.test(qs)) {
      window.__autotest = true;
      var m = /track=(\d+)/.exec(qs); if (m) { var want = parseInt(m[1], 10) % TRACKS.length; if (want !== trackIndex) loadTrack(want); }
      var r = /racers=(\d+)/.exec(qs); if (r) settings.racers = parseInt(r[1], 10);
      if (/fast/.test(qs)) { settings.quality = 'low'; applyQuality(); renderer.setPixelRatio(0.5); window.__renderSkip = 8; }
      if (/manual/.test(qs)) window.__manual = true;
      if (/speed/.test(qs)) settings.mode = 'speed';
      var mq = /mode=(mixed|speed|item)/.exec(qs); if (mq) settings.mode = mq[1];
      var chq = /char=([a-z]+)/.exec(qs); if (chq) settings.char = chq[1];
      var ptq = /pet=([a-z]*)/.exec(qs); if (ptq) settings.pet = ptq[1] || null;
      var ktq = /kart=([a-z0-9]+)/.exec(qs); if (ktq) settings.kart = ktq[1];
      if (/garage/.test(qs)) { setTimeout(openGarage, 300); }
      var on = /online=(host|join)/.exec(qs), room = /room=([A-Za-z0-9]+)/.exec(qs), nm = /name=([A-Za-z0-9]+)/.exec(qs);
      if (on) {
        window.__onlineTest = on[1];
        $('nickInput').value = nm ? nm[1] : on[1].toUpperCase();
        setTimeout(function () {
          if (on[1] === 'host') {
            createRoom(room ? room[1].toUpperCase() : undefined);
            var want = /players=(\d+)/.exec(qs), wantN = want ? parseInt(want[1], 10) : 2;
            var timer = setInterval(function () {
              if (online && online.isHost && online.net.playerCount() >= wantN) { clearInterval(timer); online.lobby.racers = 4; online.lobby.mode = settings.mode; online.net.setLobby(online.lobby); setTimeout(hostStartRace, 500); console.log('[AUTOTEST] host starting with ' + online.net.playerCount() + ' players'); }
            }, 500);
          } else if (room) joinRoom(room[1]);
        }, 800);
        console.log('[AUTOTEST] online mode ' + on[1] + ' room=' + (room ? room[1] : '?'));
      }
      if (/norender/.test(qs)) { window.__renderSkip = 1e9; }
      var st = /steps=(\d+)/.exec(qs); if (st) { window.__steps = parseInt(st[1], 10); window.__timerLoop = true; }
      document.body.classList.add('autotest');
      console.log('[AUTOTEST] init ok, track=' + trackIndex + ' racers=' + settings.racers);
      window.__dbg = { get karts() { return karts; }, get track() { return track; }, get player() { return player; }, get state() { return state; } };
      if (!on && !/garage/.test(qs)) setTimeout(function () { startRace(trackIndex); console.log('[AUTOTEST] race started'); }, 300);
    }
  }

  function applyQuality() {
    var q = settings.quality;
    var pr = q === 'low' ? 1 : (q === 'medium' ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setPixelRatio(pr);
    renderer.shadowMap.enabled = q !== 'low';
    sun.castShadow = q !== 'low';
    var size = q === 'high' ? 2048 : 1024;
    if (sun.shadow.map && sun.shadow.mapSize.x !== size) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    sun.shadow.mapSize.set(size, size);
    scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; });
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  function loadTrack(i) {
    if (track) { track.dispose(scene); items.dispose(); }
    trackIndex = i;
    track = new Track(TRACKS[i], scene, settings.quality);
    items = new ItemManager(scene, track, fx, audio);
    var th = track.theme;
    scene.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    scene.background = new THREE.Color(th.sky[1]);
    sun.color.setHex(th.sun); sun.intensity = th.sunInt;
    hemi.color.setHex(th.hemi[0]); hemi.groundColor.setHex(th.hemi[1]); hemi.intensity = th.hemiInt;
    sunDir.set(th.sunDir[0], th.sunDir[1], th.sunDir[2]).normalize();
    renderer.toneMappingExposure = th.exposure;
    buildMinimap();
    $('menuTrackName').textContent = TRACKS[i].name;
    fx.clear();
  }

  // ---------------------------------------------------------------- UI
  function showScreen(name) {
    ['menu', 'trackSelect', 'settings', 'results', 'pause', 'online', 'room', 'garage'].forEach(function (s) { $(s).classList.toggle('hidden', s !== name); });
    if (name !== 'garage' && garage.kart) destroyGaragePreview();
    $('menuChar').textContent = findChar(settings.char).name + (settings.pet && findPet(settings.pet) ? ' + ' + findPet(settings.pet).name : '') + ' · ' + findKart(settings.kart).name;
    $('hud').classList.toggle('hidden', !(name === null));
    $('vignette').classList.toggle('hidden', !(name === null));
    if (name) state = name === 'trackSelect' ? 'trackselect' : name;
    $('menuRacers').textContent = settings.racers;
    $('menuMode').textContent = modeInfo(settings.mode).label;
    $('menuModeDesc').textContent = modeInfo(settings.mode).desc;
  }

  function bindUI() {
    function click(id, fn) { $(id).addEventListener('click', function () { audio.init(); audio.ui('click'); fn(); }); }
    document.querySelectorAll('.btn').forEach(function (b) { b.addEventListener('mouseenter', function () { if (audio.ctx) audio.ui('hover'); }); });
    click('btnPlay', function () { startRace(trackIndex); });
    click('btnMode', function () { settings.mode = nextMode(settings.mode); saveSettings(); showScreen('menu'); });
    click('btnOnline', function () {
      $('nickInput').value = settings.nick || ''; $('onlineStatus').textContent = ''; showScreen('online');
      var el = $('turnStatus');
      var show = function () {
        if (Net.transport() === 'relay') { el.textContent = '연결 방식: 릴레이 서버 — 휴대폰 데이터/학교 와이파이에서도 접속 가능'; el.style.color = '#9be7ff'; return; }
        var ok = !!window.NITRO_TURN_OK; el.textContent = ok ? '연결 방식: P2P + 중계(TURN) 서버 — 휴대폰 데이터/학교망에서도 접속 가능' : '연결 방식: P2P 직접 연결 — 같은 집 와이파이/일반 가정망끼리만 연결돼요. js/config.js 참고'; el.style.color = ok ? '#9be7ff' : '#ffb86b';
      };
      if (Net.transport() === 'relay' || window.NITRO_ICE) show(); else if (window.NITRO_ICE_READY) window.NITRO_ICE_READY.then(show, show); else show();
    });
    click('btnGarage', function () { openGarage(); });
    click('btnGarageBack', function () { showScreen('menu'); });
    click('btnOnlineBack', function () { showScreen('menu'); });
    click('btnCreate', function () { createRoom(); });
    click('btnJoin', function () { joinRoom($('codeInput').value); });
    click('btnRoomLeave', function () { leaveRoom(); });
    click('btnRoomStart', function () { hostStartRace(); });
    click('btnRoomTrackPrev', function () { hostLobbyChange({ track: (online.lobby.track + TRACKS.length - 1) % TRACKS.length }); });
    click('btnRoomTrackNext', function () { hostLobbyChange({ track: (online.lobby.track + 1) % TRACKS.length }); });
    click('btnRoomMode', function () { hostLobbyChange({ mode: nextMode(online.lobby.mode) }); });
    $('roomRacers').addEventListener('change', function () { hostLobbyChange({ racers: parseInt(this.value, 10) }); });
    $('codeInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') joinRoom(this.value); });
    $('nickInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('codeInput').focus(); });
    click('btnTrack', function () { buildTrackCards(); showScreen('trackSelect'); });
    click('btnSettings', function () { syncSettingsUI(); showScreen('settings'); });
    click('btnTrackBack', function () { showScreen('menu'); });
    click('btnTrackGo', function () { startRace(trackIndex); });
    click('btnSettingsBack', function () { showScreen('menu'); });
    click('btnResume', function () { resumeRace(); });
    click('btnRestart', function () { startRace(trackIndex); });
    click('btnQuit', function () { quitToMenu(); });
    click('btnRetry', function () { if (online) { if (online.isHost) hostStartRace(); } else startRace(trackIndex); });
    click('btnNext', function () { if (online) { if (online.isHost) { online.lobby.track = (online.lobby.track + 1) % TRACKS.length; hostStartRace(); } } else startRace((trackIndex + 1) % TRACKS.length); });
    click('btnMenu', function () { quitToMenu(); });

    $('optRacers').addEventListener('change', function () { settings.racers = parseInt(this.value, 10); saveSettings(); $('menuRacers').textContent = settings.racers; });
    $('optDifficulty').addEventListener('change', function () { settings.difficulty = this.value; saveSettings(); });
    $('optQuality').addEventListener('change', function () { settings.quality = this.value; saveSettings(); applyQuality(); });
    $('optVolume').addEventListener('input', function () { settings.volume = parseFloat(this.value); audio.setVolume(settings.volume); saveSettings(); });
    $('optMusic').addEventListener('change', function () { settings.music = this.checked; saveSettings(); audio.setMusicOn(settings.music, state === 'racing' ? track.def.mood : null); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && (state === 'racing' || state === 'countdown')) pauseRace(); });
  }

  function syncSettingsUI() {
    $('optRacers').value = String(settings.racers);
    $('optDifficulty').value = settings.difficulty;
    $('optQuality').value = settings.quality;
    $('optVolume').value = settings.volume;
    $('optMusic').checked = settings.music;
  }

  function buildTrackCards() {
    var wrap = $('trackCards'); wrap.innerHTML = '';
    TRACKS.forEach(function (def, i) {
      var card = document.createElement('div'); card.className = 'card' + (i === trackIndex ? ' selected' : '');
      var cv = document.createElement('canvas'); cv.width = 400; cv.height = 170; card.appendChild(cv);
      drawTrackPreview(cv, def);
      var name = document.createElement('div'); name.className = 'name';
      name.innerHTML = def.name + ' <span class="tag ' + (def.tag === 'EXPERT' ? 'expert' : '') + '">' + def.tag + '</span>';
      var desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = def.desc;
      var meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = def.laps + ' LAPS · ' + def.theme.time;
      card.appendChild(name); card.appendChild(desc); card.appendChild(meta);
      card.addEventListener('click', function () {
        audio.init(); audio.ui('click');
        wrap.querySelectorAll('.card').forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        if (i !== trackIndex) { settings.track = i; saveSettings(); loadTrack(i); }
      });
      wrap.appendChild(card);
    });
  }

  function drawTrackPreview(cv, def) {
    var g = cv.getContext('2d'), n = def.pts.length, pts = [];
    for (var i = 0; i < n; i++) pts.push(new THREE.Vector3(def.pts[i][0], 0, def.pts[i][1]));
    var curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
    var sp = curve.getPoints(200);
    var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    sp.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
    var sc = Math.min((cv.width - 40) / (maxX - minX), (cv.height - 30) / (maxZ - minZ));
    var ox = cv.width / 2 - (minX + maxX) / 2 * sc, oy = cv.height / 2 - (minZ + maxZ) / 2 * sc;
    g.clearRect(0, 0, cv.width, cv.height);
    g.lineCap = 'round'; g.lineJoin = 'round';
    function path() { g.beginPath(); sp.forEach(function (p, i) { var x = p.x * sc + ox, y = p.z * sc + oy; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); }
    var pc = def.theme.preview;
    path(); g.strokeStyle = pc[0]; g.lineWidth = 14; g.stroke();
    path(); g.strokeStyle = pc[1]; g.lineWidth = 9; g.stroke();
    path(); g.strokeStyle = pc[2]; g.lineWidth = 1.2; g.setLineDash([4, 6]); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff'; g.fillRect(sp[0].x * sc + ox - 3, sp[0].z * sc + oy - 6, 6, 12);
  }

  // ---------------------------------------------------------------- input
  var KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'drift', ShiftLeft: 'boost', ShiftRight: 'boost', KeyE: 'item', KeyR: 'respawn' };
  function bindInput() {
    window.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) { audio.init(); return; }
      var a = KEYMAP[e.code];
      if (a) { if (!keys[a] && !e.repeat) edges[a] = true; keys[a] = true; if (state === 'racing' || state === 'countdown' || state === 'finished') e.preventDefault(); }
      if (e.code === 'Space' && state !== 'racing' && state !== 'countdown' && state !== 'finished') e.preventDefault();
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'racing' || state === 'countdown' || state === 'finished') pauseRace();
        else if (state === 'paused') resumeRace();
        else if (state === 'trackselect' || state === 'settings' || state === 'online' || state === 'garage') { audio.ui('back'); showScreen('menu'); }
        else if (state === 'room') { leaveRoom(); }
      }
      if (e.code === 'Enter') {
        if (state === 'menu' || state === 'trackselect') { audio.init(); startRace(trackIndex); }
        else if (state === 'room') { if (online && online.isHost) hostStartRace(); }
        else if (state === 'results') { audio.init(); startRace(trackIndex); }
        else if (state === 'paused') resumeRace();
      }
      audio.init();
    });
    window.addEventListener('keyup', function (e) { var a = KEYMAP[e.code]; if (a) keys[a] = false; });
    window.addEventListener('blur', function () { for (var k in keys) keys[k] = false; });
    window.addEventListener('pointerdown', function () { audio.init(); }, { once: true });
  }
  function edge(a) { var v = !!edges[a]; edges[a] = false; return v; }

  // ---------------------------------------------------------------- race setup
  function difficultySkill(rng) {
    var d = settings.difficulty;
    if (d === 'easy') return rng.range(0.55, 0.8);
    if (d === 'hard') return rng.range(0.9, 1.12);
    return rng.range(0.72, 1.0);
  }

  function aiName(i) { return AI_NAMES[i % AI_NAMES.length] + (i >= AI_NAMES.length ? ' ' + (Math.floor(i / AI_NAMES.length) + 1) : ''); }
  function addKart(k) { scene.add(k.root); if (k.petRoot) scene.add(k.petRoot); }
  function removeKart(k) { scene.remove(k.root); if (k.petRoot) scene.remove(k.petRoot); }
  function aiLook(rng) { return { char: rng.pick(CHARS).id, pet: rng() < 0.45 ? rng.pick(PETS).id : null, kart: rng.pick(KARTS).id }; }

  function startRace(ti, cfg) {
    audio.init();
    var isOnline = !!cfg;
    if (ti !== trackIndex) loadTrack(ti);
    if (!isOnline) { settings.track = ti; saveSettings(); }
    // remove old karts
    karts.forEach(removeKart);
    karts = []; ais = []; playerAI = null;
    var mode = isOnline ? cfg.mode : settings.mode;
    var n = isOnline ? Math.max(cfg.players.length, cfg.racers) : Math.max(2, settings.racers);
    var rng = U.rng(isOnline ? (cfg.seed >>> 0) : (Date.now() & 0xffff));
    var band = settings.difficulty === 'easy' ? 0.6 : (settings.difficulty === 'hard' ? 1.25 : 1);
    var list = [], i, kt;
    if (!isOnline) {
      player = new Kart({ name: 'YOU', isPlayer: true, color: 0xffd60a, accent: 0xff2e7e, index: 0, char: settings.char, pet: settings.pet, kart: settings.kart });
      for (i = 1; i < n; i++) {
        var lk = aiLook(rng);
        kt = new Kart({ name: aiName(i - 1), isPlayer: false, color: AI_COLORS[(i - 1) % AI_COLORS.length], accent: AI_ACCENTS[(i * 7) % AI_ACCENTS.length], index: i, char: lk.char, pet: lk.pet, kart: lk.kart });
        list.push(kt);
        ais.push(new AIDriver(kt, { skill: difficultySkill(rng), band: band, seed: i }));
      }
      list.push(player);
    } else {
      var isHost = online.isHost, kartById = {};
      var aiCount = n - cfg.players.length;
      for (i = 0; i < aiCount; i++) {
        var lk2 = aiLook(rng), sk = difficultySkill(rng); // consume the shared rng identically on every peer
        kt = new Kart({ name: aiName(i), isPlayer: false, remote: !isHost, netId: 100 + i, color: AI_COLORS[i % AI_COLORS.length], accent: AI_ACCENTS[(i * 7) % AI_ACCENTS.length], index: i + 1, char: lk2.char, pet: lk2.pet, kart: lk2.kart });
        list.push(kt); kartById[100 + i] = kt;
        if (isHost) ais.push(new AIDriver(kt, { skill: sk, band: 0.7, seed: i + 1 }));
      }
      cfg.players.forEach(function (p, pi) {
        var mine = p.id === online.myId;
        var pk = new Kart({ name: p.name, isPlayer: mine, remote: !mine, netId: p.id, color: PLAYER_COLORS[p.id % PLAYER_COLORS.length], accent: PLAYER_ACCENTS[p.id % PLAYER_ACCENTS.length], index: 200 + pi, char: p.char || 'volt', pet: p.pet || null, kart: p.kart || 'nitro' });
        list.push(pk); kartById[p.id] = pk;
        if (mine) player = pk;
      });
      online.kartById = kartById; online.sendTimer = 0; online.cfg = cfg; online.startAt = cfg.startAt;
      if (online.net.state !== undefined) online.net.state = 'racing';
    }
    var path = track.path, mi = modeInfo(mode);
    list.forEach(function (k, slot) {
      var g = track.gridSlot(slot, n);
      k.maxStock = mi.stock; k.gaugeMul = mi.gaugeMul;
      k.placeAt(path, g.s, g.lat);
      addKart(k);
      karts.push(k);
    });
    fx.clear(); items.clear(); items.setEnabled(mi.items);
    $('hudItem').classList.toggle('hidden', !mi.items);
    $('hudBoost').classList.toggle('hidden', !mi.gauge);
    $('tutShift').classList.toggle('hidden', !mi.gauge);
    $('tutItem').classList.toggle('hidden', !mi.items);
    $('hudMode').textContent = mi.label;
    buildPips(mi.stock);
    showTutorial();
    race.time = 0; race.raceOn = false; race.countdown = 3.8; race.cdShown = -1; race.finishedAt = null; race.allDoneAt = null; race.results = null;
    cam.init = false; cam.fov = 72;
    world = { path: path, track: track, karts: karts, player: player, items: items, itemsOn: mi.items, raceOn: false, time: 0, clock: 0, playerProgress: 0, onPlayerHit: onPlayerHit, onPlayerItem: onPlayerItem,
      net: isOnline ? online.net : null, localKarts: isOnline ? karts.filter(function (k) { return !k.remote; }) : null, sendEvent: isOnline ? sendNetEvent : null };
    if (isOnline) race.countdown = Math.max(0.5, (cfg.startAt - online.net.now()) / 1000);
    race.firstFinishAt = null;
    $('btnRetry').classList.toggle('hidden', isOnline && !online.isHost);
    $('btnNext').classList.toggle('hidden', isOnline && !online.isHost);
    $('resultsWait').classList.toggle('hidden', !(isOnline && !online.isHost));
    $('btnRestart').classList.toggle('hidden', isOnline);
    $('finishBanner').classList.add('hidden'); $('countdown').classList.remove('hidden'); $('countdown').innerHTML = '';
    $('hudLapT').textContent = track.laps; $('hudPosTotal').textContent = '/' + n;
    $('hudLap').classList.remove('final');
    $('hudBoard').innerHTML = ''; lastItemShown = null; updateItemSlot(true);
    showScreen(null); state = 'countdown';
    audio.startEngine();
    audio.startMusic(track.def.mood);
    updateCamera(0); updateShadowCamera();
  }

  function pauseRace() {
    if (online) { $('pause').classList.toggle('hidden'); return; }
    if (state === 'paused') return;
    race.prevState = state; state = 'paused';
    $('pause').classList.remove('hidden');
    if (audio.ctx) audio.ctx.suspend();
  }
  function resumeRace() {
    if (online) { $('pause').classList.add('hidden'); return; }
    if (state !== 'paused') return;
    state = race.prevState || 'racing';
    $('pause').classList.add('hidden');
    if (audio.ctx) audio.ctx.resume();
    clock.last = performance.now();
    for (var k in keys) keys[k] = false;
  }
  function quitToMenu() {
    if (online) { leaveRoom(); return; }
    if (audio.ctx) audio.ctx.resume();
    audio.stopEngine(); audio.stopMusic();
    karts.forEach(removeKart); karts = []; ais = []; player = null;
    fx.clear(); items.clear();
    $('countdown').classList.add('hidden'); $('finishBanner').classList.add('hidden');
    showScreen('menu');
  }

  function onPlayerHit(kind) {
    flash(kind === 'lightning' ? 'rgba(255,255,160,0.8)' : 'rgba(255,60,60,0.55)');
    fx.addShake(kind === 'lightning' ? 0.5 : 1.0);
    if (kind === 'lightning') showMsg('ZAPPED!', 'yellow');
  }
  function onPlayerItem(type) { showMsg(ITEMS[type].name, 'cyan'); }

  function flash(color) {
    var f = $('flash'); f.style.background = color; f.style.transition = 'none'; f.style.opacity = 1;
    requestAnimationFrame(function () { f.style.transition = 'opacity .45s'; f.style.opacity = 0; });
  }
  var msgTimer = null;
  function showMsg(text, cls) {
    var m = $('msg'); m.className = ''; m.textContent = text;
    void m.offsetWidth; m.className = 'show ' + (cls || '');
  }

  // ---------------------------------------------------------------- loop
  window.__resumeLoop = function () { window.__hold = false; loop(performance.now()); };
  function loop(now) {
    if (window.__hold) return;
    if (window.__timerLoop) { setTimeout(function () { loop(performance.now()); }, 0); }
    else requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
    var steps = window.__steps || 1;
    if (steps > 1) { dt = 1 / 60; }
    for (var i = 0; i < steps; i++) tick(dt);
    render();
  }

  function tick(dt) {
    clock.t += dt;
    if (state === 'paused') { return; }
    track.update(dt, clock.t);
    if (state === 'garage') { garageTick(dt); fx.update(dt); return; }
    if (state === 'menu' || state === 'trackselect' || state === 'settings' || state === 'results' || state === 'online' || state === 'room') {
      menuCamera(dt);
      items.update(dt, { karts: [], raceOn: false, clock: clock.t, player: null });
      if (state === 'results' && player) { stepRace(dt, true); }
      fx.update(dt);
      return;
    }
    if (state === 'countdown') {
      if (online) race.countdown = (online.startAt - online.net.now()) / 1000; else race.countdown -= dt;
      var n = Math.ceil(race.countdown);
      if (n !== race.cdShown && n <= 3) {
        race.cdShown = n;
        var cd = $('countdown');
        if (n > 0) { cd.classList.remove('go'); cd.innerHTML = '<span>' + n + '</span>'; audio.countdown(n); }
      }
      if (race.countdown <= 0) {
        state = 'racing'; race.raceOn = true; race.time = 0;
        karts.forEach(function (k) { k.lapStart = 0; });
        if (window.__autotest) race._camLog = 6;
        var cd2 = $('countdown'); cd2.classList.add('go'); cd2.innerHTML = '<span>GO!</span>'; audio.countdown(0);
        setTimeout(function () { if (state !== 'countdown') $('countdown').classList.add('hidden'); }, 1000);
      }
    }
    stepRace(dt, false);
  }

  window.__forceRender = function () { renderer.render(scene, camera); };
  var _frameNo = 0;
  function render() {
    _frameNo++;
    if (window.__renderOnce) { window.__renderOnce = false; renderer.render(scene, camera); return; }
    if (window.__renderSkip && _frameNo % window.__renderSkip !== 0) return;
    renderer.render(scene, camera);
  }

  function menuCamera(dt) {
    var a = clock.t * 0.06;
    var r = track.envelope(a);
    var tx = Math.cos(a) * (r + 110), tz = Math.sin(a) * (r + 110);
    var r2 = track.envelope(a + 0.5);
    var ly = 6, lx = Math.cos(a + 0.5) * r2 * 0.8, lz = Math.sin(a + 0.5) * r2 * 0.8;
    _v.set(tx, 48 + Math.sin(clock.t * 0.3) * 8, tz);
    if (!cam.init) { camera.position.copy(_v); cam.look.set(lx, ly, lz); cam.init = true; }
    camera.position.lerp(_v, 1 - Math.exp(-2 * dt));
    cam.look.lerp(_v2.set(lx, ly, lz), 1 - Math.exp(-2 * dt));
    camera.lookAt(cam.look);
    cam.fov = U.damp(cam.fov, 60, 3, dt); camera.fov = cam.fov; camera.updateProjectionMatrix();
    if (player) { player.root.visible = false; }
    updateShadowCamera();
  }

  // ---------------------------------------------------------------- race step
  function stepRace(dt, background) {
    var path = track.path, L = path.length;
    if (race.raceOn && !background) race.time = online ? Math.max(0, online.net.now() - online.startAt) : race.time + dt * 1000;
    world.raceOn = race.raceOn; world.time = race.time; world.clock = clock.t; world.playerProgress = player.progress(L);
    if (background) { world.raceOn = false; }

    // player input
    var inp = player.input;
    if (window.__autotest && !background) {
      race._logT = (race._logT || 0) + dt;
      if (race._logT > 2) {
        race._logT = 0;
        var dr = 0, bo = 0; for (var q = 0; q < karts.length; q++) { if (karts[q].drifting) dr++; if (karts[q].boostTime > 0) bo++; }
        var remoteInfo = online ? ' net=' + (online.isHost ? 'host' : 'client') + ' rtt=' + online.net.rtt.toFixed(0) + ' remote=' + karts.filter(function (k) { return k.remote; }).map(function (k) { return k.netId + ':' + k.speed.toFixed(0) + ':' + (k.netInit ? 'ok' : '-'); }).join(',') : '';
        console.log('[AUTOTEST]' + remoteInfo + ' drifting=' + dr + ' boosting=' + bo + ' traps=' + items.traps.length + ' rockets=' + items.rockets.length + ' t=' + (race.time / 1000).toFixed(1) + 's state=' + state + ' rank=' + player.rank + '/' + karts.length + ' lap=' + player.lapsCompleted + ' cp=' + player.cpPassed + ' speed=' + player.speed.toFixed(1) + ' s=' + player.s.toFixed(0) + ' lat=' + player.lat.toFixed(1) + ' drift=' + player.drifting + ' gauge=' + player.boostGauge.toFixed(2) + '/' + player.boostStock + ' minL=' + track.minLat[player.idx].toFixed(1) + ' maxL=' + track.maxLat[player.idx].toFixed(1) + ' item=' + player.item + ' fps=' + (1 / dt).toFixed(0) + ' calls=' + renderer.info.render.calls + ' tris=' + renderer.info.render.triangles);
      }
    }
    if (!player.finished && !background && (!window.__autotest || window.__manual)) {
      // steer > 0 turns toward +R (which is the kart's left in three.js' right-handed frame)
      var target = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      var rate = target !== 0 ? 7 : 14;
      if (inp.steer < target) inp.steer = Math.min(target, inp.steer + rate * dt);
      else if (inp.steer > target) inp.steer = Math.max(target, inp.steer - rate * dt);
      inp.throttle = keys.up ? 1 : 0; inp.brake = keys.down ? 1 : 0;
      inp.drift = !!keys.drift;
      inp.boost = edge('boost');
      inp.respawn = edge('respawn');
      if (edge('item')) { if (items.use(player, world)) { updateItemSlot(); } }
    } else {
      if (!playerAI) { playerAI = new AIDriver(player, { skill: 0.9, band: 0, seed: 99 }); }
      playerAI.update(dt, world);
      edges = {};
    }
    if (player.boostStock > 0 && inp.boost === false && keys.boost && !player.finished) inp.boost = true; // holding shift also fires when a boost becomes ready

    // AI
    for (var i = 0; i < ais.length; i++) ais[i].update(dt, world);

    // physics
    for (i = 0; i < karts.length; i++) karts[i].update(dt, world);
    resolveCollisions(dt);
    items.update(dt, world);
    if (online && !background) netTick(dt);
    processEvents(dt);
    continuousFX(dt);
    computeRanks();
    if (!background) updateCamera(dt);
    if (race._camLog > 0) { race._camLog--; console.log('[AUTOTEST] camdist after GO: ' + camDist(player.pos).toFixed(1) + 'm fov=' + cam.fov.toFixed(0)); }
    for (i = 0; i < karts.length; i++) karts[i].updateVisual(dt, clock.t);
    if (!background) { updateShadowCamera(); updateHUD(dt); }
    fx.update(dt);
    updateAudio(dt);
    shadowTimer -= dt;
    if (shadowTimer <= 0) { shadowTimer = 0.5; updateKartShadows(); }
    if (!background) checkFinish();
  }

  function resolveCollisions(dt) {
    var n = karts.length, R = Kart.PARAMS.radius * 2 * 0.95;
    for (var i = 0; i < n; i++) {
      var a = karts[i];
      for (var j = i + 1; j < n; j++) {
        var b = karts[j];
        var dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z;
        var d2 = dx * dx + dz * dz;
        if (d2 > R * R || d2 < 1e-6) continue;
        if (Math.abs(a.pos.y - b.pos.y) > 2.0) continue;
        var aL = !a.remote, bL = !b.remote;
        if (!aL && !bL) continue; // both simulated elsewhere
        var d = Math.sqrt(d2), nx = dx / d, nz = dz / d, overlap = R - d;
        var fa = aL ? (bL ? 0.5 : 1) : 0, fb = bL ? (aL ? 0.5 : 1) : 0;
        a.pos.x += nx * overlap * fa; a.pos.z += nz * overlap * fa;
        b.pos.x -= nx * overlap * fb; b.pos.z -= nz * overlap * fb;
        var rvx = a.vel.x - b.vel.x, rvz = a.vel.z - b.vel.z;
        var vn = rvx * nx + rvz * nz;
        if (vn < 0) {
          var e = 0.45, jimp = -(1 + e) * vn * 0.5;
          // heavier hit for the boosting kart
          var wa = a.boostTime > 0 ? 0.35 : 0.5, wb = 1 - wa;
          var ka = aL ? (bL ? 2 * wb : 2) : 0, kb = bL ? (aL ? 2 * wa : 2) : 0;
          a.vel.x += nx * jimp * ka; a.vel.z += nz * jimp * ka;
          b.vel.x -= nx * jimp * kb; b.vel.z -= nz * jimp * kb;
          var strength = -vn;
          if (strength > 4 && (a.hitCooldown <= 0 || b.hitCooldown <= 0)) {
            a.hitCooldown = b.hitCooldown = 0.2;
            _v.set((a.pos.x + b.pos.x) / 2, a.pos.y + 0.5, (a.pos.z + b.pos.z) / 2);
            if (camDist(_v) < 90) fx.sparks(_v, Math.min(20, 4 + strength), 0xffd080, 6 + strength * 0.4);
            if (a.isPlayer || b.isPlayer) { audio.hit(strength / 14); fx.addShake(Math.min(0.8, strength / 18)); }
            else if (camDist(_v) < 40) audio.hit(strength / 30);
          }
        }
        // slight side push (tangential) so karts do not stick
        if (aL) { a.vel.x += nx * 0.4; a.vel.z += nz * 0.4; }
        if (bL) { b.vel.x -= nx * 0.4; b.vel.z -= nz * 0.4; }
      }
    }
  }

  function camDist(p) { return camera.position.distanceTo(p); }

  function processEvents(dt) {
    for (var i = 0; i < karts.length; i++) {
      var k = karts[i], ev = k.events;
      if (!ev.length) continue;
      var near = camDist(k.pos) < 80, isP = k.isPlayer;
      for (var e = 0; e < ev.length; e++) {
        var x = ev[e];
        switch (x.type) {
          case 'driftTier':
            if (isP) { audio.driftTier(x.tier); if (x.tier === 2) showMsg('DRIFT LV.2', 'orange'); else if (x.tier === 3) showMsg('MAX CHARGE!', 'purple'); }
            break;
          case 'stock':
            if (isP) { audio.shield(); showMsg('BOOST READY · SHIFT', 'yellow'); }
            break;
          case 'driftBoost':
            if (isP) { audio.boost(x.tier); showMsg(['', 'DRIFT BOOST!', 'SUPER DRIFT!', 'ULTRA DRIFT!'][x.tier], ['', 'cyan', 'orange', 'purple'][x.tier]); fx.addShake(0.15 * x.tier); if (tutorialTimer > 0) tutorialTimer = Math.min(tutorialTimer, 1.5); }
            else if (near) audio.boost(x.tier);
            break;
          case 'boost':
            if (x.kind === 'gauge') { if (isP) { audio.boost(3); showMsg('BOOST!', 'yellow'); fx.addShake(0.3); } else if (near) audio.boost(2); }
            else if (x.kind === 'item') { if (isP) showMsg('SPEED BOOST!', 'orange'); }
            break;
          case 'pad':
            if (isP) { audio.boost(1); } else if (near) audio.boost(1);
            break;
          case 'wall':
            if (near) { k.rightVec(_v2); _v.copy(k.pos).addScaledVector(_v2, x.side * 0.9); _v.y += 0.4; fx.sparks(_v, 6 + Math.min(14, x.impact), 0xffcc66, 5 + x.impact * 0.3); }
            if (isP) { audio.hit(x.impact / 16); fx.addShake(Math.min(0.9, x.impact / 20)); } else if (near) audio.hit(x.impact / 40);
            break;
          case 'scrape':
            if (near && Math.random() < 0.5) { k.rightVec(_v2); _v.copy(k.pos).addScaledVector(_v2, x.side * 0.9); _v.y += 0.3; fx.sparks(_v, 2, 0xffcc66, 4); }
            if (isP) audio.scrape();
            break;
          case 'lap':
            if (isP) {
              audio.lap();
              if (x.lap === track.laps - 1) { showMsg('FINAL LAP!', 'pink'); $('hudLap').classList.add('final'); }
              else showMsg('LAP ' + (x.lap + 1), 'cyan');
            }
            break;
          case 'finish':
            if (isP) { onPlayerFinish(); }
            break;
          case 'spin':
            if (near) { fx.explosion(k.pos, false); }
            if (isP) { audio.spin(); flash('rgba(255,80,80,0.5)'); fx.addShake(1); showMsg('SPIN OUT!', 'pink'); } else if (near) audio.spin();
            break;
          case 'stun':
            if (isP) { audio.zap(); }
            break;
          case 'shieldBreak':
            if (isP || near) { audio.shield(); fx.sparks(k.pos, 20, 0x66ccff, 10); if (isP) showMsg('SHIELD BROKEN', 'cyan'); }
            break;
          case 'respawn':
            if (isP) { audio.respawn(); flash('rgba(120,200,255,0.5)'); }
            break;
          case 'land':
            if (x.impact > 6 && near) { _v.copy(k.pos); fx.dust(_v, k.vel); fx.dust(_v, k.vel); if (isP) fx.addShake(Math.min(0.5, x.impact / 30)); }
            break;
          case 'jump':
            if (isP) fx.addShake(0.1);
            break;
        }
      }
    }
  }

  function continuousFX(dt) {
    var tex;
    for (var i = 0; i < karts.length; i++) {
      var k = karts[i];
      var dist = camDist(k.pos);
      if (dist > 110) { if (k.drifting) { fx.skid.end('k' + i + 'l'); fx.skid.end('k' + i + 'r'); } continue; }
      var close = dist < 60;
      k.forward(_v3); k.rightVec(_v4);
      var skidding = (k.drifting || (k.accVis < -25 && k.speed > 8)) && !k.airborne && !k.offroad;
      if (skidding) {
        for (var w = 0; w < 2; w++) {
          k.wheelWorld(2 + w, _v);
          _v.y = k.pos.y + 0.02;
          var lx = _v.x - _v4.x * 0.16, lz = _v.z - _v4.z * 0.16, rx = _v.x + _v4.x * 0.16, rz = _v.z + _v4.z * 0.16;
          fx.skid.add('k' + i + (w ? 'r' : 'l'), lx, _v.y, lz, rx, _v.y, rz, k.drifting ? 0.55 : 0.35);
          if (close && (Math.random() < 0.7 || k.drifting)) fx.tireSmoke(_v, k.vel, k.drifting ? 1 : 0.5, track.theme.mood === 'neon' ? 0xbbbbdd : 0xffffff);
        }
        if (k.drifting && k.driftTier > 0 && close) {
          // sparks from the outer rear wheel
          var outer = k.driftDir > 0 ? 2 : 3;
          k.wheelWorld(outer, _v); _v.y = k.pos.y + 0.1;
          _v2.copy(_v4).multiplyScalar(-k.driftDir);
          fx.driftSpark(_v, k.driftTier, _v2);
        }
      } else { fx.skid.end('k' + i + 'l'); fx.skid.end('k' + i + 'r'); }
      if (k.offroad && k.speed > 5 && !k.airborne && close && Math.random() < 0.6) {
        k.wheelWorld(2 + (Math.random() < 0.5 ? 0 : 1), _v); fx.dust(_v, k.vel);
      }
      if (k.boostTime > 0 && dist < 120) {
        _v2.copy(_v3).negate();
        for (var ex = 0; ex < 2; ex++) { k.exhaustWorld(ex, _v); fx.boostFlame(_v, _v2, 0.8 + (k.boostMul - 1) * 1.5, k.boostKind === 'item' ? 0xff5a2a : 0xffa640); }
      }
    }
  }

  function computeRanks() {
    var L = track.path.length;
    var sorted = karts.slice().sort(function (a, b) {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1; if (b.finished) return 1;
      return b.progress(L) - a.progress(L);
    });
    for (var i = 0; i < sorted.length; i++) sorted[i].rank = i + 1;
    race.sorted = sorted;
  }

  function updateKartShadows() {
    var many = karts.length > 12;
    for (var i = 0; i < karts.length; i++) {
      var k = karts[i];
      var on = !many || k.isPlayer || camDist(k.pos) < 55;
      if (k._shadowOn === on) continue;
      k._shadowOn = on;
      k.root.traverse(function (o) { if (o.isMesh) o.castShadow = on; });
    }
  }

  // ---------------------------------------------------------------- camera
  function updateCamera(dt) {
    var k = player;
    k.root.visible = true;
    var groundHint = k.idx;
    if (state === 'countdown') {
      // slow sway behind the kart so the whole grid is in view (never inside another kart)
      var a = k.yaw + Math.PI + Math.sin(clock.t * 0.7) * 0.5;
      _v.set(k.pos.x + Math.sin(a) * 7.5, k.pos.y + 3.0, k.pos.z + Math.cos(a) * 7.5);
      if (!cam.init) { camera.position.copy(_v); cam.look.copy(k.pos); cam.init = true; }
      camera.position.lerp(_v, 1 - Math.exp(-3 * dt));
      cam.pos.copy(camera.position); // so the chase camera takes over from here at GO instead of jumping
      k.forward(_v3);
      cam.look.lerp(_v2.copy(k.pos).addScaledVector(_v3, 4).setY(k.pos.y + 1), 1 - Math.exp(-5 * dt));
      camera.lookAt(cam.look);
      cam.fov = U.damp(cam.fov, 64, 3, dt); camera.fov = cam.fov; camera.updateProjectionMatrix();
      return;
    }
    k.forward(_v3);
    var dir = _v2.copy(_v3);
    if (k.speed > 3 && k.vf > 0) { _v4.copy(k.vel).normalize(); dir.lerp(_v4, 0.45).normalize(); }
    var boost = k.boostTime > 0;
    var dist = 7.0 + k.speed * 0.04 + (boost ? 1.0 : 0), h = 2.9 + k.speed * 0.012;
    _v.copy(k.pos).addScaledVector(dir, -dist); _v.y = k.pos.y + h;
    if (k.drifting) { _v4.set(dir.z, 0, -dir.x); _v.addScaledVector(_v4, -k.driftDir * 1.4); }
    if (!cam.init) { cam.pos.copy(_v); cam.look.copy(k.pos); cam.init = true; camera.position.copy(_v); }
    var kk = 1 - Math.exp(-(k.spinTime > 0 ? 2.5 : 7) * dt);
    cam.pos.lerp(_v, kk);
    // keep the camera above the road surface
    var pr = track.path.project(cam.pos, groundHint, cam.proj || (cam.proj = {}));
    // ...and inside the road corridor so it never clips through rails, tunnels or stands
    var latMin = track.minLat[pr.idx] - 1.0, latMax = track.maxLat[pr.idx] + 1.0;
    if (pr.lat < latMin) { cam.pos.addScaledVector(pr.right, latMin - pr.lat); pr.lat = latMin; }
    else if (pr.lat > latMax) { cam.pos.addScaledVector(pr.right, latMax - pr.lat); pr.lat = latMax; }
    var gy = track.groundY(pr.idx, U.clamp(pr.lat, track.minLat[pr.idx], track.maxLat[pr.idx]), pr.right, pr.center) + 1.2;
    if (cam.pos.y < gy) cam.pos.y = gy;
    camera.position.copy(cam.pos);
    if (fx.shake > 0) { var s = fx.shake * 0.25; camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s; camera.position.z += (Math.random() - 0.5) * s; }
    _v4.copy(k.pos).addScaledVector(_v3, 5.5); _v4.y += 1.1;
    cam.look.lerp(_v4, 1 - Math.exp(-12 * dt));
    camera.lookAt(cam.look);
    var targetFov = 72 + k.speed * 0.14 + (boost ? 13 : 0) + (k.drifting ? 3 : 0);
    cam.fov = U.damp(cam.fov, targetFov, 5, dt); camera.fov = cam.fov; camera.updateProjectionMatrix();
  }

  function updateShadowCamera() {
    var c = player && state !== 'menu' && state !== 'trackselect' && state !== 'settings' && state !== 'results' ? player.pos : cam.look;
    sun.position.copy(c).addScaledVector(sunDir, 160);
    sun.target.position.copy(c); sun.target.updateMatrixWorld();
  }

  // ---------------------------------------------------------------- HUD
  var hudEls = null;
  function updateHUD(dt) {
    if (!hudEls) hudEls = { pos: $('hudPos'), sfx: $('hudPosSfx'), lapN: $('hudLapN'), time: $('hudTime'), lapTime: $('hudLapTime'), best: $('hudBest'), speed: $('hudSpeed'), arc: $('spdArc'), bfill: $('boostFill'), bbar: $('boostBar'), bpct: $('boostPct'), bready: $('boostReady'), dbar: $('driftBar'), dfill: $('driftFill'), dlabel: $('driftLabel'), pips: $('boostPips'), ww: $('wrongWay'), sl: $('speedlines'), board: $('hudBoard'), tut: $('tutorial') };
    var H = hudEls, k = player;
    var rank = k.rank;
    H.pos.textContent = rank; H.sfx.textContent = U.ordinal(rank).replace(String(rank), '');
    H.lapN.textContent = Math.min(k.lapsCompleted + 1, track.laps);
    H.time.textContent = U.fmtTime(race.time);
    H.lapTime.textContent = U.fmtTime(k.finished ? (k.lapTimes[k.lapTimes.length - 1] || 0) : race.time - k.lapStart);
    var best = k.lapTimes.length ? Math.min.apply(null, k.lapTimes) : null;
    H.best.textContent = U.fmtTime(best);
    var kmh = Math.round(k.speed * 4.2);
    H.speed.textContent = kmh;
    var frac = U.clamp(kmh / 300, 0, 1);
    H.arc.style.strokeDashoffset = 400 - 400 * frac * 0.667;
    // boost
    var g = k.boostGauge;
    H.bfill.style.width = (g * 100).toFixed(1) + '%';
    H.bpct.textContent = Math.round(g * 100) + '%' + (k.maxStock > 1 ? ' · ' + k.boostStock + '/' + k.maxStock : '');
    var ready = k.boostStock > 0;
    H.bbar.classList.toggle('full', ready); H.bready.classList.toggle('on', ready);
    var pips = H.pips.children;
    for (var pi = 0; pi < pips.length; pi++) pips[pi].classList.toggle('lit', pi < k.boostStock);
    // drift meter
    var tt = Kart.PARAMS.driftTierTimes;
    H.dbar.className = 'drift' + (k.drifting ? ' on' : '') + (k.driftTier >= 2 ? ' t' + k.driftTier : '');
    H.dfill.style.width = (U.clamp(k.driftCharge / (tt[2] + 0.2), 0, 1) * 100).toFixed(1) + '%';
    H.dlabel.textContent = k.drifting ? (k.driftTier > 0 ? 'DRIFT LV.' + k.driftTier + (k.driftTier === 3 ? ' MAX' : '') : 'DRIFT') : '';
    if (tutorialTimer > 0) { tutorialTimer -= dt; if (tutorialTimer <= 0) H.tut.classList.add('hidden'); }
    H.ww.classList.toggle('hidden', !(k.wrongWay > 0.8));
    // speed lines
    var slOp = k.boostTime > 0 ? 0.95 : U.clamp((k.speed - 32) / 25, 0, 0.5);
    H.sl.style.opacity = slOp.toFixed(2);
    // item slot
    updateItemSlot();
    // board
    boardTimer -= dt;
    if (boardTimer <= 0) { boardTimer = 0.3; updateBoard(); }
    drawMinimap();
  }

  // ---------------------------------------------------------------- online
  function nickName() {
    var v = ($('nickInput').value || '').trim().slice(0, 12) || ('RACER' + Math.floor(Math.random() * 90 + 10));
    settings.nick = v; saveSettings();
    return v;
  }
  function onlineStatus(msg, err) { var el = $('onlineStatus'); el.textContent = msg; el.style.color = err ? '#ff8a8a' : '#9be7ff'; }
  function netErrorText(e) {
    var t = (e && (e.type || e.message)) || '';
    if (/peer-unavailable|noroom/.test(t)) return '그 코드의 방이 없어요. 코드 오타이거나 방장이 방을 닫았어요 (방장 화면이 ROOM 화면에 떠 있어야 해요).';
    if (/taken/.test(t)) return '이 방 코드는 이미 사용 중이에요. 다시 만들어주세요.';
    if (/server-timeout|^server$|relay-closed/.test(t)) return '릴레이 서버에 연결할 수 없어요. 인터넷/방화벽을 확인하고 다시 시도하세요. (' + t + ')';
    if (/timeout/.test(t)) return '방은 찾았지만 P2P 직접 연결이 안 됐어요 (ICE: ' + (e.ice || '?') + '). 휴대폰 데이터·학교 와이파이처럼 직접 연결을 막는 망일 수 있어요. 둘 다 집 와이파이(PC)로 다시 시도해보세요.';
    if (/closed/.test(t)) return '방장과의 연결이 끊겼어요.';
    if (/full/.test(t)) return '방이 가득 찼어요 (최대 8명).';
    if (/inrace/.test(t)) return '이미 레이스가 진행 중인 방이에요.';
    if (/unavailable-id/.test(t)) return '이 방 코드는 방금 사용됐어요. 다시 만들어주세요.';
    if (/network|server|socket|browser-incompatible|ssl/.test(t)) return '접속 서버(PeerJS)에 연결할 수 없어요. 인터넷/방화벽을 확인하세요. (' + t + ')';
    return '연결 실패: ' + t;
  }
  function profile() { return { name: nickName(), char: settings.char, pet: settings.pet, kart: settings.kart }; }
  function bindNet(net) {
    net.on('players', function () { renderRoom(); });
    net.on('lobby', function (lobby) { if (online) { online.lobby = lobby; renderRoom(); } });
    net.on('msg', onNetMsg);
    net.on('leave', function (id) { onPlayerLeave(id); });
    net.on('hostLeft', function () { leaveRoom('방장이 나갔어요.'); });
    net.on('error', function (e) { console.warn('net error', e); });
    net.on('stage', function (s) {
      var relay = Net.transport() === 'relay';
      if (s === 'signaling') onlineStatus(relay ? '릴레이 서버에 연결 중...' : '접속 서버에 연결 중...');
      else if (s === 'connecting') onlineStatus(relay ? '방을 확인하는 중...' : '방을 찾았어요. 방장과 P2P 연결 중... (최대 20초)');
      else if (s === 'open') onlineStatus('연결됨!');
    });
  }
  function createRoom(forcedCode) {
    if (Net.transport() === 'p2p' && typeof Peer === 'undefined') { onlineStatus('PeerJS 라이브러리를 불러오지 못했어요.', true); return; }
    var prof = profile();
    onlineStatus('방 만드는 중...');
    var net = new Net();
    online = { net: net, isHost: true, myId: 0, lobby: { track: trackIndex, mode: settings.mode, racers: 8 }, kartById: null, sendTimer: 0 };
    bindNet(net);
    net.host(prof, function (err, code) {
      if (err) { onlineStatus(netErrorText(err), true); net.close(); online = null; if (window.__autotest) console.log('[AUTOTEST] host error ' + (err.type || err.message)); return; }
      net.setLobby(online.lobby);
      showScreen('room'); renderRoom();
      if (window.__autotest) console.log('[AUTOTEST] room created ' + code);
    }, forcedCode);
  }
  function joinRoom(code) {
    code = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { onlineStatus('4자리 방 코드를 입력하세요.', true); return; }
    if (Net.transport() === 'p2p' && typeof Peer === 'undefined') { onlineStatus('PeerJS 라이브러리를 불러오지 못했어요.', true); return; }
    var prof = profile();
    onlineStatus('방 ' + code + ' 에 접속 중...');
    var net = new Net();
    online = { net: net, isHost: false, myId: null, lobby: null, kartById: null, sendTimer: 0 };
    bindNet(net);
    net.join(code, prof, function (err, welcome) {
      if (err) { onlineStatus(netErrorText(err), true); net.close(); if (online && online.net === net) online = null; if (window.__autotest) console.log('[AUTOTEST] join error ' + (err.type || err.message)); return; }
      online.myId = welcome.id; online.lobby = welcome.lobby || { track: 0, mode: 'item', racers: 8 };
      showScreen('room'); renderRoom();
      if (window.__autotest) console.log('[AUTOTEST] joined as id ' + welcome.id + ' players=' + welcome.players.length);
    });
  }
  function leaveRoom(reason) {
    var wasOnline = !!online;
    if (online) { try { online.net.close(); } catch (e) { } online = null; }
    if (audio.ctx) audio.ctx.resume();
    audio.stopEngine(); audio.stopMusic();
    karts.forEach(removeKart); karts = []; ais = []; player = null;
    fx.clear(); items.clear(); items.setRemoteRockets([]);
    $('countdown').classList.add('hidden'); $('finishBanner').classList.add('hidden'); $('pause').classList.add('hidden');
    if (wasOnline && reason) { showScreen('online'); onlineStatus(reason, true); }
    else showScreen('menu');
  }
  function hostLobbyChange(patch) {
    if (!online || !online.isHost) return;
    for (var k in patch) online.lobby[k] = patch[k];
    online.net.setLobby(online.lobby);
    renderRoom();
  }
  function renderRoom() {
    if (!online) return;
    if (window.__autotest) console.log('[AUTOTEST] room players=' + online.net.playerList().map(function (p) { return p.id + ':' + p.name; }).join(',') + ' lobby=' + JSON.stringify(online.lobby));
    var net = online.net, lobby = online.lobby || { track: 0, mode: 'item', racers: 8 };
    $('roomCode').textContent = net.code || '----';
    var list = net.playerList(), html = '';
    list.forEach(function (p) {
      var col = '#' + PLAYER_COLORS[p.id % PLAYER_COLORS.length].toString(16).padStart(6, '0');
      var look = findChar(p.char || 'volt').name + (p.pet && findPet(p.pet) ? ' · ' + findPet(p.pet).name : '') + ' · ' + findKart(p.kart || 'nitro').name;
      html += '<div class="prow' + (p.id === online.myId ? ' me' : '') + '"><span class="chip" style="background:' + col + ';color:' + col + '"></span><span>' + p.name + '</span><span class="look">' + look + '</span>' + (p.id === 0 ? '<span class="tag">HOST</span>' : '') + (p.id === online.myId ? '<span class="you">YOU</span>' : '') + '</div>';
    });
    for (var i = list.length; i < Math.max(2, lobby.racers); i++) html += '<div class="prow dim"><span class="chip" style="background:#555"></span><span>' + (i < lobby.racers ? 'AI' : '') + '</span></div>';
    $('roomPlayers').innerHTML = html;
    $('roomTrack').textContent = TRACKS[lobby.track].name;
    $('roomTrackC').textContent = TRACKS[lobby.track].name + ' · ' + modeInfo(lobby.mode).label + ' · ' + lobby.racers + ' racers';
    $('roomMode').textContent = modeInfo(lobby.mode).label;
    $('roomRacers').value = String(lobby.racers);
    $('roomHostControls').classList.toggle('hidden', !online.isHost);
    $('roomWait').classList.toggle('hidden', online.isHost);
    $('roomCount').textContent = list.length + ' / 8';
    if (lobby.track !== trackIndex && state === 'room') loadTrack(lobby.track);
  }
  function hostStartRace() {
    if (!online || !online.isHost) return;
    var net = online.net, players = net.playerList();
    var cfg = { track: online.lobby.track, mode: online.lobby.mode, racers: Math.max(online.lobby.racers, players.length), players: players, startAt: performance.now() + 5500, seed: (Date.now() & 0x7fffffff) };
    net.state = 'racing';
    net.send({ t: 'start', cfg: cfg });
    if (window.__autotest) console.log('[AUTOTEST] host sent start ' + JSON.stringify(cfg));
    startRace(cfg.track, cfg);
  }
  function sendNetEvent(ev) {
    if (!online) return;
    var m = { t: 'e' };
    for (var k in ev) m[k] = ev[k];
    if (m.from === undefined) m.from = online.myId;
    online.net.send(m);
  }
  function netTick(dt) {
    var net = online.net;
    online.sendTimer -= dt;
    if (online.sendTimer <= 0) {
      online.sendTimer = 0.05;
      if (online.isHost) {
        var ks = karts.map(function (k) { return (k.remote && k.netTarget) ? k.netTarget : k.netState(); });
        net.send({ t: 'S', k: ks, r: items.rocketStates() });
      } else {
        var st = player.netState(); st.t = 's';
        net.send(st);
      }
    }
    if (!online.isHost) items.updateRemoteRockets(dt);
  }
  function onNetMsg(msg) {
    if (!online) return;
    var now = performance.now(), kb = online.kartById;
    switch (msg.t) {
      case 'start':
        if (window.__autotest) console.log('[AUTOTEST] client got start ' + JSON.stringify(msg.cfg));
        if (!online.isHost && msg.cfg) startRace(msg.cfg.track, msg.cfg);
        break;
      case 'S':
        if (online.isHost || !kb) break;
        for (var i = 0; i < msg.k.length; i++) { var e = msg.k[i]; if (e.id === online.myId) continue; var rk = kb[e.id]; if (rk && rk.remote) rk.applyNetState(e, now); }
        items.setRemoteRockets(msg.r);
        break;
      case 's':
        if (online.isHost && kb) { var ck = kb[msg.id]; if (ck && ck.remote) ck.applyNetState(msg, now); }
        break;
      case 'e':
        handleNetEvent(msg);
        if (online.isHost) online.net.broadcast(msg, msg.id);
        break;
      case 'results':
        if (!online.isHost && state !== 'results' && karts.length) showResults();
        break;
    }
  }
  function handleNetEvent(ev) {
    var kb = online.kartById || {};
    switch (ev.kind) {
      case 'box': items.takeBox(ev.i); break;
      case 'rocket': if (online.isHost) { var rk = kb[ev.from]; if (rk) items.spawnRocket(rk, karts); } if (player && camDist(player.pos) < 90) audio.rocket(); break;
      case 'hit': if (player && ev.id === online.myId && !player.remote) { player.spinOut(ev.src || 'rocket'); onPlayerHit(ev.src || 'rocket'); } break;
      case 'boom': _v.set(ev.x, ev.y, ev.z); fx.explosion(_v, true); if (camDist(_v) < 100) audio.explode(); break;
      case 'trap': items.addRemoteTrap(ev.tid, ev.s, ev.lat, kb[ev.owner]); break;
      case 'trapHit': items.removeTrap(ev.tid); break;
      case 'zap': items.applyZap(ev.x, ev.z, ev.p, kb[ev.from], world); if (player && camDist(player.pos) < 120) audio.zap(); break;
    }
  }
  function onPlayerLeave(id) {
    if (!online || !online.kartById) { renderRoom(); return; }
    var k = online.kartById[id];
    if (k) { removeKart(k); karts = karts.filter(function (x) { return x !== k; }); delete online.kartById[id]; world.karts = karts; world.localKarts = karts.filter(function (x) { return !x.remote; }); $('hudPosTotal').textContent = '/' + karts.length; }
    showMsg('PLAYER LEFT', 'pink');
  }

  // ---------------------------------------------------------------- garage (character & pet select)
  var garage = { kart: null, angle: 0 };
  function openGarage() {
    buildGarageCards();
    showScreen('garage');
    rebuildGaragePreview();
    cam.init = false;
  }
  function destroyGaragePreview() {
    if (garage.kart) { removeKart(garage.kart); garage.kart = null; }
  }
  function rebuildGaragePreview() {
    destroyGaragePreview();
    var k = new Kart({ name: 'YOU', isPlayer: true, color: 0xffd60a, accent: 0xff2e7e, index: 0, char: settings.char, pet: settings.pet, kart: settings.kart });
    k.placeAt(track.path, 12, 0);
    addKart(k); garage.kart = k;
  }
  function statBar(label, v) {
    var pct = U.clamp((v - 0.9) / 0.2, 0, 1) * 100;
    return '<div class="sb"><span>' + label + '</span><i><b style="width:' + pct.toFixed(0) + '%"></b></i></div>';
  }
  function buildGarageCards() {
    var ch = '', pt = '', kt = '';
    KARTS.forEach(function (k) {
      kt += '<div class="gcard kart' + (k.id === settings.kart ? ' sel' : '') + '" data-kart="' + k.id + '"><div class="gname">' + k.name + ' <small>' + k.kr + '</small></div><div class="gdesc">' + k.desc + '</div>' +
        statBar('속도', k.stat.speed) + statBar('가속', k.stat.accel) + statBar('조향', k.stat.handling) + statBar('무게', 0.9 + (k.mass - 0.85) / 0.65 * 0.2) + '</div>';
    });
    CHARS.forEach(function (c) {
      ch += '<div class="gcard' + (c.id === settings.char ? ' sel' : '') + '" data-char="' + c.id + '"><div class="gname"><i style="background:#' + c.body.toString(16).padStart(6, '0') + '"></i>' + c.name + ' <small>' + c.kr + '</small></div><div class="gdesc">' + c.desc + '</div>' +
        statBar('속도', c.stat.speed) + statBar('가속', c.stat.accel) + statBar('조향', c.stat.handling) + statBar('게이지', c.stat.gauge) + '</div>';
    });
    pt += '<div class="gcard pet' + (!settings.pet ? ' sel' : '') + '" data-pet=""><div class="gname">없음</div><div class="gdesc">펫 없이 달리기</div></div>';
    PETS.forEach(function (p) {
      pt += '<div class="gcard pet' + (p.id === settings.pet ? ' sel' : '') + '" data-pet="' + p.id + '"><div class="gname">' + p.name + ' <small>' + p.kr + '</small></div><div class="gdesc">' + p.desc + '</div></div>';
    });
    $('garageChars').innerHTML = ch; $('garagePets').innerHTML = pt; $('garageKarts').innerHTML = kt;
    $('garageKarts').querySelectorAll('.gcard').forEach(function (el) {
      el.addEventListener('click', function () { audio.init(); audio.ui('click'); settings.kart = el.getAttribute('data-kart'); saveSettings(); buildGarageCards(); rebuildGaragePreview(); });
    });
    $('garageChars').querySelectorAll('.gcard').forEach(function (el) {
      el.addEventListener('click', function () { audio.init(); audio.ui('click'); settings.char = el.getAttribute('data-char'); saveSettings(); buildGarageCards(); rebuildGaragePreview(); });
    });
    $('garagePets').querySelectorAll('.gcard').forEach(function (el) {
      el.addEventListener('click', function () { audio.init(); audio.ui('click'); settings.pet = el.getAttribute('data-pet') || null; saveSettings(); buildGarageCards(); rebuildGaragePreview(); });
    });
    var c = findChar(settings.char), p = settings.pet ? findPet(settings.pet) : null;
    $('garageTitle').textContent = findKart(settings.kart).name + ' · ' + c.name + (p ? ' & ' + p.name : '');
  }
  function garageTick(dt) {
    var k = garage.kart; if (!k) return;
    track.update(dt, clock.t);
    k.updateVisual(dt, clock.t);
    garage.angle += dt * 0.45;
    var a = garage.angle;
    _v.set(k.pos.x + Math.sin(a) * 6.2, k.pos.y + 2.1, k.pos.z + Math.cos(a) * 6.2);
    if (!cam.init) { camera.position.copy(_v); cam.look.set(k.pos.x, k.pos.y + 0.9, k.pos.z); cam.init = true; }
    camera.position.lerp(_v, 1 - Math.exp(-4 * dt));
    // frame the kart left of centre so it is not hidden behind the cards
    _v2.set(k.pos.x, k.pos.y + 0.9, k.pos.z);
    _v3.subVectors(_v2, camera.position); _v4.set(_v3.z, 0, -_v3.x).normalize();
    _v2.addScaledVector(_v4, -1.3);
    cam.look.lerp(_v2, 1 - Math.exp(-6 * dt));
    camera.lookAt(cam.look);
    cam.fov = U.damp(cam.fov, 50, 4, dt); camera.fov = cam.fov; camera.updateProjectionMatrix();
    updateShadowCamera();
    if (k.petRoot) { k.petRoot.visible = true; }
  }

  var tutorialTimer = 0;
  function showTutorial() {
    $('tutorial').classList.remove('hidden');
    tutorialTimer = 16;
  }
  function buildPips(n) {
    var el = $('boostPips'), html = '';
    for (var i = 0; i < n; i++) html += '<span class="pip"></span>';
    el.innerHTML = html;
  }

  function updateItemSlot(force) {
    var slot = $('hudItem'), icon = $('hudItemIcon'), name = $('hudItemName'), k = player;
    if (!k) return;
    if (world && world.itemsOn === false) { slot.classList.add('hidden'); return; }
    if (k.itemRoulette > 0) {
      rouletteTimer -= 1 / 60;
      if (rouletteTimer <= 0) {
        rouletteTimer = 0.07 + (1.1 - k.itemRoulette) * 0.08;
        rouletteIdx = (rouletteIdx + 1) % ITEM_ORDER.length;
        var t = ITEM_ORDER[rouletteIdx];
        icon.innerHTML = ICONS[t]; icon.style.color = ICON_COLORS[t]; name.textContent = '???';
        audio.roulette();
      }
      slot.className = 'hud-item roll'; lastItemShown = 'roll';
      return;
    }
    var it = k.item || null;
    if (it === lastItemShown && !force) return;
    lastItemShown = it;
    if (it) { icon.innerHTML = ICONS[it]; icon.style.color = ICON_COLORS[it]; name.textContent = ITEMS[it].name; slot.className = 'hud-item has'; }
    else { icon.innerHTML = ''; name.textContent = ''; slot.className = 'hud-item'; }
  }

  function updateBoard() {
    var sorted = race.sorted || karts, L = track.path.length, html = '', show = [];
    var n = sorted.length, pr = player.rank - 1;
    if (n <= 8) show = sorted;
    else {
      show = sorted.slice(0, 3);
      var lo = Math.max(3, pr - 2), hi = Math.min(n, lo + 5);
      if (lo > 3) show.push(null);
      show = show.concat(sorted.slice(lo, hi));
    }
    var pp = player.progress(L);
    for (var i = 0; i < show.length; i++) {
      var k = show[i];
      if (!k) { html += '<div class="row" style="opacity:.4;justify-content:center">···</div>'; continue; }
      var gap = k.finished ? U.fmtTime(k.finishTime) : (k.isPlayer ? '' : ((k.progress(L) - pp) >= 0 ? '+' : '') + Math.round(k.progress(L) - pp) + 'm');
      html += '<div class="row' + (k.isPlayer ? ' me' : '') + '"><span class="r">' + k.rank + '</span><span class="chip" style="background:#' + k.color.toString(16).padStart(6, '0') + ';color:#' + k.color.toString(16).padStart(6, '0') + '"></span><span>' + k.name + '</span><span class="gap">' + gap + '</span></div>';
    }
    $('hudBoard').innerHTML = html;
  }

  function buildMinimap() {
    var path = track.path, pts = [], minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (var j = 0; j < path.N; j += 4) { var p = path.P[j]; pts.push(p); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    var cv = $('minimap'), W = cv.width, Hh = cv.height;
    var sc = Math.min((W - 30) / (maxX - minX), (Hh - 30) / (maxZ - minZ));
    minimap.pts = pts; minimap.scale = sc; minimap.ox = W / 2 - (minX + maxX) / 2 * sc; minimap.oy = Hh / 2 - (minZ + maxZ) / 2 * sc;
  }

  function drawMinimap() {
    var cv = $('minimap'), g = cv.getContext('2d'), m = minimap;
    g.clearRect(0, 0, cv.width, cv.height);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (var i = 0; i < m.pts.length; i++) { var p = m.pts[i]; var x = p.x * m.scale + m.ox, y = p.z * m.scale + m.oy; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.closePath();
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 11; g.stroke();
    g.strokeStyle = track.theme.mood === 'neon' ? '#2a2d4a' : '#4a4e5a'; g.lineWidth = 7; g.stroke();
    var s0 = m.pts[0]; g.fillStyle = '#fff'; g.fillRect(s0.x * m.scale + m.ox - 2, s0.z * m.scale + m.oy - 5, 4, 10);
    for (i = 0; i < karts.length; i++) {
      var k = karts[i]; if (k.isPlayer) continue;
      g.fillStyle = '#' + k.color.toString(16).padStart(6, '0');
      g.beginPath(); g.arc(k.pos.x * m.scale + m.ox, k.pos.z * m.scale + m.oy, 3, 0, 7); g.fill();
    }
    var pl = player;
    g.fillStyle = '#ffe600'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.arc(pl.pos.x * m.scale + m.ox, pl.pos.z * m.scale + m.oy, 5, 0, 7); g.fill(); g.stroke();
  }

  function updateAudio(dt) {
    if (!player || !audio._engine) return;
    var k = player, P = Kart.PARAMS;
    var rpm = U.clamp(Math.abs(k.vf) / (P.maxSpeed * 1.3), 0, 1);
    var thr = k.input.throttle;
    rpm = rpm * 0.85 + thr * 0.15 * (1 - rpm);
    audio.updateEngine(rpm, thr, k.boostTime > 0, k.drifting ? 1 : 0, U.clamp(k.speed / 60, 0, 1), dt);
  }

  // ---------------------------------------------------------------- finish / results
  function onPlayerFinish() {
    race.finishedAt = clock.t;
    state = 'finished';
    audio.finish();
    fx.confetti(player.pos);
    var b = $('finishBanner'); b.classList.remove('hidden');
    $('finishSub').textContent = U.ordinal(player.rank).toUpperCase() + ' PLACE · ' + U.fmtTime(player.finishTime);
    flash('rgba(255,255,255,0.6)');
  }

  function checkFinish() {
    if (online) {
      var pk = karts.filter(function (k) { return k.netId >= 0 && k.netId < 100; });
      var anyP = pk.some(function (k) { return k.finished; });
      if (anyP && race.firstFinishAt === null) race.firstFinishAt = clock.t;
      if (race.firstFinishAt === null) return;
      var w = clock.t - race.firstFinishAt;
      if (online.isHost) {
        var allP = pk.every(function (k) { return k.finished; }), allK = karts.every(function (k) { return k.finished; });
        if ((allK && w > 2.2) || (allP && w > 4) || w > 30) { online.net.send({ t: 'results' }); showResults(); }
      } else if (w > 40) showResults();
      return;
    }
    if (state !== 'finished') return;
    var allDone = karts.every(function (k) { return k.finished; });
    var waited = clock.t - race.finishedAt;
    if ((allDone && waited > 2.2) || waited > 9) showResults();
  }

  function showResults() {
    var L = track.path.length;
    computeRanks();
    var sorted = race.sorted;
    var html = '<div class="rrow head"><span>Pos</span><span></span><span>Racer</span><span>Time</span><span>Best Lap</span></div>';
    sorted.forEach(function (k, i) {
      var best = k.lapTimes.length ? Math.min.apply(null, k.lapTimes) : null;
      var col = '#' + k.color.toString(16).padStart(6, '0');
      var timeStr;
      if (k.finished) timeStr = U.fmtTime(k.finishTime);
      else {
        // estimate from average pace so the board still reads like a race result
        var done = Math.max(1, k.progress(L)), remaining = track.laps * L - done;
        var pace = done / Math.max(1, race.time);
        timeStr = '<span class="dim">' + U.fmtTime(race.time + remaining / Math.max(pace, 0.008)) + ' *</span>';
      }
      html += '<div class="rrow' + (k.isPlayer ? ' me' : '') + '"><span class="rk">' + (i + 1) + '</span><span class="chip" style="background:' + col + ';color:' + col + '"></span><span>' + k.name + (k.isPlayer ? ' (YOU)' : '') + '</span><span>' + timeStr + '</span><span class="dim">' + U.fmtTime(best) + '</span></div>';
    });
    $('resultsList').innerHTML = html;
    if (window.__autotest) console.log('[AUTOTEST] RESULTS ' + sorted.map(function (k) { return k.rank + ':' + k.name + ':' + (k.finished ? U.fmtTime(k.finishTime) : 'DNF') ; }).join(' | '));
    var pr = player.rank;
    $('resultsTitle').textContent = pr === 1 ? 'VICTORY!' : (pr <= 3 ? 'PODIUM!' : 'FINISH!');
    $('resultsSub').textContent = TRACKS[trackIndex].name + ' · ' + U.ordinal(pr) + ' of ' + karts.length + ' · ' + (player.finished ? U.fmtTime(player.finishTime) : 'DNF');
    if (online && online.net.state !== undefined) online.net.state = 'lobby';
    $('btnNext').textContent = 'Next Track: ' + TRACKS[(trackIndex + 1) % TRACKS.length].name;
    $('finishBanner').classList.add('hidden');
    audio.stopEngine();
    cam.init = false;
    showScreen('results');
  }

  // ---------------------------------------------------------------- go
  window.addEventListener('error', function (e) {
    var el = $('err'); if (el) el.textContent = 'Error: ' + e.message;
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
