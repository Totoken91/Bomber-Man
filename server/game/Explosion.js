const { EXPLOSION_DURATION, WALL, BRICK, EMPTY } = require('./constants');

class Explosion {
  constructor(cells) {
    this.cells = cells; // [{x, y}]
    this.timer = EXPLOSION_DURATION;
  }

  tick(dt) {
    this.timer -= dt;
    return this.timer <= 0;
  }

  static calculate(bombX, bombY, range, map, bombs) {
    const cells = [{ x: bombX, y: bombY }];
    const destroyedBricks = [];
    const triggeredBombs = [];
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    for (const { dx, dy } of directions) {
      for (let i = 1; i <= range; i++) {
        const nx = bombX + dx * i;
        const ny = bombY + dy * i;
        const tile = map.getTile(nx, ny);

        if (tile === WALL) break;

        cells.push({ x: nx, y: ny });

        if (tile === BRICK) {
          destroyedBricks.push({ x: nx, y: ny });
          break;
        }

        // Check if there's a bomb at this position
        const bombAtPos = bombs.find(b => b.x === nx && b.y === ny && !b.exploded);
        if (bombAtPos) {
          triggeredBombs.push(bombAtPos);
        }
      }
    }

    return { cells, destroyedBricks, triggeredBombs };
  }

  serialize() {
    return {
      cells: this.cells,
      timer: this.timer
    };
  }
}

module.exports = Explosion;
