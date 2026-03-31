const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const LobbyManager = require('./lobby/LobbyManager');
const { MIN_PLAYERS, TICK_RATE } = require('./game/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const lobby = new LobbyManager();

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'client')));

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send room list on connect
  socket.emit('lobby:rooms', lobby.listRooms());

  // Create room
  socket.on('lobby:create', ({ playerName, skinId }) => {
    const { roomId, room } = lobby.createRoom(socket.id, playerName, skinId);
    socket.join(roomId);
    socket.emit('lobby:joined', { roomId, playerId: socket.id });
    io.emit('lobby:rooms', lobby.listRooms());
    io.to(roomId).emit('lobby:players', getPlayerList(room));
  });

  // Join room
  socket.on('lobby:join', ({ roomId, playerName, skinId }) => {
    const result = lobby.joinRoom(roomId, socket.id, playerName, skinId);
    if (result.error) {
      socket.emit('lobby:error', result.error);
      return;
    }
    socket.join(roomId);
    socket.emit('lobby:joined', { roomId, playerId: socket.id });
    io.emit('lobby:rooms', lobby.listRooms());
    io.to(roomId).emit('lobby:players', getPlayerList(result.room));
  });

  // Start game
  socket.on('game:start', ({ mapSize, theme, layout } = {}) => {
    const room = lobby.getRoom(socket.id);
    const roomId = lobby.getRoomId(socket.id);
    if (!room || room.started) return;
    if (room.playerCount < MIN_PLAYERS) {
      socket.emit('lobby:error', `Need at least ${MIN_PLAYERS} players`);
      return;
    }

    room.start(mapSize, theme, layout);

    // Send start state to each player individually (with their ID)
    for (const [playerId] of room.players) {
      const startState = room.getStartState();
      startState.yourId = playerId;
      io.to(playerId).emit('game:start', startState);
    }

    // Start broadcasting state
    const broadcastInterval = setInterval(() => {
      if (room.gameOver || room.playerCount === 0) {
        clearInterval(broadcastInterval);
        const state = room.getState();
        io.to(roomId).emit('state', state);
        if (room.gameOver) {
          io.to(roomId).emit('game:over', {
            winnerId: state.winnerId,
            winnerName: state.winnerName
          });
        }
        return;
      }
      io.to(roomId).emit('state', room.getState());
    }, 1000 / TICK_RATE);
  });

  // Handle player input
  socket.on('input', (input) => {
    const room = lobby.getRoom(socket.id);
    if (room && room.started) {
      room.handleInput(socket.id, input);
    }
  });

  // Leave room
  socket.on('lobby:leave', () => {
    handleLeave(socket);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const roomId = lobby.getRoomId(socket.id);
  if (roomId) {
    const room = lobby.getRoom(socket.id);
    lobby.removePlayer(socket.id);
    socket.leave(roomId);
    if (room && room.playerCount > 0) {
      io.to(roomId).emit('lobby:players', getPlayerList(room));
    }
    io.emit('lobby:rooms', lobby.listRooms());
  }
}

function getPlayerList(room) {
  return [...room.players.values()].map(p => ({
    id: p.id,
    name: p.name,
    skinId: p.skinId
  }));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Bomber-Man server running on http://localhost:${PORT}`);
});
