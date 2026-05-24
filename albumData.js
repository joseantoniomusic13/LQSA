/* ════════════════════════════════════════════════════════
   LQSACatena — Datos del Álbum, Rarezas y Familias
   ════════════════════════════════════════════════════════ */

const CARD_RARITIES = {
    COMMON: { id: "common", name: "⚪ Común", color: "#9ca3af", prob: 0.60 },
    RARE: { id: "rare", name: "🔵 Rara", color: "#3b82f6", prob: 0.25 },
    EPIC: { id: "epic", name: "🟣 Épica", color: "#a855f7", prob: 0.12 },
    LEGENDARY: { id: "legendary", name: "🟡 Legendaria", color: "#eab308", prob: 0.025 },
    FOIL: { id: "foil", name: "🌈 Holográfica", color: "linear-gradient(45deg, #ff0055, #00ff55, #0055ff, #ff0055)", prob: 0.005 }
};

// Asignación dinámica de rarezas basada en el archivo characters.js externo
function getCardRarity(char) {
    if (char.tipo === "Principal") {
        if (char.temporadaAparicion === 1 && char.hijos >= 1 && (char.nombre.includes("Recio") || char.nombre.includes("Rivas") || char.nombre.includes("Maroto") || char.nombre.includes("Pastor"))) {
            return CARD_RARITIES.LEGENDARY;
        }
        return CARD_RARITIES.EPIC;
    }
    if (char.tipo === "Secundario") return CARD_RARITIES.RARE;
    return CARD_RARITIES.COMMON; // Episódico / Esporádico
}

// Mapeo estructurado de familias/sets para el Álbum Completo
const CARD_FAMILIES = {
    "Recio": ["Antonio Recio", "Berta Escobar", "Alba Recio", "Violeta Recio"],
    "Cuquis": ["Amador Rivas", "Maite Figueroa", "Teodoro Rivas", "Amador Rivas Jr.", "Carlota Rivas", "Justiniana Latorre"],
    "Maroto-Trujillo": ["Javier Maroto", "Lola Trujillo", "Vicente Maroto", "Gregoria Gutiérrez", "Estela Reynolds", "Fermín Trujillo"],
    "Pastor": ["Enrique Pastor", "Araceli Madariaga", "Judith Becker", "Julián Pastor", "Francisco Javier"]
};

// Generar lista de cartas indexadas
const ALBUM_CARDS = ALL_CHARACTERS.map((char, index) => {
    const slug = char.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return {
        id: slug,
        number: String(index + 1).padStart(3, '0'),
        name: char.nombre,
        occupation: char.ocupacion[0] || "Desconocido",
        season: `T${char.temporadaAparicion}`,
        type: char.tipo,
        quote: char.frase[0] || "...",
        image: `img/personajes/${slug}.webp`,
        baseRarity: getCardRarity(char)
    };
});

// Añadir Carta Especial Antonio Recio Oro
ALBUM_CARDS.push({
    id: "antonio-recio-oro",
    number: String(ALBUM_CARDS.length + 1).padStart(3, '0'),
    name: "Antonio Recio Oro",
    occupation: "Mayorista de Marisco",
    season: "T1",
    type: "Principal",
    quote: "¡Marisco Recio, al mayorista no limpio pescado!",
    image: "img-cartas/antonio-recio-oro.webp",
    baseRarity: CARD_RARITIES.FOIL
});