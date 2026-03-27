const Lobby = (() => {
  let currentRoomId = null;
  let isHost = false;

  function init() {
    const btnCreate = document.getElementById('btn-create');
    const btnStart = document.getElementById('btn-start');
    const btnLeave = document.getElementById('btn-leave');
    const btnBackLobby = document.getElementById('btn-back-lobby');
    const nameInput = document.getElementById('player-name');

    btnCreate.addEventListener('click', () => {
      const name = getPlayerName();
      if (!name) return;
      Network.createRoom(name);
    });

    btnStart.addEventListener('click', () => {
      Network.startGame();
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

    // Enter key to create/join
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btnCreate.click();
    });

    // Network events
    Network.on('lobby:rooms', (rooms) => {
      renderRooms(rooms);
    });

    Network.on('lobby:joined', ({ roomId, playerId }) => {
      currentRoomId = roomId;
      // First player in room is host
      if (!isHost) {
        isHost = true;
      }
      showScreen('waiting-screen');
    });

    Network.on('lobby:players', (players) => {
      renderPlayerList(players);
      // Show start button only for first player (host) and if 2+ players
      const socket = Network.getSocket();
      const amHost = players.length > 0 && players[0].id === socket.id;
      const btnStart = document.getElementById('btn-start');
      btnStart.style.display = (amHost && players.length >= 2) ? 'block' : 'none';

      const info = document.getElementById('waiting-info');
      if (players.length < 2) {
        info.textContent = 'En attente de joueurs... (min. 2)';
      } else {
        info.textContent = amHost ? 'Appuie sur "Lancer la partie" !' : 'En attente du lancement...';
      }
    });

    Network.on('lobby:error', (msg) => {
      alert(msg);
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
    const colors = ['#f1c40f', '#3498db', '#e74c3c', '#2ecc71'];
    const container = document.getElementById('players-list');
    container.innerHTML = players.map(p => `
      <div class="player-item">
        <div class="player-color" style="background:${colors[p.colorIndex]}"></div>
        <span>${p.name}</span>
      </div>
    `).join('');
  }

  function joinRoom(roomId) {
    const name = getPlayerName();
    if (!name) return;
    isHost = false;
    Network.joinRoom(roomId, name);
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  return { init, joinRoom, showScreen };
})();
