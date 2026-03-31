module.exports = {
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
  SHIELD_DURATION: 4000,

  // Tile types
  EMPTY: 0,
  WALL: 1,
  BRICK: 2,

  // Power-up types
  POWERUP_BOMB: 'bomb_up',
  POWERUP_FIRE: 'fire_up',
  POWERUP_SPEED: 'speed_up',
  POWERUP_SHIELD: 'shield',

  // Map sizes
  MAP_SIZES: {
    small:  { cols: 11, rows: 9 },
    normal: { cols: 15, rows: 13 },
    large:  { cols: 19, rows: 15 }
  },

  // Map themes (visual only, handled client-side)
  MAP_THEMES: ['dungeon', 'fortress', 'crypt'],

  // Map layouts (affect generation algorithm)
  MAP_LAYOUTS: ['classic', 'arena', 'corridors', 'maze'],

  // Spawn positions are calculated dynamically based on map size
  getSpawnPositions(cols, rows) {
    return [
      { x: 1, y: 1 },
      { x: cols - 2, y: 1 },
      { x: 1, y: rows - 2 },
      { x: cols - 2, y: rows - 2 }
    ];
  }
};
