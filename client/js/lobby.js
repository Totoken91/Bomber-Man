const Lobby = (() => {
  let currentRoomId = null;
  let isHost = false;
  let selectedSkin = 0;
  let selectedMapSize = 'normal';
  let selectedTheme = 'dungeon';
  let selectedLayout = 'classic';

  function init() {
    const btnCreate = document.getElementById('btn-create');
    const btnStart = document.getElementById('btn-start');
    const btnLeave = document.getElementById('btn-leave');
    const btnBackLobby = document.getElementById('btn-back-lobby');
    const nameInput = document.getElementById('player-name');

    buildSkinSelector();

    // Option buttons (map size, theme, layout)
    setupOptionButtons('.map-size-btn', 'size', v => selectedMapSize = v);
    setupOptionButtons('.theme-btn', 'theme', v => selectedTheme = v);
    setupOptionButtons('.layout-btn', 'layout', v => selectedLayout = v);

    btnCreate.addEventListener('click', () => {
      const name = getPlayerName();
      if (!name) return;
      Network.createRoom(name, selectedSkin);
    });

    btnStart.addEventListener('click', () => {
      Network.startGame(selectedMapSize, selectedTheme, selectedLayout);
    });

    btnLeave.addEventListener('click', () => {
      Network.leaveRoom();
      currentRoomId = null;
      isHost = false;
      showScreen('lobby-screen');
    });

    btnBackLobby.addEventListener('click', () => {
      document.getElementById('gameover-overlay').classList.remove('active');
      Network.leaveRoom();
      currentRoomId = null;
      isHost = false;
      GameState.reset();
      showScreen('lobby-screen');
    });

    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btnCreate.click();
    });

    Network.on('lobby:rooms', (rooms) => {
      renderRooms(rooms);
    });

    Network.on('lobby:joined', ({ roomId, playerId }) => {
      currentRoomId = roomId;
      if (!isHost) isHost = true;
      showScreen('waiting-screen');
    });

    Network.on('lobby:players', (players) => {
      renderPlayerList(players);
      const socket = Network.getSocket();
      const amHost = players.length > 0 && players[0].id === socket.id;
      const btnStart = document.getElementById('btn-start');
      btnStart.style.display = (amHost && players.length >= 2) ? 'block' : 'none';

      // Show host options only for host
      const hostOptions = document.getElementById('host-options');
      hostOptions.style.display = amHost ? 'block' : 'none';

      const info = document.getElementById('waiting-info');
      if (players.length < 2) {
        info.textContent = 'En attente de joueurs... (min. 2)';
      } else {
        info.textContent = amHost ? 'Configure et lance la partie !' : 'En attente du lancement...';
      }
    });

    Network.on('lobby:error', (msg) => {
      alert(msg);
    });
  }

  function setupOptionButtons(selector, dataAttr, setter) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setter(btn.dataset[dataAttr]);
      });
    });
  }

  function buildSkinSelector() {
    const container = document.getElementById('skin-selector');
    const skins = SpriteLoader.getSkins();

    container.innerHTML = skins.map(skin => {
      const spritePath = SpriteLoader.getSkinSpritePath(skin.id);
      return `<img class="skin-item ${skin.id === selectedSkin ? 'selected' : ''}"
                   data-skin-id="${skin.id}"
                   src="${spritePath}"
                   alt="${skin.name}"
                   title="${skin.name}">`;
    }).join('');

    container.addEventListener('click', (e) => {
      const item = e.target.closest('.skin-item');
      if (!item) return;
      selectedSkin = parseInt(item.dataset.skinId);
      container.querySelectorAll('.skin-item').forEach(s => s.classList.remove('selected'));
      item.classList.add('selected');
    });
  }

  function getPlayerName() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
      document.getElementById('player-name').focus();
      document.getElementById('player-name').placeholder = 'Entre ton pseudo !';
      return null;
    }
    return name;
  }

  function renderRooms(rooms) {
    const container = document.getElementById('rooms-container');
    if (rooms.length === 0) {
      container.innerHTML = '<p class="no-rooms">Aucune salle disponible</p>';
      return;
    }

    container.innerHTML = rooms.map(room => `
      <div class="room-item">
        <div class="room-info">
          <div>Salle ${room.id.replace('room_', '#')}</div>
          <div class="room-players">${room.players.join(', ')} (${room.playerCount}/${room.maxPlayers})</div>
        </div>
        <button onclick="Lobby.joinRoom('${room.id}')">Rejoindre</button>
      </div>
    `).join('');
  }

  function renderPlayerList(players) {
    const container = document.getElementById('players-list');
    container.innerHTML = players.map(p => {
      const spritePath = SpriteLoader.getSkinSpritePath(p.skinId !== undefined ? p.skinId : 0);
      return `
        <div class="player-item">
          <img class="player-skin" src="${spritePath}" alt="skin">
          <span>${p.name}</span>
        </div>`;
    }).join('');
  }

  function joinRoom(roomId) {
    const name = getPlayerName();
    if (!name) return;
    isHost = false;
    Network.joinRoom(roomId, name, selectedSkin);
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  return { init, joinRoom, showScreen };
})();
