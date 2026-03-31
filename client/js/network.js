const Network = (() => {
  let socket = null;
  const pendingListeners = [];

  function connect() {
    socket = io();

    // Register any listeners that were added before connect
    for (const { event, callback } of pendingListeners) {
      socket.on(event, callback);
    }
    pendingListeners.length = 0;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    return socket;
  }

  function getSocket() {
    return socket;
  }

  function sendInput(input) {
    if (socket) socket.emit('input', input);
  }

  function createRoom(playerName, skinId) {
    if (socket) socket.emit('lobby:create', { playerName, skinId });
  }

  function joinRoom(roomId, playerName, skinId) {
    if (socket) socket.emit('lobby:join', { roomId, playerName, skinId });
  }

  function leaveRoom() {
    if (socket) socket.emit('lobby:leave');
  }

  function startGame(mapSize, theme, layout) {
    if (socket) socket.emit('game:start', { mapSize, theme, layout });
  }

  function on(event, callback) {
    if (socket) {
      socket.on(event, callback);
    } else {
      pendingListeners.push({ event, callback });
    }
  }

  return { connect, getSocket, sendInput, createRoom, joinRoom, leaveRoom, startGame, on };
})();
