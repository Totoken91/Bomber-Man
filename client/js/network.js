const Network = (() => {
  let socket = null;

  function connect() {
    socket = io();
    return socket;
  }

  function getSocket() {
    return socket;
  }

  function sendInput(input) {
    if (socket) socket.emit('input', input);
  }

  function createRoom(playerName) {
    if (socket) socket.emit('lobby:create', { playerName });
  }

  function joinRoom(roomId, playerName) {
    if (socket) socket.emit('lobby:join', { roomId, playerName });
  }

  function leaveRoom() {
    if (socket) socket.emit('lobby:leave');
  }

  function startGame() {
    if (socket) socket.emit('game:start');
  }

  function on(event, callback) {
    if (socket) socket.on(event, callback);
  }

  return { connect, getSocket, sendInput, createRoom, joinRoom, leaveRoom, startGame, on };
})();
