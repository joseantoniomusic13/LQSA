/* ════════════════════════════════════════════════════════
   LQSACatena — Modo Duelo Online (hasta 8 jugadores)
   Firebase: /duel_rooms/{code}/
     phase: 'waiting' | 'playing' | 'finished'
     secretCharacter: nombre del personaje secreto
     players/{uid}: { name, avatar, questions:0, finished:false, won:false, eliminated:[] }
   ════════════════════════════════════════════════════════ */

let _duelDb = null;
let _duelRoomRef = null;
let _duelRoomCode = null;
let _duelMyUid = null;
let _duelSecret = null;      // objeto personaje secreto
window._duelEliminated = [];    // personajes tachados por este jugador
let _duelQCount = 0;         // preguntas hechas
let _duelFinished = false;

// ── Init Firebase ─────────────────────────────────────
function _duelFbInit() {
  if (typeof firebase === 'undefined') return false;
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _duelDb = firebase.database();
  return true;
}

// ── Código de sala ────────────────────────────────────
function _duelGenCode() {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const N = '23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)];
  c += '-';
  for (let i = 0; i < 4; i++) c += N[Math.floor(Math.random() * N.length)];
  return c;
}

// ── Overlays ──────────────────────────────────────────
function showDuelLobbyOverlay() {
  const el = document.getElementById('duel-lobby-overlay');
  if (el) el.style.display = 'flex';
  _loadActiveDuelRooms();
}
function hideDuelLobbyOverlay() {
  const el = document.getElementById('duel-lobby-overlay');
  if (el) el.style.display = 'none';
}

// ── Salas de duelo activas ─────────────────────────────
async function _loadActiveDuelRooms() {
  const container = document.getElementById('duel-rooms-list');
  if (!container) return;
  if (!_duelFbInit()) return;

  container.innerHTML = `<p style="text-align:center;color:var(--text2);font-size:0.8rem;margin:8px 0">Buscando salas...</p>`;

  try {
    const snap = await _duelDb.ref('duel_rooms').orderByChild('created').limitToLast(30).once('value');
    if (!snap.exists()) { container.innerHTML = ''; return; }

    const now = Date.now();
    const rooms = [];
    snap.forEach(child => {
      const d = child.val();
      if (d.phase === 'finished') return;
      if (now - (d.created || 0) > 4 * 60 * 60 * 1000) return;
      // Ignorar si el host está desconectado y solo hay 1 jugador (sala fantasma)
      const players = Object.values(d.players || {});
      const anyConnected = players.some(p => !p.disconnected);
      if (!anyConnected) return;
      rooms.push({ code: child.key, ...d });
    });

    if (rooms.length === 0) { container.innerHTML = ''; return; }

    rooms.sort((a, b) => {
      if (a.phase === 'waiting' && b.phase !== 'waiting') return -1;
      if (b.phase === 'waiting' && a.phase !== 'waiting') return 1;
      return (b.created || 0) - (a.created || 0);
    });

    // Deduplicar: si un mismo UID aparece en varias salas, conservar solo la más reciente
    const seenUids = new Set();
    const dedupedRooms = [];
    for (const r of rooms) {
      const uids = Object.keys(r.players || {});
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
      const players = Object.values(r.players || {});
      const connectedPlayers = players.filter(p => !p.disconnected);
      const playerCount = connectedPlayers.length;
      const maxPlayers = 8;

      // Avatar e info del host
      const hostData = r.hostUid && r.players ? r.players[r.hostUid] : null;
      const avatarSrc = (hostData && hostData.avatar) || 'img/personajes/amador-rivas.webp';

      const statusBadge = isWaiting
        ? `<span style="background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.4);color:#4ade80;border-radius:50px;padding:2px 8px;font-size:0.7rem;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px">ABIERTA</span>`
        : `<span style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;border-radius:50px;padding:2px 8px;font-size:0.7rem;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px">EN JUEGO</span>`;

      const playerNames = connectedPlayers
        .map((p, i) => {
          const isHost = r.players && Object.entries(r.players).find(([uid, pd]) => pd === p)?.[0] === r.hostUid;
          return `<span style="color:${isHost ? 'var(--text)' : 'var(--text2)'}${isHost ? ';font-weight:700' : ''}">${isHost ? '👑' : '👤'} ${p.name || 'Anónimo'}</span>`;
        }).join('<span style="color:var(--text2);opacity:0.4;margin:0 3px">·</span>');

      const isFull = playerCount >= maxPlayers;
      const alreadyIn = myUid && r.players && r.players[myUid];
      let joinBtn = '';
      if (alreadyIn) {
        // Ya estaba en la sala: ofrecer reconectar
        joinBtn = `<button onclick="localStorage.setItem('activeDuelRoomCode','${r.code}');hideDuelLobbyOverlay();reconnectActiveDuelGame()" style="background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid rgba(239,68,68,0.5);border-radius:6px;padding:5px 12px;font-size:0.78rem;font-weight:bold;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;transition:opacity 0.15s;white-space:nowrap;flex-shrink:0" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">↩ Reconectar</button>`;
      } else if (!isFull) {
        // Sala con hueco libre: siempre se puede unir (waiting o playing)
        joinBtn = `<button onclick="joinDuelRoom('${r.code}')" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:5px 14px;font-size:0.78rem;font-weight:bold;cursor:pointer;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.5px;white-space:nowrap;transition:opacity 0.15s;flex-shrink:0" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Unirse</button>`;
      }

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:6px;transition:border-color 0.15s" onmouseover="this.style.borderColor='rgba(239,68,68,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
          <img src="${avatarSrc}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:top;border:2px solid rgba(255,255,255,0.12);flex-shrink:0" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              ${statusBadge}
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--text2);letter-spacing:0.5px">${code}</span>
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.72rem;color:var(--text2)">${playerCount}/${maxPlayers}</span>
            </div>
            <div style="font-size:0.8rem;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${playerNames}</div>
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
    console.warn('Error cargando salas de duelo:', e);
  }
}



// ── Crear sala Duelo ──────────────────────────────────
async function createDuelRoom() {
  if (!currentUserProfile) { openLoginModal(); return; }
  if (!_duelFbInit()) return;

  const rawCode = _duelGenCode();
  _duelRoomCode = rawCode.replace('-', '');
  _duelMyUid = localStorage.getItem('lqsa_user');

  _duelRoomRef = _duelDb.ref('duel_rooms/' + _duelRoomCode);

  const roomData = {
    created: Date.now(),
    phase: 'waiting',
    hostUid: _duelMyUid,
    secretCharacter: null,
    difficulty: typeof gameDifficulty !== 'undefined' ? gameDifficulty : 'basico',
    players: {
      [_duelMyUid]: {
        name: currentUserProfile.username,
        avatar: currentUserProfile.avatar || 'img/personajes/amador-rivas.webp',
        questions: 0,
        finished: false,
        won: false,
        eliminated: []
      }
    }
  };

  await _duelRoomRef.set(roomData);
  _duelRoomRef.onDisconnect().update({ [`players/${_duelMyUid}/disconnected`]: true });

  window._duelRoomCode = _duelRoomCode;
  localStorage.setItem('activeDuelRoomCode', _duelRoomCode);

  // Mensaje de unión de sistema
  try {
    await _duelDb.ref(`duel_rooms/${_duelRoomCode}/chat`).push({
      username: "🤖 Sistema",
      avatar: "img/personajes/amador-rivas.webp",
      text: `${currentUserProfile.username} se unió a la partida`,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error("Error al enviar mensaje de sistema:", e);
  }

  hideDuelLobbyOverlay();
  _renderDuelWaitingRoom();
  _subscribeDuelRoom();
}

// ── Unirse a sala Duelo ───────────────────────────────
async function joinDuelRoom(codeArg) {
  if (!currentUserProfile) { openLoginModal(); return; }
  if (!_duelFbInit()) return;

  const input = document.getElementById('duel-join-input');
  const raw = (codeArg || input?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== 8) {
    _duelLobbyError('Código inválido. Formato: ABCD-1234');
    return;
  }

  const ref = _duelDb.ref('duel_rooms/' + raw);
  const snap = await ref.once('value');
  if (!snap.exists()) { _duelLobbyError('Sala no encontrada.'); return; }
  const data = snap.val();
  // Solo bloquear si la partida ya ha terminado
  if (data.phase === 'finished') { _duelLobbyError('La partida ha terminado.'); return; }
  const playerCount = Object.keys(data.players || {}).length;
  if (playerCount >= 8) { _duelLobbyError('La sala está llena (máx. 8 jugadores).'); return; }

  _duelRoomCode = raw;
  _duelMyUid = localStorage.getItem('lqsa_user');
  _duelRoomRef = ref;
  window._duelRoomCode = _duelRoomCode;

  await _duelRoomRef.update({
    [`players/${_duelMyUid}`]: {
      name: currentUserProfile.username,
      avatar: currentUserProfile.avatar || 'img/personajes/amador-rivas.webp',
      questions: 0,
      finished: false,
      won: false,
      eliminated: []
    }
  });
  _duelRoomRef.onDisconnect().update({ [`players/${_duelMyUid}/disconnected`]: true });

  localStorage.setItem('activeDuelRoomCode', _duelRoomCode);

  // Mensaje de unión de sistema
  try {
    await _duelDb.ref(`duel_rooms/${_duelRoomCode}/chat`).push({
      username: "🤖 Sistema",
      avatar: "img/personajes/amador-rivas.webp",
      text: `${currentUserProfile.username} se unió a la partida`,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  } catch (e) {
    console.error("Error al enviar mensaje de sistema:", e);
  }

  hideDuelLobbyOverlay();
  // Si el juego ya empezó, entrar directamente a la partida en curso
  if (data.phase === 'playing') {
    _cachedDuelData = data;
    _startDuelGame(data);
  } else {
    _renderDuelWaitingRoom();
  }
  _subscribeDuelRoom();
}

// ── Sala de espera (host inicia) ──────────────────────
function _renderDuelWaitingRoom() {
  const displayedCode = _duelRoomCode.slice(0, 4) + '-' + _duelRoomCode.slice(4);
  const isHost = _duelMyUid === _getDuelRoomData()?.hostUid;

  const el = document.getElementById('duel-waiting-overlay');
  if (!el) return;
  el.style.display = 'flex';

  document.getElementById('duel-room-code-display').textContent = displayedCode;
  _refreshDuelPlayerList();

  const startBtn = document.getElementById('duel-start-btn');
  if (startBtn) startBtn.style.display = isHost ? 'block' : 'none';

  // Activar chat en vivo en la sala de espera
  if (typeof _initRoomChat === 'function') {
    _initRoomChat(_duelRoomCode);
  }
}

let _cachedDuelData = null;
function _getDuelRoomData() { return _cachedDuelData; }

// ── Suscripción a sala ────────────────────────────────
function _subscribeDuelRoom() {
  if (!_duelRoomRef) return;
  _duelRoomRef.on('value', snap => {
    if (!snap.exists()) return;
    _cachedDuelData = snap.val();

    // Alertas de desconexión en el chat local
    if (_cachedDuelData.players) {
      Object.entries(_cachedDuelData.players).forEach(([uid, p]) => {
        if (uid === _duelMyUid) return;
        if (p.disconnected && !_knownDisconnected.has(uid)) {
          _knownDisconnected.add(uid);
          _addLocalSystemChatMessage(`${p.name} se ha desconectado. ¡Puede reconectarse si recarga!`);
        } else if (!p.disconnected && _knownDisconnected.has(uid)) {
          _knownDisconnected.delete(uid);
          _addLocalSystemChatMessage(`${p.name} se ha reconectado.`);
        }
      });
    }

    _onDuelRoomUpdate(_cachedDuelData);
  });
}

function _onDuelRoomUpdate(data) {
  if (!data) return;

  // Actualizar lista de jugadores en la sala de espera
  if (data.phase === 'waiting') {
    const el = document.getElementById('duel-waiting-overlay');
    if (el && el.style.display === 'flex') _refreshDuelPlayerList();
    // Mostrar start btn solo al host
    const startBtn = document.getElementById('duel-start-btn');
    if (startBtn) startBtn.style.display = (data.hostUid === _duelMyUid) ? 'block' : 'none';
    return;
  }

  if (data.phase === 'playing') {
    // Ocultar sala de espera, arrancar juego
    const waitEl = document.getElementById('duel-waiting-overlay');
    if (waitEl) waitEl.style.display = 'none';

    if (!_duelSecret) {
      _startDuelGame(data);
    } else {
      // Solo actualizar el marcador lateral
      _refreshDuelScoreboard(data);
    }
  }

  if (data.phase === 'finished') {
    _showDuelResults(data);
  }
}

function _refreshDuelPlayerList() {
  const data = _cachedDuelData;
  if (!data || !data.players) return;
  const container = document.getElementById('duel-players-list');
  if (!container) return;

  const entries = Object.entries(data.players);
  container.innerHTML = entries.map(([uid, p]) => `
    <div class="duel-player-card">
      <img src="${p.avatar}" class="duel-player-avatar" onerror="this.src='img/personajes/amador-rivas.webp'">
      <div class="duel-player-name">${p.name}</div>
      ${uid === data.hostUid ? '<div class="duel-host-badge">👑 Anfitrión</div>' : ''}
    </div>
  `).join('');

  const countEl = document.getElementById('duel-players-count');
  if (countEl) countEl.textContent = `${entries.length}/8 jugadores`;
}

// ── El host inicia la partida ─────────────────────────
async function startDuelGame() {
  const data = _cachedDuelData;
  if (!data || data.hostUid !== _duelMyUid) return;
  const players = data.players || {};
  if (Object.keys(players).length < 2) {
    alert('Necesitas al menos 2 jugadores para iniciar el duelo. ¡Invita a tus amigos!');
    return;
  }

  // Seleccionar personaje secreto aleatorio de la dificultad configurada
  const secret = _pickDuelSecret(data.difficulty || 'basico');

  await _duelRoomRef.update({
    phase: 'playing',
    secretCharacter: secret.nombre,
    startedAt: firebase.database.ServerValue.TIMESTAMP
  });
}

function _pickDuelSecret(difficulty) {
  const pool = typeof ALL_CHARACTERS !== 'undefined' ? ALL_CHARACTERS : CHARACTERS;
  let candidates;
  if (difficulty === 'basico') candidates = pool.slice(0, 30);
  else if (difficulty === 'extenso') candidates = pool.slice(0, 60);
  else candidates = pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Arrancar el juego localmente ──────────────────────
function _startDuelGame(data) {
  const charName = data.secretCharacter || '';
  _duelSecret = (typeof ALL_CHARACTERS !== 'undefined' ? ALL_CHARACTERS : CHARACTERS)
    .find(c => c.nombre.toLowerCase() === charName.toLowerCase());

  const me = (data.players && _duelMyUid) ? data.players[_duelMyUid] : null;
  window._duelEliminated = (me && me.eliminated) ? Object.values(me.eliminated) : [];
  _duelQCount = (me && typeof me.questions !== 'undefined') ? me.questions : 0;
  _duelFinished = (me && typeof me.finished !== 'undefined') ? me.finished : false;

  const rightCol = document.querySelector('.quien-right');
  if (rightCol) rightCol.style.display = 'none';

  // Ocultar overlays de lobby
  hideDuelLobbyOverlay();
  const waitEl = document.getElementById('duel-waiting-overlay');
  if (waitEl) waitEl.style.display = 'none';

  // Mostrar el tablero de juego en modo duelo
  const wrap = document.querySelector('.quien-wrap');
  if (wrap) { wrap.classList.add('is-playing'); wrap.classList.remove('is-setup'); }

  // Renderizar el tablero con personajes disponibles
  if (typeof setGameDifficulty === 'function') setGameDifficulty(data.difficulty || 'basico');
  if (typeof renderBoard === 'function') renderBoard();

  // Mostrar panel lateral del duelo
  _renderDuelSidebar(data);

  // Instrucción inicial
  _setDuelStatus(`
    <div class="duel-status-box">
      <div style="font-size:1.5rem;margin-bottom:8px">⚔️</div>
      <h3 style="color:var(--accent);font-family:'Bebas Neue',sans-serif;letter-spacing:2px;margin:0 0 6px">¡DUELO INICIADO!</h3>
      <p style="color:var(--text2);font-size:0.85rem;margin:0 0 12px">Adivina el personaje secreto con el menor número de preguntas posible.</p>
      <p style="color:var(--text2);font-size:0.78rem;font-style:italic">Haz preguntas usando los botones de abajo.</p>
    </div>
  `);

  // Renderizar preguntas disponibles para el duelo
  _renderDuelQuestions();

  // Inicializar Chat en Vivo en Modo Duelo
  if (typeof _initRoomChat === 'function') {
    _initRoomChat(_duelRoomCode);
  }
}

// ── Panel lateral: marcador en tiempo real ────────────
function _renderDuelSidebar(data) {
  let sidebar = document.getElementById('duel-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'duel-sidebar';
    sidebar.className = 'duel-sidebar';
    document.querySelector('.quien-left')?.appendChild(sidebar);
  }
  _refreshDuelScoreboard(data);
}

function _refreshDuelScoreboard(data) {
  const sidebar = document.getElementById('duel-sidebar');
  if (!sidebar || !data || !data.players) return;

  const entries = Object.entries(data.players)
    .sort((a, b) => {
      if (a[1].won && !b[1].won) return -1;
      if (!a[1].won && b[1].won) return 1;
      if (a[1].finished && !b[1].finished) return -1;
      if (!a[1].finished && b[1].finished) return 1;
      return (a[1].questions || 0) - (b[1].questions || 0);
    });

  sidebar.innerHTML = `
    <div class="duel-sidebar-title">⚔️ Marcador en Vivo</div>
    ${entries.map(([uid, p], i) => {
    const isMe = uid === _duelMyUid;
    const statusIcon = p.won ? '🏆' : p.finished ? '❌' : '🔍';
    return `
        <div class="duel-sb-row ${isMe ? 'duel-sb-me' : ''}">
          <span class="duel-sb-rank">${i + 1}</span>
          <img class="duel-sb-avatar" src="${p.avatar}" onerror="this.src='img/personajes/amador-rivas.webp'">
          <div class="duel-sb-info">
            <div class="duel-sb-name">${p.name}${isMe ? ' (tú)' : ''}</div>
            <div class="duel-sb-q">${statusIcon} ${p.questions || 0} preguntas</div>
          </div>
        </div>
      `;
  }).join('')}
  `;
}

// ── Preguntas del duelo ───────────────────────────────
function _renderDuelQuestions() {
  const el = document.getElementById('quien-questions');
  if (!el) return;

  if (typeof Q_GROUPS === 'undefined') return;

  let html = `<div class="duel-q-panel">`;
  html += `<p class="duel-q-title">💬 Hacer una pregunta</p>`;

  Q_GROUPS.forEach(g => {
    html += `<details class="duel-q-group"><summary>${g.label}</summary><div class="duel-q-list">`;
    g.qs.forEach(q => {
      html += `<button id="qbtn-${q.id}" class="duel-q-btn" onclick="duelAskQuestion('${q.id}')">${q.text}</button>`;
    });
    html += `</div></details>`;
  });

  html += `</div>`;
  html += `<div style="margin-top:10px;padding:0 8px">
    <button class="guess-btn" onclick="showDuelGuessOverlay()" style="width:100%">🎯 Adivinar personaje</button>
  </div>`;
  html += `<div style="margin-top:10px;padding:0 8px">
    <button class="q-btn" style="width: 100%; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 0.9rem; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.15s;"
      onmouseover="this.style.transform='scale(1.02)'" 
      onmouseout="this.style.transform='scale(1)'"
      onclick="confirmAbandonGame()">
      🚪 ABANDONAR PARTIDA
    </button>
  </div>`;

  el.innerHTML = html;
}

function duelAskQuestion(qId) {
  if (!_duelSecret || _duelFinished) return;

  const q = (typeof Q_MAP !== 'undefined') ? Q_MAP[qId] : null;
  if (!q) {
    console.error("Pregunta no encontrada en Q_MAP:", qId);
    return;
  }

  // Evaluar la pregunta localmente contra el secreto
  let answer;
  try {
    answer = q.fn(_duelSecret);
  } catch (e) {
    answer = false;
  }

  _duelQCount++;
  _pushDuelLog(`❓ ${q.text}`, answer ? '✅ Sí' : '❌ No', answer);
  _updateMyDuelProgress();

  // Desactivar y colorear botón
  const btn = document.getElementById('qbtn-' + qId);
  if (btn) {
    btn.disabled = true;
    btn.classList.add(answer ? 'asked-yes' : 'asked-no');
    btn.innerHTML = q.text + (answer ? ' ✓' : ' ✗');
  }

  // Asegurar que window._duelEliminated sea siempre un Array real
  if (!window._duelEliminated) window._duelEliminated = [];
  if (!Array.isArray(window._duelEliminated)) {
    window._duelEliminated = Object.values(window._duelEliminated);
  }

  // Eliminar personajes que no cumplen la respuesta (usando pool completo de dificultad)
  const pool = (typeof ALL_CHARACTERS !== 'undefined') ? ALL_CHARACTERS : CHARACTERS;
  if (pool) {
    pool.forEach(c => {
      try {
        // Si la pregunta es de trabajos y el personaje es estudiante, nunca se debe bajar
        if (q.id.startsWith('occ_') && q.id !== 'occ_presidente' && q.id !== 'occ_estudiante') {
          if (c.ocupacion && c.ocupacion.some(o => /estudiante/i.test(o))) {
            return; // No se elimina, salta al siguiente
          }
        }
        const res = q.fn(c);
        if (res !== null && res !== answer && !window._duelEliminated.includes(c.nombre)) {
          window._duelEliminated.push(c.nombre);
        }
      } catch (e) {
        // Ignorar errores individuales
      }
    });
    _updateDuelBoard();
  }
}

function copyDuelRoomCode(btn) {
  if (!_duelRoomCode) return;
  const displayedCode = _duelRoomCode.slice(0, 4) + '-' + _duelRoomCode.slice(4);
  navigator.clipboard?.writeText(displayedCode).catch(() => { });
  if (btn) {
    btn.textContent = '✓ Copiado';
    setTimeout(() => btn.textContent = '📋 Copiar código', 2000);
  }
}

function _updateDuelBoard() {
  // Asegurar que window._duelEliminated sea siempre un Array real
  if (!window._duelEliminated) window._duelEliminated = [];
  if (!Array.isArray(window._duelEliminated)) {
    window._duelEliminated = Object.values(window._duelEliminated);
  }

  document.querySelectorAll('.quien-card-3d').forEach(card => {
    const name = card.dataset.name;
    // Quitar deal-anim: su animation-fill-mode:forwards bloquearía
    // el transform de .eliminated haciéndola invisible al voltearla
    card.classList.remove('deal-anim');
    if (window._duelEliminated.includes(name)) {
      card.classList.remove('active');
      card.classList.add('eliminated');
    } else {
      card.classList.add('active');
      card.classList.remove('eliminated');
    }
  });
}


let _duelLogItems = [];
function _pushDuelLog(question, answer, isYes) {
  _duelLogItems.push({ question, answer, isYes });

  const statusEl = document.getElementById('quien-status');
  if (!statusEl) return;

  let html = `<div class="duel-status-box"><p class="duel-log-title">📋 Historial</p>`;
  _duelLogItems.slice(-5).reverse().forEach(item => {
    html += `<div class="duel-log-item">
      <span class="duel-log-q">${item.question}</span>
      <span class="duel-log-a ${item.isYes ? 'yes' : 'no'}">${item.answer}</span>
    </div>`;
  });
  html += `</div>`;
  statusEl.innerHTML = html;
}

function _setDuelStatus(html) {
  const el = document.getElementById('quien-status');
  if (el) el.innerHTML = html;
}

async function _updateMyDuelProgress() {
  if (!_duelRoomRef || !_duelMyUid) return;
  await _duelRoomRef.update({
    [`players/${_duelMyUid}/questions`]: _duelQCount,
    [`players/${_duelMyUid}/eliminated`]: window._duelEliminated || []
  });
}

// ── Adivinar ──────────────────────────────────────────
function showDuelGuessOverlay() {
  let overlay = document.getElementById('duel-guess-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'duel-guess-overlay';
    overlay.className = 'quien-mode-overlay';
    overlay.innerHTML = `
      <div class="quien-mode-box" style="max-width:420px; width: 90%">
        <button class="lobby-back" onclick="document.getElementById('duel-guess-overlay').style.display='none'">← Cancelar</button>
        <div class="quien-intro-icon">🎯</div>
        <h2 class="quien-title">ADIVINAR PERSONAJE</h2>
        <p class="quien-desc">¿Quién es el personaje secreto?</p>
        <div class="search-wrap" style="width:100%;position:relative;margin-bottom:8px">
          <input id="duel-guess-input" class="lobby-input" placeholder="Escribe el nombre..."
            oninput="buildAutocomplete('duel-guess-input','duel-guess-ac',v=>{document.getElementById('duel-guess-input').value=v;})"
            onkeydown="if(event.key==='Enter')submitDuelGuess()">
          <div id="duel-guess-ac" class="autocomplete" style="display:none"></div>
        </div>

        <p style="color: var(--accent); font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem; text-align: left; margin: 4px 0 6px; letter-spacing: 1px;">📋 PERSONAJES VIVOS EN TU TABLERO:</p>
        <div id="duel-guess-alive-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 16px; justify-content: center; align-content: flex-start;">
          <!-- Se rellenará dinámicamente -->
        </div>

        <button class="quien-start-btn visible" style="margin:0 auto" onclick="submitDuelGuess()">¡Ese es!</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Obtener personajes vivos
  const eliminated = window._duelEliminated || [];
  const alive = CHARACTERS.filter(c => !eliminated.includes(c.nombre));

  // Rellenar la lista
  const aliveListEl = document.getElementById('duel-guess-alive-list');
  if (aliveListEl) {
    if (alive.length === 0) {
      aliveListEl.innerHTML = `<span style="color:var(--text2); font-size:0.8rem;">¡No queda nadie! 😲</span>`;
    } else {
      aliveListEl.innerHTML = alive.map(c => {
        return `
          <button class="alive-badge-btn" 
            style="background: rgba(240,192,32,0.1); border: 1px solid rgba(240,192,32,0.25); border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.76rem; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; transition: all 0.15s; outline: none;"
            onmouseover="this.style.background='rgba(240,192,32,0.2)'; this.style.borderColor='var(--accent)'"
            onmouseout="this.style.background='rgba(240,192,32,0.1)'; this.style.borderColor='rgba(240,192,32,0.25)'"
            onclick="document.getElementById('duel-guess-input').value='${c.nombre.replace(/'/g, "\\'")}'; document.getElementById('duel-guess-ac').style.display='none';">
            ${c.nombre}
          </button>
        `;
      }).join('');
    }
  }

  overlay.style.display = 'flex';
  document.getElementById('duel-guess-input').value = '';
  document.getElementById('duel-guess-ac').style.display = 'none';
  setTimeout(() => document.getElementById('duel-guess-input')?.focus(), 100);
}

async function submitDuelGuess() {
  const input = document.getElementById('duel-guess-input');
  const guess = (input?.value || '').trim();
  if (!guess || !_duelSecret) return;

  const overlay = document.getElementById('duel-guess-overlay');
  if (overlay) overlay.style.display = 'none';

  const won = guess.toLowerCase() === _duelSecret.nombre.toLowerCase();
  
  if (won) {
    _duelFinished = true;
    _duelQCount++; // El intento correcto de adivinar cuenta como acción

    await _duelRoomRef.update({
      [`players/${_duelMyUid}/finished`]: true,
      [`players/${_duelMyUid}/won`]: true,
      [`players/${_duelMyUid}/questions`]: _duelQCount
    });

    // Guardar en el ranking usando el API global para que cuente
    if (typeof StatsFirebase !== 'undefined' && StatsFirebase.saveGameResult) {
      try {
        await StatsFirebase.saveGameResult('quien_online', _duelQCount, true, _duelSecret.nombre);
      } catch (e) {
        console.error("Error guardando estadísticas de duelo:", e);
      }
    }

    // Verificar si todos terminaron para cerrar la partida
    const snap = await _duelRoomRef.once('value');
    const data = snap.val();
    const allDone = Object.values(data.players || {}).every(p => p.finished || p.disconnected);
    if (allDone) {
      await _duelRoomRef.update({ phase: 'finished' });
    }

    _setDuelStatus(`
      <div class="duel-status-box">
        <h3 style="color:#4ade80;font-family:'Bebas Neue',sans-serif;letter-spacing:2px">🏆 ¡HAS ADIVINADO!</h3>
        <p style="color:var(--text2)">Has adivinado a <strong>${_duelSecret.nombre}</strong> en <strong>${_duelQCount}</strong> preguntas. ¡Espera a que terminen los demás!</p>
      </div>
    `);
  } else {
    // Si falla, se le suman 2 intentos de penalización pero puede seguir adivinando
    _duelQCount += 2;
    
    await _duelRoomRef.update({
      [`players/${_duelMyUid}/questions`]: _duelQCount
    });

    _pushDuelLog(`🎯 Adivinar: ¿Es ${guess}?`, "❌ Incorrecto (+2 penalización)", false);
    _updateMyDuelProgress(); // Actualizar en Firebase para que los demás lo vean

    _setDuelStatus(`
      <div class="duel-status-box">
        <h3 style="color:#f87171;font-family:'Bebas Neue',sans-serif;letter-spacing:2px">❌ ¡FALLASTE!</h3>
        <p style="color:var(--text2)">El personaje no es <strong>${guess}</strong>.</p>
        <p style="color:#f87171;font-weight:bold;font-size:0.85rem">+2 preguntas de penalización.</p>
        <p style="color:var(--text2);font-size:0.78rem">¡No te rindas! Sigue preguntando o adivinando.</p>
      </div>
    `);
  }
}

// ── Resultados finales ────────────────────────────────
function _showDuelResults(data) {
  const players = Object.entries(data.players || {});
  const winners = players.filter(([, p]) => p.won).sort((a, b) => (a[1].questions || 99) - (b[1].questions || 99));
  const losers = players.filter(([, p]) => !p.won).sort((a, b) => (a[1].questions || 99) - (b[1].questions || 99));
  const sorted = [...winners, ...losers];
  const winner = winners[0];

  const secretChar = (typeof ALL_CHARACTERS !== 'undefined' ? ALL_CHARACTERS : CHARACTERS)
    .find(c => c.nombre === data.secretCharacter);
  const secretSlug = secretChar ? (secretChar.nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) : '';

  let overlay = document.getElementById('duel-results-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'duel-results-overlay';
    overlay.className = 'quien-mode-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="quien-mode-box duel-results-box">
      <div class="duel-results-header">
        <div class="duel-secret-reveal">
          <p style="color:var(--text2);font-size:0.8rem;margin:0 0 6px;letter-spacing:1px;font-family:'Barlow Condensed',sans-serif">EL PERSONAJE SECRETO ERA</p>
          <div class="quien-guess-avatar" style="margin:0 auto 8px;width:80px;height:80px">
            <img src="img/personajes/${secretSlug}.webp" alt="${data.secretCharacter}"
              onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else{this.style.display='none'}">
          </div>
          <h2 style="color:var(--accent);font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:3px;margin:0">${data.secretCharacter}</h2>
        </div>
        ${winner ? `<div class="duel-winner-banner">🏆 ¡Ganó <strong>${winner[1].name}</strong> con ${winner[1].questions} preguntas!</div>` : '<div class="duel-winner-banner">¡Nadie adivinó el personaje! 😅</div>'}
      </div>
      <div class="duel-results-list">
        ${sorted.map(([uid, p], i) => `
          <div class="duel-result-row ${uid === _duelMyUid ? 'duel-result-me' : ''}">
            <div class="duel-result-pos ${i === 0 && p.won ? 'gold' : i === 1 && p.won ? 'silver' : i === 2 && p.won ? 'bronze' : ''}">${i === 0 && p.won ? '🥇' : i === 1 && p.won ? '🥈' : i === 2 && p.won ? '🥉' : `${i + 1}º`}</div>
            <img class="duel-sb-avatar" src="${p.avatar}" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div class="duel-result-info">
              <div class="duel-sb-name">${p.name}${uid === _duelMyUid ? ' (tú)' : ''}</div>
              <div class="duel-sb-q">${p.won ? `✅ Adivinó en ${p.questions} preguntas` : `❌ No adivinó`}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
        <button class="guess-btn" onclick="duelPlayAgain()" style="background: var(--accent); color: #000; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 0.95rem; border: none; cursor: pointer; transition: transform 0.15s; display: inline-flex; align-items: center; gap: 6px;"
          onmouseover="this.style.transform='scale(1.02)'"
          onmouseout="this.style.transform='scale(1)'">
          🔄 Jugar de nuevo
        </button>
        <button class="q-btn" onclick="duelExit()" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; font-weight: bold; cursor: pointer; transition: all 0.2s; padding: 12px 24px; border-radius: 8px; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px;"
          onmouseover="this.style.background='rgba(239,68,68,0.2)'; this.style.borderColor='rgba(239,68,68,0.5)'; this.style.transform='scale(1.02)';"
          onmouseout="this.style.background='rgba(239,68,68,0.12)'; this.style.borderColor='rgba(239,68,68,0.3)'; this.style.transform='scale(1)';"
          onclick="duelExit()">
          🚪 Salir de la sala
        </button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';

  if (typeof confetti === 'function' && winner && winner[0] === _duelMyUid) {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }
}

async function duelPlayAgain() {
  const overlay = document.getElementById('duel-results-overlay');
  if (overlay) overlay.style.display = 'none';
  _cleanupDuel();
  showDuelLobbyOverlay();
}

function duelExit() {
  const overlay = document.getElementById('duel-results-overlay');
  if (overlay) overlay.style.display = 'none';
  _cleanupDuel();
  location.reload();
}

function _cleanupDuel() {
  if (_duelRoomRef) { _duelRoomRef.off(); _duelRoomRef = null; }
  _duelRoomCode = null;
  _duelMyUid = null;
  _duelSecret = null;
  window._duelEliminated = [];
  _duelQCount = 0;
  _duelFinished = false;
  _duelLogItems = [];
  window._duelRoomCode = null;
  window._resolverMode = false;
  localStorage.removeItem('activeDuelRoomCode');

  // Ocultar todos los overlays de duelo para evitar que se queden abiertos y bugeen la pantalla
  ['duel-waiting-overlay', 'duel-results-overlay', 'duel-lobby-overlay', 'duel-guess-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const rightCol = document.querySelector('.quien-right');
  if (rightCol) rightCol.style.display = 'block';

  const sidebar = document.getElementById('duel-sidebar');
  if (sidebar) sidebar.remove();

  if (typeof _destroyRoomChat === 'function') {
    _destroyRoomChat();
  }
}

async function exitDuelWaitingRoom() {
  if (_duelRoomRef && _duelMyUid) {
    try {
      await _duelRoomRef.child(`players/${_duelMyUid}`).remove();
    } catch (e) {
      console.error("Error removiendo jugador de la sala de espera de duelo:", e);
    }
  }
  _cleanupDuel();
  showModeOverlay();
}

function _duelLobbyError(msg) {
  const el = document.getElementById('duel-lobby-error');
  if (el) el.textContent = msg;
}

// ── Sistema de Reconexión de Duelo ────────────────────
async function checkDuelingRoomReconnection() {
  // Solo reconectar si estamos en la página del juego
  if (!document.getElementById('quien-board')) return;

  const activeCode = localStorage.getItem('activeDuelRoomCode');
  const banner = document.getElementById('duel-reconnect-banner');
  if (!activeCode) {
    if (banner) banner.style.display = 'none';
    return;
  }

  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;

  if (!_duelFbInit()) return;

  const ref = _duelDb.ref('duel_rooms/' + activeCode);
  const snap = await ref.once('value');
  if (!snap.exists()) {
    localStorage.removeItem('activeDuelRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  const data = snap.val();
  // No reconectar si la partida ya terminó
  if (data.phase === 'finished') {
    localStorage.removeItem('activeDuelRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  // Verificar que el usuario sea parte de los jugadores de la sala
  if (!data.players || !data.players[savedUser]) {
    localStorage.removeItem('activeDuelRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  // Verificar que al menos un OTRO jugador sigue conectado (sala no abandonada)
  const otherPlayers = Object.entries(data.players).filter(([uid]) => uid !== savedUser);
  const hayAlguienConectado = otherPlayers.some(([, p]) => !p.disconnected);
  if (!hayAlguienConectado && otherPlayers.length > 0) {
    // Todos los demás están desconectados → sala abandonada, limpiar
    localStorage.removeItem('activeDuelRoomCode');
    if (banner) banner.style.display = 'none';
    return;
  }

  // Mostrar el banner de reconexión
  if (banner) {
    banner.style.display = 'flex';
  }
}

async function reconnectActiveDuelGame() {
  const activeCode = localStorage.getItem('activeDuelRoomCode');
  if (!activeCode) return;

  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;

  if (!_duelFbInit()) return;

  const ref = _duelDb.ref('duel_rooms/' + activeCode);
  const snap = await ref.once('value');
  if (!snap.exists()) {
    localStorage.removeItem('activeDuelRoomCode');
    return;
  }

  const data = snap.val();
  if (data.phase === 'finished') {
    localStorage.removeItem('activeDuelRoomCode');
    return;
  }

  // Verificar que el usuario sea parte de los jugadores de la sala
  if (!data.players || !data.players[savedUser]) {
    localStorage.removeItem('activeDuelRoomCode');
    return;
  }

  // Auto-reconectar restaurando variables locales
  _duelRoomCode = activeCode;
  _duelMyUid = savedUser;
  _duelRoomRef = ref;
  window._duelRoomCode = _duelRoomCode;
  _cachedDuelData = data; // Sincronizar datos de la sala antes de renderizar
  gameMode = 'duelo'; // Asegurar marcar el modo de juego como duelo

  // Quitar el flag de desconectado
  await _duelRoomRef.update({
    [`players/${_duelMyUid}/disconnected`]: null
  });
  _duelRoomRef.onDisconnect().update({ [`players/${_duelMyUid}/disconnected`]: true });

  hideModeOverlay();
  hideDuelLobbyOverlay();
  const banner = document.getElementById('duel-reconnect-banner');
  if (banner) banner.style.display = 'none';

  if (data.phase === 'waiting') {
    _renderDuelWaitingRoom();
  } else if (data.phase === 'playing') {
    _startDuelGame(data);
  }
  _subscribeDuelRoom();
}

// Variables y utilidades locales del sistema de chat
const _knownDisconnected = new Set();

function _addLocalSystemChatMessage(text) {
  const el = document.getElementById('room-chat-messages');
  if (!el) return;

  const placeholder = el.querySelector('p[data-placeholder]');
  if (placeholder) placeholder.remove();

  const isRecon = text.includes('reconect') || text.includes('✅');
  const bg = isRecon ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)";
  const border = isRecon ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(239, 68, 68, 0.5)";
  const color = isRecon ? "#4ade80" : "#f87171";
  const icon = isRecon ? "✅" : "⚠️";

  // Quitar emojis duplicados del inicio si ya los pasaron
  let cleanText = text.replace(/^[⚠️✅]\s*/, "");

  const bubble = document.createElement('div');
  bubble.style.cssText = "display:flex; justify-content:center; margin-bottom:8px; animation:fadeInMsg 0.2s ease;";
  bubble.innerHTML = `
    <div style="background:${bg}; border:${border}; border-radius:12px; padding:6px 14px; font-size:0.75rem; color:${color}; text-align:center; max-width:85%; font-family:sans-serif; font-weight:500;">
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
