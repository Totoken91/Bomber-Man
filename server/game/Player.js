const { DEFAULT_SPEED, DEFAULT_BOMB_RANGE, DEFAULT_MAX_BOMBS, SHIELD_DURATION } = require('./constants');

class Player {
  constructor(id, name, spawnX, spawnY, skinId) {
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
    this.skinId = skinId || 0;
    this.passThroughBombs = new Set();
    this.shieldTimer = 0;
  }

  get hasShield() {
    return this.shieldTimer > 0;
  }

  applyInput(input) {
    if (!this.alive) return;
    this.direction = input.direction || null;
  }

  canPlaceBomb() {
    return this.alive && this.activeBombs < this.maxBombs;
  }

  tickShield(dt) {
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer < 0) this.shieldTimer = 0;
    }
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
      case 'shield':
        this.shieldTimer = SHIELD_DURATION;
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
      skinId: this.skinId,
      hasShield: this.hasShield
    };
  }
}

module.exports = Player;
