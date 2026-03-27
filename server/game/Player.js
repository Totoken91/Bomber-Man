const { DEFAULT_SPEED, DEFAULT_BOMB_RANGE, DEFAULT_MAX_BOMBS } = require('./constants');

class Player {
  constructor(id, name, spawnX, spawnY, colorIndex) {
    this.id = id;
    this.name = name;
    this.x = spawnX;
    this.y = spawnY;
    this.speed = DEFAULT_SPEED;
    this.maxBombs = DEFAULT_MAX_BOMBS;
    this.activeBombs = 0;
    this.bombRange = DEFAULT_BOMB_RANGE;
    this.alive = true;
    this.direction = null;
    this.colorIndex = colorIndex;
    this.passThroughBombs = new Set(); // bomb keys player is standing on
  }

  applyInput(input) {
    if (!this.alive) return;
    this.direction = input.direction || null;
  }

  canPlaceBomb() {
    return this.alive && this.activeBombs < this.maxBombs;
  }

  applyPowerUp(type) {
    switch (type) {
      case 'bomb_up':
        this.maxBombs++;
        break;
      case 'fire_up':
        this.bombRange++;
        break;
      case 'speed_up':
        this.speed += 0.8;
        break;
    }
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      alive: this.alive,
      colorIndex: this.colorIndex
    };
  }
}

module.exports = Player;
