/* ════════════════════════════════════════════════════════
   LQSACatena — Sistema de Amigos e Invitaciones
   Firebase Realtime Database:
     /users/{uid}/friends/{friendUid}  → { username, avatar, addedAt }
     /users/{uid}/invitations/{pushId} → { from, fromName, fromAvatar, roomCode, mode, ts }
     /presence/{uid}                   → { online: true, lastSeen: ts }
   ════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
//  PRESENCIA (online / offline)
// ══════════════════════════════════════

let _presenceRef = null;
let _friendsListener = null;
let _invitationsListener = null;
let _friendsListData = {};

function initPresence(uid) {
  if (!uid || typeof firebase === 'undefined') return;
  const db = firebase.database();
  _presenceRef = db.ref(`presence/${uid}`);

  // Detectar cuando Firebase detecta desconexión
  _presenceRef.onDisconnect().set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
  // Marcar como online
  _presenceRef.set({ online: true, lastSeen: firebase.database.ServerValue.TIMESTAMP });
}

function destroyPresence(uid) {
  if (_presenceRef) {
    _presenceRef.set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
    _presenceRef = null;
  }
}

// ══════════════════════════════════════
//  LISTENERS DE AMIGOS E INVITACIONES
// ══════════════════════════════════════

function initFriendsSystem(uid) {
  if (!uid || typeof firebase === 'undefined') return;
  const db = firebase.database();

  // Listener de lista de amigos
  if (_friendsListener) db.ref(`users/${uid}/friends`).off('value', _friendsListener);
  _friendsListener = db.ref(`users/${uid}/friends`).on('value', snap => {
    _friendsListData = snap.val() || {};
    _renderFriendsPanelIfOpen();
    if (typeof _updateFriendsBadge === 'function') _updateFriendsBadge();
  });

  // Listener de solicitudes de amistad
  if (window._friendRequestsListener) db.ref(`users/${uid}/friend_requests`).off('value', window._friendRequestsListener);
  window._friendRequestsListener = db.ref(`users/${uid}/friend_requests`).on('value', snap => {
    window._friendRequestsListData = snap.val() || {};
    _updateFriendRequestsUI();
  });

  // Listener de invitaciones (toast)
  if (_invitationsListener) db.ref(`users/${uid}/invitations`).off('child_added', _invitationsListener);
  _invitationsListener = db.ref(`users/${uid}/invitations`).on('child_added', snap => {
    const inv = snap.val();
    if (!inv) return;
    _showInvitationToast(snap.key, inv);
  });

  // Listener de chats no leídos para la chapa/badge
  if (window._unreadChatsListener) db.ref(`users/${uid}/unread_chats`).off('value', window._unreadChatsListener);
  window._unreadChatsListener = db.ref(`users/${uid}/unread_chats`).on('value', snap => {
    window._unreadChatsData = snap.val() || {};
    if (typeof _updateFriendsBadge === 'function') _updateFriendsBadge();
  });

  // Listener de invitaciones totales para la chapa/badge
  if (window._invitationsBadgeListener) db.ref(`users/${uid}/invitations`).off('value', window._invitationsBadgeListener);
  window._invitationsBadgeListener = db.ref(`users/${uid}/invitations`).on('value', snap => {
    window._invitationsData = snap.val() || {};
    if (typeof _updateFriendsBadge === 'function') _updateFriendsBadge();
  });
}

function destroyFriendsSystem(uid) {
  if (!uid || typeof firebase === 'undefined') return;
  const db = firebase.database();
  if (_friendsListener) { db.ref(`users/${uid}/friends`).off(); _friendsListener = null; }
  if (window._friendRequestsListener) { db.ref(`users/${uid}/friend_requests`).off(); window._friendRequestsListener = null; }
  if (_invitationsListener) { db.ref(`users/${uid}/invitations`).off(); _invitationsListener = null; }
  if (window._unreadChatsListener) { db.ref(`users/${uid}/unread_chats`).off(); window._unreadChatsListener = null; }
  if (window._invitationsBadgeListener) { db.ref(`users/${uid}/invitations`).off(); window._invitationsBadgeListener = null; }
  
  // Limpiar listeners de presencia activos
  if (window._friendPresenceListeners) {
    Object.keys(window._friendPresenceListeners).forEach(key => {
      db.ref(`presence/${key}`).off('value', window._friendPresenceListeners[key]);
    });
    window._friendPresenceListeners = {};
  }
}

// ══════════════════════════════════════
//  ENVIAR / ACEPTAR / ELIMINAR AMIGO
// ══════════════════════════════════════

async function sendFriendRequest(targetUsername) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) {
    _friendsError('Debes iniciar sesión para añadir amigos.');
    return;
  }
  const targetKey = targetUsername.trim().toLowerCase();
  if (!targetKey) return;
  if (targetKey === myUid) {
    _friendsError('No puedes añadirte a ti mismo, vecino/a.');
    return;
  }

  const db = firebase.database();
  const snap = await db.ref(`users/${targetKey}`).once('value');
  if (!snap.exists()) {
    _friendsError(`No existe ningún vecino llamado "${targetUsername}".`);
    return;
  }
  const targetProfile = snap.val();

  // Smart fallback: si esa persona ya nos envió solicitud, aceptarla directamente
  const reverseReqSnap = await db.ref(`users/${myUid}/friend_requests/${targetKey}`).once('value');
  if (reverseReqSnap.exists()) {
    const input = document.getElementById('friends-add-input');
    if (input) input.value = '';
    await acceptFriendRequest(targetKey);
    return;
  }

  // Verificar si ya son amigos
  const isFriendSnap = await db.ref(`users/${myUid}/friends/${targetKey}`).once('value');
  if (isFriendSnap.exists()) {
    _friendsError(`¡Ya eres amigo/a de ${targetProfile.username}!`);
    return;
  }

  // Verificar si ya hay una solicitud enviada
  const reqSentSnap = await db.ref(`users/${targetKey}/friend_requests/${myUid}`).once('value');
  if (reqSentSnap.exists()) {
    _friendsError(`Ya has enviado una solicitud a ${targetProfile.username}.`);
    return;
  }

  // Obtener nuestro perfil actualizado
  let myProfile = currentUserProfile;
  if (!myProfile) {
    const mySnap = await db.ref(`users/${myUid}`).once('value');
    if (mySnap.exists()) myProfile = mySnap.val();
  }
  if (!myProfile) {
    _friendsError('No se pudo verificar tu perfil de usuario.');
    return;
  }

  // Enviar solicitud a la bandeja del destinatario
  await db.ref(`users/${targetKey}/friend_requests/${myUid}`).set({
    username: myProfile.username,
    avatar: myProfile.avatar || 'img/personajes/amador-rivas.webp',
    ts: firebase.database.ServerValue.TIMESTAMP
  });

  _friendsError('');
  _friendsSuccess(`¡Solicitud enviada a ${targetProfile.username}! 📨`);
  const input = document.getElementById('friends-add-input');
  if (input) input.value = '';
}

async function addFriend(targetUsername) {
  await sendFriendRequest(targetUsername);
}

async function acceptFriendRequest(senderUid) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) return;

  const db = firebase.database();
  
  // Perfil propio robusto
  let myProfile = currentUserProfile;
  if (!myProfile) {
    const mySnap = await db.ref(`users/${myUid}`).once('value');
    if (mySnap.exists()) myProfile = mySnap.val();
  }
  if (!myProfile) {
    console.error("No se pudo cargar el perfil propio para aceptar amigo.");
    return;
  }

  const requestSnap = await db.ref(`users/${myUid}/friend_requests/${senderUid}`).once('value');
  if (!requestSnap.exists()) return;
  const requestData = requestSnap.val();

  // Obtener perfil del remitente
  const senderSnap = await db.ref(`users/${senderUid}`).once('value');
  const senderProfile = senderSnap.val() || requestData;

  // Añadir en ambas direcciones
  await db.ref(`users/${myUid}/friends/${senderUid}`).set({
    username: senderProfile.username,
    avatar: senderProfile.avatar || 'img/personajes/amador-rivas.webp',
    addedAt: firebase.database.ServerValue.TIMESTAMP
  });
  await db.ref(`users/${senderUid}/friends/${myUid}`).set({
    username: myProfile.username,
    avatar: myProfile.avatar || 'img/personajes/amador-rivas.webp',
    addedAt: firebase.database.ServerValue.TIMESTAMP
  });

  // Eliminar solicitud
  await db.ref(`users/${myUid}/friend_requests/${senderUid}`).remove();

  _friendsError('');
  _friendsSuccess(`¡Ahora eres amigo/a de ${senderProfile.username}! 🎉`);
}

async function declineFriendRequest(senderUid) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) return;

  const db = firebase.database();
  await db.ref(`users/${myUid}/friend_requests/${senderUid}`).remove();

  _friendsError('');
  _friendsSuccess('Solicitud rechazada.');
}

async function removeFriend(friendUid) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) return;
  const db = firebase.database();
  
  // Quitar el listener de presencia antes de borrar
  if (window._friendPresenceListeners && window._friendPresenceListeners[friendUid]) {
    db.ref(`presence/${friendUid}`).off('value', window._friendPresenceListeners[friendUid]);
    delete window._friendPresenceListeners[friendUid];
  }
  
  await db.ref(`users/${myUid}/friends/${friendUid}`).remove();
  await db.ref(`users/${friendUid}/friends/${myUid}`).remove();
}

// ══════════════════════════════════════
//  INVITAR AMIGO A PARTIDA
// ══════════════════════════════════════

async function inviteFriendToRoom(friendUid, roomCode, mode) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid || !currentUserProfile) return;
  const db = firebase.database();

  await db.ref(`users/${friendUid}/invitations`).push({
    from: myUid,
    fromName: currentUserProfile.username,
    fromAvatar: currentUserProfile.avatar || 'img/personajes/amador-rivas.webp',
    roomCode: roomCode,
    mode: mode || 'classic',
    ts: firebase.database.ServerValue.TIMESTAMP
  });
}

async function acceptInvitation(invKey, inv) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) return;
  // Limpiar invitación
  await firebase.database().ref(`users/${myUid}/invitations/${invKey}`).remove();
  // Cerrar toast
  const toast = document.getElementById(`inv-toast-${invKey}`);
  if (toast) toast.remove();

  // Unirse a la sala
  if (inv.mode === 'duel') {
    joinDuelRoom(inv.roomCode);
  } else if (inv.mode === 'card_duel') {
    if (typeof joinCardDuelRoom === 'function') joinCardDuelRoom(inv.roomCode);
  } else {
    const input = document.getElementById('quien-join-input');
    if (input) input.value = inv.roomCode;
    hideLobbyOverlay();
    joinOnlineRoom(inv.roomCode);
  }
}

async function declineInvitation(invKey) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) return;
  await firebase.database().ref(`users/${myUid}/invitations/${invKey}`).remove();
  const toast = document.getElementById(`inv-toast-${invKey}`);
  if (toast) {
    toast.style.animation = 'slideOutToast 0.3s ease forwards';
    setTimeout(() => toast.remove(), 320);
  }
}

// ══════════════════════════════════════
//  TOAST DE INVITACIÓN
// ══════════════════════════════════════

function _showInvitationToast(invKey, inv) {
  // Evitar duplicados
  if (document.getElementById(`inv-toast-${invKey}`)) return;

  const isTrade = inv.mode === 'trade';
  const modeLabel = isTrade ? '🔄 Propuesta de Intercambio' : (inv.mode === 'duel' ? '⚔️ Modo Duelo' : (inv.mode === 'card_duel' ? '🎴 Duelo de Cartas TCG' : '👥 Duelo Clásico'));

  const toast = document.createElement('div');
  toast.id = `inv-toast-${invKey}`;
  toast.className = 'friends-inv-toast';

  let buttonsHtml = '';
  if (isTrade) {
    buttonsHtml = `
      <button class="friends-inv-accept" onclick="acceptTradeInvitation('${inv.roomCode}', '${invKey}')">✔ Aceptar Trato</button>
      <button class="friends-inv-decline" onclick="declineInvitation('${invKey}')">✕ Rechazar</button>
    `;
  } else {
    buttonsHtml = `
      <button class="friends-inv-accept" onclick="acceptInvitation('${invKey}', ${JSON.stringify(inv).replace(/"/g, '&quot;')})">✔ Aceptar</button>
      <button class="friends-inv-decline" onclick="declineInvitation('${invKey}')">✕ Rechazar</button>
    `;
  }

  toast.innerHTML = `
    <div class="friends-inv-toast-inner">
      <img class="friends-inv-avatar" src="${inv.fromAvatar}" alt="${inv.fromName}"
        onerror="this.src='img/personajes/amador-rivas.webp'">
      <div class="friends-inv-body">
        <div class="friends-inv-title">¡Invitación de ${inv.fromName}!</div>
        <div class="friends-inv-mode">${modeLabel}</div>
        <div class="friends-inv-btns">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(toast);

  // Auto-rechazar tras 30s
  setTimeout(() => {
    if (document.getElementById(`inv-toast-${invKey}`)) declineInvitation(invKey);
  }, 30000);
}

// ══════════════════════════════════════
//  PANEL DE AMIGOS (UI)
// ══════════════════════════════════════

let _currentFriendsTab = 'list'; // 'list' | 'reqs'

function openFriendsPanel() {
  if (!currentUserProfile) {
    openLoginModal();
    return;
  }
  let panel = document.getElementById('friends-panel');
  if (panel) { panel.remove(); return; }

  panel = document.createElement('div');
  panel.id = 'friends-panel';
  panel.className = 'friends-panel';
  panel.innerHTML = `
    <div class="friends-panel-header">
      <span class="friends-panel-title">👥 Amigos</span>
      <button class="friends-panel-close" onclick="document.getElementById('friends-panel').remove()">✕</button>
    </div>
    <div class="friends-add-row">
      <input id="friends-add-input" class="friends-add-input" type="text" maxlength="15"
        placeholder="Nombre de vecino/a..." onkeydown="if(event.key==='Enter')sendFriendRequest(this.value)">
      <button class="friends-add-btn" onclick="sendFriendRequest(document.getElementById('friends-add-input').value)">➕ Añadir</button>
    </div>
    <div id="friends-feedback" class="friends-feedback"></div>
    
    <div class="friends-tabs" style="display:flex; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:8px; padding:0 8px;">
      <button id="friends-tab-list" class="friends-tab-btn active" onclick="switchFriendsTab('list')" style="flex:1; background:none; border:none; border-bottom:2px solid var(--accent); color:var(--accent); font-family:'Barlow Condensed',sans-serif; font-weight:700; padding:6px; cursor:pointer; font-size:0.85rem;">MIS AMIGOS</button>
      <button id="friends-tab-reqs" class="friends-tab-btn" onclick="switchFriendsTab('reqs')" style="flex:1; background:none; border:none; border-bottom:2px solid transparent; color:var(--text2); font-family:'Barlow Condensed',sans-serif; font-weight:700; padding:6px; cursor:pointer; font-size:0.85rem; position:relative;">
        SOLICITUDES <span id="friends-reqs-badge" style="display:none; position:absolute; top:2px; right:8px; background:var(--accent); color:#000; border-radius:50%; width:14px; height:14px; align-items:center; justify-content:center; font-size:0.6rem; font-weight:bold;">0</span>
      </button>
    </div>
    
    <div id="friends-list-container" class="friends-list-container">
      <p class="friends-empty">Cargando amigos...</p>
    </div>
    
    <div id="friends-reqs-container" class="friends-list-container" style="display:none">
      <p class="friends-empty">Cargando solicitudes...</p>
    </div>
  `;
  document.body.appendChild(panel);
  switchFriendsTab(_currentFriendsTab);
  _updateFriendRequestsUI();
}

function switchFriendsTab(tab) {
  _currentFriendsTab = tab;
  const tabList = document.getElementById('friends-tab-list');
  const tabReqs = document.getElementById('friends-tab-reqs');
  const listCont = document.getElementById('friends-list-container');
  const reqsCont = document.getElementById('friends-reqs-container');

  if (tab === 'list') {
    if (tabList) { tabList.classList.add('active'); tabList.style.color = 'var(--accent)'; tabList.style.borderBottomColor = 'var(--accent)'; }
    if (tabReqs) { tabReqs.classList.remove('active'); tabReqs.style.color = 'var(--text2)'; tabReqs.style.borderBottomColor = 'transparent'; }
    if (listCont) listCont.style.display = 'block';
    if (reqsCont) reqsCont.style.display = 'none';
    _renderFriendsList();
  } else {
    if (tabList) { tabList.classList.remove('active'); tabList.style.color = 'var(--text2)'; tabList.style.borderBottomColor = 'transparent'; }
    if (tabReqs) { tabReqs.classList.add('active'); tabReqs.style.color = 'var(--accent)'; tabReqs.style.borderBottomColor = 'var(--accent)'; }
    if (listCont) listCont.style.display = 'none';
    if (reqsCont) reqsCont.style.display = 'block';
    _renderFriendRequests();
  }
}

function _updateFriendRequestsUI() {
  const reqs = window._friendRequestsListData || {};
  const count = Object.keys(reqs).length;
  
  const badge = document.getElementById('friends-reqs-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  if (document.getElementById('friends-panel') && _currentFriendsTab === 'reqs') {
    _renderFriendRequests();
  }
}

function _renderFriendRequests() {
  const container = document.getElementById('friends-reqs-container');
  if (!container) return;

  const reqs = window._friendRequestsListData || {};
  const keys = Object.keys(reqs);

  if (!keys.length) {
    container.innerHTML = `<p class="friends-empty">No tienes solicitudes pendientes. 🏠</p>`;
    return;
  }

  container.innerHTML = keys.map(uid => {
    const r = reqs[uid];
    return `
      <div class="friends-item">
        <div class="friends-item-avatar-wrap">
          <img class="friends-item-avatar" src="${r.avatar || 'img/personajes/amador-rivas.webp'}" alt="${r.username}"
            onerror="this.src='img/personajes/amador-rivas.webp'">
        </div>
        <div class="friends-item-info">
          <div class="friends-item-name">${r.username}</div>
          <div class="friends-item-status">Vecino/a te envió una solicitud</div>
        </div>
        <div class="friends-item-actions" style="gap:6px">
          <button class="friends-inv-accept" onclick="acceptFriendRequest('${uid}')" style="padding: 4px 8px; font-size: 0.72rem; min-width: 0;">✔</button>
          <button class="friends-remove-btn" onclick="declineFriendRequest('${uid}')" style="padding: 4px 8px; font-size: 0.72rem;">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function _renderFriendsPanelIfOpen() {
  if (document.getElementById('friends-panel')) {
    _renderFriendsList();
  }
}

async function _renderFriendsList() {
  const container = document.getElementById('friends-list-container');
  if (!container) return;

  const friends = _friendsListData;
  const keys = Object.keys(friends);
  if (!keys.length) {
    container.innerHTML = `<p class="friends-empty">Aún no tienes amigos. ¡Añade a tus vecinos! 🏠</p>`;
    return;
  }

  // Renderizar la lista instantáneamente con estado offline por defecto
  container.innerHTML = keys.map(uid => {
    const currentRoom = window._roomCode || window._duelRoomCode || null;
    const isCardDuel = !!window._isCardDuel;
    const isDuel = window._duelRoomCode ? true : false;
    const inviteMode = isCardDuel ? 'card_duel' : (isDuel ? 'duel' : 'classic');
    const canInvite = !!currentRoom;
    const f = friends[uid];

    return `
      <div class="friends-item" data-uid="${uid}">
        <div class="friends-item-avatar-wrap">
          <img class="friends-item-avatar" src="${f.avatar}" alt="${f.username}"
            onerror="this.src='img/personajes/amador-rivas.webp'">
          <span class="friends-online-dot offline" data-uid="${uid}"></span>
        </div>
        <div class="friends-item-info">
          <div class="friends-item-name">${f.username}</div>
          <div class="friends-item-status" data-uid="${uid}">Desconectado/a</div>
        </div>
        <div class="friends-item-actions">
          <button class="friends-chat-btn" onclick="openPrivateChat('${uid}', '${f.username.replace(/'/g, "\\'")}', '${f.avatar.replace(/'/g, "\\'")}')" title="Chat privado">💬</button>
          <button class="friends-invite-btn" data-uid="${uid}" onclick="inviteFriendToRoom('${uid}', '${currentRoom}', '${inviteMode}')" style="display:none">📨 Invitar</button>
          <button class="friends-chat-btn" onclick="if (typeof startLiveTradeSession === 'function') startLiveTradeSession('${uid}', '${f.username.replace(/'/g, "\\'")}')" title="Proponer Intercambio de Cromos en Vivo" style="background: linear-gradient(135deg, #a855f7, #6366f1); border: 1px solid rgba(255,255,255,0.08); font-size:0.8rem;">🔄</button>
          <button class="friends-remove-btn" onclick="removeFriend('${uid}')" title="Eliminar amigo">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  // Vincular listeners individuales de presencia en tiempo real
  const db = firebase.database();
  window._friendPresenceListeners = window._friendPresenceListeners || {};

  keys.forEach(uid => {
    if (!window._friendPresenceListeners[uid]) {
      window._friendPresenceListeners[uid] = db.ref(`presence/${uid}`).on('value', snap => {
        const val = snap.val() || { online: false };
        const dot = document.querySelector(`.friends-online-dot[data-uid="${uid}"]`);
        const statusText = document.querySelector(`.friends-item-status[data-uid="${uid}"]`);
        const inviteBtn = document.querySelector(`.friends-invite-btn[data-uid="${uid}"]`);
        const currentRoom = window._roomCode || window._duelRoomCode || null;
        const canInvite = !!currentRoom;

        if (dot) {
          dot.className = `friends-online-dot ${val.online ? 'online' : 'offline'}`;
        }
        if (statusText) {
          statusText.textContent = val.online ? 'En línea' : 'Desconectado/a';
        }
        if (inviteBtn) {
          inviteBtn.style.display = (val.online && canInvite) ? 'inline-block' : 'none';
        }
      });
    }
  });

  if (typeof _updateFriendsBadge === 'function') _updateFriendsBadge();
}

function _friendsError(msg) {
  const el = document.getElementById('friends-feedback');
  if (!el) return;
  el.style.color = '#f87171';
  el.textContent = msg;
}

function _friendsSuccess(msg) {
  const el = document.getElementById('friends-feedback');
  if (!el) return;
  el.style.color = '#4ade80';
  el.textContent = msg;
  setTimeout(() => { if (el) el.textContent = ''; }, 4000);
}

// ══════════════════════════════════════
//  ESTILOS DINÁMICOS DEL SISTEMA DE AMIGOS
// ══════════════════════════════════════

(function injectFriendsStyles() {
  if (document.getElementById('friends-styles')) return;
  const s = document.createElement('style');
  s.id = 'friends-styles';
  s.textContent = `
    /* ── Panel de amigos ── */
    .friends-panel {
      position: fixed; bottom: 100px; right: 48px; z-index: 100000 !important;
      width: min(340px, 92vw);
      background: rgba(14,14,24,0.96);
      border: 1px solid rgba(240,192,32,0.2);
      border-radius: 16px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      animation: slideUpPanel 0.25s ease;
    }
    @keyframes slideUpPanel { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }

    .friends-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: rgba(240,192,32,0.07);
      border-bottom: 1px solid rgba(240,192,32,0.12);
    }
    .friends-panel-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 1.05rem;
      letter-spacing: 1.5px; color: var(--accent);
    }
    .friends-panel-close {
      background: none; border: none; color: var(--text2);
      font-size: 1rem; cursor: pointer; padding: 2px 6px;
      border-radius: 6px; transition: all 0.15s;
    }
    .friends-panel-close:hover { background: rgba(255,255,255,0.08); color: var(--text); }

    .friends-add-row {
      display: flex; gap: 6px; padding: 10px 12px 6px;
    }
    .friends-add-input {
      flex: 1; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
      color: var(--text); font-size: 0.82rem; padding: 7px 10px;
      outline: none; transition: border-color 0.2s; font-family: 'Barlow', sans-serif;
    }
    .friends-add-input:focus { border-color: var(--accent); }
    .friends-add-btn {
      background: rgba(240,192,32,0.15); border: 1px solid rgba(240,192,32,0.35);
      color: var(--accent); border-radius: 8px; font-size: 0.78rem;
      padding: 6px 10px; cursor: pointer; white-space: nowrap;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .friends-add-btn:hover { background: rgba(240,192,32,0.25); }

    .friends-feedback {
      font-size: 0.78rem; min-height: 18px; padding: 0 12px 4px;
      font-family: 'Barlow', sans-serif; transition: all 0.2s;
    }

    .friends-list-container {
      max-height: 280px; overflow-y: auto; padding: 4px 8px 10px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .friends-empty {
      color: var(--text2); font-size: 0.8rem; text-align: center;
      padding: 20px 10px; margin: 0;
    }

    .friends-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 10px;
      transition: background 0.15s; margin-bottom: 4px;
    }
    .friends-item:hover { background: rgba(255,255,255,0.04); }

    .friends-item-avatar-wrap { position: relative; flex-shrink: 0; }
    .friends-item-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      object-fit: cover; object-position: top;
      border: 2px solid rgba(255,255,255,0.12);
    }
    .friends-online-dot {
      position: absolute; bottom: 0; right: 0;
      width: 10px; height: 10px; border-radius: 50%;
      border: 2px solid rgba(14,14,24,0.96);
    }
    .friends-online-dot.online { background: #4ade80; box-shadow: 0 0 5px #4ade80; }
    .friends-online-dot.offline { background: #6b7280; }

    .friends-item-info { flex: 1; min-width: 0; }
    .friends-item-name {
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 0.9rem; color: var(--text); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .friends-item-status { font-size: 0.7rem; color: var(--text2); margin-top: 1px; }

    .friends-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .friends-invite-btn {
      background: rgba(240,192,32,0.12); border: 1px solid rgba(240,192,32,0.3);
      color: var(--accent); border-radius: 6px; font-size: 0.7rem;
      padding: 4px 8px; cursor: pointer;
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      transition: all 0.15s; white-space: nowrap;
    }
    .friends-invite-btn:hover { background: rgba(240,192,32,0.22); }
    .friends-remove-btn {
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
      color: #f87171; border-radius: 6px; font-size: 0.75rem;
      padding: 4px 6px; cursor: pointer; transition: all 0.15s;
    }
    .friends-remove-btn:hover { background: rgba(239,68,68,0.18); }

    /* ── Toast de invitación ── */
    .friends-inv-toast {
      position: fixed; top: 80px; right: 48px; z-index: 9999;
      width: min(320px, 90vw);
      background: rgba(10,10,20,0.97);
      border: 1px solid rgba(240,192,32,0.35);
      border-radius: 14px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(240,192,32,0.08);
      animation: slideInToast 0.35s cubic-bezier(0.34,1.56,0.64,1);
      overflow: hidden;
    }
    @keyframes slideInToast {
      from { opacity: 0; transform: translateX(60px) scale(0.92); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes slideOutToast {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(60px) scale(0.92); }
    }
    .friends-inv-toast-inner {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px;
    }
    .friends-inv-avatar {
      width: 48px; height: 48px; border-radius: 50%; object-fit: cover; object-position: top;
      border: 2px solid rgba(240,192,32,0.4); flex-shrink: 0;
    }
    .friends-inv-body { flex: 1; }
    .friends-inv-title {
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 0.95rem; color: var(--accent); margin-bottom: 2px;
    }
    .friends-inv-mode {
      font-size: 0.78rem; color: var(--text2); margin-bottom: 10px;
      font-family: 'Barlow', sans-serif;
    }
    .friends-inv-btns { display: flex; gap: 8px; }
    .friends-inv-accept {
      background: linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.08));
      border: 1px solid rgba(74,222,128,0.5); color: #4ade80;
      border-radius: 8px; font-size: 0.8rem; padding: 6px 14px;
      cursor: pointer; font-weight: 700; font-family: 'Barlow Condensed', sans-serif;
      letter-spacing: 0.5px; transition: all 0.2s;
    }
    .friends-inv-accept:hover { background: rgba(74,222,128,0.25); transform: scale(1.04); }
    .friends-inv-decline {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      color: #f87171; border-radius: 8px; font-size: 0.8rem; padding: 6px 12px;
      cursor: pointer; font-family: 'Barlow Condensed', sans-serif; transition: all 0.2s;
    }
    .friends-inv-decline:hover { background: rgba(239,68,68,0.2); }

    /* ── Chat privado flotante ── */
    .private-chat-box {
      position: fixed; bottom: 32px; right: 120px; z-index: 100001 !important;
      width: min(300px, 85vw); height: 380px;
      background: rgba(14,14,24,0.98);
      border: 1px solid rgba(240,192,32,0.3);
      border-radius: 16px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
      display: none; flex-direction: column;
      overflow: hidden;
      animation: slideUpPanel 0.2s ease;
    }
    .private-chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px;
      background: rgba(240,192,32,0.08);
      border-bottom: 1px solid rgba(240,192,32,0.15);
    }
    .private-chat-header-info { display: flex; align-items: center; gap: 8px; }
    .private-chat-avatar {
      width: 32px; height: 32px; border-radius: 50%; object-fit: cover; object-position: top;
      border: 1px solid rgba(240,192,32,0.3);
    }
    .private-chat-title {
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 0.88rem; color: var(--accent);
    }
    .private-chat-subtitle { font-size: 0.65rem; color: var(--text2); }
    .private-chat-close {
      background: none; border: none; color: var(--text2);
      font-size: 0.95rem; cursor: pointer; padding: 2px 6px;
      border-radius: 6px; transition: all 0.15s;
    }
    .private-chat-close:hover { background: rgba(255,255,255,0.08); color: var(--text); }
    .private-chat-messages {
      flex: 1; overflow-y: auto; padding: 10px;
      display: flex; flex-direction: column; gap: 8px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .private-chat-empty {
      color: var(--text2); font-size: 0.75rem; text-align: center;
      margin: auto;
    }
    .private-chat-bubble {
      max-width: 80%; padding: 8px 12px; border-radius: 12px;
      font-size: 0.8rem; font-family: 'Barlow', sans-serif;
      line-height: 1.4; word-break: break-word;
    }
    .private-chat-bubble.me {
      background: rgba(240,192,32,0.15);
      border: 1px solid rgba(240,192,32,0.3);
      color: #fff; align-self: flex-end;
      border-bottom-right-radius: 2px;
    }
    .private-chat-bubble.them {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text); align-self: flex-start;
      border-bottom-left-radius: 2px;
    }
    .private-chat-input-row {
      display: flex; gap: 6px; padding: 8px 10px;
      background: rgba(0,0,0,0.3);
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .private-chat-input {
      flex: 1; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
      color: var(--text); font-size: 0.8rem; padding: 6px 10px;
      outline: none; transition: border-color 0.2s;
    }
    .private-chat-input:focus { border-color: var(--accent); }
    .private-chat-send {
      background: var(--accent); border: none; color: #000;
      border-radius: 8px; font-size: 0.75rem; padding: 6px 12px;
      cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      transition: opacity 0.2s;
    }
    .private-chat-send:hover { opacity: 0.9; }

    /* ── Icono de Chat Privado en la lista ── */
    .friends-chat-btn {
      background: rgba(240,192,32,0.12); border: 1px solid rgba(240,192,32,0.35);
      color: var(--accent); border-radius: 6px; font-size: 0.75rem;
      padding: 4px 6px; cursor: pointer; transition: all 0.15s;
    }
    .friends-chat-btn:hover { background: rgba(240,192,32,0.25); transform: scale(1.05); }
  `;
  document.head.appendChild(s);
})();

// ══════════════════════════════════════
//  CHAT PRIVADO EN TIEMPO REAL
// ══════════════════════════════════════

function openPrivateChat(friendUid, friendUsername, friendAvatar) {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) {
    _friendsError('Inicia sesión para chatear.');
    return;
  }

  const chatId = [myUid, friendUid].sort().join('_');
  window._activePrivateChatId = chatId;
  window._activePrivateFriendUid = friendUid;

  // Limpiar chats no leídos al abrir conversación
  firebase.database().ref(`users/${myUid}/unread_chats/${friendUid}`).remove();

  // Cerrar listener previo si existía
  if (window._activePrivateChatListener) {
    firebase.database().ref(`chats/private/${window._prevPrivateChatId}/messages`).off('value', window._activePrivateChatListener);
  }
  window._prevPrivateChatId = chatId;

  let chatBox = document.getElementById('private-chat-box');
  if (!chatBox) {
    chatBox = document.createElement('div');
    chatBox.id = 'private-chat-box';
    chatBox.className = 'private-chat-box';
    document.body.appendChild(chatBox);
  }

  chatBox.style.display = 'flex';
  chatBox.innerHTML = `
    <div class="private-chat-header">
      <div class="private-chat-header-info">
        <img class="private-chat-avatar" src="${friendAvatar}" alt="${friendUsername}" onerror="this.src='img/personajes/amador-rivas.webp'">
        <div>
          <div class="private-chat-title">${friendUsername}</div>
          <div class="private-chat-subtitle" id="private-chat-status-${friendUid}">Conectando...</div>
        </div>
      </div>
      <button class="private-chat-close" onclick="closePrivateChat()">✕</button>
    </div>
    <div class="private-chat-messages" id="private-chat-messages"></div>
    <div class="private-chat-input-row">
      <input id="private-chat-input" class="private-chat-input" type="text" maxlength="100" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter')sendPrivateChatMessage()">
      <button class="private-chat-send" onclick="sendPrivateChatMessage()">Enviar</button>
    </div>
  `;

  // Sincronizar presencia del amigo en la cabecera del chat
  firebase.database().ref(`presence/${friendUid}`).on('value', snap => {
    const val = snap.val() || { online: false };
    const statusEl = document.getElementById(`private-chat-status-${friendUid}`);
    if (statusEl) {
      statusEl.textContent = val.online ? 'En línea' : 'Desconectado/a';
      statusEl.style.color = val.online ? '#4ade80' : '#94a3b8';
    }
  });

  // Escuchar mensajes en tiempo real
  const messagesContainer = document.getElementById('private-chat-messages');
  window._activePrivateChatListener = firebase.database().ref(`chats/private/${chatId}/messages`).limitToLast(30).on('value', snap => {
    // Si la conversación está abierta, limpiar el flag de no leído
    firebase.database().ref(`users/${myUid}/unread_chats/${friendUid}`).remove();
    messagesContainer.innerHTML = '';
    const val = snap.val();
    if (!val) {
      messagesContainer.innerHTML = `<p class="private-chat-empty">No hay mensajes. ¡Di hola! 👋</p>`;
      return;
    }
    Object.values(val).forEach(msg => {
      const isMe = msg.from === myUid;
      const bubble = document.createElement('div');
      bubble.className = `private-chat-bubble ${isMe ? 'me' : 'them'}`;
      
      let timeStr = '';
      if (msg.ts) {
        const date = new Date(msg.ts);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        timeStr = `${day}/${month} ${hours}:${minutes}`;
      }
      
      bubble.innerHTML = `
        <div class="private-chat-bubble-meta" style="display: flex; justify-content: space-between; font-size: 0.65rem; opacity: 0.7; margin-bottom: 4px; font-weight: bold; gap: 8px;">
          <span>${msg.fromName || 'Vecino'}</span>
          <span>${timeStr}</span>
        </div>
        <div class="private-chat-bubble-text">${msg.text}</div>
      `;
      messagesContainer.appendChild(bubble);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function closePrivateChat() {
  const chatBox = document.getElementById('private-chat-box');
  if (chatBox) chatBox.style.display = 'none';

  if (window._activePrivateChatId && window._activePrivateChatListener) {
    firebase.database().ref(`chats/private/${window._activePrivateChatId}/messages`).off('value', window._activePrivateChatListener);
    window._activePrivateChatListener = null;
    window._activePrivateChatId = null;
  }
}

async function sendPrivateChatMessage() {
  const input = document.getElementById('private-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const myUid = localStorage.getItem('lqsa_user');
  const chatId = window._activePrivateChatId;
  if (!myUid || !chatId) return;

  let myProfile = currentUserProfile;
  if (!myProfile) {
    const mySnap = await firebase.database().ref(`users/${myUid}`).once('value');
    if (mySnap.exists()) myProfile = mySnap.val();
  }
  const fromName = myProfile ? myProfile.username : 'Vecino';

  await firebase.database().ref(`chats/private/${chatId}/messages`).push().set({
    from: myUid,
    fromName: fromName,
    text: text,
    ts: firebase.database.ServerValue.TIMESTAMP
  });

  const friendUid = chatId.split('_').find(id => id !== myUid);
  if (friendUid) {
    firebase.database().ref(`users/${friendUid}/unread_chats/${myUid}`).set(true);
  }

  input.value = '';
  input.focus();
}

// ══════════════════════════════════════
//  MODAL PARA INVITAR AMIGOS A SALA
// ══════════════════════════════════════

async function openInviteFriendsModal() {
  const myUid = localStorage.getItem('lqsa_user');
  if (!myUid) {
    alert('Debes iniciar sesión para invitar a amigos.');
    return;
  }

  let modal = document.getElementById('invite-friends-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'invite-friends-modal';
  modal.className = 'quien-mode-overlay';
  modal.style.zIndex = '3000'; // Asegurar que quede encima de cualquier otro overlay
  
  const currentRoom = window._roomCode || window._duelRoomCode || null;
  const isCardDuel = !!window._isCardDuel;
  const isDuel = !isCardDuel && !!window._duelRoomCode;
  const inviteMode = isCardDuel ? 'card_duel' : (isDuel ? 'duel' : 'classic');
  
  if (!currentRoom) {
    alert('No estás en ninguna sala de juego activa.');
    return;
  }

  const friends = _friendsListData || {};
  const keys = Object.keys(friends);

  let friendsHtml = '';
  if (keys.length === 0) {
    friendsHtml = `<p class="friends-empty" style="color:var(--text2)">No tienes amigos agregados aún. ¡Añade vecinos en la lista de amigos!</p>`;
  } else {
    friendsHtml = `
      <div class="invite-friends-list" style="max-height: 250px; overflow-y: auto; margin-top: 12px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;">
         ${keys.map(uid => {
           const f = friends[uid];
           return `
             <div class="friends-item" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
               <div style="display: flex; align-items: center; gap: 10px;">
                 <div style="position: relative;">
                   <img src="${f.avatar}" alt="${f.username}" onerror="this.src='img/personajes/amador-rivas.webp'" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; object-position: top; border: 2px solid rgba(255,255,255,0.12);">
                   <span class="invite-online-dot offline" data-uid="${uid}" style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(10,10,10,0.97); background: #6b7280;"></span>
                 </div>
                 <div style="text-align: left;">
                   <div style="font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 0.95rem; color: var(--text);">${f.username}</div>
                   <div class="invite-status-text" data-uid="${uid}" style="font-size: 0.7rem; color: var(--text2);">Desconectado/a</div>
                 </div>
               </div>
               <button class="q-btn invite-action-btn" data-uid="${uid}" onclick="sendInvitationFromModal('${uid}', '${currentRoom}', '${inviteMode}', this)" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(240,192,32,0.15); border-color: rgba(240,192,32,0.35); color: var(--accent); cursor: pointer; border-radius: 6px; font-family: 'Barlow Condensed', sans-serif; font-weight: bold; transition: all 0.2s;">
                 ✉️ Invitar
               </button>
             </div>
           `;
         }).join('')}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="quien-mode-box" style="max-width: 360px; padding: 24px; border: 1px solid rgba(240,192,32,0.3); border-radius: 20px; background: rgba(15,15,30,0.98); box-shadow: 0 10px 40px rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center;">
      <button class="lobby-back" onclick="document.getElementById('invite-friends-modal').remove()" style="align-self: flex-start; margin-bottom: 12px; background: transparent; border: none; color: var(--text2); font-size: 0.9rem; cursor: pointer;">← Cerrar</button>
      <div style="font-size: 2.2rem; margin-bottom: 6px;">👥</div>
      <h2 class="quien-title" style="font-size: 1.6rem; margin-bottom: 6px; letter-spacing: 2px; text-align: center; color: var(--accent); font-family: 'Bebas Neue', sans-serif;">INVITAR A AMIGOS</h2>
      <p class="quien-desc" style="font-size: 0.82rem; margin-bottom: 16px; text-align: center; color: var(--text2);">Selecciona a un amigo para invitarlo a tu partida.</p>
      
      <div style="width: 100%;">
        ${friendsHtml}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Vincular listeners de presencia para la ventana de invitación en tiempo real
  const db = firebase.database();
  keys.forEach(uid => {
    db.ref(`presence/${uid}`).on('value', snap => {
      const val = snap.val() || { online: false };
      const dot = modal.querySelector(`.invite-online-dot[data-uid="${uid}"]`);
      const statusText = modal.querySelector(`.invite-status-text[data-uid="${uid}"]`);
      const btn = modal.querySelector(`.invite-action-btn[data-uid="${uid}"]`);

      if (dot) {
        dot.style.background = val.online ? '#4ade80' : '#6b7280';
        dot.style.boxShadow = val.online ? '0 0 5px #4ade80' : 'none';
      }
      if (statusText) {
        statusText.textContent = val.online ? 'En línea' : 'Desconectado/a';
        statusText.style.color = val.online ? '#4ade80' : 'var(--text2)';
      }
      if (btn) {
        if (val.online) {
          btn.style.background = 'rgba(74,222,128,0.15)';
          btn.style.borderColor = 'rgba(74,222,128,0.4)';
          btn.style.color = '#4ade80';
        } else {
          btn.style.background = 'rgba(255,255,255,0.05)';
          btn.style.borderColor = 'rgba(255,255,255,0.1)';
          btn.style.color = 'var(--text2)';
        }
      }
    });
  });
}

async function sendInvitationFromModal(friendUid, roomCode, mode, btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
  }
  
  try {
    await inviteFriendToRoom(friendUid, roomCode, mode);
    if (btn) {
      btn.textContent = '✓ Enviada';
      btn.style.background = 'rgba(74,222,128,0.25)';
      btn.style.borderColor = 'rgba(74,222,128,0.5)';
      btn.style.color = '#4ade80';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '✉️ Invitar';
        // Reestablecer estilos basándose en presencia
        const dot = document.querySelector(`.invite-online-dot[data-uid="${friendUid}"]`);
        const online = dot && (dot.style.background === 'rgb(74, 222, 128)' || dot.style.background === '#4ade80');
        if (online) {
          btn.style.background = 'rgba(74,222,128,0.15)';
          btn.style.borderColor = 'rgba(74,222,128,0.4)';
          btn.style.color = '#4ade80';
        } else {
          btn.style.background = 'rgba(255,255,255,0.05)';
          btn.style.borderColor = 'rgba(255,255,255,0.1)';
          btn.style.color = 'var(--text2)';
        }
      }, 2000);
    }
  } catch (error) {
    console.error("Error al enviar invitación:", error);
    if (btn) {
      btn.textContent = '✕ Error';
      btn.style.background = 'rgba(239,68,68,0.2)';
      btn.style.borderColor = 'rgba(239,68,68,0.5)';
      btn.style.color = '#f87171';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '✉️ Invitar';
      }, 2000);
    }
  }
}

function _updateFriendsBadge() {
  const unreadChats = window._unreadChatsData || {};
  const invitations = window._invitationsData || {};
  
  const unreadChatCount = Object.keys(unreadChats).length;
  const invitationCount = Object.keys(invitations).length;
  
  const totalNotifications = unreadChatCount + invitationCount;
  
  const fab = document.getElementById('friends-fab-btn');
  if (!fab) return;
  
  let badge = document.getElementById('friends-fab-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'friends-fab-badge';
    badge.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: bold;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px rgba(239,68,68,0.6);
      animation: pulseBadge 1.5s infinite;
      z-index: 10;
      font-family: 'Barlow Condensed', sans-serif;
    `;
    
    if (!document.getElementById('pulse-badge-style')) {
      const s = document.createElement('style');
      s.id = 'pulse-badge-style';
      s.textContent = `
        @keyframes pulseBadge {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .unread-msg-pulse {
          animation: unreadPulse 1.2s infinite alternate !important;
        }
        @keyframes unreadPulse {
          from { transform: scale(1); box-shadow: 0 0 0 rgba(239,68,68,0); }
          to { transform: scale(1.08); box-shadow: 0 0 8px rgba(239,68,68,0.4); }
        }
      `;
      document.head.appendChild(s);
    }
    
    fab.style.position = 'relative';
    fab.appendChild(badge);
  }
  
  if (totalNotifications > 0) {
    badge.textContent = totalNotifications;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  // Actualizar los iconos de chat privados en la lista de amigos
  const friendsItems = document.querySelectorAll('.friends-item');
  friendsItems.forEach(item => {
    const friendUid = item.dataset.uid;
    if (!friendUid) return;
    
    const chatBtn = item.querySelector('.friends-chat-btn');
    if (chatBtn) {
      if (unreadChats[friendUid]) {
        chatBtn.style.background = 'rgba(239,68,68,0.2)';
        chatBtn.style.borderColor = 'rgba(239,68,68,0.5)';
        chatBtn.style.color = '#ef4444';
        chatBtn.classList.add('unread-msg-pulse');
      } else {
        chatBtn.style.background = '';
        chatBtn.style.borderColor = '';
        chatBtn.style.color = '';
        chatBtn.classList.remove('unread-msg-pulse');
      }
    }
  });
}
