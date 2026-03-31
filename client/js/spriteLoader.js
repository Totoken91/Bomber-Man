const SpriteLoader = (() => {
  const sprites = {};
  const SPRITE_PATH = 'assets/sprites/tiny-dungeon/Tiles/';
  const SPRITE_MAP = {
    floor:           'tile_0048.png',
    wall:            'tile_0040.png',
    brick:           'tile_0063.png',
    player_0:        'tile_0097.png',
    player_1:        'tile_0108.png',
    player_2:        'tile_0110.png',
    player_3:        'tile_0085.png',
    powerup_bomb_up: 'tile_0089.png',
    powerup_fire_up: 'tile_0103.png',
    powerup_speed_up:'tile_0102.png',
  };

  let loaded = false;
  let loadPromise = null;

  function load() {
    if (loadPromise) return loadPromise;
    const promises = Object.entries(SPRITE_MAP).map(([name, file]) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { sprites[name] = img; resolve(); };
        img.onerror = () => {
          console.warn('Failed to load sprite:', file);
          resolve(); // Don't reject - fallback to canvas drawing
        };
        img.src = SPRITE_PATH + file;
      });
    });
    loadPromise = Promise.all(promises).then(() => { loaded = true; });
    return loadPromise;
  }

  function get(name) {
    return sprites[name] || null;
  }

  function isLoaded() { return loaded; }

  return { load, get, isLoaded };
})();
