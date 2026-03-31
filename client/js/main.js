(() => {
  // Init lobby (registers event listeners)
  Lobby.init();

  // Load sprites then init renderer
  const canvas = document.getElementById('game-canvas');
  Renderer.init(canvas);
  SpriteLoader.load().then(() => {
    console.log('Sprites loaded');
  }).catch(err => {
    console.warn('Sprite loading failed, using fallback:', err);
  });

  let gameRunning = false;
  let inputInterval = null;

  // Game start event
  Network.on('game:start', (data) => {
    GameState.setMyId(data.yourId);
    GameState.setMap(data.map);
    GameState.update({
      players: data.players,
      bombs: [],
      explosions: [],
      powerUps: [],
      gameOver: false,
      winnerId: null,
      winnerName: null
    });

    Lobby.showScreen('game-screen');
    gameRunning = true;

    // Start input sending loop
    if (inputInterval) clearInterval(inputInterval);
    inputInterval = setInterval(() => {
      if (gameRunning) {
        const input = Input.getInput();
        Network.sendInput(input);
      }
    }, 1000 / 20); // 20 inputs per second, matching server tick rate

    // Start render loop
    requestAnimationFrame(renderLoop);
  });

  // State updates from server
  Network.on('state', (serverState) => {
    GameState.update(serverState);
  });

  // Game over
  Network.on('game:over', (data) => {
    gameRunning = false;
    if (inputInterval) {
      clearInterval(inputInterval);
      inputInterval = null;
    }

    const overlay = document.getElementById('gameover-overlay');
    const text = document.getElementById('gameover-text');

    if (data.winnerName) {
      const myId = GameState.getMyId();
      if (data.winnerId === myId) {
        text.textContent = 'VICTOIRE !';
        text.style.color = '#2ecc71';
      } else {
        text.textContent = `${data.winnerName} a gagné !`;
        text.style.color = '#e74c3c';
      }
    } else {
      text.textContent = 'Égalité !';
      text.style.color = '#f4a261';
    }

    overlay.classList.add('active');
  });

  function renderLoop() {
    const state = GameState.getState();
    Renderer.render(state);

    // Update HUD
    updateHUD(state);

    if (gameRunning || (state.explosions && state.explosions.length > 0)) {
      requestAnimationFrame(renderLoop);
    }
  }

  function updateHUD(state) {
    const hud = document.getElementById('hud-info');
    if (!state.players) return;

    const alive = state.players.filter(p => p.alive);
    hud.textContent = `Joueurs en vie : ${alive.length}/${state.players.length}`;
  }

  // Connect to server AFTER all listeners are registered
  Network.connect();
})();
