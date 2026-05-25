/* ==========================================================================
   LQSACatena - TCG Expansion: Liga LQSA, 2vsIA, 2vs2 & Animaciones
   ========================================================================== */

// --- Base de Datos de Jefes (Bosses) ---
const LQSALigaBosses = [
  {
    id: "amador-elvis",
    name: "Amador Elvis",
    description: "¡El rey del rock-pinchito con el merengue en las venas!",
    image: "img-bosses/amador-elvis.webp",
    difficulty: "Fácil",
    difficultyColor: "#4ade80",
    reward: 150,
    deck: ["amador-rivas", "teodoro-rivas", "leonardo-romani"],
    cardLevel: 1,
    isFoil: false
  },
  {
    id: "belen-viviente",
    name: "Belén Viviente",
    description: "¡Un desquicie angelical en pleno pesebre navideño!",
    image: "img-bosses/belen-viviente.webp",
    difficulty: "Fácil",
    difficultyColor: "#4ade80",
    reward: 200,
    deck: ["maite-figueroa", "raquel-villanueva", "nines-chacon"],
    cardLevel: 1,
    isFoil: false
  },
  {
    id: "amador-torero",
    name: "Amador Torero",
    description: "¡Capote, muleta y pinchito obligatorio en el Max & Henry!",
    image: "img-bosses/amador-torero.webp",
    difficulty: "Normal",
    difficultyColor: "#facc15",
    reward: 250,
    deck: ["amador-rivas", "maxi-angulo", "coque-calatrava", "leonardo-romani"],
    cardLevel: 2,
    isFoil: false
  },
  {
    id: "amador-futbolista",
    name: "Amador Futbolista",
    description: "¡El delantero pichichi del Bajo A listo para golear!",
    image: "img-bosses/amador-futbolista.webp",
    difficulty: "Medio",
    difficultyColor: "#f97316",
    reward: 300,
    deck: ["amador-rivas", "maite-figueroa", "teodoro-rivas", "carlota-rivas"],
    cardLevel: 3,
    isFoil: false
  },
  {
    id: "antonioycoque-guardiacivil",
    name: "Recio y Coque G. Civil",
    description: "¡La Benemérita pesquetando la comunidad!",
    image: "img-bosses/antonioycoque-guardiacivil.webp",
    difficulty: "Difícil",
    difficultyColor: "#ef4444",
    reward: 450,
    deck: ["antonio-recio", "coque-calatrava", "berta-escobar", "rosario-parrales", "ongombo"],
    cardLevel: 4,
    isFoil: false
  },
  {
    id: "antonio-recio-leonesdemontepinar",
    name: "Antonio Recio León",
    description: "¡El líder de opinión del Imperio Recio con la mente fría!",
    image: "img-bosses/antonio-recio-leonesdemontepinar.webp",
    difficulty: "Muy Difícil",
    difficultyColor: "#b91c1c",
    reward: 600,
    deck: ["antonio-recio", "berta-escobar", "alba-recio", "violeta-recio", "rosario-parrales"],
    cardLevel: 4,
    isFoil: true
  },
  {
    id: "vecino-misterioso",
    name: "Vecino Misterioso",
    description: "¡El habitante del 2º C que nadie ha logrado desalojar!",
    image: "img-bosses/1e8a990c-e6e6-4ba0-a846-456f5d38825b_16-9-discover-aspect-ratio_default_0.webp",
    difficulty: "Experto",
    difficultyColor: "#a855f7",
    reward: 800,
    deck: ["moroso", "fina-palomares", "coque-calatrava", "agustin-gordillo", "ongombo"],
    cardLevel: 5,
    isFoil: true
  },
  {
    id: "antonio-rey",
    name: "Antonio Rey (Final)",
    description: "¡El soberano absoluto de la comunidad de propietarios!",
    image: "img-bosses/antonio-rey.webp",
    difficulty: "Leyenda",
    difficultyColor: "#ffd700",
    reward: 1200,
    deck: ["antonio-recio-oro", "berta-escobar", "coque-calatrava", "enrique-pastor", "fermin-trujillo"],
    cardLevel: 5,
    isFoil: true,
    isFinal: true
  }
];

// --- Variables de Estado de la Liga Local ---
let localLigaActiveMatch = null;
let currentTabMode = "pvp"; // "pvp" | "liga" | "coop" | "team"

window.playTcgCombatAnimationGeneric = function (attackerEl, defenderEl, combatType, damage) {
  if (!attackerEl || !defenderEl) return;

  const elementConfig = {
    "Fuego":      { emoji: "🔥", color: "#ef4444", glow: "rgba(239,68,68,0.9)",  hitWord: "¡FUEGO!" },
    "Mayorista":  { emoji: "🔥", color: "#ef4444", glow: "rgba(239,68,68,0.9)",  hitWord: "¡CHAVAL!" },
    "Eléctrico":  { emoji: "⚡", color: "#facc15", glow: "rgba(250,204,21,0.9)", hitWord: "¡ZAP!" },
    "León":       { emoji: "⚡", color: "#facc15", glow: "rgba(250,204,21,0.9)", hitWord: "¡GRRRR!" },
    "Psíquico":   { emoji: "🔮", color: "#a855f7", glow: "rgba(168,85,247,0.9)", hitWord: "¡BOOM!" },
    "Junta":      { emoji: "🔮", color: "#a855f7", glow: "rgba(168,85,247,0.9)", hitWord: "¡ESTATUTOS!" },
    "Planta":     { emoji: "🍃", color: "#22c55e", glow: "rgba(34,197,94,0.9)",  hitWord: "¡ZAS!" },
    "Inquilino":  { emoji: "🏠", color: "#22c55e", glow: "rgba(34,197,94,0.9)",  hitWord: "¡VECINO!" },
    "Agua":       { emoji: "💧", color: "#3b82f6", glow: "rgba(59,130,246,0.9)", hitWord: "¡SPLASH!" },
    "Buscavidas": { emoji: "💧", color: "#3b82f6", glow: "rgba(59,130,246,0.9)", hitWord: "¡AU!" },
  };
  const eType = combatType || "Inquilino";
  const cfg = elementConfig[eType] || elementConfig["Inquilino"];

  if (!document.getElementById("pokemon-battle-keyframes")) {
    const kf = document.createElement("style");
    kf.id = "pokemon-battle-keyframes";
    kf.textContent = `
      @keyframes pkFlashWhite { 0%{opacity:0} 15%{opacity:0.85} 50%{opacity:0.6} 100%{opacity:0} }
      @keyframes pkDamageText { 0%{transform:translate(-50%,-50%) scale(0.2);opacity:0} 12%{transform:translate(-50%,-65%) scale(1.5);opacity:1} 40%{transform:translate(-50%,-75%) scale(1.1);opacity:1} 80%{transform:translate(-50%,-110%) scale(0.95);opacity:0.9} 100%{transform:translate(-50%,-140%) scale(0.8);opacity:0} }
      @keyframes pkHitWord  { 0%{transform:translate(-50%,-50%) scale(0.3) rotate(-12deg);opacity:0} 20%{transform:translate(-50%,-50%) scale(1.4) rotate(4deg);opacity:1} 60%{transform:translate(-50%,-50%) scale(1.05) rotate(-2deg);opacity:1} 100%{transform:translate(-50%,-70%) scale(0.8);opacity:0} }
      @keyframes pkStar     { 0%{transform:translate(-50%,-50%) scale(1) rotate(0deg);opacity:1} 100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(0) rotate(360deg);opacity:0} }
      @keyframes pkScreenFlash { 0%{opacity:0} 10%{opacity:0.35} 100%{opacity:0} }
      @keyframes pkDefFlash { 0%,100%{filter:none} 25%,75%{filter:brightness(9) saturate(0)} 50%{filter:brightness(1) saturate(1)} }
    `;
    document.head.appendChild(kf);
  }

  const isOpponent = attackerEl.classList.contains("opp-active-card-container") ||
    (attackerEl.parentElement && attackerEl.parentElement.classList.contains('opp-active-card-container'));
  const chargeDir = isOpponent ? 55 : -55;

  // FASE 1: Carga
  attackerEl.style.transition = "transform 0.12s cubic-bezier(0.4,0,1,1)";
  attackerEl.style.zIndex = "50";
  attackerEl.style.transform = `translateY(${chargeDir}px) scale(1.12)`;

  // FASE 2: Impacto (120ms)
  setTimeout(() => {
    attackerEl.style.transition = "transform 0.18s cubic-bezier(0.2,1.6,0.4,1)";
    attackerEl.style.transform = "translateY(0) scale(1)";

    // Flash blanco del defensor (Pokémon DS)
    defenderEl.style.animation = "pkDefFlash 0.45s steps(1,end)";
    setTimeout(() => { defenderEl.style.animation = ""; }, 500);

    // Flash de pantalla blanca completa
    const screenFlash = document.createElement("div");
    screenFlash.style.cssText = "position:fixed;inset:0;background:#fff;z-index:99999;pointer-events:none;animation:pkScreenFlash 0.4s ease-out forwards;";
    document.body.appendChild(screenFlash);
    setTimeout(() => screenFlash.remove(), 420);

    // FASE 3: Efectos post-impacto (150ms)
    setTimeout(() => {
      // Sacudida
      const shakeEl = defenderEl.parentElement || defenderEl;
      let t = 0;
      const shakeInterval = setInterval(() => {
        const x = t < 6 ? (Math.random() - 0.5) * 18 : 0;
        const y = t < 6 ? (Math.random() - 0.5) * 18 : 0;
        shakeEl.style.transform = t < 6 ? `translate(${x}px,${y}px)` : "";
        if (++t >= 8) { clearInterval(shakeInterval); shakeEl.style.transform = ""; }
      }, 32);

      // Estrellas de impacto radiales
      const starSymbols = ["★", "✦", "✸", "✺", cfg.emoji];
      for (let i = 0; i < 10; i++) {
        const star = document.createElement("div");
        const angle = (i / 10) * 360;
        const dist = 55 + Math.random() * 35;
        const tx = Math.cos(angle * Math.PI / 180) * dist;
        const ty = Math.sin(angle * Math.PI / 180) * dist;
        star.textContent = starSymbols[i % starSymbols.length];
        star.style.cssText = `position:absolute;top:50%;left:50%;font-size:${18 + Math.random() * 14}px;color:${cfg.color};text-shadow:0 0 8px ${cfg.glow};pointer-events:none;z-index:1002;--tx:${tx}px;--ty:${ty}px;animation:pkStar 0.55s cubic-bezier(0.2,0.8,0.3,1) ${i * 18}ms forwards;`;
        defenderEl.appendChild(star);
        setTimeout(() => star.remove(), 620);
      }

      // Palabra de golpe estilo cómic
      const hitDiv = document.createElement("div");
      hitDiv.textContent = cfg.hitWord;
      hitDiv.style.cssText = `position:absolute;top:45%;left:50%;font-family:'Bebas Neue',sans-serif;font-size:1.6rem;font-weight:900;color:#fff;text-shadow:-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 0 12px ${cfg.glow};white-space:nowrap;pointer-events:none;z-index:1003;animation:pkHitWord 0.65s cubic-bezier(0.2,1.2,0.4,1) forwards;`;
      defenderEl.appendChild(hitDiv);
      setTimeout(() => hitDiv.remove(), 680);

      // Daño flotante grande
      if (damage !== undefined && damage > 0) {
        const dmgDiv = document.createElement("div");
        dmgDiv.textContent = `-${damage}`;
        const isBig = damage >= 80;
        dmgDiv.style.cssText = `position:absolute;top:30%;left:50%;font-family:'Bebas Neue',sans-serif;font-size:${isBig ? '3.2rem' : '2.2rem'};font-weight:900;color:${isBig ? '#fbbf24' : '#fff'};text-shadow:-3px -3px 0 #000,3px -3px 0 #000,-3px 3px 0 #000,3px 3px 0 #000,0 0 20px ${isBig ? 'rgba(251,191,36,0.9)' : cfg.glow};pointer-events:none;z-index:1004;animation:pkDamageText 1.0s cubic-bezier(0.25,1,0.5,1) 80ms forwards;`;
        defenderEl.appendChild(dmgDiv);
        setTimeout(() => dmgDiv.remove(), 1100);
      }
    }, 150);
  }, 120);
};


function playTcgCombatAnimation(cardElement, effectType, damageAmount) {
  if (!cardElement) return;
  const defenderEl = document.querySelector(".tcg-card-defender") || cardElement;
  window.playTcgCombatAnimationGeneric(cardElement, defenderEl, effectType, damageAmount);
}

// Hookear a la función original de ataque PvP si estú cargada
const oldExecuteCardDuelAttack = window.executeCardDuelAttack;
window.executeCardDuelAttack = async function (roomCode, attackIndex) {
  if (oldExecuteCardDuelAttack) {
    return oldExecuteCardDuelAttack(roomCode, attackIndex);
  }
};

// --- Inyectar Selector de Modos en el Lobby TCG de album.js ---
// --- Inyectar Selector de Modos en el Lobby TCG de album.js ---
let activeCardDuelRooms = [];
let activeTeamTcgRooms = [];
let cardDuelRoomsListener = null;
let teamTcgRoomsListener = null;

window.subscribeTcgLobbyRooms = function () {
  const db = firebase.database();
  if (!db) return;

  if (!cardDuelRoomsListener) {
    cardDuelRoomsListener = db.ref('card_duels').orderByChild('ts').limitToLast(20).on('value', snap => {
      activeCardDuelRooms = [];
      if (snap.exists()) {
        const now = Date.now();
        snap.forEach(child => {
          const val = child.val();
          if (!val.players || Object.keys(val.players).length === 0) {
            child.ref.remove();
            return;
          }
          if (val.status === 'finished') return;
          if (now - (val.ts || 0) > 4 * 60 * 60 * 1000) {
            child.ref.remove(); // Físicamente borrar de la base de datos
            return;
          }
          activeCardDuelRooms.push({ code: child.key, ...val });
        });
      }
      activeCardDuelRooms.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      window.updateActiveTcgLobbyRightSide();
    });
  }

  if (!teamTcgRoomsListener) {
    teamTcgRoomsListener = db.ref('team_tcg').orderByChild('ts').limitToLast(20).on('value', snap => {
      activeTeamTcgRooms = [];
      if (snap.exists()) {
        const now = Date.now();
        snap.forEach(child => {
          const val = child.val();
          if (!val.players || Object.keys(val.players).length === 0) {
            child.ref.remove();
            return;
          }
          if (val.status === 'finished') return;
          if (now - (val.ts || 0) > 4 * 60 * 60 * 1000) {
            child.ref.remove(); // Físicamente borrar de la base de datos
            return;
          }
          activeTeamTcgRooms.push({ code: child.key, ...val });
        });
      }
      activeTeamTcgRooms.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      window.updateActiveTcgLobbyRightSide();
    });
  }
};

window.updateActiveTcgLobbyRightSide = function () {
  const container = document.getElementById("tcg-lobby-right-col");
  if (!container) return;

  const uid = localStorage.getItem('lqsa_user');
  let rightSideHtml = "";

  if (currentTabMode === "pvp") {
    const openRooms = activeCardDuelRooms.filter(r => r.status === "waiting");
    const openRoomsHtml = openRooms.map(r => {
      const creatorUid = r.creator;
      const creator = r.players[creatorUid] || { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:10px; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px; text-align:left;">
            <img src="${creator.avatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid #ef4444;" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div>
              <div style="font-size:0.8rem; font-weight:bold; color:#fff;">Sala de ${creator.username}</div>
              <div style="font-size:0.68rem; color:#ffd700;">Apuesta: ${r.bet || 100} 🪙 | Cód: ${r.code}</div>
            </div>
          </div>
          <button onclick="joinCardDuelRoom('${r.code}')" style="background:#ef4444; color:#fff; border:none; border-radius:6px; padding:4px 10px; font-size:0.75rem; font-weight:bold; cursor:pointer; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.5px;">
            Unirse
          </button>
        </div>
      `;
    }).join("");

    rightSideHtml = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
          <label style="font-family:'Barlow Condensed',sans-serif; color:#ffd700; font-size:0.9rem; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
            <span>🏠 APUESTA DE MONEDAS:</span>
            <span style="font-size:0.75rem; color:#94a3b8;">Tus Monedas: ${userAlbumData.coins}</span>
          </label>
          <input type="number" id="card-duel-bet-input" value="100" min="100" max="${userAlbumData.coins}" step="10" style="background:rgba(0,0,0,0.3); border:1px solid rgba(240,192,32,0.3); border-radius:8px; color:#ffd700; padding:8px 12px; font-size:1rem; font-weight:bold; outline:none; font-family:monospace; width:100%; box-sizing:border-box;">
        </div>
        <button class="workshop-action-btn" style="background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; font-size:1.05rem; padding:10px; cursor:pointer; border:none; border-radius:8px;" onclick="createCardDuelRoom()">
          🏠 Crear Sala de Combate
        </button>
        <div style="display:flex; align-items:center; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
          <input type="text" id="card-duel-code-input" placeholder="Código de Sala..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 12px; font-size:0.85rem; font-family:monospace; width:60%; outline:none;">
          <button class="workshop-action-btn" style="background:#4b5563; color:#fff; font-size:0.85rem; padding:8px 12px; width:40%; cursor:pointer; border:none; border-radius:8px;" onclick="joinCardDuelRoom(document.getElementById('card-duel-code-input').value)">
            🏠 Unirse
          </button>
        </div>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
        <span style="font-family:'Barlow Condensed',sans-serif; color:#ef4444; font-size:0.85rem; font-weight:bold; text-align:left; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">🌐 Salas PvP Activas</span>
        ${openRooms.length === 0 ? `
          <div style="font-size:0.75rem; color:#64748b; padding:10px; text-align:center; border:1px dashed rgba(255,255,255,0.05); border-radius:8px;">No hay salas públicas abiertas en este momento.</div>
        ` : openRoomsHtml}
      </div>
    `;
  } else if (currentTabMode === "liga") {
    let savedProgress = 0;
    try {
      savedProgress = parseInt(localStorage.getItem(`lqsa_liga_progress_${uid}`)) || 0;
    } catch (e) {
      savedProgress = 0;
    }
    const bossesHtml = LQSALigaBosses.map((boss, idx) => {
      const isUnlocked = idx <= savedProgress;
      const isDefeated = idx < savedProgress;

      return `
        <div style="background:rgba(255,255,255,${isUnlocked ? '0.04' : '0.01'}); border:1px solid ${isUnlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}; border-radius:12px; padding:10px; display:flex; align-items:center; justify-content:space-between; opacity:${isUnlocked ? 1 : 0.4}; transition:all 0.2s;">
          <div style="display:flex; align-items:center; gap:10px; text-align:left;">
            <img src="${boss.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid ${isUnlocked ? boss.difficultyColor : '#4b5563'}" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; font-weight:bold; color:${isUnlocked ? '#fff' : '#64748b'}; display:flex; align-items:center; gap:6px;">
                <span>${boss.name}</span>
                ${isDefeated ? '<span style="color:#4ade80; font-size:0.75rem;">✅ Derrotado</span>' : ''}
              </div>
              <div style="font-size:0.72rem; color:${boss.difficultyColor}; font-weight:bold; text-transform:uppercase;">Dificultad: ${boss.difficulty} | +${boss.reward} 🪙</div>
            </div>
          </div>
          ${isUnlocked ? `
            <button onclick="startLigaBossBattle('${boss.id}')" style="background:${isDefeated ? '#4b5563' : 'linear-gradient(135deg, #eab308, #ca8a04)'}; color:#000; font-family:'Bebas Neue',sans-serif; font-size:0.9rem; letter-spacing:0.5px; padding:6px 14px; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
              ${isDefeated ? 'Revancha' : 'Desafiar'}
            </button>
          ` : `
            <span style="font-size:1.1rem; color:#64748b;">🔒 Bloqueado</span>
          `}
        </div>
      `;
    }).join("");

    rightSideHtml = `
      <div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; max-height:280px; padding-right:4px;">
        <div style="color:#ffd700; font-family:'Barlow Condensed',sans-serif; font-size:0.85rem; font-weight:bold; text-align:left; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:4px; margin-bottom:4px;">🏆 PROGRESO DE LIGA: ENTRENADORES DERROTADOS (${savedProgress}/8)</div>
        ${bossesHtml}
      </div>
    `;
  } else if (currentTabMode === "team") {
    const openRooms = activeTeamTcgRooms.filter(r => r.status === "waiting");
    const openRoomsHtml = openRooms.map(r => {
      const creatorUid = r.creator;
      const creator = r.players[creatorUid] || { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
      const currentConnect = Object.keys(r.players || {}).length;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:8px 12px; border-radius:10px; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px; text-align:left;">
            <img src="${creator.avatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid #2563eb;" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div>
              <div style="font-size:0.8rem; font-weight:bold; color:#fff;">Sala 2vs2 de ${creator.username}</div>
              <div style="font-size:0.68rem; color:#ffd700;">Conectados: ${currentConnect}/4 | Cód: ${r.code}</div>
            </div>
          </div>
          <button onclick="joinTeamTcgRoom('${r.code}')" style="background:#2563eb; color:#fff; border:none; border-radius:6px; padding:4px 10px; font-size:0.75rem; font-weight:bold; cursor:pointer; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.5px;">
            Unirse
          </button>
        </div>
      `;
    }).join("");

    rightSideHtml = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:12px;">
        <p style="color:#94a3b8; font-size:0.8rem; text-align:left; margin:0; line-height:1.4;">Enfréntate en combates dobles por parejas (2vs2). ¡El trabajo en equipo comunitario es vital!</p>
        <button class="workshop-action-btn" style="background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; font-size:1rem; padding:10px; cursor:pointer; border:none; border-radius:8px;" onclick="createTeamTcgRoom()">
          🏠 Crear Duelo 2VS2
        </button>
        <div style="display:flex; align-items:center; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
          <input type="text" id="team-tcg-code-input" placeholder="Código de Sala..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 12px; font-size:0.85rem; font-family:monospace; width:60%; outline:none;">
          <button class="workshop-action-btn" style="background:#4b5563; color:#fff; font-size:0.85rem; padding:8px 12px; width:40%; cursor:pointer; border:none; border-radius:8px;" onclick="joinTeamTcgRoom(document.getElementById('team-tcg-code-input').value)">
            🏠 Unirse
          </button>
        </div>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
        <span style="font-family:'Barlow Condensed',sans-serif; color:#2563eb; font-size:0.85rem; font-weight:bold; text-align:left; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">🌐 Salas 2vs2 Activas</span>
        ${openRooms.length === 0 ? `
          <div style="font-size:0.75rem; color:#64748b; padding:10px; text-align:center; border:1px dashed rgba(255,255,255,0.05); border-radius:8px;">No hay salas 2vs2 públicas abiertas en este momento.</div>
        ` : openRoomsHtml}
      </div>
    `;
  }

  container.innerHTML = rightSideHtml;
};

const oldRenderCardDuelLobbyHtml = window.renderCardDuelLobbyHtml;
window.renderCardDuelLobbyHtml = function (overlay, ownedCards) {
  if (!overlay) return;

  const uid = localStorage.getItem('lqsa_user');
  window.subscribeTcgLobbyRooms();
  let savedProgress = 0;
  try {
    savedProgress = parseInt(localStorage.getItem(`lqsa_liga_progress_${uid}`)) || 0;
  } catch (e) {
    savedProgress = 0;
  }

  // Agrupar cromos del inventario por tipo principal
  const grouped = {
    "Mayorista": [],
    "León": [],
    "Junta": [],
    "Inquilino": [],
    "Buscavidas": []
  };

  ownedCards.forEach(card => {
    const rawType = card.combatType || "Inquilino";
    const primaryType = rawType.includes(" + ") ? rawType.split(" + ")[0] : rawType;
    const groupKey = grouped[primaryType] ? primaryType : "Inquilino";
    grouped[groupKey].push(card);
  });

  const groupedHtml = Object.keys(grouped).map(typeKey => {
    const cards = grouped[typeKey];
    if (cards.length === 0) return "";
    const lType = (typeof LQSA_TYPES !== 'undefined' && LQSA_TYPES && LQSA_TYPES[typeKey]) ? LQSA_TYPES[typeKey] : { icon: "🏠", color: "#4ade80", element: "Planta", label: "Inquilino (Planta)" };
    const isCollapsed = !!(window.collapsedCardGroups && window.collapsedCardGroups[typeKey]);

    const cardsHtml = cards.map(card => {
      const userCard = userAlbumData.cards[card.id] || { level: 1, signed: false };
      const level = userCard.level || 1;
      const inDeck = localCardDuelDeck.includes(card.id);
      const rawType = card.combatType || "Inquilino";
      const primaryType = rawType.includes(" + ") ? rawType.split(" + ")[0] : rawType;
      let lTypeCard = (typeof LQSA_TYPES !== 'undefined' && LQSA_TYPES) ? (LQSA_TYPES[rawType] || LQSA_TYPES[primaryType] || LQSA_TYPES["Inquilino"]) : null;
      if (!lTypeCard) lTypeCard = { icon: "🏠", color: "#4ade80", element: "Planta", label: "Inquilino (Planta)" };

      return `
        <div class="workshop-card-item" style="border:1px solid ${inDeck ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.06)'}; background:${inDeck ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.02)'}; padding: 10px; margin-bottom: 6px; border-radius:10px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img class="workshop-card-thumb" src="${card.image}" style="width:40px; height:55px; object-fit:cover; border-radius:6px;" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div class="workshop-card-details" style="text-align:left;">
              <h4 class="workshop-card-title" style="font-size:0.9rem; margin:0 0 2px 0;">${card.name}</h4>
              <p class="workshop-card-meta" style="font-size:0.7rem; color:#94a3b8; margin:0 0 4px 0;">
                <span style="color:${lTypeCard.color}; font-weight:bold;">${lTypeCard.icon} ${lTypeCard.element || 'Planta'}</span> | Nivel ${level}
              </p>
              <div style="font-size:0.68rem; color:#ffd700; font-weight:bold;">🏠 HP: ${card.hp} | 🏠 ATK: ${card.atk}</div>
            </div>
          </div>
          <button class="workshop-action-btn" style="background:${inDeck ? '#ef4444' : '#22c55e'}; color:#fff; font-size:0.7rem; padding: 4px 8px; border-radius:6px; border:none; cursor:pointer;" onclick="toggleCardDuelDeck('${card.id}')">
            ${inDeck ? '? Quitar' : '? A¡adir'}
          </button>
        </div>
      `;
    }).join("");

    return `
      <div style="margin-bottom: 8px; text-align: left;">
        <div onclick="toggleCardDuelGroup('${typeKey}')" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; font-weight: bold; font-family:'Barlow Condensed',sans-serif; color:${lType.color}; font-size:0.95rem; display:flex; align-items:center; gap:8px; margin-bottom: 6px; text-transform:uppercase; cursor:pointer; user-select:none; transition:all 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.06)'" onmouseleave="this.style.background='rgba(255,255,255,0.03)'">
          <span style="font-size: 0.75rem; margin-right: 4px; display: inline-block; color: ${lType.color};">${isCollapsed ? '🏠' : '?'}</span>
          <span>${lType.icon} ${lType.label || typeKey}</span>
          <span style="margin-left:auto; font-size:0.75rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:10px; color:#cbd5e1;">${cards.length} cromos</span>
        </div>
        <div style="${isCollapsed ? 'display: none;' : ''}">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join("");

  // Construir las pestañas de selección de modo
  const tabsHtml = `
    <div style="display:flex; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:4px; margin-bottom:15px; gap:4px;">
      <button onclick="switchTcgTab('pvp')" style="flex:1; padding:8px 10px; font-family:'Barlow Condensed',sans-serif; font-size:0.9rem; font-weight:bold; letter-spacing:0.5px; border-radius:8px; border:none; cursor:pointer; transition:all 0.2s; background:${currentTabMode === 'pvp' ? 'var(--accent)' : 'transparent'}; color:${currentTabMode === 'pvp' ? '#000' : '#cbd5e1'}">🌐 PvP ONLINE</button>
      <button onclick="switchTcgTab('liga')" style="flex:1; padding:8px 10px; font-family:'Barlow Condensed',sans-serif; font-size:0.9rem; font-weight:bold; letter-spacing:0.5px; border-radius:8px; border:none; cursor:pointer; transition:all 0.2s; background:${currentTabMode === 'liga' ? 'var(--accent)' : 'transparent'}; color:${currentTabMode === 'liga' ? '#000' : '#cbd5e1'}">🏆 LIGA VECINAL</button>
      <button onclick="switchTcgTab('team')" style="flex:1; padding:8px 10px; font-family:'Barlow Condensed',sans-serif; font-size:0.9rem; font-weight:bold; letter-spacing:0.5px; border-radius:8px; border:none; cursor:pointer; transition:all 0.2s; background:${currentTabMode === 'team' ? 'var(--accent)' : 'transparent'}; color:${currentTabMode === 'team' ? '#000' : '#cbd5e1'}">🤝 2VS2 EQUIPO</button>
    </div>
  `;

  // Renderizar contenido de la pestaña activa
  let rightSideHtml = "";

  if (currentTabMode === "pvp") {
    rightSideHtml = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
          <label style="font-family:'Barlow Condensed',sans-serif; color:#ffd700; font-size:0.9rem; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
            <span>🏠 APUESTA DE MONEDAS:</span>
            <span style="font-size:0.75rem; color:#94a3b8;">Tus Monedas: ${userAlbumData.coins}</span>
          </label>
          <input type="number" id="card-duel-bet-input" value="100" min="100" max="${userAlbumData.coins}" step="10" style="background:rgba(0,0,0,0.3); border:1px solid rgba(240,192,32,0.3); border-radius:8px; color:#ffd700; padding:8px 12px; font-size:1rem; font-weight:bold; outline:none; font-family:monospace; width:100%; box-sizing:border-box;">
        </div>
        <button class="workshop-action-btn" style="background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; font-size:1.05rem; padding:10px; cursor:pointer; border:none; border-radius:8px;" onclick="createCardDuelRoom()">
          🏠 Crear Sala de Combate
        </button>
        <div style="display:flex; align-items:center; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
          <input type="text" id="card-duel-code-input" placeholder="Código de Sala..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 12px; font-size:0.85rem; font-family:monospace; width:60%; outline:none;">
          <button class="workshop-action-btn" style="background:#4b5563; color:#fff; font-size:0.85rem; padding:8px 12px; width:40%; cursor:pointer; border:none; border-radius:8px;" onclick="joinCardDuelRoom(document.getElementById('card-duel-code-input').value)">
            🏠 Unirse
          </button>
        </div>
      </div>
    `;
  } else if (currentTabMode === "liga") {
    // Renderizar la lista de jefes progresivos
    const bossesHtml = LQSALigaBosses.map((boss, idx) => {
      const isUnlocked = idx <= savedProgress;
      const isDefeated = idx < savedProgress;

      return `
        <div style="background:rgba(255,255,255,${isUnlocked ? '0.04' : '0.01'}); border:1px solid ${isUnlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}; border-radius:12px; padding:10px; display:flex; align-items:center; justify-content:space-between; opacity:${isUnlocked ? 1 : 0.4}; transition:all 0.2s;">
          <div style="display:flex; align-items:center; gap:10px; text-align:left;">
            <img src="${boss.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid ${isUnlocked ? boss.difficultyColor : '#4b5563'}" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div>
              <div style="font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; font-weight:bold; color:${isUnlocked ? '#fff' : '#64748b'}; display:flex; align-items:center; gap:6px;">
                <span>${boss.name}</span>
                ${isDefeated ? '<span style="color:#4ade80; font-size:0.75rem;">✅ Derrotado</span>' : ''}
              </div>
              <div style="font-size:0.72rem; color:${boss.difficultyColor}; font-weight:bold; text-transform:uppercase;">Dificultad: ${boss.difficulty} | +${boss.reward} 🏠</div>
            </div>
          </div>
          ${isUnlocked ? `
            <button onclick="startLigaBossBattle('${boss.id}')" style="background:${isDefeated ? '#4b5563' : 'linear-gradient(135deg, #eab308, #ca8a04)'}; color:#000; font-family:'Bebas Neue',sans-serif; font-size:0.9rem; letter-spacing:0.5px; padding:6px 14px; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
              ${isDefeated ? 'Revancha' : 'Desafiar'}
            </button>
          ` : `
            <span style="font-size:1.1rem; color:#64748b;">🔒 Bloqueado</span>
          `}
        </div>
      `;
    }).join("");

    rightSideHtml = `
      <div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; max-height:280px; padding-right:4px;">
        <div style="color:#ffd700; font-family:'Barlow Condensed',sans-serif; font-size:0.85rem; font-weight:bold; text-align:left; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:4px; margin-bottom:4px;">🏆 PROGRESO DE LIGA: ENTRENADORES DERROTADOS (${savedProgress}/8)</div>
        ${bossesHtml}
      </div>
    `;
  } else if (currentTabMode === "team") {
    // 2vs2 Team TCG
    rightSideHtml = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:12px;">
        <p style="color:#94a3b8; font-size:0.8rem; text-align:left; margin:0; line-height:1.4;">Enfréntate en combates dobles por parejas (2vs2). ¡El trabajo en equipo comunitario es vital!</p>
        <button class="workshop-action-btn" style="background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; font-size:1rem; padding:10px; cursor:pointer; border:none; border-radius:8px;" onclick="createTeamTcgRoom()">
          🏠 Crear Duelo 2VS2
        </button>
        <div style="display:flex; align-items:center; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
          <input type="text" id="team-tcg-code-input" placeholder="Código de Sala..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 12px; font-size:0.85rem; font-family:monospace; width:60%; outline:none;">
          <button class="workshop-action-btn" style="background:#4b5563; color:#fff; font-size:0.85rem; padding:8px 12px; width:40%; cursor:pointer; border:none; border-radius:8px;" onclick="joinTeamTcgRoom(document.getElementById('team-tcg-code-input').value)">
            🏠 Unirse
          </button>
        </div>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="tcg-shop-container" style="max-width: 900px; width: 95vw; background: radial-gradient(circle at 50% 50%, #1a0e1c 0%, #070308 100%); border: 2px solid rgba(220, 38, 38, 0.4); border-radius: 24px; padding: 24px; box-sizing: border-box; position: relative;">
      <button class="auth-x" onclick="closeAllModals(); openAlbumUI();" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
      
      <div style="text-align:left; margin-bottom: 12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:10px;">
        <h2 style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:2.2rem; letter-spacing:1px; margin:0; text-shadow:0 0 15px rgba(220, 38, 38, 0.3);">⚔️ ARENA DE DUELOS DE CARTAS TCG</h2>
        <p style="color:#94a3b8; font-size:0.9rem; margin:2px 0 0 0;">Configura tu mazo de combate, supera la Liga Vecinal o reta a tus amigos online.</p>
      </div>

      ${tabsHtml}

      <div style="display:grid; grid-template-columns: 1.15fr 0.85fr; gap:20px; height:50vh; max-height:440px;">
        
        <!-- Lado Izquierdo: Selección del Mazo -->
        <div style="display:flex; flex-direction:column; gap:10px; border-right:1px solid rgba(255,255,255,0.05); padding-right:15px; overflow-y:auto;">
          <h3 style="color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1.15rem; margin:0 0 4px 0; display:flex; justify-content:space-between; align-items:center;">
            <span>🃏 Tu Mazo de Combate</span>
            <span style="color:#ef4444; font-size:0.9rem; font-weight:bold;">(${localCardDuelDeck.length}/5 cromos)</span>
          </h3>
          <div class="workshop-grid" style="grid-template-columns:1fr; gap:6px; overflow-y:visible;">
            ${ownedCards.length === 0 ? `
              <p style="color:#94a3b8; font-size:0.88rem; text-align:center; padding:30px;">Aún no tienes cromos en tu colección. ¡Abre sobres en la Tienda para empezar!</p>
            ` : groupedHtml}
          </div>
        </div>

        <!-- Lado Derecho: Lobby / Matchmaking / Liga -->
        <div id="tcg-lobby-right-col" style="display:flex; flex-direction:column; gap:12px; justify-content:center;">
          ${rightSideHtml}
          
          <!-- Clases Elementales -->
          <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; font-size:0.75rem; text-align:left;">
            <div style="color:#ffd700; font-weight:bold; margin-bottom:4px; font-size:0.8rem; font-family:'Barlow Condensed',sans-serif;">⚡ VENTAJAS ELEMENTALES (x1.5 Daño)</div>
            <div style="display:grid; grid-template-columns: 1fr; gap:2px; color:#cbd5e1; line-height:1.2;">
              <div>🔥 Mayorista (Fuego) ? Inquilino (Planta)</div>
              <div>🏠 León (Eléctrico) ? Buscavidas (Agua)</div>
              <div>🏠 Junta (Psíquico) ? Inquilino (Planta)</div>
              <div>🌿 Inquilino (Planta) ? Buscavidas (Agua)</div>
              <div>💧 Buscavidas (Agua) ? León (Eléctrico)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
};

window.switchTcgTab = function (tabName) {
  currentTabMode = tabName;
  openCardDuelLobby();
};

// ==========================================================================
//  1. SISTEMA DE LIGA VECINAL TCG (LOCAL VS ENTRENADORES IA)
// ==========================================================================

window.startLigaBossBattle = function (bossId) {
  if (localCardDuelDeck.length === 0) {
    alert("¡Mazo vacío! Selecciona al menos 1 cromo a la izquierda para poder jugar.");
    return;
  }

  const boss = LQSALigaBosses.find(b => b.id === bossId);
  if (!boss) return;

  const uid = localStorage.getItem('lqsa_user');

  // Mapear el mazo del jugador con escalado por nivel y firmas (soporta claves compuestas)
  const mappedPlayerDeck = localCardDuelDeck.map(cardId => {
    const baseId = cardId.split("_")[0];
    const isFoil = cardId.includes("_foil");
    const signed = cardId.includes("_signed");
    let level = 1;
    const lvlMatch = cardId.match(/_lvl(\d+)/);
    if (lvlMatch) level = parseInt(lvlMatch[1]);

    const card = ALBUM_CARDS.find(c => c.id === baseId) || ALBUM_CARDS[0];
    const userCard = userAlbumData.cards[cardId] || { level: level, signed: signed };

    const lvl = userCard.level || level || 1;
    const sig = !!userCard.signed || signed;
    const levelMultiplier = 1 + (lvl - 1) * 0.15;
    const signedMultiplier = sig ? 1.3 : 1.0;

    const maxHp = Math.round((card.hp || 100) * levelMultiplier * signedMultiplier);
    const atk = Math.round((card.atk || 40) * levelMultiplier * signedMultiplier);
    const def = Math.round((card.def || 30) * levelMultiplier * signedMultiplier);

    const scaledAttacks = (card.attacks || []).map(atkObj => ({
      name: atkObj.name,
      desc: atkObj.desc,
      power: Math.round(atkObj.power * levelMultiplier * signedMultiplier)
    }));

    return {
      id: cardId,
      name: card.name + (isFoil ? " 🏠" : "") + (sig ? " 🏠" : "") + (lvl > 1 ? ` (?${lvl})` : ""),
      image: card.image,
      maxHp: maxHp,
      hp: maxHp,
      atk: atk,
      def: def,
      level: lvl,
      signed: sig,
      combatType: card.combatType || "Inquilino",
      attacks: scaledAttacks
    };
  });

  // Mapear el mazo del Jefe IA con escalado por nivel de dificultad del Boss
  const mappedBossDeck = boss.deck.map(cardId => {
    const card = ALBUM_CARDS.find(c => c.id === cardId) || ALBUM_CARDS[0];
    const level = boss.cardLevel || 1;
    const foilMultiplier = boss.isFoil ? 1.25 : 1.0;
    const levelMultiplier = (1 + (level - 1) * 0.15) * foilMultiplier;

    const maxHp = Math.round((card.hp || 100) * levelMultiplier);
    const atk = Math.round((card.atk || 40) * levelMultiplier);
    const def = Math.round((card.def || 30) * levelMultiplier);

    const scaledAttacks = (card.attacks || []).map(atkObj => ({
      name: atkObj.name,
      desc: atkObj.desc,
      power: Math.round(atkObj.power * levelMultiplier)
    }));

    return {
      id: cardId,
      name: card.name,
      image: card.image,
      maxHp: maxHp,
      hp: maxHp,
      atk: atk,
      def: def,
      level: level,
      signed: boss.isFoil,
      combatType: card.combatType || "Inquilino",
      attacks: scaledAttacks
    };
  });

  // Inicializar estado del encuentro
  localLigaActiveMatch = {
    boss: boss,
    playerDeck: mappedPlayerDeck,
    bossDeck: mappedBossDeck,
    playerActiveIdx: 0,
    bossActiveIdx: 0,
    turn: "player", // "player" | "boss"
    logs: ["¡Comienza el encuentro de Liga! Retas a " + boss.name + "."]
  };

  renderLigaBattleScreen();
};

function renderLigaBattleScreen() {
  const overlay = document.getElementById("auth-modal");
  if (!overlay || !localLigaActiveMatch) return;

  const match = localLigaActiveMatch;
  const me = match.playerDeck;
  const opp = match.bossDeck;

  const myActiveCard = me[match.playerActiveIdx];
  const oppActiveCard = opp[match.bossActiveIdx];

  const myHpPct = Math.round((myActiveCard.hp / myActiveCard.maxHp) * 100);
  const oppHpPct = Math.round((oppActiveCard.hp / oppActiveCard.maxHp) * 100);

  const isMyTurn = match.turn === "player";
  const recentLogs = match.logs.slice(-4).reverse();

  // Elementos y tipos
  const myRawType = myActiveCard.combatType || "Inquilino";
  const myPrimary = myRawType.includes(" + ") ? myRawType.split(" + ")[0] : myRawType;
  let myType = (typeof LQSA_TYPES !== 'undefined') ? (LQSA_TYPES[myRawType] || LQSA_TYPES[myPrimary] || LQSA_TYPES["Inquilino"]) : { icon: "🏠", color: "#4ade80", element: "Planta" };

  const oppRawType = oppActiveCard.combatType || "Inquilino";
  const oppPrimary = oppRawType.includes(" + ") ? oppRawType.split(" + ")[0] : oppRawType;
  let oppType = (typeof LQSA_TYPES !== 'undefined') ? (LQSA_TYPES[oppRawType] || LQSA_TYPES[oppPrimary] || LQSA_TYPES["Inquilino"]) : { icon: "🏠", color: "#4ade80", element: "Planta" };

  const benchHtml = me.map((card, idx) => {
    if (idx === match.playerActiveIdx) return '';
    const alive = card.hp > 0;
    return `
      <div class="bench-item ${alive ? '' : 'defeated'}" onclick="${alive && isMyTurn ? `switchLigaActive(${idx})` : ''}" style="border: 1px solid ${alive ? 'rgba(255,255,255,0.1)' : '#ef4444'}; opacity:${alive ? 1 : 0.4}; cursor:${alive && isMyTurn ? 'pointer' : 'not-allowed'}; padding:4px; border-radius:6px; background:rgba(0,0,0,0.3); display:flex; flex-direction:column; align-items:center; gap:2px; font-size:0.65rem; width:45px; position:relative;">
        <img src="${card.image}" style="width:30px; height:40px; object-fit:cover; border-radius:3px;">
        <div style="font-weight:bold; color:#f87171; font-size:0.58rem;">${card.hp}/${card.maxHp}</div>
        ${!alive ? '<div style="position:absolute; inset:0; background:rgba(239,68,68,0.25); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:0.75rem; border-radius:6px;">💀</div>' : ''}
      </div>
    `;
  }).join("");

  overlay.innerHTML = `
    <div class="tcg-shop-container card-duel-battlefield" style="max-width: 900px; width: 95vw; background: radial-gradient(circle at 50% 50%, #0d0a21 0%, #030208 100%); border: 2px solid ${match.boss.difficultyColor}; border-radius: 24px; padding: 20px; box-sizing: border-box; display:flex; flex-direction:column; gap:12px; justify-content:space-between; position:relative;">
      
      <!-- Cabecera de Liga (Se incluye la imagen del Boss) -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${match.boss.image}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid ${match.boss.difficultyColor}; box-shadow:0 0 10px ${match.boss.difficultyColor}80;" onerror="this.src='img/personajes/amador-rivas.webp'">
          <div style="text-align:left;">
            <span style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:1.6rem; letter-spacing:1px; line-height:1;">🏆 LIGA VECINAL: VS ${match.boss.name.toUpperCase()}</span>
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              <span style="background:${match.boss.difficultyColor}30; border:1px solid ${match.boss.difficultyColor}; color:${match.boss.difficultyColor}; font-size:0.68rem; padding:1px 6px; border-radius:20px; font-weight:bold; text-transform:uppercase;">${match.boss.difficulty}</span>
              <span style="color:#ffd700; font-size:0.68rem; font-weight:bold;">+${match.boss.reward} 🪙 Recompensa</span>
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="background:${isMyTurn ? '#22c55e' : '#4b5563'}; color:#fff; font-size:0.8rem; padding: 4px 10px; border-radius:30px; font-weight:bold;">
            ${isMyTurn ? '⚔️ TU TURNO' : '⏳ TURNO DEL RIVAL'}
          </span>
          <button class="workshop-action-btn" style="background:#ef4444; color:#fff; font-size:0.78rem; padding: 4px 10px; margin: 0; border:none; border-radius:20px; cursor:pointer;" onclick="exitLigaBattle()">🚪 Retirarse</button>
        </div>
      </div>

      <!-- Tablero del Duelo -->
      <div style="display:flex; flex-direction:column; gap:16px; flex:1; justify-content:center;">
        
        <!-- Enemigo (IA Boss) -->
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:20px; padding: 10px 30px;">
          <div style="text-align:right; width: 240px;" class="tcg-card-defender-wrapper">
            <div style="font-weight:bold; font-size:1.05rem; display:flex; justify-content:flex-end; gap:8px; align-items:center;">
              <span>${oppActiveCard.name}</span>
              <span style="background:${oppType.color}; font-size:0.7rem; padding:2px 6px; border-radius:4px; color:#fff;">${oppType.icon} ${oppType.element || 'Planta'}</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin: 2px 0 4px 0;">Carta de Jefe</div>
            <div style="width:100%; height:10px; background:rgba(255,255,255,0.08); border-radius:30px; overflow:hidden; border:1px solid rgba(255,255,255,0.12);">
              <div style="width:${oppHpPct}%; height:100%; background:${oppHpPct > 50 ? '#22c55e' : (oppHpPct > 20 ? '#eab308' : '#ef4444')}; transition:all 0.3s;"></div>
            </div>
            <div style="font-size:0.78rem; font-family:monospace; font-weight:bold; margin-top:2px; color:#ef4444;">🏠 HP: ${oppActiveCard.hp}/${oppActiveCard.maxHp}</div>
          </div>
          <div style="width: 75px; height: 105px; border-radius:8px; border:2px solid ${oppType.color}; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.5);" class="tcg-card-defender">
            <img src="${oppActiveCard.image}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='img/personajes/amador-rivas.webp'">
          </div>
        </div>

        <!-- Jugador Humano -->
        <div style="display:flex; align-items:center; justify-content:flex-start; gap:20px; padding: 10px 30px; border-top: 1px solid rgba(255,255,255,0.02);">
          <div style="width: 75px; height: 105px; border-radius:8px; border:2px solid ${myType.color}; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.5);" class="tcg-card-attacker">
            <img src="${myActiveCard.image}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='img/personajes/amador-rivas.webp'">
          </div>
          <div style="text-align:left; width: 240px;">
            <div style="font-weight:bold; font-size:1.05rem; display:flex; gap:8px; align-items:center;">
              <span>${myActiveCard.name}</span>
              <span style="background:${myType.color}; font-size:0.7rem; padding:2px 6px; border-radius:4px; color:#fff;">${myType.icon} ${myType.element || 'Planta'}</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin: 2px 0 4px 0;">Tu Mazo</div>
            <div style="width:100%; height:10px; background:rgba(255,255,255,0.08); border-radius:30px; overflow:hidden; border:1px solid rgba(255,255,255,0.12);">
              <div style="width:${myHpPct}%; height:100%; background:${myHpPct > 50 ? '#22c55e' : (myHpPct > 20 ? '#eab308' : '#ef4444')}; transition:all 0.3s;"></div>
            </div>
            <div style="font-size:0.78rem; font-family:monospace; font-weight:bold; margin-top:2px; color:#4ade80;">🏠 HP: ${myActiveCard.hp}/${myActiveCard.maxHp}</div>
          </div>
        </div>

      </div>

      <!-- Consola e Interacción del Turno -->
      <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:16px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:15px; align-items:center;">
        
        <!-- Historial/Consola -->
        <div style="text-align:left; font-family:monospace; border-radius:10px; background:rgba(0,0,0,0.35); padding:10px; height:85px; overflow-y:auto; font-size:0.75rem; border:1px solid rgba(255,255,255,0.04); display:flex; flex-direction:column; gap:4px;">
          ${recentLogs.map((log, index) => {
    let color = "#cbd5e1";
    if (log.includes("Súper Efectivo")) color = "#ffd700";
    else if (log.includes("derrotado") || log.includes("derrotó")) color = "#f87171";
    else if (log.includes("¡VICTORIA!")) color = "#4ade80";
    return `<div style="color:${color}; opacity:${index === 0 ? 1 : 0.65}; font-weight:${index === 0 ? 'bold' : 'normal'};">> ${log}</div>`;
  }).join("")}
        </div>

        <!-- Acciones o Banquillo -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <!-- Ataques -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
            ${(myActiveCard.attacks || []).map((atk, idx) => `
              <button class="workshop-action-btn" style="background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; font-size:0.78rem; padding:8px; line-height:1.2; text-align:left; border:none; border-radius:6px; cursor:pointer;" ${!isMyTurn || myActiveCard.hp <= 0 ? 'disabled' : ''} onclick="executeLigaPlayerAttack(${idx})">
                <div style="font-weight:bold; font-size:0.85rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">💀 ${atk.name}</div>
                <div style="font-size:0.65rem; color:#ffd700;">Daño: ${atk.power} ATK</div>
              </button>
            `).join("")}
          </div>
          
          <!-- Banquillo de Aliados -->
          <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:4px 8px; border-radius:8px;">
            <span style="font-size:0.68rem; color:#94a3b8; font-weight:bold; text-transform:uppercase; font-family:'Barlow Condensed',sans-serif; writing-mode:vertical-lr; transform:rotate(180deg);">BANQUILLO</span>
            <div style="display:flex; gap:6px;">
              ${benchHtml || '<span style="font-size:0.68rem; color:#4b5563;">Sin relevos.</span>'}
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Auto-switch si la carta del jugador muere
  if (myActiveCard.hp <= 0) {
    const nextAliveIdx = me.findIndex(c => c.hp > 0);
    if (nextAliveIdx !== -1) {
      switchLigaActive(nextAliveIdx);
    }
  }

  // Turno de la IA
  if (match.turn === "boss") {
    setTimeout(executeLigaBossTurn, 1600);
  }
}

window.executeLigaPlayerAttack = function (attackIdx) {
  if (!localLigaActiveMatch || localLigaActiveMatch.turn !== "player") return;

  const match = localLigaActiveMatch;
  const me = match.playerDeck;
  const opp = match.bossDeck;

  const myCard = me[match.playerActiveIdx];
  const oppCard = opp[match.bossActiveIdx];
  const attack = myCard.attacks[attackIdx];

  // Cálculo elemental
  const myPrimary = myCard.combatType.includes(" + ") ? myCard.combatType.split(" + ")[0] : myCard.combatType;
  let mult = 1.0;
  if (ELEMENT_ADVANTAGES[myPrimary] && ELEMENT_ADVANTAGES[myPrimary][oppCard.combatType] !== undefined) {
    mult = ELEMENT_ADVANTAGES[myPrimary][oppCard.combatType];
  }

  // Daño real
  const baseDmg = Math.round(attack.power * mult * (1 - (oppCard.def / 350)));
  oppCard.hp = Math.max(0, oppCard.hp - baseDmg);

  let logMsg = `¡Tu ${myCard.name.split(' ')[0]} usó ${attack.name}! -${baseDmg} HP al rival.`;
  if (mult > 1.0) logMsg += " ¡Súper Efectivo! ⚡?";

  match.logs.push(logMsg);

  // Ejecutar animación visual de combate
  const cardContainer = document.querySelector(".tcg-card-attacker");
  playTcgCombatAnimation(cardContainer, myPrimary, baseDmg);

  const isOpponentDead = oppCard.hp <= 0;

  // Retrasar el re-renderizado para dejar que se complete la animación visual
  setTimeout(() => {
    if (isOpponentDead) {
      match.logs.push(`💀 ¡${oppCard.name.split(' ')[0]} del Jefe ha sido derrotado!`);
      const nextBossIdx = opp.findIndex(c => c.hp > 0);
      if (nextBossIdx !== -1) {
        match.bossActiveIdx = nextBossIdx;
        match.logs.push(`⚡ El Jefe envía a ${opp[nextBossIdx].name.split(' ')[0]} al combate.`);
      } else {
        // VICTORIA DE LIGA
        handleLigaVictory();
        return;
      }
    }

    match.turn = "boss";
    renderLigaBattleScreen();
  }, 850);
};

function executeLigaBossTurn() {
  if (!localLigaActiveMatch || localLigaActiveMatch.turn !== "boss") return;

  const match = localLigaActiveMatch;
  const me = match.playerDeck;
  const opp = match.bossDeck;

  const bossCard = opp[match.bossActiveIdx];
  const playerCard = me[match.playerActiveIdx];

  // IA elige un ataque aleatorio
  const attackIdx = Math.floor(Math.random() * bossCard.attacks.length);
  const attack = bossCard.attacks[attackIdx];

  // Cálculo elemental
  const oppPrimary = bossCard.combatType.includes(" + ") ? bossCard.combatType.split(" + ")[0] : bossCard.combatType;
  let mult = 1.0;
  if (ELEMENT_ADVANTAGES[oppPrimary] && ELEMENT_ADVANTAGES[oppPrimary][playerCard.combatType] !== undefined) {
    mult = ELEMENT_ADVANTAGES[oppPrimary][playerCard.combatType];
  }

  const baseDmg = Math.round(attack.power * mult * (1 - (playerCard.def / 350)));
  playerCard.hp = Math.max(0, playerCard.hp - baseDmg);

  let logMsg = `🔥 ¡El Jefe con ${bossCard.name.split(' ')[0]} usó ${attack.name}! -${baseDmg} HP a tu cromo.`;
  if (mult > 1.0) logMsg += " ¡Súper Efectivo! ⚔️";

  match.logs.push(logMsg);

  // Ejecutar animación de combate
  const bossCardContainer = document.querySelector(".tcg-card-defender");
  playTcgCombatAnimation(bossCardContainer, oppPrimary, baseDmg);

  const isPlayerDead = playerCard.hp <= 0;

  // Retrasar el re-renderizado para dejar que se complete la animación visual
  setTimeout(() => {
    if (isPlayerDead) {
      match.logs.push(`💀 ¡Tu cromo ${playerCard.name.split(' ')[0]} ha sido derrotado!`);
      const nextPlayerIdx = me.findIndex(c => c.hp > 0);
      if (nextPlayerIdx !== -1) {
        match.playerActiveIdx = nextPlayerIdx;
        match.logs.push(`⚡ Envías a ${me[nextPlayerIdx].name.split(' ')[0]} al frente.`);
      } else {
        // DERROTA TOTAL
        handleLigaDefeat();
        return;
      }
    }

    match.turn = "player";
    renderLigaBattleScreen();
  }, 850);
}

window.switchLigaActive = function (idx) {
  if (!localLigaActiveMatch || localLigaActiveMatch.turn !== "player") return;

  const match = localLigaActiveMatch;
  const me = match.playerDeck;
  const oldActive = me[match.playerActiveIdx];
  const newActive = me[idx];

  match.playerActiveIdx = idx;
  match.logs.push(`⚡ Retiras a ${oldActive.name.split(' ')[0]} y sacas a ${newActive.name.split(' ')[0]}.`);

  match.turn = "boss";
  renderLigaBattleScreen();
};

function handleLigaVictory() {
  const overlay = document.getElementById("auth-modal");
  if (!overlay || !localLigaActiveMatch) return;

  const boss = localLigaActiveMatch.boss;
  const uid = localStorage.getItem('lqsa_user');
  const db = firebase.database();

  // Guardar y progresar Liga Vecinal
  let currentProgress = 0;
  try {
    currentProgress = parseInt(localStorage.getItem(`lqsa_liga_progress_${uid}`)) || 0;
  } catch (e) { }

  const bossIdx = LQSALigaBosses.findIndex(b => b.id === boss.id);
  if (bossIdx === currentProgress) {
    currentProgress++;
    localStorage.setItem(`lqsa_liga_progress_${uid}`, currentProgress);
  }

  // Conceder monedas de recompensa
  db.ref(`users/${uid}/coins`).transaction(coins => (coins || 0) + boss.reward);

  if (typeof confetti === 'function') {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }

  overlay.innerHTML = `
    <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid #ffd700; border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center; position:relative;">
      <div style="font-size:4rem; margin-bottom:12px;">🏆</div>
      <h2 style="font-family:'Bebas Neue',sans-serif; color:#ffd700; font-size:2.8rem; letter-spacing:1px; margin:0 0 10px 0;">¡VICTORIA EN LA LIGA!</h2>
      <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0; line-height:1.4;">
        ¡Has derrotado a <strong>${boss.name}</strong> en la Liga de Cromos TCG! Tu nivel y destreza como entrenador comunitario ascienden.
      </p>
      <div style="background:rgba(255,215,0,0.1); border:1px solid rgba(255,215,0,0.3); border-radius:12px; padding:15px; margin-bottom:20px;">
        <div style="font-size:0.85rem; color:#ffd700; font-weight:bold;">🪙 RECOMPENSA DE ENTRENADOR</div>
        <div style="font-size:1.8rem; font-family:'Bebas Neue',sans-serif; color:#fff; margin-top:4px;">+${boss.reward} MONEDAS</div>
      </div>
      <button class="workshop-action-btn" style="background:#eab308; color:#000; font-size:1.05rem; padding:10px 24px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;" onclick="closeAllModals(); openCardDuelLobby();">
        Volver a la Arena
      </button>
    </div>
  `;

  localLigaActiveMatch = null;
}

function handleLigaDefeat() {
  const overlay = document.getElementById("auth-modal");
  if (!overlay || !localLigaActiveMatch) return;

  const boss = localLigaActiveMatch.boss;

  overlay.innerHTML = `
    <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid #ef4444; border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center; position:relative;">
      <div style="font-size:4rem; margin-bottom:12px;">💀</div>
      <h2 style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:2.8rem; letter-spacing:1px; margin:0 0 10px 0;">¡DERROTA ABSOLUTA!</h2>
      <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0; line-height:1.4;">
        Todos tus vecinos han quedado KO frente al mazo de <strong>${boss.name}</strong>. ¡Entrena más tus cartas e inténtalo de nuevo!
      </p>
      <button class="workshop-action-btn" style="background:#ef4444; color:#fff; font-size:1.05rem; padding:10px 24px; border:none; border-radius:8px; cursor:pointer;" onclick="closeAllModals(); openCardDuelLobby();">
        Volver a la Arena
      </button>
    </div>
  `;

  localLigaActiveMatch = null;
}

window.exitLigaBattle = function () {
  if (confirm("¡Estás seguro de que quieres retirarte? Se contará como derrota.")) {
    localLigaActiveMatch = null;
    openCardDuelLobby();
  }
};

// ==========================================================================
//  2. MODO 2VSIA ONLINE COOPERATIVO TCG (REMOVIDO POR PETICI?"N DEL USUARIO)
// ==========================================================================
// [REMOVED 2VSIA COOP MODE BY USER REQUEST]

// ==========================================================================
//  3. MODO 2VS2 TEAM ONLINE TCG (LUCHA DE PAREJAS POR EQUIPOS - CON DRAFT)
// ==========================================================================

let teamRoomListener = null;

window.createTeamTcgRoom = async function () {
  const uid = localStorage.getItem('lqsa_user');
  if (!uid) return;

  const roomCode = "TM-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  const db = firebase.database();

  let myProfile = { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
  const snap = await db.ref(`users/${uid}`).once('value');
  if (snap.exists()) myProfile = snap.val();

  const initialRoom = {
    code: roomCode,
    creator: uid,
    status: "choosing_decks",
    bet: 150,
    players: {
      [uid]: {
        uid: uid,
        username: myProfile.username,
        avatar: myProfile.avatar || "img/personajes/amador-rivas.webp",
        ready: false,
        draftDeck: [],
        team: "A"
      }
    },
    logs: ["¡Creada sala 2vs2 por equipos!"],
    ts: firebase.database.ServerValue.TIMESTAMP
  };

  await db.ref(`team_tcg/${roomCode}`).set(initialRoom);
  window._teamRoomCode = roomCode;
  listenToTeamRoom(roomCode);
};

window.joinTeamTcgRoom = async function (roomCode) {
  roomCode = roomCode.trim().toUpperCase();
  if (!roomCode) return;

  const uid = localStorage.getItem('lqsa_user');
  if (!uid) return;

  const db = firebase.database();
  const snap = await db.ref(`team_tcg/${roomCode}`).once('value');
  if (!snap.exists()) {
    alert("La sala 2vs2 no existe.");
    return;
  }

  const room = snap.val();
  const pUids = Object.keys(room.players || {});
  if (pUids.length >= 4 && !room.players[uid]) {
    alert("La sala 2vs2 ya estú llena.");
    return;
  }

  let myProfile = { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
  const userSnap = await db.ref(`users/${uid}`).once('value');
  if (userSnap.exists()) myProfile = userSnap.val();

  // Asignar equipo alternando
  const team = pUids.length % 2 === 0 ? "A" : "B";

  await db.ref(`team_tcg/${roomCode}/players/${uid}`).set({
    uid: uid,
    username: myProfile.username,
    avatar: myProfile.avatar || "img/personajes/amador-rivas.webp",
    ready: false,
    draftDeck: [],
    team: team
  });

  if (pUids.length === 3) {
    await db.ref(`team_tcg/${roomCode}/status`).set("choosing_decks");
  }

  await db.ref(`team_tcg/${roomCode}/logs`).push(`¡${myProfile.username} se une al Equipo ${team}!`);

  window._teamRoomCode = roomCode;
  listenToTeamRoom(roomCode);
};

function listenToTeamRoom(roomCode) {
  const db = firebase.database();
  if (teamRoomListener && window._lastListenedTeamRoomCode) {
    db.ref(`team_tcg/${window._lastListenedTeamRoomCode}`).off('value', teamRoomListener);
  }
  window._lastListenedTeamRoomCode = roomCode;

  teamRoomListener = db.ref(`team_tcg/${roomCode}`).on('value', snap => {
    const room = snap.val();
    if (!room) {
      if (teamRoomListener) {
        db.ref(`team_tcg/${roomCode}`).off('value', teamRoomListener);
        teamRoomListener = null;
      }
      window._teamRoomCode = null;
      window._lastListenedTeamRoomCode = null;
      if (typeof closeAllModals === 'function') closeAllModals();
      if (typeof openCardDuelLobby === 'function') openCardDuelLobby();
      return;
    }

    renderTeamRoomState(room);
  });
}

window.renderTeamRoomState = function (room) {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;

  const uid = localStorage.getItem('lqsa_user');
  const pUids = Object.keys(room.players || {});

  if (room.status === "waiting") {
    overlay.innerHTML = `
      <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid #2563eb; border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center;">
        <h2 style="font-family:'Bebas Neue',sans-serif; color:#2563eb; font-size:2.2rem; letter-spacing:1px; margin:0 0 10px 0;">🤝 SALA 2VS2 POR EQUIPOS</h2>
        <div style="font-size:2.5rem; font-family:monospace; color:#ffd700; font-weight:bold; letter-spacing:4px; margin:16px 0; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
          ${room.code}
        </div>
        <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0;">Esperando a 4 jugadores (${pUids.length}/4 conectados).</p>
        <button class="workshop-action-btn" style="background:#ef4444; color:#fff;" onclick="abandonTeamTcgRoom('${room.code}')">
          ✕ Cancelar Sala
        </button>
      </div>
    `;
  } else if (room.status === "choosing_decks") {
    const mePlayer = room.players[uid];
    const myReady = mePlayer ? !!mePlayer.ready : false;
    const myDraftDeck = mePlayer ? (mePlayer.draftDeck || []) : [];

    // Retrieve owned cards to show on left
    const ownedCards = [];
    Object.keys(userAlbumData.cards).forEach(key => {
      const uCard = userAlbumData.cards[key];
      if (!uCard || uCard.count < 1) return;

      const { baseId, isFoil, signed, level } = parseCardKey(key);
      const baseCard = ALBUM_CARDS.find(c => c.id === baseId);
      if (!baseCard) return;

      ownedCards.push({
        ...baseCard,
        id: key, // Clave compuesta
        baseId: baseId,
        level: level,
        signed: signed,
        isFoil: isFoil,
        name: baseCard.name + (isFoil ? " 🌈" : "") + (signed ? " ✒️" : "") + (level > 1 ? ` (★${level})` : "")
      });
    });

    const ownedCardsHtml = ownedCards.map(card => {
      const inDraft = myDraftDeck.includes(card.id);
      const level = card.level || 1;
      const rawType = card.combatType || "Inquilino";
      const primaryType = rawType.includes(" + ") ? rawType.split(" + ")[0] : rawType;
      let lTypeCard = (typeof LQSA_TYPES !== 'undefined' && LQSA_TYPES) ? (LQSA_TYPES[rawType] || LQSA_TYPES[primaryType] || LQSA_TYPES["Inquilino"]) : null;
      if (!lTypeCard) lTypeCard = { icon: "🏠", color: "#4ade80", element: "Planta" };

      return `
        <div style="background:rgba(255,255,255,0.02); border:1px solid ${inDraft ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.05)'}; border-radius:10px; padding:6px 8px; display:flex; align-items:center; justify-content:space-between; gap:6px;">
          <div style="display:flex; align-items:center; gap:6px; text-align:left;">
            <img src="${card.image}" style="width:25px; height:35px; object-fit:cover; border-radius:4px;" onerror="this.src='img/personajes/amador-rivas.webp'">
            <div>
              <div style="font-size:0.75rem; font-weight:bold; color:#fff;">${card.name}</div>
              <div style="font-size:0.6rem; color:${lTypeCard.color};">${lTypeCard.icon} Nivel ${level}</div>
            </div>
          </div>
          <button style="background:${inDraft ? '#ef4444' : '#22c55e'}; color:#fff; border:none; border-radius:4px; padding:3px 6px; font-size:0.65rem; cursor:pointer;" onclick="toggleTeamDraftCard('${room.code}', '${card.id}')" ${myReady ? 'disabled' : ''}>
            ${inDraft ? '✕' : '＋'}
          </button>
        </div>
      `;
    }).join("");

    // Render players real-time draft progress grouped by Team A and Team B
    const teamA = pUids.filter(id => room.players[id].team === "A");
    const teamB = pUids.filter(id => room.players[id].team === "B");

    const renderPlayerDraftList = (pId) => {
      const p = room.players[pId];
      if (!p) return "";
      const isMe = pId === uid;
      const pDraft = p.draftDeck || [];
      const readyState = !!p.ready;

      const cardsThumbs = pDraft.map(cardId => {
        const { baseId, isFoil, signed, level } = window.parseCardKey ? window.parseCardKey(cardId) : { baseId: cardId.split("_")[0], isFoil: false, signed: false, level: 1 };
        const card = ALBUM_CARDS.find(c => c.id === baseId);
        if (!card) return "";
        return `
          <div style="position:relative; width:30px; height:42px; display:inline-block; border-radius:3px; overflow:visible; margin-right:4px;" title="${card.name} (Lvl ${level}${isFoil ? ', Foil' : ''}${signed ? ', Firmada' : ''})">
            <img src="${card.image}" style="width:100%; height:100%; object-fit:cover; border-radius:3px; border:1px solid ${p.team === 'A' ? '#2563eb' : '#ef4444'};" onerror="this.src='img/personajes/amador-rivas.webp'">
            ${level > 1 ? `<div style="position:absolute; top:-4px; right:-4px; background:#ffd700; color:#000; font-weight:bold; font-size:0.6rem; border-radius:50%; width:11px; height:11px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 4px rgba(0,0,0,0.6);">★</div>` : ''}
            ${signed ? `<div style="position:absolute; bottom:-2px; left:-2px; background:#c084fc; color:#fff; font-weight:bold; font-size:0.45rem; padding:0 1px; border-radius:2px; transform:scale(0.85); box-shadow:0 0 2px rgba(0,0,0,0.5);">✒️</div>` : ''}
            ${isFoil ? `<div style="position:absolute; bottom:-2px; right:-2px; background:#38bdf8; color:#fff; font-weight:bold; font-size:0.45rem; padding:0 1px; border-radius:2px; transform:scale(0.85); box-shadow:0 0 2px rgba(0,0,0,0.5);">🌈</div>` : ''}
          </div>
        `;
      }).join("");

      return `
        <div style="background:rgba(0,0,0,0.25); border:1px solid ${readyState ? '#4ade80' : 'rgba(255,255,255,0.06)'}; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:0.8rem; font-weight:bold; color:${isMe ? '#4ade80' : '#cbd5e1'}; display:flex; justify-content:space-between; align-items:center;">
            <span>${isMe ? '👤 Tú (Tu Selección)' : p.username}</span>
            <span style="font-size:0.7rem; color:${readyState ? '#4ade80' : '#ffd700'}; font-weight:bold;">${readyState ? '✅ LISTO' : `DRAFT (${pDraft.length}/5)`}</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; min-height:42px; align-items:center;">
            ${pDraft.length === 0 ? '<span style="font-size:0.65rem; color:#4b5563;">Vacío...</span>' : cardsThumbs}
          </div>
        </div>
      `;
    };

    let teamAHtml = "";
    for (let i = 0; i < 2; i++) {
      if (teamA[i]) {
        teamAHtml += renderPlayerDraftList(teamA[i]);
      } else {
        teamAHtml += `
          <div class="draft-waiting-slot" style="background:rgba(37,99,235,0.02); border:1.5px dashed rgba(37,99,235,0.25); border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:center; gap:8px; min-height:68px; box-sizing:border-box;">
            <span style="font-size:1.15rem; animation: pulse 1.8s infinite;">⏳</span>
            <span style="font-size:0.75rem; color:#60a5fa; font-family:'Barlow Condensed',sans-serif; font-weight:bold; letter-spacing:0.5px;">ESPERANDO VECINO...</span>
          </div>
        `;
      }
    }

    let teamBHtml = "";
    for (let i = 0; i < 2; i++) {
      if (teamB[i]) {
        teamBHtml += renderPlayerDraftList(teamB[i]);
      } else {
        teamBHtml += `
          <div class="draft-waiting-slot" style="background:rgba(239,68,68,0.02); border:1.5px dashed rgba(239,68,68,0.25); border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:center; gap:8px; min-height:68px; box-sizing:border-box;">
            <span style="font-size:1.15rem; animation: pulse 1.8s infinite;">⏳</span>
            <span style="font-size:0.75rem; color:#f87171; font-family:'Barlow Condensed',sans-serif; font-weight:bold; letter-spacing:0.5px;">ESPERANDO VECINO...</span>
          </div>
        `;
      }
    }

    overlay.innerHTML = `
      <div class="tcg-shop-container" style="max-width: 950px; width: 96vw; background:#0c091f; border: 2px solid #2563eb; border-radius: 24px; padding: 20px; box-sizing: border-box; position: relative;">
        <button class="auth-x" onclick="abandonTeamTcgRoom('${room.code}')" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 15px; right: 15px; display: flex; align-items: center; justify-content: center;">✕</button>
        
        <h2 style="font-family:'Bebas Neue',sans-serif; color:#2563eb; font-size:2.2rem; letter-spacing:1px; margin:0 0 2px 0; text-align:left; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-right: 50px;">
          <span>🤝 DRAFT 2VS2 POR PAREJAS EN DIRECTO</span>
          <span style="font-family:monospace; color:#ffd700; font-size:1.4rem; background:rgba(255,255,255,0.04); padding:4px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); letter-spacing:1px;">CÓDIGO: ${room.code}</span>
        </h2>
        <p style="color:#94a3b8; font-size:0.85rem; margin:0 0 15px 0; text-align:left;">Seleccionad vuestro mazo de combate en vivo. ¡Mira qué cartas eligen tus aliados y enemigos en directo!</p>
 
        <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; height:50vh; max-height:430px;">
          
          <!-- Izquierda: Tus Cartas -->
          <div style="display:flex; flex-direction:column; gap:8px; border-right:1px solid rgba(255,255,255,0.05); padding-right:15px; overflow-y:auto;">
            <h3 style="color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1.05rem; margin:0 0 2px 0; text-align:left;">🎴 Tus Cromos Disponibles</h3>
            <div style="display:grid; grid-template-columns:1fr; gap:5px;">
              ${ownedCardsHtml}
            </div>
          </div>
 
          <!-- Derecha: Estado de Draft de todos los Jugadores -->
          <div style="display:flex; flex-direction:column; gap:12px; justify-content:space-between; text-align:left; overflow-y:auto; padding-right:4px;">
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <!-- EQUIPO A (Azul) -->
              <div style="display:flex; flex-direction:column; gap:8px; background:rgba(37,99,235,0.03); border:1px solid rgba(37,99,235,0.12); border-radius:12px; padding:10px;">
                <h4 style="color:#60a5fa; font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; margin:0 0 4px 0; border-bottom:1px solid rgba(37,99,235,0.2); padding-bottom:2px; font-weight:bold;">🔵 EQUIPO A</h4>
                ${teamAHtml}
              </div>
 
              <!-- EQUIPO B (Rojo) -->
              <div style="display:flex; flex-direction:column; gap:8px; background:rgba(239,68,68,0.03); border:1px solid rgba(239,68,68,0.12); border-radius:12px; padding:10px;">
                <h4 style="color:#f87171; font-family:'Barlow Condensed',sans-serif; font-size:0.95rem; margin:0 0 4px 0; border-bottom:1px solid rgba(239,68,68,0.2); padding-bottom:2px; font-weight:bold;">🔴 EQUIPO B</h4>
                ${teamBHtml}
              </div>
            </div>
 
            <!-- Botón de Confirmación -->
            <button class="workshop-action-btn" style="background:${myReady ? '#15803d' : '#2563eb'}; color:#fff; font-size:1rem; padding:10px; width:100%;" ${myReady || myDraftDeck.length !== 5 ? 'disabled' : ''} onclick="submitTeamLiveDraft('${room.code}')">
              ${myReady ? '✅ Mazo Confirmado - Esperando al resto' : '⚡ ¡Confirmar Mazo de Combate!'}
            </button>
 
          </div>
 
        </div>
      </div>
    `;
  } else if (room.status === "fighting") {
    renderTeamBattleScreen(room);
  } else if (room.status === "finished") {
    renderTeamResultScreen(room);
  }
};

window.toggleTeamDraftCard = async function (roomCode, cardId) {
  const uid = localStorage.getItem('lqsa_user');
  const roomRef = firebase.database().ref(`team_tcg/${roomCode}`);
  const snap = await roomRef.child(`players/${uid}/draftDeck`).once('value');
  let currentDraft = snap.val() || [];

  const idx = currentDraft.indexOf(cardId);
  if (idx !== -1) {
    currentDraft.splice(idx, 1);
  } else {
    if (currentDraft.length >= 5) {
      if (window.showLqsaAlert) showLqsaAlert("¡Mazo lleno! Máximo 5 cartas.", "L¡MITE ALCANZADO", "warning");
      else alert("Mazo lleno.");
      return;
    }
    currentDraft.push(cardId);
  }
  await roomRef.child(`players/${uid}/draftDeck`).set(currentDraft);
};

window.submitTeamLiveDraft = async function (roomCode) {
  const uid = localStorage.getItem('lqsa_user');
  const db = firebase.database();
  const roomRef = db.ref(`team_tcg/${roomCode}`);
  const snap = await roomRef.once('value');
  const room = snap.val();

  const myDraftDeck = room.players[uid] ? (room.players[uid].draftDeck || []) : [];
  if (myDraftDeck.length !== 5) {
    alert("Debes seleccionar exactamente 5 cartas.");
    return;
  }

  const mappedDeck = myDraftDeck.map(cardId => {
    const baseId = cardId.split("_")[0];
    const isFoil = cardId.includes("_foil");
    const signed = cardId.includes("_signed");
    let level = 1;
    const lvlMatch = cardId.match(/_lvl(\d+)/);
    if (lvlMatch) level = parseInt(lvlMatch[1]);

    const card = ALBUM_CARDS.find(c => c.id === baseId) || ALBUM_CARDS[0];
    const userCard = userAlbumData.cards[cardId] || { level: level, signed: signed };

    const lvl = userCard.level || level || 1;
    const sig = !!userCard.signed || signed;
    const mult = (1 + (lvl - 1) * 0.15) * (sig ? 1.3 : 1.0);

    return {
      id: cardId,
      name: card.name + (isFoil ? " 🏠" : "") + (sig ? " 🏠" : "") + (lvl > 1 ? ` (?${lvl})` : ""),
      image: card.image,
      maxHp: Math.round((card.hp || 100) * mult),
      hp: Math.round((card.hp || 100) * mult),
      atk: Math.round((card.atk || 40) * mult),
      def: Math.round((card.def || 30) * mult),
      combatType: card.combatType || "Inquilino",
      attacks: (card.attacks || []).map(a => ({ name: a.name, desc: a.desc, power: Math.round(a.power * mult) }))
    };
  });

  await roomRef.child(`players/${uid}/deck`).set(mappedDeck);
  await roomRef.child(`players/${uid}/ready`).set(true);

  // Verificar si todos están listos
  const updatedSnap = await roomRef.once('value');
  const updatedRoom = updatedSnap.val();
  const pUids = Object.keys(updatedRoom.players || {});
  const allReady = pUids.every(id => updatedRoom.players[id].ready);

  if (allReady && pUids.length === 4) {
    const teamA = pUids.filter(id => updatedRoom.players[id].team === "A");
    const teamB = pUids.filter(id => updatedRoom.players[id].team === "B");

    await roomRef.update({
      status: "fighting",
      turn: teamA[0],
      turnCycle: [teamA[0], teamB[0], teamA[1], teamB[1]],
      activeCards: {
        [teamA[0]]: 0,
        [teamA[1]]: 0,
        [teamB[0]]: 0,
        [teamB[1]]: 0
      },
      logs: ["¡El combate 2vs2 por equipos en directo ha comenzado!"]
    });
  }
};

window.abandonTeamTcgRoom = async function (roomCode) {
  const uid = localStorage.getItem('lqsa_user');
  if (!uid) return;

  const db = firebase.database();
  const roomRef = db.ref(`team_tcg/${roomCode}`);
  try {
    const snap = await roomRef.once('value');
    if (snap.exists()) {
      const room = snap.val();
      if (room.creator === uid) {
        await roomRef.remove();
      } else {
        await roomRef.child(`players/${uid}`).remove();
        await roomRef.child(`status`).set("waiting");
      }
    }
  } catch (e) {
    console.error("Error leaving team room:", e);
  }

  if (teamRoomListener) {
    const rc = window._lastListenedTeamRoomCode || roomCode;
    db.ref(`team_tcg/${rc}`).off('value', teamRoomListener);
    teamRoomListener = null;
  }
  window._lastListenedTeamRoomCode = null;
  window._teamRoomCode = null;
  if (typeof openCardDuelLobby === 'function') {
    openCardDuelLobby();
  }
};

function renderTeamBattleScreen(room) {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;

  const uid = localStorage.getItem('lqsa_user');
  const pUids = Object.keys(room.players);

  const myTeam = room.players[uid].team;
  const oppTeam = myTeam === "A" ? "B" : "A";

  const allies = pUids.filter(id => room.players[id].team === myTeam);
  const enemies = pUids.filter(id => room.players[id].team === oppTeam);

  const me = room.players[uid];
  const partnerUid = allies.find(id => id !== uid);
  const partner = room.players[partnerUid];

  const myActiveIdx = room.activeCards[uid];
  const partnerActiveIdx = room.activeCards[partnerUid];

  const myActiveCard = me.deck[myActiveIdx];
  const partnerActiveCard = partner.deck[partnerActiveIdx];

  const enemy1 = room.players[enemies[0]];
  const enemy2 = room.players[enemies[1]];

  const enemy1ActiveCard = enemy1.deck[room.activeCards[enemies[0]]];
  const enemy2ActiveCard = enemy2.deck[room.activeCards[enemies[1]]];

  const myHpPct = Math.round((myActiveCard.hp / myActiveCard.maxHp) * 100);
  const partnerHpPct = Math.round((partnerActiveCard.hp / partnerActiveCard.maxHp) * 100);

  const enemy1HpPct = Math.round((enemy1ActiveCard.hp / enemy1ActiveCard.maxHp) * 100);
  const enemy2HpPct = Math.round((enemy2ActiveCard.hp / enemy2ActiveCard.maxHp) * 100);

  const isMyTurn = room.turn === uid;
  const recentLogs = (room.logs || []).slice(-4).reverse();

  overlay.innerHTML = `
    <div class="tcg-shop-container card-duel-battlefield" style="max-width: 950px; width: 96vw; background: radial-gradient(circle at 50% 50%, #0d0a21 0%, #030208 100%); border: 2px solid #2563eb; border-radius: 24px; padding: 20px; box-sizing: border-box; display:flex; flex-direction:column; gap:12px; justify-content:space-between; position:relative;">
      
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
        <span style="font-family:'Bebas Neue',sans-serif; color:#2563eb; font-size:1.6rem; letter-spacing:1px;">💀 BATALLA MULTIJUGADOR 2VS2</span>
        <span style="background:${isMyTurn ? '#22c55e' : '#4b5563'}; color:#fff; font-size:0.8rem; padding: 4px 10px; border-radius:30px; font-weight:bold;">
          ${isMyTurn ? '⚔️ TU TURNO' : '⏳ ESPERANDO VECINOS...'}
        </span>
      </div>

      <!-- Tablero del Combate Doble -->
      <div style="display:grid; grid-template-rows: 1fr 1fr; gap:16px; flex:1; justify-content:center;">
        
        <!-- Enemigos (Arriba) -->
        <div style="display:flex; gap:40px; justify-content:center; align-items:center;">
          <!-- Enemigo 1 -->
          <div style="display:flex; align-items:center; gap:10px; opacity:${enemy1ActiveCard.hp <= 0 ? 0.3 : 1}; cursor:${isMyTurn && enemy1ActiveCard.hp > 0 ? 'pointer' : 'default'}" onclick="${isMyTurn && enemy1ActiveCard.hp > 0 ? `executeTeamAttack('${enemies[0]}')` : ''}">
            <div style="text-align:right; width: 140px;">
              <div style="font-weight:bold; font-size:0.88rem;">${enemy1.username}</div>
              <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width:${enemy1HpPct}%; height:100%; background:#ef4444;"></div>
              </div>
              <div style="font-size:0.68rem; color:#ef4444;">${enemy1ActiveCard.name.split(' ')[0]} | HP: ${enemy1ActiveCard.hp}</div>
            </div>
            <div style="width: 55px; height: 75px; border-radius:6px; border:2px solid #ef4444; overflow:hidden;">
              <img src="${enemy1ActiveCard.image}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </div>

          <!-- Enemigo 2 -->
          <div style="display:flex; align-items:center; gap:10px; opacity:${enemy2ActiveCard.hp <= 0 ? 0.3 : 1}; cursor:${isMyTurn && enemy2ActiveCard.hp > 0 ? 'pointer' : 'default'}" onclick="${isMyTurn && enemy2ActiveCard.hp > 0 ? `executeTeamAttack('${enemies[1]}')` : ''}">
            <div style="text-align:right; width: 140px;">
              <div style="font-weight:bold; font-size:0.88rem;">${enemy2.username}</div>
              <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width:${enemy2HpPct}%; height:100%; background:#ef4444;"></div>
              </div>
              <div style="font-size:0.68rem; color:#ef4444;">${enemy2ActiveCard.name.split(' ')[0]} | HP: ${enemy2ActiveCard.hp}</div>
            </div>
            <div style="width: 55px; height: 75px; border-radius:6px; border:2px solid #ef4444; overflow:hidden;">
              <img src="${enemy2ActiveCard.image}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </div>
        </div>

        <!-- Aliados (Abajo) -->
        <div style="display:flex; gap:40px; justify-content:center; align-items:center;">
          <!-- Tú -->
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width: 55px; height: 75px; border-radius:6px; border:2px solid #22c55e; overflow:hidden;">
              <img src="${myActiveCard.image}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="text-align:left; width: 140px;">
              <div style="font-weight:bold; font-size:0.88rem; color:#22c55e;">Tú</div>
              <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width:${myHpPct}%; height:100%; background:#22c55e;"></div>
              </div>
              <div style="font-size:0.68rem; color:#4ade80;">${myActiveCard.name.split(' ')[0]} | HP: ${myActiveCard.hp}</div>
            </div>
          </div>

          <!-- Tu Socio -->
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width: 55px; height: 75px; border-radius:6px; border:2px solid #60a5fa; overflow:hidden;">
              <img src="${partnerActiveCard.image}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="text-align:left; width: 140px;">
              <div style="font-weight:bold; font-size:0.88rem; color:#60a5fa;">${partner.username}</div>
              <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width:${partnerHpPct}%; height:100%; background:#60a5fa;"></div>
              </div>
              <div style="font-size:0.68rem; color:#60a5fa;">${partnerActiveCard.name.split(' ')[0]} | HP: ${partnerActiveCard.hp}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Consola e Historial -->
      <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:16px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:15px;">
        <div style="text-align:left; font-family:monospace; border-radius:10px; background:rgba(0,0,0,0.3); padding:8px 12px; height:80px; overflow-y:auto; font-size:0.75rem; border:1px solid rgba(255,255,255,0.04); display:flex; flex-direction:column; gap:4px;">
          ${recentLogs.map((log, index) => {
    let color = "#cbd5e1";
    if (log.includes("Súper Efectivo")) color = "#ffd700";
    return `<div style="color:${color}; opacity:${index === 0 ? 1 : 0.65}; font-weight:${index === 0 ? 'bold' : 'normal'};">> ${log}</div>`;
  }).join("")}
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; text-align:left; justify-content:center; color:#cbd5e1; font-size:0.82rem;">
          ${isMyTurn ? `
            <div style="font-weight:bold; color:#ffd700; margin-bottom:4px;">💀 HORA DE ATACAR:</div>
            <div>Selecciona una de las cartas activas enemigas de arriba para lanzar tu ataque principal con <strong>${myActiveCard.name}</strong>.</div>
          ` : `
            <div>Espera pacientemente tu turno comunitario. El flujo de turnos rota de forma equitativa.</div>
          `}
        </div>
      </div>

    </div>
  `;

  // Auto-switch
  if (myActiveCard.hp <= 0) {
    const nextIdx = me.deck.findIndex(c => c.hp > 0);
    if (nextIdx !== -1) {
      switchTeamActive(nextIdx);
    }
  }
}

window.executeTeamAttack = async function (targetUid) {
  const uid = localStorage.getItem('lqsa_user');
  const roomCode = window._teamRoomCode;
  if (!uid || !roomCode) return;

  const db = firebase.database();
  const roomRef = db.ref(`team_tcg/${roomCode}`);

  await roomRef.transaction(room => {
    if (!room || room.status !== "fighting" || room.turn !== uid) return room;

    const me = room.players[uid];
    const myActiveCard = me.deck[room.activeCards[uid]];

    const targetPlayer = room.players[targetUid];
    const targetCard = targetPlayer.deck[room.activeCards[targetUid]];

    // Ataque principal (índice 0)
    const attack = myActiveCard.attacks[0];

    const myPrimary = myActiveCard.combatType.includes(" + ") ? myActiveCard.combatType.split(" + ")[0] : myActiveCard.combatType;

    let mult = 1.0;
    if (ELEMENT_ADVANTAGES[myPrimary] && ELEMENT_ADVANTAGES[myPrimary][targetCard.combatType] !== undefined) {
      mult = ELEMENT_ADVANTAGES[myPrimary][targetCard.combatType];
    }
    const finalDmg = Math.round(attack.power * mult * (1 - (targetCard.def / 350)));

    targetCard.hp = Math.max(0, targetCard.hp - finalDmg);

    let log = `¡${me.username} con ${myActiveCard.name.split(' ')[0]} atacó a ${targetPlayer.username} (${targetCard.name.split(' ')[0]}) usó ${attack.name}! -${finalDmg} HP.`;
    if (mult > 1.0) log += " ¡Súper Efectivo! ⚡?";

    if (!room.logs) room.logs = [];
    room.logs.push(log);

    // Auto-switch si muere la carta atacada
    if (targetCard.hp <= 0) {
      room.logs.push(`💀 ¡El cromo de ${targetPlayer.username} ha sido derrotado!`);
      const nextIdx = targetPlayer.deck.findIndex(c => c.hp > 0);
      if (nextIdx !== -1) {
        room.activeCards[targetUid] = nextIdx;
      }
    }

    // Verificar condición de fin de partida (un equipo entero derrotado)
    const teamA = Object.keys(room.players).filter(id => room.players[id].team === "A");
    const teamB = Object.keys(room.players).filter(id => room.players[id].team === "B");

    const teamAAlive = teamA.some(id => room.players[id].deck.some(c => c.hp > 0));
    const teamBAlive = teamB.some(id => room.players[id].deck.some(c => c.hp > 0));

    if (!teamAAlive) {
      room.status = "finished";
      room.winner = "B";
      return room;
    }
    if (!teamBAlive) {
      room.status = "finished";
      room.winner = "A";
      return room;
    }

    // Rotar turno
    const currentIdx = room.turnCycle.indexOf(uid);
    let nextIdx = (currentIdx + 1) % room.turnCycle.length;

    // Si el siguiente jugador del ciclo ya no tiene cartas vivas, saltar
    let loopCount = 0;
    while (loopCount < 4) {
      const nextUid = room.turnCycle[nextIdx];
      const hasAlive = room.players[nextUid].deck.some(c => c.hp > 0);
      if (hasAlive) {
        room.turn = nextUid;
        break;
      }
      nextIdx = (nextIdx + 1) % room.turnCycle.length;
      loopCount++;
    }

    return room;
  });
};

window.switchTeamActive = async function (idx) {
  const uid = localStorage.getItem('lqsa_user');
  const roomCode = window._teamRoomCode;
  if (!uid || !roomCode) return;

  const db = firebase.database();
  await db.ref(`team_tcg/${roomCode}`).transaction(room => {
    if (!room || room.status !== "fighting" || room.turn !== uid) return room;

    const me = room.players[uid];
    const oldCard = me.deck[room.activeCards[uid]];
    const newCard = me.deck[idx];

    room.activeCards[uid] = idx;
    room.logs.push(`⚡ ${me.username} releva a ${oldCard.name.split(' ')[0]} y saca a ${newCard.name.split(' ')[0]}.`);

    const currentIdx = room.turnCycle.indexOf(uid);
    let nextIdx = (currentIdx + 1) % room.turnCycle.length;
    room.turn = room.turnCycle[nextIdx];

    return room;
  });
}

function renderTeamResultScreen(room) {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;

  const uid = localStorage.getItem('lqsa_user');
  const myTeam = room.players[uid].team;
  const won = room.winner === myTeam;
  const reward = 300;

  if (won) {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
    firebase.database().ref(`users/${uid}/coins`).transaction(coins => (coins || 0) + reward);
  }

  overlay.innerHTML = `
    <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid ${won ? '#4ade80' : '#ef4444'}; border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center;">
      <div style="font-size:4rem; margin-bottom:12px;">${won ? '🏆' : '💀'}</div>
      <h2 style="font-family:'Bebas Neue',sans-serif; color:${won ? '#4ade80' : '#ef4444'}; font-size:2.6rem; letter-spacing:1px; margin:0 0 10px 0;">
        ${won ? '¡VICTORIA EN EQUIPO!' : '¡DERROTA ABSOLUTA!'}
      </h2>
      <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0; line-height:1.4;">
        ${won ? '¡Tú y tu aliado habéis dominado la arena 2vs2 por completo!' : 'Las locas del coño rivales os han pasado por encima.'}
      </p>
      ${won ? `
        <div style="background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:12px; padding:15px; margin-bottom:20px;">
          <div style="font-size:0.85rem; color:#4ade80; font-weight:bold;">🪙 RECOMPENSA COOPERATIVA</div>
          <div style="font-size:1.8rem; font-family:'Bebas Neue',sans-serif; color:#ffd700; margin-top:4px;">+${reward} MONEDAS</div>
        </div>
      ` : ''}
      <button class="workshop-action-btn" style="background:${won ? '#22c55e' : '#ef4444'}; color:#fff; font-size:1.05rem; padding:10px 24px; border:none; border-radius:8px; cursor:pointer;" onclick="closeAllModals(); openCardDuelLobby();">
        Volver a la Arena
      </button>
    </div>
  `;

  if (teamRoomListener) {
    firebase.database().ref(`team_tcg/${room.code}`).off('value', teamRoomListener);
    teamRoomListener = null;
  }
  window._teamRoomCode = null;
}

// =================================?.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.?
//  SOBREESCRITURA DE MÉTODOS DE SALAS PVP EN TIEMPO REAL (DRAFT INCORPORADO)
// =================================?.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.🏠.?

window.createCardDuelRoom = async function () {
  const uid = localStorage.getItem('lqsa_user');
  if (!uid) return;

  if (userAlbumData.coins < 100) {
    if (window.showLqsaAlert) showLqsaAlert("Necesitas tener al menos 100 monedas para participar en un duelo (apuesta mínima de 100 monedas).", "APUESTA mínima REQUERIDA", "error");
    else alert("Necesitas al menos 100 monedas.");
    return;
  }

  const betInput = document.getElementById("card-duel-bet-input");
  let betAmount = betInput ? parseInt(betInput.value) : 100;
  if (isNaN(betAmount) || betAmount < 100) betAmount = 100;

  if (userAlbumData.coins < betAmount) {
    if (window.showLqsaAlert) showLqsaAlert(`No tienes suficientes monedas para realizar una apuesta de ${betAmount} monedas.`, "MONEDAS INSUFICIENTES", "error");
    else alert("No tienes suficientes monedas.");
    return;
  }

  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const db = firebase.database();

  let myProfile = { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    myProfile = currentUserProfile;
  } else {
    const snap = await db.ref(`users/${uid}`).once('value');
    if (snap.exists()) myProfile = snap.val();
  }

  const initialRoomState = {
    code: roomCode,
    creator: uid,
    status: "waiting",
    bet: betAmount,
    players: {
      [uid]: {
        uid: uid,
        username: myProfile.username,
        avatar: myProfile.avatar || "img/personajes/amador-rivas.webp",
        ready: false,
        draftDeck: []
      }
    },
    logs: ["¡Creada sala de duelos de cartas " + roomCode + " con apuesta de " + betAmount + " 🪙!"],
    ts: firebase.database.ServerValue.TIMESTAMP
  };

  await db.ref(`card_duels/${roomCode}`).set(initialRoomState);

  window._duelRoomCode = roomCode;
  window._roomCode = roomCode;
  window._isCardDuel = true;

  listenToCardDuelRoom(roomCode);
};

window.joinCardDuelRoom = async function (roomCode) {
  roomCode = roomCode.trim().toUpperCase();
  if (!roomCode) return;

  const uid = localStorage.getItem('lqsa_user');
  if (!uid) return;

  const db = firebase.database();
  const snap = await db.ref(`card_duels/${roomCode}`).once('value');
  if (!snap.exists()) {
    if (window.showLqsaAlert) showLqsaAlert("No existe ninguna sala de combate con este código.", "SALA INEXISTENTE", "error");
    else alert("Sala inexistente.");
    return;
  }

  const room = snap.val();
  const bet = room.bet || 0;
  if (userAlbumData.coins < bet) {
    if (window.showLqsaAlert) showLqsaAlert(`No tienes suficientes monedas para entrar a esta sala. Se requiere una apuesta de ${bet} monedas.`, "APUESTA INSUFICIENTE", "error");
    else alert(`Se requiere apuesta de ${bet} monedas.`);
    return;
  }

  if (room.status !== "waiting" && !room.players[uid]) {
    if (window.showLqsaAlert) showLqsaAlert("La sala de combate ya estú llena o ha comenzado.", "SALA LLENA", "error");
    else alert("Sala llena.");
    return;
  }

  let myProfile = { username: "Vecino", avatar: "img/personajes/amador-rivas.webp" };
  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    myProfile = currentUserProfile;
  } else {
    const userSnap = await db.ref(`users/${uid}`).once('value');
    if (userSnap.exists()) myProfile = userSnap.val();
  }

  // Unirse a la sala
  await db.ref(`card_duels/${roomCode}/players/${uid}`).set({
    uid: uid,
    username: myProfile.username,
    avatar: myProfile.avatar || "img/personajes/amador-rivas.webp",
    ready: false,
    draftDeck: []
  });

  await db.ref(`card_duels/${roomCode}/status`).set("choosing_decks");
  await db.ref(`card_duels/${roomCode}/logs`).push("¡" + myProfile.username + " se ha unido al combate! Prepárense.");

  window._duelRoomCode = roomCode;
  window._roomCode = roomCode;
  window._isCardDuel = true;

  listenToCardDuelRoom(roomCode);
};

window.toggleOnlineDraftCard = async function (roomCode, cardId) {
  const uid = localStorage.getItem('lqsa_user');
  const roomRef = firebase.database().ref(`card_duels/${roomCode}`);
  const snap = await roomRef.child(`players/${uid}/draftDeck`).once('value');
  let currentDraft = snap.val() || [];

  const idx = currentDraft.indexOf(cardId);
  if (idx !== -1) {
    currentDraft.splice(idx, 1);
  } else {
    if (currentDraft.length >= 5) {
      if (window.showLqsaAlert) showLqsaAlert("¡Mazo lleno! El mazo admite un máximo de 5 cartas.", "L¡MITE ALCANZADO", "warning");
      else alert("Mazo lleno.");
      return;
    }
    currentDraft.push(cardId);
  }
  await roomRef.child(`players/${uid}/draftDeck`).set(currentDraft);
};

window.submitCardDuelLiveDraft = async function (roomCode) {
  const uid = localStorage.getItem('lqsa_user');
  const db = firebase.database();
  const roomRef = db.ref(`card_duels/${roomCode}`);
  const snap = await roomRef.once('value');
  const room = snap.val();

  const myDraftDeck = room.players[uid] ? (room.players[uid].draftDeck || []) : [];
  if (myDraftDeck.length !== 5) {
    alert("Debes seleccionar exactamente 5 cartas.");
    return;
  }

  // Mapear y escalar mazo de combate TCG (soporta claves compuestas)
  const mappedDeck = myDraftDeck.map(cardId => {
    const baseId = cardId.split("_")[0];
    const isFoil = cardId.includes("_foil");
    const signed = cardId.includes("_signed");
    let level = 1;
    const lvlMatch = cardId.match(/_lvl(\d+)/);
    if (lvlMatch) level = parseInt(lvlMatch[1]);

    const card = ALBUM_CARDS.find(c => c.id === baseId) || ALBUM_CARDS[0];
    const userCard = userAlbumData.cards[cardId] || { level: level, signed: signed };

    const lvl = userCard.level || level || 1;
    const sig = !!userCard.signed || signed;
    const levelMultiplier = 1 + (lvl - 1) * 0.15;
    const signedMultiplier = sig ? 1.3 : 1.0;

    const maxHp = Math.round((card.hp || 100) * levelMultiplier * signedMultiplier);
    const atk = Math.round((card.atk || 40) * levelMultiplier * signedMultiplier);
    const def = Math.round((card.def || 30) * levelMultiplier * signedMultiplier);

    const scaledAttacks = (card.attacks || []).map(atkObj => ({
      name: atkObj.name,
      desc: atkObj.desc,
      power: Math.round(atkObj.power * levelMultiplier * signedMultiplier)
    }));

    return {
      id: cardId,
      name: card.name + (isFoil ? " 🏠" : "") + (sig ? " 🏠" : "") + (lvl > 1 ? ` (?${lvl})` : ""),
      image: card.image,
      maxHp: maxHp,
      hp: maxHp,
      atk: atk,
      def: def,
      level: lvl,
      signed: sig,
      combatType: card.combatType || "Inquilino",
      attacks: scaledAttacks
    };
  });

  await roomRef.child(`players/${uid}/deck`).set(mappedDeck);
  await roomRef.child(`players/${uid}/ready`).set(true);

  // Verificar si ambos están listos
  const updatedSnap = await roomRef.once('value');
  const updatedRoom = updatedSnap.val();
  const pUids = Object.keys(updatedRoom.players);
  if (pUids.length === 2) {
    const p1 = pUids[0];
    const p2 = pUids[1];

    if (updatedRoom.players[p1].ready && updatedRoom.players[p2].ready) {
      // Iniciar combate
      const battleState = {
        status: "fighting",
        turn: updatedRoom.creator,
        activeCards: {
          [p1]: 0,
          [p2]: 0
        },
        logs: ["¡El combate en directo ha comenzado! Turno de " + updatedRoom.players[updatedRoom.creator].username]
      };
      await roomRef.update(battleState);
    }
  }
};
