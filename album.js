/* ════════════════════════════════════════════════════════
   LQSACatena — Motor de Álbum, Sobres y Misiones
   ════════════════════════════════════════════════════════ */

let userAlbumData = { coins: 0, cards: {}, missions: {} };

// Remoción dinámica y automática de fondos blancos o negros para las imágenes de los sobres
function makeImageTransparent(imgElement) {
    if (!imgElement) return;
    if (!imgElement.complete) {
        imgElement.addEventListener('load', () => makeImageTransparent(imgElement), { once: true });
        return;
    }
    
    try {
        const canvas = document.createElement("canvas");
        const w = imgElement.naturalWidth;
        const h = imgElement.naturalHeight;
        if (w === 0 || h === 0) return;
        
        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgElement, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        // Muestrear el color de fondo en la esquina superior izquierda (px 2, 2)
        const idx = (2 * w + 2) * 4;
        const cr = data[idx];
        const cg = data[idx+1];
        const cb = data[idx+2];
        const ca = data[idx+3];
        
        // Si ya es transparente, no es necesario procesar
        if (ca < 50) return;
        
        const avgCorner = (cr + cg + cb) / 3;
        
        // Si el fondo muestreado es claro (blanco/gris claro)
        if (avgCorner > 200) {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // Si es un píxel muy claro, lo hacemos transparente
                if (r > 215 && g > 215 && b > 215) {
                    data[i+3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            imgElement.src = canvas.toDataURL("image/png");
        } 
        // Si el fondo muestreado es muy oscuro (negro/gris muy oscuro)
        else if (avgCorner < 40) {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // Si es un píxel muy oscuro, lo hacemos transparente
                if (r < 35 && g < 35 && b < 35) {
                    data[i+3] = 0;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            imgElement.src = canvas.toDataURL("image/png");
        }
    } catch (e) {
        console.warn("No se pudo remover el fondo dinámicamente debido a CORS/Canvas local:", e);
    }
}

// Inicializador del sistema del álbum
function initAlbumSystem(uid) {
    if (!uid || typeof firebase === 'undefined') return;
    const db = firebase.database();

    db.ref(`users/${uid}`).on('value', snap => {
        if (!snap.exists()) return;
        const profile = snap.val();
        userAlbumData.coins = profile.coins || 0;
        userAlbumData.cards = (profile.album && profile.album.cards) || {};

        // Actualizar widgets de monedas en la UI si existen
        const coinDisplay = document.getElementById("global-coin-count");
        if (coinDisplay) coinDisplay.textContent = userAlbumData.coins;
    });

    // Verificar e inicializar misiones diarias del usuario
    checkAndGenerateMissions(uid);
}

// ══════════════════════════════════════
//  APERTURA DE SOBRES (Gacha Engine)
// ══════════════════════════════════════

const PACK_TYPES = {
    basic: { id: "basic", name: "🟤 Sobre Básico", cost: 50, size: 3, guarantee: "rare" },
    premium: { id: "premium", name: "🟡 Sobre Premium", cost: 120, size: 5, guarantee: "epic" },
    legendary: { id: "legendary", name: "🔴 Sobre Legendario", cost: 300, size: 7, guarantee: "legendary" }
};

async function buyPack(packId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) {
        if (window.showLqsaAlert) showLqsaAlert("Inicia sesión para comprar sobres.", "SOBRES VECINALES", "error");
        else alert("Inicia sesión para comprar sobres.");
        return;
    }

    const pack = PACK_TYPES[packId];
    if (userAlbumData.coins < pack.cost) {
        if (window.showLqsaAlert) showLqsaAlert("¡No tienes suficientes monedas! Gana partidas o completa misiones de vecinos. 🦞", "MONEDAS INSUFICIENTES", "error");
        else alert("¡No tienes suficientes monedas! Gana partidas o completa misiones. 🦞");
        return;
    }

    const db = firebase.database();
    const userRef = db.ref(`users/${uid}`);

    try {
        // Transacción segura para restar monedas
        await userRef.child('coins').transaction(currentCoins => (currentCoins || 0) - pack.cost);

        // Generación de cartas obtenidas
        let pulledCards = [];
        for (let i = 0; i < pack.size; i++) {
            let card = rollRandomCard(i === 0 ? pack.guarantee : null);
            pulledCards.push(card);
        }

        // Guardar cartas en el perfil del usuario
        for (let pulled of pulledCards) {
            let cardKey = pulled.id;
            let isFoil = pulled.isFoil;
            let userCardRef = userRef.child(`album/cards/${cardKey}`);

            await userCardRef.transaction(current => {
                if (!current) {
                    return { count: 1, foil: isFoil, obtainedAt: firebase.database.ServerValue.TIMESTAMP };
                } else {
                    return {
                        count: (current.count || 0) + 1,
                        foil: current.foil || isFoil,
                        obtainedAt: current.obtainedAt || firebase.database.ServerValue.TIMESTAMP
                    };
                }
            });
        }

        // Registrar en misiones si aplica
        await progressMission(uid, "open_pack", 1);

        // Renderizar animación de apertura en pantalla
        displayPackOpeningAnimation(pulledCards, packId);

    } catch (error) {
        console.error("Error al procesar la compra del sobre:", error);
    }
}

function rollRandomCard(guaranteeRarityId = null) {
    let rand = Math.random();
    let selectedRarity = CARD_RARITIES.COMMON;

    // Si hay garantía forzada por el tipo de sobre
    if (guaranteeRarityId) {
        if (guaranteeRarityId === "rare") selectedRarity = CARD_RARITIES.RARE;
        if (guaranteeRarityId === "epic") selectedRarity = CARD_RARITIES.EPIC;
        if (guaranteeRarityId === "legendary") selectedRarity = CARD_RARITIES.LEGENDARY;
    } else {
        // Distribución de probabilidad acumulada
        if (rand < 0.005) return { ...ALBUM_CARDS[Math.floor(Math.random() * ALBUM_CARDS.length)], isFoil: true, rarity: CARD_RARITIES.FOIL };
        if (rand < 0.03) selectedRarity = CARD_RARITIES.LEGENDARY;
        else if (rand < 0.15) selectedRarity = CARD_RARITIES.EPIC;
        else if (rand < 0.40) selectedRarity = CARD_RARITIES.RARE;
    }

    let pool = ALBUM_CARDS.filter(c => c.baseRarity.id === selectedRarity.id);
    if (pool.length === 0) pool = ALBUM_CARDS; // Fallback de seguridad

    let baseCard = pool[Math.floor(Math.random() * pool.length)];
    return { ...baseCard, isFoil: false, rarity: selectedRarity };
}

// ══════════════════════════════════════
//  SISTEMA DE FUSIONES (Evolución)
// ══════════════════════════════════════

async function fuseCards(cardId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const currentCount = (userAlbumData.cards[cardId] && userAlbumData.cards[cardId].count) || 0;
    if (currentCount < 3) {
        if (window.showLqsaAlert) showLqsaAlert("Necesitas al menos 3 copias idénticas de la carta para realizar una fusión.", "FUSIÓN IMPOSIBLE", "error");
        else alert("Necesitas al menos 3 copias idénticas de la carta para realizar una fusión.");
        return;
    }

    const db = firebase.database();
    const cardRef = db.ref(`users/${uid}/album/cards/${cardId}`);

    await cardRef.transaction(current => {
        if (current && current.count >= 3) {
            return {
                count: current.count - 2, // Consumimos 3 y devolvemos 1 evolucionada
                foil: true, // Se transforma en versión holográfica/Foil permanentemente
                obtainedAt: firebase.database.ServerValue.TIMESTAMP
            };
        }
        return current;
    });

    if (window.showLqsaAlert) showLqsaAlert("Tu cromo ha evolucionado permanentemente a su versión Holográfica/Foil con destellos arcoíris 🌈", "¡EVOLUCIÓN COMPLETA! 🎉", "success");
    else alert("¡Fusión completada con éxito! Tu carta ha evolucionado a su versión Holográfica 🌈");
    
    openAlbumUI();
}

// ══════════════════════════════════════
//  MOTOR DE MISIONES DIARIAS Y SEMANALES
// ══════════════════════════════════════

const MISSION_POOL = [
    { id: "play_game", desc: "Juega 1 partida hoy en cualquier modo", target: 1, reward: 20 },
    { id: "win_machine", desc: "Gana una partida contra la máquina", target: 1, reward: 30 },
    { id: "ask_questions", desc: "Haz 5 o más preguntas en una partida", target: 5, reward: 25 },
    { id: "open_pack", desc: "Abre cualquier sobre de la tienda", target: 1, reward: 15 }
];

async function checkAndGenerateMissions(uid) {
    const db = firebase.database();
    const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const missionRef = db.ref(`users/${uid}/daily_missions/${todayKey}`);

    const snap = await missionRef.once('value');
    if (!snap.exists()) {
        // Mezclar y elegir 2 misiones aleatorias para el día
        let shuffled = MISSION_POOL.sort(() => 0.5 - Math.random());
        let dailyMissions = {
            mission1: { ...shuffled[0], progress: 0, claimed: false },
            mission2: { ...shuffled[1], progress: 0, claimed: false }
        };
        await missionRef.set(dailyMissions);
        userAlbumData.missions = dailyMissions;
    } else {
        userAlbumData.missions = snap.val();
    }
}

async function progressMission(uid, actionId, amount) {
    const db = firebase.database();
    const todayKey = new Date().toISOString().split('T')[0];
    const missionRef = db.ref(`users/${uid}/daily_missions/${todayKey}`);

    const snap = await missionRef.once('value');
    if (!snap.exists()) return;

    let daily = snap.val();
    for (let key of Object.keys(daily)) {
        if (daily[key].id === actionId && !daily[key].claimed) {
            daily[key].progress = Math.min(daily[key].target, (daily[key].progress || 0) + amount);
        }
    }
    await missionRef.set(daily);
}

async function claimMissionReward(missionKey) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const todayKey = new Date().toISOString().split('T')[0];
    const db = firebase.database();
    const mRef = db.ref(`users/${uid}/daily_missions/${todayKey}/${missionKey}`);

    const snap = await mRef.once('value');
    if (!snap.exists()) return;
    const mission = snap.val();

    if (mission.progress >= mission.target && !mission.claimed) {
        await mRef.child('claimed').set(true);
        await db.ref(`users/${uid}/coins`).transaction(c => (c || 0) + mission.reward);
        alert(`¡Recompensas cobradas! +${mission.reward} Monedas agregadas.`);
        openMissionsUI();
    }
}

// State for the Premium 3D Album System
let currentAlbumPage = 0; // Index representing current left page (even) or active page on mobile
let filteredCards = [...ALBUM_CARDS];
let activeSetFilter = "all";
let activeRarityFilter = "all";
let activeStatusFilter = "all";
let activeSearchQuery = "";
let isFlipping = false;

// Native Web Audio Synthesizer for paper-turning swoosh
function playPageTurnSound() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        // Noise buffer generation
        const bufferSize = ctx.sampleRate * 0.45; // 0.45 seconds duration
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fill buffer with pink/white noise-like values
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        
        // Bandpass sweeps to sound like shuffling heavy paper
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2.5;
        
        // Sweep frequency down during the turn to simulate deceleration
        filter.frequency.setValueAtTime(900, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.38);
        
        // Gain envelope for smooth fade in/out
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.005, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
        
        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        noiseNode.start();
        noiseNode.stop(ctx.currentTime + 0.45);
    } catch (e) {
        console.warn("AudioContext failed to trigger:", e);
    }
}

function isMobileView() {
    return window.innerWidth <= 768;
}

function hasNextPage() {
    const step = isMobileView() ? 1 : 2;
    return (currentAlbumPage + step) * 6 < filteredCards.length;
}

function hasPrevPage() {
    return currentAlbumPage > 0;
}

function onAlbumSearch(val) {
    activeSearchQuery = val;
    applyFilters();
}

function onAlbumSetChange(val) {
    activeSetFilter = val;
    applyFilters();
}

function onAlbumRarityFilter(val) {
    activeRarityFilter = val;
    applyFilters();
    
    document.querySelectorAll(".rarity-filter-btn").forEach(btn => {
        if (btn.getAttribute("data-rarity") === val) btn.classList.add("active");
        else btn.classList.remove("active");
    });
}

function onAlbumStatusFilter(val) {
    activeStatusFilter = val;
    applyFilters();
    
    document.querySelectorAll(".status-filter-btn").forEach(btn => {
        if (btn.getAttribute("data-status") === val) btn.classList.add("active");
        else btn.classList.remove("active");
    });
}

function applyFilters() {
    filteredCards = ALBUM_CARDS.filter(card => {
        // Search filter
        if (activeSearchQuery) {
            const query = activeSearchQuery.toLowerCase();
            const matchesName = card.name.toLowerCase().includes(query);
            const matchesOccupation = card.occupation.toLowerCase().includes(query);
            const matchesNumber = card.number.includes(query);
            if (!matchesName && !matchesOccupation && !matchesNumber) return false;
        }
        
        // Set family filter
        if (activeSetFilter !== "all") {
            const familyMembers = CARD_FAMILIES[activeSetFilter];
            if (!familyMembers || !familyMembers.includes(card.name)) return false;
        }
        
        // Rarity filter
        if (activeRarityFilter !== "all") {
            if (card.baseRarity.id !== activeRarityFilter) return false;
        }
        
        // Status filter
        if (activeStatusFilter !== "all") {
            const owned = !!userAlbumData.cards[card.id];
            if (activeStatusFilter === "owned" && !owned) return false;
            if (activeStatusFilter === "locked" && owned) return false;
        }
        
        return true;
    });
    
    currentAlbumPage = 0;
    renderAlbumPages();
}

function renderPocketHtml(cardIndex) {
    if (cardIndex >= filteredCards.length) {
        // Empty sleeve slots at the end of the album
        return `
            <div class="album-pocket pocket-empty-sleeve">
                <div class="pocket-glare"></div>
            </div>
        `;
    }
    
    const card = filteredCards[cardIndex];
    const userCard = userAlbumData.cards[card.id];
    const owned = !!userCard;
    const count = owned ? userCard.count : 0;
    const isFoil = owned ? userCard.foil : false;
    const borderCol = isFoil ? CARD_RARITIES.FOIL.color : card.baseRarity.color;

    if (!owned) {
        // Pocket Empty (Locked card)
        return `
            <div class="album-pocket pocket-empty" data-id="${card.id}">
                <div class="pocket-glare"></div>
                <div class="locked-card-body">
                    <div class="locked-silhouette">?</div>
                    <div class="locked-number">#${card.number}</div>
                    <div class="locked-name">¿¿??</div>
                    <div class="locked-desc">Cromo Bloqueado</div>
                </div>
            </div>
        `;
    }

    // Pocket Filled (Owned card)
    let rarityName = card.baseRarity.name;
    if (isFoil) rarityName = "🌈 FOIL";

    return `
        <div class="album-pocket pocket-filled ${isFoil ? 'card-foil' : ''}" data-id="${card.id}" style="--rarity-color: ${borderCol};">
            <div class="pocket-glare"></div>
            <div class="tcg-card" style="border: 2px solid ${borderCol};">
                <div class="card-rarity-badge" style="background: ${isFoil ? 'linear-gradient(45deg, #f43f5e, #3b82f6, #10b981)' : card.baseRarity.color}; color: ${isFoil ? '#fff' : '#000'};">${rarityName}</div>
                <img class="card-img" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'">
                <div class="card-info-box">
                    <div class="card-name">${card.name}</div>
                    <div class="card-job">💼 ${card.occupation}</div>
                    <div class="card-meta">${card.season} • ${card.type}</div>
                    <div class="card-quote">"${card.quote}"</div>
                    <div class="card-id-num">#${card.number}/150</div>
                    ${count > 1 ? `<div class="card-counter">×${count}</div>` : ''}
                    ${count >= 3 ? `<button class="fuse-btn" onclick="event.stopPropagation(); fuseCards('${card.id}')">🧬 Fusionar (3)</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function onPrevArrowClick() {
    if (isFlipping) return;
    if (!hasPrevPage()) return;
    
    if (isMobileView()) {
        currentAlbumPage -= 1;
        renderAlbumPages();
        playPageTurnSound();
    } else {
        turnPage('prev');
    }
}

function onNextArrowClick() {
    if (isFlipping) return;
    if (!hasNextPage()) return;
    
    if (isMobileView()) {
        currentAlbumPage += 1;
        renderAlbumPages();
        playPageTurnSound();
    } else {
        turnPage('next');
    }
}

function turnPage(direction) {
    if (isFlipping) return;
    
    const step = isMobileView() ? 1 : 2;
    if (direction === 'next') {
        if ((currentAlbumPage + step) * 6 >= filteredCards.length) return;
    } else {
        if (currentAlbumPage - step < 0) return;
    }
    
    isFlipping = true;
    playPageTurnSound();
    
    const binder = document.getElementById("album-binder");
    if (!binder) {
        currentAlbumPage += (direction === 'next' ? step : -step);
        renderAlbumPages();
        isFlipping = false;
        return;
    }
    
    // Build temporary flipping sheet
    const flippingSheet = document.createElement("div");
    flippingSheet.className = `binder-page-flipping ${direction === 'next' ? 'flip-next' : 'flip-prev'}`;
    
    const frontFace = document.createElement("div");
    frontFace.className = "flipping-face flipping-face-front";
    
    const backFace = document.createElement("div");
    backFace.className = "flipping-face flipping-face-back";
    
    let frontHtml = "";
    let backHtml = "";
    
    if (direction === 'next') {
        // Front shows current right page (being turned away)
        for (let i = 0; i < 6; i++) {
            frontHtml += renderPocketHtml((currentAlbumPage + 1) * 6 + i);
        }
        // Back shows new left page (turning over)
        for (let i = 0; i < 6; i++) {
            backHtml += renderPocketHtml((currentAlbumPage + 2) * 6 + i);
        }
    } else {
        // Front shows current left page (being turned back)
        for (let i = 0; i < 6; i++) {
            frontHtml += renderPocketHtml(currentAlbumPage * 6 + i);
        }
        // Back shows new right page (turning back)
        for (let i = 0; i < 6; i++) {
            backHtml += renderPocketHtml((currentAlbumPage - 1) * 6 + i);
        }
    }
    
    frontFace.innerHTML = `
        <div class="page-paper page-left-paper">
            <div class="page-holes">
                <div class="page-hole hole-1"></div>
                <div class="page-hole hole-2"></div>
                <div class="page-hole hole-3"></div>
                <div class="page-hole hole-4"></div>
            </div>
            <div class="pockets-grid">${frontHtml}</div>
        </div>
    `;
    
    backFace.innerHTML = `
        <div class="page-paper page-right-paper">
            <div class="page-holes">
                <div class="page-hole hole-1"></div>
                <div class="page-hole hole-2"></div>
                <div class="page-hole hole-3"></div>
                <div class="page-hole hole-4"></div>
            </div>
            <div class="pockets-grid">${backHtml}</div>
        </div>
    `;
    
    flippingSheet.appendChild(frontFace);
    flippingSheet.appendChild(backFace);
    binder.appendChild(flippingSheet);
    
    const shadowOverlay = document.createElement("div");
    shadowOverlay.className = "flipping-shadow";
    flippingSheet.appendChild(shadowOverlay);
    
    requestAnimationFrame(() => {
        flippingSheet.classList.add("flipping-active");
        
        if (direction === 'next') {
            document.getElementById("album-page-right").style.visibility = "hidden";
        } else {
            document.getElementById("album-page-left").style.visibility = "hidden";
        }
    });
    
    setTimeout(() => {
        currentAlbumPage += (direction === 'next' ? 2 : -2);
        renderAlbumPages();
        flippingSheet.remove();
        isFlipping = false;
    }, 600);
}

function renderAlbumPages() {
    const leftContainer = document.getElementById("album-page-left");
    const rightContainer = document.getElementById("album-page-right");
    const counterContainer = document.getElementById("album-page-counter");
    
    if (!leftContainer || !rightContainer) return;
    
    leftContainer.style.visibility = "visible";
    rightContainer.style.visibility = "visible";
    
    let leftHtml = "";
    let rightHtml = "";
    
    if (isMobileView()) {
        // In mobile view, left container is hidden in CSS, right container displays current page
        for (let i = 0; i < 6; i++) {
            rightHtml += renderPocketHtml(currentAlbumPage * 6 + i);
        }
    } else {
        // Desktop displays left and right simultaneously
        for (let i = 0; i < 6; i++) {
            leftHtml += renderPocketHtml(currentAlbumPage * 6 + i);
        }
        for (let i = 0; i < 6; i++) {
            rightHtml += renderPocketHtml((currentAlbumPage + 1) * 6 + i);
        }
    }
    
    leftContainer.innerHTML = `
        <div class="page-paper page-left-paper">
            <div class="page-holes">
                <div class="page-hole hole-1"></div>
                <div class="page-hole hole-2"></div>
                <div class="page-hole hole-3"></div>
                <div class="page-hole hole-4"></div>
            </div>
            <div class="pockets-grid">${leftHtml}</div>
        </div>
    `;
    
    rightContainer.innerHTML = `
        <div class="page-paper page-right-paper">
            <div class="page-holes">
                <div class="page-hole hole-1"></div>
                <div class="page-hole hole-2"></div>
                <div class="page-hole hole-3"></div>
                <div class="page-hole hole-4"></div>
            </div>
            <div class="pockets-grid">${rightHtml}</div>
        </div>
    `;
    
    // Update pagination count
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / 6));
    
    if (counterContainer) {
        if (filteredCards.length === 0) {
            counterContainer.textContent = "Sin cromos";
        } else if (isMobileView()) {
            counterContainer.textContent = `Página ${currentAlbumPage + 1} / ${totalPages}`;
        } else {
            const leftPageNum = currentAlbumPage + 1;
            const rightPageNum = Math.min(totalPages, currentAlbumPage + 2);
            if (leftPageNum === rightPageNum) {
                counterContainer.textContent = `Página ${leftPageNum} / ${totalPages}`;
            } else {
                counterContainer.textContent = `Páginas ${leftPageNum}-${rightPageNum} / ${totalPages}`;
            }
        }
    }
    
    // Enable/disable arrows
    const prevBtn = document.getElementById("album-prev-arrow");
    const nextBtn = document.getElementById("album-next-arrow");
    const prevBtnMob = document.getElementById("album-prev-arrow-mobile");
    const nextBtnMob = document.getElementById("album-next-arrow-mobile");
    
    const prevDisabled = !hasPrevPage();
    const nextDisabled = !hasNextPage();
    
    if (prevBtn) {
        if (prevDisabled) prevBtn.classList.add("disabled");
        else prevBtn.classList.remove("disabled");
    }
    if (nextBtn) {
        if (nextDisabled) nextBtn.classList.add("disabled");
        else nextBtn.classList.remove("disabled");
    }
    if (prevBtnMob) {
        if (prevDisabled) prevBtnMob.classList.add("disabled");
        else prevBtnMob.classList.remove("disabled");
    }
    if (nextBtnMob) {
        if (nextDisabled) nextBtnMob.classList.add("disabled");
        else nextBtnMob.classList.remove("disabled");
    }
}

// Window resize safety adjustment
window.addEventListener("resize", () => {
    const overlay = document.getElementById("auth-modal");
    if (overlay && overlay.querySelector(".album-binder")) {
        if (!isMobileView() && currentAlbumPage % 2 !== 0) {
            currentAlbumPage = Math.max(0, currentAlbumPage - 1);
        }
        renderAlbumPages();
    }
});

function openAlbumUI() {
    closeAllModals();
    
    // Reset filters
    activeSearchQuery = "";
    activeSetFilter = "all";
    activeRarityFilter = "all";
    activeStatusFilter = "all";
    currentAlbumPage = 0;
    
    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay album-overlay-theme";

    overlay.innerHTML = `
    <div class="auth-box album-box" style="width:min(1150px, 98vw); max-height:92vh; overflow-y:auto; padding: 25px; display:flex; flex-direction:column; gap:16px;">
      <button class="auth-x" onclick="closeAllModals()">✕</button>
      
      <!-- Premium dashboard top-bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:15px; width:100%;">
        <div style="text-align:left;">
          <h2 class="auth-h2" style="color:#ffd700; margin:0; text-shadow:0 0 10px rgba(240,192,32,0.25); font-family:'Bebas Neue',sans-serif; font-size:2.2rem; letter-spacing:1px;">🎴 ÁLBUM DE LA COMUNIDAD</h2>
          <p class="auth-p" style="margin:2px 0 0 0; color:#94a3b8; font-size:0.9rem;">Colecciona los cromos exclusivos y fusiona repetidos en la Catena Vecinal.</p>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:inline-flex; align-items:center; background:rgba(240,192,32,0.1); border:1px solid rgba(240,192,32,0.3); padding:6px 12px; border-radius:20px; font-family:'Barlow Condensed',sans-serif; font-weight:bold; color:#fff; gap:6px;">
            🪙 <span style="color:#ffd700; font-size:1.15rem;">${userAlbumData.coins}</span> Monedas
          </div>
          <button class="auth-btn" onclick="openShopUI()" style="background:linear-gradient(135deg, #16a34a, #15803d); margin:0; font-weight:bold; letter-spacing:0.5px;">🛒 Tienda</button>
          <button class="auth-btn" onclick="openMissionsUI()" style="background:linear-gradient(135deg, #2563eb, #1d4ed8); margin:0; font-weight:bold; letter-spacing:0.5px;">📅 Misiones</button>
        </div>
      </div>
      
      <div class="album-dashboard">
        <!-- Advanced search filter bar -->
        <div class="album-filter-bar">
          <div class="filter-left">
            <input type="text" id="album-search" class="album-search-input" placeholder="Buscar cromo o #..." oninput="onAlbumSearch(this.value)">
            <select id="album-set-filter" class="album-select-set" onchange="onAlbumSetChange(this.value)">
              <option value="all">📁 Todos los Sets</option>
              <option value="Recio">🦞 Set Recio</option>
              <option value="Cuquis">🦁 Set Cuquis</option>
              <option value="Maroto-Trujillo"> Reynolds / Trujillo</option>
              <option value="Pastor"> Pastor / Madariaga</option>
            </select>
            <div class="status-filters">
              <button class="status-filter-btn active" data-status="all" onclick="onAlbumStatusFilter('all')">Todos</button>
              <button class="status-filter-btn" data-status="owned" onclick="onAlbumStatusFilter('owned')">Obtenidos</button>
              <button class="status-filter-btn" data-status="locked" onclick="onAlbumStatusFilter('locked')">Bloqueados</button>
            </div>
          </div>
          
          <div class="filter-right">
            <div class="rarity-filters">
              <button class="rarity-filter-btn active" data-rarity="all" style="--r-color:#ffffff" onclick="onAlbumRarityFilter('all')">Todas</button>
              <button class="rarity-filter-btn" data-rarity="common" style="--r-color:#9ca3af" onclick="onAlbumRarityFilter('common')">Común</button>
              <button class="rarity-filter-btn" data-rarity="rare" style="--r-color:#3b82f6" onclick="onAlbumRarityFilter('rare')">Rara</button>
              <button class="rarity-filter-btn" data-rarity="epic" style="--r-color:#a855f7" onclick="onAlbumRarityFilter('epic')">Épica</button>
              <button class="rarity-filter-btn" data-rarity="legendary" style="--r-color:#eab308" onclick="onAlbumRarityFilter('legendary')">Legendaria</button>
              <button class="rarity-filter-btn" data-rarity="foil" style="--r-color:#f43f5e" onclick="onAlbumRarityFilter('foil')">Foil</button>
            </div>
          </div>
        </div>

        <!-- 3D binder element -->
        <div class="album-binder-container">
          <!-- Left outer arrow -->
          <button class="album-nav-arrow" id="album-prev-arrow" onclick="onPrevArrowClick()">◀</button>
          
          <div class="album-binder" id="album-binder">
            <!-- binder corners -->
            <div class="binder-corner corner-tl"></div>
            <div class="binder-corner corner-tr"></div>
            <div class="binder-corner corner-bl"></div>
            <div class="binder-corner corner-br"></div>
            
            <!-- Spline in the middle -->
            <div class="binder-spine">
              <div class="binder-ring ring-1"></div>
              <div class="binder-ring ring-2"></div>
              <div class="binder-ring ring-3"></div>
              <div class="binder-ring ring-4"></div>
            </div>
            
            <!-- Left and Right static sheets -->
            <div class="binder-page binder-page-left" id="album-page-left"></div>
            <div class="binder-page binder-page-right" id="album-page-right"></div>
          </div>
          
          <!-- Right outer arrow -->
          <button class="album-nav-arrow" id="album-next-arrow" onclick="onNextArrowClick()">▶</button>
        </div>
        
        <!-- Mobile nav row beneath binder cover -->
        <div class="album-nav-row-mobile" id="album-mobile-nav-bar">
          <button class="album-nav-arrow" id="album-prev-arrow-mobile" onclick="onPrevArrowClick()">◀</button>
          <span id="album-page-counter" style="display:flex; align-items:center; justify-content:center; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1.15rem; letter-spacing:0.5px;">Cargando...</span>
          <button class="album-nav-arrow" id="album-next-arrow-mobile" onclick="onNextArrowClick()">▶</button>
        </div>
        
        <!-- Bottom metadata bar -->
        <div class="album-bottom-bar" id="album-desktop-bottom-bar">
          <span style="font-size:0.75rem; color:#64748b; font-style:italic;">Consejo: Consigue 3 copias de una carta para fusionarla permanentemente a versión holográfica 🌈</span>
          <!-- Desk spline counts -->
          <span id="album-page-counter">Cargando...</span>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
    
    injectAlbumStyles();
    
    // Trigger initial filter application (renders pages 1 & 2)
    applyFilters();
}

function openShopUI() {
    closeAllModals();
    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay album-overlay-theme";

    overlay.innerHTML = `
    <div class="auth-box album-box" style="width:min(960px, 96vw); max-height:85vh; overflow-y:auto; padding: 30px;">
      <button class="auth-x" onclick="openAlbumUI()">✕</button>
      <h2 class="auth-h2" style="color:var(--accent); font-size: 2.2rem; text-shadow: 0 0 15px rgba(240, 192, 32, 0.2); margin-top: 10px;">🛒 TIENDA DE SOBRES</h2>
      <p class="auth-p" style="font-size: 1.1rem; margin-bottom: 25px;">
        Tus Monedas actuales: <span id="shop-coin-count" style="color:#ffd700; font-weight:bold; font-size: 1.3rem;">${userAlbumData.coins}</span> 🪙
      </p>
      
      <div style="display:flex; gap:24px; justify-content:center; flex-wrap:wrap; width:100%; margin-top: 10px;">
        <!-- Sobre Básico -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; width: 270px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; transition: transform 0.2s;" onmouseenter="this.style.transform='translateY(-6px)'" onmouseleave="this.style.transform='translateY(0)'">
          <img src="img-cartas/sobre-basico.webp" alt="Sobre Básico" onload="makeImageTransparent(this)" style="width: 160px; height: 240px; object-fit: contain; margin-bottom: 15px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
          <div>
            <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; margin: 0; color: #fff; letter-spacing: 1px;">SOBRE BÁSICO</h3>
            <p style="font-size: 0.78rem; color: #a0a0a0; margin: 8px 0 15px; line-height: 1.4;">Contiene 3 cartas coleccionables.<br>Garantía: Mínimo 1 Rara.</p>
          </div>
          <button class="auth-btn" onclick="buyPack('basic')" style="width: 100%; justify-content: center; margin: 0; background: linear-gradient(135deg, #cd7f32, #a05a2c); color: #fff; font-weight: bold; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(205,127,50,0.25);">💰 50 MONEDAS</button>
        </div>

        <!-- Sobre Premium -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; width: 270px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; transition: transform 0.2s;" onmouseenter="this.style.transform='translateY(-6px)'" onmouseleave="this.style.transform='translateY(0)'">
          <img src="img-cartas/sobre-premium.webp" alt="Sobre Premium" onload="makeImageTransparent(this)" style="width: 160px; height: 240px; object-fit: contain; margin-bottom: 15px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
          <div>
            <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; margin: 0; color: #bcbcbc; text-shadow: 0 0 10px rgba(188,188,188,0.2); letter-spacing: 1px;">SOBRE PREMIUM</h3>
            <p style="font-size: 0.78rem; color: #a0a0a0; margin: 8px 0 15px; line-height: 1.4;">Contiene 5 cartas coleccionables.<br>Garantía: Mínimo 1 Épica.</p>
          </div>
          <button class="auth-btn" onclick="buyPack('premium')" style="width: 100%; justify-content: center; margin: 0; background: linear-gradient(135deg, #bcbcbc, #9a9a9a); color: #000; font-weight: bold; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(255,255,255,0.15);">💰 120 MONEDAS</button>
        </div>

        <!-- Sobre Legendario -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 25px; width: 270px; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: space-between; transition: transform 0.2s;" onmouseenter="this.style.transform='translateY(-6px)'" onmouseleave="this.style.transform='translateY(0)'">
          <img src="img-cartas/sobre-legendario.webp" alt="Sobre Legendario" onload="makeImageTransparent(this)" style="width: 160px; height: 240px; object-fit: contain; margin-bottom: 15px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
          <div>
            <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; margin: 0; color: #ffd700; text-shadow: 0 0 10px rgba(255,215,0,0.2); letter-spacing: 1px;">SOBRE LEGENDARIO</h3>
            <p style="font-size: 0.78rem; color: #a0a0a0; margin: 8px 0 15px; line-height: 1.4;">Contiene 7 cartas coleccionables.<br>Garantía: Mínimo 1 Legendaria.</p>
          </div>
          <button class="auth-btn" onclick="buyPack('legendary')" style="width: 100%; justify-content: center; margin: 0; background: linear-gradient(135deg, #ffd700, #b8860b); color: #000; font-weight: bold; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(255,215,0,0.25);">💰 300 MONEDAS</button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
}

function openMissionsUI() {
    closeAllModals();
    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay album-overlay-theme";

    let mHtml = Object.keys(userAlbumData.missions).map(key => {
        let m = userAlbumData.missions[key];
        let isComplete = m.progress >= m.target;
        return `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center; width:100%;">
        <div style="text-align:left;">
          <div style="font-weight:bold; color:#fff;">${m.desc}</div>
          <div style="font-size:0.75rem; color:var(--text2);">Progreso: ${m.progress}/${m.target}</div>
        </div>
        <div>
          ${m.claimed
                ? `<span style="color:#4ade80; font-size:0.85rem;">✅ Reclamada</span>`
                : `<button class="auth-btn" ${!isComplete ? 'disabled style="opacity:0.4;"' : ''} onclick="claimMissionReward('${key}')" style="margin:0; background:#2563eb;">🎁 Reclamar ${m.reward}B</button>`
            }
        </div>
      </div>
    `;
    }).join('');

    overlay.innerHTML = `
    <div class="auth-box" style="width:min(500px, 94vw);">
      <button class="auth-x" onclick="openAlbumUI()">✕</button>
      <h2 class="auth-h2" style="color:var(--accent);">📅 MISIONES DIARIAS</h2>
      <p class="auth-p">Completa tareas diarias para financiar tu vicio por los sobres de cartas.</p>
      <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
        ${mHtml || '<p style="color:var(--text2)">Cargando misiones...</p>'}
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
}

// Variables Globales de Apertura Premium
let openingCardsList = [];
let openingCardIndex = 0;

function displayPackOpeningAnimation(cards, packId = "basic") {
    closeAllModals();
    openingCardsList = cards;
    openingCardIndex = 0;

    const overlay = document.createElement("div");
    overlay.id = "auth-modal";
    overlay.className = "auth-overlay album-overlay-theme";
    overlay.style.background = "rgba(8, 8, 12, 0.98)";
    overlay.style.backdropFilter = "blur(25px)";

    let packImg = "img-cartas/sobre-basico.webp";
    let packTitle = "SOBRE BÁSICO";
    if (packId === "premium") {
        packImg = "img-cartas/sobre-premium.webp";
        packTitle = "SOBRE PREMIUM";
    } else if (packId === "legendary") {
        packImg = "img-cartas/sobre-legendario.webp";
        packTitle = "SOBRE LEGENDARIO";
    }

    overlay.innerHTML = `
    <!-- Vista del Sobre Cerrado -->
    <div id="pack-rip-view" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 85vh; gap: 24px; perspective: 1200px;">
      <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; color: #fff; letter-spacing: 3px; margin: 0; text-shadow: 0 0 20px rgba(255,255,255,0.3); text-align: center;">${packTitle}</h2>
      <p style="color: #94a3b8; font-size: 1rem; margin: -10px 0 10px; font-family: 'Barlow', sans-serif; letter-spacing: 0.5px;">¡Haz clic en el sobre para abrirlo y revelar su contenido!</p>
      
      <!-- Sobre 3D -->
      <div id="float-pack-container" class="premium-pack-wrapper" onclick="startRevealingCards()">
        <div id="pack-part-top" class="premium-booster-pack booster-${packId}">
          <div class="pack-foil-glare"></div>
          <div class="pack-crimp-edge top"></div>
          <div class="pack-art-container">
            <div class="pack-header-tcg">LQSA VECINAL</div>
            <img class="pack-art-img" src="${packImg}" alt="${packTitle}" onerror="this.src='img/personajes/antonio-recio.webp'" onload="makeImageTransparent(this)">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div class="pack-title-text">${packTitle}</div>
              <div class="pack-bottom-badge">T1 — EDICIÓN LIMITADA</div>
            </div>
          </div>
          <div class="pack-crimp-edge bottom"></div>
        </div>
      </div>
    </div>

    <!-- Vista de Revelado de Cartas de una en una -->
    <div id="pack-card-reveal-view" style="display: none; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 85vh; gap: 24px; overflow: hidden; width: 100%;">
      
      <div id="reveal-progress-text" style="font-family: 'Barlow Condensed', sans-serif; font-size: 1.2rem; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; text-shadow: 0 0 8px rgba(255,255,255,0.1);">
        Carta 1 de ${cards.length}
      </div>
      
      <!-- Contenedor del Mazo de Cartas en 3D -->
      <div class="tcg-deck-container" id="tcg-deck-container">
        <!-- El mazo físico de sombras apiladas se dibuja dinámicamente -->
        <div class="tcg-deck-stack" id="tcg-deck-stack"></div>
        
        <!-- Carta Volteable Superior (la activa) -->
        <div id="reveal-card-3d" class="tcg-flip-card" onclick="flipCurrentOpeningCard()">
          <div class="tcg-card-inner" id="reveal-card-inner">
            <!-- Reverso (Back) -->
            <div class="tcg-card-back">
              <span class="tcg-card-back-seal">⚓</span>
              <div class="tcg-card-back-logo">LQSACATENA</div>
              <div class="tcg-card-back-sub">MONTEPINAR TCG</div>
            </div>
            <!-- Anverso (Front) -->
            <div id="reveal-card-front-content" class="tcg-card-front">
              <!-- Rellenado Dinámicamente -->
            </div>
          </div>
        </div>
      </div>
      
      <p id="reveal-card-instruction" style="color: #ffd700; font-size: 1rem; font-weight: bold; margin: 0; animation: pulseInstruction 1.5s infinite; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
        ¡Haz clic en la carta para darle la vuelta!
      </p>
      
      <button id="reveal-next-btn" class="auth-btn" 
              style="display: none; min-width: 220px; justify-content: center; font-size: 1.15rem; background: linear-gradient(135deg, #f0c020, #eab308); color: #000; box-shadow: 0 4px 15px rgba(240,192,32,0.35); padding: 10px 24px; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1.5px; border-radius: 50px; cursor: pointer; transition: all 0.2s;" 
              onclick="loadNextOpeningCard()">
        Siguiente Carta ➜
      </button>
    </div>
  `;

    document.body.appendChild(overlay);
    injectAlbumStyles();
}

function startRevealingCards() {
    const packPart = document.getElementById("pack-part-top");
    if (!packPart) return;

    // 1. Efecto vibración inicial
    packPart.classList.add("shaking");

    setTimeout(() => {
        // 2. Efecto rasgado arriba/abajo
        packPart.classList.remove("shaking");
        packPart.classList.add("ripped-top");
        
        // Destello corto de luces confeti al rasgar
        if (typeof confetti === "function") {
            confetti({ particleCount: 30, spread: 40, origin: { y: 0.4 } });
        }

        setTimeout(() => {
            document.getElementById("pack-rip-view").style.display = "none";
            document.getElementById("pack-card-reveal-view").style.display = "flex";
            loadOpeningCard(0);
        }, 600);
    }, 450);
}

function drawDeckShadows(currentIndex) {
    const stackEl = document.getElementById("tcg-deck-stack");
    if (!stackEl) return;
    
    let html = "";
    const remainingCount = openingCardsList.length - 1 - currentIndex;
    
    // Dibujamos hasta 4 cartas de profundidad para simular el mazo físico
    const drawCount = Math.min(remainingCount, 4);
    for (let i = 0; i < drawCount; i++) {
        const offsetMultiplier = i + 1;
        const xOffset = offsetMultiplier * 3;
        const yOffset = offsetMultiplier * -3;
        const zOffset = offsetMultiplier * -6;
        
        html += `
          <div class="deck-card-shadow" 
               style="transform: translate3d(${xOffset}px, ${yOffset}px, ${zOffset}px); z-index: ${5 - i};">
            <div class="tcg-card-back" style="width: 100%; height: 100%; border-width: 4px; padding: 10px; box-sizing: border-box;">
              <span class="tcg-card-back-seal" style="font-size: 1.8rem;">⚓</span>
              <div class="tcg-card-back-logo" style="font-size: 1.4rem;">LQSACATENA</div>
              <div class="tcg-card-back-sub" style="font-size: 0.6rem;">MONTEPINAR TCG</div>
            </div>
          </div>
        `;
    }
    stackEl.innerHTML = html;
}

function loadOpeningCard(index) {
    const card = openingCardsList[index];
    const rarity = card.rarity || card.baseRarity || CARD_RARITIES.COMMON;
    const borderCol = rarity.color;
    const rarityClass = `rarity-design-${rarity.id}`;
    const isFoil = rarity.id === "foil" || card.isFoil ? "is-foil" : "";
    const isLegendary = rarity.id === "legendary" ? "is-legendary" : "";

    // Actualizar indicador
    document.getElementById("reveal-progress-text").textContent = `Carta ${index + 1} de ${openingCardsList.length}`;

    // Rellenar la cara frontal
    const frontEl = document.getElementById("reveal-card-front-content");
    frontEl.className = `tcg-card-front lqsa-card-item ${rarityClass} ${isFoil} ${isLegendary}`;
    frontEl.style.width = "100%";
    frontEl.style.height = "100%";
    frontEl.style.margin = "0";

    frontEl.innerHTML = `
      <div class="card-foil-overlay"></div>
      <div class="card-rarity-badge" style="background:${borderCol}; font-family:'Barlow Condensed', sans-serif; font-weight:700; letter-spacing:0.5px; border-radius: 4px; z-index: 5;">
        ${rarity.name}
      </div>
      <img class="card-img" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="height: 52%; object-fit: cover; border-bottom: 2px solid rgba(255,255,255,0.06); object-position: top;" onload="makeImageTransparent(this)">
      
      <div class="card-info-box" style="padding: 12px; height: 48%; justify-content: space-between; display: flex; flex-direction: column; box-sizing: border-box; background: rgba(15, 10, 33, 0.95);">
        <div style="text-align: left;">
          <div class="card-name" style="font-size: 1.15rem; margin-bottom: 2px; color: #fff; font-family:'Barlow Condensed', sans-serif; font-weight: 700;">${card.name}</div>
          <div class="card-job" style="font-size: 0.8rem; color: #ffd700; margin-bottom: 6px; font-family:'Barlow Condensed', sans-serif;">💼 Ocupación: ${card.occupation}</div>
          <div class="card-quote" style="font-size: 0.75rem; color: #94a3b8; font-style: italic; line-height: 1.35; max-height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
            "${card.quote}"
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; margin-top: 4px;">
          <span style="font-size: 0.65rem; color: #64748b; font-weight: bold;">T. Aparición: ${card.season || "T1"}</span>
          <span class="card-id-num" style="font-size: 0.68rem; color: #94a3b8; font-family: monospace;">#${card.number}/150</span>
        </div>
      </div>
    `;

    // Redibujar las sombras inferiores del mazo
    drawDeckShadows(index);

    // Resetear clases y rotación 3D
    const card3D = document.getElementById("reveal-card-3d");
    card3D.className = "tcg-flip-card";
    
    const innerEl = document.getElementById("reveal-card-inner");
    innerEl.style.transform = "";
    innerEl.style.transition = "transform 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.25)";

    document.getElementById("reveal-card-instruction").style.display = "block";
    document.getElementById("reveal-next-btn").style.display = "none";
}

function flipCurrentOpeningCard() {
    const cardEl = document.getElementById("reveal-card-3d");
    if (cardEl.classList.contains("revealed")) return;

    cardEl.classList.add("revealed");
    document.getElementById("reveal-card-instruction").style.display = "none";

    const nextBtn = document.getElementById("reveal-next-btn");
    nextBtn.style.display = "inline-flex";

    if (openingCardIndex === openingCardsList.length - 1) {
        nextBtn.textContent = "✓ VER RESUMEN DE COMPRA";
        nextBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
        nextBtn.style.color = "#fff";
        nextBtn.style.boxShadow = "0 4px 15px rgba(16,185,129,0.3)";
    } else {
        nextBtn.textContent = "SIGUIENTE CARTA ➜";
        nextBtn.style.background = "linear-gradient(135deg, #f0c020, #eab308)";
        nextBtn.style.color = "#000";
    }

    // Efecto confeti de colores basado en rareza
    const card = openingCardsList[openingCardIndex];
    const rarity = card.rarity || card.baseRarity || CARD_RARITIES.COMMON;
    
    if (typeof confetti === "function") {
        if (rarity.id === "foil" || rarity.id === "legendary") {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ffd700', '#ff0055', '#00ff55', '#0055ff'] });
        } else if (rarity.id === "epic") {
            confetti({ particleCount: 65, spread: 55, origin: { y: 0.6 }, colors: ['#a855f7', '#3b82f6', '#fff'] });
        } else if (rarity.id === "rare") {
            confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 }, colors: ['#3b82f6', '#fff'] });
        }
    }

    // Inicializar el controlador del efecto de inclinación 3D Parallax
    initCardParallaxEffect();
}

function initCardParallaxEffect() {
    const cardEl = document.getElementById("reveal-card-3d");
    const innerEl = document.getElementById("reveal-card-inner");
    if (!cardEl || !innerEl) return;

    cardEl.onmousemove = function(e) {
        if (!cardEl.classList.contains("revealed")) return;

        const rect = cardEl.getBoundingClientRect();
        // Obtener desplazamiento del cursor respecto al centro de la carta
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Limitar la inclinación a max 18 grados
        const rotateY = (x / (rect.width / 2)) * 18;
        const rotateX = -(y / (rect.height / 2)) * 18;

        // Sumar 180deg al eje Y porque la cara delantera está invertida
        innerEl.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg)`;
        innerEl.style.transition = "none";

        // Mover el brillo foil metalizado
        const foilOverlay = cardEl.querySelector(".card-foil-overlay");
        if (foilOverlay) {
            const px = 50 + (x / (rect.width / 2)) * 25;
            const py = 50 + (y / (rect.height / 2)) * 25;
            foilOverlay.style.setProperty("--foil-x", `${px}%`);
            foilOverlay.style.setProperty("--foil-y", `${py}%`);
        }
    };

    cardEl.onmouseleave = function() {
        // Volver de forma suave al estado neutro descubierto
        innerEl.style.transition = "transform 0.5s ease-out";
        innerEl.style.transform = "rotateY(180deg) rotateX(0deg)";
        
        const foilOverlay = cardEl.querySelector(".card-foil-overlay");
        if (foilOverlay) {
            foilOverlay.style.setProperty("--foil-x", `50%`);
            foilOverlay.style.setProperty("--foil-y", `50%`);
        }
    };
}

function loadNextOpeningCard() {
    if (openingCardIndex < openingCardsList.length - 1) {
        const cardEl = document.getElementById("reveal-card-3d");
        
        cardEl.onmousemove = null;
        cardEl.onmouseleave = null;

        // Desencadenar la animación de descarte hacia afuera
        cardEl.classList.add("slide-out-anim");

        setTimeout(() => {
            openingCardIndex++;
            loadOpeningCard(openingCardIndex);
            
            // Animación de entrada de la nueva carta
            const newCardEl = document.getElementById("reveal-card-3d");
            newCardEl.classList.add("slide-in-anim");
            
            setTimeout(() => {
                newCardEl.classList.remove("slide-in-anim");
            }, 650);
        }, 550);
    } else {
        // Mostrar la galería de resumen antes del guardado final
        displaySummaryGallery();
    }
}

function displaySummaryGallery() {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;

    let galleryCardsHtml = openingCardsList.map((card, idx) => {
        const rarity = card.rarity || card.baseRarity || CARD_RARITIES.COMMON;
        const borderCol = rarity.color;
        const rarityClass = `rarity-design-${rarity.id}`;
        const isFoil = rarity.id === "foil" || card.isFoil ? "is-foil" : "";
        const isLegendary = rarity.id === "legendary" ? "is-legendary" : "";

        return `
          <div class="tcg-flip-card revealed summary-card-tilt" 
               style="width:var(--tcg-width); height:var(--tcg-height); transform-style: preserve-3d; perspective: 1000px;"
               data-index="${idx}">
            <div class="tcg-card-inner" style="transform: rotateY(180deg); transform-style: preserve-3d; width:100%; height:100%;">
              <div class="tcg-card-front lqsa-card-item ${rarityClass} ${isFoil} ${isLegendary}" style="width:100%; height:100%;">
                <div class="card-foil-overlay"></div>
                <div class="card-rarity-badge" style="background:${borderCol}; font-family:'Barlow Condensed', sans-serif; font-weight:700; letter-spacing:0.5px; border-radius: 4px; z-index: 5;">
                  ${rarity.name}
                </div>
                <img class="card-img" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="height: 52%; object-fit: cover; border-bottom: 2px solid rgba(255,255,255,0.06); object-position: top;" onload="makeImageTransparent(this)">
                
                <div class="card-info-box" style="padding: 10px; height: 48%; justify-content: space-between; display: flex; flex-direction: column; box-sizing: border-box; background: rgba(15, 10, 33, 0.95);">
                  <div style="text-align: left;">
                    <div class="card-name" style="font-size: 1.05rem; margin-bottom: 1px; color: #fff; font-family:'Barlow Condensed', sans-serif; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${card.name}</div>
                    <div class="card-job" style="font-size: 0.72rem; color: #ffd700; margin-bottom: 4px; font-family:'Barlow Condensed', sans-serif;">💼 ${card.occupation}</div>
                    <div class="card-quote" style="font-size: 0.65rem; color: #94a3b8; font-style: italic; line-height: 1.25; max-height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                      "${card.quote}"
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; margin-top: 2px;">
                    <span style="font-size: 0.58rem; color: #64748b;">T. Aparición: ${card.season || "T1"}</span>
                    <span class="card-id-num" style="font-size: 0.62rem; color: #94a3b8; font-family: monospace;">#${card.number}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
    }).join("");

    overlay.innerHTML = `
      <div class="tcg-summary-gallery-container">
        <h2 class="tcg-summary-gallery-title">🎉 ¡SOBRE ADQUIRIDO!</h2>
        <p class="tcg-summary-gallery-subtitle">Estas son las cartas que has incorporado a tu catálogo</p>
        
        <div class="tcg-summary-grid">
          ${galleryCardsHtml}
        </div>
        
        <button class="tcg-save-collection-btn" onclick="closeAllModals(); openAlbumUI();">
          Guardar en mi Colección ✓
        </button>
      </div>
    `;

    // Inicializar parallax para las cartas de la galería final
    initSummaryGalleryParallax();
}

function initSummaryGalleryParallax() {
    const cardContainers = document.querySelectorAll(".summary-card-tilt");
    cardContainers.forEach(cardEl => {
        const innerEl = cardEl.querySelector(".tcg-card-inner");
        if (!innerEl) return;

        cardEl.onmousemove = function(e) {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateY = (x / (rect.width / 2)) * 15;
            const rotateX = -(y / (rect.height / 2)) * 15;

            innerEl.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg)`;
            innerEl.style.transition = "none";

            const foilOverlay = cardEl.querySelector(".card-foil-overlay");
            if (foilOverlay) {
                const px = 50 + (x / (rect.width / 2)) * 25;
                const py = 50 + (y / (rect.height / 2)) * 25;
                foilOverlay.style.setProperty("--foil-x", `${px}%`);
                foilOverlay.style.setProperty("--foil-y", `${py}%`);
            }
        };

        cardEl.onmouseleave = function() {
            innerEl.style.transition = "transform 0.4s ease-out";
            innerEl.style.transform = "rotateY(180deg) rotateX(0deg)";
            
            const foilOverlay = cardEl.querySelector(".card-foil-overlay");
            if (foilOverlay) {
                foilOverlay.style.setProperty("--foil-x", `50%`);
                foilOverlay.style.setProperty("--foil-y", `50%`);
            }
        };
    });
}

function injectAlbumStyles() {
    if (document.getElementById("album-premium-core-styles")) return;
    
    // Remove old simple stylesheet if present
    const oldStyle = document.getElementById("album-core-styles");
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement("style");
    style.id = "album-premium-core-styles";
    style.textContent = `
    /* TCG Dashboard Variables */
    :root {
      --tcg-deep-blue: #0b071e;
      --tcg-dark-purple: #140e2b;
      --tcg-gold: #ffd700;
      --tcg-gold-amber: #eab308;
      --tcg-dark-gray: #1b162f;
      --tcg-border-gold: rgba(240, 192, 32, 0.3);
    }

    /* Desk backdrop container */
    .auth-overlay.album-overlay-theme {
      background: radial-gradient(circle at 50% 50%, #150f2f 0%, #060412 100%) !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Binder Container Desk Alignment */
    .album-dashboard {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      gap: 15px;
    }

    /* Filter bar top */
    .album-filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      width: 100%;
      background: rgba(20, 14, 43, 0.7);
      border: 1px solid rgba(240, 192, 32, 0.15);
      border-radius: 16px;
      padding: 16px 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .filter-left, .filter-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .album-search-input {
      background: #090615;
      border: 1px solid rgba(240, 192, 32, 0.25);
      border-radius: 10px;
      color: #fff;
      padding: 8px 14px;
      font-size: 0.9rem;
      width: 190px;
      transition: all 0.2s ease;
    }

    .album-search-input:focus {
      outline: none;
      border-color: #ffd700;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
    }

    .album-select-set {
      background: #090615;
      border: 1px solid rgba(240, 192, 32, 0.25);
      border-radius: 10px;
      color: #fff;
      padding: 8px 12px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
    }

    .album-select-set:focus {
      border-color: #ffd700;
    }

    /* Status Filter Pill Buttons */
    .status-filters {
      display: flex;
      gap: 6px;
    }

    .status-filter-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #a0a0b0;
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 0.85rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .status-filter-btn:hover {
      background: rgba(240, 192, 32, 0.1);
      border-color: rgba(240, 192, 32, 0.3);
      color: #fff;
    }

    .status-filter-btn.active {
      background: #ffd700;
      border-color: #ffd700;
      color: #000;
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }

    /* Rarity Filters */
    .rarity-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .rarity-filter-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #8f8f9f;
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 0.78rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .rarity-filter-btn.active {
      color: #fff;
      border-color: var(--r-color);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 12px var(--r-color);
      text-shadow: 0 0 5px var(--r-color);
    }

    /* 3D Binder Frame */
    .album-binder-container {
      display: flex;
      align-items: center;
      width: 100%;
      justify-content: center;
      position: relative;
      gap: 15px;
    }

    .album-binder {
      position: relative;
      width: min(1000px, 94vw);
      height: min(630px, 75vh);
      perspective: 2200px;
      transform-style: preserve-3d;
      background: linear-gradient(135deg, #130f25 0%, #1a1435 50%, #0d0a1b 100%);
      border: 8px solid #0b0718;
      border-radius: 24px;
      box-shadow: inset 0 0 0 3px rgba(240, 192, 32, 0.15), 
                  inset 0 0 100px rgba(0,0,0,0.9), 
                  0 30px 70px rgba(0,0,0,0.85);
      overflow: visible;
      box-sizing: border-box;
    }

    /* Golden Metal corners */
    .binder-corner {
      position: absolute;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #ffe875 0%, #b8860b 45%, #ffd700 70%, #8b6508 100%);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }
    .corner-tl { top: -4px; left: -4px; clip-path: polygon(0 0, 100% 0, 0 100%); border-top-left-radius: 16px; }
    .corner-tr { top: -4px; right: -4px; clip-path: polygon(0 0, 100% 0, 100% 100%); border-top-right-radius: 16px; }
    .corner-bl { bottom: -4px; left: -4px; clip-path: polygon(0 100%, 0 0, 100% 100%); border-bottom-left-radius: 16px; }
    .corner-br { bottom: -4px; right: -4px; clip-path: polygon(100% 100%, 100% 0, 0 100%); border-bottom-right-radius: 16px; }

    /* Chrome Spine Bar */
    .binder-spine {
      position: absolute;
      top: 15px;
      bottom: 15px;
      left: calc(50% - 15px);
      width: 30px;
      background: linear-gradient(90deg, #15151b 0%, #444 15%, #d1d1df 40%, #ffffff 50%, #d1d1df 60%, #444 85%, #15151b 100%);
      box-shadow: 0 0 20px rgba(0,0,0,0.8);
      border-radius: 4px;
      z-index: 5;
    }

    .binder-ring {
      position: absolute;
      left: -8px;
      width: 46px;
      height: 14px;
      background: linear-gradient(180deg, #333 0%, #bbb 35%, #fff 50%, #888 75%, #222 100%);
      border-radius: 7px;
      box-shadow: 0 5px 8px rgba(0,0,0,0.6);
      z-index: 6;
    }
    .ring-1 { top: 10%; }
    .ring-2 { top: 35%; }
    .ring-3 { top: 60%; }
    .ring-4 { top: 85%; }

    /* Left & Right static Pages */
    .binder-page {
      position: absolute;
      top: 15px;
      bottom: 15px;
      width: calc(50% - 20px);
      z-index: 2;
      overflow: hidden;
    }

    .binder-page-left {
      left: 15px;
      transform-origin: right center;
    }

    .binder-page-right {
      right: 15px;
      transform-origin: left center;
    }

    /* Paper Texture and carbon look */
    .page-paper {
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, #0e0a1b 0%, #150f28 10%, #191330 100%);
      border-radius: 8px;
      border: 1px solid rgba(240, 192, 32, 0.15);
      box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.8), 0 5px 15px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    .page-right-paper {
      background: linear-gradient(to left, #0e0a1b 0%, #150f28 10%, #191330 100%) !important;
    }

    /* Punched binder holes */
    .page-holes {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      z-index: 3;
    }

    .page-left-paper .page-holes { right: 5px; }
    .page-right-paper .page-holes { left: 5px; }

    .page-hole {
      width: 12px;
      height: 12px;
      background: #06040c;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.04);
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.9);
    }

    /* Pockets Grid */
    .pockets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 12px;
      height: 100%;
      box-sizing: border-box;
      padding: 15px 36px 15px 20px;
    }

    .page-right-paper .pockets-grid {
      padding: 15px 20px 15px 36px;
    }

    /* Sleeves / Pockets */
    .album-pocket {
      position: relative;
      background: rgba(20, 14, 43, 0.35);
      border: 1px dashed rgba(240, 192, 32, 0.15);
      border-radius: 12px;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-sizing: border-box;
    }

    .pocket-glare {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 45%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
      z-index: 5;
    }

    /* Empty sleeves at end */
    .pocket-empty-sleeve {
      border: 1px dashed rgba(255,255,255,0.03);
      background: rgba(255,255,255,0.01);
    }

    /* Empty (Locked Card) state */
    .pocket-empty {
      border: 1px dotted rgba(240, 192, 32, 0.22);
    }

    .locked-card-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 10px;
      text-align: center;
      gap: 4px;
      box-sizing: border-box;
    }

    .locked-silhouette {
      font-size: 2.2rem;
      font-family: sans-serif;
      color: rgba(240, 192, 32, 0.12);
      font-weight: bold;
    }

    .locked-number {
      font-family: monospace;
      font-size: 0.65rem;
      color: rgba(240, 192, 32, 0.25);
      letter-spacing: 0.5px;
    }

    .locked-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: bold;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.15);
    }

    .locked-desc {
      font-size: 0.65rem;
      color: rgba(160, 160, 180, 0.15);
    }

    /* Filled pocket (owned card) */
    .pocket-filled {
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
      cursor: pointer;
    }

    .pocket-filled:hover {
      transform: scale(1.04) translateY(-3px);
      z-index: 10;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.8), 0 0 10px var(--rarity-color);
      border-color: var(--rarity-color);
    }

    /* TCG Card components */
    .tcg-card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      background: #0f0b21;
      box-sizing: border-box;
    }

    .tcg-card .card-rarity-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      font-size: 0.58rem;
      padding: 2px 6px;
      border-radius: 4px;
      z-index: 3;
    }

    .tcg-card .card-img {
      width: 100%;
      height: 48%;
      object-fit: cover;
      object-position: top;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .tcg-card .card-info-box {
      padding: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      position: relative;
      box-sizing: border-box;
    }

    .tcg-card .card-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
      line-height: 1.1;
    }

    .tcg-card .card-job {
      font-size: 0.68rem;
      color: #ffd700;
      margin-top: 1px;
    }

    .tcg-card .card-meta {
      font-size: 0.62rem;
      color: #8c8c9c;
    }

    .tcg-card .card-quote {
      font-size: 0.62rem;
      color: #94a3b8;
      font-style: italic;
      line-height: 1.25;
      margin-top: 3px;
      flex: 1;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .tcg-card .card-id-num {
      font-size: 0.58rem;
      color: #64748b;
      align-self: flex-end;
    }

    .tcg-card .card-counter {
      position: absolute;
      right: 6px;
      top: 6px;
      background: #ffd700;
      color: #000;
      font-weight: bold;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      z-index: 3;
    }

    .tcg-card .fuse-btn {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: none;
      color: white;
      padding: 3px 6px;
      border-radius: 5px;
      font-size: 0.62rem;
      font-weight: bold;
      cursor: pointer;
      margin-top: 4px;
      width: 100%;
    }

    /* Foil styling animation */
    .card-foil .tcg-card {
      animation: foilShimmer 6s infinite linear;
    }
    
    @keyframes foilShimmer {
      0% { filter: hue-rotate(0deg) brightness(1); }
      50% { filter: hue-rotate(180deg) brightness(1.15) contrast(1.1); }
      100% { filter: hue-rotate(360deg) brightness(1); }
    }

    /* Metallic Navigation Arrows Outside Binder */
    .album-nav-arrow {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2b1f4c 0%, #150f28 100%);
      border: 1px solid rgba(240, 192, 32, 0.35);
      color: #ffd700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,215,0,0.1);
      transition: all 0.2s ease;
      z-index: 15;
    }

    .album-nav-arrow:hover:not(.disabled) {
      background: linear-gradient(135deg, #eab308 0%, #b8860b 100%);
      color: #000;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
      transform: translateY(-2px);
    }

    .album-nav-arrow:active:not(.disabled) {
      transform: translateY(0) scale(0.95);
    }

    .album-nav-arrow.disabled {
      opacity: 0.25;
      cursor: not-allowed;
      border-color: rgba(255, 255, 255, 0.1);
      color: #64748b;
    }

    /* Bottom Bar */
    .album-bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 5px 10px;
      box-sizing: border-box;
    }

    #album-page-counter {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: bold;
      font-size: 1.1rem;
      color: #fff;
      letter-spacing: 1px;
    }

    /* Dynamic Page Flipping */
    .binder-page-flipping {
      position: absolute;
      top: 15px;
      bottom: 15px;
      width: calc(50% - 20px);
      z-index: 20;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
      overflow: visible;
    }

    .binder-page-flipping.flip-next {
      left: 50%;
      transform-origin: left center;
    }

    .binder-page-flipping.flip-next.flipping-active {
      transform: rotateY(-180deg);
    }

    .binder-page-flipping.flip-prev {
      left: 15px;
      transform-origin: right center;
    }

    .binder-page-flipping.flip-prev.flipping-active {
      transform: rotateY(180deg);
    }

    .flipping-face {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      width: 100%;
      height: 100%;
    }

    .flipping-face-front {
      z-index: 2;
      transform: rotateY(0deg);
    }

    .flipping-face-back {
      transform: rotateY(180deg);
    }

    /* Depth shadow during flip */
    .flipping-shadow {
      position: absolute;
      inset: 0;
      background: black;
      opacity: 0;
      pointer-events: none;
      z-index: 10;
      border-radius: 8px;
    }

    /* Keyframes for shadows and confeti */
    @keyframes shadowFade {
      0% { opacity: 0; }
      50% { opacity: 0.55; }
      100% { opacity: 0; }
    }

    .flipping-active .flipping-shadow {
      animation: shadowFade 0.6s ease-in-out;
    }

    .album-nav-row-mobile {
      display: none;
    }

    /* Responsive Mobile Layout rules */
    @media (max-width: 768px) {
      .album-filter-bar {
        flex-direction: column;
        align-items: stretch;
        padding: 12px;
      }
      
      .filter-left, .filter-right {
        justify-content: space-between;
        width: 100%;
      }
      
      .album-search-input {
        width: 48%;
      }
      
      .album-select-set {
        width: 48%;
      }

      .album-binder {
        width: 96vw;
        height: 65vh;
        border-radius: 16px;
      }
      
      /* Hide Left side elements completely */
      .binder-page-left {
        display: none !important;
      }
      
      .binder-page-right {
        left: 10px;
        width: calc(100% - 20px);
      }
      
      .page-right-paper .pockets-grid {
        padding: 12px 16px 12px 24px;
      }
      
      /* Relocate Spline to the left boundary edge */
      .binder-spine {
        left: 0px;
        width: 12px;
      }
      
      .binder-ring {
        left: -6px;
        width: 22px;
      }
      
      .corner-tl, .corner-bl {
        display: none;
      }
      
      /* Navigation arrow placement for mobile */
      .album-nav-arrow {
        display: none !important; /* Hide side arrows on mobile */
      }
      
      .album-nav-row-mobile {
        display: flex !important;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        margin-top: 10px;
        width: 100%;
        box-sizing: border-box;
        padding: 0 10px;
      }
      
      .album-nav-row-mobile .album-nav-arrow {
        display: flex !important;
        width: 40px;
        height: 40px;
        font-size: 1.15rem;
      }

      #album-desktop-bottom-bar {
        display: none !important;
      }
      
      .pockets-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 8px;
        padding: 8px 10px 8px 18px !important;
      }
      
      .tcg-card .card-img {
        height: 40%;
      }
      
      .tcg-card .card-info-box {
        padding: 4px;
      }
      
      .tcg-card .card-name {
        font-size: 0.8rem;
      }
      
      .tcg-card .card-job {
        font-size: 0.6rem;
      }
      
      .tcg-card .card-meta {
        font-size: 0.55rem;
      }
      
      .tcg-card .card-quote {
        display: none;
      }
      
      .tcg-card .fuse-btn {
        padding: 2px 4px;
        font-size: 0.55rem;
      }
      
      /* Disable Y rotation to avoid cropping on small widths */
      .binder-page-flipping {
        display: none !important;
      }
    }
  `;
    document.head.appendChild(style);
}