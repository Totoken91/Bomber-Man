const { GRID_COLS, GRID_ROWS, EMPTY, WALL, BRICK, SPAWN_POSITIONS, POWERUP_CHANCE, POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED } = require('./constants');

class GameMap {
  constructor() {
    this.grid = [];
    this.powerUps = new Map(); // key: "x,y", value: type
    this.generate();
  }

  generate() {
    this.grid = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const row = [];
      for (let x = 0; x < GRID_COLS; x++) {
        if (x === 0 || y === 0 || x === GRID_COLS - 1 || y === GRID_ROWS - 1) {
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
    for (const spawn of SPAWN_POSITIONS) {
      this.grid[spawn.y][spawn.x] = EMPTY;
      if (spawn.x + 1 < GRID_COLS - 1) this.grid[spawn.y][spawn.x + 1] = EMPTY;
      if (spawn.x - 1 > 0) this.grid[spawn.y][spawn.x - 1] = EMPTY;
      if (spawn.y + 1 < GRID_ROWS - 1) this.grid[spawn.y + 1][spawn.x] = EMPTY;
      if (spawn.y - 1 > 0) this.grid[spawn.y - 1][spawn.x] = EMPTY;
    }

    // Randomly remove some bricks to create paths
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (let x = 1; x < GRID_COLS - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < 0.15) {
          this.grid[y][x] = EMPTY;
        }
      }
    }

    // Pre-assign hidden power-ups under bricks
    const powerUpTypes = [POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED];
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (let x = 1; x < GRID_COLS - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < POWERUP_CHANCE) {
          const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          this.powerUps.set(`${x},${y}`, type);
        }
      }
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return WALL;
    return this.grid[y][x];
  }

  setTile(x, y, value) {
    if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS) {
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
