const { TICK_RATE, SPAWN_POSITIONS, EMPTY, BRICK, MAX_PLAYERS } = require('./constants');
const GameMap = require('./GameMap');
const Player = require('./Player');
const Bomb = require('./Bomb');
const Explosion = require('./Explosion');
const PowerUp = require('./PowerUp');

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.map = new GameMap();
    this.players = new Map();
    this.bombs = [];
    this.explosions = [];
    this.activePowerUps = []; // power-ups visible on the map
    this.inputs = new Map();
    this.tickInterval = null;
    this.started = false;
    this.gameOver = false;
    this.winner = null;
    this.playerCount = 0;
  }

  addPlayer(socketId, name) {
    if (this.playerCount >= MAX_PLAYERS) return null;
    const spawnIndex = this.playerCount;
    const spawn = SPAWN_POSITIONS[spawnIndex];
    const player = new Player(socketId, name, spawn.x, spawn.y, spawnIndex);
    this.players.set(socketId, player);
    this.playerCount++;
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      player.alive = false;
      this.players.delete(socketId);
      this.playerCount--;
    }
    if (this.started && this.playerCount === 0) {
      this.stop();
    }
  }

  handleInput(socketId, input) {
    this.inputs.set(socketId, input);
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.gameOver = false;
    const tickMs = 1000 / TICK_RATE;
    this.tickInterval = setInterval(() => this.tick(tickMs), tickMs);
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  tick(dt) {
    if (this.gameOver) return;

    // 1. Process inputs: movement and bomb placement
    for (const [socketId, player] of this.players) {
      if (!player.alive) continue;

      const input = this.inputs.get(socketId);
      if (input) {
        player.applyInput(input);

        // Bomb placement
        if (input.bomb && player.canPlaceBomb()) {
          const bx = Math.round(player.x);
          const by = Math.round(player.y);
          const bombExists = this.bombs.some(b => b.x === bx && b.y === by && !b.exploded);
          if (!bombExists) {
            const bomb = new Bomb(bx, by, player.bombRange, socketId);
            this.bombs.push(bomb);
            player.activeBombs++;
            player.passThroughBombs.add(bomb.key);
          }
        }

        // Clear bomb flag after processing
        this.inputs.set(socketId, { ...input, bomb: false });
      }

      // Movement
      if (player.direction) {
        let dx = 0, dy = 0;
        switch (player.direction) {
          case 'up': dy = -1; break;
          case 'down': dy = 1; break;
          case 'left': dx = -1; break;
          case 'right': dx = 1; break;
        }

        const moveAmount = player.speed * (dt / 1000);
        const newX = player.x + dx * moveAmount;
        const newY = player.y + dy * moveAmount;

        // Check collision
        if (this.canMoveTo(player, newX, newY)) {
          player.x = newX;
          player.y = newY;
        } else {
          // Snap to nearest tile center on the blocked axis
          if (dx !== 0) {
            player.x = Math.round(player.x);
          }
          if (dy !== 0) {
            player.y = Math.round(player.y);
          }
        }
      }

      // Update pass-through bombs (remove bombs player has left)
      const currentTileKey = `${Math.round(player.x)},${Math.round(player.y)}`;
      for (const bombKey of player.passThroughBombs) {
        if (bombKey !== currentTileKey) {
          player.passThroughBombs.delete(bombKey);
        }
      }
    }

    // 2. Process bombs
    const detonationQueue = [];
    for (const bomb of this.bombs) {
      if (bomb.exploded) continue;
      if (bomb.tick(dt)) {
        detonationQueue.push(bomb);
      }
    }

    // 3. Process detonations (including chain reactions)
    const detonated = new Set();
    while (detonationQueue.length > 0) {
      const bomb = detonationQueue.shift();
      if (detonated.has(bomb.key)) continue;
      detonated.add(bomb.key);
      bomb.exploded = true;

      // Return bomb to player
      const owner = this.players.get(bomb.ownerId);
      if (owner) owner.activeBombs--;

      const { cells, destroyedBricks, triggeredBombs } = Explosion.calculate(
        bomb.x, bomb.y, bomb.range, this.map, this.bombs
      );

      this.explosions.push(new Explosion(cells));

      // Destroy bricks and reveal power-ups
      for (const brick of destroyedBricks) {
        this.map.setTile(brick.x, brick.y, EMPTY);
        const pu = this.map.revealPowerUp(brick.x, brick.y);
        if (pu) {
          this.activePowerUps.push(new PowerUp(pu.x, pu.y, pu.type));
        }
      }

      // Chain reaction
      for (const triggered of triggeredBombs) {
        if (!detonated.has(triggered.key)) {
          detonationQueue.push(triggered);
        }
      }
    }

    // Remove exploded bombs
    this.bombs = this.bombs.filter(b => !b.exploded);

    // 4. Update explosions
    this.explosions = this.explosions.filter(e => !e.tick(dt));

    // 5. Check player deaths
    const explosionCells = new Set();
    for (const explosion of this.explosions) {
      for (const cell of explosion.cells) {
        explosionCells.add(`${cell.x},${cell.y}`);
      }
    }

    for (const [, player] of this.players) {
      if (!player.alive) continue;
      const px = Math.round(player.x);
      const py = Math.round(player.y);
      if (explosionCells.has(`${px},${py}`)) {
        player.alive = false;
      }
    }

    // 6. Check power-up pickups
    for (const [, player] of this.players) {
      if (!player.alive) continue;
      const px = Math.round(player.x);
      const py = Math.round(player.y);
      const puIndex = this.activePowerUps.findIndex(pu => pu.x === px && pu.y === py);
      if (puIndex !== -1) {
        player.applyPowerUp(this.activePowerUps[puIndex].type);
        this.activePowerUps.splice(puIndex, 1);
      }
    }

    // 7. Check win condition
    const alivePlayers = [...this.players.values()].filter(p => p.alive);
    if (alivePlayers.length <= 1 && this.players.size > 0) {
      this.gameOver = true;
      this.winner = alivePlayers.length === 1 ? alivePlayers[0] : null;
      this.stop();
    }
  }

  canMoveTo(player, newX, newY) {
    // Check collision with a small hitbox (0.35 radius)
    const r = 0.35;
    const corners = [
      { x: newX - r, y: newY - r },
      { x: newX + r, y: newY - r },
      { x: newX - r, y: newY + r },
      { x: newX + r, y: newY + r }
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x + 0.5);
      const tileY = Math.floor(corner.y + 0.5);

      if (!this.map.isWalkable(tileX, tileY)) return false;

      // Check bomb collision (but allow pass-through for own bombs)
      const bombKey = `${tileX},${tileY}`;
      if (!player.passThroughBombs.has(bombKey)) {
        const bombHere = this.bombs.some(b => b.x === tileX && b.y === tileY && !b.exploded);
        if (bombHere) return false;
      }
    }
    return true;
  }

  getState() {
    return {
      map: this.map.serialize(),
      players: [...this.players.values()].map(p => p.serialize()),
      bombs: this.bombs.map(b => b.serialize()),
      explosions: this.explosions.map(e => e.serialize()),
      powerUps: this.activePowerUps.map(pu => pu.serialize()),
      gameOver: this.gameOver,
      winnerId: this.winner ? this.winner.id : null,
      winnerName: this.winner ? this.winner.name : null
    };
  }

  getStartState() {
    return {
      map: this.map.serialize(),
      players: [...this.players.values()].map(p => p.serialize())
    };
  }
}

module.exports = GameRoom;
