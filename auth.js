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

    const db = firebase.database();

    // 📢 Escuchar anuncios globales en tiempo real
    db.ref("system_announcement").on("value", (snap) => {
      const text = snap.val() || "";
      if (typeof updateGlobalAnnouncementBanner === "function") {
        updateGlobalAnnouncementBanner(text);
      }
    });

    // 🛠️ Escuchar estado de mantenimiento global en tiempo real
    db.ref("system_maintenance").on("value", (snap) => {
      const active = !!snap.val();
      if (typeof handleMaintenanceScreen === "function") {
        handleMaintenanceScreen(active);
      }
    });

    const savedUser = localStorage.getItem("lqsa_user");
    if (savedUser) {
      db.ref("users/" + savedUser).on("value", (snap) => {
        if (snap.exists()) {
          currentUserProfile = snap.val();
          currentUserProfile.uid = savedUser; // Compatibilidad con vistas

          if (savedUser === "admin") {
            // Si el usuario es el administrador, anular la pantalla de juego con el panel de administración
            if (typeof renderAdminDashboardPage === "function") {
              setTimeout(renderAdminDashboardPage, 100);
            }
          } else {
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

          if (userKey === "admin") {
            // Si el usuario es el administrador, anular la pantalla de juego con el panel de administración de inmediato
            if (typeof renderAdminDashboardPage === "function") {
              setTimeout(renderAdminDashboardPage, 100);
            }
          } else {
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
  // Recargar para limpiar el dashboard de administrador e iniciar limpio
  window.location.reload();
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

        // central economy coin rewards: flat 50 coins for any win!
        let coinReward = 50;

        // Impactar balance de monedas de forma segura por incremento
        await userRef.child('coins').transaction(c => (c || 0) + coinReward);

        // Misión de victoria contra la máquina (solo al ganar)
        if (typeof progressMission === 'function') {
          if (mode === "quien_machine") await progressMission(savedUser, "win_machine", 1);
        }
      } else {
        profile.currentStreak = 0;
      }

      // Progresar misiones diarias que aplican a cualquier partida (ganar o perder)
      if (typeof progressMission === 'function') {
        await progressMission(savedUser, "play_game", 1);
        if (attempts >= 5) await progressMission(savedUser, "ask_questions", attempts);
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

// Resetear las monedas a 0 de TODOS los vecinos registrados
async function adminResetAllCoins() {
  const confirmFirst = confirm("⚠️ ¿ESTÁS COMPLETAMENTE SEGURO DE ESTO?\n\nEsta acción reseteará a 0 las monedas de TODOS los vecinos registrados. ¡Esto no se puede deshacer!");
  if (!confirmFirst) return;

  const confirmSecond = prompt("Para confirmar la eliminación masiva de monedas, escribe la palabra RESET en mayúsculas:");
  if (confirmSecond !== "RESET") {
    if (window.showLqsaAlert) {
      showLqsaAlert("Confirmación incorrecta. No se han modificado las monedas.", "OPERACIÓN CANCELADA", "error");
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

    // Preparar el reset masivo de monedas en Firebase
    for (const key of Object.keys(users)) {
      if (key === "admin" || users[key].username === "admin") continue;
      updates[`users/${key}/coins`] = 0;
    }

    await db.ref().update(updates);

    if (window.showLqsaAlert) {
      showLqsaAlert("Se han puesto a 0 las monedas de todos los vecinos correctamente.", "MONEDAS RESETEADAS 🎉", "success");
    } else {
      alert("✅ ¡Monedas de todos los vecinos reseteadas a 0 con éxito!");
    }

    // Recargar la interfaz
    if (typeof loadAdminDashboardData === "function") {
      loadAdminDashboardData();
    }
  } catch (error) {
    console.error("Error en reset masivo de monedas:", error);
    alert("Error al realizar el reset de monedas: " + error.message);
  }
}

// ─── GESTIÓN AVANZADA DE CROMOS DE JUGADORES (ADMIN) ───────────────────
async function adminManagePlayerCards(userKey, username) {
  const existing = document.getElementById("admin-manage-cards-modal");
  if (existing) existing.remove();

  try {
    const db = firebase.database();
    const uSnap = await db.ref(`users/${userKey}`).once('value');
    if (!uSnap.exists()) {
      alert("No se pudo cargar el perfil del vecino.");
      return;
    }
    const profile = uSnap.val();

    const overlay = document.createElement("div");
    overlay.id = "admin-manage-cards-modal";
    overlay.className = "auth-overlay";
    overlay.style.zIndex = "16500";
    overlay.style.background = "rgba(8, 4, 18, 0.96)";
    overlay.style.backdropFilter = "blur(12px)";

    overlay.innerHTML = `
      <div style="width: min(1000px, 96vw); max-height: 90vh; padding: 25px; border: 2px solid #ec4899; background: #0b0716; display:flex; flex-direction:column; gap:18px; overflow:hidden; border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.85); box-sizing: border-box; position:relative;">
        
        <button class="auth-x" onclick="document.getElementById('admin-manage-cards-modal').remove()" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 36px; height: 36px; font-size: 1.1rem; font-weight: bold; cursor: pointer; position: absolute; top: 20px; right: 20px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.05)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
        
        <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; display:flex; flex-direction:column; gap:12px; padding-right: 40px;">
          <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2.2rem; color:#f472b6; margin:0; letter-spacing:1px; text-shadow:0 0 15px rgba(236,72,153,0.3); text-align: left;">⚙️ GESTIÓN VECINAL: ${username.toUpperCase()}</h2>
          
          <!-- Tab Controls -->
          <div style="display:flex; gap:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:5px;">
            <button id="admin-tab-belongings" onclick="adminSwitchTab('belongings')" style="background:rgba(236,72,153,0.25); border:1px solid #ec4899; color:#f472b6; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; text-transform:uppercase;">📊 Pertenencias & Estadísticas</button>
            <button id="admin-tab-cards" onclick="adminSwitchTab('cards')" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#94a3b8; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; text-transform:uppercase;">🎴 Gestión de Cromos TCG</button>
          </div>
        </div>

        <!-- Tab 1 Content: Belongings & Stats -->
        <div id="admin-sec-belongings" style="display:flex; flex-direction:column; gap:18px; overflow-y:auto; flex:1; padding-right:5px; scrollbar-width:thin;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
            <div style="display:flex; flex-direction:column; gap:6px; text-align: left;">
              <label style="font-size:0.8rem; color:#94a3b8; font-weight:bold; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">🪙 Monedas Vecinales:</label>
              <input type="number" id="admin-edit-coins" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; padding:10px;">
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; text-align: left;">
              <label style="font-size:0.8rem; color:#94a3b8; font-weight:bold; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">🏆 Victorias Totales:</label>
              <input type="number" id="admin-edit-wins" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; padding:10px;">
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; text-align: left;">
              <label style="font-size:0.8rem; color:#94a3b8; font-weight:bold; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">🎮 Partidas Jugadas:</label>
              <input type="number" id="admin-edit-played" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; padding:10px;">
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; text-align: left;">
              <label style="font-size:0.8rem; color:#94a3b8; font-weight:bold; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">⚡ Racha Máxima:</label>
              <input type="number" id="admin-edit-streak" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; padding:10px;">
            </div>
          </div>

          <!-- Achievements Checklist -->
          <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:15px; text-align: left;">
            <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:#f472b6; margin:0 0 12px 0;">🏅 Logros de la Comunidad</h3>
            <div id="admin-edit-achievements-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
              <!-- Cargar dinámicamente -->
            </div>
          </div>

          <button onclick="adminSavePlayerBelongings('${userKey}', '${username}')" style="background:#22c55e; border:none; padding:12px; color:#fff; font-weight:bold; border-radius:10px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:1.1rem; text-transform:uppercase; margin-top:auto; display:block; width:100%; transition:background 0.2s;" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">💾 Guardar Pertenencias</button>
        </div>

        <!-- Tab 2 Content: Cards Management -->
        <div id="admin-sec-cards" style="display:none; flex-direction:row; gap:20px; overflow:hidden; flex:1; min-height: 380px;">
          <!-- LEFT PANEL: Gift card form -->
          <div style="flex:1.2; background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:15px; display:flex; flex-direction:column; gap:12px; box-sizing:border-box;">
            <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:#ffd700; margin:0; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px; text-align: left;">🎁 Regalar Cromo</h3>
            
            <div style="display:flex; flex-direction:column; gap:4px; text-align: left;">
              <label style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">Seleccionar Carta:</label>
              <select id="admin-gift-card-id" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:0.85rem; height:40px; padding:4px 8px; border-radius:8px;">
                <!-- Populate dynamically -->
              </select>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div style="display:flex; flex-direction:column; gap:4px; text-align: left;">
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">Cantidad:</label>
                <input type="number" id="admin-gift-card-count" class="auth-inp" value="1" min="1" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; border-radius:8px; padding:10px;">
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; text-align: left;">
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">Nivel Desquicie:</label>
                <select id="admin-gift-card-level" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:0.85rem; padding:4px 8px; border-radius:8px; height: 38px;">
                  <option value="1">⭐ Nivel 1</option>
                  <option value="2">⭐⭐ Nivel 2</option>
                  <option value="3">⭐⭐⭐ Nivel 3</option>
                  <option value="4">⭐⭐⭐⭐ Nivel 4</option>
                  <option value="5">👑⭐⭐⭐⭐⭐ Nivel 5</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div style="display:flex; flex-direction:column; gap:4px; text-align: left;">
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">Tipo Holograma:</label>
                <select id="admin-gift-card-foil" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:0.85rem; padding:4px 8px; border-radius:8px; height: 38px;">
                  <option value="false">Normal</option>
                  <option value="true">Holográfico (Foil) 🌈</option>
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px; text-align: left;">
                <label style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">Autógrafo:</label>
                <select id="admin-gift-card-signed" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:0.85rem; padding:4px 8px; border-radius:8px; height: 38px;">
                  <option value="false">Sin firmar</option>
                  <option value="true">Autografiado (Firmado) 🖋️</option>
                </select>
              </div>
            </div>

            <button id="admin-gift-card-btn" style="background:#22c55e; border:none; padding:10px; color:#fff; font-weight:bold; border-radius:8px; cursor:pointer; font-family:'Barlow Condensed',sans-serif; font-size:1rem; text-transform:uppercase; margin-top:auto;" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">🎁 REGALAR CARTA</button>
          </div>

          <!-- RIGHT PANEL: Current inventory (searchable, only owned cards) -->
          <div style="flex:1.8; display:flex; flex-direction:column; gap:12px; overflow:hidden;">
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="text" id="admin-manage-card-search" placeholder="🔍 Buscar cromo en inventario..." oninput="adminFilterManageCards('${userKey}', '${username}')" 
                     style="flex:1; background:#140e22; border:1px solid rgba(255,255,255,0.12); padding:10px 14px; border-radius:8px; color:#fff; font-size:0.9rem; outline:none; margin:0;">
              <button onclick="adminDeleteAllCards('${userKey}', '${username}')" style="background:rgba(220,38,38,0.15); border:1px solid #dc2626; padding:8px 12px; border-radius:8px; color:#ef4444; cursor:pointer; font-weight:bold; font-size:0.75rem; font-family:'Barlow Condensed',sans-serif; transition:all 0.2s; text-transform:uppercase; letter-spacing:0.5px;" onmouseover="this.style.background='#dc2626'; this.style.color='#fff';" onmouseout="this.style.background='rgba(220,38,38,0.15)'; this.style.color='#ef4444';">🗑️ Borrar Todo</button>
            </div>

            <div id="admin-manage-cards-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; overflow-y:auto; flex:1; padding-right:5px; scrollbar-width:thin; align-content: start;">
              <p style="color:var(--text2); text-align:center;">Cargando colección del vecino...</p>
            </div>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Rellenar Pertenencias
    document.getElementById("admin-edit-coins").value = profile.coins || 0;
    document.getElementById("admin-edit-wins").value = profile.wins || 0;
    document.getElementById("admin-edit-played").value = profile.played || 0;
    document.getElementById("admin-edit-streak").value = profile.maxStreak || 0;

    // Rellenar Logros
    const ownedAchs = new Set(profile.achievements || []);
    const achContainer = document.getElementById("admin-edit-achievements-container");
    achContainer.innerHTML = ACHIEVEMENTS.map(ach => {
      const checked = ownedAchs.has(ach.id) ? "checked" : "";
      return `
        <label style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px; display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.85rem;" onmouseover="this.style.borderColor='rgba(236,72,153,0.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.06)'">
          <input type="checkbox" name="admin-edit-achievement" value="${ach.id}" ${checked} style="width:16px; height:16px; cursor:pointer; accent-color:#ec4899;">
          <span style="font-size:1.2rem;">${ach.icon}</span>
          <div style="display:flex; flex-direction:column; text-align: left;">
            <strong style="color:#fff;">${ach.name}</strong>
            <span style="font-size:0.7rem; color:#94a3b8;">${ach.desc}</span>
          </div>
        </label>
      `;
    }).join("");

    // Rellenar selector de cromos para regalar
    const giftSelect = document.getElementById("admin-gift-card-id");
    if (typeof ALBUM_CARDS !== 'undefined') {
      giftSelect.innerHTML = ALBUM_CARDS.map(card => {
        return `<option value="${card.id}">${card.name} (${card.baseRarity.name})</option>`;
      }).join("");
    }

    // Programar botón de regalar cromo
    document.getElementById("admin-gift-card-btn").onclick = () => {
      const cardId = giftSelect.value;
      const count = parseInt(document.getElementById("admin-gift-card-count").value) || 1;
      const level = parseInt(document.getElementById("admin-gift-card-level").value) || 1;
      const foil = document.getElementById("admin-gift-card-foil").value === "true";
      const signed = document.getElementById("admin-gift-card-signed").value === "true";
      adminGiftPlayerCardCustom(userKey, username, cardId, count, level, foil, signed);
    };

    // Renderizar colección en Tab 2
    adminRenderManageCardsGrid(userKey, username);

  } catch (error) {
    alert("Error al cargar la gestión vecinal: " + error.message);
  }
}

// Cambiar de Pestaña en Gestión Vecinal
function adminSwitchTab(tabName) {
  const isBelongings = tabName === 'belongings';
  
  const bTab = document.getElementById("admin-tab-belongings");
  const cTab = document.getElementById("admin-tab-cards");
  const bSec = document.getElementById("admin-sec-belongings");
  const cSec = document.getElementById("admin-sec-cards");
  
  if (bTab) {
    bTab.style.background = isBelongings ? 'rgba(236,72,153,0.25)' : 'transparent';
    bTab.style.borderColor = isBelongings ? '#ec4899' : 'rgba(255,255,255,0.1)';
    bTab.style.color = isBelongings ? '#f472b6' : '#94a3b8';
  }
  if (cTab) {
    cTab.style.background = !isBelongings ? 'rgba(236,72,153,0.25)' : 'transparent';
    cTab.style.borderColor = !isBelongings ? '#ec4899' : 'rgba(255,255,255,0.1)';
    cTab.style.color = !isBelongings ? '#f472b6' : '#94a3b8';
  }
  
  if (bSec) bSec.style.display = isBelongings ? 'flex' : 'none';
  if (cSec) cSec.style.display = !isBelongings ? 'flex' : 'none';
}

// Guardar Pertenencias y Logros de un Vecino
async function adminSavePlayerBelongings(userKey, username) {
  try {
    const db = firebase.database();
    
    const coins = parseInt(document.getElementById("admin-edit-coins").value) || 0;
    const wins = parseInt(document.getElementById("admin-edit-wins").value) || 0;
    const played = parseInt(document.getElementById("admin-edit-played").value) || 0;
    const maxStreak = parseInt(document.getElementById("admin-edit-streak").value) || 0;

    // Obtener logros marcados
    const checkedAchs = [];
    const checkboxes = document.querySelectorAll('input[name="admin-edit-achievement"]:checked');
    checkboxes.forEach(cb => {
      checkedAchs.push(cb.value);
    });

    const updates = {
      coins: coins,
      wins: wins,
      played: played,
      maxStreak: maxStreak,
      achievements: checkedAchs
    };

    await db.ref(`users/${userKey}`).update(updates);

    if (window.showLqsaAlert) {
      window.showLqsaAlert(`💾 Pertenencias y logros de "${username}" guardados con éxito.`, "CAMBIOS GUARDADOS", "success");
    } else {
      alert("💾 Pertenencias y logros guardados con éxito.");
    }
  } catch (error) {
    alert("Error al guardar pertenecias: " + error.message);
  }
}

// Regalar Cromo con especificaciones personalizadas
async function adminGiftPlayerCardCustom(userKey, username, cardId, count, level, foil, signed) {
  try {
    const db = firebase.database();
    await db.ref(`users/${userKey}/album/cards/${cardId}`).set({
      count: parseInt(count) || 1,
      level: parseInt(level) || 1,
      signed: !!signed,
      foil: !!foil,
      obtainedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    const queryEl = document.getElementById("admin-manage-card-search");
    const query = queryEl ? queryEl.value.trim().toLowerCase() : "";
    adminRenderManageCardsGrid(userKey, username, query);

    if (window.showLqsaAlert) {
      window.showLqsaAlert("🎁 Cromo entregado con éxito al vecino.", "CROMO ENTREGADO", "success");
    } else {
      alert("🎁 Cromo entregado con éxito.");
    }
  } catch (error) {
    alert("Error al regalar cromo: " + error.message);
  }
}

// Buscar y filtrar en el mazo de administración
function adminFilterManageCards(userKey, username) {
  const query = document.getElementById("admin-manage-card-search").value.trim().toLowerCase();
  adminRenderManageCardsGrid(userKey, username, query);
}

// Renderizar la rejilla de cromos del inventario real del jugador
async function adminRenderManageCardsGrid(userKey, username, query = '') {
  const grid = document.getElementById("admin-manage-cards-grid");
  if (!grid) return;

  try {
    const db = firebase.database();
    const snap = await db.ref(`users/${userKey}/album/cards`).once('value');
    const userCards = snap.exists() ? snap.val() : {};

    if (typeof ALBUM_CARDS === 'undefined') {
      grid.innerHTML = `<p style="color:#ef4444; text-align:center;">Catálogo del Álbum no encontrado (ALBUM_CARDS es undefined).</p>`;
      return;
    }

    const filtered = ALBUM_CARDS.filter(c => {
      const uCard = userCards[c.id];
      if (!uCard) return false;
      return c.name.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="color:var(--text2); text-align:center; padding: 20px; grid-column: 1 / -1;">No se encontraron cromos en propiedad.</p>`;
      return;
    }

    const html = filtered.map(card => {
      const uCard = userCards[card.id];
      const borderCol = card.baseRarity.color;
      const count = uCard.count || 1;
      const level = uCard.level || 1;
      const signed = !!uCard.signed;
      const foil = !!uCard.foil;

      return `
        <div style="border: 2px solid ${borderCol}; border-radius: 12px; background:#120c24; display:flex; flex-direction:column; overflow:hidden; position:relative; box-shadow:0 6px 16px rgba(0,0,0,0.6); padding:10px; gap:8px; height: 230px; box-sizing: border-box; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
          
          <!-- Cabecera cromo -->
          <div style="display:flex; gap:10px; align-items:center;">
            <img src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="width:45px; height:45px; border-radius:8px; object-fit:cover; border:2px solid ${borderCol}; background: #0b0716;">
            <div style="flex:1; overflow:hidden; text-align: left;">
              <div style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:0.95rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.2;">${card.name}</div>
              <div style="font-size:0.65rem; color:${borderCol}; font-weight:bold; text-transform:uppercase; font-family:monospace;">${card.baseRarity.name}</div>
            </div>
          </div>

          <!-- Controles de Edición -->
          <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; display:flex; flex-direction:column; gap:6px; font-size:0.75rem; flex: 1; justify-content: space-between;">
            
            <!-- Cantidad / Repetidos -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text2); font-weight: 500;">Copias:</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'count', ${Math.max(0, count - 1)})" style="background:#334155; border:none; width:20px; height:20px; border-radius:4px; color:#fff; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.15s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">-</button>
                <span style="font-weight:bold; color:#fbbf24; font-family:monospace; min-width:16px; text-align:center; font-size: 0.8rem;">${count}</span>
                <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'count', ${count + 1})" style="background:#334155; border:none; width:20px; height:20px; border-radius:4px; color:#fff; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.15s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">+</button>
              </div>
            </div>

            <!-- Nivel de Desquicie -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text2); font-weight: 500;">Desquicie:</span>
              <select onchange="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'level', parseInt(this.value))" style="background:#1e1b4b; border:1px solid rgba(255,255,255,0.15); border-radius:4px; color:#c084fc; font-weight:bold; padding:2px 4px; font-size:0.75rem; outline:none; cursor:pointer;">
                <option value="1" ${level === 1 ? 'selected' : ''}>⭐ 1</option>
                <option value="2" ${level === 2 ? 'selected' : ''}>⭐⭐ 2</option>
                <option value="3" ${level === 3 ? 'selected' : ''}>⭐⭐⭐ 3</option>
                <option value="4" ${level === 4 ? 'selected' : ''}>⭐⭐⭐⭐ 4</option>
                <option value="5" ${level === 5 ? 'selected' : ''}>👑⭐ 5</option>
              </select>
            </div>

            <!-- Foil y Firmada en un row -->
            <div style="display:flex; justify-content:space-between; gap:6px;">
              <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'foil', ${!foil})" style="flex:1; background:${foil ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${foil ? 'transparent' : 'rgba(255,255,255,0.03)'}; color:${foil ? '#fff' : 'var(--text2)'}; font-size:0.65rem; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer; transition:all 0.15s;">
                🌈 ${foil ? 'FOIL' : 'NORMAL'}
              </button>
              <button onclick="adminUpdatePlayerCardField('${userKey}', '${username}', '${card.id}', 'signed', ${!signed})" style="flex:1; background:${signed ? 'linear-gradient(135deg, #10b981, #047857)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${signed ? 'transparent' : 'rgba(255,255,255,0.03)'}; color:${signed ? '#fff' : 'var(--text2)'}; font-size:0.65rem; padding:4px; border-radius:4px; font-weight:bold; cursor:pointer; transition:all 0.15s;">
                🖋️ ${signed ? 'FIRMADO' : 'S/ FIRMA'}
              </button>
            </div>

            <!-- Eliminar esta carta individual -->
            <button onclick="adminDeletePlayerCard('${userKey}', '${username}', '${card.id}')" style="background:rgba(220,38,38,0.15); border:1px solid #dc2626; color:#ef4444; border-radius:4px; padding:4px; font-size:0.7rem; font-weight:bold; cursor:pointer; transition:all 0.15s; font-family:'Barlow Condensed', sans-serif;" onmouseover="this.style.background='#dc2626'; this.style.color='#fff';" onmouseout="this.style.background='rgba(220,38,38,0.15)'; this.style.color='#ef4444';">
              🗑️ ELIMINAR CROMO
            </button>
          </div>
        </div>
      `;
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

    const queryEl = document.getElementById("admin-manage-card-search");
    const query = queryEl ? queryEl.value.trim().toLowerCase() : "";
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

    const queryEl = document.getElementById("admin-manage-card-search");
    const query = queryEl ? queryEl.value.trim().toLowerCase() : "";
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al eliminar cromo: " + error.message);
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

    const queryEl = document.getElementById("admin-manage-card-search");
    const query = queryEl ? queryEl.value.trim().toLowerCase() : "";
    adminRenderManageCardsGrid(userKey, username, query);
  } catch (error) {
    alert("Error al eliminar los cromos: " + error.message);
  }
}
// ── CONSOLA DE ADMINISTRADOR PREMIUM Y SISTEMA DE MANTENIMIENTO ──

async function renderAdminDashboardPage() {
  // Evitar duplicar el renderizado si ya está cargado
  if (document.getElementById("admin-dashboard")) return;

  // Añadir la clase al body para ocultar los demás apartados
  document.body.classList.add("admin-mode-active");

  // Inyectar el estilo dinámicamente si no existe
  if (!document.getElementById("admin-hide-other-sections-style")) {
    const style = document.createElement("style");
    style.id = "admin-hide-other-sections-style";
    style.textContent = `
      body.admin-mode-active > *:not(#admin-dashboard):not(#admin-manage-cards-modal):not(#admin-gift-modal):not(#auth-modal):not(script):not(#global-maintenance-overlay):not(#admin-announcement-bar):not(#global-announcement-marquee) {
        display: none !important;
      }
      body.admin-mode-active {
        background: #0d0d13 !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: 100vh !important;
      }
      .admin-dash-wrap {
        margin: 0 auto !important;
        padding: 24px !important;
        border-radius: 0 !important;
        border: none !important;
        background: radial-gradient(circle at center, #0f172a, #020617) !important;
        min-height: 100vh !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Crear el contenedor directamente en el body
  const dashWrap = document.createElement("div");
  dashWrap.id = "admin-dashboard";
  dashWrap.className = "admin-dash-wrap";
  document.body.appendChild(dashWrap);

  dashWrap.innerHTML = `
      <div class="admin-header">
        <div>
          <h1 class="admin-title">⚙️ CONSOLA DE ADMINISTRACIÓN</h1>
          <p style="color:var(--text2); margin:4px 0 0 0; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.5px; font-weight:bold;">Panel exclusivo de control para el administrador vecinal.</p>
        </div>
        <button onclick="handleSignOut()" class="auth-btn" style="background:#dc2626; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">Cerrar sesión</button>
      </div>

      <!-- Tarjetas de Estadísticas en Tiempo Real -->
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <span class="admin-stat-lbl">👥 Vecinos Registrados</span>
          <h3 class="admin-stat-val" id="admin-stat-users">...</h3>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-lbl">🪙 Monedas en Circulación</span>
          <h3 class="admin-stat-val" id="admin-stat-coins">...</h3>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-lbl">🛠️ Mantenimiento Global</span>
          <h3 class="admin-stat-val" id="admin-stat-maintenance" style="color:#ffd700">...</h3>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-lbl">🏆 Vecino Líder</span>
          <h3 class="admin-stat-val" id="admin-stat-leader" style="font-size:1.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">...</h3>
        </div>
      </div>

      <div class="admin-grid-layout">
        <!-- Columna Izquierda: Tabla de Vecinos -->
        <div class="admin-box">
          <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.6rem; color:var(--accent); margin:0 0 15px 0;">📋 Listado de Vecinos</h3>
          <div style="margin-bottom: 15px; display:flex; gap:10px;">
            <input type="text" id="admin-dashboard-search" class="auth-inp" placeholder="🔍 Buscar vecino por nombre..." oninput="filterAdminDashboardUsers()" style="margin: 0; flex:1;">
          </div>
          <div class="admin-users-table-container">
            <table class="ranking-table" style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                  <th style="padding:10px 5px; text-align:left;">Vecino</th>
                  <th style="padding:10px 5px; text-align:center;">Monedas</th>
                  <th style="padding:10px 5px; text-align:center;">Acciones rápidas</th>
                </tr>
              </thead>
              <tbody id="admin-dashboard-users-tbody">
                <tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text2);">Cargando vecinos...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna Derecha: Controles Globales -->
        <div class="admin-box" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Panel Mantenimiento y Anuncios -->
          <div>
            <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.6rem; color:var(--accent); margin:0 0 12px 0;">📢 Control del Servidor</h3>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <button id="admin-maintenance-toggle-btn" onclick="toggleGlobalMaintenance()" class="q-btn" style="width:100%; padding:12px; font-weight:bold; text-transform:uppercase; font-family:'Barlow Condensed',sans-serif; border-radius:10px; cursor:pointer;">Cargando...</button>
              
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                <label style="font-family:'Barlow Condensed',sans-serif; font-size:0.85rem; color:var(--text2); text-transform:uppercase;">📢 Mensaje de Anuncio Global</label>
                <input type="text" id="admin-announcement-input" class="auth-inp" placeholder="Escribe el aviso comunitario..." style="margin:0;">
                
                <!-- Duración temporizada select -->
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px; text-align: left;">
                  <label style="font-family:'Barlow Condensed',sans-serif; font-size:0.75rem; color:var(--text2); text-transform:uppercase;">⏳ Duración del Anuncio:</label>
                  <select id="admin-announcement-duration" class="auth-inp" style="margin:0; background:#140e22; border:1px solid rgba(255,255,255,0.12); color:#fff; font-size:0.85rem; height:38px; padding:4px 8px; border-radius:8px;">
                    <option value="always">Siempre visible (Sin temporizador)</option>
                    <option value="60000">1 Minuto</option>
                    <option value="300000">5 Minutos</option>
                    <option value="600000">10 Minutos</option>
                    <option value="1800000">30 Minutos</option>
                    <option value="3600000">1 Hora</option>
                  </select>
                </div>

                <div style="display:flex; gap:10px; margin-top:8px;">
                  <button onclick="publishGlobalAnnouncement()" class="q-btn" style="flex:1; background:var(--accent); color:#000; font-weight:bold; font-family:'Barlow Condensed',sans-serif; padding:10px; border:none; cursor:pointer; border-radius:8px; text-transform:uppercase;">📢 Publicar Aviso</button>
                  <button onclick="clearGlobalAnnouncement()" class="q-btn" style="flex:1; background:rgba(239, 68, 68, 0.2); border:1px solid #ef4444; color:#f87171; font-weight:bold; font-family:'Barlow Condensed',sans-serif; padding:10px; cursor:pointer; border-radius:8px; text-transform:uppercase;">🗑️ Finalizar Aviso</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de Economía -->
          <div>
            <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.6rem; color:#ef4444; margin:0 0 12px 0;">💸 Lluvia de Monedas</h3>
            <p style="font-size:0.8rem; color:var(--text2); margin:-6px 0 10px 0;">Regala monedas a TODOS los vecinos registrados al mismo tiempo.</p>
            <div style="display:flex; gap:10px;">
              <button onclick="adminRainCoins(100)" class="q-btn" style="flex:1; background:rgba(240,192,32,0.15); border:1px solid var(--accent); color:var(--accent); font-weight:bold; font-family:'Barlow Condensed',sans-serif; padding:10px; border-radius:6px; cursor:pointer;">🪙 Regalar 100</button>
              <button onclick="adminRainCoins(500)" class="q-btn" style="flex:1; background:rgba(240,192,32,0.25); border:2px solid var(--accent); color:#fff; font-weight:bold; font-family:'Barlow Condensed',sans-serif; padding:10px; border-radius:6px; cursor:pointer;">🪙 Regalar 500</button>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
              <button onclick="adminResetAllCoins()" class="q-btn" style="width:100%; background:rgba(239,68,68,0.12); border:1px solid #ef4444; color:#ef4444; font-weight:bold; font-family:'Barlow Condensed',sans-serif; padding:10px; border-radius:6px; cursor:pointer; text-transform:uppercase; transition:all 0.2s;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239,68,68,0.12)'; this.style.color='#ef4444';">🔄 Resetear Monedas de Todos</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Deshabilitar botones de juego e interacción
  const modeOverlay = document.getElementById("quien-mode-overlay");
  if (modeOverlay) modeOverlay.style.display = "none";

  loadAdminDashboardData();
}

let cachedAdminDashboardUsers = {};

async function loadAdminDashboardData() {
  const db = firebase.database();
  
  // Escuchar vecinos en tiempo real
  db.ref("users").on("value", (snap) => {
    if (!snap.exists()) return;
    const users = snap.val();
    cachedAdminDashboardUsers = users;
    
    // Renderizar tabla
    renderAdminDashboardUsersList(users);

    // Calcular estadísticas
    let totalUsers = 0;
    let totalCoins = 0;
    let maxWins = -1;
    let leaderName = "Ninguno";

    for (let key in users) {
      if (key === "admin" || users[key].username === "admin") continue;
      totalUsers++;
      totalCoins += (users[key].coins || 0);
      const wins = users[key].wins || 0;
      if (wins > maxWins && users[key].username) {
        maxWins = wins;
        leaderName = users[key].username;
      }
    }

    const uEl = document.getElementById("admin-stat-users");
    const cEl = document.getElementById("admin-stat-coins");
    const lEl = document.getElementById("admin-stat-leader");

    if (uEl) uEl.textContent = totalUsers;
    if (cEl) cEl.textContent = totalCoins + " 🪙";
    if (lEl) lEl.textContent = leaderName;
  });

  // Escuchar estado de mantenimiento
  db.ref("system_maintenance").on("value", (snap) => {
    const active = !!snap.val();
    const btn = document.getElementById("admin-maintenance-toggle-btn");
    const stat = document.getElementById("admin-stat-maintenance");

    if (stat) stat.textContent = active ? "ACTIVO 🔴" : "INACTIVO 🟢";
    if (btn) {
      btn.textContent = active ? "⚠️ DESACTIVAR MANTENIMIENTO" : "⚠️ ACTIVAR MANTENIMIENTO";
      btn.style.background = active ? "#22c55e" : "#ef4444";
      btn.style.color = "#fff";
      btn.style.border = "none";
    }
  });

  // Escuchar anuncio para el campo
  db.ref("system_announcement").once("value", (snap) => {
    const val = snap.val();
    let text = "";
    if (val) {
      if (typeof val === "object") {
        text = val.text || "";
      } else {
        text = val;
      }
    }
    const inp = document.getElementById("admin-announcement-input");
    if (inp) inp.value = text;
  });
}

function renderAdminDashboardUsersList(users, query = "") {
  const tbody = document.getElementById("admin-dashboard-users-tbody");
  if (!tbody) return;

  let html = "";
  let count = 0;

  for (let key in users) {
    if (key === "admin") continue;
    const u = users[key];
    const username = u.username || "Vecino Anónimo";
    
    if (query && !username.toLowerCase().includes(query.toLowerCase())) {
      continue;
    }

    count++;
    const avatar = u.avatar || "img/personajes/coque.webp";
    const coins = u.coins || 0;

    html += `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
        <td style="padding:8px 5px; display:flex; align-items:center; gap:8px;">
          <img src="${avatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; object-position:top; border:1px solid rgba(255,255,255,0.1)">
          <span style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:0.95rem; color:#fff;">${username}</span>
        </td>
        <td style="padding:8px 5px; text-align:center; font-family:'Barlow Condensed',sans-serif; color:#ffd700; font-weight:bold;">${coins} 🪙</td>
        <td style="padding:8px 5px; text-align:center;">
          <div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">
            <button onclick="adminDashboardGiveCoins('${key}', '${username}')" style="background:rgba(240,192,32,0.12); border:1px solid var(--accent); color:var(--accent); padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-family:'Barlow Condensed',sans-serif;">+🪙</button>
            <button onclick="adminDashboardManageCards('${key}', '${username}')" style="background:rgba(168,85,247,0.12); border:1px solid #c084fc; color:#c084fc; padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-family:'Barlow Condensed',sans-serif;">🎛️ Gestionar</button>
            <button onclick="adminDashboardResetStats('${key}', '${username}')" style="background:rgba(96,165,250,0.12); border:1px solid #60a5fa; color:#60a5fa; padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-family:'Barlow Condensed',sans-serif;">🔄 Reset</button>
            <button onclick="adminDashboardDeleteUser('${key}', '${username}')" style="background:rgba(239,68,68,0.12); border:1px solid #ef4444; color:#ef4444; padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-family:'Barlow Condensed',sans-serif;">❌</button>
          </div>
        </td>
      </tr>
    `;
  }

  if (count === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text2);">No se encontraron vecinos registrados.</td></tr>`;
  } else {
    tbody.innerHTML = html;
  }
}

function filterAdminDashboardUsers() {
  const query = document.getElementById("admin-dashboard-search").value.trim();
  renderAdminDashboardUsersList(cachedAdminDashboardUsers, query);
}

function adminDashboardGiveCoins(key, username) {
  adminGiveCoins(key, username);
}

function adminDashboardManageCards(key, username) {
  adminManagePlayerCards(key, username);
}

function adminDashboardResetStats(key, username) {
  adminResetStats(key, username);
}

function adminDashboardDeleteUser(key, username) {
  adminDeleteUser(key, username);
}

async function toggleGlobalMaintenance() {
  const db = firebase.database();
  const snap = await db.ref("system_maintenance").once("value");
  const current = !!snap.val();
  await db.ref("system_maintenance").set(!current);
}

async function publishGlobalAnnouncement() {
  const text = document.getElementById("admin-announcement-input").value.trim();
  const durationVal = document.getElementById("admin-announcement-duration").value;
  
  if (!text) {
    alert("Por favor, escribe un texto para el anuncio.");
    return;
  }

  const db = firebase.database();
  let announcementData = null;

  if (durationVal === "always") {
    announcementData = {
      text: text,
      expiresAt: null
    };
  } else {
    const durationMs = parseInt(durationVal);
    announcementData = {
      text: text,
      expiresAt: Date.now() + durationMs
    };
  }

  await db.ref("system_announcement").set(announcementData);
  
  if (window.showLqsaAlert) {
    window.showLqsaAlert("📢 Anuncio global publicado con éxito en la comunidad.", "AVISO PUBLICADO", "success");
  } else {
    alert("📢 Anuncio global publicado con éxito.");
  }
}

async function clearGlobalAnnouncement() {
  const db = firebase.database();
  await db.ref("system_announcement").set("");
  const inp = document.getElementById("admin-announcement-input");
  if (inp) inp.value = "";
  
  if (window.showLqsaAlert) {
    window.showLqsaAlert("📢 Anuncio global retirado de las pantallas.", "AVISO RETIRADO", "info");
  } else {
    alert("📢 Anuncio global retirado.");
  }
}

async function adminRainCoins(amount) {
  const db = firebase.database();
  if (Object.keys(cachedAdminDashboardUsers).length === 0) return;

  const updates = {};
  for (let key in cachedAdminDashboardUsers) {
    if (key === "admin") continue;
    const currentCoins = cachedAdminDashboardUsers[key].coins || 0;
    updates[`users/${key}/coins`] = currentCoins + amount;
  }

  await db.ref().update(updates);
  
  if (window.showLqsaAlert) {
    window.showLqsaAlert(`🪙 ¡Lluvia completada! Inyectadas ${amount} monedas a todos los vecinos.`, "LLUVIA DE MONEDAS", "success");
  } else {
    alert(`¡Lluvia completada! Inyectadas ${amount} monedas a todos.`);
  }
}

let announcementTimeoutId = null;

function updateGlobalAnnouncementBanner(snapVal) {
  let text = "";
  let expiresAt = null;

  if (snapVal) {
    if (typeof snapVal === "object") {
      text = snapVal.text || "";
      expiresAt = snapVal.expiresAt || null;
    } else {
      text = snapVal;
    }
  }

  // Limpiar temporizador activo anterior
  if (announcementTimeoutId) {
    clearTimeout(announcementTimeoutId);
    announcementTimeoutId = null;
  }

  let bar = document.getElementById("global-announcement-marquee");

  // Si no hay texto, está vacío o ha expirado, quitar
  if (!text || text.trim() === "" || (expiresAt && Date.now() > expiresAt)) {
    if (bar) bar.remove();
    document.body.style.paddingTop = "0px";
    return;
  }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "global-announcement-marquee";
    bar.className = "marquee-announcement-bar";
    document.body.appendChild(bar);
  }

  bar.innerHTML = `
    <div class="marquee-content">
      <span>📢 AVISO OFICIAL DE LA COMUNIDAD: ${text}</span>
      <span>📢 AVISO OFICIAL DE LA COMUNIDAD: ${text}</span>
      <span>📢 AVISO OFICIAL DE LA COMUNIDAD: ${text}</span>
    </div>
  `;

  document.body.style.paddingTop = "32px";

  // Si hay un tiempo de expiración futuro, configurar temporizador automático para ocultarlo
  if (expiresAt) {
    const msLeft = expiresAt - Date.now();
    if (msLeft > 0) {
      announcementTimeoutId = setTimeout(() => {
        const currentBar = document.getElementById("global-announcement-marquee");
        if (currentBar) currentBar.remove();
        document.body.style.paddingTop = "0px";
      }, msLeft);
    }
  }
}

function handleMaintenanceScreen(active) {
  const savedUser = localStorage.getItem("lqsa_user");
  
  if (active && savedUser !== "admin") {
    let overlay = document.getElementById("global-maintenance-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "global-maintenance-overlay";
      overlay.className = "maintenance-fullscreen-overlay";
      overlay.innerHTML = `
        <div class="maintenance-card">
          <div class="maintenance-icon">🛠️</div>
          <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2.2rem; color:#ffd700; margin:0;">🚨 COMUNIDAD EN REFORMAS 🚨</h2>
          <p style="font-family:'Barlow Condensed',sans-serif; font-size:1.1rem; color:#fff; line-height:1.4; margin:10px 0;">
            Vecinos, el conserje Coque y el presidente están haciendo tareas de mantenimiento preventivo.<br>
            ¡Montepinar y Contubernio estarán listas muy pronto!
          </p>
          <div style="font-size:0.8rem; color:#888; border-top:1px solid rgba(255,255,255,0.1); width:100%; padding-top:12px; margin-top:8px; font-family:'Barlow Condensed',sans-serif; text-transform:uppercase;">
            Disculpad las molestias · Junta General Extraordinaria
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  } else {
    const overlay = document.getElementById("global-maintenance-overlay");
    if (overlay) overlay.remove();
  }
}
