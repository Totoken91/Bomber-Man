class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      type: this.type
    };
  }
}

module.exports = PowerUp;
