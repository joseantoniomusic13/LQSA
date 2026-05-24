/* ════════════════════════════════════════════════════════
   LQSACatena — Sistema de Autenticación
   y Estadísticas Basado Directamente en Realtime Database
   (Evita errores de Firebase Auth Provider deshabilitado)
   ════════════════════════════════════════════════════════ */

// Definición de logros del juego
const ACHIEVEMENTS = [
  {
    id: "primer_paso",
    name: "¡La que se avecina!",
    desc: "Registrar tu cuenta de vecino en el juego.",
    icon: "🚪",
    quote: "¡Que soy concejal de juventud y tiempo libre!"
  },
  {
    id: "primera_victoria",
    name: "¡Qué caballero!",
    desc: "Ganar tu primera partida contra la máquina.",
    icon: "🤖",
    quote: "¡Aparcao!"
  },
  {
    id: "primera_online",
    name: "¡Qué follón!",
    desc: "Jugar tu primera partida online en multijugador.",
    icon: "👥",
    quote: "¡Pues ya estaríamos!"
  },
  {
    id: "cinco_partidas",
    name: "¡Espetón!",
    desc: "Jugar un total de 5 partidas.",
    icon: "🐟",
    quote: "¡Un pinchito de tortilla y una caña!"
  },
  {
    id: "dios_mode",
    name: "Presidente de la Comunidad",
    desc: "Ganar una partida en dificultad Modo DIOS.",
    icon: "👑",
    quote: "¡Esta junta es ilegal!"
  },
  {
    id: "adivinado_recio",
    name: "¡Mayorista, no limpio pescado!",
    desc: "Ganar jugando con Antonio Recio o adivinándolo.",
    icon: "🦞",
    quote: "¡Antonio Recio, mayorista, no limpio pescado!"
  },
  {
    id: "relampago",
    name: "¡Relámpago!",
    desc: "Adivinar al personaje haciendo menos de 3 preguntas.",
    icon: "⚡",
    quote: "¡Ardeiréis en el caldero de Satan!"
  },
  {
    id: "sin_red",
    name: "Sin Red",
    desc: "Adivinar al personaje sin hacer ninguna pregunta.",
    icon: "🎯",
    quote: "¿Eres tú el que tiene cara de pez espada?"
  },
  {
    id: "veterano",
    name: "Vecino Veterano",
    desc: "Jugar un total de 50 partidas.",
    icon: "🏅",
    quote: "¡Me caigo muerta!"
  },
  {
    id: "cosmopolita",
    name: "Cosmopolita",
    desc: "Adivinar a un personaje de fuera de España.",
    icon: "🌍",
    quote: "¡Es el sueño español!"
  },
  {
    id: "domador_ia",
    name: "Domador/a de IA",
    desc: "Ganar 10 partidas contra la máquina.",
    icon: "🤖💪",
    quote: "¡Atrás! ¡No me obligues a hacerte el molinillo!"
  },
  {
    id: "racha_5",
    name: "Racha Imparable",
    desc: "Conseguir una racha de 5 victorias consecutivas.",
    icon: "🔥",
    quote: "¡To las locas del coño, pa mí!"
  }
];

// Calcular título del vecino según logros desbloqueados
function _getTitleFromProfile(profile) {
  const ach = new Set(profile.achievements || []);
  const count = ach.size;
  if (ach.has('sin_red') && count >= 9) return '🎯 El Prestidigitador';
  if (ach.has('racha_5') && ach.has('dios_mode')) return '👑 Leyenda de Montepinar';
  if (ach.has('dios_mode')) return '👑 Presidente/a de la Comunidad';
  if (ach.has('veterano')) return '⭐ Vecino Veterano';
  if (ach.has('domador_ia')) return '🤖 Domador/a de IAs';
  if (count >= 6) return '🏠 Vecino de Pleno Derecho';
  if (count >= 4) return '🔑 Inquilino/a';
  if (count >= 2) return '🚶 Nuevo Vecino';
  return '🔍 Aspirante';
}

// Lista de avatares disponibles (personajes de la serie)
const AVATAR_CHARACTERS = [
  { name: "Amador Rivas", file: "amador-rivas.webp" },
  { name: "Antonio Recio", file: "antonio-recio.webp" },
  { name: "Coque Calatrava", file: "coque-calatrava.webp" },
  { name: "Berta Escobar", file: "berta-escobar.webp" },
  { name: "Enrique Pastor", file: "enrique-pastor.webp" },
  { name: "Fermín Trujillo", file: "fermin-trujillo.webp" },
  { name: "Lola Trujillo", file: "lola-trujillo.webp" },
  { name: "Maite Figueroa", file: "maite-figueroa.webp" },
  { name: "Vicente Maroto", file: "vicente-maroto.webp" },
  { name: "Doña Fina", file: "fina-palomares.webp" },
  { name: "Chusa", file: "chusa.webp" },
  { name: "Javi Maroto", file: "javier-maroto.webp" }
];

let currentUserProfile = null;

// Inicialización de Auth
document.addEventListener("DOMContentLoaded", () => {
  // Asegurarnos de que el contenedor de auth existe
  let authContainer = document.querySelector(".auth-nav-item");
  if (!authContainer) {
    const header = document.querySelector("header");
    if (header) {
      authContainer = document.createElement("span");
      authContainer.className = "auth-nav-item";
      header.appendChild(authContainer);
    }
  }

  // Asegurarnos de que el contenedor de amigos existe
  let friendsContainer = document.querySelector(".friends-nav-item");
  if (!friendsContainer) {
    const header = document.querySelector("header");
    if (header) {
      friendsContainer = document.createElement("span");
      friendsContainer.className = "friends-nav-item";
      header.insertBefore(friendsContainer, header.firstChild);
    }
  }

  // Inicializar Firebase si no lo está
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }

    const savedUser = localStorage.getItem("lqsa_user");
    if (savedUser) {
      const db = firebase.database();
      db.ref("users/" + savedUser).on("value", (snap) => {
        if (snap.exists()) {
          currentUserProfile = snap.val();
          currentUserProfile.uid = savedUser; // Compatibilidad con vistas

          // 👇 INYECTAR AQUÍ EL MOTOR PREMIUM DEL ÁLBUM
          if (typeof initAlbumSystem === 'function') initAlbumSystem(savedUser);

          updateAuthNav();

          // Iniciar sistema de presencia y amigos
          if (typeof initPresence === 'function') initPresence(savedUser);
          if (typeof initFriendsSystem === 'function') initFriendsSystem(savedUser);

          // Reconectar automáticamente si tiene partida de duelo guardada
          if (typeof checkDuelingRoomReconnection === 'function') {
            checkDuelingRoomReconnection();
          }

          // Verificar reconexión de partida online activa
          if (typeof checkOnlineRoomReconnection === 'function') {
            checkOnlineRoomReconnection();
          }

          // Disparar callback de recarga en ranking si existe
          if (typeof window.onUserProfileLoaded === "function") {
            window.onUserProfileLoaded();
          }
        } else {
          localStorage.removeItem("lqsa_user");
          currentUserProfile = null;
          updateAuthNav();
        }
      });
    } else {
      currentUserProfile = null;
      updateAuthNav();
    }
  }
});

// Actualiza el botón de login/perfil en el header
function updateAuthNav() {
  const container = document.querySelector(".auth-nav-item");
  const friendsContainer = document.querySelector(".friends-nav-item");
  if (!container) return;

  if (currentUserProfile) {
    // Usuario logueado
    container.innerHTML = `
      <button class="auth-user-btn" onclick="openProfileModal()">
        <img class="auth-av-img" src="${currentUserProfile.avatar}" alt="Avatar" onerror="this.src='img/personajes/amador-rivas.webp'">
        <span class="auth-uname">${currentUserProfile.username}</span>
      </button>
    `;
    if (friendsContainer) {
      friendsContainer.innerHTML = `
        <button class="auth-friends-btn" onclick="openFriendsPanel()" title="Mis amigos" id="friends-fab-btn" style="position: relative;">
          👥
        </button>
      `;
    }
  } else {
    // Usuario no logueado
    container.innerHTML = `
      <button class="auth-login-btn" onclick="openLoginModal()">🚪 Entrar</button>
    `;
    if (friendsContainer) {
      friendsContainer.innerHTML = '';
    }
  }
}

// Preguntas de seguridad temáticas de La que se avecina
const SECURITY_QUESTIONS = [
  "¿Cuál es tu personaje favorito de La que se avecina?",
  "¿En qué piso vive Antonio Recio?",
  "¿Cuál es el apodo de Amador Rivas?",
  "¿Cómo se llama el perro de la comunidad?",
  "¿Cuál es el negocio de Antonio Recio?",
  "¿Cuál es el nombre completo de Berta?"
];

// Modal de Iniciar Sesión / Registro
function openLoginModal() {
  closeAllModals();

  const questionOptions = SECURITY_QUESTIONS.map((q, i) =>
    `<option value="${i}">${q}</option>`
  ).join('');

  const overlay = document.createElement("div");
  overlay.id = "auth-modal";
  overlay.className = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-box">
      <button class="auth-x" onclick="closeAllModals()">✕</button>
      <div class="auth-icon">🎭</div>
      <h2 id="auth-title" class="auth-h2">INICIAR SESIÓN</h2>
      <p class="auth-p">Accede para guardar tus logros y aparecer en el ranking.</p>
      
      <div id="auth-err" class="auth-err" style="display:none"></div>
      
      <input type="text" id="auth-username" class="auth-inp" placeholder="Nombre de usuario" maxlength="15">
      <input type="password" id="auth-password" class="auth-inp" placeholder="Contraseña">

      <!-- Solo visible en modo registro -->
      <div id="auth-security-wrap" style="display:none; width:100%; display:none; flex-direction:column; gap:8px;">
        <select id="auth-security-q" class="auth-inp" style="cursor:pointer; padding-right:8px; background:rgba(255,255,255,0.06); color:#fff; border:1px solid rgba(255,255,255,0.15); -webkit-appearance:none; appearance:none;">
          ${questionOptions}
        </select>
        <input type="text" id="auth-security-a" class="auth-inp" placeholder="Tu respuesta (la recordarás siempre)">
      </div>
      
      <button class="auth-btn" id="auth-submit-btn" onclick="handleAuthSubmit()">Entrar</button>
      
      <p class="auth-sw" id="auth-switch-text">
        ¿No tienes cuenta? <a href="#" onclick="toggleAuthMode(true); return false;">Regístrate aquí</a>
      </p>
      <p class="auth-sw" id="auth-forgot-text" style="margin-top:2px">
        <a href="#" onclick="openForgotModal(); return false;">¿Olvidaste tu contraseña?</a>
      </p>
    </div>
  `;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
  document.body.appendChild(overlay);
}

let isSignUpMode = false;
function toggleAuthMode(signUp) {
  isSignUpMode = signUp;
  const title = document.getElementById("auth-title");
  const btn = document.getElementById("auth-submit-btn");
  const sw = document.getElementById("auth-switch-text");
  const forgotLink = document.getElementById("auth-forgot-text");
  const secWrap = document.getElementById("auth-security-wrap");
  const err = document.getElementById("auth-err");
  if (err) err.style.display = "none";

  if (signUp) {
    title.textContent = "REGISTRARSE";
    btn.textContent = "Registrarse";
    sw.innerHTML = `¿Ya tienes cuenta? <a href="#" onclick="toggleAuthMode(false); return false;">Inicia sesión aquí</a>`;
    if (secWrap) secWrap.style.display = "flex";
    if (forgotLink) forgotLink.style.display = "none";
  } else {
    title.textContent = "INICIAR SESIÓN";
    btn.textContent = "Entrar";
    sw.innerHTML = `¿No tienes cuenta? <a href="#" onclick="toggleAuthMode(true); return false;">Regístrate aquí</a>`;
    if (secWrap) secWrap.style.display = "none";
    if (forgotLink) forgotLink.style.display = "block";
  }
}

// Procesar login/registro en la base de datos en tiempo real
async function handleAuthSubmit() {
  const usernameInput = document.getElementById("auth-username");
  const passwordInput = document.getElementById("auth-password");

  const username = (usernameInput.value || "").trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showAuthError("Por favor, rellena todos los campos.");
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9_ñÑ]+$/;
  if (!usernameRegex.test(username)) {
    showAuthError("El usuario solo puede contener letras, números y guiones bajos.");
    return;
  }

  if (password.length < 6) {
    showAuthError("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  const userKey = username.toLowerCase();
  const db = firebase.database();

  try {
    if (isSignUpMode) {
      // Registro
      if (userKey === "admin") {
        showAuthError("El nombre de usuario 'admin' está reservado.");
        return;
      }

      const snap = await db.ref("users/" + userKey).once("value");
      if (snap.exists()) {
        showAuthError("El nombre de usuario ya está registrado.");
        return;
      }

      // Recoger pregunta y respuesta de seguridad
      const secQSelect = document.getElementById("auth-security-q");
      const secAInput = document.getElementById("auth-security-a");
      const secQIndex = secQSelect ? parseInt(secQSelect.value) : 0;
      const secAnswer = (secAInput ? secAInput.value : "").trim().toLowerCase();

      if (!secAnswer) {
        showAuthError("Por favor, escribe tu respuesta de seguridad.");
        return;
      }

      const initialProfile = {
        username: username,
        password: password,
        securityQuestionIndex: secQIndex,
        securityAnswer: secAnswer,
        avatar: "img/personajes/amador-rivas.webp",
        wins: 0,
        played: 0,
        achievements: ["primer_paso"]
      };

      await db.ref("users/" + userKey).set(initialProfile);
      await db.ref("leaderboard/" + userKey).set({
        username: username,
        avatar: "img/personajes/amador-rivas.webp",
        wins: 0,
        played: 0
      });

      // Iniciar sesión
      localStorage.setItem("lqsa_user", userKey);

      // Iniciar escucha del perfil
      db.ref("users/" + userKey).on("value", (newSnap) => {
        if (newSnap.exists()) {
          currentUserProfile = newSnap.val();
          currentUserProfile.uid = userKey;

          // 👇 INYECTAR AQUÍ EL MOTOR PREMIUM DEL ÁLBUM
          if (typeof initAlbumSystem === 'function') initAlbumSystem(userKey);

          updateAuthNav();

          // Iniciar presencia y amigos tras registro
          if (typeof initPresence === 'function') initPresence(userKey);
          if (typeof initFriendsSystem === 'function') initFriendsSystem(userKey);

          if (typeof window.onUserProfileLoaded === "function") {
            window.onUserProfileLoaded();
          }
        }
      });

      closeAllModals();
    } else {
      // Login
      let snap = await db.ref("users/" + userKey).once("value");

      // Auto-crear cuenta de administrador si no existe en la base de datos
      if (userKey === "admin" && !snap.exists()) {
        const adminProfile = {
          username: "admin",
          password: "catena13",
          securityQuestionIndex: 0,
          securityAnswer: "catena13",
          avatar: "img/personajes/coque-calatrava.webp",
          wins: 0,
          played: 0,
          achievements: ["primer_paso"]
        };
        await db.ref("users/admin").set(adminProfile);
        snap = await db.ref("users/admin").once("value");
      }

      if (!snap.exists()) {
        showAuthError("El nombre de usuario no existe.");
        return;
      }

      const profile = snap.val();
      if (profile.password !== password) {
        showAuthError("Contraseña incorrecta.");
        return;
      }

      localStorage.setItem("lqsa_user", userKey);

      // Iniciar escucha
      db.ref("users/" + userKey).on("value", (newSnap) => {
        if (newSnap.exists()) {
          currentUserProfile = newSnap.val();
          currentUserProfile.uid = userKey;

          // 👇 INYECTAR AQUÍ EL MOTOR PREMIUM DEL ÁLBUM
          if (typeof initAlbumSystem === 'function') initAlbumSystem(userKey);

          updateAuthNav();

          // Iniciar presencia y amigos tras login
          if (typeof initPresence === 'function') initPresence(userKey);
          if (typeof initFriendsSystem === 'function') initFriendsSystem(userKey);

          if (typeof window.onUserProfileLoaded === "function") {
            window.onUserProfileLoaded();
          }
        }
      });

      closeAllModals();
    }
  } catch (error) {
    console.error(error);
    showAuthError("Ocurrió un error al procesar la solicitud: " + error.message);
  }
}

function showAuthError(msg) {
  const errDiv = document.getElementById("auth-err");
  if (errDiv) {
    errDiv.textContent = msg;
    errDiv.style.display = "block";
  }
}

// Modal del Perfil del Usuario Logueado
function openProfileModal() {
  closeAllModals();
  if (!currentUserProfile) return;

  const overlay = document.createElement("div");
  overlay.id = "auth-modal";
  overlay.className = "auth-overlay";

  const maxStreak = currentUserProfile.maxStreak || 0;
  const wins = currentUserProfile.wins || 0;
  const winsMachine = currentUserProfile.wins_machine || 0;
  const winsOnline = currentUserProfile.wins_online || 0;
  const played = currentUserProfile.played || 0;
  const qWon = currentUserProfile.total_questions_won_games || 0;
  const qAverage = wins > 0 ? (Math.round((qWon / wins) * 10) / 10) : 0;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  // Renderizar la lista de logros del modal
  const unlockedSet = new Set(currentUserProfile.achievements || []);
  const achievementsHtml = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlockedSet.has(ach.id);
    return `
      <div class="ach-modal-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="ach-modal-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="ach-modal-info">
          <div class="ach-modal-name">${ach.name}</div>
          <div class="ach-modal-desc">${ach.desc}</div>
          ${isUnlocked ? `<div class="ach-modal-quote">"${ach.quote}"</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // ── Selector de avatares paginado ──
  const avatarsList = (typeof ALL_CHARACTERS !== "undefined")
    ? ALL_CHARACTERS.map(c => {
      const slug = c.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { name: c.nombre, file: `${slug}.webp` };
    })
    : AVATAR_CHARACTERS;

  // Almacenar la lista globalmente para la paginación
  window._avatarsList = avatarsList;
  window._avatarPage = 0;
  const AV_PER_PAGE = 12;

  function _renderAvatarPage(page) {
    window._avatarPage = page;
    const total = window._avatarsList.length;
    const pages = Math.ceil(total / AV_PER_PAGE);
    const start = page * AV_PER_PAGE;
    const slice = window._avatarsList.slice(start, start + AV_PER_PAGE);
    const grid = document.getElementById('av-page-grid');
    const info = document.getElementById('av-page-info');
    const btnPrev = document.getElementById('av-btn-prev');
    const btnNext = document.getElementById('av-btn-next');
    if (!grid) return;
    grid.innerHTML = slice.map(av => {
      const fp = `img/personajes/${av.file}`;
      const sel = currentUserProfile.avatar === fp ? 'selected' : '';
      return `<div class="av-sel-item ${sel}" onclick="selectNewAvatar('${fp}')">
        <img src="${fp}" alt="${av.name}" title="${av.name}"
          onerror="if(this.src.endsWith('.webp')){this.src=this.src.replace('.webp','.jpg')}else if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.jpeg')}else{this.style.display='none'}">
      </div>`;
    }).join('');
    if (info) info.textContent = `Página ${page + 1} / ${pages}`;
    if (btnPrev) btnPrev.disabled = page === 0;
    if (btnNext) btnNext.disabled = page >= pages - 1;
  }
  window._renderAvatarPage = _renderAvatarPage;

  overlay.innerHTML = `
    <div class="auth-box profile-box" style="width: min(520px, 94vw); max-height: 85vh; overflow-y: auto;">
      <button class="auth-x" onclick="closeAllModals()">✕</button>
      <div class="profile-av">
        <img class="profile-av-img" src="${currentUserProfile.avatar}" alt="Avatar" onerror="this.src='img/personajes/amador-rivas.webp'">
      </div>
      <h2 class="auth-h2" style="font-size: 1.9rem;">${currentUserProfile.username}</h2>
      <p class="auth-p" style="color: var(--accent); font-weight: bold; font-family:'Barlow Condensed',sans-serif; letter-spacing:1px;">VECINO/A REGISTRADO/A</p>
      <p style="font-family:'Barlow Condensed',sans-serif; font-size:0.85rem; color:var(--text2); letter-spacing:1px; margin:0 0 4px;">${_getTitleFromProfile(currentUserProfile)}</p>
      
      <div class="profile-stats" style="margin-top:10px; display: flex; flex-direction: column; gap: 8px; width: 100%;">
        <div class="pstat-card" style="display:flex; justify-content: space-around; width:100%; text-align:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 0;">
          <div><div class="pstat-num" style="font-size:1.4rem;font-weight:bold;color:var(--text);">${played}</div><div class="pstat-lbl" style="font-size:0.75rem;color:var(--text2);">Jugadas</div></div>
          <div><div class="pstat-num" style="font-size:1.4rem;font-weight:bold;color:var(--accent);">${wins}</div><div class="pstat-lbl" style="font-size:0.75rem;color:var(--text2);">Victorias</div></div>
          <div><div class="pstat-num" style="font-size:1.4rem;font-weight:bold;color:var(--text);">${winRate}%</div><div class="pstat-lbl" style="font-size:0.75rem;color:var(--text2);">Ratio</div></div>
        </div>
        <div class="pstat-card" style="display:flex; justify-content: space-around; width:100%; text-align:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 0;">
          <div><div class="pstat-num" style="font-size:1.3rem;font-weight:bold;color:#f97316;">🤖 ${winsMachine}</div><div class="pstat-lbl" style="font-size:0.7rem;color:var(--text2);">vs Máquina</div></div>
          <div><div class="pstat-num" style="font-size:1.3rem;font-weight:bold;color:#3b82f6;">👥 ${winsOnline}</div><div class="pstat-lbl" style="font-size:0.7rem;color:var(--text2);">vs Online</div></div>
          <div><div class="pstat-num" style="font-size:1.3rem;font-weight:bold;color:#fbbf24;">🔥 ${maxStreak}</div><div class="pstat-lbl" style="font-size:0.7rem;color:var(--text2);">Racha Max</div></div>
          <div><div class="pstat-num" style="font-size:1.3rem;font-weight:bold;color:#a855f7;">❓ ${qAverage}</div><div class="pstat-lbl" style="font-size:0.7rem;color:var(--text2);">Preg. Media</div></div>
        </div>
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif; letter-spacing:1px; color:var(--accent); font-size:1.2rem; margin:12px 0 6px 0; align-self: flex-start;">Cambiar Foto de Perfil</h3>
      <div id="av-page-grid" class="avatar-selector-grid">
      </div>
      <!-- Controles de paginación de avatares -->
      <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin-top:8px; width:100%;">
        <button id="av-btn-prev" onclick="window._renderAvatarPage(window._avatarPage - 1)"
          style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15); color:var(--text); border-radius:8px; padding:5px 14px; font-size:1rem; cursor:pointer; transition:all 0.15s;"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">‹ Ant.</button>
        <span id="av-page-info" style="font-family:'Barlow Condensed',sans-serif; font-size:0.82rem; color:var(--text2); letter-spacing:1px;"></span>
        <button id="av-btn-next" onclick="window._renderAvatarPage(window._avatarPage + 1)"
          style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15); color:var(--text); border-radius:8px; padding:5px 14px; font-size:1rem; cursor:pointer; transition:all 0.15s;"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)'">Sig. ›</button>
      </div>

      <h3 style="font-family:'Bebas Neue',sans-serif; letter-spacing:1px; color:var(--accent); font-size:1.2rem; margin:16px 0 6px 0; align-self: flex-start;">Mis Logros</h3>
      <div class="ach-modal-list">
        ${achievementsHtml}
      </div>

      <a href="ranking.html" class="profile-ranking-link" style="margin-top:16px">🏆 Ir al Ranking Global</a>
      
      ${(currentUserProfile && currentUserProfile.username && currentUserProfile.username.toLowerCase() === 'admin') ? `
        <button class="auth-btn" style="background:#dc2626; color:#fff; font-family:'Barlow Condensed',sans-serif; margin-top: 10px; font-weight:bold; letter-spacing:1px; width:100%; border:none; padding:10px; border-radius:8px; cursor:pointer;" onclick="openAdminModal()">⚙️ Panel de Administrador</button>
      ` : ''}
      
      <button class="auth-signout" onclick="handleSignOut()">Cerrar sesión</button>
    </div>
  `;

  // Siempre inyectar estilos frescos (eliminar primero si ya existen)
  const _oldStyles = document.getElementById("profile-modal-styles");
  if (_oldStyles) _oldStyles.remove();
  const style = document.createElement("style");
  style.id = "profile-modal-styles";
  style.textContent = `
    .avatar-selector-grid {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; width: 100%;
      padding: 6px;
      background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
      min-height: 130px;
    }
    .av-sel-item {
      aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: all 0.15s;
    }
    .av-sel-item:hover { border-color: rgba(240,192,32,0.6); transform: scale(1.08); }
    .av-sel-item.selected { border-color: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .av-sel-item img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

    #av-btn-prev:disabled, #av-btn-next:disabled { opacity: 0.3; cursor: default; pointer-events: none; }

    .ach-modal-list {
      display: flex; flex-direction: column; gap: 8px; width: 100%;
    }

    .ach-modal-item {
      display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .ach-modal-item.locked { opacity: 0.5; }
    .ach-modal-icon { font-size: 1.6rem; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); }
    .unlocked .ach-modal-icon { background: rgba(240,192,32,0.15); color: var(--accent); }
    .ach-modal-info { display: flex; flex-direction: column; text-align: left; }
    .ach-modal-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--text); }
    .unlocked .ach-modal-name { color: var(--accent); }
    .ach-modal-desc { font-size: 0.76rem; color: var(--text2); line-height: 1.35; margin-top: 1px; }
    .ach-modal-quote { font-size: 0.72rem; color: var(--accent); opacity: 0.85; font-style: italic; margin-top: 3px; }

    @media (max-width: 480px) {
      .avatar-selector-grid { grid-template-columns: repeat(4, 1fr); }
    }
  `;
  document.head.appendChild(style);

  overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
  document.body.appendChild(overlay);

  // Renderizar primera página de avatares tras insertar el DOM
  requestAnimationFrame(() => window._renderAvatarPage(0));
}

// Seleccionar nuevo avatar
async function selectNewAvatar(path) {
  const savedUser = localStorage.getItem("lqsa_user");
  if (!savedUser) return;

  try {
    const db = firebase.database();
    await db.ref("users/" + savedUser + "/avatar").set(path);
    await db.ref("leaderboard/" + savedUser + "/avatar").set(path);

    // Recargar modal
    currentUserProfile.avatar = path;
    openProfileModal();
  } catch (error) {
    console.error("Error al actualizar avatar:", error);
  }
}

// Cerrar sesión
async function handleSignOut() {
  const uid = localStorage.getItem('lqsa_user');
  if (uid) {
    if (typeof destroyPresence === 'function') destroyPresence(uid);
    if (typeof destroyFriendsSystem === 'function') destroyFriendsSystem(uid);
  }
  localStorage.removeItem("lqsa_user");
  currentUserProfile = null;
  updateAuthNav();
  closeAllModals();
  if (typeof window.onUserProfileLoaded === "function") {
    window.onUserProfileLoaded();
  }
}

function closeAllModals() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.remove();
}

// ─── Flujo de Recuperación de Contraseña ───────────────────────────

// Paso 1: pedir nombre de usuario
function openForgotModal() {
  closeAllModals();
  const overlay = document.createElement("div");
  overlay.id = "auth-modal";
  overlay.className = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-box">
      <button class="auth-x" onclick="openLoginModal()">✕</button>
      <div class="auth-icon">🔑</div>
      <h2 class="auth-h2">RECUPERAR CUENTA</h2>
      <p class="auth-p">Escribe tu nombre de usuario para recuperar tu contraseña.</p>
      <div id="auth-err" class="auth-err" style="display:none"></div>
      <input type="text" id="forgot-username" class="auth-inp" placeholder="Nombre de usuario" maxlength="15">
      <button class="auth-btn" onclick="handleForgotStep1()">Continuar</button>
      <p class="auth-sw"><a href="#" onclick="openLoginModal(); return false;">← Volver al inicio de sesión</a></p>
    </div>
  `;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
  document.body.appendChild(overlay);
}

// Paso 2: mostrar pregunta de seguridad
async function handleForgotStep1() {
  const usernameInput = document.getElementById("forgot-username");
  const username = (usernameInput ? usernameInput.value : "").trim().toLowerCase();
  if (!username) { showAuthError("Escribe tu nombre de usuario."); return; }

  try {
    const db = firebase.database();
    const snap = await db.ref("users/" + username).once("value");
    if (!snap.exists()) { showAuthError("No existe ningún vecino con ese nombre."); return; }

    const profile = snap.val();
    const qIndex = profile.securityQuestionIndex ?? 0;
    const question = SECURITY_QUESTIONS[qIndex] || SECURITY_QUESTIONS[0];

    closeAllModals();
    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
      <div class="auth-box">
        <button class="auth-x" onclick="openForgotModal()">✕</button>
        <div class="auth-icon">🔐</div>
        <h2 class="auth-h2">PREGUNTA SECRETA</h2>
        <p class="auth-p" style="font-weight:600; color:var(--accent); font-family:'Barlow Condensed',sans-serif;">${question}</p>
        <div id="auth-err" class="auth-err" style="display:none"></div>
        <input type="text" id="forgot-answer" class="auth-inp" placeholder="Tu respuesta">
        <input type="password" id="forgot-newpass" class="auth-inp" placeholder="Nueva contraseña (mín. 6 caracteres)">
        <button class="auth-btn" onclick="handleForgotStep2('${username}', ${qIndex})">Cambiar contraseña</button>
        <p class="auth-sw"><a href="#" onclick="openForgotModal(); return false;">← Atrás</a></p>
      </div>
    `;
    overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
    document.body.appendChild(overlay);
  } catch (err) {
    showAuthError("Error al buscar el usuario: " + err.message);
  }
}

// Paso 3: validar respuesta y guardar nueva contraseña
async function handleForgotStep2(userKey, qIndex) {
  const answerInput = document.getElementById("forgot-answer");
  const newPassInput = document.getElementById("forgot-newpass");
  const answer = (answerInput ? answerInput.value : "").trim().toLowerCase();
  const newPass = newPassInput ? newPassInput.value : "";

  if (!answer) { showAuthError("Por favor, escribe tu respuesta."); return; }
  if (newPass.length < 6) { showAuthError("La nueva contraseña debe tener al menos 6 caracteres."); return; }

  try {
    const db = firebase.database();
    const snap = await db.ref("users/" + userKey).once("value");
    if (!snap.exists()) { showAuthError("Usuario no encontrado."); return; }

    const profile = snap.val();
    const storedAnswer = (profile.securityAnswer || "").toLowerCase();

    if (answer !== storedAnswer) {
      showAuthError("Respuesta incorrecta. Inténtalo de nuevo.");
      return;
    }

    // Respuesta correcta → guardar nueva contraseña
    await db.ref("users/" + userKey + "/password").set(newPass);

    closeAllModals();
    // Mostrar confirmación de éxito
    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
      <div class="auth-box" style="text-align:center; gap:14px;">
        <div class="auth-icon">✅</div>
        <h2 class="auth-h2" style="color:#4ade80;">¡CONTRASEÑA CAMBIADA!</h2>
        <p class="auth-p">Tu contraseña se ha actualizado correctamente, vecino/a. Ya puedes iniciar sesión.</p>
        <button class="auth-btn" onclick="openLoginModal()">Iniciar sesión</button>
      </div>
    `;
    overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
    document.body.appendChild(overlay);
  } catch (err) {
    showAuthError("Error al cambiar la contraseña: " + err.message);
  }
}

// Interceptar guardado de estadísticas del juego
// Obtener identificador de semana ISO-8601
window.getWeeklyKey = function () {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d - start) / 86400000) + 1) / 7);
  return `${year}-W${week}`;
};

// Interceptar guardado de estadísticas del juego
window.StatsFirebase = {
  saveGameResult: async function (mode, attempts, won, rivalName = null) {
    const savedUser = localStorage.getItem("lqsa_user");
    if (!savedUser) return;

    try {
      const db = firebase.database();
      const userRef = db.ref("users/" + savedUser);

      const snap = await userRef.once("value");
      if (!snap.exists()) return;
      const profile = snap.val();

      // ── Estadísticas básicas y expandidas ──
      profile.played = (profile.played || 0) + 1;
      if (mode === 'quien_machine') {
        profile.played_machine = (profile.played_machine || 0) + 1;
      } else if (mode === 'quien_online') {
        profile.played_online = (profile.played_online || 0) + 1;
      }

      if (won) {
        profile.wins = (profile.wins || 0) + 1;
        profile.currentStreak = (profile.currentStreak || 0) + 1;
        profile.total_questions_won_games = (profile.total_questions_won_games || 0) + attempts;

        if (mode === 'quien_machine') {
          profile.wins_machine = (profile.wins_machine || 0) + 1;
        } else if (mode === 'quien_online') {
          profile.wins_online = (profile.wins_online || 0) + 1;
        }

        // central economy coin rewards
        let coinReward = 10; // vs IA básico por defecto
        if (mode === 'quien_machine' && typeof gameDifficulty !== 'undefined' && gameDifficulty === 'dios') coinReward = 25;
        if (mode === 'quien_online') coinReward = 30;

        // Bonificaciones Premium Especiales
        if (attempts < 3) coinReward += 15; // Relámpago
        if (attempts === 0) coinReward += 40; // Sin Red

        // Impactar balance de monedas de forma segura por incremento
        await userRef.child('coins').transaction(c => (c || 0) + coinReward);

        // Progresar misiones diarias de forma automática
        if (typeof progressMission === 'function') {
          await progressMission(savedUser, "play_game", 1);
          if (mode === "quien_machine") await progressMission(savedUser, "win_machine", 1);
          if (attempts >= 5) await progressMission(savedUser, "ask_questions", attempts);
        }
      } else {
        profile.currentStreak = 0;
      }
      profile.maxStreak = Math.max(profile.maxStreak || 0, profile.currentStreak || 0);

      // ── Lógica de logros ──
      const currentAchievements = new Set(profile.achievements || []);

      // 1. Registro
      currentAchievements.add("primer_paso");

      // 2. Primera victoria contra la máquina
      if (won && mode === "quien_machine") {
        currentAchievements.add("primera_victoria");
      }

      // 3. Jugar primera partida online
      if (mode === "quien_online") {
        currentAchievements.add("primera_online");
      }

      // 4. Jugar 5 partidas
      if (profile.played >= 5) currentAchievements.add("cinco_partidas");

      // 5. Ganar en modo DIOS
      if (won && typeof gameDifficulty !== "undefined" && gameDifficulty === "dios") {
        currentAchievements.add("dios_mode");
      }

      // 6. Ganar con Antonio Recio
      let isRecioGame = false;
      if (typeof mySecret !== "undefined" && mySecret && mySecret.nombre === "Antonio Recio") isRecioGame = true;
      if (typeof machineSecret !== "undefined" && machineSecret && machineSecret.nombre === "Antonio Recio") isRecioGame = true;
      if (typeof oppSecret !== "undefined" && oppSecret && oppSecret.nombre === "Antonio Recio") isRecioGame = true;
      if (won && isRecioGame) currentAchievements.add("adivinado_recio");

      // 7. Relámpago: ganar con menos de 3 preguntas
      if (won && attempts < 3) currentAchievements.add("relampago");

      // 8. Sin Red: ganar sin hacer ninguna pregunta
      if (won && attempts === 0) currentAchievements.add("sin_red");

      // 9. Veterano: 50 partidas jugadas
      if (profile.played >= 50) currentAchievements.add("veterano");

      // 10. Cosmopolita: adivinar personaje extranjero
      if (won) {
        let rival = null;
        const charList = (typeof ALL_CHARACTERS !== "undefined") ? ALL_CHARACTERS : (typeof CHARACTERS !== "undefined" ? CHARACTERS : []);
        if (rivalName) {
          rival = charList.find(c => c.nombre === rivalName);
        } else {
          rival = (typeof machineSecret !== "undefined" && machineSecret) ? machineSecret : null;
        }
        if (rival && rival.origen && rival.origen !== "España") {
          currentAchievements.add("cosmopolita");
        }
      }

      // 11. Domador de IA: 10 victorias vs máquina
      if ((profile.wins_machine || 0) >= 10) currentAchievements.add("domador_ia");

      // 12. Racha imparable: racha de 5 victorias
      if ((profile.currentStreak || 0) >= 5) currentAchievements.add("racha_5");

      profile.achievements = Array.from(currentAchievements);

      // ── Título calculado ──
      profile.title = _getTitleFromProfile(profile);

      // Guardar en RTDB
      await userRef.set(profile);

      // Actualizar ranking con subcategorías
      const rankData = {
        username: profile.username,
        avatar: profile.avatar || "img/personajes/amador-rivas.webp",
        wins: profile.wins || 0,
        played: profile.played || 0,
        wins_machine: profile.wins_machine || 0,
        wins_online: profile.wins_online || 0,
        played_machine: profile.played_machine || 0,
        played_online: profile.played_online || 0,
        maxStreak: profile.maxStreak || 0,
        title: profile.title || ''
      };

      await db.ref("leaderboard/" + savedUser).set(rankData);

      // Sincronizar ranking semanal
      const weeklyKey = window.getWeeklyKey();
      await db.ref(`weekly_leaderboards/${weeklyKey}/${savedUser}`).set(rankData);

      // ── Feed de Actividad Público ──
      let actText = "";
      if (mode === 'quien_machine') {
        actText = won
          ? `Adivinó a **${rivalName || "su rival"}** contra la máquina en ${attempts} preguntas.`
          : `Perdió contra la máquina intentando adivinar a **${rivalName || "su rival"}**.`;
      } else if (mode === 'quien_online') {
        actText = won
          ? `Ganó un duelo online adivinando a **${rivalName || "su rival"}** en ${attempts} preguntas.`
          : `Perdió un duelo online contra su rival.`;
      }

      if (actText) {
        const feedRef = db.ref("activity_feed");
        const newAct = feedRef.push();
        await newAct.set({
          username: profile.username,
          avatar: profile.avatar || "img/personajes/amador-rivas.webp",
          text: actText,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Limitar a los últimos 25 elementos
        feedRef.once('value', async (feedSnap) => {
          if (feedSnap.exists() && feedSnap.numChildren() > 25) {
            let items = [];
            feedSnap.forEach(child => { items.push({ key: child.key, ...child.val() }); });
            items.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = items.length - 25;
            for (let i = 0; i < toDelete; i++) {
              feedRef.child(items[i].key).remove();
            }
          }
        });
      }

      // Confetti si se desbloquó un logro nuevo
      const oldLen = (snap.val().achievements || []).length;
      if (profile.achievements.length > oldLen) {
        if (typeof confetti === "function") {
          confetti({ particleCount: 80, spread: 50, origin: { y: 0.8 } });
        }
      }
    } catch (error) {
      console.error("Error al guardar estadísticas en Firebase:", error);
    }
  }
};

// ── Panel de Control del Administrador ─────────────────
async function openAdminModal() {
  closeAllModals();

  const overlay = document.createElement("div");
  overlay.id = "auth-modal";
  overlay.className = "auth-overlay";

  overlay.innerHTML = `
    <div class="auth-box profile-box" style="width: min(600px, 94vw); max-height: 85vh; overflow-y: auto; text-align: left;">
      <button class="auth-x" onclick="openProfileModal()">✕</button>
      <h2 class="auth-h2" style="font-size: 2rem; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; text-align: center; margin-top: 10px;">⚙️ PANEL DE CONTROL</h2>
      <p class="auth-p" style="color: var(--text2); margin-bottom: 15px; text-align: center;">Gestiona los vecinos registrados en LQSACatena.</p>

      <div style="margin-bottom: 15px; display:flex; gap:10px; flex-wrap:wrap; width:100%;">
        <input type="text" id="admin-user-search" class="auth-inp" placeholder="🔍 Buscar vecino por nombre..." oninput="filterAdminUsers()" style="margin: 0; flex:1; min-width:200px;">
        <button onclick="adminResetAllStats()" style="background:rgba(239,68,68,0.12); border:1px solid #ef4444; color:#f87171; border-radius:8px; padding:10px 16px; font-size:0.8rem; cursor:pointer; font-weight:bold; transition:all 0.2s; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase; letter-spacing:0.5px;">⚠️ Resetear Todos los Stats</button>
      </div>

      <div id="admin-users-list" style="display:flex; flex-direction:column; gap:10px; max-height:350px; overflow-y:auto; padding-right:5px; scrollbar-width:thin; width:100%;">
        <p style="color:var(--text2); text-align:center;">Cargando vecinos...</p>
      </div>
    </div>
  `;

  overlay.addEventListener("click", e => { if (e.target === overlay) closeAllModals(); });
  document.body.appendChild(overlay);

  // Cargar usuarios
  loadAdminUsers();
}

let cachedAdminUsers = {};

async function loadAdminUsers() {
  const listContainer = document.getElementById("admin-users-list");
  if (!listContainer) return;

  try {
    const db = firebase.database();
    const snap = await db.ref("users").once("value");
    if (!snap.exists()) {
      listContainer.innerHTML = `<p style="color:var(--text2); text-align:center;">No hay vecinos registrados.</p>`;
      return;
    }

    cachedAdminUsers = snap.val();
    renderAdminUsersList(cachedAdminUsers);
  } catch (error) {
    console.error("Error en panel admin:", error);
    listContainer.innerHTML = `<p style="color:#f87171; text-align:center;">Error: ${error.message}</p>`;
  }
}

function renderAdminUsersList(users) {
  const listContainer = document.getElementById("admin-users-list");
  if (!listContainer) return;

  let html = "";
  for (const [key, user] of Object.entries(users)) {
    // Evitar que el admin se borre a sí mismo en el panel
    if (key.toLowerCase() === "admin") continue;

    const coins = user.coins || 0;

    html += `
      <div class="admin-user-row" data-username="${user.username}" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px 14px; border-radius:10px; gap:10px; flex-wrap:wrap; width:100%;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${user.avatar || 'img/personajes/amador-rivas.webp'}" alt="Avatar" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.15);">
          <div>
            <div style="font-weight:bold; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1.05rem;">${user.username}</div>
            <div style="font-size:0.75rem; color:var(--text2);">Contraseña: <span style="font-family:monospace; color:var(--accent); font-weight:bold;">${user.password}</span> | Monedas: <span style="color:#fbbf24; font-weight:bold;">🪙 ${coins}</span></div>
          </div>
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button onclick="adminGiveCoins('${key}', '${user.username}')" style="background:rgba(251,191,36,0.15); border:1px solid #fbbf24; color:#fbbf24; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">🪙 Monedas</button>
          <button onclick="adminSetCoinsZero('${key}', '${user.username}')" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#f87171; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;" title="Poner monedas del vecino a 0">🪙 0</button>
          <button onclick="openAdminGiveCardModal('${key}', '${user.username}')" style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#c084fc; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">🎴 Cromo</button>
          <button onclick="adminManagePlayerCards('${key}', '${user.username}')" style="background:rgba(236,72,153,0.15); border:1px solid #ec4899; color:#f472b6; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;" title="Gestión avanzada de cromos de su álbum">🎴 Gestión</button>
          <button onclick="adminChangePassword('${key}', '${user.username}')" style="background:rgba(240,192,32,0.15); border:1px solid var(--accent); color:var(--accent); border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">✏️ Clave</button>
          <button onclick="adminResetAchievements('${key}', '${user.username}')" style="background:rgba(251,146,60,0.15); border:1px solid #fb923c; color:#fb923c; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">🔒 Logros</button>
          <button onclick="adminResetStats('${key}', '${user.username}')" style="background:rgba(96,165,250,0.15); border:1px solid #60a5fa; color:#93c5fd; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">📊 Stats</button>
          <button onclick="adminDeleteUser('${key}', '${user.username}')" style="background:rgba(220,38,38,0.15); border:1px solid #dc2626; color:#ef4444; border-radius:6px; padding:5px 10px; font-size:0.73rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">🗑️ Borrar</button>
        </div>
      </div>
    `;
  }

  listContainer.innerHTML = html || `<p style="color:var(--text2); text-align:center;">No se encontraron vecinos.</p>`;
}

function filterAdminUsers() {
  const searchInput = document.getElementById("admin-user-search");
  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const rows = document.querySelectorAll(".admin-user-row");
  rows.forEach(row => {
    const uname = (row.dataset.username || "").toLowerCase();
    if (uname.includes(query)) {
      row.style.display = "flex";
    } else {
      row.style.display = "none";
    }
  });
}

async function adminChangePassword(key, username) {
  const newPass = prompt(`Escribe la nueva contraseña para el vecino "${username}":`);
  if (newPass === null) return; // Cancelado
  const pass = newPass.trim();
  if (pass.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    const db = firebase.database();
    await db.ref("users/" + key + "/password").set(pass);
    alert(`¡Contraseña del vecino "${username}" cambiada con éxito!`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al cambiar la contraseña: " + error.message);
  }
}

async function adminDeleteUser(key, username) {
  const confirmDel = confirm(`⚠️ ¿Estás COMPLETAMENTE seguro de que quieres eliminar al vecino "${username}"? Esto borrará su cuenta, logros y estadísticas de forma permanente.`);
  if (!confirmDel) return;

  try {
    const db = firebase.database();
    await db.ref("users/" + key).remove();
    await db.ref("leaderboard/" + key).remove();
    alert(`Vecino "${username}" eliminado con éxito.`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al eliminar vecino: " + error.message);
  }
}

// Resetear logros de un vecino
async function adminResetAchievements(key, username) {
  const ok = confirm(`⚠️ ¿Resetear TODOS los logros de "${username}"? Solo se conservará el logro de registro.`);
  if (!ok) return;
  try {
    const db = firebase.database();
    await db.ref("users/" + key + "/achievements").set(["primer_paso"]);
    alert(`✅ Logros de "${username}" reseteados. Solo conserva el logro de registro.`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al resetear logros: " + error.message);
  }
}

// Resetear historial/estadísticas de un vecino
async function adminResetStats(key, username) {
  const ok = confirm(`⚠️ ¿Resetear el HISTORIAL de partidas de "${username}"? Se pondrán a 0 sus victorias y partidas jugadas.`);
  if (!ok) return;
  try {
    const db = firebase.database();
    await db.ref("users/" + key).update({ wins: 0, played: 0 });
    await db.ref("leaderboard/" + key).update({ wins: 0, played: 0 });
    alert(`✅ Historial de "${username}" reseteado a 0 victorias y 0 partidas.`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al resetear historial: " + error.message);
  }
}

// Dar o quitar monedas a un vecino
async function adminGiveCoins(key, username) {
  const amountStr = prompt(`Escribe la cantidad de monedas a dar o quitar para el vecino "${username}" (usa números negativos para quitar):`);
  if (amountStr === null) return; // Cancelado
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) {
    alert("Cantidad no válida. Introduce un número entero.");
    return;
  }

  try {
    const db = firebase.database();
    const userCoinsRef = db.ref("users/" + key + "/coins");
    await userCoinsRef.transaction(current => {
      return (current || 0) + amount;
    });
    if (window.showLqsaAlert) showLqsaAlert(`Se han modificado las monedas del vecino "${username}" con éxito (${amount >= 0 ? '+' : ''}${amount} 🪙).`, "MONEDAS ACTUALIZADAS", "success");
    else alert(`✅ Se han modificado las monedas del vecino "${username}" con éxito (${amount >= 0 ? '+' : ''}${amount} 🪙).`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al modificar las monedas: " + error.message);
  }
}

// Poner las monedas de un vecino en 0
async function adminSetCoinsZero(key, username) {
  const ok = confirm(`⚠️ ¿Estás seguro de que quieres dejar en 0 las monedas del vecino "${username}"?`);
  if (!ok) return;

  try {
    const db = firebase.database();
    await db.ref("users/" + key + "/coins").set(0);
    if (window.showLqsaAlert) showLqsaAlert(`Se han puesto a 0 las monedas del vecino "${username}" con éxito.`, "MONEDAS A 0", "success");
    else alert(`✅ Se han puesto a 0 las monedas del vecino "${username}" con éxito.`);
    loadAdminUsers();
  } catch (error) {
    alert("Error al poner las monedas en 0: " + error.message);
  }
}

// Ventana de Inyección Interactiva de Cromos (Panel Visual con Catálogo Completo)
function openAdminGiveCardModal(userKey, username) {
  const existing = document.getElementById("admin-gift-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "admin-gift-modal";
  overlay.className = "auth-overlay";
  overlay.style.zIndex = "16000";
  overlay.style.background = "rgba(10, 6, 22, 0.95)";
  overlay.style.backdropFilter = "blur(10px)";

  overlay.innerHTML = `
    <div class="auth-box" style="width: min(850px, 96vw); max-height: 88vh; padding: 25px; border: 2px solid #a855f7; background: #0c0817; display:flex; flex-direction:column; gap:15px; overflow:hidden; border-radius: 16px;">
      
      <button class="auth-x" onclick="document.getElementById('admin-gift-modal').remove()">✕</button>
      
      <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2rem; color:#c084fc; margin:0; letter-spacing:1px;">🎁 REGALAR CROMOS A: ${username.toUpperCase()}</h2>
        <span style="font-family:monospace; font-size:0.75rem; background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.3); color:#c084fc; padding:4px 10px; border-radius:20px;">ADMIN CONSOLE</span>
      </div>

      <div style="display:flex; gap:10px; width:100%;">
        <input type="text" id="gift-card-search" placeholder="🔍 Buscar cromo por nombre..." oninput="filterGiftCards()" 
               style="flex:1; background:#161026; border:1px solid rgba(255,255,255,0.12); padding:10px 14px; border-radius:8px; color:#fff; font-size:0.9rem; outline:none; margin: 0;">
      </div>

      <!-- Rejilla de Cartas del Catálogo -->
      <div id="gift-cards-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:12px; overflow-y:auto; flex:1; padding-right:5px; scrollbar-width:thin; min-height: 250px;">
        <!-- Cargado dinámicamente -->
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Cargar cartas
  _renderGiftCardsList(userKey, username);
}

// Renderizar la lista de cartas del catálogo completo
function _renderGiftCardsList(userKey, username) {
  const grid = document.getElementById("gift-cards-grid");
  if (!grid || typeof ALBUM_CARDS === 'undefined') return;

  grid.innerHTML = ALBUM_CARDS.map(card => {
    const borderCol = card.baseRarity.color;
    return `
      <div class="gift-card-item" data-name="${card.name.toLowerCase()}" 
           style="border: 2px solid ${borderCol}; border-radius: 10px; overflow:hidden; background:#11111e; display:flex; flex-direction:column; text-align:left; position:relative; box-shadow:0 3px 8px rgba(0,0,0,0.4); height: 185px;">
        
        <img src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="width:100%; height:85px; object-fit:cover; border-bottom:1px solid rgba(255,255,255,0.06);">
        
        <div style="padding: 6px; display:flex; flex-direction:column; justify-content:space-between; flex:1; gap:4px;">
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:0.75rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.1;">
              ${card.name}
            </div>
            <div style="font-size:0.55rem; color:${borderCol}; font-weight:bold; text-transform:uppercase; font-family: monospace;">
              ${card.baseRarity.name}
            </div>
          </div>
          
          <!-- Botones de Inyección -->
          <div style="display:flex; flex-direction:column; gap:3px; margin-top:2px;">
            <button onclick="injectGiftCard('${userKey}', '${username}', '${card.id}', false, this)" 
                    style="width:100%; background:#1e293b; border:1px solid #475569; color:#e2e8f0; border-radius:4px; padding:3px; font-size:0.6rem; font-weight:bold; cursor:pointer; transition:all 0.15s; font-family:'Barlow Condensed',sans-serif;">
              🎴 REGALAR NORMAL
            </button>
            <button onclick="injectGiftCard('${userKey}', '${username}', '${card.id}', true, this)" 
                    style="width:100%; background:linear-gradient(135deg, #a855f7, #6366f1); border:none; color:#fff; border-radius:4px; padding:3px; font-size:0.6rem; font-weight:bold; cursor:pointer; transition:all 0.15s; font-family:'Barlow Condensed',sans-serif; text-shadow:0 1px 2px rgba(0,0,0,0.5);">
              🌈 REGALAR FOIL
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filtrar las cartas en tiempo real
function filterGiftCards() {
  const query = document.getElementById("gift-card-search").value.trim().toLowerCase();
  const items = document.querySelectorAll(".gift-card-item");
  items.forEach(item => {
    const name = item.dataset.name || "";
    if (name.includes(query)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

// Inyección inmediata del cromo por Firebase Transaction
async function injectGiftCard(userKey, username, cardId, isFoil, button) {
  if (typeof firebase === 'undefined') return;

  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = "⌛ ENVIANDO...";

  const db = firebase.database();
  const cardRef = db.ref(`users/${userKey}/album/cards/${cardId}`);

  try {
    await cardRef.transaction(current => {
      if (!current) {
        return {
          count: 1,
          foil: isFoil,
          obtainedAt: firebase.database.ServerValue.TIMESTAMP
        };
      } else {
        return {
          count: (current.count || 0) + 1,
          foil: current.foil || isFoil,
          obtainedAt: current.obtainedAt || firebase.database.ServerValue.TIMESTAMP
        };
      }
    });

    // Feedback inmediato
    button.style.background = "#22c55e";
    if (!isFoil) button.style.borderColor = "#22c55e";
    button.style.color = "#fff";
    button.innerHTML = "✓ ¡REGALADA!";

    // Disparar confeti en la posición de click
    if (typeof confetti === "function") {
      confetti({
        particleCount: 15,
        spread: 25,
        origin: {
          x: event.clientX / window.innerWidth,
          y: event.clientY / window.innerHeight
        }
      });
    }

    // Recargar la lista en segundo plano
    loadAdminUsers();

    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = originalText;
      button.style.background = "";
      button.style.borderColor = "";
      button.style.color = "";
    }, 1200);

  } catch (error) {
    console.error("Error inyectando cromo:", error);
    button.disabled = false;
    button.innerHTML = "❌ ERROR";
    button.style.background = "#dc2626";
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = "";
    }, 1500);
  }
}

// Resetear las estadísticas (wins / played) de TODOS los vecinos registrados
async function adminResetAllStats() {
  const confirmFirst = confirm("⚠️ ¿ESTÁS COMPLETAMENTE SEGURO DE ESTO?\n\nEsta acción reseteará a 0 las victorias (wins) y partidas jugadas (played) de TODOS los vecinos de forma simultánea. ¡Esto no se puede deshacer!");
  if (!confirmFirst) return;

  const confirmSecond = prompt("Para confirmar la eliminación masiva de estadísticas de todos los vecinos, escribe la palabra RESET en mayúsculas:");
  if (confirmSecond !== "RESET") {
    if (window.showLqsaAlert) {
      showLqsaAlert("Confirmación incorrecta. No se han modificado las estadísticas.", "OPERACIÓN CANCELADA", "error");
    } else {
      alert("Confirmación incorrecta. Operación cancelada.");
    }
    return;
  }

  try {
    const db = firebase.database();

    // Obtener todos los usuarios registrados
    const snap = await db.ref("users").once("value");
    if (!snap.exists()) {
      if (window.showLqsaAlert) showLqsaAlert("No se encontraron vecinos registrados.", "SIN USUARIOS", "error");
      else alert("No se encontraron vecinos.");
      return;
    }

    const users = snap.val();
    const updates = {};

    // Preparar el reset masivo atómico en Firebase
    for (const key of Object.keys(users)) {
      updates[`users/${key}/wins`] = 0;
      updates[`users/${key}/played`] = 0;
      updates[`leaderboard/${key}/wins`] = 0;
      updates[`leaderboard/${key}/played`] = 0;
    }

    await db.ref().update(updates);

    if (window.showLqsaAlert) {
      showLqsaAlert("Se han puesto a 0 las estadísticas de todos los vecinos correctamente.", "STATS RESETEADAS 🎉", "success");
    } else {
      alert("✅ ¡Estadísticas de todos los vecinos reseteadas a 0 con éxito!");
    }

    // Recargar la interfaz
    loadAdminUsers();
  } catch (error) {
    console.error("Error en reset masivo:", error);
    alert("Error al realizar el reset masivo: " + error.message);
  }
}

// ─── GESTIÓN AVANZADA DE CROMOS DE JUGADORES (ADMIN) ───────────────────
async function adminManagePlayerCards(userKey, username) {
  const existing = document.getElementById("admin-manage-cards-modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "admin-manage-cards-modal";
  overlay.className = "auth-overlay";
  overlay.style.zIndex = "16500";
  overlay.style.background = "rgba(8, 4, 18, 0.96)";
  overlay.style.backdropFilter = "blur(12px)";

  overlay.innerHTML = `
    <div style="width: min(1000px, 96vw); max-height: 90vh; padding: 25px; border: 2px solid #ec4899; background: #0b0716; display:flex; flex-direction:column; gap:18px; overflow:hidden; border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.85); box-sizing: border-box; position:relative;">
      
      <button class="auth-x" onclick="document.getElementById('admin-manage-cards-modal').remove()" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 36px; height: 36px; font-size: 1.1rem; font-weight: bold; cursor: pointer; position: absolute; top: 20px; right: 20px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.05)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
      
      <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-right: 40px;">
        <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2.2rem; color:#f472b6; margin:0; letter-spacing:1px; text-shadow:0 0 15px rgba(236,72,153,0.3);">🎴 ÁLBUM DE VECINO: ${username.toUpperCase()}</h2>
        <button onclick="adminDeleteAllCards('${userKey}', '${username}')" style="background:rgba(220,38,38,0.15); border:1px solid #dc2626; padding:8px 16px; border-radius:8px; color:#ef4444; cursor:pointer; font-weight:bold; font-size:0.8rem; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.5px; transition:all 0.2s;" onmouseover="this.style.background='#dc2626'; this.style.color='#fff';" onmouseout="this.style.background='rgba(220,38,38,0.15)'; this.style.color='#ef4444';">⚠️ ELIMINAR TODOS LOS CROMOS</button>
      </div>

      <div style="display:flex; gap:10px; width:100%;">
        <input type="text" id="admin-manage-card-search" placeholder="🔍 Buscar cromo por nombre..." oninput="adminFilterManageCards('${userKey}', '${username}')" 
               style="flex:1; background:#140e22; border:1px solid rgba(255,255,255,0.12); padding:10px 14px; border-radius:8px; color:#fff; font-size:0.9rem; outline:none; margin:0;">
      </div>

      <!-- Rejilla de Cartas Avanzada -->
      <div id="admin-manage-cards-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; overflow-y:auto; flex:1; padding: 5px; scrollbar-width:thin; min-height: 250px;">
        <p style="color:var(--text2); text-align:center;">Cargando inventario de cromos del vecino...</p>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
  adminRenderManageCardsGrid(userKey, username);
}

// Buscar y filtrar en el mazo de administración
function adminFilterManageCards(userKey, username) {
  const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
  adminRenderManageCardsGrid(userKey, username, query);
}

// Renderizar la rejilla completa de cromos y controles
async function adminRenderManageCardsGrid(userKey, username, query = '') {
  const grid = document.getElementById("admin-manage-cards-grid");
  if (!grid) return;

  try {
    const db = firebase.database();
    const snap = await db.ref(`users/${userKey}/album/cards`).once('value');
    const userCards = snap.exists() ? snap.val() : {};

    let html = "";

    // Obtener catálogo completo
    if (typeof ALBUM_CARDS === 'undefined') {
      grid.innerHTML = `<p style="color:#ef4444; text-align:center;">Catálogo del Álbum no encontrado (ALBUM_CARDS es undefined).</p>`;
      return;
    }

    const filtered = ALBUM_CARDS.filter(c => c.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="color:var(--text2); text-align:center;">No se encontraron cromos que coincidan con la búsqueda.</p>`;
      return;
    }

    html = filtered.map(card => {
      const uCard = userCards[card.id];
      const owned = !!uCard;
      const borderCol = card.baseRarity.color;

      if (owned) {
        const count = uCard.count || 1;
        const level = uCard.level || 1;
        const signed = !!uCard.signed;
        const foil = !!uCard.foil;

        return `
          <div style="border: 2px solid ${borderCol}; border-radius: 14px; background:#120c24; display:flex; flex-direction:column; overflow:hidden; position:relative; box-shadow:0 6px 16px rgba(0,0,0,0.6); padding:12px; gap:10px; height: 260px; box-sizing: border-box; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            
            <!-- Cabecera cromo -->
            <div style="display:flex; gap:12px; align-items:center;">
              <img src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="width:55px; height:55px; border-radius:10px; object-fit:cover; border:2px solid ${borderCol}; background: #0b0716;">
              <div style="flex:1; overflow:hidden;">
                <div style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:1.05rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2; text-align: left;">${card.name}</div>
                <div style="font-size:0.7rem; color:${borderCol}; font-weight:bold; text-transform:uppercase; font-family:monospace; text-align: left;">${card.baseRarity.name}</div>
              </div>
            </div>

            <!-- Controles de Edición -->
            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; display:flex; flex-direction:column; gap:8px; font-size:0.8rem; flex: 1; justify-content: space-between;">
              
              <!-- Cantidad / Repetidos -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text2); font-weight: 500;">Copias:</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'count', ${Math.max(0, count - 1)})" style="background:#334155; border:none; width:24px; height:24px; border-radius:6px; color:#fff; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.15s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">-</button>
                  <span style="font-weight:bold; color:#fbbf24; font-family:monospace; min-width:20px; text-align:center; font-size: 0.9rem;">${count}</span>
                  <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'count', ${count + 1})" style="background:#334155; border:none; width:24px; height:24px; border-radius:6px; color:#fff; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.15s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">+</button>
                </div>
              </div>

              <!-- Nivel de Desquicie -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text2); font-weight: 500;">Desquicie:</span>
                <select onchange="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'level', parseInt(this.value))" style="background:#1e1b4b; border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:#c084fc; font-weight:bold; padding:4px 8px; font-size:0.8rem; outline:none; cursor:pointer;">
                  <option value="1" ${level === 1 ? 'selected' : ''}>⭐ 1</option>
                  <option value="2" ${level === 2 ? 'selected' : ''}>⭐⭐ 2</option>
                  <option value="3" ${level === 3 ? 'selected' : ''}>⭐⭐⭐ 3</option>
                  <option value="4" ${level === 4 ? 'selected' : ''}>⭐⭐⭐⭐ 4</option>
                  <option value="5" ${level === 5 ? 'selected' : ''}>👑⭐⭐⭐⭐⭐ 5</option>
                </select>
              </div>

              <!-- Foil y Firmada en un row -->
              <div style="display:flex; justify-content:space-between; gap:8px; margin-top:2px;">
                <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'foil', ${!foil})" style="flex:1; background:${foil ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${foil ? 'transparent' : 'rgba(255,255,255,0.1)'}; color:${foil ? '#fff' : 'var(--text2)'}; font-size:0.7rem; padding:6px; border-radius:6px; font-weight:bold; cursor:pointer; transition:all 0.15s;">
                  🌈 ${foil ? 'FOIL' : 'NORMAL'}
                </button>
                <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'signed', ${!signed})" style="flex:1; background:${signed ? 'linear-gradient(135deg, #10b981, #047857)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${signed ? 'transparent' : 'rgba(255,255,255,0.1)'}; color:${signed ? '#fff' : 'var(--text2)'}; font-size:0.7rem; padding:6px; border-radius:6px; font-weight:bold; cursor:pointer; transition:all 0.15s;">
                  🖋️ ${signed ? 'FIRMADO' : 'S/ FIRMA'}
                </button>
              </div>

              <!-- Eliminar esta carta individual -->
              <button onclick="adminDeletePlayerCard('${userKey}', '${username}', '${card.id}')" style="background:rgba(220,38,38,0.15); border:1px solid #dc2626; color:#ef4444; border-radius:6px; padding:6px; font-size:0.75rem; font-weight:bold; margin-top:4px; cursor:pointer; transition:all 0.15s; font-family:'Barlow Condensed', sans-serif; letter-spacing:0.5px;" onmouseover="this.style.background='#dc2626'; this.style.color='#fff';" onmouseout="this.style.background='rgba(220,38,38,0.15)'; this.style.color='#ef4444';">
                🗑️ ELIMINAR CROMO
              </button>

            </div>
          </div>
        `;
      } else {
        // Cromo no obtenido
        return `
          <div style="border: 2px dashed rgba(255,255,255,0.12); border-radius: 14px; background:rgba(0,0,0,0.5); display:flex; flex-direction:column; overflow:hidden; position:relative; padding:12px; gap:10px; opacity:0.65; justify-content:space-between; height: 260px; box-sizing:border-box;">
            <div style="display:flex; gap:12px; align-items:center;">
              <div style="width:55px; height:55px; border-radius:10px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:1.6rem; color:#888; border: 2px dashed rgba(255,255,255,0.15);">?</div>
              <div style="flex:1; overflow:hidden;">
                <div style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:1.05rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align: left;">${card.name}</div>
                <div style="font-size:0.7rem; color:#666; font-weight:bold; text-transform:uppercase; font-family:monospace; text-align: left;">${card.baseRarity.name}</div>
              </div>
            </div>
            
            <button onclick="adminAddPlayerCard('${userKey}', '${username}', '${card.id}')" style="width:100%; background:rgba(34,197,94,0.15); border:1px solid #22c55e; color:#4ade80; border-radius:6px; padding:10px; font-size:0.8rem; font-weight:bold; cursor:pointer; transition:all 0.2s; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.5px;" onmouseover="this.style.background='#22c55e'; this.style.color='#fff';" onmouseout="this.style.background='rgba(34,197,94,0.15)'; this.style.color='#4ade80';">
              ➕ AÑADIR CROMO
            </button>
          </div>
        `;
      }
    }).join('');

    grid.innerHTML = html;
  } catch (error) {
    console.error("Error al renderizar mazo admin:", error);
    grid.innerHTML = `<p style="color:#ef4444; text-align:center;">Error al cargar cromos: ${error.message}</p>`;
  }
}

// Modificar un campo específico de una carta
async function adminUpdatePlayerCardField(userKey, username, cardId, field, value) {
  if (field === 'count' && value <= 0) {
    adminDeletePlayerCard(userKey, username, cardId);
    return;
  }

  try {
    const db = firebase.database();
    await db.ref(`users/${userKey}/album/cards/${cardId}/${field}`).set(value);

    // Si incrementa duplicados, actualizar también la marca de tiempo de obtenido si aplica
    if (field === 'count') {
      await db.ref(`users/${userKey}/album/cards/${cardId}/obtainedAt`).set(firebase.database.ServerValue.TIMESTAMP);
    }

    const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al actualizar campo: " + error.message);
  }
}

// Eliminar un cromo individualmente
async function adminDeletePlayerCard(userKey, username, cardId) {
  try {
    const db = firebase.database();
    await db.ref(`users/${userKey}/album/cards/${cardId}`).remove();

    const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al eliminar cromo: " + error.message);
  }
}

// Añadir un cromo al inventario
async function adminAddPlayerCard(userKey, username, cardId) {
  try {
    const db = firebase.database();
    await db.ref(`users/${userKey}/album/cards/${cardId}`).set({
      count: 1,
      level: 1,
      signed: false,
      foil: false,
      obtainedAt: firebase.database.ServerValue.TIMESTAMP
    });

    const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al añadir cromo: " + error.message);
  }
}

// Eliminar todos los cromos de la cuenta del jugador
async function adminDeleteAllCards(userKey, username) {
  const ok = confirm(`⚠️ ¿Estás COMPLETAMENTE seguro de que quieres eliminar TODOS los cromos del álbum del vecino "${username}"?\n\nEsta acción no se puede deshacer.`);
  if (!ok) return;

  try {
    const db = firebase.database();
    await db.ref(`users/${userKey}/album/cards`).remove();

    if (window.showLqsaAlert) {
      showLqsaAlert(`Se han eliminado todos los cromos de "${username}" correctamente.`, "ÁLBUM VACIADO", "success");
    } else {
      alert(`✅ Se han eliminado todos los cromos de "${username}" con éxito.`);
    }

    const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al eliminar los cromos: " + error.message);
  }
}
