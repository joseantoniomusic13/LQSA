/* ================================================
   LQSACatena — Utilidades compartidas
   ================================================ */

/**
 * Convierte un nombre de personaje a slug URL-safe.
 * Centralizado aquí para evitar duplicación en classic/quote/quiz.
 */
function toSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ══════════════════════════════════════
   MODO DALTONISMO
══════════════════════════════════════ */

function initColorblind() {
  if (localStorage.getItem('lqsacatena_cb') === '1') document.body.classList.add('cb');
  document.querySelectorAll('.cb-toggle').forEach(btn => {
    btn.classList.toggle('active', document.body.classList.contains('cb'));
    btn.title = document.body.classList.contains('cb') ? 'Desactivar modo daltónico' : 'Activar modo daltónico';
  });
}

function toggleColorblind() {
  document.body.classList.toggle('cb');
  const on = document.body.classList.contains('cb');
  localStorage.setItem('lqsacatena_cb', on ? '1' : '0');
  document.querySelectorAll('.cb-toggle').forEach(btn => {
    btn.classList.toggle('active', on);
    btn.title = on ? 'Desactivar modo daltónico' : 'Activar modo daltónico';
  });
}

/* ══════════════════════════════════════
   PIPS
══════════════════════════════════════ */

function renderPips(id, max, used, won = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array.from({ length: max }, (_, i) => {
    let cls = '';
    if (i < used) cls = (won && i === used - 1) ? 'win' : 'used';
    return `<div class="pip ${cls}"></div>`;
  }).join('');
}

/* ══════════════════════════════════════
   RESULTADO (shared helper — sin uso activo)
══════════════════════════════════════ */

function getWinMessage(n) {
  if (n === 1) return '¡Increíble! ¡Eres un experto de la comunidad!';
  if (n <= 3)  return '¡Muy bien! El portal del edificio te conoce bien...';
  if (n <= 5)  return '¡Bien! Pero aún te queda práctica con el cotilleo vecinal.';
  return '¡Justo a tiempo! Casi te tira Vicenta a escobazos.';
}

/* ══════════════════════════════════════
   AUTOCOMPLETE
══════════════════════════════════════ */

/**
 * Genera el desplegable de autocompletado con soporte de acentos.
 */
function buildAutocomplete(inputId, acId, onSelect) {
  const input = document.getElementById(inputId);
  const ac    = document.getElementById(acId);
  if (!input || !ac) return;

  const rawVal = input.value.trim();
  if (!rawVal) { ac.style.display = 'none'; return; }

  // Normalizar acentos para que "Jose" encuentre "José"
  const val = rawVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const matches = CHARACTERS
    .filter(c => {
      const norm = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(val);
    })
    .slice(0, 6);

  if (!matches.length) { ac.style.display = 'none'; return; }

  ac.innerHTML = matches.map(c => {
    const imgPath = `img/personajes/${toSlug(c.nombre)}.webp`;
    const subtitle = c.ocupacion && c.ocupacion.length ? c.ocupacion[0] : '';
    return `
      <div class="autocomplete-item" data-name="${c.nombre}">
        <div class="ac-avatar">
          <img src="${imgPath}" alt="${c.nombre}"
            onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
        </div>
        <div class="ac-info">
          <span class="ac-name">${c.nombre}</span>
          ${subtitle ? `<span class="ac-sub">${subtitle}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  ac.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      onSelect(item.dataset.name);
      ac.style.display = 'none';
    });
  });

  ac.style.display = 'block';
}

// Cierra autocomplete al hacer clic fuera
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.querySelectorAll('.autocomplete').forEach(a => a.style.display = 'none');
  }
});

// Cierra modales con Escape
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const stats = document.getElementById('stats-modal');
  if (stats) stats.remove();
  const tutorial = document.getElementById('tutorial-modal');
  if (tutorial && tutorial.classList.contains('active') && typeof hideTutorial === 'function') hideTutorial();
});

/* ══════════════════════════════════════
   ESTADÍSTICAS
══════════════════════════════════════ */

function loadStats(mode) {
  const def = {
    played: 0, streak: 0, maxStreak: 0,
    lastWonDate: null, lastPlayedDate: null,
    totalAttempts: 0,
    distribution: { '1':0,'2':0,'3':0,'4':0,'5':0,'6+':0,'X':0 }
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(`lqsacatena_stats_${mode}`) || '{}');
    // Garantizar que distribution tiene la clave X
    if (parsed.distribution && !('X' in parsed.distribution)) parsed.distribution['X'] = 0;
    return Object.assign({}, def, parsed);
  } catch(e) { return def; }
}

function updateStats(mode, attempts, won) {
  const stats     = loadStats(mode);
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Evitar doble conteo por si se llama dos veces el mismo día
  if (stats.lastPlayedDate === today) return;

  stats.played++;
  stats.lastPlayedDate = today;

  if (won) {
    stats.totalAttempts += attempts;
    const key = attempts <= 5 ? String(attempts) : '6+';
    stats.distribution[key] = (stats.distribution[key] || 0) + 1;
    stats.streak    = stats.lastWonDate === yesterday ? stats.streak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.lastWonDate = today;
  } else {
    stats.distribution['X'] = (stats.distribution['X'] || 0) + 1;
    stats.streak = 0;
  }

  localStorage.setItem(`lqsacatena_stats_${mode}`, JSON.stringify(stats));

  // Sync to Firebase if user is logged in
  if (typeof StatsFirebase !== 'undefined') {
    StatsFirebase.saveGameResult(mode, attempts, won);
  }
  // Global anonymous stats (no login required)
  if (typeof GlobalStats !== 'undefined') {
    GlobalStats.update(mode, attempts, won);
  }
}

function showStatsModal(mode) {
  const existing = document.getElementById('stats-modal');
  if (existing) { existing.remove(); return; }

  const stats    = loadStats(mode);
  const lost     = stats.distribution['X'] || 0;
  const won      = stats.played - lost;
  const winRate  = stats.played > 0 ? Math.round(won / stats.played * 100) : 0;
  const avg      = won > 0 ? (stats.totalAttempts / won).toFixed(1) : '—';
  const modeLabel = mode === 'classic' ? '🎬 Clásico' : '💬 Frases';

  const distOrder = ['1','2','3','4','5','6+','X'];
  const maxVal    = Math.max(...distOrder.map(k => stats.distribution[k] || 0), 1);

  const distHtml = distOrder.map(k => {
    const v   = stats.distribution[k] || 0;
    const pct = Math.round((v / maxVal) * 100);
    const isX = k === 'X';
    return `<div class="stat-dist-row">
      <span class="stat-dist-label${isX ? ' stat-dist-lost' : ''}">${isX ? '✗' : k}</span>
      <div class="stat-dist-bar-wrap">
        <div class="stat-dist-bar${v > 0 ? ' has-val' : ''}${isX && v > 0 ? ' stat-dist-bar-lost' : ''}" style="width:${Math.max(pct,8)}%">${v > 0 ? v : ''}</div>
      </div>
    </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'stats-modal';
  modal.className = 'stats-modal-overlay';
  modal.innerHTML = `
    <div class="stats-modal">
      <button class="stats-close" onclick="document.getElementById('stats-modal').remove()">✕</button>
      <h2 class="stats-title">Mis estadísticas</h2>
      <p class="stats-mode-label">${modeLabel}</p>
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-num">${stats.played}</div><div class="stat-lbl">Jugadas</div></div>
        <div class="stat-item"><div class="stat-num">${winRate}%</div><div class="stat-lbl">% Victorias</div></div>
        <div class="stat-item"><div class="stat-num">${stats.streak}</div><div class="stat-lbl">Racha</div></div>
        <div class="stat-item"><div class="stat-num">${stats.maxStreak}</div><div class="stat-lbl">Máx. racha</div></div>
        <div class="stat-item"><div class="stat-num">${avg}</div><div class="stat-lbl">Media int.</div></div>
      </div>
      <h3 class="stats-dist-title">Distribución de intentos</h3>
      <div class="stats-dist">${distHtml}</div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

/* ══════════════════════════════════════
   CUENTA ATRÁS (compartida)
══════════════════════════════════════ */

function startCountdown(elementId) {
  function tick() {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = formatCountdown(msUntilMidnight());
  }
  tick();
  setInterval(tick, 1000);
}

/* ══════════════════════════════════════
   KOFI POPUP
══════════════════════════════════════ */

function maybeShowKofiPopup() {
  const key  = 'lqsacatena_kofi_shown';
  const last = parseInt(localStorage.getItem(key) || '0', 10);
  if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) return;

  setTimeout(() => {
    if (document.getElementById('kofi-popup')) return;
    const overlay = document.createElement('div');
    overlay.id = 'kofi-popup';
    overlay.className = 'kofi-popup-overlay';
    overlay.innerHTML = `
      <div class="kofi-popup">
        <button class="kofi-popup-close" onclick="closeKofiPopup()" aria-label="Cerrar">✕</button>
        <div class="kofi-popup-icon">☕</div>
        <h3 class="kofi-popup-title">¿Te gusta el juego?</h3>
        <p class="kofi-popup-text">Invita a Marisa a su chínchón y ayúdanos a seguir añadiendo nuevos modos de juego.</p>
        <div class="kofi-popup-btns">
          <a href="https://ko-fi.com/lqsacatena" target="_blank" rel="noopener" class="kofi-popup-donate" onclick="closeKofiPopup()">☕ Invitar a Marisa</a>
          <button class="kofi-popup-skip" onclick="closeKofiPopup()">Ahora no</button>
        </div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeKofiPopup(); });
    document.body.appendChild(overlay);
    localStorage.setItem(key, String(Date.now()));
  }, 2500);
}

function closeKofiPopup() {
  const popup = document.getElementById('kofi-popup');
  if (popup) popup.remove();
}

/* ══════════════════════════════════════
   INPUT FEEDBACK
══════════════════════════════════════ */

function shakeInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.style.borderColor = 'var(--accent)';
  setTimeout(() => (input.style.borderColor = ''), 800);
}
