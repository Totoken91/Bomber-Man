const { TICK_RATE, EMPTY, BRICK, MAX_PLAYERS, MAP_SIZES, getSpawnPositions } = require('./constants');
const GameMap = require('./GameMap');
const Player = require('./Player');
const Bomb = require('./Bomb');
const Explosion = require('./Explosion');
const PowerUp = require('./PowerUp');

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.map = null;
    this.mapSize = 'normal';
    this.cols = 15;
    this.rows = 13;
    this.players = new Map();
    this.playerSkins = new Map(); // socketId -> skinId (stored before game starts)
    this.bombs = [];
    this.explosions = [];
    this.activePowerUps = [];
    this.inputs = new Map();
    this.tickInterval = null;
    this.started = false;
    this.gameOver = false;
    this.winner = null;
    this.playerCount = 0;
  }

  addPlayer(socketId, name, skinId) {
    if (this.playerCount >= MAX_PLAYERS) return null;
    this.playerSkins.set(socketId, skinId || 0);
    const spawnIndex = this.playerCount;
    const spawns = getSpawnPositions(this.cols, this.rows);
    const spawn = spawns[spawnIndex];
    const player = new Player(socketId, name, spawn.x, spawn.y, skinId || 0);
    this.players.set(socketId, player);
    this.playerCount++;
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      player.alive = false;
      this.players.delete(socketId);
      this.playerSkins.delete(socketId);
      this.playerCount--;
    }
    if (this.started && this.playerCount === 0) {
      this.stop();
    }
  }

  handleInput(socketId, input) {
    const existing = this.inputs.get(socketId);
    if (existing && existing.bomb && !input.bomb) {
      this.inputs.set(socketId, { ...input, bomb: true });
    } else {
      this.inputs.set(socketId, input);
    }
  }

  start(mapSize, theme, layout) {
    if (this.started) return;

    // Set map size
    this.mapSize = mapSize || 'normal';
    const sizeConfig = MAP_SIZES[this.mapSize] || MAP_SIZES.normal;
    this.cols = sizeConfig.cols;
    this.rows = sizeConfig.rows;
    this.theme = theme || 'dungeon';
    this.layout = layout || 'classic';

    // Generate map with layout
    this.map = new GameMap(this.cols, this.rows, this.layout);

    // Reposition players to correct spawns for this map size
    const spawns = getSpawnPositions(this.cols, this.rows);
    let i = 0;
    for (const [socketId, player] of this.players) {
      const spawn = spawns[i];
      player.x = spawn.x;
      player.y = spawn.y;
      i++;
    }

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

      // Tick shield timer
      player.tickShield(dt);

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

        if (this.canMoveTo(player, newX, newY)) {
          player.x = newX;
          player.y = newY;
        } else {
          let movedX = false, movedY = false;

          if (dx !== 0 && this.canMoveTo(player, newX, player.y)) {
            player.x = newX;
            movedX = true;
          }
          if (dy !== 0 && this.canMoveTo(player, player.x, newY)) {
            player.y = newY;
            movedY = true;
          }

          const CORNER_THRESHOLD = 0.4;
          const NUDGE_SPEED = 3.0;
          const nudgeAmount = NUDGE_SPEED * (dt / 1000);

          if (dx !== 0 && !movedX) {
            const targetY = Math.round(player.y);
            const offsetY = targetY - player.y;
            if (Math.abs(offsetY) > 0.01 && Math.abs(offsetY) < CORNER_THRESHOLD) {
              const nudgeY = Math.sign(offsetY) * Math.min(nudgeAmount, Math.abs(offsetY));
              if (this.canMoveTo(player, player.x, player.y + nudgeY)) {
                player.y += nudgeY;
              }
            }
          }

          if (dy !== 0 && !movedY) {
            const targetX = Math.round(player.x);
            const offsetX = targetX - player.x;
            if (Math.abs(offsetX) > 0.01 && Math.abs(offsetX) < CORNER_THRESHOLD) {
              const nudgeX = Math.sign(offsetX) * Math.min(nudgeAmount, Math.abs(offsetX));
              if (this.canMoveTo(player, player.x + nudgeX, player.y)) {
                player.x += nudgeX;
              }
            }
          }

          if (!movedX && dx !== 0) player.x = Math.round(player.x);
          if (!movedY && dy !== 0) player.y = Math.round(player.y);
        }

        const ALIGN_THRESHOLD = 0.15;
        const ALIGN_SPEED = 6.0;
        const alignAmount = ALIGN_SPEED * (dt / 1000);

        if (dx !== 0) {
          const nearestY = Math.round(player.y);
          const yOff = nearestY - player.y;
          if (Math.abs(yOff) > 0.001 && Math.abs(yOff) < ALIGN_THRESHOLD) {
            player.y += Math.sign(yOff) * Math.min(alignAmount, Math.abs(yOff));
          }
        }
        if (dy !== 0) {
          const nearestX = Math.round(player.x);
          const xOff = nearestX - player.x;
          if (Math.abs(xOff) > 0.001 && Math.abs(xOff) < ALIGN_THRESHOLD) {
            player.x += Math.sign(xOff) * Math.min(alignAmount, Math.abs(xOff));
          }
        }
      }

      // Update pass-through bombs
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

    // 3. Process detonations
    const detonated = new Set();
    while (detonationQueue.length > 0) {
      const bomb = detonationQueue.shift();
      if (detonated.has(bomb.key)) continue;
      detonated.add(bomb.key);
      bomb.exploded = true;

      const owner = this.players.get(bomb.ownerId);
      if (owner) owner.activeBombs--;

      const { cells, destroyedBricks, triggeredBombs } = Explosion.calculate(
        bomb.x, bomb.y, bomb.range, this.map, this.bombs
      );

      this.explosions.push(new Explosion(cells));

      for (const brick of destroyedBricks) {
        this.map.setTile(brick.x, brick.y, EMPTY);
        const pu = this.map.revealPowerUp(brick.x, brick.y);
        if (pu) {
          this.activePowerUps.push(new PowerUp(pu.x, pu.y, pu.type));
        }
      }

      for (const triggered of triggeredBombs) {
        if (!detonated.has(triggered.key)) {
          detonationQueue.push(triggered);
        }
      }
    }

    this.bombs = this.bombs.filter(b => !b.exploded);

    // 4. Update explosions
    this.explosions = this.explosions.filter(e => !e.tick(dt));

    // 5. Check player deaths (skip if shielded)
    const explosionCells = new Set();
    for (const explosion of this.explosions) {
      for (const cell of explosion.cells) {
        explosionCells.add(`${cell.x},${cell.y}`);
      }
    }

    for (const [, player] of this.players) {
      if (!player.alive) continue;
      if (player.hasShield) continue; // Shield protects from death
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
      cols: this.cols,
      rows: this.rows,
      theme: this.theme,
      layout: this.layout,
      players: [...this.players.values()].map(p => p.serialize())
    };
  }
}

module.exports = GameRoom;
