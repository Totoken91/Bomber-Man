const { BOMB_TIMER } = require('./constants');

class Bomb {
  constructor(x, y, range, ownerId) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.ownerId = ownerId;
    this.timer = BOMB_TIMER;
    this.exploded = false;
  }

  tick(dt) {
    this.timer -= dt;
    return this.timer <= 0;
  }

  get key() {
    return `${this.x},${this.y}`;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      timer: this.timer,
      ownerId: this.ownerId
    };
  }
}

module.exports = Bomb;
