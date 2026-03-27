const GameRoom = require('../game/GameRoom');
const { MIN_PLAYERS, MAX_PLAYERS } = require('../game/constants');

class LobbyManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // socketId -> roomId
    this.nextRoomId = 1;
  }

  createRoom(socketId, playerName) {
    const roomId = `room_${this.nextRoomId++}`;
    const room = new GameRoom(roomId);
    room.addPlayer(socketId, playerName);
    this.rooms.set(roomId, room);
    this.playerRooms.set(socketId, roomId);
    return { roomId, room };
  }

  joinRoom(roomId, socketId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.started) return { error: 'Game already started' };
    if (room.playerCount >= MAX_PLAYERS) return { error: 'Room is full' };

    room.addPlayer(socketId, playerName);
    this.playerRooms.set(socketId, roomId);
    return { roomId, room };
  }

  removePlayer(socketId) {
    const roomId = this.playerRooms.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(socketId);
      if (room.playerCount === 0) {
        room.stop();
        this.rooms.delete(roomId);
      }
    }
    this.playerRooms.delete(socketId);
    return roomId;
  }

  getRoom(socketId) {
    const roomId = this.playerRooms.get(socketId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  getRoomId(socketId) {
    return this.playerRooms.get(socketId);
  }

  listRooms() {
    const list = [];
    for (const [roomId, room] of this.rooms) {
      if (!room.started) {
        list.push({
          id: roomId,
          playerCount: room.playerCount,
          maxPlayers: MAX_PLAYERS,
          players: [...room.players.values()].map(p => p.name)
        });
      }
    }
    return list;
  }
}

module.exports = LobbyManager;
