const GameState = (() => {
  let state = {
    map: null,
    players: [],
    bombs: [],
    explosions: [],
    powerUps: [],
    gameOver: false,
    winnerId: null,
    winnerName: null
  };

  let myId = null;

  function setMyId(id) {
    myId = id;
  }

  function getMyId() {
    return myId;
  }

  function setMap(map) {
    state.map = map;
  }

  function update(serverState) {
    if (serverState.map) state.map = serverState.map;
    if (serverState.players) state.players = serverState.players;
    if (serverState.bombs) state.bombs = serverState.bombs;
    if (serverState.explosions) state.explosions = serverState.explosions;
    if (serverState.powerUps) state.powerUps = serverState.powerUps;
    if (serverState.gameOver !== undefined) state.gameOver = serverState.gameOver;
    if (serverState.winnerId !== undefined) state.winnerId = serverState.winnerId;
    if (serverState.winnerName !== undefined) state.winnerName = serverState.winnerName;
  }

  function applyMapChanges(changes) {
    if (!state.map || !changes) return;
    for (const change of changes) {
      state.map[change.y][change.x] = change.value;
    }
  }

  function getState() {
    return state;
  }

  function reset() {
    state = {
      map: null,
      players: [],
      bombs: [],
      explosions: [],
      powerUps: [],
      gameOver: false,
      winnerId: null,
      winnerName: null
    };
    myId = null;
  }

  return { setMyId, getMyId, setMap, update, applyMapChanges, getState, reset };
})();
