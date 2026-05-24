/* ════════════════════════════════════════════════════════
   LQSACatena — Motor de Intercambios en Directo (Real-Time Trade Table)
   ════════════════════════════════════════════════════════ */

let _activeTradeId = null;
let _myTradeRole = null; // "player1" o "player2"
let _friendTradeRole = null; // "player2" o "player1"
let _tradeListener = null;

// Alertas visuales premium personalizadas (reemplaza alert nativo)
function showLqsaAlert(message, title = "AVISO VECINAL", type = "info") {
    const existing = document.getElementById("lqsa-custom-alert");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "lqsa-custom-alert";
    overlay.className = "auth-overlay";
    overlay.style.zIndex = "20000"; 
    overlay.style.background = "rgba(10, 6, 22, 0.85)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    let icon = "🔔";
    let color = "var(--accent)";
    if (type === "success") {
        icon = "🎉";
        color = "#10b981";
    } else if (type === "error") {
        icon = "⚠️";
        color = "#ef4444";
    }

    overlay.innerHTML = `
      <div class="auth-box" style="width: min(400px, 90vw); padding: 25px; border: 2px solid ${color}; background: #0c0817; text-align: center; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: packFloat 0.3s ease-out;">
        <div style="font-size: 3rem; margin-bottom: 10px;">${icon}</div>
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; margin: 0; color: ${color}; letter-spacing: 1.5px; text-transform: uppercase;">${title}</h3>
        <p style="color: #e2e8f0; font-size: 0.95rem; margin-top: 15px; line-height: 1.5; font-family: 'Barlow Condensed', sans-serif;">${message}</p>
        <button class="auth-btn" style="background: ${color}; color: ${type === 'success' || type === 'error' ? '#fff' : '#000'}; font-weight: bold; width: 100%; margin-top: 20px; font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 1.2px; box-shadow: 0 4px 12px ${color}40; margin-left: 0; margin-right: 0;" onclick="document.getElementById('lqsa-custom-alert').remove()">ENTENDIDO</button>
      </div>
    `;

    document.body.appendChild(overlay);
}
window.showLqsaAlert = showLqsaAlert;

// Iniciar una propuesta de intercambio en vivo (Proponente - Player1)
async function startLiveTradeSession(friendUid, friendName) {
    const myUid = localStorage.getItem('lqsa_user');
    if (!myUid || typeof firebase === 'undefined') return;

    const db = firebase.database();
    const tradeRef = db.ref(`trades`).push();

    const tradeSession = {
        player1: myUid,
        player1Name: currentUserProfile.username,
        player1Offer: "",
        player1Accepted: false,
        player2: friendUid,
        player2Name: friendName,
        player2Offer: "",
        player2Accepted: false,
        status: "pending",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    await tradeRef.set(tradeSession);

    // Enviar invitación en tiempo real al buzón del amigo
    await db.ref(`users/${friendUid}/invitations`).push({
        from: myUid,
        fromName: currentUserProfile.username,
        fromAvatar: currentUserProfile.avatar || 'img/personajes/amador-rivas.webp',
        roomCode: tradeRef.key, // ID de la sala de intercambio
        mode: "trade",
        ts: firebase.database.ServerValue.TIMESTAMP
    });

    // Abrir inmediatamente la mesa de intercambio en vivo
    openLiveTradeLobby(tradeRef.key, "player1");
}

// Aceptar invitación de intercambio e ingresar a la mesa (Receptor - Player2)
async function acceptTradeInvitation(tradeId, invitationKey) {
    const myUid = localStorage.getItem('lqsa_user');
    if (!myUid || typeof firebase === 'undefined') return;

    const db = firebase.database();

    // Eliminar invitación del listado
    await db.ref(`users/${myUid}/invitations/${invitationKey}`).remove();

    // Eliminar el toast visual si existe
    const toast = document.getElementById(`inv-toast-${invitationKey}`);
    if (toast) toast.remove();

    // Cambiar estado a abierto ("open") para notificar al jugador 1 que ya entramos
    await db.ref(`trades/${tradeId}/status`).set("open");

    // Abrir la mesa de intercambio en vivo
    openLiveTradeLobby(tradeId, "player2");
}

// Rechazar o Cancelar intercambio activo
async function cancelActiveTrade() {
    if (!_activeTradeId || typeof firebase === 'undefined') return;

    const db = firebase.database();
    const tradeId = _activeTradeId;

    // Desvincular listener local
    if (_tradeListener) {
        db.ref(`trades/${tradeId}`).off('value', _tradeListener);
        _tradeListener = null;
    }

    _activeTradeId = null;

    try {
        const snap = await db.ref(`trades/${tradeId}`).once('value');
        if (snap.exists()) {
            const trade = snap.val();
            if (trade.status !== "accepted") {
                await db.ref(`trades/${tradeId}/status`).set("cancelled");
            }
        }
    } catch (e) {
        console.error("Error al cancelar trato:", e);
    }

    // Remover modal
    const modal = document.getElementById("live-trade-modal");
    if (modal) modal.remove();
}

// Abrir la mesa de intercambio visual interactivo (UI)
function openLiveTradeLobby(tradeId, role) {
    closeAllModals();

    _activeTradeId = tradeId;
    _myTradeRole = role;
    _friendTradeRole = (role === "player1") ? "player2" : "player1";

    const overlay = document.createElement("div");
    overlay.id = "live-trade-modal";
    overlay.className = "auth-overlay";
    overlay.style.zIndex = "15000";
    overlay.style.background = "rgba(10, 6, 22, 0.97)";
    overlay.style.backdropFilter = "blur(12px)";

    overlay.innerHTML = `
      <div class="auth-box" style="width: min(780px, 96vw); padding: 25px; border: 2px solid var(--accent); background: #0c0817; max-height: 90vh; overflow-y: auto;">
        
        <div class="live-trade-container" style="display:flex; flex-direction:column; gap:20px; width:100%; color:#fff;">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2.2rem; color:var(--accent); margin:0; letter-spacing:1px;">🤝 INTERCAMBIO VECINAL EN VIVO</h2>
            <span id="trade-status-badge" style="background:#2563eb; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px; animation: pulseInstruction 1.5s infinite;">EN VIVO</span>
          </div>

          <div class="trade-table" style="display:flex; gap:20px; width:100%; justify-content:center; flex-wrap:wrap; margin-top:10px;">
            
            <!-- MI ÁREA -->
            <div class="trade-side my-side" style="flex:1; min-width:280px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-height: 380px;">
              <h3 style="font-family:'Barlow Condensed',sans-serif; font-size: 1.25rem; font-weight: bold; color:#a855f7; margin:0 0 12px; letter-spacing: 1px; text-transform: uppercase;">TU OFRENDA</h3>
              
              <!-- Zona de Drop -->
              <div id="my-drop-zone" class="trade-drop-zone" 
                   style="width:160px; height:240px; border:2px dashed rgba(168,85,247,0.4); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(168,85,247,0.03); transition:all 0.2s; position:relative;"
                   ondragover="event.preventDefault(); this.style.background='rgba(168,85,247,0.1)';"
                   ondragleave="this.style.background='rgba(168,85,247,0.03)';"
                   ondrop="handleTradeDrop(event)">
                <span style="font-size:2.8rem; opacity:0.4;">🎴</span>
                <span style="font-size:0.75rem; color:#a080c0; text-align:center; padding:10px 15px; line-height:1.4; font-family:'Barlow Condensed', sans-serif;">Arrastra un cromo aquí<br>o haz clic en uno abajo</span>
              </div>
              
              <div style="margin-top:15px; width:100%;">
                <button id="my-accept-btn" class="auth-btn" disabled style="width:100%; margin:0; background:#374151; color:#9ca3af; font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:1px; cursor:not-allowed;" onclick="toggleAcceptTrade()">ACEPTAR TRATO</button>
                <div id="my-accept-status" style="font-size:0.8rem; color:#a0a0a0; margin-top:6px; text-align:center; font-family: monospace;">Esperando cromo...</div>
              </div>
            </div>

            <!-- FLECHAS CENTRALES -->
            <div style="display:flex; align-items:center; justify-content:center; font-size:3rem; color:var(--accent); text-shadow: 0 0 10px rgba(240,192,32,0.3);">
              🔄
            </div>

            <!-- ÁREA DEL AMIGO -->
            <div class="trade-side friend-side" style="flex:1; min-width:280px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-height: 380px;">
              <h3 style="font-family:'Barlow Condensed',sans-serif; font-size: 1.25rem; font-weight: bold; color:#3b82f6; margin:0 0 12px; letter-spacing: 1px; text-transform: uppercase;" id="trade-friend-title">OFRENDA DEL VECINO</h3>
              
              <!-- Slot Amigo -->
              <div id="friend-drop-zone" style="width:160px; height:240px; border:2px solid rgba(255,255,255,0.05); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.25); position:relative; transition: all 0.3s ease;">
                <span style="font-size:2.8rem; opacity:0.2;">⏳</span>
                <span style="font-size:0.75rem; color:#6b7280; text-align:center; padding:10px 15px; font-family:'Barlow Condensed', sans-serif;">Esperando a que el vecino coloque un cromo...</span>
              </div>
              
              <div style="margin-top:15px; width:100%;">
                <div id="friend-accept-badge" style="width:100%; text-align:center; padding:10px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); font-family:'Bebas Neue',sans-serif; font-size:1.2rem; color:#71717a; letter-spacing: 1px; text-transform: uppercase;">PENSANDO...</div>
                <div id="friend-accept-status" style="font-size:0.8rem; color:#a0a0a0; margin-top:6px; text-align:center; font-family: monospace;">Esperando cromo...</div>
              </div>
            </div>

          </div>

          <!-- MIS CROMOS DUPLICADOS -->
          <div style="display:flex; flex-direction:column; text-align:left; gap:8px; margin-top: 10px;">
            <h4 style="margin:0; font-family:'Barlow Condensed',sans-serif; font-size:1.15rem; letter-spacing:1px; color:#c084fc; font-weight: bold; text-transform: uppercase;">📦 TUS CROMOS REPETIDOS (Arrastra o haz clic para proponer):</h4>
            <div id="trade-inventory-grid" style="display:flex; gap:14px; overflow-x:auto; padding:12px; width:100%; min-height:165px; background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); scrollbar-width: thin; scrollbar-color: var(--accent) transparent;">
              <!-- Cargado dinámicamente -->
            </div>
          </div>

          <!-- BOTÓN CANCELAR -->
          <div style="margin-top: 10px; width:100%; display:flex; justify-content:center;">
            <button class="auth-btn" style="background:#dc2626; color:#fff; font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:1px; padding:8px 24px; min-width: 180px; margin: 0;" onclick="cancelActiveTrade()">CANCELAR TRATO ✕</button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Cargar mis repetidos en el inventario inferior
    _renderTradeInventory();

    // Conectar Listener de Firebase en tiempo real
    const db = firebase.database();
    _tradeListener = db.ref(`trades/${tradeId}`).on('value', snap => {
        if (!snap.exists()) {
            cancelActiveTrade();
            return;
        }

        const trade = snap.val();

        // 1. Manejar Estados Terminales
        if (trade.status === "cancelled") {
            db.ref(`trades/${tradeId}`).off('value', _tradeListener);
            _tradeListener = null;
            const modal = document.getElementById("live-trade-modal");
            if (modal) modal.remove();
            showLqsaAlert("El otro vecino ha cancelado el intercambio.", "INTERCAMBIO CANCELADO", "error");
            return;
        }

        if (trade.status === "accepted") {
            db.ref(`trades/${tradeId}`).off('value', _tradeListener);
            _tradeListener = null;
            const modal = document.getElementById("live-trade-modal");
            if (modal) modal.remove();
            
            // Confeti y Éxito
            if (typeof confetti === "function") {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
            showLqsaAlert("Las cartas se han transferido a vuestros álbumes automáticamente.", "¡TRATO HECHO! 🎉", "success");
            return;
        }

        // Actualizar título del Amigo
        const friendTitle = document.getElementById("trade-friend-title");
        if (friendTitle) {
            const friendName = (role === "player1") ? trade.player2Name : trade.player1Name;
            friendTitle.textContent = `OFRENDA DE ${friendName.toUpperCase()}`;
        }

        // 2. Renderizar mi ranura de cromo
        const myOffer = trade[`${_myTradeRole}Offer`];
        const myZone = document.getElementById("my-drop-zone");
        if (myZone) {
            if (myOffer) {
                myZone.innerHTML = renderMiniCard(myOffer, true); // true para permitir cambio
                myZone.style.border = "none";
                myZone.style.background = "transparent";
            } else {
                myZone.innerHTML = `
                  <span style="font-size:2.8rem; opacity:0.4;">🎴</span>
                  <span style="font-size:0.75rem; color:#a080c0; text-align:center; padding:10px 15px; line-height:1.4; font-family:'Barlow Condensed', sans-serif;">Arrastra un cromo aquí<br>o haz clic en uno abajo</span>
                `;
                myZone.style.border = "2px dashed rgba(168,85,247,0.4)";
                myZone.style.background = "rgba(168,85,247,0.03)";
            }
        }

        // 3. Renderizar la ranura del cromo del amigo
        const friendOffer = trade[`${_friendTradeRole}Offer`];
        const friendZone = document.getElementById("friend-drop-zone");
        if (friendZone) {
            if (friendOffer) {
                friendZone.innerHTML = renderMiniCard(friendOffer, false); // false para evitar interacción en su zona
                friendZone.style.border = "none";
                friendZone.style.background = "transparent";
            } else {
                friendZone.innerHTML = `
                  <span style="font-size:2.8rem; opacity:0.2;">⏳</span>
                  <span style="font-size:0.75rem; color:#6b7280; text-align:center; padding:10px 15px; font-family:'Barlow Condensed', sans-serif;">Esperando a que el vecino coloque un cromo...</span>
                `;
                friendZone.style.border = "2px solid rgba(255,255,255,0.05)";
                friendZone.style.background = "rgba(0,0,0,0.25)";
            }
        }

        // 4. Actualizar botones de aceptación
        const myAcceptBtn = document.getElementById("my-accept-btn");
        const myStatusText = document.getElementById("my-accept-status");
        
        // Habilitar botón de aceptar solo si ambos colocaron algo
        const canAccept = !!(trade.player1Offer && trade.player2Offer);

        if (myAcceptBtn) {
            if (canAccept) {
                myAcceptBtn.disabled = false;
                if (trade[`${_myTradeRole}Accepted`]) {
                    myAcceptBtn.textContent = "DESHACER ACEPTACIÓN";
                    myAcceptBtn.style.background = "linear-gradient(135deg, #f97316, #ea580c)";
                    myAcceptBtn.style.color = "#fff";
                    myAcceptBtn.style.cursor = "pointer";
                } else {
                    myAcceptBtn.textContent = "ACEPTAR TRATO";
                    myAcceptBtn.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";
                    myAcceptBtn.style.color = "#fff";
                    myAcceptBtn.style.cursor = "pointer";
                }
            } else {
                myAcceptBtn.disabled = true;
                myAcceptBtn.textContent = "ACEPTAR TRATO";
                myAcceptBtn.style.background = "#374151";
                myAcceptBtn.style.color = "#9ca3af";
                myAcceptBtn.style.cursor = "not-allowed";
            }
        }

        if (myStatusText) {
            if (!trade[`${_myTradeRole}Offer`]) {
                myStatusText.textContent = "Elige tu cromo repetido";
                myStatusText.style.color = "#a0a0a0";
            } else if (!canAccept) {
                myStatusText.textContent = "Esperando que el vecino coloque cromo";
                myStatusText.style.color = "#a855f7";
            } else if (trade[`${_myTradeRole}Accepted`]) {
                myStatusText.textContent = "✓ ACEPTADO DE TU PARTE";
                myStatusText.style.color = "#22c55e";
            } else {
                myStatusText.textContent = "Revisa el trato y acepta";
                myStatusText.style.color = "#eab308";
            }
        }

        // 5. Actualizar badge y estatus de Aceptación del Amigo
        const friendBadge = document.getElementById("friend-accept-badge");
        const friendStatusText = document.getElementById("friend-accept-status");

        if (friendBadge) {
            if (trade[`${_friendTradeRole}Accepted`]) {
                friendBadge.textContent = "¡ACEPTADO! 🚀";
                friendBadge.style.background = "rgba(34, 197, 94, 0.15)";
                friendBadge.style.color = "#22c55e";
                friendBadge.style.borderColor = "rgba(34, 197, 94, 0.3)";
            } else {
                friendBadge.textContent = "PENSANDO...";
                friendBadge.style.background = "rgba(255, 255, 255, 0.03)";
                friendBadge.style.color = "#71717a";
                friendBadge.style.borderColor = "rgba(255, 255, 255, 0.06)";
            }
        }

        if (friendStatusText) {
            if (!trade[`${_friendTradeRole}Offer`]) {
                friendStatusText.textContent = "Vecino seleccionando...";
                friendStatusText.style.color = "#71717a";
            } else if (trade[`${_friendTradeRole}Accepted`]) {
                friendStatusText.textContent = "Vecino aceptó el trato";
                friendStatusText.style.color = "#22c55e";
            } else {
                friendStatusText.textContent = "Vecino revisando oferta";
                friendStatusText.style.color = "#3b82f6";
            }
        }

        // 6. Concurrencia Doble: Ejecutar el intercambio si AMBOS aceptaron
        if (trade.player1Accepted && trade.player2Accepted && trade.status === "open") {
            // Solo el player1 dispara la transacción definitiva para evitar race-conditions
            if (role === "player1") {
                executeLiveCardSwap(tradeId, trade);
            }
        }
    });
}

// Dibujar mis repetidos
function _renderTradeInventory() {
    const grid = document.getElementById("trade-inventory-grid");
    if (!grid) return;

    // Buscar duplicados
    const myDuplicateCards = ALBUM_CARDS.filter(card => {
        const myCard = userAlbumData.cards[card.id];
        return myCard && myCard.count >= 2;
    });

    if (myDuplicateCards.length === 0) {
        grid.innerHTML = `
          <div style="color:#ef4444; font-size:0.85rem; padding: 20px; font-family:'Barlow Condensed',sans-serif; text-align:center; width:100%;">
            ❌ No posees cromos repetidos (mínimo 2 unidades) en tu inventario para ofrecer. ¡Consigue sobres!
          </div>
        `;
        return;
    }

    grid.innerHTML = myDuplicateCards.map(card => {
        const userCard = userAlbumData.cards[card.id];
        const isFoil = userCard ? userCard.foil : false;
        const borderCol = isFoil ? CARD_RARITIES.FOIL.color : card.baseRarity.color;

        return `
          <div class="trade-inv-card-item" 
               draggable="true" 
               ondragstart="handleTradeDragStart(event, '${card.id}')"
               onclick="selectTradeOfferCard('${card.id}')"
               style="border: 2px solid ${borderCol}; border-radius: 8px; overflow:hidden; width:95px; min-width:95px; height:135px; background:#11111e; display:flex; flex-direction:column; text-align:left; cursor:grab; position:relative; box-shadow:0 3px 8px rgba(0,0,0,0.4); transition: transform 0.2s;"
               onmouseenter="this.style.transform='scale(1.05) translateY(-2px)'"
               onmouseleave="this.style.transform='scale(1) translateY(0)'">
            
            <div style="position:absolute; top:4px; right:4px; background:#ffd700; color:#000; border-radius:4px; padding:1px 4px; font-size:0.6rem; font-weight:bold; font-family:monospace;">
              ×${userCard.count}
            </div>
            
            <img src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="width:100%; height:80px; object-fit:cover; border-bottom:1px solid rgba(255,255,255,0.06);">
            
            <div style="padding: 4px; flex:1; display:flex; flex-direction:column; justify-content:space-between; background:rgba(0,0,0,0.2);">
              <div style="font-family:'Barlow Condensed',sans-serif; font-weight:bold; font-size:0.68rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1.1;">
                ${card.name}
              </div>
              <div style="font-size:0.55rem; color:#71717a; font-family:monospace; align-self:flex-end;">
                #${card.number}
              </div>
            </div>
          </div>
        `;
    }).join('');
}

// Renderizar Cromo Miniatura en ranuras
function renderMiniCard(cardId, allowRemove) {
    const card = ALBUM_CARDS.find(c => c.id === cardId);
    if (!card) return "";
    
    const userCard = userAlbumData.cards[cardId];
    const isFoil = userCard ? userCard.foil : false;
    const borderCol = isFoil ? CARD_RARITIES.FOIL.color : card.baseRarity.color;

    return `
      <div class="lqsa-card-item owned" style="border: 2.5px solid ${borderCol}; width: 100%; height: 100%; margin: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.6); font-size: 0.85rem; position:relative; overflow:hidden;">
        ${allowRemove ? `
          <button onclick="event.stopPropagation(); removeTradeOfferCard()" 
                  style="position:absolute; top:6px; right:6px; background:#dc2626; border:none; color:#fff; border-radius:50%; width:20px; height:20px; font-weight:bold; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center; font-size:0.7rem; box-shadow:0 2px 5px rgba(0,0,0,0.4);" 
                  title="Quitar Cromo">✕</button>
        ` : ''}
        <div class="card-rarity-badge" style="background:${card.baseRarity.color}; font-size: 0.58rem; padding: 1px 5px; top:4px; left:4px;">${isFoil ? "🌈 FOIL" : card.baseRarity.name}</div>
        <img class="card-img" src="${card.image}" onerror="this.src='img/personajes/amador-rivas.webp'" style="height: 125px; object-fit:cover;">
        <div class="card-info-box" style="padding: 8px; justify-content: space-between; display: flex; flex-direction: column; height: calc(100% - 130px);">
          <div>
            <div class="card-name" style="font-size: 0.82rem; line-height: 1.1; margin-bottom: 2px;">${card.name}</div>
            <div class="card-job" style="font-size: 0.65rem; color:var(--accent);">💼 ${card.occupation}</div>
          </div>
          <div class="card-id-num" style="font-size: 0.55rem; font-family: monospace; align-self: flex-end;">#${card.number}/150</div>
        </div>
      </div>
    `;
}

// Drag Handlers
function handleTradeDragStart(event, cardId) {
    event.dataTransfer.setData("text/plain", cardId);
}

function handleTradeDrop(event) {
    event.preventDefault();
    const zone = document.getElementById("my-drop-zone");
    if (zone) zone.style.background = "rgba(168,85,247,0.03)";

    const cardId = event.dataTransfer.getData("text/plain");
    if (cardId) {
        selectTradeOfferCard(cardId);
    }
}

// Colocar cromo en mi ranura (con reinicio de aceptaciones)
async function selectTradeOfferCard(cardId) {
    if (!_activeTradeId || typeof firebase === 'undefined') return;

    const db = firebase.database();
    
    // Al cambiar la carta, reiniciamos las aceptaciones de ambos para evitar estafas (scams)
    await db.ref(`trades/${_activeTradeId}`).update({
        [`${_myTradeRole}Offer`]: cardId,
        player1Accepted: false,
        player2Accepted: false
    });
}

// Quitar cromo de mi ranura
async function removeTradeOfferCard() {
    if (!_activeTradeId || typeof firebase === 'undefined') return;

    const db = firebase.database();
    await db.ref(`trades/${_activeTradeId}`).update({
        [`${_myTradeRole}Offer`]: "",
        player1Accepted: false,
        player2Accepted: false
    });
}

// Alternar mi estado de aceptación
async function toggleAcceptTrade() {
    if (!_activeTradeId || typeof firebase === 'undefined') return;

    const db = firebase.database();
    const snap = await db.ref(`trades/${_activeTradeId}`).once('value');
    if (!snap.exists()) return;

    const trade = snap.val();
    const currentAcceptState = trade[`${_myTradeRole}Accepted`];

    await db.ref(`trades/${_activeTradeId}/${_myTradeRole}Accepted`).set(!currentAcceptState);
}

// Transacción definitiva y atómica de intercambio
async function executeLiveCardSwap(tradeId, trade) {
    const db = firebase.database();
    
    // 1. Bloquear duplicaciones realizando una transacción sobre el estado de la sala
    const transactionResult = await db.ref(`trades/${tradeId}`).transaction(currentData => {
        if (!currentData) return;
        if (currentData.status === "accepted") return; // ya completado por otro hilo
        
        if (currentData.player1Accepted && currentData.player2Accepted) {
            currentData.status = "accepted";
            return currentData;
        }
    });

    if (transactionResult.committed && transactionResult.snapshot.exists()) {
        const finalTrade = transactionResult.snapshot.val();
        if (finalTrade.status === "accepted") {
            // El estado de la sala cambió exitosamente a "accepted" por nosotros.
            // Ahora aplicamos atómicamente la doble sustracción y adición de cromos
            const updates = {};

            // Descontar y añadir a player1 (from)
            updates[`users/${finalTrade.player1}/album/cards/${finalTrade.player1Offer}/count`] = firebase.database.ServerValue.increment(-1);
            updates[`users/${finalTrade.player1}/album/cards/${finalTrade.player2Offer}/count`] = firebase.database.ServerValue.increment(1);

            // Descontar y añadir a player2 (to)
            updates[`users/${finalTrade.player2}/album/cards/${finalTrade.player2Offer}/count`] = firebase.database.ServerValue.increment(-1);
            updates[`users/${finalTrade.player2}/album/cards/${finalTrade.player1Offer}/count`] = firebase.database.ServerValue.increment(1);

            try {
                await db.ref().update(updates);
            } catch (error) {
                console.error("Error crítico durante la transacción de cromos en base de datos:", error);
            }
        }
    }
}