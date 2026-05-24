/* ================================================
   LQSACatena — Modo Quién es Quién (turno a turno)
   Ambos eligen un personaje secreto.
   Tú preguntas → máquina responde.
   Máquina pregunta → tú respondes.
   Primero en adivinar gana.
   ================================================ */

// Ocupaciones que no caben en ninguna categoría—personajes con solo estas no se eliminan
const _UNCAT_OCC = /^(desconocido|reposter[ií]a|monja|internada|estudiante|sacerdote|hombre florero|varios trabajos|desempleado|gi go|gígolo)$/i;
function _hasKnownOcc(c) {
  return c.ocupacion.some(o => !_UNCAT_OCC.test(o));
}
// Envuelve un fn de ocupación: devuelve null si el personaje sólo tiene ocupaciones no categorizables
function _occ(fn) { return c => _hasKnownOcc(c) ? fn(c) : null; }
const Q_GROUPS = [
  {
    label: 'Básico',
    qs: [
      { id: 'female', text: '¿Es mujer?', fn: c => c.genero.includes('Femenino') },
      { id: 'male', text: '¿Es hombre?', fn: c => c.genero.includes('Masculino') },
      { id: 'hijos', text: '¿Tiene hijos?', fn: c => c.hijos > 0 },
      { id: 'principal', text: '¿Es principal?', fn: c => c.tipo === 'Principal' },
      { id: 'secundario', text: '¿Es secundario?', fn: c => c.tipo === 'Secundario' },
      { id: 'esporadico', text: '¿Es esporádico?', fn: c => c.tipo === 'Esporádico' || c.tipo === 'Episódico' },
    ]
  },
  {
    label: 'Temporadas',
    qs: [
      { id: 'seas_t1', text: '¿Aparece por primera vez en la T1?', fn: c => c.temporadaAparicion === 1 },
      { id: 'seas_early', text: '¿Aparece por primera vez entre T2-T6?', fn: c => c.temporadaAparicion >= 2 && c.temporadaAparicion <= 6 },
      { id: 'seas_late', text: '¿Aparece por primera vez en la T7+?', fn: c => c.temporadaAparicion >= 7 },
      { id: 'seas_cont', text: '¿Aparece por primera vez en Contubernio (T13+)?', fn: c => c.temporadaAparicion >= 13 },
    ]
  },
  {
    label: 'Edificios',
    qs: [
      { id: 'edif_mont', text: '¿Vive/Vivió Montepinar?', fn: c => c.piso_montepinar.some(p => p !== 'No aparece' && p !== 'Fuera') },
      { id: 'edif_cont', text: '¿Vive/Vivió Contubernio?', fn: c => c.piso_contubernio.some(p => p !== 'No aparece' && p !== 'Fuera') },
      { id: 'edif_fuera', text: '¿Es un externo (Fuera)?', fn: c => !c.piso_montepinar.some(p => p !== 'No aparece' && p !== 'Fuera') && !c.piso_contubernio.some(p => p !== 'No aparece' && p !== 'Fuera') },
    ]
  },
  {
    label: 'Planta de la vivienda',
    qs: [
      { id: 'floor_bajo', text: '¿Ha vivido en el Bajo?', fn: c => c.piso_montepinar.concat(c.piso_contubernio).some(p => /bajo/i.test(p)) },
      { id: 'floor_1', text: '¿Ha vivido en el 1º?', fn: c => c.piso_montepinar.concat(c.piso_contubernio).some(p => /1º|1o/i.test(p)) },
      { id: 'floor_2', text: '¿Ha vivido en el 2º?', fn: c => c.piso_montepinar.concat(c.piso_contubernio).some(p => /2º|2o/i.test(p)) },
      { id: 'floor_3', text: '¿Ha vivido en el 3º?', fn: c => c.piso_montepinar.concat(c.piso_contubernio).some(p => /3º|3o/i.test(p)) },
      { id: 'floor_atico', text: '¿Ha vivido en el ático?', fn: c => c.piso_montepinar.concat(c.piso_contubernio).some(p => /ático|atico/i.test(p)) },
    ]
  },
  {
    label: 'Origen / Apariencia',
    qs: [
      { id: 'origen_esp', text: '¿Es de España?', fn: c => c.origen === 'España' },
      { id: 'origen_ext', text: '¿Es extranjero?', fn: c => c.origen !== 'España' },
    ]
  },
  {
    label: 'Profesión / Ocupación',
    qs: [
      // Casa / Jubilado
      { id: 'occ_casa', text: '¿Ama de casa/Jubilado?', desc: 'Ama de casa, Jubilado', fn: _occ(c => c.ocupacion.some(o => /ama de casa|jubilad/i.test(o))) },
      // Negocios / Poder / Oficina
      { id: 'occ_negocio', text: '¿Negocios/Oficina?', desc: 'Empresario, Vendedor, Banquero, Político, Abogado, Informático, Marqués, Inspector de hacienda, Representante, Wedding planner, Diseñador', fn: _occ(c => c.ocupacion.some(o => /empresario|vendedor|banquero|pol[ií]tico|abogado|inform[aá]tico|marqu[eé]s|hacienda|representante|wedding|dise[nñ]ador/i.test(o) && !/filtros/i.test(o))) },
      // Oficio / Servicio / Sanidad
      { id: 'occ_oficio', text: '¿Oficio/Servicio?', desc: 'Conserje, Sirviente, Pescadero/a, Camarero, Masajista, Dentista, Psicólogo, Vigilante, Peluquero, Estilista, Jardinero, Terapeuta, Espetero, Cocinero, Farmacéutico/a, Profesor/a, Vendedor de filtros de agua', fn: _occ(c => c.ocupacion.some(o => /conserje|sirviente|pescader|camarero|masajista|dentista|psic[oó]logo|vigilante|peluquer|estilista|jardinero|terapeuta|espetero|cocinero|farmac[eé]utic|profesor|filtros/i.test(o))) },
      // Arte / Entretenimiento
      { id: 'occ_artistico', text: '¿Arte/Entretenimiento?', desc: 'Actor, Actriz, Artista, Fotógrafo, Escritor, Pianista, DJ, Payaso, Cómico, Gigoló, Director (de cine), Influencer', fn: _occ(c => c.ocupacion.some(o => /actor|actriz|artista|fot[oó]grafo|escritor|pianista|\bDJ\b|payaso|c[oó]mico|gigol[oó]|director|influencer/i.test(o))) },
      // Ilegal / Marginal
      { id: 'occ_ilegal', text: '¿Ilegal/Marginal?', desc: 'Ladrón, Traficante, Yonki, Exconvicto, Prostituta', fn: _occ(c => c.ocupacion.some(o => /ladr[oó]n|traficante|yonki|exconvicto|prostitut/i.test(o))) },
      // Estudiante
      { id: 'occ_estudiante', text: '¿Es estudiante?', desc: 'Estudiante', fn: c => c.ocupacion && c.ocupacion.some(o => /estudiante/i.test(o)) },
      // Presidencia de comunidad
      { id: 'occ_presidente', text: '¿Ha sido presidente/a?', desc: 'Presidente de comunidad de vecinos', fn: c => c.presidente },
    ]
  },
];

const Q_MAP = {};
Q_GROUPS.forEach(g => g.qs.forEach(q => Q_MAP[q.id] = q));

// ── Estado global ────────────────────────────────────
let CHARACTERS = [...ALL_CHARACTERS];
let gameDifficulty = 'dios'; // 'basico', 'extenso', 'dios'
let gameMode = 'machine'; // 'machine' | 'online'
let onlineAnswers = {};         // { questionId: bool } respuestas recibidas en online
let mySecret = null;
let machineSecret = null;
let playerElim = new Set();
let machineCands = [];
let askedByPlayer = new Set();
let askedByMachine = new Set();
let phase = 'idle';
let turnCount = 0;
let busy = false;
let _boardBuilt = false; // el DOM del tablero solo se construye una vez
let manualDiscardMode = false; // descarte manual activado
let statsSavedForCurrentGame = false;
window._resolverMode = false; // MODO RESOLVER PERSONAJE (por defecto desactivado)

// ── Precarga de fotos en segundo plano ───────────────
window.addEventListener('load', function () {
  setTimeout(function () {
    CHARACTERS.forEach(function (c) {
      var img = new Image();
      img.src = 'img/personajes/' + makeSlug(c.nombre) + '.webp';
    });
  }, 1500); // esperar a que cargue lo importante primero
});

// ── Init: muestra selector de modo ───────────────────
function initGame() {
  if (typeof cleanupOnlineRoom === 'function') cleanupOnlineRoom();
  gameMode = 'machine';
  onlineAnswers = {};
  mySecret = null;
  machineSecret = null;
  playerElim = new Set();
  machineCands = [];
  askedByPlayer = new Set();
  askedByMachine = new Set();
  phase = 'idle';
  turnCount = 0;
  busy = false;

  const wrap = document.querySelector('.quien-wrap');
  if (wrap) wrap.classList.remove('manual-mode');
  wrap.classList.remove('is-setup', 'is-playing');
  document.getElementById('quien-start-btn').classList.remove('visible');
  renderBoard();
  updateMyCard(null);
  renderQuestions(false);
  setStatus('');
  manualDiscardMode = false;
  clearHistory();
  renderGodActions();
}

// ── Dificultad ────────────────────────────────────────
function setGameDifficulty(diff) {
  gameDifficulty = diff;
  let count = ALL_CHARACTERS.length;
  if (diff === 'basico') count = 30;
  if (diff === 'extenso') count = 60;

  if (count < ALL_CHARACTERS.length) {
    if (window._duelRoomCode || gameMode === 'online') {
      // No barajar en multijugador ni en modo duelo para tener los mismos tableros deterministas
      CHARACTERS = [...ALL_CHARACTERS].slice(0, count);
    } else {
      // Barajar en modo un jugador contra la máquina
      let shuffled = [...ALL_CHARACTERS].sort(() => 0.5 - Math.random());
      CHARACTERS = shuffled.slice(0, count);
    }
  } else {
    CHARACTERS = [...ALL_CHARACTERS];
  }

  // Reconstruir filas de tablero porque la cantidad cambió
  _boardBuilt = false;
  buildBoardRows();
}

function buildBoardRows() {
  BOARD_ROWS = [];
  for (let i = 0; i < CHARACTERS.length; i += 10) {
    BOARD_ROWS.push(CHARACTERS.slice(i, i + 10));
  }
}

// ── Iniciar partida vs máquina ────────────────────────
function startMachineGame() {
  gameMode = 'machine';
  machineSecret = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  playerElim = new Set();
  machineCands = [...CHARACTERS];
  askedByPlayer = new Set();
  askedByMachine = new Set();
  phase = 'setup';
  turnCount = 0;
  busy = false;

  const wrap = document.querySelector('.quien-wrap');
  wrap.classList.remove('is-playing');
  wrap.classList.add('is-setup');
  document.getElementById('quien-start-btn').classList.remove('visible');
  // Forzar reconstrucción para que la animación de repartir sea visible
  _boardBuilt = false;
  renderBoard();
  updateMyCard(null);
  renderQuestions(false);
  setStatus('');
  document.getElementById('quien-board').classList.add('is-setup');
}

// ── Botón "¡Comenzar!" (máquina u online) ────────────
function onStartBtnClick() {
  if (gameMode === 'online') onlineConfirmReady();
  else startGame();
}

function boardClick(nombre) {
  if (window._duelRoomCode) {
    if (typeof _duelFinished !== 'undefined' && _duelFinished) return;
    if (window._resolverMode) {
      toggleCardFlipManual(nombre, null);
    } else {
      showCharacterInfoModal(nombre);
    }
    return;
  }

  if (gameMode === 'detective') {
    if (window._resolverMode) {
      toggleCardFlipManual(nombre, null);
    } else {
      showCharacterInfoModal(nombre);
    }
    return;
  }

  if (phase === 'setup') {
    if (gameMode === 'online') onlineSelectSecret(nombre);
    else selectSecret(nombre);
  } else if (phase !== 'idle' && phase !== 'gameover') {
    if (window._resolverMode) {
      toggleCardFlipManual(nombre, null);
    } else {
      showCharacterInfoModal(nombre);
    }
  }
}

function selectSecret(nombre) {
  mySecret = CHARACTERS.find(c => c.nombre === nombre);
  const slug = makeSlug(nombre);
  updateMyCard(mySecret);
  renderBoard();
  document.getElementById('quien-board').classList.add('is-setup');
  // Mostrar botón comenzar
  document.getElementById('quien-start-btn').classList.add('visible');
  // Marcar la tarjeta elegida
  document.querySelectorAll('.quien-card-3d').forEach(el => {
    el.classList.toggle('my-secret', el.dataset.name === nombre);
  });
  setStatus('');
}

function startGame() {
  if (!mySecret) return;
  statsSavedForCurrentGame = false;
  phase = 'player_turn';
  const wrap2 = document.querySelector('.quien-wrap');
  wrap2.classList.remove('is-setup');
  wrap2.classList.add('is-playing');
  document.getElementById('quien-board').classList.remove('is-setup');
  document.getElementById('quien-start-btn').classList.remove('visible');
  renderBoard();
  renderQuestions(true);
  setStatus(playerTurnStatus());
  renderGodActions();

  if (typeof gameMode !== 'undefined' && gameMode === 'contrarreloj') {
    if (typeof _startContrarrelojTimer === 'function' && typeof _contrarrelojTimeUp === 'function') {
      _startContrarrelojTimer(_contrarrelojTimeUp);
    }
  }
}

// ── Turno del jugador ────────────────────────────────
function playerTurnStatus() {
  const rem = CHARACTERS.length - playerElim.size;
  if (gameMode === 'online') return `
    <div class="quien-turn-player">
      <p class="turn-badge">🗣️ Tu turno</p>
      <p class="quien-desc">Pregunta sobre el personaje del oponente o adivina directamente.</p>
      <p class="quien-remaining">El oponente podría ser <strong>${rem}</strong> personaje${rem !== 1 ? 's' : ''}</p>
    </div>`;
  return `
    <div class="quien-turn-player">
      <p class="turn-badge">🗣️ Tu turno</p>
      <p class="quien-desc">Pregunta sobre mi personaje o haz clic en el tablero si ya sabes quién soy.</p>
      <p class="quien-remaining">Yo podría ser <strong>${rem}</strong> personaje${rem !== 1 ? 's' : ''}</p>
    </div>`;
}

function playerAskQuestion(id) {
  if (gameMode === 'online') { onlineAskQuestion(id); return; }
  if (busy || phase !== 'player_turn' || askedByPlayer.has(id)) return;

  if (typeof gameMode !== 'undefined' && gameMode === 'contrarreloj') {
    if (typeof _stopContrarrelojTimer === 'function') {
      _stopContrarrelojTimer();
    }
  }

  busy = true;

  const q = Q_MAP[id];
  const ans = q.fn(machineSecret);

  askedByPlayer.add(id);

  // Actualizar botón
  const btn = document.getElementById('qbtn-' + id);
  if (btn) {
    btn.disabled = true;
    btn.classList.add(ans ? 'asked-yes' : 'asked-no');
    btn.textContent = q.text + (ans ? ' ✓' : ' ✗');
  }

  // Eliminar del tablero del jugador — null significa "profesion desconocida", no se elimina.
  // Además, si es estudiante, nunca se debe bajar en preguntas de trabajo (que empiecen por occ_ y no sean occ_presidente ni occ_estudiante)
  CHARACTERS.filter(c => {
    if (q.id.startsWith('occ_') && q.id !== 'occ_presidente' && q.id !== 'occ_estudiante') {
      if (c.ocupacion && c.ocupacion.some(o => /estudiante/i.test(o))) {
        return false;
      }
    }
    const r = q.fn(c);
    return r !== null && r !== ans;
  }).forEach(c => playerElim.add(c.nombre));

  addHistoryItem("Tú", q.text, ans);

  const rem = CHARACTERS.length - playerElim.size;
  setStatus(`
    <div class="quien-answer ${ans ? 'answer-yes' : 'answer-no'}">
      <p class="quien-question-asked">${q.text}</p>
      <div class="quien-answer-badge">${ans ? '✓ SÍ' : '✗ NO'}</div>
      <p class="quien-remaining">Quedan <strong>${rem}</strong> posible${rem !== 1 ? 's' : ''}</p>
    </div>`);
  renderBoard();

  setTimeout(() => {
    busy = false;
    phase = 'machine_turn';
    renderQuestions(false);
    doMachineTurn();
  }, 1400);
}

function playerGuess(nombre) {
  if (gameMode === 'online') { onlinePlayerGuess(nombre); return; }
  if (busy || phase !== 'player_turn') return;
  if (playerElim.has(nombre)) return;

  busy = true;
  phase = 'gameover';
  renderQuestions(false);
  renderGodActions();

  const correct = nombre === machineSecret.nombre;
  addHistoryItem("Tú", `¿Eres ${nombre}?`, correct);

  // Save stats to Firebase exactly once
  if (typeof StatsFirebase !== 'undefined' && !statsSavedForCurrentGame) {
    statsSavedForCurrentGame = true;
    StatsFirebase.saveGameResult('quien_machine', askedByPlayer.size, correct, machineSecret ? machineSecret.nombre : null);
  }
  if (correct) {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
    const slug = makeSlug(nombre);
    setStatus(`
      <div class="quien-result">
        <p class="quien-result-label">¡Has ganado! 🎉</p>
        <div class="quien-guess-avatar win-avatar">
          <img src="img/personajes/${slug}.webp" alt="${nombre}"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        </div>
        <h2 class="quien-guess-name">${nombre}</h2>
        <p class="quien-desc">Era mi personaje. Lo has adivinado en <strong>${turnCount}</strong> ronda${turnCount !== 1 ? 's' : ''}.</p>
        <button class="guess-btn" onclick="initGame()" style="margin-top:14px">Jugar de nuevo</button>
      </div>`);
    document.querySelectorAll('.quien-card-3d').forEach(el => {
      el.classList.toggle('winner', el.dataset.name === nombre);
      el.classList.toggle('eliminated', el.dataset.name !== nombre);
    });
  } else {
    // Fallo → el jugador pierde
    const slug = makeSlug(machineSecret.nombre);
    setStatus(`
      <div class="quien-result">
        <p class="quien-result-label" style="color:#f87171">¡Has fallado!</p>
        <div class="quien-guess-avatar">
          <img src="img/personajes/${slug}.webp" alt="${machineSecret.nombre}"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        </div>
        <h2 class="quien-guess-name">${machineSecret.nombre}</h2>
        <p class="quien-desc">Era <strong>${machineSecret.nombre}</strong>. Más suerte la próxima vez.</p>
        <button class="guess-btn" onclick="initGame()" style="margin-top:14px">Jugar de nuevo</button>
      </div>`);
  }
}

// ── Turno de la máquina ──────────────────────────────
function doMachineTurn() {
  turnCount++;

  // ¿La máquina puede adivinar?
  if (machineCands.length === 1) {
    machineGuesses(machineCands[0]);
    return;
  }
  if (machineCands.length === 0) {
    // No debería ocurrir, pero si pasa, rendirse
    phase = 'player_turn';
    renderQuestions(true);
    setStatus(playerTurnStatus());
    busy = false;
    return;
  }

  const q = getBestMachineQuestion();

  if (!q) {
    // Sin preguntas útiles → adivinar al azar entre candidatos
    machineGuesses(machineCands[0]);
    return;
  }

  askedByMachine.add(q.id);

  setStatus(`
    <div class="quien-machine-ask">
      <p class="turn-badge">🤖 Mi turno</p>
      <p class="quien-question-asked" style="font-size:0.8rem;margin-bottom:10px">
        Me quedan <strong>${machineCands.length}</strong> candidato${machineCands.length !== 1 ? 's' : ''} sobre ti
      </p>
      <h2 class="quien-question">${q.text}</h2>
      <p class="quien-desc" style="font-size:0.8rem;margin-bottom:16px">Sobre tu personaje secreto</p>
      <div class="quien-btns">
        <button class="quien-btn-yes" onclick="playerAnswerMachine('${q.id}', true)">✓ Sí</button>
        <button class="quien-btn-no"  onclick="playerAnswerMachine('${q.id}', false)">✗ No</button>
      </div>
    </div>`);
}

function playerAnswerMachine(qId, yes) {
  if (busy) return;
  busy = true;

  const q = Q_MAP[qId];
  // Filtrar candidatos de la máquina — ignorar null (profesion desconocida)
  machineCands = yes
    ? machineCands.filter(c => q.fn(c) !== false)
    : machineCands.filter(c => q.fn(c) !== true);

  addHistoryItem("Máquina", q.text, yes);

  const rem = machineCands.length;
  setStatus(`
    <div class="quien-answer ${yes ? 'answer-yes' : 'answer-no'}">
      <p class="quien-question-asked">${q.text}</p>
      <div class="quien-answer-badge">${yes ? '✓ SÍ' : '✗ NO'}</div>
      <p class="quien-remaining">Me quedan <strong>${rem}</strong> candidato${rem !== 1 ? 's' : ''} sobre ti</p>
    </div>`);

  setTimeout(() => {
    busy = false;
    if (machineCands.length === 1) {
      machineGuesses(machineCands[0]);
    } else {
      phase = 'player_turn';
      renderQuestions(true);
      setStatus(playerTurnStatus());
    }
  }, 1200);
}

function machineGuesses(char) {
  const slug = makeSlug(char.nombre);
  setStatus(`
    <div class="quien-machine-ask">
      <p class="turn-badge">🤖 Mi turno</p>
      <p class="quien-question" style="font-size:1.2rem;margin-bottom:12px">¿Tu personaje es...</p>
      <div class="quien-guess-avatar" style="margin:0 auto 10px;border-color:var(--accent)">
        <img src="img/personajes/${slug}.webp" alt="${char.nombre}"
          onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
      </div>
      <h2 class="quien-guess-name">${char.nombre}</h2>
      <div class="quien-btns" style="margin-top:14px">
        <button class="quien-btn-yes" onclick="onMachineGuessResult('${char.nombre}', true)">✓ Sí</button>
        <button class="quien-btn-no"  onclick="onMachineGuessResult('${char.nombre}', false)">✗ No</button>
      </div>
    </div>`);
}

function onMachineGuessResult(nombre, correct) {
  addHistoryItem("Máquina", `¿Eres ${nombre}?`, correct);
  if (correct) {
    // Máquina gana
    phase = 'gameover';
    renderGodActions();
    const mySlug = makeSlug(mySecret.nombre);
    const machSlug = makeSlug(machineSecret.nombre);
    setStatus(`
      <div class="quien-result">
        <p class="quien-result-label" style="color:#f87171">¡Ha ganado la máquina! 🤖</p>
        <p style="font-size:0.8rem;color:var(--text2);margin:4px 0 8px">Tu personaje era:</p>
        <div class="quien-guess-avatar" style="border-color:#f87171;margin:0 auto 6px">
          <img src="img/personajes/${mySlug}.webp" alt="${mySecret.nombre}"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        </div>
        <h2 class="quien-guess-name">${mySecret.nombre}</h2>
        <div style="margin:14px 0 6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
          <p style="font-size:0.8rem;color:var(--text2);margin:0 0 8px">Mi personaje era:</p>
          <div class="quien-guess-avatar" style="border-color:var(--accent);margin:0 auto 6px">
            <img src="img/personajes/${machSlug}.webp" alt="${machineSecret.nombre}"
              onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
          </div>
          <h2 class="quien-guess-name" style="font-size:1.1rem">${machineSecret.nombre}</h2>
        </div>
        <p class="quien-desc">La partida duró <strong>${turnCount}</strong> ronda${turnCount !== 1 ? 's' : ''}.</p>
        <button class="guess-btn" onclick="initGame()" style="margin-top:14px">Revancha</button>
      </div>`);
  } else {
    // La máquina falla → elimina ese candidato y pasa el turno al jugador
    machineCands = machineCands.filter(c => c.nombre !== nombre);
    busy = false;
    phase = 'player_turn';
    renderQuestions(true);
    setStatus(`
      <div class="quien-turn-player">
        <p class="turn-badge" style="color:#f87171">🤖 Fallo de la máquina</p>
        <p class="quien-desc">No era <strong>${nombre}</strong>. Ahora es tu turno.</p>
      </div>`);
    setTimeout(() => {
      if (phase === 'player_turn') setStatus(playerTurnStatus());
    }, 1800);
  }
}

// ── Estrategia de preguntas (máquina) ───────────────
function getBestMachineQuestion() {
  let best = null, bestScore = Infinity;
  for (const g of Q_GROUPS) {
    for (const q of g.qs) {
      if (askedByMachine.has(q.id)) continue;
      // Contar sólo los que tienen respuesta definida (no null)
      const yes = machineCands.filter(c => q.fn(c) === true).length;
      const no = machineCands.filter(c => q.fn(c) === false).length;
      if (yes === 0 || no === 0) continue;
      const score = Math.abs(yes - no);
      if (score < bestScore) { bestScore = score; best = q; }
    }
  }
  return best;
}

// ── Render tablero 3D ────────────────────────────────
let BOARD_ROWS = [];
buildBoardRows();

function renderBoard() {
  const el = document.getElementById('quien-board');
  if (!el) return;

  // Actualizar/mostrar botón de resolver
  renderResolverToggle();

  // Construir el DOM solo la primera vez — las fotos quedan cacheadas
  if (!_boardBuilt) {
    let cardIdx = 0;
    el.innerHTML = BOARD_ROWS.map(row => `
      <div class="quien-3d-row">
        ${row.map(c => {
      const slug = makeSlug(c.nombre);
      return `
            <div class="quien-card-wrapper" onclick="boardClick('${c.nombre.replace(/'/g, "\\'")}')">
              <div class="quien-card-3d active deal-anim" style="--card-idx: ${cardIdx++}"
                   data-name="${c.nombre}">
                <img src="img/personajes/${slug}.webp" alt="${c.nombre}"
                  onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
                <span class="card-name">${c.nombre.split(' ')[0]}</span>
              </div>
            </div>`;
    }).join('')}
      </div>`
    ).join('');
    _boardBuilt = true;

    // Si estamos en Modo Duelo, aplicar el estado inicial de cartas eliminadas
    if (window._duelRoomCode && typeof window._duelEliminated !== 'undefined') {
      _updateDuelBoard();
    }
    return;
  }

  // Solo actualizar clases en llamadas sucesivas (ya no hay deal-anim)
  el.querySelectorAll('.quien-card-3d').forEach(card => {
    const nombre = card.dataset.name;
    const out = window._duelRoomCode && typeof window._duelEliminated !== 'undefined'
      ? window._duelEliminated.includes(nombre)
      : playerElim.has(nombre);
    const secret = phase === 'setup' && mySecret && nombre === mySecret.nombre;
    card.className = 'quien-card-3d ' + (out ? 'eliminated' : 'active') + (secret ? ' my-secret' : '');
  });
}

// ── Controladores Modo Resolver y Volteo ───────────────
function toggleResolverMode() {
  window._resolverMode = !window._resolverMode;
  renderResolverToggle();
}

function renderResolverToggle() {
  let container = document.getElementById('quien-resolver-toggle-container');
  if (!container) {
    const board = document.getElementById('quien-board');
    if (!board) return;
    container = document.createElement('div');
    container.id = 'quien-resolver-toggle-container';
    container.className = 'resolver-toggle-container';
    board.parentNode.insertBefore(container, board);
  }

  const isPlaying = (phase !== 'idle' && phase !== 'gameover' && phase !== 'setup') || (window._duelRoomCode && typeof _duelFinished !== 'undefined' && !_duelFinished);
  if (!isPlaying || (window._duelRoomCode && gameDifficulty !== 'dios')) {
    container.style.display = 'none';
    if (window._duelRoomCode && gameDifficulty !== 'dios') {
      window._resolverMode = false; // Forzar modo información en modo duelo no-dios
    }
    return;
  }

  container.style.display = 'block';
  const active = !!window._resolverMode;

  container.innerHTML = `
    <button class="resolver-toggle-btn ${active ? 'active' : ''}" onclick="toggleResolverMode()">
      <span class="resolver-icon">${active ? '👇' : '🔍'}</span>
      <span>${active ? 'MODO: BAJAR FICHAS (Haz clic para voltear)' : 'MODO: INFORMACIÓN (Haz clic para ver detalles)'}</span>
    </button>
  `;
}

function toggleCardFlipManual(nombre, event) {
  if (event) event.stopPropagation(); // Evitar abrir info o resolver

  if (window._duelRoomCode) {
    // Modo duelo: voltear localmente y sincronizar en Firebase
    if (typeof window._duelEliminated !== 'undefined') {
      if (window._duelEliminated.includes(nombre)) {
        window._duelEliminated = window._duelEliminated.filter(n => n !== nombre);
      } else {
        window._duelEliminated.push(nombre);
      }
      _updateDuelBoard();
      if (typeof _updateMyDuelProgress === 'function') {
        _updateMyDuelProgress();
      }
    }
  } else {
    // Modos estándar / online
    if (playerElim.has(nombre)) {
      playerElim.delete(nombre);
    } else {
      playerElim.add(nombre);
    }
    renderBoard();
    const statusEl = document.getElementById('quien-status');
    if (statusEl && (statusEl.innerHTML.includes('quien-remaining') || statusEl.innerHTML.includes('Tu turno'))) {
      statusEl.innerHTML = playerTurnStatus();
    }
    
    if (gameMode === 'online') {
      if (typeof saveOnlineGameState === 'function') saveOnlineGameState();
    }
  }
}

function submitGuessFromCard(nombre) {
  if (window._duelRoomCode) {
    // Modo duelo
    const input = document.getElementById('duel-guess-input');
    if (input) {
      input.value = nombre;
      submitDuelGuess();
    } else {
      // Simulación fallback
      _duelFinished = true;
      _duelQCount++;
      const won = nombre.toLowerCase() === _duelSecret.nombre.toLowerCase();
      _duelRoomRef.update({
        [`players/${_duelMyUid}/finished`]: true,
        [`players/${_duelMyUid}/won`]: won,
        [`players/${_duelMyUid}/questions`]: _duelQCount
      }).then(() => {
        _duelRoomRef.once('value').then(snap => {
          const data = snap.val();
          const allDone = Object.values(data.players || {}).every(p => p.finished || p.disconnected);
          if (allDone && data.hostUid === _duelMyUid) {
            _duelRoomRef.update({ phase: 'finished' });
          }
        });
      });
    }
  } else if (gameMode === 'online') {
    // Modo online 1v1
    if (typeof onlinePlayerGuess === 'function') {
      onlinePlayerGuess(nombre);
    }
  } else if (gameMode === 'detective') {
    // Modo detective
    if (typeof detectiveGuess === 'function') {
      detectiveGuess(nombre);
    }
  } else {
    // Modo estándar / contrarreloj
    playerGuess(nombre);
  }
}

function updateMyCard(char) {
  const el = document.getElementById('quien-my-card');
  if (!el) return;
  if (!char) {
    el.innerHTML = `<div class="quien-my-card-placeholder">?</div>`;
    _updateSecretTooltip(null);
    return;
  }
  const slug = makeSlug(char.nombre);
  let bocadilloHtml = '';
  if (char.frase && char.frase.length > 0) {
    const emoji = char.emoji ? `<span class="bocadillo-emoji">${char.emoji}</span>` : '';
    const frase = char.frase[Math.floor(Math.random() * char.frase.length)];
    bocadilloHtml = `<div class="quien-bocadillo">${emoji}"${frase}"</div>`;
  }

  el.innerHTML = `
    <div>
      <div class="quien-my-card-filled" onclick="showCharacterInfoModal('${char.nombre.replace(/'/g, "\\'")}')" style="cursor:pointer" title="Ver detalles del personaje">
        <img src="img/personajes/${slug}.webp" alt="${char.nombre}"
          onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        <div class="card-name">${char.nombre.split(' ')[0]}</div>
      </div>
      ${bocadilloHtml}
    </div>`;
  _updateSecretTooltip(char);
}

function _updateSecretTooltip(char) {
  const tip = document.getElementById('quien-secret-tooltip');
  if (!tip) return;
  if (!char) { tip.innerHTML = ''; return; }
  const mont = char.piso_montepinar.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const cont = char.piso_contubernio.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const pisos = [mont, cont].filter(Boolean).join(' / ') || 'Ninguno';
  const occGroup = Q_GROUPS.find(g => g.label === 'Profesión / Ocupación');
  const cats = occGroup ? occGroup.qs.filter(q => q.id !== 'occ_presidente' && q.fn(char)).map(q => q.text.replace(/^¿/, '').replace(/\?$/, '')) : [];
  const occ = (char.ocupacion.join(', ') || 'Desconocido') + (cats.length ? `<br><span style="font-size:0.85em; opacity:0.8; color:var(--accent)">[${cats.join(', ')}]</span>` : '');
  tip.innerHTML = `
    <div class="quien-tooltip-title">📋 ${char.nombre}</div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Género</span>
      <span class="quien-tooltip-val">${char.genero.join(', ')}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Tipo</span>
      <span class="quien-tooltip-val">${char.tipo}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Nacionalidad</span>
      <span class="quien-tooltip-val">${char.origen || 'España'}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Aparición</span>
      <span class="quien-tooltip-val">T${char.temporadaAparicion}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Piso</span>
      <span class="quien-tooltip-val">${pisos}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Hijos</span>
      <span class="quien-tooltip-val">${char.hijos > 0 ? 'Sí' : 'No'}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Profesión</span>
      <span class="quien-tooltip-val">${occ}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">¿Presidente/a?</span>
      <span class="quien-tooltip-val">${char.presidente ? 'Sí' : 'No'}</span>
    </div>`;
}

function renderQuestions(enabled) {
  const el = document.getElementById('quien-questions');
  if (!el) return;

  if (gameMode === 'detective') {
    el.innerHTML = `
      <div style="margin-top: 15px; padding: 0 4px;">
        <button class="guess-btn" style="width: 100%; font-weight: bold; background: var(--accent); color: #000; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: transform 0.15s; box-shadow: 0 4px 15px rgba(240,192,32,0.4);" 
          onmouseover="this.style.transform='scale(1.02)'" 
          onmouseout="this.style.transform='scale(1)'"
          onclick="openGuessOverlay()">
          🎯 RESOLVER PERSONAJE
        </button>
      </div>
    `;
    return;
  }

  if (!enabled) {
    el.innerHTML = '';
    return;
  }

  let html = `<div class="duel-q-panel" style="background: none; border: none; padding: 0;">`;

  Q_GROUPS.forEach(g => {
    html += `
    <details class="duel-q-group">
      <summary>${g.label}</summary>
      <div class="duel-q-list">
        ${g.qs.map(q => {
      const asked = askedByPlayer.has(q.id);
      const ans = asked ? (gameMode === 'online' ? onlineAnswers[q.id] : Q_MAP[q.id].fn(machineSecret)) : null;
      const label = asked ? q.text + (ans ? ' ✓' : ' ✗') : q.text;
      const cls = asked ? 'duel-q-btn ' + (ans ? 'asked-yes' : 'asked-no') : 'duel-q-btn';
      const tooltip = q.desc ? `title="${q.desc}"` : '';
      return `<button id="qbtn-${q.id}" class="${cls}" ${asked ? 'disabled' : ''} ${tooltip}
                  onclick="playerAskQuestion('${q.id}')">${label}</button>`;
    }).join('')}
      </div>
    </details>`;
  });

  html += `</div>`;

  if (gameDifficulty === 'dios' && gameMode === 'online') {
    html += `
    <div style="margin-top: 15px; padding: 0 4px;">
      <button class="duel-q-btn" style="background: rgba(240,192,32,0.15); border-color: var(--accent); color: var(--accent); width: 100%; font-size: 0.82rem; padding: 8px;"
        onclick="showManualOverlay()">✏️ Escribir pregunta libre...</button>
    </div>`;
  }

  // BOTÓN LLAMATIVO RESOLVER PERSONAJE EN LA BASE DEL PANEL DE PREGUNTAS
  html += `
  <div style="margin-top: 15px; padding: 0 4px;">
    <button class="guess-btn" style="width: 100%; font-weight: bold; background: var(--accent); color: #000; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: transform 0.15s; box-shadow: 0 4px 15px rgba(240,192,32,0.4);" 
      onmouseover="this.style.transform='scale(1.02)'" 
      onmouseout="this.style.transform='scale(1)'"
      onclick="openGuessOverlay()">
      🎯 RESOLVER PERSONAJE
    </button>
  </div>
  <div style="margin-top: 10px; padding: 0 4px;">
    <button class="q-btn" style="width: 100%; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 0.9rem; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.15s;"
      onmouseover="this.style.transform='scale(1.02)'" 
      onmouseout="this.style.transform='scale(1)'"
      onclick="confirmAbandonGame()">
      🚪 ABANDONAR PARTIDA
    </button>
  </div>
  `;

  el.innerHTML = html;
}

// ── Helpers ──────────────────────────────────────────
function setStatus(html) {
  const el = document.getElementById('quien-status');
  if (el) el.innerHTML = html;

  if (typeof gameMode !== 'undefined' && gameMode === 'contrarreloj') {
    if (phase === 'player_turn' && (typeof busy !== 'undefined' && !busy)) {
      if (typeof _startContrarrelojTimer === 'function' && typeof _contrarrelojTimeUp === 'function') {
        _startContrarrelojTimer(_contrarrelojTimeUp);
      }
    } else {
      // Si no es el turno del jugador o está ocupado resolviendo la máquina, detener el timer.
      if (typeof _stopContrarrelojTimer === 'function') {
        _stopContrarrelojTimer();
      }
    }
  }
}

function setBoardLabel(text) {
  const el = document.getElementById('quien-board-label');
  if (el) el.textContent = text;
}

function makeSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

initGame();

// ── Tutorial ────────────────────────────────────────
function showQuienTutorial() {
  if (document.getElementById('quien-tutorial')) return;
  const d = document.createElement('div');
  d.id = 'quien-tutorial';
  d.className = 'stats-modal-overlay';
  d.innerHTML = `
    <div class="stats-modal" style="max-width:480px">
      <button class="stats-close" onclick="document.getElementById('quien-tutorial').remove()">✕</button>
      <h2 class="stats-title">🪟 Cómo jugar</h2>
      <div style="text-align:left;color:var(--text2);font-size:0.92rem;line-height:1.7;display:flex;flex-direction:column;gap:10px">
        <p>Cada jugador elige un <strong style="color:var(--text)">personaje secreto</strong> del tablero sin que el rival lo vea.</p>
        <p>Por turnos, cada jugador hace una <strong style="color:var(--text)">pregunta de sí o no</strong> sobre el personaje rival (ej: ¿Es mujer? ¿Tiene hijos?).</p>
        <p>Usa las respuestas para <strong style="color:var(--text)">eliminar personajes</strong> del tablero. Los descartados se atenúan.</p>
        <p>Cuando creas que sabes quién es, pulsa en la carta del personaje y elige <strong style="color:var(--text)">Adivinar</strong>. ¡El primero en acertar gana!</p>
        <p style="color:#f87171">⚠️ Si fallas la adivinanza, pierdes automáticamente.</p>
        <hr style="border-color:rgba(255,255,255,0.1)">
        <p><strong style="color:var(--text)">Modos:</strong><br>
          🤖 <strong style="color:var(--text)">Vs Máquina</strong> — juegas solo, la IA lleva el otro tablero.<br>
          👥 <strong style="color:var(--text)">Multijugador</strong> — crea una sala y comparte el código con un amigo.
        </p>
      </div>
    </div>`;
  d.addEventListener('click', e => { if (e.target === d) d.remove(); });
  document.body.appendChild(d);
}

// Tooltip hover en carta secreta
document.getElementById('quien-my-card').addEventListener('mouseenter', () => {
  const tip = document.getElementById('quien-secret-tooltip');
  if (tip && tip.innerHTML) tip.style.display = 'block';
});
document.getElementById('quien-my-card').addEventListener('mouseleave', () => {
  const tip = document.getElementById('quien-secret-tooltip');
  if (tip) tip.style.display = '';
});

// ── Tooltip flotante en cartas del tablero ────────────
function _buildCardTooltipHTML(char) {
  const mont = char.piso_montepinar.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const cont = char.piso_contubernio.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const pisos = [mont, cont].filter(Boolean).join(' / ') || 'Ninguno';
  const occGroup = Q_GROUPS.find(g => g.label === 'Profesión / Ocupación');
  const cats = occGroup ? occGroup.qs.filter(q => q.id !== 'occ_presidente' && q.fn(char)).map(q => q.text.replace(/^¿/, '').replace(/\?$/, '')) : [];
  const occ = (char.ocupacion.join(', ') || 'Desconocido') + (cats.length ? `<br><span style="font-size:0.85em; opacity:0.8; color:var(--accent)">[${cats.join(', ')}]</span>` : '');
  return `
    <div class="quien-tooltip-title">📋 ${char.nombre}</div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Género</span>
      <span class="quien-tooltip-val">${char.genero.join(', ')}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Tipo</span>
      <span class="quien-tooltip-val">${char.tipo}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Nacionalidad</span>
      <span class="quien-tooltip-val">${char.origen || 'España'}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Aparición</span>
      <span class="quien-tooltip-val">T${char.temporadaAparicion}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Piso</span>
      <span class="quien-tooltip-val">${pisos}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Hijos</span>
      <span class="quien-tooltip-val">${char.hijos > 0 ? 'Sí' : 'No'}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">Profesión</span>
      <span class="quien-tooltip-val">${occ}</span>
    </div>
    <div class="quien-tooltip-row">
      <span class="quien-tooltip-key">¿Presidente/a?</span>
      <span class="quien-tooltip-val">${char.presidente ? 'Sí' : 'No'}</span>
    </div>`;
}

(function () {
  const board = document.getElementById('quien-board');
  if (!board) return;

  // Crear el tooltip dinámicamente si aún no está en el DOM
  let tip = document.getElementById('quien-card-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'quien-card-tooltip';
    tip.className = 'quien-card-tooltip';
    document.body.appendChild(tip);
  }

  let currentCard = null;

  board.addEventListener('mouseover', e => {
    const card = e.target.closest('.quien-card-3d');
    if (!card || card === currentCard) return;
    currentCard = card;
    if (card.classList.contains('eliminated')) { tip.classList.remove('visible'); return; }
    const char = CHARACTERS.find(c => c.nombre === card.dataset.name);
    if (!char) return;
    tip.innerHTML = _buildCardTooltipHTML(char);
    tip.classList.add('visible');
  });

  board.addEventListener('mouseout', e => {
    const card = e.target.closest('.quien-card-3d');
    if (!card) return;
    const to = e.relatedTarget;
    if (to && to.closest('.quien-card-3d')) return;
    currentCard = null;
    tip.classList.remove('visible');
  });

  document.addEventListener('mousemove', e => {
    if (!tip.classList.contains('visible')) return;
    let x = e.clientX + 16;
    let y = e.clientY - 10;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    const rect = tip.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) x = e.clientX - rect.width - 16;
    if (rect.bottom > window.innerHeight - 8) y = e.clientY - rect.height - 10;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  });
})();

// ── Historial y Acciones Dios ───────────────────────────
function addHistoryItem(who, text, answer) {
  const el = document.getElementById('quien-history');
  const listEl = document.getElementById('quien-history-list');
  if (!el || !listEl) return;

  el.style.display = 'block';

  const ansText = answer === true ? 'SÍ' : answer === false ? 'NO' : '?';
  const cls = answer === true ? 'hist-yes' : answer === false ? 'hist-no' : '';

  const item = document.createElement('div');
  item.className = `quien-history-item ${cls}`;
  item.innerHTML = `
    <div class="hist-badge">${ansText}</div>
    <div class="hist-who">${who}</div>
    <div class="hist-q">${text}</div>
  `;

  listEl.appendChild(item);
  listEl.scrollTop = listEl.scrollHeight;
}

function clearHistory() {
  const el = document.getElementById('quien-history');
  const listEl = document.getElementById('quien-history-list');
  if (el) el.style.display = 'none';
  if (listEl) listEl.innerHTML = '';
}

function toggleManualDiscardMode() {
  manualDiscardMode = !manualDiscardMode;

  const wrap = document.querySelector('.quien-wrap');
  if (wrap) {
    wrap.classList.toggle('manual-mode', manualDiscardMode);
  }

  renderQuestions(phase === 'player_turn');
  renderGodActions();
}

function renderGodActions() {
  const el = document.getElementById('quien-god-actions');
  if (!el) return;

  if (gameMode === 'online' || window._duelRoomCode || gameDifficulty !== 'dios' || phase === 'idle' || phase === 'gameover') {
    el.innerHTML = '';
    return;
  }

  const btnCls = manualDiscardMode ? 'q-btn active-manual' : 'q-btn';
  const btnText = manualDiscardMode ? '🔴 Modo: BAJAR FICHAS (Manual)' : '🟢 Modo: ADIVINAR (Resolver)';
  const style = manualDiscardMode
    ? 'background: rgba(239,68,68,0.25); border-color: #ef4444; color: #fca5a5; width:100%; text-align:center; padding: 10px; font-weight: bold; margin-bottom: 12px;'
    : 'background: rgba(16,185,129,0.15); border-color: #10b981; color: #a7f3d0; width:100%; text-align:center; padding: 10px; font-weight: bold; margin-bottom: 12px;';

  el.innerHTML = `
    <button class="${btnCls}" style="${style}" onclick="toggleManualDiscardMode()">${btnText}</button>
  `;
}

// ═══════════════════════════════════════════════════
//  MODO DETECTIVE — 3 pistas, 1 único intento
// ═══════════════════════════════════════════════════
function _getDetectiveClues(char) {
  const clues = [];

  // Pista 1: género
  const genStr = Array.isArray(char.genero) ? char.genero[0] : char.genero;
  clues.push({ emoji: genStr === 'Femenino' ? '👩' : '👨', text: `Es un personaje <strong>${genStr === 'Femenino' ? 'femenino' : 'masculino'}</strong>.` });

  // Pista 2: alguna ocupación
  const ocup = Array.isArray(char.ocupacion) && char.ocupacion.length
    ? char.ocupacion[Math.floor(Math.random() * char.ocupacion.length)]
    : null;
  if (ocup) clues.push({ emoji: '💼', text: `Ha trabajado como <strong>${ocup}</strong>.` });

  // Pista 3: origen o hijos o presidente
  if (char.origen && char.origen !== 'España') {
    clues.push({ emoji: '🌍', text: `Es de origen <strong>${char.origen}</strong>.` });
  } else if (typeof char.hijos === 'number') {
    const hText = char.hijos === 0 ? 'no tiene hijos' : `tiene <strong>${char.hijos}</strong> hijo${char.hijos !== 1 ? 's' : ''}`;
    clues.push({ emoji: '👶', text: `Se sabe que ${hText}.` });
  } else if (char.presidente) {
    clues.push({ emoji: '🏛️', text: `Ha sido <strong>Presidente/a</strong> de la comunidad.` });
  } else if (Array.isArray(char.piso_montepinar) && char.piso_montepinar.length) {
    const piso = char.piso_montepinar[0];
    clues.push({ emoji: '🏠', text: `Vivió en el piso <strong>${piso}</strong> de Montepinar.` });
  }

  // Pista 4: temporada de aparición
  if (char.temporadaAparicion) {
    clues.push({ emoji: '📺', text: `Apareció por primera vez en la <strong>Temporada ${char.temporadaAparicion}</strong>.` });
  }

  // Mezclar y devolver las 3 mejores
  const shuffled = clues.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function startDetectiveGame() {
  gameMode = 'detective';
  machineSecret = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  playerElim = new Set();
  askedByPlayer = new Set();
  phase = 'player_turn';
  busy = false;
  statsSavedForCurrentGame = false;
  _stopContrarrelojTimer();
  window._resolverMode = false; // Modo información por defecto en modo detective

  const wrap = document.querySelector('.quien-wrap');
  wrap.classList.remove('is-playing', 'is-setup');
  wrap.classList.add('is-playing');
  document.getElementById('quien-board').classList.remove('is-setup');
  document.getElementById('quien-start-btn').classList.remove('visible');
  _boardBuilt = false;
  renderBoard();
  updateMyCard(null);
  renderQuestions(true);
  renderGodActions();

  // Mostrar las 3 pistas en el panel de estado
  const clues = _getDetectiveClues(machineSecret);
  const cluesHtml = clues.map((c, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:10px 12px;margin-bottom:8px;animation:popIn 0.3s ease ${i * 0.12}s both;">
      <span style="font-size:1.4rem;flex-shrink:0;">${c.emoji}</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.92rem;color:var(--text);line-height:1.4;">${c.text}</span>
    </div>`).join('');

  setStatus(`
    <div style="text-align:left;width:100%;">
      <p class="turn-badge" style="background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.4);color:#c084fc;margin-bottom:12px;">🕵️ MODO DETECTIVE</p>
      <p class="quien-desc" style="margin-bottom:12px;">Tienes <strong style="color:#c084fc">3 pistas</strong> y <strong style="color:#f87171">1 único intento</strong>.<br>Usa el tablero para descartar y pulsa <strong style="color:#fbbf24">RESOLVER PERSONAJE</strong> para contestar.</p>
      ${cluesHtml}
    </div>
  `);
}

function detectiveGuess(nombre) {
  if (gameMode !== 'detective' || phase !== 'player_turn' || busy) return;
  busy = true;
  phase = 'gameover';

  const correct = nombre === machineSecret.nombre;

  if (typeof StatsFirebase !== 'undefined' && !statsSavedForCurrentGame) {
    statsSavedForCurrentGame = true;
    StatsFirebase.saveGameResult('quien_machine', 0, correct, machineSecret ? machineSecret.nombre : null);
  }

  const slug = makeSlug(machineSecret.nombre);
  const secretImg = `<div class="quien-guess-avatar"><img src="img/personajes/${slug}.webp" alt="${machineSecret.nombre}" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else{this.style.display='none'}"></div>`;

  if (correct) {
    if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setStatus(`
      <div class="quien-result">
        <p class="quien-result-label" style="color:#c084fc;">🕵️ ¡CASO RESUELTO! 🎉</p>
        ${secretImg}
        <p class="quien-guess-name">${machineSecret.nombre}</p>
        <p style="font-size:0.85rem;color:#a1a1aa;margin:6px 0 14px;">¡Impresionante deducción, detective!</p>
        <button class="quien-start-btn visible" style="margin:0 auto;" onclick="startDetectiveGame()">🔍 Nueva investigación</button>
        <button class="quien-start-btn visible" style="margin:8px auto 0;background:rgba(255,255,255,0.07);color:var(--text);" onclick="showModeOverlay()">← Cambiar modo</button>
      </div>`);
  } else {
    const wrongSlug = makeSlug(nombre);
    setStatus(`
      <div class="quien-result">
        <p class="quien-result-label" style="color:#f87171;">🕵️ CASO SIN RESOLVER</p>
        <p style="font-size:0.8rem;color:var(--text2);margin:0 0 10px;">Creías que era...</p>
        <div class="quien-guess-avatar"><img src="img/personajes/${wrongSlug}.webp" onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else{this.style.display='none'}"></div>
        <p class="quien-guess-name" style="color:#f87171;">${nombre}</p>
        <p style="font-size:0.8rem;color:var(--text2);margin:10px 0 4px;">Pero el personaje era...</p>
        ${secretImg}
        <p class="quien-guess-name">${machineSecret.nombre}</p>
        <button class="quien-start-btn visible" style="margin:14px auto 0;" onclick="startDetectiveGame()">🔍 Nueva investigación</button>
        <button class="quien-start-btn visible" style="margin:8px auto 0;background:rgba(255,255,255,0.07);color:var(--text);" onclick="showModeOverlay()">← Cambiar modo</button>
      </div>`);
  }
}

// ═══════════════════════════════════════════════════
//  MODO CONTRARRELOJ — 45 segundos por turno
// ═══════════════════════════════════════════════════
let _contrarrelojTimer = null;
let _contrarrelojSecondsLeft = 45;
const CONTRARRELOJ_SECS = 45;

function _stopContrarrelojTimer() {
  if (_contrarrelojTimer) {
    clearInterval(_contrarrelojTimer);
    _contrarrelojTimer = null;
  }
  const timerEl = document.getElementById('contrarreloj-timer');
  if (timerEl) timerEl.style.display = 'none';
}

function _startContrarrelojTimer(onExpire) {
  _stopContrarrelojTimer();

  // Crear o actualizar el element del timer
  let timerEl = document.getElementById('contrarreloj-timer');
  if (!timerEl) {
    timerEl = document.createElement('div');
    timerEl.id = 'contrarreloj-timer';
    timerEl.style.cssText = `
      position: fixed; top: 80px; right: 20px; z-index: 300;
      background: rgba(10,10,10,0.92); backdrop-filter: blur(10px);
      border: 2px solid rgba(249,115,22,0.6); border-radius: 50%;
      width: 64px; height: 64px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; font-family:'Bebas Neue',sans-serif;
      box-shadow: 0 0 20px rgba(249,115,22,0.3); transition: border-color 0.3s;
    `;
    document.body.appendChild(timerEl);
  }

  function _tick() {
    const secsEl = document.getElementById('contrarreloj-timer');
    if (!secsEl) return;
    secsEl.style.display = 'flex';

    const urgent = _contrarrelojSecondsLeft <= 10;
    secsEl.style.borderColor = urgent ? 'rgba(239,68,68,0.9)' : 'rgba(249,115,22,0.6)';
    secsEl.style.boxShadow = urgent ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(249,115,22,0.3)';
    secsEl.innerHTML = `
      <span style="font-size:1.5rem;line-height:1;color:${urgent ? '#f87171' : '#fb923c'};">${_contrarrelojSecondsLeft}</span>
      <span style="font-size:0.5rem;letter-spacing:1px;color:var(--text2);">SEG</span>
    `;

    if (_contrarrelojSecondsLeft <= 0) {
      _stopContrarrelojTimer();
      if (typeof onExpire === 'function') onExpire();
    } else {
      _contrarrelojSecondsLeft--;
    }
  }

  _tick();
  _contrarrelojTimer = setInterval(_tick, 1000);
}

function startContrarrelojGame() {
  gameMode = 'contrarreloj';
  machineSecret = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  playerElim = new Set();
  machineCands = [...CHARACTERS];
  askedByPlayer = new Set();
  askedByMachine = new Set();
  phase = 'setup';
  turnCount = 0;
  busy = false;
  statsSavedForCurrentGame = false;
  _stopContrarrelojTimer();
  _contrarrelojSecondsLeft = CONTRARRELOJ_SECS;

  const wrap = document.querySelector('.quien-wrap');
  wrap.classList.remove('is-playing');
  wrap.classList.add('is-setup');
  document.getElementById('quien-start-btn').classList.remove('visible');
  _boardBuilt = false;
  renderBoard();
  updateMyCard(null);
  renderQuestions(false);
  renderGodActions();
  document.getElementById('quien-board').classList.add('is-setup');

  setStatus(`
    <div class="quien-turn-player">
      <p class="turn-badge" style="background:rgba(249,115,22,0.15);border-color:rgba(249,115,22,0.5);color:#fb923c;">⚡ MODO CONTRARRELOJ</p>
      <p class="quien-desc">Tienes <strong style="color:#fb923c">45 segundos</strong> por turno. ¡Elige tu personaje secreto!</p>
    </div>
  `);
}

function _contrarrelojTimeUp() {
  if (phase !== 'player_turn' || busy) return;
  // El tiempo se agotó — contar como turno perdido y pasar a la máquina
  addHistoryItem('⏱️ Tiempo', 'Se acabó el tiempo. ¡Turno perdido!', null);
  setStatus(`
    <div class="quien-turn-machine">
      <p class="turn-badge" style="background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.5);color:#f87171;">⏱️ ¡Tiempo agotado!</p>
      <p class="quien-desc">La máquina aprovecha tu descuido...</p>
    </div>
  `);
  busy = true;
  setTimeout(() => {
    busy = false;
    doMachineTurn();
  }, 1500);
}

// ── Ficha de Personaje: Info Modal ─────────────────────
function showCharacterInfoModal(nombre) {
  const char = ALL_CHARACTERS.find(c => c.nombre === nombre);
  if (!char) return;

  const mont = char.piso_montepinar.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const cont = char.piso_contubernio.filter(p => p !== "No aparece" && p !== "Fuera").join(', ');
  const pisos = [mont, cont].filter(Boolean).join(' / ') || 'Ninguno';
  const occGroup = Q_GROUPS.find(g => g.label === 'Profesión / Ocupación');
  const cats = occGroup ? occGroup.qs.filter(q => q.id !== 'occ_presidente' && q.fn(char)).map(q => q.text.replace(/^¿/, '').replace(/\?$/, '')) : [];
  const occ = (char.ocupacion.join(', ') || 'Desconocido') + (cats.length ? ` [${cats.join(', ')}]` : '');
  const slug = makeSlug(char.nombre);

  let modal = document.getElementById('quien-char-info-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quien-char-info-modal';
    modal.className = 'stats-modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10,10,20,0.85); backdrop-filter: blur(12px);
      z-index: 1020; display: none; align-items: center; justify-content: center;
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="stats-modal" style="max-width:420px; padding: 24px; position: relative; border: 1px solid rgba(240,192,32,0.3); border-radius: 20px; background: rgba(15,15,30,0.98); box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
      <button class="stats-close" onclick="document.getElementById('quien-char-info-modal').style.display='none'" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: var(--text2); font-size: 1.2rem; cursor: pointer;">✕</button>
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="width: 90px; height: 90px; border-radius: 50%; overflow: hidden; margin: 0 auto 10px; border: 2px solid var(--accent); box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
          <img src="img/personajes/${slug}.webp" alt="${char.nombre}" style="width: 100%; height: 100%; object-fit: cover; object-position: top;"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else{this.style.display='none'}">
        </div>
        <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px; color: var(--accent); margin: 0;">${char.nombre}</h2>
        <p style="color: var(--text2); font-style: italic; font-size: 0.8rem; margin: 4px 0 0;">"${char.frase ? char.frase[Math.floor(Math.random() * char.frase.length)] : '¿Qué? ¿Cómo? ¡Mente fría!'}"</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; background: rgba(0,0,0,0.25); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Género:</span>
          <strong style="color: #fff;">${char.genero.join(', ')}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Tipo:</span>
          <strong style="color: #fff;">${char.tipo}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Nacionalidad:</span>
          <strong style="color: #fff;">${char.origen || 'España'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Aparición:</span>
          <strong style="color: #fff;">Temporada ${char.temporadaAparicion}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Vivienda:</span>
          <strong style="color: #fff; text-align: right; max-width: 70%;">${pisos}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Tiene Hijos:</span>
          <strong style="color: #fff;">${char.hijos > 0 ? 'Sí' : 'No'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
          <span style="color: var(--text2);">Presidente:</span>
          <strong style="color: #fff;">${char.presidente ? 'Sí' : 'No'}</strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem;">
          <span style="color: var(--text2);">Ocupación / Profesión:</span>
          <strong style="color: var(--accent); line-height: 1.3;">${occ}</strong>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// ── Resolver Personaje: Overlay Autocomplete ───────────
function openGuessOverlay() {
  if (phase !== 'player_turn' && !window._duelRoomCode) return;
  if (window._duelRoomCode && _duelFinished) return;

  let overlay = document.getElementById('quien-guess-overlay-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'quien-guess-overlay-modal';
    overlay.className = 'quien-mode-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10,10,20,0.85); backdrop-filter: blur(12px);
      z-index: 1000; display: none; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = `
      <div class="quien-mode-box" style="max-width:400px; width: 90%; padding: 24px; border: 1px solid rgba(240,192,32,0.3); border-radius: 20px; text-align: center; background: rgba(15,15,30,0.95); box-shadow: 0 10px 40px rgba(0,0,0,0.7); position: relative;">
        <button class="lobby-back" onclick="document.getElementById('quien-guess-overlay-modal').style.display='none'" style="position: absolute; top: 16px; left: 16px; background: transparent; border: none; color: var(--text2); font-size: 0.9rem; cursor: pointer;">← Cancelar</button>
        <div style="font-size: 2.2rem; margin-top: 15px; margin-bottom: 8px;">🎯</div>
        <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px; color: var(--accent); margin: 0 0 6px;">RESOLVER PERSONAJE</h2>
        <p style="color: var(--text2); font-size: 0.85rem; margin: 0 0 16px;">¿Quién crees que es el personaje secreto?</p>
        
        <div class="search-wrap" style="width:100%; position:relative; margin-bottom: 12px;">
          <input id="quien-guess-modal-input" class="lobby-input" placeholder="Escribe el nombre del vecino..."
            style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; padding: 10px; font-size: 0.9rem; outline: none; transition: border-color 0.2s;"
            onfocus="this.style.borderColor='var(--accent)'"
            onblur="this.style.borderColor='rgba(255,255,255,0.15)'"
            oninput="buildAutocomplete('quien-guess-modal-input', 'quien-guess-modal-ac', v => { document.getElementById('quien-guess-modal-input').value = v; })"
            onkeydown="if(event.key==='Enter')submitQuienGuessModal()">
          <div id="quien-guess-modal-ac" class="autocomplete" style="display:none; position: absolute; top: 100%; left: 0; width: 100%; background: #1a1a2e; border: 1px solid rgba(240,192,32,0.3); border-radius: 0 0 8px 8px; max-height: 180px; overflow-y: auto; z-index: 1010; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>
        </div>

        <p style="color: var(--accent); font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem; text-align: left; margin: 4px 0 6px; letter-spacing: 1px;">📋 PERSONAJES VIVOS EN TU TABLERO:</p>
        <div id="guess-alive-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 16px; justify-content: center; align-content: flex-start;">
          <!-- Se rellenará dinámicamente -->
        </div>
        
        <button class="guess-btn" style="width: 100%; font-weight: bold; background: var(--accent); color: #000; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: transform 0.15s;" 
          onmouseover="this.style.transform='scale(1.03)'" 
          onmouseout="this.style.transform='scale(1)'"
          onclick="submitQuienGuessModal()">
          ¡Es este personaje! 🚀
        </button>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
    document.body.appendChild(overlay);
  }

  // Obtener personajes vivos
  let alive = [];
  if (window._duelRoomCode && typeof window._duelEliminated !== 'undefined') {
    alive = CHARACTERS.filter(c => !window._duelEliminated.includes(c.nombre));
  } else {
    alive = CHARACTERS.filter(c => !playerElim.has(c.nombre));
  }

  // Rellenar la lista
  const aliveListEl = document.getElementById('guess-alive-list');
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
            onclick="document.getElementById('quien-guess-modal-input').value='${c.nombre.replace(/'/g, "\\'")}'; document.getElementById('quien-guess-modal-ac').style.display='none';">
            ${c.nombre}
          </button>
        `;
      }).join('');
    }
  }

  overlay.style.display = 'flex';
  document.getElementById('quien-guess-modal-input').value = '';
  document.getElementById('quien-guess-modal-ac').style.display = 'none';
  setTimeout(() => document.getElementById('quien-guess-modal-input')?.focus(), 150);
}

function submitQuienGuessModal() {
  const input = document.getElementById('quien-guess-modal-input');
  const guess = (input?.value || '').trim();
  if (!guess) return;

  const overlay = document.getElementById('quien-guess-overlay-modal');
  if (overlay) overlay.style.display = 'none';

  if (window._duelRoomCode) {
    // Adaptar para duelo
    const duelInput = document.getElementById('duel-guess-input');
    if (duelInput) {
      duelInput.value = guess;
      submitDuelGuess();
    }
  } else if (gameMode === 'detective') {
    detectiveGuess(guess);
  } else {
    // Modo estándar
    playerGuess(guess);
  }
}

function isGameActive() {
  if (window._bypassAbandonWarning) {
    return false;
  }
  // Modo Duelo activo (tanto en lobby/espera como jugando, si no ha finalizado)
  if (window._duelRoomCode && typeof _duelFinished !== 'undefined' && !_duelFinished) {
    return true;
  }
  // Modos locales (VS IA, Detective, Contrarreloj) u Online 1v1 activo
  if (typeof phase !== 'undefined' && phase !== 'idle' && phase !== 'gameover') {
    return true;
  }
  return false;
}

window.onbeforeunload = function (e) {
  if (isGameActive()) {
    return "La partida activa se perderá y no sumará para el ranking. ¿Estás seguro?";
  }
};

document.addEventListener('click', function (e) {
  const link = e.target.closest('a');
  if (link && isGameActive()) {
    const href = link.getAttribute('href');
    if (href && href !== '#' && !link.getAttribute('onclick')) {
      e.preventDefault();
      openAbandonGameModal(() => {
        if (window._duelRoomCode && typeof _cleanupDuel === 'function') {
          _cleanupDuel();
        }
        localStorage.removeItem('activeDuelRoomCode');
        window.location.href = href;
      });
    }
  }
}, true);

function openAbandonGameModal(onConfirm) {
  const existing = document.getElementById('quien-abandon-modal');
  if (existing) existing.remove();

  const d = document.createElement('div');
  d.id = 'quien-abandon-modal';
  d.className = 'stats-modal-overlay';
  d.style.zIndex = '9999';
  d.innerHTML = `
    <div class="stats-modal" style="max-width:440px; text-align:center; padding: 30px 24px; border: 2px solid rgba(239, 68, 68, 0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <h2 class="stats-title" style="color:#ef4444; font-size:1.8rem; margin:0 0 12px; font-family:'Bebas Neue',sans-serif; letter-spacing:2px;">⚠️ ¿ABANDONAR PARTIDA?</h2>
      <p style="color:var(--text2); font-size:0.95rem; line-height:1.6; margin:0 0 24px">
        Si sales ahora, la partida activa se perderá. <strong>No sumará para el ranking</strong> y perderás tu racha actual. ¿Estás completamente seguro/a?
      </p>
      <div style="display:flex; gap:12px; justify-content:center">
        <button class="q-btn" onclick="document.getElementById('quien-abandon-modal').remove()" 
          style="flex:1; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:var(--text); padding:12px; font-weight:bold; font-size:0.95rem; cursor:pointer; border-radius:8px;">
          Cancelar
        </button>
        <button class="q-btn" id="quien-abandon-confirm-btn"
          style="flex:1; background:#ef4444; border-color:#ef4444; color:#fff; padding:12px; font-weight:bold; font-size:0.95rem; cursor:pointer; border-radius:8px; box-shadow:0 4px 15px rgba(239,68,68,0.3)">
          Sí, abandonar
        </button>
      </div>
    </div>
  `;

  d.querySelector('#quien-abandon-confirm-btn').addEventListener('click', () => {
    d.remove();
    window._bypassAbandonWarning = true; // Activar el bypass para evitar la alerta nativa
    if (onConfirm) onConfirm();
  });

  document.body.appendChild(d);
}

function confirmAbandonGame() {
  openAbandonGameModal(() => {
    if (window._duelRoomCode) {
      if (typeof duelExit === 'function') {
        duelExit();
      } else {
        location.reload();
      }
    } else if (gameMode === 'online') {
      if (typeof _roomRef !== 'undefined' && _roomRef) {
        _roomRef.update({ phase: 'abandoned' }).then(() => {
          if (typeof cleanupOnlineRoom === 'function') cleanupOnlineRoom();
          location.reload();
        }).catch(() => {
          location.reload();
        });
      } else {
        location.reload();
      }
    } else {
      location.reload();
    }
  });
}
