const { EMPTY, WALL, BRICK, POWERUP_CHANCE, POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED, POWERUP_SHIELD, getSpawnPositions } = require('./constants');

class GameMap {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    this.powerUps = new Map();
    this.generate();
  }

  generate() {
    const spawns = getSpawnPositions(this.cols, this.rows);
    this.grid = [];

    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) {
          row.push(WALL);
        } else if (x % 2 === 0 && y % 2 === 0) {
          row.push(WALL);
        } else {
          row.push(BRICK);
        }
      }
      this.grid.push(row);
    }

    // Clear safe zones around spawn positions
    for (const spawn of spawns) {
      this.grid[spawn.y][spawn.x] = EMPTY;
      if (spawn.x + 1 < this.cols - 1) this.grid[spawn.y][spawn.x + 1] = EMPTY;
      if (spawn.x - 1 > 0) this.grid[spawn.y][spawn.x - 1] = EMPTY;
      if (spawn.y + 1 < this.rows - 1) this.grid[spawn.y + 1][spawn.x] = EMPTY;
      if (spawn.y - 1 > 0) this.grid[spawn.y - 1][spawn.x] = EMPTY;
    }

    // Randomly remove some bricks to create paths
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < 0.15) {
          this.grid[y][x] = EMPTY;
        }
      }
    }

    // Pre-assign hidden power-ups under bricks
    const powerUpTypes = [POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED, POWERUP_SHIELD];
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < POWERUP_CHANCE) {
          // Shield is rarer (weighted selection)
          let type;
          const roll = Math.random();
          if (roll < 0.1) {
            type = POWERUP_SHIELD; // 10% of power-ups are shields
          } else {
            type = [POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED][Math.floor(Math.random() * 3)];
          }
          this.powerUps.set(`${x},${y}`, type);
        }
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return WALL;
    return this.grid[y][x];
  }

  setTile(x, y, value) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      this.grid[y][x] = value;
    }
  }

  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    return tile === EMPTY;
  }

  revealPowerUp(x, y) {
    const key = `${x},${y}`;
    if (this.powerUps.has(key)) {
      const type = this.powerUps.get(key);
      this.powerUps.delete(key);
      return { x, y, type };
    }
    return null;
  }

  serialize() {
    return this.grid.map(row => [...row]);
  }
}

module.exports = GameMap;
