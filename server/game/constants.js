module.exports = {
  GRID_COLS: 15,
  GRID_ROWS: 13,
  TILE_SIZE: 48,
  TICK_RATE: 20,
  BOMB_TIMER: 3000,
  EXPLOSION_DURATION: 500,
  DEFAULT_SPEED: 4,
  DEFAULT_BOMB_RANGE: 2,
  DEFAULT_MAX_BOMBS: 1,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  POWERUP_CHANCE: 0.3,

  // Tile types
  EMPTY: 0,
  WALL: 1,
  BRICK: 2,

  // Power-up types
  POWERUP_BOMB: 'bomb_up',
  POWERUP_FIRE: 'fire_up',
  POWERUP_SPEED: 'speed_up',

  // Spawn positions (corners)
  SPAWN_POSITIONS: [
    { x: 1, y: 1 },
    { x: 13, y: 1 },
    { x: 1, y: 11 },
    { x: 13, y: 11 }
  ]
};
