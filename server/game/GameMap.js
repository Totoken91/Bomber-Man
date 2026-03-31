const { EMPTY, WALL, BRICK, POWERUP_CHANCE, POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED, POWERUP_SHIELD, getSpawnPositions } = require('./constants');

class GameMap {
  constructor(cols, rows, layout) {
    this.cols = cols;
    this.rows = rows;
    this.layout = layout || 'classic';
    this.grid = [];
    this.powerUps = new Map();
    this.generate();
  }

  generate() {
    const spawns = getSpawnPositions(this.cols, this.rows);

    // Step 1: Fill with border walls and interior bricks
    this.grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) {
          row.push(WALL);
        } else {
          row.push(BRICK);
        }
      }
      this.grid.push(row);
    }

    // Step 2: Place interior walls based on layout
    this.placeWalls();

    // Step 3: Clear safe zones around spawn positions
    for (const spawn of spawns) {
      this.grid[spawn.y][spawn.x] = EMPTY;
      if (spawn.x + 1 < this.cols - 1) this.grid[spawn.y][spawn.x + 1] = EMPTY;
      if (spawn.x - 1 > 0) this.grid[spawn.y][spawn.x - 1] = EMPTY;
      if (spawn.y + 1 < this.rows - 1) this.grid[spawn.y + 1][spawn.x] = EMPTY;
      if (spawn.y - 1 > 0) this.grid[spawn.y - 1][spawn.x] = EMPTY;
    }

    // Step 4: Remove some bricks to create paths (varies by layout)
    const removalRate = this.getRemovalRate();
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < removalRate) {
          this.grid[y][x] = EMPTY;
        }
      }
    }

    // Step 5: Pre-assign hidden power-ups under bricks
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === BRICK && Math.random() < POWERUP_CHANCE) {
          let type;
          const roll = Math.random();
          if (roll < 0.1) {
            type = POWERUP_SHIELD;
          } else {
            type = [POWERUP_BOMB, POWERUP_FIRE, POWERUP_SPEED][Math.floor(Math.random() * 3)];
          }
          this.powerUps.set(`${x},${y}`, type);
        }
      }
    }
  }

  placeWalls() {
    switch (this.layout) {
      case 'classic':
        this.placeWallsClassic();
        break;
      case 'arena':
        this.placeWallsArena();
        break;
      case 'corridors':
        this.placeWallsCorridors();
        break;
      case 'maze':
        this.placeWallsMaze();
        break;
      default:
        this.placeWallsClassic();
    }
  }

  // Classic: regular pillars at even positions
  placeWallsClassic() {
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (x % 2 === 0 && y % 2 === 0) {
          this.grid[y][x] = WALL;
        }
      }
    }
  }

  // Arena: open center, pillars only on the periphery
  placeWallsArena() {
    const cx = Math.floor(this.cols / 2);
    const cy = Math.floor(this.rows / 2);
    const arenaRadius = Math.min(3, Math.floor(Math.min(this.cols, this.rows) / 4));

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);

        // Center area: clear everything
        if (dx <= arenaRadius && dy <= arenaRadius) {
          this.grid[y][x] = EMPTY;
          continue;
        }

        // Periphery: regular pillars
        if (x % 2 === 0 && y % 2 === 0) {
          this.grid[y][x] = WALL;
        }
      }
    }
  }

  // Corridors: cross-shaped corridors through the center
  placeWallsCorridors() {
    const midX = Math.floor(this.cols / 2);
    const midY = Math.floor(this.rows / 2);

    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        // Central cross corridors: always empty
        if (x === midX || y === midY) {
          this.grid[y][x] = EMPTY;
          continue;
        }

        // Adjacent to corridors: also clear for wider paths
        if (Math.abs(x - midX) === 1 || Math.abs(y - midY) === 1) {
          // Keep as brick (destructible), don't place walls
          continue;
        }

        // Rest: denser pillar pattern
        if (x % 2 === 0 && y % 2 === 0) {
          this.grid[y][x] = WALL;
        }
      }
    }
  }

  // Maze: zigzag walls creating winding paths
  placeWallsMaze() {
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        // Standard pillars
        if (x % 2 === 0 && y % 2 === 0) {
          this.grid[y][x] = WALL;
          continue;
        }

        // Add extra wall segments extending from pillars in alternating directions
        // Creates a maze-like pattern
        if (x % 2 === 0 && y % 2 !== 0) {
          // Vertical segments: extend walls down from even-row pillars on even columns
          if (y % 4 === 1) {
            this.grid[y][x] = WALL;
          }
        }

        if (y % 2 === 0 && x % 2 !== 0) {
          // Horizontal segments: extend walls right from even-col pillars on even rows
          if (x % 4 === 1) {
            this.grid[y][x] = WALL;
          }
        }
      }
    }
  }

  getRemovalRate() {
    switch (this.layout) {
      case 'classic': return 0.15;
      case 'arena': return 0.25;   // More open
      case 'corridors': return 0.12;
      case 'maze': return 0.08;    // Very few paths - strategic
      default: return 0.15;
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
    return this.getTile(x, y) === EMPTY;
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
