/* ════════════════════════════════════════════════════════
   LQSACatena — Modo Multijugador (Firebase Realtime DB)

   Flujo:
   1. Jugador A crea sala → obtiene código (ej. BNQZ-7342)
   2. Jugador B introduce el código → ambos en "setup"
   3. Ambos eligen personaje secreto → confirman "¡Listo!"
   4. Partida por turnos: preguntas y adivinanzas via Firebase
   5. El que adivina primero (o el que no falla) gana
   ════════════════════════════════════════════════════════ */

let _db = null;
let _roomRef = null;
let _roomCode = null;
let _myRole = null;   // 'host' | 'guest'
let _actionSeq = 0;
let _lastApplied = 0;      // seq del último action aplicado al tablero
let _onlineStatsSaved = false;

// ── Firebase init ─────────────────────────────────────
function _fbInit() {
  if (typeof firebase === 'undefined') {
    alert('Firebase no está disponible. ¿Has configurado firebase-config.js?');
    return false;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  _db = firebase.database();
  return true;
}

// ── Limpiar estado online ─────────────────────────────
function cleanupOnlineRoom() {
  if (_roomRef) { _roomRef.off(); _roomRef = null; }
  _roomCode = null;
  window._roomCode = null;
  _myRole = null;
  _actionSeq = 0;
  _lastApplied = 0;
  localStorage.removeItem('activeOnlineRoomCode');
  if (typeof _onlineKnownDisconnected !== 'undefined') {
    _onlineKnownDisconnected.clear();
  }
  if (typeof _destroyRoomChat === 'function') {
    _destroyRoomChat();
  }
}

// ── Código de sala ────────────────────────────────────
function _genCode() {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const N = '23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)];
  c += '-';
  for (let i = 0; i < 4; i++) c += N[Math.floor(Math.random() * N.length)];
  return c;
}

// ── UI overlays ───────────────────────────────────────
function showModeOverlay() {
  document.getElementById('quien-mode-overlay').style.display = 'flex';
}
function hideModeOverlay() {
  document.getElementById('quien-mode-overlay').style.display = 'none';
}
function showLobbyOverlay(err) {
  document.getElementById('quien-online-lobby').style.display = 'flex';
  if (err) document.getElementById('quien-lobby-error').textContent = err;
  else document.getElementById('quien-lobby-error').textContent = '';
  _loadActiveOnlineRooms();
}
function hideLobbyOverlay() {
  document.getElementById('quien-online-lobby').style.display = 'none';
}

// ── Salas online activas ───────────────────────────────
async function _loadActiveOnlineRooms() {
  const container = document.getElementById('online-rooms-list');
  if (!container) return;
  if (!_fbInit()) return;

  container.innerHTML = `<p style="text-align:center;color:var(--text2);font-size:0.8rem;margin:8px 0">Buscando salas...</p>`;

  try {
    const snap = await _db.ref('rooms').orderByChild('created').limitToLast(30).once('value');
    if (!snap.exists()) { container.innerHTML = ''; return; }

    const now = Date.now();
    const rooms = [];
    snap.forEach(child => {
      const d = child.val();
      if (d.phase === 'finished') return;
      if (now - (d.created || 0) > 4 * 60 * 60 * 1000) return;

      // Comprobar que al menos un jugador siga conectado
      const hostConnected = !d.hostDisconnected;
      const guestConnected = d.guestUid && !d.guestDisconnected;
      if (!hostConnected && !guestConnected) return; // sala fantasma

      rooms.push({ code: child.key, ...d });
    });

    if (rooms.length === 0) { container.innerHTML = ''; return; }

    // Ordenar: salas en espera primero, luego las más recientes
    rooms.sort((a, b) => {
      if (a.phase === 'waiting' && b.phase !== 'waiting') return -1;
      if (b.phase === 'waiting' && a.phase !== 'waiting') return 1;
      return (b.created || 0) - (a.created || 0);
    });

    // Deduplicar: si un mismo UID aparece en varias salas, conservar solo la más reciente
    const seenUids = new Set();
    const dedupedRooms = [];
    for (const r of rooms) {
      const uids = [r.hostUid, r.guestUid].filter(Boolean);
      if (uids.some(uid => !seenUids.has(uid))) {
        dedupedRooms.push(r);
        uids.forEach(uid => seenUids.add(uid));
      }
    }

    if (dedupedRooms.length === 0) { container.innerHTML = ''; return; }

    const myUid = localStorage.getItem('lqsa_user');

    const html = dedupedRooms.map(r => {
      const code = r.code.slice(0, 4) + '-' + r.code.slice(4);
      const isWaiting = r.phase === 'waiting';
      const hostName = r.hostName || 'Anónimo';
      const guestName = r.guestName || null;
      const avatarSrc = r.hostAvatar || 'img/personajes/amador-rivas.webp';

      const players = [
        `<span style="font-weight:700;color:var(--text)">👑 ${hostName}</span>`,
        guestName ? `<span style="color:var(--text2)">👤 ${guestName}</span>` : null
      ].filter(Boolean).join(' <span style="color:var(--text2);opacity:0.5">vs</span> ');

      const statusBadge = isWaiting
        ? `<span style="background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.4);color:#4ade80;border-radius:50px;padding:2px 8px;font-size:0.7rem;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px">ABIERTA</span>`
        : `<span style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;border-radius:50px;padding:2px 8px;font-size:0.7rem;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px">EN JUEGO</span>`;

      // Determinar botón acción
      const iAmInRoom = myUid && (myUid === r.hostUid || myUid === r.guestUid);
      let joinBtn = '';
      if (iAmInRoom) {
        // Ya estaba en la sala: ofrecer reconectar
        joinBtn = `<button onclick="localStorage.setItem('activeOnlineRoomCode','${r.code}');hideLobbyOverlay();reconnectActiveOnlineGame()" style="background:rgba(240,192,32,0.2);color:var(--accent);border:1px solid rgba(240,192,32,0.5);border-radius:6px;padding:5px 12px;font-size:0.78rem;font-weight:bold;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;transition:opacity 0.15s;white-space:nowrap" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">↩ Reconectar</button>`;
      } else if (isWaiting) {
        // Sala abierta y el usuario no está dentro
        joinBtn = `<button onclick="joinOnlineRoom('${r.code}')" style="background:var(--accent);color:#000;border:none;border-radius:6px;padding:5px 14px;font-size:0.78rem;font-weight:bold;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Unirse</button>`;
      }

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:6px;transition:border-color 0.15s" onmouseover="this.style.borderColor='rgba(240,192,32,0.25)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
          <img src="${avatarSrc}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:top;border:2px solid rgba(255,255,255,0.12);flex-shrink:0" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">${statusBadge}<span style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--text2);letter-spacing:0.5px">${code}</span></div>
            <div style="font-size:0.82rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${players}</div>
          </div>
          ${joinBtn}
        </div>`;
    }).join('');

    container.innerHTML = `
      <div style="margin-top:12px">
        <p style="font-family:'Barlow Condensed',sans-serif;font-size:0.78rem;color:var(--text2);letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;text-align:center">Salas activas</p>
        ${html}
      </div>`;
  } catch (e) {
    container.innerHTML = '';
    console.warn('Error cargando salas online:', e);
  }
}

function selectGameMode(mode) {
  if (mode === 'machine') {
    hideModeOverlay();
    showDiffOverlay('machine');
  } else if (mode === 'online') {
    hideModeOverlay();
    showLobbyOverlay();
  } else if (mode === 'detective') {
    hideModeOverlay();
    window._specialMode = 'detective';
    showDiffOverlay('machine');
  } else if (mode === 'contrarreloj') {
    hideModeOverlay();
    window._specialMode = 'contrarreloj';
    showDiffOverlay('machine');
  } else if (mode === 'duelo') {
    hideModeOverlay();
    if (typeof showDuelLobbyOverlay === 'function') showDuelLobbyOverlay();
  }
}

function lobbyBack() {
  hideLobbyOverlay();
  showModeOverlay();
}

let _pendingRoomCreation = false;
function showDiffOverlay(mode) {
  document.getElementById('quien-diff-overlay').style.display = 'flex';
  if (mode === 'online') _pendingRoomCreation = true;
  else _pendingRoomCreation = false;
}
function diffBack() {
  document.getElementById('quien-diff-overlay').style.display = 'none';
  if (_pendingRoomCreation) {
    showLobbyOverlay();
  } else {
    showModeOverlay();
  }
}
function hideDiffOverlay() {
  document.getElementById('quien-diff-overlay').style.display = 'none';
}

function selectDifficulty(diff) {
  hideDiffOverlay();
  setGameDifficulty(diff); // defined in quien.js
  const special = window._specialMode;
  window._specialMode = null;
  if (_pendingRoomCreation) {
    _createOnlineRoomActual();
  } else if (special === 'detective') {
    startDetectiveGame();
  } else if (special === 'contrarreloj') {
    startContrarrelojGame();
  } else {
    startMachineGame();
  }
}

function hideManualOverlay() {
  document.getElementById('quien-manual-overlay').style.display = 'none';
  document.getElementById('manual-q-input').value = '';
}
function showManualOverlay() {
  document.getElementById('quien-manual-overlay').style.display = 'flex';
  document.getElementById('manual-q-input').focus();
}
function submitManualQuestion() {
  const input = document.getElementById('manual-q-input');
  const text = input.value.trim();
  if (!text) return;
  hideManualOverlay();
  onlineAskManualQuestion(text);
}

// ── Tablero (auxiliar) ────────────────────────────────
function _setBoardTitle(html) {
  const el = document.querySelector('.quien-board-title');
  if (!el) return;
  if (html) { el.innerHTML = html; el.style.display = 'block'; }
  else el.style.display = 'none';
}

async function createOnlineRoom() {
  hideLobbyOverlay();
  showDiffOverlay('online');
}

async function _createOnlineRoomActual() {
  if (!_fbInit()) return;

  const rawCode = _genCode();
  _roomCode = rawCode.replace('-', '');
  window._roomCode = _roomCode;
  _myRole = 'host';
  gameMode = 'online';

  _roomRef = _db.ref('rooms/' + _roomCode);

  // charactersList based on current CHARACTERS
  const chars = CHARACTERS.map(c => c.nombre);

  const hostUser = localStorage.getItem('lqsa_user');
  const roomData = {
    created: Date.now(),
    phase: 'waiting',
    hostUid: hostUser || null,
    hostReady: false,
    guestReady: false,
    turnCount: 0,
    action: null,
    winner: null,
    hostReveal: null,
    guestReveal: null,
    characters: chars,
    difficulty: gameDifficulty
  };

  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    roomData.hostName = currentUserProfile.username;
    roomData.hostAvatar = currentUserProfile.avatar;
  }

  await _roomRef.set(roomData);

  // Mensaje de unión de sistema
  try {
    await _db.ref(`rooms/${_roomCode}/chat`).push({
      username: "🤖 Sistema",
      avatar: "img/personajes/amador-rivas.webp",
      text: `${currentUserProfile.username} se unió a la partida`,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error("Error al enviar mensaje de sistema:", e);
  }

  // En lugar de borrar la sala, la marcamos como desconectado
  _roomRef.onDisconnect().update({ hostDisconnected: true });
  localStorage.setItem('activeOnlineRoomCode', _roomCode);

  hideLobbyOverlay();
  _resetOnlineBoard();
  const displayedCode = _roomCode.slice(0, 4) + '-' + _roomCode.slice(4);
  _setBoardTitle(`
    <div style="text-align:center">
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--accent);letter-spacing:4px;margin:0 0 10px">
        Sala creada
      </h2>
      <p style="font-size:0.9rem;color:var(--text2);margin:0 0 12px">
        Comparte este código con tu amigo:
      </p>
      <div class="online-room-code">${displayedCode}</div>
      <button class="q-btn" onclick="_copyCode()" style="margin-top:10px;padding:6px 18px">
        📋 Copiar código
      </button>
      <button class="q-btn" onclick="openInviteFriendsModal()" style="margin-top:10px;padding:6px 18px;margin-left:8px;background:rgba(96,165,250,0.15);border-color:rgba(96,165,250,0.4);color:#60a5fa">
        ✉️ Invitar a amigos
      </button>
      <p style="font-size:0.82rem;color:var(--text2);margin-top:14px">
        Esperando que se una alguien...
      </p>
    </div>`);

  await _subscribeRoom();
}

function _copyCode() {
  const displayedCode = _roomCode.slice(0, 4) + '-' + _roomCode.slice(4);
  navigator.clipboard?.writeText(displayedCode).catch(() => { });
  const btn = document.querySelector('.online-room-code + button');
  if (btn) { btn.textContent = '✓ Copiado'; setTimeout(() => btn.textContent = '📋 Copiar código', 2000); }
}

// ── Unirse a sala ─────────────────────────────────────
async function joinOnlineRoom(codeArg) {
  if (!_fbInit()) return;

  const input = document.getElementById('quien-join-input');
  const raw = (codeArg || input?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== 8) {
    showLobbyOverlay('Código inválido. Formato: ABCD-1234');
    return;
  }

  const ref = _db.ref('rooms/' + raw);
  const snap = await ref.once('value');
  if (!snap.exists()) { showLobbyOverlay('Sala no encontrada. Verifica el código.'); return; }

  const data = snap.val();
  if (data.phase !== 'waiting') { showLobbyOverlay('Esta sala ya no está disponible.'); return; }

  // Sync difficulty and characters
  if (data.difficulty) {
    setGameDifficulty(data.difficulty);
  } else if (data.characters && Array.isArray(data.characters)) {
    // Fallback: infer difficulty from count
    const cnt = data.characters.length;
    const diff = cnt <= 30 ? 'basico' : cnt <= 60 ? 'extenso' : 'dios';
    setGameDifficulty(diff);
  }

  if (data.characters && Array.isArray(data.characters)) {
    CHARACTERS = ALL_CHARACTERS.filter(c => data.characters.includes(c.nombre));
    _boardBuilt = false;
    buildBoardRows();
  }

  _roomCode = raw;
  window._roomCode = _roomCode;
  _myRole = 'guest';
  gameMode = 'online';
  _roomRef = ref;

  const guestUser = localStorage.getItem('lqsa_user');
  const updateData = {
    phase: 'setup',
    guestJoined: true,
    guestUid: guestUser || null
  };
  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    updateData.guestName = currentUserProfile.username;
    updateData.guestAvatar = currentUserProfile.avatar;
  }

  await _roomRef.update(updateData);

  // Mensaje de unión de sistema
  try {
    await _db.ref(`rooms/${_roomCode}/chat`).push({
      username: "🤖 Sistema",
      avatar: "img/personajes/amador-rivas.webp",
      text: `${currentUserProfile.username} se unió a la partida`,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error("Error al enviar mensaje de sistema:", e);
  }

  // En lugar de borrar la sala, la marcamos como desconectado
  _roomRef.onDisconnect().update({ guestDisconnected: true });
  localStorage.setItem('activeOnlineRoomCode', _roomCode);

  hideLobbyOverlay();
  _resetOnlineBoard();
  await _subscribeRoom();
}

// ── Inicializar UI del tablero (online) ───────────────
function _resetOnlineBoard() {
  playerElim = new Set();
  askedByPlayer = new Set();
  askedByMachine = new Set();
  phase = 'setup';
  turnCount = 0;
  busy = false;
  mySecret = null;
  onlineAnswers = {};
  _lastApplied = 0;

  const wrap = document.querySelector('.quien-wrap');
  if (wrap) {
    wrap.classList.add('is-setup');
    wrap.classList.remove('manual-mode');
  }
  document.getElementById('quien-start-btn').classList.remove('visible');
  renderBoard();
  updateMyCard(null);
  renderQuestions(false);
  setStatus('');
  document.getElementById('quien-board').classList.add('is-setup');
  manualDiscardMode = false;
  clearHistory();
  renderGodActions();
}

// ── Suscribirse ───────────────────────────────────────
async function _subscribeRoom() {
  const snap = await _roomRef.once('value');
  const initial = snap.val();
  _lastApplied = initial?.action?.seq ?? 0;
  _actionSeq = _lastApplied;

  if (typeof _initRoomChat === 'function' && _roomCode) {
    _initRoomChat(_roomCode);
  }

  _roomRef.on('value', snap => {
    if (!snap.exists()) return;
    const data = snap.val();

    // Alertas de desconexión en el chat local
    if (_myRole && data) {
      const oppRole = _myRole === 'host' ? 'guest' : 'host';
      const oppName = _myRole === 'host' ? (data.guestName || "Invitado") : (data.hostName || "Anfitrión");
      const oppDisconnected = oppRole === 'host' ? data.hostDisconnected : data.guestDisconnected;

      if (oppDisconnected && !_onlineKnownDisconnected.has(oppRole)) {
        _onlineKnownDisconnected.add(oppRole);
        _addLocalSystemChatMessage(`⚠️ ${oppName} se ha desconectado. ¡Puede reconectarse si recarga!`);
      } else if (!oppDisconnected && _onlineKnownDisconnected.has(oppRole)) {
        _onlineKnownDisconnected.delete(oppRole);
        _addLocalSystemChatMessage(`✅ ${oppName} se ha reconectado.`);
      }
    }

    _onRoomUpdate(data);
  });
}

// ── Dispatcher principal ──────────────────────────────
function _onRoomUpdate(data) {
  if (!data) return;

  if (!data || data.phase === 'abandoned') {
    renderQuestions(false);
    _setBoardTitle(null);
    cleanupOnlineRoom();
    setStatus(`<div class="quien-setup">
      <p class="quien-title" style="color:#f87171;font-size:1.4rem">😔 Oponente desconectado</p>
      <button class="guess-btn" onclick="initGame()" style="margin-top:16px">Volver al inicio</button>
    </div>`);
    return;
  }

  if (data.phase === 'waiting') {
    // Host waiting, nothing to do yet
    return;
  }

  if (data.phase === 'setup') {
    // Si veníamos de gameover → revancha → resetear tablero local
    if (phase === 'gameover') {
      playerElim = new Set();
      askedByPlayer = new Set();
      askedByMachine = new Set();
      onlineAnswers = {};
      mySecret = null;
      _lastApplied = 0;
      _actionSeq = 0;
      turnCount = 0;
      busy = false;
      _onlineStatsSaved = false;
      phase = 'setup';
      document.querySelector('.quien-wrap').classList.add('is-setup');
      document.getElementById('quien-start-btn').classList.remove('visible');
      renderBoard();
      updateMyCard(null);
      renderQuestions(false);
      _setBoardTitle(`
        <h2>Elige tu personaje secreto</h2>
        <p>Haz clic en el personaje que vas a ser. El oponente intentará adivinarlo.</p>`);
      setStatus('');
      clearHistory();
      return;
    }
    _handleSetup(data);
    return;
  }

  if (data.phase === 'host_turn' || data.phase === 'guest_turn') {
    _handleTurn(data);
    return;
  }

  if (data.phase === 'pending_answer') {
    _handlePendingAnswer(data);
    return;
  }

  if (data.phase === 'pending_guess') {
    _handlePendingGuess(data);
    return;
  }

  if (data.phase === 'gameover') {
    // Si ambos quieren revancha, el host resetea la sala
    if (_myRole === 'host' && data.hostRematch && data.guestRematch) {
      _roomRef.update({
        phase: 'setup',
        hostReady: false,
        guestReady: false,
        hostRematch: false,
        guestRematch: false,
        turnCount: 0,
        action: null,
        winner: null,
        hostReveal: null,
        guestReveal: null,
      });
      return;
    }
    _handleGameover(data);
  }
}

// ── Setup ─────────────────────────────────────────────
function _handleSetup(data) {
  // Host: guest just joined → show board
  if (_myRole === 'host' && data.guestJoined && phase === 'setup' &&
    !document.querySelector('.quien-board-title')?.innerHTML?.includes('Elige tu')) {
    _setBoardTitle(`
      <h2>Elige tu personaje secreto</h2>
      <p>Haz clic en el personaje que vas a ser. El oponente intentará adivinarlo.</p>`);
  }

  // Guest: board is already shown from joinOnlineRoom
  if (_myRole === 'guest' && !document.querySelector('.quien-board-title')?.innerHTML?.includes('Elige tu')) {
    _setBoardTitle(`
      <h2>Elige tu personaje secreto</h2>
      <p>Haz clic en el personaje que vas a ser. El oponente intentará adivinarlo.</p>`);
  }

  const myReady = _myRole === 'host' ? data.hostReady : data.guestReady;
  const oppReady = _myRole === 'host' ? data.guestReady : data.hostReady;

  if (myReady && !oppReady) {
    document.getElementById('quien-start-btn').classList.remove('visible');
    setStatus(`<div class="quien-setup">
      <p class="quien-desc" style="margin:10px 0">✅ Listo. Esperando al oponente...</p>
    </div>`);
  }
}

// ── Jugador online elige personaje ────────────────────
function onlineSelectSecret(name) {
  const char = CHARACTERS.find(c => c.nombre === name);
  if (!char) return;
  mySecret = char;
  updateMyCard(char);
  renderBoard();
  document.querySelectorAll('.quien-card-3d').forEach(el => {
    el.classList.toggle('my-secret', el.dataset.name === name);
  });
  document.getElementById('quien-start-btn').classList.add('visible');
  setStatus('');
}

// ── Confirmar listo ───────────────────────────────────
async function onlineConfirmReady() {
  if (!mySecret || !_roomRef) return;

  const update = _myRole === 'host'
    ? { hostReady: true, hostSecret: mySecret.nombre }
    : { guestReady: true, guestSecret: mySecret.nombre };
  await _roomRef.update(update);

  // Atomic check: si ambos listos → empezar
  const snap = await _roomRef.once('value');
  const data = snap.val();
  if (data.hostReady && data.guestReady) {
    await _roomRef.update({ phase: 'host_turn', turnCount: 0 });
  }

  document.getElementById('quien-start-btn').classList.remove('visible');
  setStatus(`<div class="quien-setup">
    <p class="quien-desc" style="margin:10px 0">✅ Listo. Esperando al oponente...</p>
  </div>`);
}

// ── Manejo de turno ───────────────────────────────────
function _handleTurn(data) {
  const hostName = data.hostName || "Host";
  const guestName = data.guestName || "Invitado";
  const oppName = _myRole === 'host' ? guestName : hostName;
  const myName = _myRole === 'host' ? hostName : guestName;

  // Aplicar respuesta a MI tablero si yo hice la última pregunta y ya tiene respuesta
  const act = data.action;
  let justAnsweredHtml = "";
  if (act && act.seq > _lastApplied && act.answer !== null && act.by === _myRole) {
    const qText = act.isManual ? act.manualText : Q_MAP[act.questionId]?.text;
    justAnsweredHtml = `<div class="quien-answer ${act.answer ? 'answer-yes' : 'answer-no'}" style="margin-bottom: 16px; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1)">
      <p class="quien-question-asked">${qText}</p>
      <div class="quien-answer-badge" style="font-size: 1.6rem;">${act.answer ? '✓ SÍ' : '✗ NO'}</div>
    </div>`;

    addHistoryItem(myName, qText, act.answer);

    if (act.isManual) {
      // Manual question -> user filters manually, or we just display it
      onlineAnswers["manual_" + act.seq] = act.answer;
      _lastApplied = act.seq;
    } else {
      const q = Q_MAP[act.questionId];
      if (q) {
        // Eliminar del tablero del jugador — null significa "profesion desconocida", no se elimina.
        // Además, si es estudiante, nunca se debe bajar en preguntas de trabajo (que empiecen por occ_ y no sean occ_presidente ni occ_estudiante)
        CHARACTERS.filter(c => {
          if (q.id.startsWith('occ_') && q.id !== 'occ_presidente' && q.id !== 'occ_estudiante') {
            if (c.ocupacion && c.ocupacion.some(o => /estudiante/i.test(o))) {
              return false;
            }
          }
          const r = q.fn(c);
          return r !== null && r !== act.answer;
        }).forEach(c => playerElim.add(c.nombre));
        askedByPlayer.add(act.questionId);
        onlineAnswers[act.questionId] = act.answer;
        _lastApplied = act.seq;
      }
    }

    if (typeof saveOnlineGameState === 'function') saveOnlineGameState();
  }

  const isMyTurn = (data.phase === 'host_turn' && _myRole === 'host') ||
    (data.phase === 'guest_turn' && _myRole === 'guest');

  // Siempre salir del modo setup y mostrar el tablero completo
  _setBoardTitle(null);
  const wrap = document.querySelector('.quien-wrap');
  wrap.classList.remove('is-setup');
  wrap.classList.add('is-playing');
  document.getElementById('quien-board').classList.remove('is-setup');
  document.getElementById('quien-start-btn').classList.remove('visible');
  renderBoard();

  if (isMyTurn) {
    phase = 'player_turn';
    turnCount = data.turnCount || 0;
    renderQuestions(true);
    setStatus(justAnsweredHtml + playerTurnStatus());
  } else {
    phase = 'machine_turn';
    renderQuestions(false);
    const rem = CHARACTERS.length - playerElim.size;
    setStatus(justAnsweredHtml + `<div class="quien-turn-player">
      <p class="turn-badge">⏳ Turno de ${oppName}</p>
      <p class="quien-desc">Esperando que haga su pregunta...</p>
      <p class="quien-remaining">El oponente podría ser <strong>${rem}</strong> personaje${rem !== 1 ? 's' : ''}</p>
    </div>`);
  }
  renderGodActions();
}

// ── Pregunta pendiente ────────────────────────────────
function _handlePendingAnswer(data) {
  const hostName = data.hostName || "Host";
  const guestName = data.guestName || "Invitado";
  const oppName = _myRole === 'host' ? guestName : hostName;

  const act = data.action;
  if (!act) return;

  const qText = act.isManual ? act.manualText : Q_MAP[act.questionId]?.text;

  if (act.by === _myRole) {
    // Yo pregunté, esperando respuesta
    renderQuestions(false);
    setStatus(`<div class="quien-turn-player">
      <p class="turn-badge">🗣️ Tu pregunta</p>
      <h2 class="quien-question">${qText}</h2>
      <p class="quien-desc" style="margin-top:8px">Esperando respuesta de <strong>${oppName}</strong>...</p>
    </div>`);
  } else {
    // El oponente preguntó, yo respondo
    setStatus(`<div class="quien-machine-ask">
      <p class="turn-badge">🤔 Pregunta de <strong>${oppName}</strong></p>
      <h2 class="quien-question">${qText}</h2>
      <p class="quien-desc" style="font-size:0.82rem;margin-bottom:16px">
        Sobre tu personaje secreto
      </p>
      <div class="quien-btns">
        <button class="quien-btn-yes" onclick="onlineAnswerQ(true)">✓ Sí</button>
        <button class="quien-btn-no"  onclick="onlineAnswerQ(false)">✗ No</button>
      </div>
    </div>`);
  }
}

async function onlineAnswerQ(ans) {
  if (!_roomRef) return;
  const snap = await _roomRef.once('value');
  const data = snap.val();
  // El siguiente turno es para quien hizo la pregunta (el que no soy yo)
  const nextPhase = data.action?.by === 'host' ? 'guest_turn' : 'host_turn';

  await _roomRef.update({
    'action/answer': ans,
    phase: nextPhase,
    turnCount: (data.turnCount || 0) + 1
  });

  const hostName = data.hostName || "Host";
  const guestName = data.guestName || "Invitado";
  const oppName = _myRole === 'host' ? guestName : hostName;

  const act = data.action;
  const qText = act.isManual ? act.manualText : Q_MAP[act.questionId]?.text;
  addHistoryItem(oppName, qText, ans);
  setStatus(`<div class="quien-answer ${ans ? 'answer-yes' : 'answer-no'}">
    <p class="quien-question-asked">${qText}</p>
    <div class="quien-answer-badge">${ans ? '✓ SÍ' : '✗ NO'}</div>
  </div>`);
}

// ── Jugador online hace una pregunta manual ───────────
async function onlineAskManualQuestion(text) {
  if (!_roomRef || phase !== 'player_turn') return;
  phase = 'asking';
  renderQuestions(false);
  _actionSeq++;

  await _roomRef.update({
    phase: 'pending_answer',
    action: { seq: _actionSeq, by: _myRole, isManual: true, manualText: text, answer: null }
  });
}

// ── Jugador online hace una pregunta ──────────────────
async function onlineAskQuestion(id) {
  if (!_roomRef || phase !== 'player_turn') return;
  phase = 'asking';
  renderQuestions(false);
  _actionSeq++;

  await _roomRef.update({
    phase: 'pending_answer',
    action: { seq: _actionSeq, by: _myRole, questionId: id, answer: null }
  });
}

// ── Jugador online adivina ────────────────────────────
async function onlinePlayerGuess(name) {
  if (!_roomRef || phase !== 'player_turn') return;
  if (playerElim.has(name)) return;
  phase = 'guessing';
  renderQuestions(false);
  _actionSeq++;

  const slug = makeSlug(name);
  await _roomRef.update({
    phase: 'pending_guess',
    action: { seq: _actionSeq, type: 'guess', by: _myRole, guessChr: name, correct: null }
  });

  setStatus(`<div class="quien-machine-ask">
    <p class="turn-badge">🕵️ Tu adivinanza</p>
    <div class="quien-guess-avatar" style="margin:8px auto;border-color:var(--accent)">
      <img src="img/personajes/${slug}.webp" alt="${name}"
        onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
    </div>
    <h2 class="quien-guess-name">${name}</h2>
    <p class="quien-desc" style="font-size:0.8rem;margin-top:6px">Esperando confirmación del oponente...</p>
  </div>`);
}

// ── Adivinanza pendiente ──────────────────────────────
function _handlePendingGuess(data) {
  const hostName = data.hostName || "Host";
  const guestName = data.guestName || "Invitado";
  const oppName = _myRole === 'host' ? guestName : hostName;

  const act = data.action;
  if (!act) return;

  if (act.by === _myRole) return; // Ya mostrado en onlinePlayerGuess

  // El oponente adivina → yo confirmo
  const slug = makeSlug(act.guessChr);
  setStatus(`<div class="quien-machine-ask">
    <p class="turn-badge">🕵️ <strong>${oppName}</strong> adivina</p>
    <p class="quien-question" style="font-size:0.95rem;margin-bottom:10px">¿Tu personaje es...</p>
    <div class="quien-guess-avatar" style="margin:0 auto 8px;border-color:var(--accent)">
      <img src="img/personajes/${slug}.webp" alt="${act.guessChr}"
        onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
    </div>
    <h2 class="quien-guess-name">${act.guessChr}</h2>
    <div class="quien-btns" style="margin-top:14px">
      <button class="quien-btn-yes" onclick="onlineConfirmGuess(true)">✓ Sí</button>
      <button class="quien-btn-no"  onclick="onlineConfirmGuess(false)">✗ No</button>
    </div>
  </div>`);
}

async function onlineConfirmGuess(correct) {
  if (!_roomRef) return;
  const myRevealKey = _myRole === 'host' ? 'hostReveal' : 'guestReveal';
  const snap = await _roomRef.once('value');
  const guesser = snap.val()?.action?.by;

  if (correct) {
    await _roomRef.update({
      phase: 'gameover',
      winner: guesser,
      [myRevealKey]: mySecret?.nombre || null
    });
  } else {
    // Adivinanza incorrecta → el que adivina pierde
    await _roomRef.update({
      phase: 'gameover',
      winner: _myRole,  // yo gano
      [myRevealKey]: mySecret?.nombre || null
    });
  }
}

// ── Revancha en la misma sala ─────────────────────────
async function onlineRematch() {
  if (!_roomRef) return;

  clearHistory();
  const rematchKey = _myRole === 'host' ? 'hostRematch' : 'guestRematch';
  await _roomRef.update({ [rematchKey]: true });

  setStatus(`<div class="quien-setup">
    <p class="quien-desc" style="margin:10px 0">✅ Listo para revancha. Esperando al oponente...</p>
  </div>`);
}

// ── Fin de partida ────────────────────────────────────
function _handleGameover(data) {
  renderQuestions(false);
  _setBoardTitle(null);
  phase = 'gameover';
  renderGodActions();

  const hostName = data.hostName || "Host";
  const guestName = data.guestName || "Invitado";
  const oppName = _myRole === 'host' ? guestName : hostName;
  const myName = _myRole === 'host' ? hostName : guestName;

  const act = data.action;
  if (act && act.type === 'guess' && act.seq > _lastApplied) {
    const isWinner = data.winner === act.by;
    const guesserName = act.by === _myRole ? myName : oppName;
    addHistoryItem(guesserName, `¿Eres ${act.guessChr}?`, isWinner);
    _lastApplied = act.seq;
  }

  // Revelar mi personaje si no lo hice ya
  const myRevealKey = _myRole === 'host' ? 'hostReveal' : 'guestReveal';
  if (!data[myRevealKey] && mySecret && _roomRef) {
    _roomRef.update({ [myRevealKey]: mySecret.nombre });
  }

  // Borrar sala automáticamente 60s después (ambos jugadores lo intentan, solo uno lo ejecuta)
  setTimeout(() => {
    if (_roomRef && phase === 'gameover') {
      _roomRef.once('value').then(snap => {
        if (snap.exists() && snap.val()?.phase === 'gameover') {
          _roomRef.remove();
        }
      });
    }
  }, 60000);

  const iWon = data.winner === _myRole;
  const oppReveal = _myRole === 'host' ? data.guestReveal : data.hostReveal;
  const myRematch = _myRole === 'host' ? data.hostRematch : data.guestRematch;

  // Si yo ya he pedido revancha, no sobrescribir con el botón
  if (myRematch) {
    setStatus(`<div class="quien-setup">
      <p class="quien-desc" style="margin:10px 0">✅ Listo para revancha. Esperando al oponente...</p>
    </div>`);
    return;
  }

  // Save stats to Firebase exactly once
  if (typeof StatsFirebase !== 'undefined' && !_onlineStatsSaved) {
    if (oppReveal) {
      _onlineStatsSaved = true;
      if (window._onlineSaveTimeout) { clearTimeout(window._onlineSaveTimeout); window._onlineSaveTimeout = null; }
      StatsFirebase.saveGameResult('quien_online', askedByPlayer.size, iWon, oppReveal);
    } else {
      if (!window._onlineSaveTimeout) {
        window._onlineSaveTimeout = setTimeout(() => {
          if (!_onlineStatsSaved && typeof StatsFirebase !== 'undefined') {
            _onlineStatsSaved = true;
            StatsFirebase.saveGameResult('quien_online', askedByPlayer.size, iWon, null);
          }
          window._onlineSaveTimeout = null;
        }, 3000);
      }
    }
  }

  if (iWon && typeof confetti === 'function') {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  let html = `<div class="quien-result">`;
  html += iWon
    ? `<p class="quien-result-label">🎉 ¡Has ganado!</p>`
    : `<p class="quien-result-label" style="color:#f87171">😔 Has perdido</p>`;

  // Personaje del oponente
  if (oppReveal) {
    const slug = makeSlug(oppReveal);
    html += `
      <p class="quien-desc" style="font-size:0.8rem;margin:8px 0 4px">El personaje del oponente era:</p>
      <div class="quien-guess-avatar ${iWon ? 'win-avatar' : ''}" style="margin:0 auto 8px">
        <img src="img/personajes/${slug}.webp" alt="${oppReveal}"
          onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
      </div>
      <h2 class="quien-guess-name">${oppReveal}</h2>`;
  } else {
    html += `<p class="quien-desc" style="margin-top:10px">Esperando que el oponente revele su personaje...</p>`;
  }

  // Tu propio personaje
  if (mySecret) {
    const mySlug = makeSlug(mySecret.nombre);
    html += `
      <div style="margin:12px 0 6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
        <p class="quien-desc" style="font-size:0.8rem;margin:0 0 6px">Tu personaje era:</p>
        <div class="quien-guess-avatar" style="margin:0 auto 6px;border-color:rgba(255,255,255,0.3)">
          <img src="img/personajes/${mySlug}.webp" alt="${mySecret.nombre}"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        </div>
        <h2 class="quien-guess-name" style="font-size:1.1rem">${mySecret.nombre}</h2>
      </div>`;
  }

  html += `<button class="guess-btn" onclick="onlineRematch()" style="margin-top:16px">Jugar de nuevo</button>`;
  html += `</div>`;
  setStatus(html);
}

// ═══════════════════════════════════════════════════
//  CHAT DE SALA ONLINE
// ═══════════════════════════════════════════════════
let _chatRoomRef = null;
let _chatOpen = true;
let _chatUnread = 0;
let _chatIsVisible = false;

function _initRoomChat(roomCode) {
  if (!_db) {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _db = firebase.database();
    } else {
      return;
    }
  }
  _destroyRoomChat();

  // Helper para formatear hora en formato HH:MM
  function formatChatTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const isDuel = window._duelRoomCode ? true : false;
  const path = isDuel ? `duel_rooms/${roomCode}/chat` : `rooms/${roomCode}/chat`;

  // Usar child_added: dispara una vez por mensaje ya existente (carga inicial)
  // y luego una vez por cada nuevo mensaje en tiempo real.
  _chatRoomRef = _db.ref(path).orderByKey().limitToLast(30);
  _chatIsVisible = true;
  _chatUnread = 0;

  const panel = document.getElementById('room-chat-panel');
  if (panel) panel.style.display = 'flex';

  // Limpiar el placeholder inicial
  const messagesEl = document.getElementById('room-chat-messages');
  if (messagesEl) messagesEl.innerHTML = '';

  _chatRoomRef.on('child_added', (snap) => {
    const msg = snap.val();
    if (!msg || !msg.text) return;

    const el = document.getElementById('room-chat-messages');
    if (!el) return;

    // Quitar el placeholder si aún existe
    const placeholder = el.querySelector('p[data-placeholder]');
    if (placeholder) placeholder.remove();

    const myName = (typeof currentUserProfile !== 'undefined' && currentUserProfile)
      ? currentUserProfile.username
      : (_myRole === 'host' ? 'Anfitrión' : 'Invitado');

    const isMe = msg.username === myName;

    const timeStr = msg.ts ? formatChatTime(msg.ts) : formatChatTime(Date.now());
    const avImg = msg.avatar || 'img/personajes/amador-rivas.webp';

    const bubble = document.createElement('div');
    bubble.style.cssText = `display:flex; gap:6px; align-items:flex-end; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:8px; animation:fadeInMsg 0.2s ease;`;

    bubble.innerHTML = `
      ${!isMe ? `<img src="${avImg}" style="width:24px;height:24px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);object-fit:cover;object-position:top;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,0.2);" onerror="this.src='img/personajes/amador-rivas.webp'">` : ''}
      <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; max-width:75%;">
        <span style="font-size:0.62rem; color:var(--text2); margin-bottom:2px; font-family:'Barlow Condensed',sans-serif;">
          ${msg.username}
        </span>
        <div style="position:relative; background:${isMe ? 'rgba(240,192,32,0.15)' : 'rgba(255,255,255,0.06)'};
          border:1px solid ${isMe ? 'rgba(240,192,32,0.3)' : 'rgba(255,255,255,0.08)'};
          border-radius:${isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px'};
          padding:5px 9px 15px 9px; font-size:0.78rem; color:var(--text);
          line-height:1.3; word-break:break-word; min-width:60px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
          ${msg.text}
          <span style="position:absolute; bottom:2px; right:5px; font-size:0.55rem; color:var(--text2); opacity:0.6; font-family:sans-serif;">
            ${timeStr}
          </span>
        </div>
      </div>
      ${isMe ? `<img src="${avImg}" style="width:24px;height:24px;border-radius:50%;border:1px solid var(--accent);object-fit:cover;object-position:top;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,0.2);" onerror="this.src='img/personajes/amador-rivas.webp'">` : ''}
    `;

    el.appendChild(bubble);
    el.scrollTop = el.scrollHeight;

    // Badge de no leídos si el chat está minimizado
    if (!_chatOpen) {
      _chatUnread++;
      const badge = document.getElementById('room-chat-badge');
      if (badge) {
        badge.textContent = _chatUnread;
        badge.style.display = 'flex';
      }
    }
  });
}

function _destroyRoomChat() {
  if (_chatRoomRef) {
    _chatRoomRef.off();
    _chatRoomRef = null;
  }
  _chatIsVisible = false;
  _chatUnread = 0;
  const panel = document.getElementById('room-chat-panel');
  if (panel) panel.style.display = 'none';
  const badge = document.getElementById('room-chat-badge');
  if (badge) badge.style.display = 'none';
}

function toggleRoomChat() {
  _chatOpen = !_chatOpen;
  const messagesEl = document.getElementById('room-chat-messages');
  const quickEl = document.getElementById('room-chat-quick');
  const inputWrap = document.getElementById('room-chat-input')?.parentElement;
  const icon = document.getElementById('room-chat-toggle-icon');
  const badge = document.getElementById('room-chat-badge');

  if (_chatOpen) {
    if (messagesEl) messagesEl.style.display = 'flex';
    if (quickEl) quickEl.style.display = 'flex';
    if (inputWrap) inputWrap.style.display = 'flex';
    if (icon) icon.textContent = '▲';
    // Limpiar badge al abrir
    _chatUnread = 0;
    if (badge) badge.style.display = 'none';
    // Scroll al fondo
    if (messagesEl) setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
  } else {
    if (messagesEl) messagesEl.style.display = 'none';
    if (quickEl) quickEl.style.display = 'none';
    if (inputWrap) inputWrap.style.display = 'none';
    if (icon) icon.textContent = '▼';
  }
}

async function sendRoomChatMessage() {
  const input = document.getElementById('room-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await _pushRoomChatMsg(text);
}

async function sendRoomQuickMsg(text) {
  await _pushRoomChatMsg(text);
}

async function _pushRoomChatMsg(text) {
  const code = _roomCode || window._duelRoomCode;
  if (!_chatRoomRef || !code) return;
  const myName = (typeof currentUserProfile !== 'undefined' && currentUserProfile)
    ? currentUserProfile.username
    : (_myRole === 'host' ? 'Anfitrión' : 'Invitado');
  const myAvatar = (typeof currentUserProfile !== 'undefined' && currentUserProfile && currentUserProfile.avatar)
    ? currentUserProfile.avatar
    : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;

  const isDuel = window._duelRoomCode ? true : false;
  const path = isDuel ? `duel_rooms/${code}/chat` : `rooms/${code}/chat`;

  try {
    await _db.ref(path).push({
      username: myName,
      avatar: myAvatar,
      text: text,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error('Error enviando mensaje de sala:', e);
  }
}

// ── Variables y funciones auxiliares para reconexión 1vs1 ──
const _onlineKnownDisconnected = new Set();

function _addLocalSystemChatMessage(text) {
  const el = document.getElementById('room-chat-messages');
  if (!el) return;

  const placeholder = el.querySelector('p[data-placeholder]');
  if (placeholder) placeholder.remove();

  const isRecon = text.includes('reconect') || text.includes('✅');
  const bg = isRecon ? "rgba(22, 163, 74, 0.12)" : "rgba(239, 68, 68, 0.12)";
  const border = isRecon ? "1px solid rgba(22, 163, 74, 0.3)" : "1px solid rgba(239, 68, 68, 0.25)";
  const color = isRecon ? "#86efac" : "#fca5a5";
  const icon = isRecon ? "✅" : "⚠️";

  // Quitar emojis duplicados del inicio si ya los pasaron
  let cleanText = text.replace(/^[⚠️✅]\s*/, "");

  const bubble = document.createElement('div');
  bubble.style.cssText = "display:flex; justify-content:center; margin-bottom:8px; animation:fadeInMsg 0.2s ease;";
  bubble.innerHTML = `
    <div style="background:${bg}; border:${border}; border-radius:12px; padding:6px 14px; font-size:0.75rem; color:${color}; text-align:center; max-width:85%; font-family:sans-serif;">
      ${icon} ${cleanText}
    </div>
  `;
  el.appendChild(bubble);
  el.scrollTop = el.scrollHeight;

  // Mostrar aviso de mensaje nuevo si el chat está cerrado
  if (typeof _chatOpen !== 'undefined' && !_chatOpen) {
    if (typeof _chatUnread !== 'undefined') {
      _chatUnread++;
      const badge = document.getElementById('room-chat-badge');
      if (badge) {
        badge.textContent = _chatUnread;
        badge.style.display = 'flex';
      }
    }
  }
}

function saveOnlineGameState() {
  if (gameMode !== 'online' || !_roomCode) return;
  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;
  localStorage.setItem(`flipped_${_roomCode}_${savedUser}`, JSON.stringify(Array.from(playerElim)));
  localStorage.setItem(`asked_${_roomCode}_${savedUser}`, JSON.stringify(Array.from(askedByPlayer)));
  localStorage.setItem(`answers_${_roomCode}_${savedUser}`, JSON.stringify(onlineAnswers));
  localStorage.setItem(`lastSeq_${_roomCode}_${savedUser}`, _lastApplied.toString());
}

async function checkOnlineRoomReconnection() {
  if (!document.getElementById('quien-board')) return;

  const activeCode = localStorage.getItem('activeOnlineRoomCode');
  const banner = document.getElementById('online-reconnect-banner');
  if (!activeCode) {
    if (banner) banner.style.display = 'none';
    return;
  }

  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;

  if (!_fbInit()) return;

  const ref = _db.ref('rooms/' + activeCode);
  const snap = await ref.once('value');
  if (!snap.exists()) {
    localStorage.removeItem('activeOnlineRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  const data = snap.val();
  if (data.phase === 'abandoned' || data.phase === 'gameover') {
    localStorage.removeItem('activeOnlineRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  // Verificar que seamos parte de la sala (host o guest)
  if (data.hostUid !== savedUser && data.guestUid !== savedUser) {
    localStorage.removeItem('activeOnlineRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  // Mostrar el banner de reconexión
  if (banner) {
    banner.style.display = 'flex';
  }
}

async function reconnectActiveOnlineGame() {
  const activeCode = localStorage.getItem('activeOnlineRoomCode');
  if (!activeCode) return;

  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;

  if (!_fbInit()) return;

  const ref = _db.ref('rooms/' + activeCode);
  const snap = await ref.once('value');
  if (!snap.exists()) {
    localStorage.removeItem('activeOnlineRoomCode');
    return;
  }

  const data = snap.val();
  _roomCode = activeCode;
  window._roomCode = _roomCode;
  _roomRef = ref;
  gameMode = 'online';

  // Determinar rol
  if (data.hostUid === savedUser) {
    _myRole = 'host';
    await _roomRef.update({ hostDisconnected: null });
    _roomRef.onDisconnect().update({ hostDisconnected: true });
  } else {
    _myRole = 'guest';
    await _roomRef.update({ guestDisconnected: null });
    _roomRef.onDisconnect().update({ guestDisconnected: true });
  }

  // Ocultar overlays
  hideModeOverlay();
  const banner = document.getElementById('online-reconnect-banner');
  if (banner) banner.style.display = 'none';

  // Sincronizar dificultad y personajes
  if (data.difficulty) {
    setGameDifficulty(data.difficulty);
  }
  if (data.characters && Array.isArray(data.characters)) {
    CHARACTERS = ALL_CHARACTERS.filter(c => data.characters.includes(c.nombre));
    _boardBuilt = false;
    buildBoardRows();
  }

  // Inicializar UI online básica
  _resetOnlineBoard();

  // Si ya eligió personaje en setup, restaurar localmente
  const mySecretName = _myRole === 'host' ? data.hostSecret : data.guestSecret;
  if (mySecretName) {
    mySecret = CHARACTERS.find(c => c.nombre === mySecretName);
    updateMyCard(mySecret);
  }

  // Restaurar estado de cartas volteadas locales guardadas si existían
  const localFlipped = localStorage.getItem(`flipped_${activeCode}_${savedUser}`);
  if (localFlipped) {
    try {
      const names = JSON.parse(localFlipped);
      playerElim = new Set(names);
    } catch (e) { console.error(e); }
  }

  // Restaurar preguntas realizadas locales si existían
  const localAsked = localStorage.getItem(`asked_${activeCode}_${savedUser}`);
  if (localAsked) {
    try {
      const ids = JSON.parse(localAsked);
      askedByPlayer = new Set(ids);
    } catch (e) { console.error(e); }
  }

  // Restaurar respuestas guardadas si existían
  const localAnswers = localStorage.getItem(`answers_${activeCode}_${savedUser}`);
  if (localAnswers) {
    try {
      onlineAnswers = JSON.parse(localAnswers);
    } catch (e) { console.error(e); }
  }

  // Restaurar último seq aplicado
  const localLastSeq = localStorage.getItem(`lastSeq_${activeCode}_${savedUser}`);
  if (localLastSeq) {
    _lastApplied = parseInt(localLastSeq, 10) || 0;
  }

  // Volver a dibujar el tablero con el estado recuperado
  renderBoard();

  // Subscribirse a la sala para reanudar el flujo en tiempo real
  await _subscribeRoom();
}
