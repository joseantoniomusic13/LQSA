/* ════════════════════════════════════════════════════════
   LQSACatena — Motor de Álbum, Sobres y Misiones
   ════════════════════════════════════════════════════════ */

let userAlbumData = { coins: 0, cards: {}, missions: {} };

// ==========================================================================
//  TCG DUEL PREPARATION: RECETAS DE DÚOS Y ATRIBUTOS DE COMBATE
// ==========================================================================

const DUO_RECIPES = [
    {
        id: "duo-recio-berta",
        name: "Los Recio (Crisis Conyugal)",
        ingredients: ["antonio-recio", "berta-escobar"],
        coinsCost: 200,
        number: "D01",
        occupation: "Mayoristas del Amor",
        season: "T1-T15",
        type: "Dúo Histórico",
        quote: "¡Berta, cacho cabrona! ¡Antonio, por el amor de Dios, recapacita!",
        image: "img/personajes/antonio-recio.webp",
        hp: 450,
        atk: 180,
        def: 160,
        combatType: "Dúo Mayorista",
        attacks: [
            { name: "Terapia de Pareja", power: 100, desc: "Restaura salud y confunde a los vecinos rivales." },
            { name: "Centollazo Conyugal", power: 170, desc: "Ataque masivo doble con mariscos y crucifijos." }
        ]
    },
    {
        id: "duo-amador-leo",
        name: "Los Leones (¡Mente Fría!)",
        ingredients: ["amador-rivas", "leo-romani"],
        coinsCost: 200,
        number: "D02",
        occupation: "Leones de Montepinar",
        season: "T1-T8",
        type: "Dúo Histórico",
        quote: "¡¿Qué pasa?! ¡Claro que sí, hombre! ¡Mente fría, león!",
        image: "img/personajes/amador-rivas.webp",
        hp: 400,
        atk: 190,
        def: 140,
        combatType: "Dúo León",
        attacks: [
            { name: "Rugido del León", power: 90, desc: "Aumenta la fuerza de ataque de todo tu mazo." },
            { name: "¡Pinchito con Leo!", power: 180, desc: "Ataque combinado arrollador en el Max&Henry." }
        ]
    },
    {
        id: "duo-fermin-estela",
        name: "Esparraguitos de Mar",
        ingredients: ["fermin-trujillo", "estela-reynolds"],
        coinsCost: 200,
        number: "D03",
        occupation: "Buscavidas del Espectáculo",
        season: "T3-T7",
        type: "Dúo Histórico",
        quote: "¡Fermín, tráeme un whisky! ¡Estela, eres un torbellino de sensualidad!",
        image: "img/personajes/fermin-trujillo.webp",
        hp: 420,
        atk: 175,
        def: 150,
        combatType: "Dúo Artístico",
        attacks: [
            { name: "Foco de Estrellato", power: 95, desc: "Ciega al rival reduciendo su precisión un 30%." },
            { name: "La Doble Estafa Nelson", power: 165, desc: "Estafa masiva con esparraguitos de mar." }
        ]
    },
    {
        id: "duo-enrique-araceli",
        name: "Cuchufleta y Enrique",
        ingredients: ["enrique-pastor", "araceli-madariaga"],
        coinsCost: 200,
        number: "D04",
        occupation: "Políticos del Amor",
        season: "T1-T12",
        type: "Dúo Histórico",
        quote: "¡Araceli, vuelve a casa! ¡Enrique, necesito mi espacio cósmico!",
        image: "img/personajes/enrique-pastor.webp",
        hp: 410,
        atk: 160,
        def: 170,
        combatType: "Dúo Pastor",
        attacks: [
            { name: "Equilibrio Energético", power: 80, desc: "Limpia todos los estados negativos de tu tablero." },
            { name: "Normativa Municipal", power: 150, desc: "Impone una derrama masiva de daño grupal." }
        ]
    }
];

function enhanceCardsWithCombatStats() {
    if (typeof ALBUM_CARDS === 'undefined') return;
    
    // Verificar si ya se ha ejecutado
    if (ALBUM_CARDS.some(c => c.hp !== undefined)) return;

    ALBUM_CARDS.forEach((card) => {
        const rarity = card.baseRarity || { id: "common" };
        let baseHp = 100;
        let baseAtk = 40;
        let baseDef = 30;
        let combatType = "Inquilino";

        if (rarity.id === "common") {
            baseHp = 95; baseAtk = 35; baseDef = 25;
        } else if (rarity.id === "rare") {
            baseHp = 135; baseAtk = 50; baseDef = 40;
        } else if (rarity.id === "epic") {
            baseHp = 175; baseAtk = 65; baseDef = 55;
        } else if (rarity.id === "legendary") {
            baseHp = 225; baseAtk = 85; baseDef = 70;
        } else if (rarity.id === "foil") {
            baseHp = 265; baseAtk = 105; baseDef = 90;
        }

        // Asignar clase de combate elemental según Lore de LQSA
        const nameUpper = card.name.toUpperCase();
        if (nameUpper.includes("RECIO") || nameUpper.includes("BERTA")) {
            combatType = "Mayorista";
        } else if (nameUpper.includes("AMADOR") || nameUpper.includes("RIVAS") || nameUpper.includes("LEO") || nameUpper.includes("TEODORO")) {
            combatType = "León";
        } else if (nameUpper.includes("ENRIQUE") || nameUpper.includes("PASTOR") || nameUpper.includes("ARACELI") || nameUpper.includes("VICENTE") || nameUpper.includes("GOYA") || nameUpper.includes("DRAMA")) {
            combatType = "Junta";
        } else if (nameUpper.includes("FERMÍN") || nameUpper.includes("TRUJILLO") || nameUpper.includes("COQUE") || nameUpper.includes("MAXI")) {
            combatType = "Buscavidas";
        } else {
            combatType = "Inquilino";
        }

        // Definición de Ataques y Habilidades Especiales
        let attacks = [
            { name: "Disputa Vecinal", power: 35, desc: "Crea una derrama sorpresa que desquicia al oponente." },
            { name: "¡Cuchufleta!", power: 50, desc: "Un golpe de afecto inesperado." }
        ];

        if (card.name.includes("Recio")) {
            attacks = [
                { name: "Lanzamiento de Centollo", power: 65, desc: "Lanza un bogavante fresco directo a la cara." },
                { name: "¡Mayorista, no limpio pescado!", power: 90, desc: "Ataque fulminante con un pez espada congelado." }
            ];
        } else if (card.name.includes("Amador") || card.name.includes("Rivas")) {
            attacks = [
                { name: "¡Pinchito Obligatorio!", power: 60, desc: "Seducción arrolladora que paraliza al rival." },
                { name: "¡Espartaco!", power: 85, desc: "Se quita la camiseta y embiste como el guerrero de Albacete." }
            ];
        } else if (card.name.includes("Fermín") || card.name.includes("Trujillo")) {
            attacks = [
                { name: "Estafa del Espárrago", power: 55, desc: "Un timo inmobiliario que reduce la defensa enemiga." },
                { name: "¡Doble Nelson!", power: 80, desc: "Su llave de lucha libre favorita." }
            ];
        } else if (card.name.includes("Coque")) {
            attacks = [
                { name: "Riego de Plantas", power: 40, desc: "Moja al rival con agua sucia de regar." },
                { name: "Plantación de Hierba", power: 75, desc: "Dormir al rival con humo denso del invernadero." }
            ];
        } else if (card.name.includes("Enrique") || card.name.includes("Pastor")) {
            attacks = [
                { name: "Lectura de Estatutos", power: 45, desc: "Duerme de aburrimiento al contrincante." },
                { name: "Doble Cuchufleta", power: 75, desc: "Llama a Araceli para pedir auxilio matrimonial." }
            ];
        } else if (card.name.includes("Estela") || card.name.includes("Reynolds")) {
            attacks = [
                { name: "Lanzamiento de Whisky", power: 60, desc: "Lanza un vaso de tubo con hielo." },
                { name: "¡Fernando Esteso me chupó un pezón!", power: 95, desc: "Ataque sónico insoportable que confunde al oponente." }
            ];
        }

        card.hp = baseHp;
        card.atk = baseAtk;
        card.def = baseDef;
        card.combatType = combatType;
        card.attacks = attacks;
    });

    // Inyectar Dúos Dinámicos al Catálogo general para que se rendericen en el álbum
    DUO_RECIPES.forEach(recipe => {
        ALBUM_CARDS.push({
            id: recipe.id,
            number: recipe.number,
            name: recipe.name,
            occupation: recipe.occupation,
            season: recipe.season,
            type: recipe.type,
            quote: recipe.quote,
            image: recipe.image,
            baseRarity: CARD_RARITIES.FOIL,
            hp: recipe.hp,
            atk: recipe.atk,
            def: recipe.def,
            combatType: recipe.combatType,
            attacks: recipe.attacks,
            isDuo: true,
            ingredients: recipe.ingredients,
            coinsCost: recipe.coinsCost
        });
    });
}

// Ejecutar inmediatamente
setTimeout(enhanceCardsWithCombatStats, 100);

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
            if (activeStatusFilter === "duplicates") {
                const count = owned ? userAlbumData.cards[card.id].count : 0;
                if (count <= 1) return false;
            }
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
        const lockedDesc = card.isDuo ? "Fusión en Taller" : "Cromo Bloqueado";
        const lockedName = card.isDuo ? card.name : "¿¿??";
        return `
            <div class="album-pocket pocket-empty" data-id="${card.id}" style="${card.isDuo ? 'border: 2px dashed rgba(240, 192, 32, 0.4); cursor: pointer;' : ''}" onclick="${card.isDuo ? 'openWorkshopUI()' : ''}">
                <div class="pocket-glare"></div>
                <div class="locked-card-body">
                    <div class="locked-silhouette" style="${card.isDuo ? 'font-size: 2rem;' : ''}">${card.isDuo ? '👥' : '?'}</div>
                    <div class="locked-number">#${card.number}</div>
                    <div class="locked-name" style="font-size: 0.8rem; margin: 4px 0;">${lockedName}</div>
                    <div class="locked-desc" style="color: ${card.isDuo ? '#ffd700' : '#888'};">${lockedDesc}</div>
                </div>
            </div>
        `;
    }

    // Pocket Filled (Owned card)
    let rarityName = card.baseRarity.name;
    if (isFoil) rarityName = "🌈 FOIL";

    return `
        <div class="album-pocket pocket-filled ${isFoil ? 'card-foil' : ''}" data-id="${card.id}" style="--rarity-color: ${borderCol}; cursor: pointer;" onclick="zoomCard('${card.id}', ${isFoil})">
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

function zoomCard(cardId, isFoil = false) {
    const card = ALBUM_CARDS.find(c => c.id === cardId);
    if (!card) return;

    const userCard = userAlbumData.cards[card.id];
    const count = userCard ? userCard.count : 0;
    const rarity = card.baseRarity || CARD_RARITIES.COMMON;
    const borderCol = isFoil ? CARD_RARITIES.FOIL.color : rarity.color;
    const rarityName = isFoil ? "🌈 Holográfica Foil" : rarity.name;
    const rarityClass = isFoil ? "rarity-design-foil" : `rarity-design-${rarity.id}`;

    // Recuperar nivel y estado de firma del cromo
    const level = userCard ? (userCard.level || 1) : 1;
    const signed = userCard ? !!userCard.signed : false;

    // Calcular estadísticas mejoradas de combate
    let currentHp = card.hp || 100;
    let currentAtk = card.atk || 40;
    let currentDef = card.def || 30;

    const levelMultiplier = 1 + (level - 1) * 0.15;
    currentHp = Math.round(currentHp * levelMultiplier);
    currentAtk = Math.round(currentAtk * levelMultiplier);
    currentDef = Math.round(currentDef * levelMultiplier);

    if (signed) {
        currentHp = Math.round(currentHp * 1.3);
        currentAtk = Math.round(currentAtk * 1.3);
        currentDef = Math.round(currentDef * 1.3);
    }

    // Create modal overlay
    const modal = document.createElement("div");
    modal.id = "zoom-card-modal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.zIndex = "10000";
    modal.style.background = "rgba(4, 3, 10, 0.94)";
    modal.style.backdropFilter = "blur(18px)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.gap = "24px";
    modal.style.animation = "fadeInZoom 0.25s ease-out";
    
    // Close on clicking the backdrop itself
    modal.onclick = function(e) {
        if (e.target.id === "zoom-card-modal") {
            modal.remove();
        }
    };

    modal.innerHTML = `
      <style>
        @keyframes fadeInZoom { from { opacity: 0; } to { opacity: 1; } }
        .zoomed-card-container {
          width: 340px;
          height: 476px;
          perspective: 1500px;
          cursor: pointer;
          transform-style: preserve-3d;
        }
        .zoomed-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform: rotateY(180deg);
          box-shadow: 0 30px 75px rgba(0,0,0,0.9);
          border-radius: 20px;
        }
        .zoomed-card-front {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #0f0a21;
          box-sizing: border-box;
          transform: rotateY(180deg);
          display: flex;
          flex-direction: column;
        }
        .zoomed-card-front.rarity-design-common { border: 6px solid var(--rarity-common); }
        .zoomed-card-front.rarity-design-rare { border: 6px solid var(--rarity-rare); box-shadow: 0 0 30px rgba(59,130,246,0.3); }
        .zoomed-card-front.rarity-design-epic { border: 6px solid var(--rarity-epic); animation: epicGlow 4s ease infinite; }
        .zoomed-card-front.rarity-design-legendary { border: 6px solid var(--rarity-legendary); animation: legendaryGlow 3s ease infinite; }
        .zoomed-card-front.rarity-design-foil {
          border: 6px solid transparent;
          border-image: linear-gradient(45deg, #f43f5e, #eab308, #3b82f6, #f43f5e) 1;
          box-shadow: 0 0 35px rgba(244,63,94,0.7);
        }
        .close-zoom-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #94a3b8;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.25rem;
          letter-spacing: 1.5px;
          padding: 8px 36px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-zoom-btn:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
          box-shadow: 0 0 15px rgba(239,68,68,0.4);
          transform: translateY(-2px);
        }
      </style>

      <div class="zoomed-card-container" id="zoomed-card-container">
        <div class="zoomed-card-inner" id="zoomed-card-inner">
          <div class="zoomed-card-front lqsa-card-item ${rarityClass} ${isFoil ? 'is-foil' : ''} ${rarity.id === 'legendary' ? 'is-legendary' : ''}">
            <div class="card-foil-overlay"></div>
            
            ${signed ? `
              <div class="card-signature-wrapper">
                <svg class="signature-scribble" viewBox="0 0 100 30">
                  <path d="M5,15 C25,3 40,28 50,15 C65,2 75,28 95,15" fill="none" stroke="rgba(255, 215, 0, 0.55)" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <div class="signature-text">${card.name.split(' ')[0]}</div>
              </div>
            ` : ''}

            <div class="card-rarity-badge" style="background:${borderCol}; font-family:'Barlow Condensed', sans-serif; font-weight:700; letter-spacing:0.8px; border-radius: 6px; z-index: 5; font-size: 0.95rem; padding: 4px 10px;">
              ${rarityName} ${signed ? '✒️ FIRMADA' : ''}
            </div>
            <img class="card-img" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="height: 48%; object-fit: cover; border-bottom: 2px solid rgba(255,255,255,0.06); object-position: top;" onload="makeImageTransparent(this)">
            
            <div class="card-info-box" style="padding: 12px 16px; height: 52%; justify-content: space-between; display: flex; flex-direction: column; box-sizing: border-box; background: rgba(15, 10, 33, 0.96);">
              <div style="text-align: left; overflow-y: auto; max-height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div class="card-name" style="font-size: 1.35rem; color: #fff; font-family:'Barlow Condensed', sans-serif; font-weight: 700; margin-bottom: 1px;">${card.name}</div>
                  <div class="card-desquicie-stars">${'★'.repeat(level)}${'☆'.repeat(5 - level)}</div>
                </div>
                <div class="card-job" style="font-size: 0.8rem; color: #ffd700; margin-bottom: 4px; font-family:'Barlow Condensed', sans-serif;">💼 Ocupación: ${card.occupation}</div>
                <div class="card-quote" style="font-size: 0.75rem; color: #94a3b8; font-style: italic; line-height: 1.25; max-height: 36px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  "${card.quote}"
                </div>

                <!-- Panel de Estadísticas Duelo TCG -->
                <div class="zoom-stats-box">
                  <div class="zoom-stats-row">
                    <span class="zoom-stats-label">Clase Duelo:</span>
                    <span class="zoom-stats-value" style="color:#a855f7;">${card.combatType || 'Vecino'}</span>
                  </div>
                  <div class="zoom-stats-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px;">
                    <span style="font-size:0.75rem; color:#f87171; font-weight:bold;">❤️ HP: ${currentHp}</span>
                    <span style="font-size:0.75rem; color:#facc15; font-weight:bold;">⚔️ ATK: ${currentAtk}</span>
                    <span style="font-size:0.75rem; color:#60a5fa; font-weight:bold;">🛡️ DEF: ${currentDef}</span>
                  </div>
                  <div style="font-size: 0.72rem; color: #ffd700; font-weight: bold; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px;">Habilidad Duelo TCG:</div>
                  <div style="font-size: 0.68rem; color: #cbd5e1; line-height: 1.2; max-height: 28px; overflow: hidden;">
                    <strong>${card.attacks && card.attacks[0] ? card.attacks[0].name : 'Sermón Vecinal'}:</strong> ${card.attacks && card.attacks[0] ? card.attacks[0].desc : 'Chapa comunitaria de derramas.'}
                  </div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; margin-top: 2px;">
                <span style="font-size: 0.68rem; color: #64748b; font-weight: bold;">T. Aparición: ${card.season}</span>
                <span class="card-id-num" style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">Nº #${card.number}/150</span>
              </div>
            </div>
            ${count > 1 ? `<div class="card-counter" style="position:absolute; top: 12px; right: 12px; font-size:1.1rem; padding: 4px 10px; border-radius: 8px; z-index: 10;">×${count}</div>` : ''}
          </div>
        </div>
      </div>

      <button class="close-zoom-btn" onclick="document.getElementById('zoom-card-modal').remove()">
        ✕ Cerrar Vista
      </button>
    `;

    document.body.appendChild(modal);

    // Initialize 3D Parallax Tilt Effect for the Enlarged Card!
    const container = document.getElementById("zoomed-card-container");
    const inner = document.getElementById("zoomed-card-inner");
    if (container && inner) {
        container.onmousemove = function(e) {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateY = (x / (rect.width / 2)) * 18;
            const rotateX = -(y / (rect.height / 2)) * 18;

            inner.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg)`;
            inner.style.transition = "none";

            const foilOverlay = container.querySelector(".card-foil-overlay");
            if (foilOverlay) {
                const px = 50 + (x / (rect.width / 2)) * 25;
                const py = 50 + (y / (rect.height / 2)) * 25;
                foilOverlay.style.setProperty("--foil-x", `${px}%`);
                foilOverlay.style.setProperty("--foil-y", `${py}%`);
            }
        };

        container.onmouseleave = function() {
            inner.style.transition = "transform 0.4s ease-out";
            inner.style.transform = "rotateY(180deg) rotateX(0deg)";
            
            const foilOverlay = container.querySelector(".card-foil-overlay");
            if (foilOverlay) {
                foilOverlay.style.setProperty("--foil-x", `50%`);
                foilOverlay.style.setProperty("--foil-y", `50%`);
            }
        };
    }
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
      <button class="auth-x" onclick="closeAllModals()" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
      
      <!-- Premium dashboard top-bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:15px; width:100%; padding-right: 55px; box-sizing: border-box;">
        <div style="text-align:left;">
          <h2 class="auth-h2" style="color:#ffd700; margin:0; text-shadow:0 0 10px rgba(240,192,32,0.25); font-family:'Bebas Neue',sans-serif; font-size:2.2rem; letter-spacing:1px;">🎴 ÁLBUM DE LA COMUNIDAD</h2>
          <p class="auth-p" style="margin:2px 0 0 0; color:#94a3b8; font-size:0.9rem;">Colecciona los cromos exclusivos y fusiona repetidos en la Catena Vecinal.</p>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="premium-coin-badge">
            🪙 <span style="color:#ffd700; font-size:1.15rem; font-family:'Bebas Neue',sans-serif;">${userAlbumData.coins}</span> Monedas
          </div>
          <button class="btn-premium-shop" onclick="openShopUI()">🛒 Tienda</button>
          <button class="btn-premium-missions" onclick="openMissionsUI()">📅 Misiones</button>
          <button class="btn-premium-workshop" onclick="openWorkshopUI()">🛠️ Taller Vecinal</button>
          <button class="btn-premium-shop" style="background:linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%); border: 1px solid rgba(220, 38, 38, 0.45); box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);" onclick="openCardDuelLobby()">⚔️ Duelo TCG</button>
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
              <button class="status-filter-btn" data-status="duplicates" onclick="onAlbumStatusFilter('duplicates')">🔄 Repetidos</button>
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
    <div class="auth-box album-box" style="width:min(960px, 96vw); max-height:85vh; overflow-y:auto; padding: 30px; position: relative;">
      <button class="auth-x" onclick="openAlbumUI()" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
      <h2 class="auth-h2" style="color:var(--accent); font-size: 2.2rem; text-shadow: 0 0 15px rgba(240, 192, 32, 0.2); margin-top: 10px; padding-right: 50px;">🛒 TIENDA DE SOBRES</h2>
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
    <div class="auth-box" style="width:min(500px, 94vw); position: relative;">
      <button class="auth-x" onclick="openAlbumUI()" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
      <h2 class="auth-h2" style="color:var(--accent); padding-right: 50px;">📅 MISIONES DIARIAS</h2>
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
    
    // Inicializar parallax para permitir que la carta boca abajo también se incline suavemente
    initCardParallaxEffect();
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
        const isRevealed = cardEl.classList.contains("revealed");
        const rect = cardEl.getBoundingClientRect();
        // Obtener desplazamiento del cursor respecto al centro de la carta
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Limitar la inclinación a max 18 grados
        const rotateY = (x / (rect.width / 2)) * 18;
        const rotateX = -(y / (rect.height / 2)) * 18;

        if (isRevealed) {
            // Sumar 180deg al eje Y porque la cara delantera está invertida
            innerEl.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg)`;
        } else {
            // Rotación normal para la cara trasera
            innerEl.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        }
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
        innerEl.style.transition = "transform 0.5s ease-out";
        const isRevealed = cardEl.classList.contains("revealed");
        if (isRevealed) {
            innerEl.style.transform = "rotateY(180deg) rotateX(0deg)";
        } else {
            innerEl.style.transform = "rotateY(0deg) rotateX(0deg)";
        }
        
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

// ==========================================================================
//  TALLER VECINAL: LOGICA DE UPGRADES, FIRMAS Y DÚOS HISTÓRICOS
// ==========================================================================

let currentWorkshopTab = 'signatures';

function openWorkshopUI() {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;
    
    // Asegurar que las estadísticas estén cargadas
    enhanceCardsWithCombatStats();

    overlay.style.display = "flex";
    overlay.style.zIndex = "9999";

    let contentHtml = "";

    if (currentWorkshopTab === 'signatures') {
        // Filtrar vecinos con repetidos >= 5 (count >= 6) y no firmados
        const eligible = ALBUM_CARDS.filter(c => !c.isDuo).filter(card => {
            const userCard = userAlbumData.cards[card.id];
            return userCard && userCard.count >= 6 && !userCard.signed;
        });

        if (eligible.length === 0) {
            contentHtml = `
                <div style="text-align:center; padding:40px; color:#94a3b8; font-family:'Barlow Condensed', sans-serif; width:100%; grid-column: 1 / -1;">
                    <div style="font-size:3rem; margin-bottom:12px;">✒️</div>
                    <h3 style="color:#fff; font-size:1.4rem; margin:0 0 8px 0;">No tienes vecinos listos para Firmar</h3>
                    <p style="margin:0; font-size:0.95rem; max-width:400px; margin:0 auto; line-height:1.4;">Requieres acumular **al menos 5 repetidos** de una misma carta (un total de 6 copias) para que el vecino acuda a la Junta a estampar su autógrafo premium.</p>
                </div>
            `;
        } else {
            contentHtml = eligible.map(card => {
                const userCard = userAlbumData.cards[card.id];
                const dups = userCard.count - 1;
                return `
                    <div class="workshop-card-item">
                        <img class="workshop-card-thumb" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'">
                        <div class="workshop-card-details">
                            <h4 class="workshop-card-title">${card.name}</h4>
                            <p class="workshop-card-meta">💼 ${card.occupation} | ❤️ HP Base: ${card.hp}</p>
                            <div style="font-size:0.75rem; color:#ffd700; margin-bottom:8px; font-weight:bold;">📋 Repetidos: ${dups}/5 consumibles</div>
                        </div>
                        <button class="workshop-action-btn" onclick="upgradeSignature('${card.id}')">✒️ Firmar Cromo</button>
                    </div>
                `;
            }).join("");
        }
    } else if (currentWorkshopTab === 'desquicie') {
        // Filtrar vecinos con repetidos (count > 1) y nivel < 5
        const eligible = ALBUM_CARDS.filter(c => !c.isDuo).filter(card => {
            const userCard = userAlbumData.cards[card.id];
            return userCard && userCard.count > 1 && (userCard.level || 1) < 5;
        });

        if (eligible.length === 0) {
            contentHtml = `
                <div style="text-align:center; padding:40px; color:#94a3b8; font-family:'Barlow Condensed', sans-serif; width:100%; grid-column: 1 / -1;">
                    <div style="font-size:3rem; margin-bottom:12px;">📈</div>
                    <h3 style="color:#fff; font-size:1.4rem; margin:0 0 8px 0;">Sin Vecinos para Desquiciar</h3>
                    <p style="margin:0; font-size:0.95rem; max-width:400px; margin:0 auto; line-height:1.4;">Consigue cartas repetidas de tus vecinos abriendo sobres para aumentar sus estrellas de **Desquicie/Locura** y mejorar sus estadísticas de combate.</p>
                </div>
            `;
        } else {
            contentHtml = eligible.map(card => {
                const userCard = userAlbumData.cards[card.id];
                const currentLvl = userCard.level || 1;
                const dups = userCard.count - 1;
                const cost = currentLvl; // Coste para subir nivel = nivel actual
                const canUpgrade = dups >= cost;
                
                return `
                    <div class="workshop-card-item">
                        <img class="workshop-card-thumb" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'">
                        <div class="workshop-card-details">
                            <h4 class="workshop-card-title">${card.name}</h4>
                            <p class="workshop-card-meta">💼 ${card.occupation} | Nivel: ${'★'.repeat(currentLvl)}${'☆'.repeat(5 - currentLvl)}</p>
                            <div style="font-size:0.75rem; color:#ffd700; margin-bottom:8px; font-weight:bold;">📈 Coste: ${cost} repetidos (Tienes ${dups})</div>
                        </div>
                        <button class="workshop-action-btn" ${!canUpgrade ? 'disabled' : ''} onclick="upgradeDesquicieLevel('${card.id}')">📈 Subir Desquicie</button>
                    </div>
                `;
            }).join("");
        }
    } else if (currentWorkshopTab === 'duos') {
        contentHtml = DUO_RECIPES.map(recipe => {
            const hasDuo = !!userAlbumData.cards[recipe.id];
            
            const ing1Card = ALBUM_CARDS.find(c => c.id === recipe.ingredients[0]);
            const ing2Card = ALBUM_CARDS.find(c => c.id === recipe.ingredients[1]);
            
            const hasIng1 = !!userAlbumData.cards[recipe.ingredients[0]];
            const hasIng2 = !!userAlbumData.cards[recipe.ingredients[1]];
            
            const hasCoins = userAlbumData.coins >= recipe.coinsCost;
            const canFuse = hasIng1 && hasIng2 && hasCoins && !hasDuo;

            return `
                <div class="workshop-card-item" style="border: 1px solid ${hasDuo ? 'rgba(240, 192, 32, 0.45)' : 'rgba(255,255,255,0.06)'}; background: ${hasDuo ? 'rgba(240, 192, 32, 0.03)' : 'rgba(255,255,255,0.02)'};">
                    <div style="display:flex; flex-direction:column; gap:4px; position:relative; width:60px; height:85px; min-width:60px;">
                      <img class="workshop-card-thumb" src="${ing1Card ? ing1Card.image : 'img/personajes/amador-rivas.webp'}" style="width:45px; height:60px; border-radius:5px; position:absolute; top:0; left:0; object-fit:cover;">
                      <img class="workshop-card-thumb" src="${ing2Card ? ing2Card.image : 'img/personajes/berta-escobar.webp'}" style="width:45px; height:60px; border-radius:5px; position:absolute; bottom:0; right:0; object-fit:cover; border-color:#ffd700;">
                    </div>
                    <div class="workshop-card-details">
                        <h4 class="workshop-card-title" style="color:${hasDuo ? '#ffd700' : '#fff'};">${recipe.name}</h4>
                        <p class="workshop-card-meta" style="margin-bottom: 4px;">👥 Ingredientes: 
                          <span style="color:${hasIng1 ? '#4ade80' : '#ef4444'}; font-weight:bold;">${ing1Card ? ing1Card.name.split(' ')[0] : ''} ${hasIng1 ? '✓' : '✗'}</span> y 
                          <span style="color:${hasIng2 ? '#4ade80' : '#ef4444'}; font-weight:bold;">${ing2Card ? ing2Card.name.split(' ')[0] : ''} ${hasIng2 ? '✓' : '✗'}</span>
                        </p>
                        <div style="font-size:0.75rem; color:#60a5fa; font-weight:bold;">🪙 Coste: <span style="color:${hasCoins ? '#ffd700' : '#ef4444'};">${recipe.coinsCost} Monedas</span></div>
                    </div>
                    ${hasDuo ? `
                        <button class="workshop-action-btn" style="background:#15803d; color:#fff;" disabled>✓ Desbloqueado</button>
                    ` : `
                        <button class="workshop-action-btn" ${!canFuse ? 'disabled' : ''} style="background:linear-gradient(135deg, #a855f7, #6366f1); color:#fff;" onclick="fuseDuo('${recipe.id}')">👥 Fusionar Dúo</button>
                    `}
                </div>
            `;
        }).join("");
    }

    overlay.innerHTML = `
      <div class="tcg-shop-container" style="max-width: 900px; width: 95vw; background: radial-gradient(circle at 50% 50%, #171138 0%, #080515 100%); border: 2px solid rgba(124, 58, 237, 0.4); border-radius: 24px; padding: 24px; box-sizing: border-box; position: relative;">
        <button class="auth-x" onclick="closeAllModals(); openAlbumUI();" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
        
        <div style="text-align:left; margin-bottom: 20px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:12px;">
          <h2 style="font-family:'Bebas Neue',sans-serif; color:#c084fc; font-size:2.4rem; letter-spacing:1px; margin:0; text-shadow:0 0 15px rgba(124, 58, 237, 0.3);">🛠️ TALLER DE LA JUNTA VECINAL</h2>
          <p style="color:#94a3b8; font-size:0.95rem; margin:4px 0 0 0;">Consume tus cartas repetidas para conseguir autógrafos premium, subir el nivel de desquicie vecinal y fusionar Dúos Históricos.</p>
        </div>

        <!-- Botones de Pestañas -->
        <div class="workshop-tab-container">
          <button class="workshop-tab-btn ${currentWorkshopTab === 'signatures' ? 'active' : ''}" onclick="switchWorkshopTab('signatures')">✒️ Firmas Premium</button>
          <button class="workshop-tab-btn ${currentWorkshopTab === 'desquicie' ? 'active' : ''}" onclick="switchWorkshopTab('desquicie')">📈 Nivel Desquicie</button>
          <button class="workshop-tab-btn ${currentWorkshopTab === 'duos' ? 'active' : ''}" onclick="switchWorkshopTab('duos')">👥 Dúos Vecinales</button>
        </div>

        <!-- Contenido Principal -->
        <div class="workshop-grid">
          ${contentHtml}
        </div>
      </div>
    `;
}

function switchWorkshopTab(tab) {
    currentWorkshopTab = tab;
    openWorkshopUI();
}

async function upgradeSignature(cardId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const userCard = userAlbumData.cards[cardId];
    if (!userCard || userCard.count < 6) return;

    const db = firebase.database();
    const cardRef = db.ref(`users/${uid}/album/cards/${cardId}`);

    await cardRef.transaction(current => {
        if (current && current.count >= 6) {
            return {
                count: current.count - 5,
                signed: true,
                foil: true,
                level: current.level || 1,
                obtainedAt: firebase.database.ServerValue.TIMESTAMP
            };
        }
        return current;
    });

    if (window.showLqsaAlert) {
        showLqsaAlert("¡El cromo ha sido firmado! Se ha grabado una firma manuscrita y ha ganado +30% de estadísticas de combate.", "¡AUTÓGRAFO COMPLETO! ✒️", "success");
    } else {
        alert("¡Cromo autografiado con éxito! Ha ganado +30% de atributos de duelo.");
    }

    openWorkshopUI();
}

async function upgradeDesquicieLevel(cardId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const userCard = userAlbumData.cards[cardId];
    if (!userCard) return;

    const currentLvl = userCard.level || 1;
    const required = currentLvl; // Coste en repetidos = nivel actual

    if (userCard.count < 1 + required) {
        if (window.showLqsaAlert) showLqsaAlert("No tienes suficientes repetidos para esta mejora.", "MEJORA IMPOSIBLE", "error");
        return;
    }

    const db = firebase.database();
    const cardRef = db.ref(`users/${uid}/album/cards/${cardId}`);

    await cardRef.transaction(current => {
        const lvl = current.level || 1;
        const reqCost = lvl;
        if (current && current.count >= 1 + reqCost && lvl < 5) {
            return {
                count: current.count - reqCost,
                level: lvl + 1,
                signed: !!current.signed,
                foil: !!current.foil,
                obtainedAt: firebase.database.ServerValue.TIMESTAMP
            };
        }
        return current;
    });

    if (window.showLqsaAlert) {
        showLqsaAlert("¡Estrellas de Desquicie aumentadas! El vecino ha ganado +15% de estadísticas de combate.", "¡DESQUICIE AUMENTADO! 📈", "success");
    } else {
        alert("¡Nivel de Desquicie aumentado con éxito!");
    }

    openWorkshopUI();
}

async function fuseDuo(recipeId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const recipe = DUO_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;

    if (userAlbumData.coins < recipe.coinsCost) {
        if (window.showLqsaAlert) showLqsaAlert("No tienes suficientes monedas para fusionar este dúo.", "MONEDAS INSUFICIENTES", "error");
        return;
    }

    const hasIng1 = !!userAlbumData.cards[recipe.ingredients[0]];
    const hasIng2 = !!userAlbumData.cards[recipe.ingredients[1]];
    if (!hasIng1 || !hasIng2) {
        if (window.showLqsaAlert) showLqsaAlert("Te faltan ingredientes en tu álbum para esta fusión.", "INGREDIENTES FALTANTES", "error");
        return;
    }

    const db = firebase.database();
    const userRef = db.ref(`users/${uid}`);

    try {
        // Restar monedas
        await userRef.child('coins').transaction(current => (current || 0) - recipe.coinsCost);
        
        // Agregar carta de Dúo al catálogo del usuario
        await userRef.child(`album/cards/${recipeId}`).set({
            count: 1,
            foil: true,
            level: 1,
            signed: false,
            obtainedAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Registrar progreso de misión
        await progressMission(uid, "open_pack", 1); // Contar como una desbloqueada general

        if (window.showLqsaAlert) {
            showLqsaAlert("¡Fusión completada! El Dúo Histórico ha sido invocado a tu Álbum de la Comunidad.", "¡DÚO DESBLOQUEADO! 👥", "success");
        } else {
            alert("¡Fusión realizada con éxito! Dúo Histórico desbloqueado.");
        }

        openWorkshopUI();
    } catch (e) {
        console.error("Error fusionando dúo:", e);
    }
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

// ==========================================================================
//  DUELO DE CARTAS ONLINE: SISTEMA DE COMBATE TCG POR TURNOS (ESTILO POKEMON)
// ==========================================================================

let localCardDuelDeck = [];
let cardDuelRoomListener = null;

const LQSA_TYPES = {
  "Mayorista": { icon: "🦀", color: "#f87171", element: "Fuego", label: "Mayorista (Fuego)" },
  "León": { icon: "🦁", color: "#facc15", element: "Eléctrico", label: "León (Eléctrico)" },
  "Junta": { icon: "🏢", color: "#c084fc", element: "Psíquico", label: "Junta (Psíquico)" },
  "Inquilino": { icon: "🏠", color: "#4ade80", element: "Planta", label: "Inquilino (Planta)" },
  "Buscavidas": { icon: "💰", color: "#60a5fa", element: "Agua", label: "Buscavidas (Agua)" }
};

const ELEMENT_ADVANTAGES = {
  "Mayorista": { "Inquilino": 1.5, "Junta": 0.5 },
  "León": { "Buscavidas": 1.5, "Mayorista": 0.5 },
  "Junta": { "Inquilino": 1.5, "Buscavidas": 0.5 },
  "Inquilino": { "Buscavidas": 1.5, "León": 0.5 },
  "Buscavidas": { "León": 1.5, "Inquilino": 0.5 }
};

function openCardDuelLobby() {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) {
        if (typeof openLoginModal === 'function') openLoginModal();
        return;
    }

    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;

    overlay.style.display = "flex";
    overlay.style.zIndex = "9999";

    // Cargar mazo guardado localmente
    try {
        const savedDeck = localStorage.getItem(`lqsa_card_duel_deck_${uid}`);
        localCardDuelDeck = savedDeck ? JSON.parse(savedDeck) : [];
    } catch(e) {
        localCardDuelDeck = [];
    }

    // Filtrar únicamente cartas obtenidas del catálogo del usuario
    const ownedCards = ALBUM_CARDS.filter(card => {
        const uCard = userAlbumData.cards[card.id];
        return uCard && uCard.count >= 1;
    });

    renderCardDuelLobbyHtml(overlay, ownedCards);
}

function renderCardDuelLobbyHtml(overlay, ownedCards) {
    const uid = localStorage.getItem('lqsa_user');
    
    // Lista de cromos del inventario
    const inventoryHtml = ownedCards.map(card => {
        const userCard = userAlbumData.cards[card.id] || { level: 1, signed: false };
        const level = userCard.level || 1;
        const signed = !!userCard.signed;
        const inDeck = localCardDuelDeck.includes(card.id);
        const lType = LQSA_TYPES[card.combatType || "Inquilino"];

        return `
            <div class="workshop-card-item" style="border:1px solid ${inDeck ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.06)'}; background:${inDeck ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.02)'}; padding: 10px;">
                <img class="workshop-card-thumb" src="${card.image}" style="width:45px; height:60px; object-fit:cover; border-radius:6px;" onerror="this.src='img/personajes/amador-rivas.webp'">
                <div class="workshop-card-details" style="text-align:left;">
                    <h4 class="workshop-card-title" style="font-size:0.95rem; margin:0 0 2px 0;">${card.name}</h4>
                    <p class="workshop-card-meta" style="font-size:0.75rem; color:#94a3b8; margin:0 0 4px 0;">
                        <span style="color:${lType.color}; font-weight:bold;">${lType.icon} ${lType.element || 'Planta'} - ${card.combatType || 'Inquilino'}</span> | ${'★'.repeat(level)}${'☆'.repeat(5-level)}
                    </p>
                    <div style="font-size:0.72rem; color:#ffd700; font-weight:bold;">❤️ HP Base: ${card.hp} | ⚔️ ATK Base: ${card.atk}</div>
                </div>
                <button class="workshop-action-btn" style="background:${inDeck ? '#ef4444' : '#22c55e'}; color:#fff; font-size:0.75rem; padding: 4px 10px;" onclick="toggleCardDuelDeck('${card.id}')">
                    ${inDeck ? '✕ Quitar' : '➕ Añadir'}
                </button>
            </div>
        `;
    }).join("");

    overlay.innerHTML = `
      <div class="tcg-shop-container" style="max-width: 900px; width: 95vw; background: radial-gradient(circle at 50% 50%, #1a0e1c 0%, #070308 100%); border: 2px solid rgba(220, 38, 38, 0.4); border-radius: 24px; padding: 24px; box-sizing: border-box; position: relative;">
        <button class="auth-x" onclick="closeAllModals(); openAlbumUI();" style="border: 2px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.15); color: #f87171; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; position: absolute; top: 25px; right: 25px; transition: all 0.2s; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);" onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.borderColor='#ef4444'; this.style.transform='scale(1.08)';" onmouseleave="this.style.background='rgba(239, 68, 68, 0.15)'; this.style.borderColor='rgba(239, 68, 68, 0.4)'; this.style.transform='scale(1)';">✕</button>
        
        <div style="text-align:left; margin-bottom: 16px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:12px;">
          <h2 style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:2.4rem; letter-spacing:1px; margin:0; text-shadow:0 0 15px rgba(220, 38, 38, 0.3);">⚔️ ARENA DE DUELOS DE CARTAS TCG</h2>
          <p style="color:#94a3b8; font-size:0.95rem; margin:4px 0 0 0;">Configura tu mazo de combate y reta a tus amigos online en un duelo por turnos estilo Pokémon.</p>
        </div>

        <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:20px; height:50vh; max-height:480px;">
          
          <!-- Lado Izquierdo: Selección del Mazo -->
          <div style="display:flex; flex-direction:column; gap:10px; border-right:1px solid rgba(255,255,255,0.05); padding-right:15px; overflow-y:auto;">
             <h3 style="color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1.25rem; margin:0 0 4px 0; display:flex; justify-content:space-between; align-items:center;">
                <span>🛒 Selecciona tus Vecinos</span>
                <span style="color:#ef4444; font-size:0.95rem; font-weight:bold;">(${localCardDuelDeck.length}/5 cromos)</span>
             </h3>
             <div class="workshop-grid" style="grid-template-columns:1fr; gap:6px; overflow-y:visible;">
                ${ownedCards.length === 0 ? `
                   <p style="color:#94a3b8; font-size:0.88rem; text-align:center; padding:30px;">Aún no tienes cromos en tu colección. ¡Abre sobres en la Tienda para empezar!</p>
                ` : inventoryHtml}
             </div>
          </div>

          <!-- Lado Derecho: Lobby / Matchmaking -->
          <div style="display:flex; flex-direction:column; gap:16px; justify-content:center;">
             
             <!-- Tabla de Ventajas Elementales -->
             <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; font-size:0.75rem; text-align:left;">
                <div style="color:#ef4444; font-weight:bold; margin-bottom:6px; font-size:0.85rem; font-family:'Barlow Condensed',sans-serif;">📋 CLASES Y VENTAJAS ELEMENTALES (x1.5 Daño)</div>
                <div style="display:grid; grid-template-columns: 1fr; gap:3px; color:#cbd5e1; line-height:1.3;">
                  <div>🦀 <strong>Mayorista</strong> vence a 🏠 Inquilino</div>
                  <div>🦁 <strong>León</strong> vence a 💰 Buscavidas</div>
                  <div>🏢 <strong>Junta</strong> vence a 🏠 Inquilino</div>
                  <div>🏠 <strong>Inquilino</strong> vence a 💰 Buscavidas</div>
                  <div>💰 <strong>Buscavidas</strong> vence a 🦁 León</div>
                </div>
             </div>

             <!-- Acciones de Duelo -->
             <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:15px; display:flex; flex-direction:column; gap:12px;">
                
                <!-- Apuesta de Monedas -->
                <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                   <label style="font-family:'Barlow Condensed',sans-serif; color:#ffd700; font-size:0.9rem; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                       <span>🪙 APUESTA DE MONEDAS:</span>
                       <span style="font-size:0.75rem; color:#94a3b8;">Tus Monedas: ${userAlbumData.coins}</span>
                   </label>
                   <input type="number" id="card-duel-bet-input" value="100" min="100" max="${userAlbumData.coins}" step="10" style="background:rgba(0,0,0,0.3); border:1px solid rgba(240,192,32,0.3); border-radius:8px; color:#ffd700; padding:8px 12px; font-size:1rem; font-weight:bold; outline:none; font-family:monospace; width:100%; box-sizing:border-box;">
                </div>

                <button class="workshop-action-btn" style="background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; font-size:1.05rem; padding:10px;" onclick="createCardDuelRoom()">
                    ⚔️ Crear Sala de Combate
                </button>

                <div style="display:flex; align-items:center; gap:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                   <input type="text" id="card-duel-code-input" placeholder="Código de Sala..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 12px; font-size:0.85rem; font-family:monospace; width:60%; outline:none;">
                   <button class="workshop-action-btn" style="background:#4b5563; color:#fff; font-size:0.85rem; padding:8px 12px; width:40%;" onclick="joinCardDuelRoom(document.getElementById('card-duel-code-input').value)">
                       🗝️ Unirse
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    `;
}

function toggleCardDuelDeck(cardId) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const idx = localCardDuelDeck.indexOf(cardId);
    if (idx !== -1) {
        localCardDuelDeck.splice(idx, 1);
    } else {
        if (localCardDuelDeck.length >= 5) {
            if (window.showLqsaAlert) showLqsaAlert("¡Mazo lleno! El mazo de combate TCG admite un máximo de 5 cartas.", "LÍMITE ALCANZADO", "warning");
            else alert("Mazo lleno (máximo 5 cartas).");
            return;
        }
        localCardDuelDeck.push(cardId);
    }

    localStorage.setItem(`lqsa_card_duel_deck_${uid}`, JSON.stringify(localCardDuelDeck));
    openCardDuelLobby();
}

async function createCardDuelRoom() {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid || localCardDuelDeck.length === 0) {
        if (window.showLqsaAlert) showLqsaAlert("Debes elegir al menos 1 carta para tu mazo de combate.", "MAZO VACÍO", "error");
        else alert("Debes seleccionar al menos una carta.");
        return;
    }

    if (userAlbumData.coins < 100) {
        if (window.showLqsaAlert) showLqsaAlert("Necesitas tener al menos 100 monedas para participar en un duelo (apuesta mínima de 100 monedas).", "APUESTA MÍNIMA REQUERIDA", "error");
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
                deckSize: localCardDuelDeck.length
            }
        },
        logs: ["¡Creada sala de duelos de cartas " + roomCode + " con apuesta de " + betAmount + " 🪙!"],
        ts: firebase.database.ServerValue.TIMESTAMP
    };

    await db.ref(`card_duels/${roomCode}`).set(initialRoomState);
    
    // Asignar variables globales de sala para soporte del panel de amigos
    window._duelRoomCode = roomCode;
    window._roomCode = roomCode;
    window._isCardDuel = true;

    listenToCardDuelRoom(roomCode);
}

async function joinCardDuelRoom(roomCode) {
    roomCode = roomCode.trim().toUpperCase();
    if (!roomCode) return;

    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    // Cargar mazo guardado localmente si está vacío en memoria
    if (!localCardDuelDeck || localCardDuelDeck.length === 0) {
        try {
            const savedDeck = localStorage.getItem(`lqsa_card_duel_deck_${uid}`);
            localCardDuelDeck = savedDeck ? JSON.parse(savedDeck) : [];
        } catch(e) {
            localCardDuelDeck = [];
        }
    }

    // Auto-asignación de seguridad si el mazo sigue vacío
    if (localCardDuelDeck.length === 0) {
        const ownedCards = ALBUM_CARDS.filter(card => {
            const uCard = userAlbumData.cards[card.id];
            return uCard && uCard.count >= 1;
        });
        if (ownedCards.length > 0) {
            localCardDuelDeck = ownedCards.slice(0, 5).map(c => c.id);
            localStorage.setItem(`lqsa_card_duel_deck_${uid}`, JSON.stringify(localCardDuelDeck));
        }
    }

    if (localCardDuelDeck.length === 0) {
        if (window.showLqsaAlert) showLqsaAlert("Elige al menos 1 carta de combate en tu mazo antes de unirte.", "MAZO VACÍO", "error");
        else alert("Escribe tu mazo de combate primero.");
        return;
    }

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
        if (window.showLqsaAlert) showLqsaAlert("La sala de combate ya está llena o ha comenzado.", "SALA LLENA", "error");
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
        deckSize: localCardDuelDeck.length
    });

    await db.ref(`card_duels/${roomCode}/status`).set("choosing_decks");
    await db.ref(`card_duels/${roomCode}/logs`).push("¡" + myProfile.username + " se ha unido al combate! Prepárense.");

    window._duelRoomCode = roomCode;
    window._roomCode = roomCode;
    window._isCardDuel = true;

    listenToCardDuelRoom(roomCode);
}

function listenToCardDuelRoom(roomCode) {
    const db = firebase.database();
    const uid = localStorage.getItem('lqsa_user');

    if (cardDuelRoomListener) {
        db.ref(`card_duels/${roomCode}`).off('value', cardDuelRoomListener);
    }

    cardDuelRoomListener = db.ref(`card_duels/${roomCode}`).on('value', snap => {
        const room = snap.val();
        if (!room) return;

        renderCardDuelRoomState(room);
    });
}

function renderCardDuelRoomState(room) {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;

    const uid = localStorage.getItem('lqsa_user');
    const db = firebase.database();

    if (room.status === "waiting") {
        overlay.innerHTML = `
          <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid rgba(220, 38, 38, 0.4); border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center;">
             <h2 style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:2.2rem; letter-spacing:1px; margin:0 0 10px 0;">⚔️ SALA DE RETO CREADA</h2>
             <div style="font-size:2.5rem; font-family:monospace; color:#ffd700; font-weight:bold; letter-spacing:4px; margin:16px 0; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                ${room.code}
             </div>
             <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0; line-height:1.4;">Envía este código de sala a tu amigo, o abre el panel de amigos a la derecha e invítalo de forma directa.</p>
             <div style="display:flex; flex-direction:column; gap:10px;">
                <button class="workshop-action-btn" style="background:#4b5563; color:#fff;" onclick="openFriendsPanel()">
                    👥 Abrir Lista de Amigos
                </button>
                <button class="workshop-action-btn" style="background:#ef4444; color:#fff;" onclick="abandonCardDuelRoom('${room.code}')">
                    ✕ Cancelar Reto
                </button>
             </div>
          </div>
        `;
    } else if (room.status === "choosing_decks") {
        const pUids = Object.keys(room.players);
        const myReady = room.players[uid] ? !!room.players[uid].ready : false;
        
        const opponentUid = pUids.find(id => id !== uid);
        const opponentReady = opponentUid ? !!room.players[opponentUid].ready : false;
        const opponentName = opponentUid ? room.players[opponentUid].username : "Rival";

        overlay.innerHTML = `
          <div class="tcg-shop-container" style="max-width: 550px; width: 95vw; background:#0c091f; border: 2px solid rgba(220, 38, 38, 0.4); border-radius: 24px; padding: 24px; box-sizing: border-box; text-align:center;">
             <h2 style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:2.2rem; letter-spacing:1px; margin:0 0 6px 0;">⚔️ PREPARACIÓN DEL COMBATE</h2>
             <p style="color:#94a3b8; font-size:0.88rem; margin:0 0 20px 0;">Ambos jugadores deben confirmar sus mazos de duelo. Los tamaños de mazo deben coincidir exactamente.</p>

             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:24px;">
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${myReady ? '#4ade80':'rgba(255,255,255,0.06)'}; border-radius:12px; padding:15px;">
                   <div style="font-size:0.85rem; color:#94a3b8;">Tu Estado:</div>
                   <div style="font-size:1.15rem; font-weight:bold; color:${myReady ? '#4ade80' : '#ffd700'}; margin:6px 0;">${myReady ? '✓ LISTO' : '⚡ Eligiendo...'}</div>
                   <div style="font-size:0.8rem; color:#60a5fa;">Mazo: ${localCardDuelDeck.length} cartas</div>
                </div>

                <div style="background:rgba(255,255,255,0.02); border:1px solid ${opponentReady ? '#4ade80':'rgba(255,255,255,0.06)'}; border-radius:12px; padding:15px;">
                   <div style="font-size:0.85rem; color:#94a3b8;">${opponentName}:</div>
                   <div style="font-size:1.15rem; font-weight:bold; color:${opponentReady ? '#4ade80' : '#ffd700'}; margin:6px 0;">${opponentReady ? '✓ LISTO' : '⚡ Eligiendo...'}</div>
                   <div style="font-size:0.8rem; color:#60a5fa;">Mazo: ${opponentUid ? room.players[opponentUid].deckSize : '?'} cartas</div>
                </div>
             </div>

             <div style="display:flex; gap:10px; justify-content:center;">
                <button class="workshop-action-btn" style="background:${myReady ? '#15803d' : '#ef4444'}; color:#fff; font-size:1.05rem; padding:10px 24px;" ${myReady ? 'disabled' : ''} onclick="submitCardDuelDeck('${room.code}')">
                    ${myReady ? '✓ Confirmado' : '🔥 ¡Estoy Listo!'}
                </button>
                <button class="workshop-action-btn" style="background:#4b5563; color:#fff;" onclick="abandonCardDuelRoom('${room.code}')">
                    ✕ Salir
                </button>
             </div>
          </div>
        `;
    } else if (room.status === "fighting") {
        renderCardBattleScreen(room);
    } else if (room.status === "finished") {
        renderCardBattleResultScreen(room);
    }
}

async function submitCardDuelDeck(roomCode) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid || localCardDuelDeck.length === 0) return;

    const db = firebase.database();
    
    // Mapear y escalar mazo de combate TCG
    const mappedDeck = localCardDuelDeck.map(cardId => {
        const card = ALBUM_CARDS.find(c => c.id === cardId);
        const userCard = userAlbumData.cards[cardId] || { level: 1, signed: false };
        
        const level = userCard.level || 1;
        const signed = !!userCard.signed;
        const levelMultiplier = 1 + (level - 1) * 0.15;
        const signedMultiplier = signed ? 1.3 : 1.0;
        
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
            name: card.name,
            image: card.image,
            maxHp: maxHp,
            hp: maxHp,
            atk: atk,
            def: def,
            level: level,
            signed: signed,
            combatType: card.combatType || "Inquilino",
            attacks: scaledAttacks
        };
    });

    const roomRef = db.ref(`card_duels/${roomCode}`);
    await roomRef.child(`players/${uid}/deck`).set(mappedDeck);
    await roomRef.child(`players/${uid}/ready`).set(true);

    // Verificar si ambos están listos
    const snap = await roomRef.once('value');
    const room = snap.val();
    const pUids = Object.keys(room.players);
    if (pUids.length === 2) {
        const p1 = pUids[0];
        const p2 = pUids[1];

        if (room.players[p1].ready && room.players[p2].ready) {
            const size1 = room.players[p1].deck.length;
            const size2 = room.players[p2].deck.length;

            if (size1 === size2) {
                // Iniciar combate
                const battleState = {
                    status: "fighting",
                    turn: room.creator,
                    activeCards: {
                        [p1]: 0,
                        [p2]: 0
                    },
                    logs: ["¡El combate ha comenzado! Turno de " + room.players[room.creator].username]
                };
                await roomRef.update(battleState);
            } else {
                // Desemparejar listos por discrepancia de tamaño de mazo
                await roomRef.child(`players/${p1}/ready`).set(false);
                await roomRef.child(`players/${p2}/ready`).set(false);
                await roomRef.child(`logs`).push("¡Mazos desiguales! Ambos jugadores deben tener el mismo número de cartas.");
                
                if (window.showLqsaAlert) {
                    showLqsaAlert("¡Los mazos deben ser del mismo tamaño! Ajustad vuestras selecciones.", "TAMAÑOS INCOMPATIBLES", "error");
                }
            }
        }
    }
}

async function abandonCardDuelRoom(roomCode) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const db = firebase.database();
    const roomRef = db.ref(`card_duels/${roomCode}`);
    const snap = await roomRef.once('value');
    if (!snap.exists()) return;

    const room = snap.val();
    if (room.creator === uid) {
        // Eliminar sala si el creador abandona
        await roomRef.remove();
    } else {
        // Quitar de lista de jugadores y restablecer estado de espera
        await roomRef.child(`players/${uid}`).remove();
        await roomRef.child(`status`).set("waiting");
    }

    if (cardDuelRoomListener) {
        db.ref(`card_duels/${roomCode}`).off('value', cardDuelRoomListener);
        cardDuelRoomListener = null;
    }

    window._duelRoomCode = null;
    window._roomCode = null;
    window._isCardDuel = false;

    openCardDuelLobby();
}

async function surrenderCardDuel(roomCode) {
    if (!confirm("¿Seguro que quieres rendirte y perder la apuesta de monedas?")) return;

    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const db = firebase.database();
    const roomRef = db.ref(`card_duels/${roomCode}`);

    await roomRef.transaction(room => {
        if (!room || room.status !== "fighting") return room;

        const pUids = Object.keys(room.players);
        const opponentUid = pUids.find(id => id !== uid);

        room.status = "finished";
        room.winner = opponentUid;
        
        const bet = parseInt(room.bet) || 0;
        const extraReward = 50;
        
        if (!room.logs) room.logs = [];
        room.logs.push("🏳️ ¡" + room.players[uid].username + " se ha rendido! Victoria para " + room.players[opponentUid].username + ". Recibe 🪙 +" + (bet + extraReward) + " Monedas.");
        
        const winnerUid = opponentUid;
        const loserUid = uid;

        // Transacción para el ganador: se lleva apuesta + bono de 50
        db.ref(`users/${winnerUid}/coins`).transaction(currentCoins => (currentCoins || 0) + bet + extraReward);
        if (typeof progressMission === 'function') {
            progressMission(winnerUid, "win_duel", 1); // Registrar en la progresión de misiones
        }

        // Transacción para el perdedor: pierde las monedas de la apuesta
        db.ref(`users/${loserUid}/coins`).transaction(currentCoins => Math.max(0, (currentCoins || 0) - bet));

        return room;
    });
}

function renderCardBattleScreen(room) {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;

    const uid = localStorage.getItem('lqsa_user');
    const myUid = uid;
    const pUids = Object.keys(room.players);
    const opponentUid = pUids.find(id => id !== myUid);

    const me = room.players[myUid];
    const opp = room.players[opponentUid];

    const myActiveIdx = room.activeCards[myUid];
    const oppActiveIdx = room.activeCards[opponentUid];

    const myActiveCard = me.deck[myActiveIdx];
    const oppActiveCard = opp.deck[oppActiveIdx];

    const isMyTurn = room.turn === myUid;
    const logList = room.logs || [];
    const recentLogs = logList.slice(-4).reverse();

    // Renderizar Elementos
    const myType = LQSA_TYPES[myActiveCard.combatType || "Inquilino"];
    const oppType = LQSA_TYPES[oppActiveCard.combatType || "Inquilino"];

    // Porcentaje de vida HP
    const myHpPct = Math.round((myActiveCard.hp / myActiveCard.maxHp) * 100);
    const oppHpPct = Math.round((oppActiveCard.hp / oppActiveCard.maxHp) * 100);

    // Listado de cromos en la reserva del banquillo
    const benchHtml = me.deck.map((card, idx) => {
        if (idx === myActiveIdx) return '';
        const alive = card.hp > 0;
        return `
            <div class="bench-item ${alive ? '' : 'defeated'}" onclick="${alive && isMyTurn ? `switchCardDuelActive('${room.code}', ${idx})` : ''}" style="border: 1px solid ${alive ? 'rgba(255,255,255,0.1)' : '#ef4444'}; opacity:${alive ? 1 : 0.4}; cursor:${alive && isMyTurn ? 'pointer' : 'not-allowed'}; padding:4px; border-radius:6px; background:rgba(0,0,0,0.3); display:flex; flex-direction:column; align-items:center; gap:2px; font-size:0.65rem; width:45px; position:relative;">
                <img src="${card.image}" style="width:30px; height:40px; object-fit:cover; border-radius:3px;">
                <div style="font-weight:bold; color:#f87171;">${card.hp}/${card.maxHp}</div>
                ${!alive ? '<div style="position:absolute; inset:0; background:rgba(239,68,68,0.25); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:0.75rem; border-radius:6px;">💀</div>' : ''}
            </div>
        `;
    }).join("");

    overlay.innerHTML = `
      <div class="tcg-shop-container card-duel-battlefield" style="max-width: 900px; width: 95vw; background: radial-gradient(circle at 50% 50%, #0d0a21 0%, #030208 100%); border: 2px solid rgba(220, 38, 38, 0.5); border-radius: 24px; padding: 20px; box-sizing: border-box; display:flex; flex-direction:column; gap:12px; justify-content:space-between; position:relative;">
        
        <!-- Cabecera del Combate -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
           <div style="display:flex; align-items:center; gap:10px;">
               <span style="font-family:'Bebas Neue',sans-serif; color:#ef4444; font-size:1.6rem; letter-spacing:1px;">⚔️ BATALLA DE VECINOS TCG</span>
               <span style="background:rgba(240,192,32,0.15); border:1px solid rgba(240,192,32,0.4); color:#ffd700; font-size:0.78rem; padding:2px 8px; border-radius:20px; font-weight:bold;">💰 APUESTA: ${room.bet || 0} 🪙</span>
           </div>
           <div style="display:flex; align-items:center; gap:8px;">
               <span style="background:${isMyTurn ? '#22c55e' : '#4b5563'}; color:#fff; font-size:0.8rem; padding: 4px 10px; border-radius:30px; font-weight:bold; font-family:'Barlow Condensed',sans-serif; letter-spacing:0.8px;">
                   ${isMyTurn ? '⚡ TU TURNO' : '⏳ TURNO DEL RIVAL'}
               </span>
               <button class="workshop-action-btn" style="background:#ef4444; color:#fff; font-size:0.78rem; padding: 4px 10px; margin: 0; font-family:'Barlow Condensed',sans-serif; font-weight:bold; border-radius:30px; border:1px solid rgba(255,255,255,0.1);" onclick="surrenderCardDuel('${room.code}')">🏳️ Rendirse</button>
           </div>
        </div>

        <!-- Escenario Principal (Combate Pokémon) -->
        <div style="display:flex; flex-direction:column; gap:16px; flex:1; justify-content:center;">
           
           <!-- Lado Superior: Carta Enemiga -->
           <div style="display:flex; align-items:center; justify-content:flex-end; gap:20px; padding: 10px 30px;">
              
              <!-- Info de Vida Enemiga -->
              <div style="text-align:right; width: 240px;">
                 <div style="font-weight:bold; font-size:1.05rem; display:flex; justify-content:flex-end; gap:8px; align-items:center;">
                    <span>${oppActiveCard.name}</span>
                    <span style="background:${oppType.color}; font-size:0.7rem; padding:2px 6px; border-radius:4px; color:#fff;">${oppType.icon} ${oppType.element || 'Planta'} - ${oppActiveCard.combatType}</span>
                 </div>
                 <div style="font-size:0.75rem; color:#94a3b8; margin: 2px 0 4px 0;">Nivel ${'★'.repeat(oppActiveCard.level)} ${oppActiveCard.signed ? '✒️ FIRMADA' : ''}</div>
                 <div style="width:100%; height:10px; background:rgba(255,255,255,0.08); border-radius:30px; overflow:hidden; border:1px solid rgba(255,255,255,0.12);">
                    <div style="width:${oppHpPct}%; height:100%; background:${oppHpPct > 50 ? '#22c55e' : (oppHpPct > 20 ? '#eab308' : '#ef4444')}; transition:all 0.3s;"></div>
                 </div>
                 <div style="font-size:0.78rem; font-family:monospace; font-weight:bold; margin-top:2px; color:#ef4444;">❤️ HP: ${oppActiveCard.hp}/${oppActiveCard.maxHp}</div>
              </div>

              <!-- Retrato Enemigo -->
              <div style="width: 75px; height: 105px; border-radius:8px; border:2px solid ${oppType.color}; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                 <img src="${oppActiveCard.image}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='img/personajes/amador-rivas.webp'">
              </div>
           </div>

           <!-- Lado Inferior: Carta Jugador -->
           <div style="display:flex; align-items:center; justify-content:flex-start; gap:20px; padding: 10px 30px; border-top: 1px solid rgba(255,255,255,0.02);">
              
              <!-- Retrato Jugador -->
              <div style="width: 75px; height: 105px; border-radius:8px; border:2px solid ${myType.color}; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                 <img src="${myActiveCard.image}" style="width:100%; height:100%; object-fit:cover; object-position:top;" onerror="this.src='img/personajes/amador-rivas.webp'">
              </div>

              <!-- Info de Vida Jugador -->
              <div style="text-align:left; width: 240px;">
                 <div style="font-weight:bold; font-size:1.05rem; display:flex; gap:8px; align-items:center;">
                    <span>${myActiveCard.name}</span>
                    <span style="background:${myType.color}; font-size:0.7rem; padding:2px 6px; border-radius:4px; color:#fff;">${myType.icon} ${myType.element || 'Planta'} - ${myActiveCard.combatType}</span>
                 </div>
                 <div style="font-size:0.75rem; color:#94a3b8; margin: 2px 0 4px 0;">Nivel ${'★'.repeat(myActiveCard.level)} ${myActiveCard.signed ? '✒️ FIRMADA' : ''}</div>
                 <div style="width:100%; height:10px; background:rgba(255,255,255,0.08); border-radius:30px; overflow:hidden; border:1px solid rgba(255,255,255,0.12);">
                    <div style="width:${myHpPct}%; height:100%; background:${myHpPct > 50 ? '#22c55e' : (myHpPct > 20 ? '#eab308' : '#ef4444')}; transition:all 0.3s;"></div>
                 </div>
                 <div style="font-size:0.78rem; font-family:monospace; font-weight:bold; margin-top:2px; color:#4ade80;">❤️ HP: ${myActiveCard.hp}/${myActiveCard.maxHp}</div>
              </div>
           </div>
        </div>

        <!-- Consola de Logs e Interacción de Turno -->
        <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:16px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:15px;">
           
           <!-- Consola de Historial de Ataques -->
           <div class="battle-logs-console" style="text-align:left; font-family:monospace; border-radius:10px; background:rgba(0,0,0,0.3); padding:8px 12px; height:100px; overflow-y:auto; font-size:0.78rem; border:1px solid rgba(255,255,255,0.04); display:flex; flex-direction:column; gap:4px;">
              ${recentLogs.map((log, index) => {
                  let color = "#cbd5e1";
                  if (log.includes("Súper Efectivo")) color = "#ffd700";
                  else if (log.includes("derrotado")) color = "#f87171";
                  else if (log.includes("ganado")) color = "#4ade80";
                  return `<div style="color:${color}; opacity:${index === 0 ? 1 : 0.65}; font-weight:${index === 0 ? 'bold' : 'normal'};">> ${log}</div>`;
              }).join("")}
           </div>

           <!-- Acciones de Combate: Ataques o Banquillo -->
           <div style="display:flex; flex-direction:column; gap:8px;">
              
              <!-- Ataques Disponibles -->
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                 ${(myActiveCard.attacks || []).map((atk, idx) => {
                     return `
                         <button class="workshop-action-btn" style="background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; font-size:0.85rem; padding:8px; line-height:1.2; text-align:left;" ${!isMyTurn || myActiveCard.hp <= 0 ? 'disabled' : ''} onclick="executeCardDuelAttack('${room.code}', ${idx})">
                             <div style="font-weight:bold; font-family:'Barlow Condensed',sans-serif; font-size:0.95rem;">💥 ${atk.name}</div>
                             <div style="font-size:0.7rem; color:#ffd700;">Daño: ${atk.power} ATK</div>
                         </button>
                     `;
                 }).join("")}
              </div>

              <!-- Reserva del Banquillo (Click to Swap) -->
              <div style="display:flex; align-items:center; gap:6px; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; margin-top:2px;">
                 <span style="font-size:0.75rem; color:#94a3b8; font-weight:bold;">🔄 Banquillo:</span>
                 <div style="display:flex; gap:6px;">
                    ${benchHtml || '<span style="font-size:0.7rem; color:#64748b;">Mazo vacío.</span>'}
                 </div>
              </div>
           </div>
        </div>
      </div>
    `;

    // Si la carta activa actual está muerta y es mi turno, forzar cambio de carta bloqueando ataques
    if (myActiveCard.hp <= 0) {
        // Encontrar primera carta consciente
        const nextAliveIdx = me.deck.findIndex(c => c.hp > 0);
        if (nextAliveIdx !== -1) {
            // Forzar reemplazo automático inmediato
            switchCardDuelActive(room.code, nextAliveIdx);
        }
    }
}

async function executeCardDuelAttack(roomCode, attackIndex) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const db = firebase.database();
    const roomRef = db.ref(`card_duels/${roomCode}`);
    
    await roomRef.transaction(room => {
        if (!room || room.status !== "fighting" || room.turn !== uid) return room;

        const pUids = Object.keys(room.players);
        const opponentUid = pUids.find(id => id !== uid);

        const me = room.players[uid];
        const opp = room.players[opponentUid];

        const myActiveIdx = room.activeCards[uid];
        const oppActiveIdx = room.activeCards[opponentUid];

        const myCard = me.deck[myActiveIdx];
        const oppCard = opp.deck[oppActiveIdx];

        if (myCard.hp <= 0 || oppCard.hp <= 0) return room;

        const attack = myCard.attacks[attackIndex];
        const baseDmg = attack.power;

        // Calcular ventajas elementales
        let mult = 1.0;
        const attType = myCard.combatType || "Inquilino";
        const oppType = oppCard.combatType || "Inquilino";
        
        if (ELEMENT_ADVANTAGES[attType] && ELEMENT_ADVANTAGES[attType][oppType] !== undefined) {
            mult = ELEMENT_ADVANTAGES[attType][oppType];
        }

        // Reducción por Defensa
        const defRed = 1 - (oppCard.def / 350);
        let finalDmg = Math.round(baseDmg * mult * defRed);
        if (finalDmg < 10) finalDmg = 10;

        // Aplicar daño
        oppCard.hp = Math.max(0, oppCard.hp - finalDmg);

        // Registro de log
        let logMsg = "¡" + myCard.name.split(' ')[0] + " usó " + attack.name + "! Hizo " + finalDmg + " de daño a " + oppCard.name.split(' ')[0] + ".";
        if (mult > 1.0) logMsg += " 💥 ¡Súper Efectivo!";
        if (mult < 1.0) logMsg += " 🛡️ No es muy efectivo...";

        if (oppCard.hp <= 0) {
            logMsg += " 💀 ¡" + oppCard.name.split(' ')[0] + " derrotado/a!";
        }

        if (!room.logs) room.logs = [];
        room.logs.push(logMsg);

        // Comprobar si el oponente ha perdido todas sus cartas
        const anyAlive = opp.deck.some(c => c.hp > 0);
        if (!anyAlive) {
            room.status = "finished";
            room.winner = uid;
            const bet = parseInt(room.bet) || 0;
            const extraReward = 50;
            room.logs.push("🏆 ¡" + me.username + " ha ganado el duelo de cartas! Recibe 🪙 +" + (bet + extraReward) + " Monedas (Apuesta + Bono)");
            
            const winnerUid = uid;
            const loserUid = opponentUid;

            // Transacción para el ganador: se lleva apuesta + bono de 50
            db.ref(`users/${winnerUid}/coins`).transaction(currentCoins => (currentCoins || 0) + bet + extraReward);
            if (typeof progressMission === 'function') {
                progressMission(winnerUid, "win_duel", 1); // Registrar en la progresión de misiones
            }

            // Transacción para el perdedor: pierde las monedas de la apuesta
            db.ref(`users/${loserUid}/coins`).transaction(currentCoins => Math.max(0, (currentCoins || 0) - bet));

            return room;
        }

        // Si la carta del oponente murió, forzar auto-switch a la primera viva
        if (oppCard.hp <= 0) {
            const nextAliveIdx = opp.deck.findIndex(c => c.hp > 0);
            if (nextAliveIdx !== -1) {
                room.activeCards[opponentUid] = nextAliveIdx;
                room.logs.push("🔄 ¡" + opp.username + " envía a " + opp.deck[nextAliveIdx].name.split(' ')[0] + " al combate!");
            }
        }

        // Cambiar turno
        room.turn = opponentUid;
        return room;
    });
}

async function switchCardDuelActive(roomCode, benchIndex) {
    const uid = localStorage.getItem('lqsa_user');
    if (!uid) return;

    const db = firebase.database();
    const roomRef = db.ref(`card_duels/${roomCode}`);

    await roomRef.transaction(room => {
        if (!room || room.status !== "fighting" || room.turn !== uid) return room;

        const me = room.players[uid];
        const nextCard = me.deck[benchIndex];

        if (!nextCard || nextCard.hp <= 0) return room;

        const oldCard = me.deck[room.activeCards[uid]];

        room.activeCards[uid] = benchIndex;
        
        if (!room.logs) room.logs = [];
        room.logs.push("🔄 " + me.username + " retira a " + oldCard.name.split(' ')[0] + " y saca a " + nextCard.name.split(' ')[0] + "!");

        // Cambiar turno
        const pUids = Object.keys(room.players);
        const opponentUid = pUids.find(id => id !== uid);
        room.turn = opponentUid;

        return room;
    });
}

function renderCardBattleResultScreen(room) {
    const overlay = document.getElementById("auth-modal");
    if (!overlay) return;

    const uid = localStorage.getItem('lqsa_user');
    const db = firebase.database();
    const isWinner = room.winner === uid;
    const bet = parseInt(room.bet) || 0;
    const extraReward = 50;
    
    // Mostrar aviso emergente de pérdida o victoria estilo LQSA en ambos clientes
    if (!window._duelResultAlertShown || window._duelResultAlertShown !== room.code) {
        window._duelResultAlertShown = room.code;
        setTimeout(() => {
            if (isWinner) {
                if (window.showLqsaAlert) {
                    showLqsaAlert(`¡Enhorabuena! Has ganado el duelo: +${bet + extraReward} monedas (apuesta de ${bet} + 50 de bono de victoria).`, "¡VICTORIA VECINAL!", "success");
                }
            } else {
                if (window.showLqsaAlert) {
                    showLqsaAlert(`¡Has perdido el combate! Se te han restado ${bet} monedas de la apuesta de tu cuenta.`, "¡DERROTA VECINAL!", "error");
                }
            }
        }, 300);
    }

    overlay.innerHTML = `
      <div class="tcg-shop-container" style="max-width: 500px; width: 95vw; background:#080515; border: 2px solid ${isWinner ? '#4ade80':'#ef4444'}; border-radius: 24px; padding: 30px; box-sizing: border-box; text-align:center;">
         <div style="font-size:4rem; margin-bottom:12px;">${isWinner ? '🏆' : '💀'}</div>
         <h2 style="font-family:'Bebas Neue',sans-serif; color:${isWinner ? '#4ade80':'#ef4444'}; font-size:2.6rem; letter-spacing:1px; margin:0 0 10px 0;">
             ${isWinner ? '¡VICTORIA VECINAL!' : '¡DERROTA COMUNITARIA!'}
         </h2>
         <p style="color:#cbd5e1; font-size:0.95rem; margin:0 0 20px 0; line-height:1.4;">
             ${isWinner ? 'Has derrotado al mazo del rival con maestría. La Junta de Propietarios te recompensa con creces.' : 'Tus vecinos han caído desquiciados. ¡Sube sus niveles de desquicie y dales autógrafos para la próxima!'}
         </p>
         
         ${isWinner ? `
            <div style="background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:12px; padding:15px; margin-bottom:20px;">
               <div style="font-size:0.85rem; color:#4ade80; font-weight:bold;">🪙 RECOMPENSA DE DUELO</div>
               <div style="font-size:1.8rem; font-family:'Bebas Neue',sans-serif; color:#ffd700; margin-top:4px;">+${bet + extraReward} MONEDAS</div>
               <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">(Apuesta de ${bet} + Bono de victoria de ${extraReward})</div>
            </div>
         ` : `
            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:15px; margin-bottom:20px;">
               <div style="font-size:0.85rem; color:#ef4444; font-weight:bold;">💀 APUESTA PERDIDA</div>
               <div style="font-size:1.8rem; font-family:'Bebas Neue',sans-serif; color:#f87171; margin-top:4px;">-${bet} MONEDAS</div>
            </div>
         `}

         <button class="workshop-action-btn" style="background:${isWinner ? '#22c55e':'#ef4444'}; color:#fff; font-size:1.05rem; padding:10px 24px;" onclick="closeAllModals(); openAlbumUI();">
             ✓ Volver al Álbum
         </button>
      </div>
    `;

    // Limpiar listeners de la sala
    if (cardDuelRoomListener) {
        db.ref(`card_duels/${room.code}`).off('value', cardDuelRoomListener);
        cardDuelRoomListener = null;
    }
}