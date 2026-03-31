const SpriteLoader = (() => {
  const sprites = {};
  const SPRITE_PATH = 'assets/sprites/tiny-dungeon/Tiles/';
  const SPRITE_MAP = {
    // Dungeon theme (default)
    floor_dungeon:   'tile_0048.png',
    wall_dungeon:    'tile_0040.png',
    brick_dungeon:   'tile_0063.png',
    // Fortress theme
    floor_fortress:  'tile_0042.png',
    wall_fortress:   'tile_0014.png',
    brick_fortress:  'tile_0072.png',
    // Crypt theme
    floor_crypt:     'tile_0050.png',
    wall_crypt:      'tile_0003.png',
    brick_crypt:     'tile_0075.png',
    // Skins (selectable characters)
    skin_0:          'tile_0097.png',
    skin_1:          'tile_0108.png',
    skin_2:          'tile_0110.png',
    skin_3:          'tile_0085.png',
    skin_4:          'tile_0084.png',
    skin_5:          'tile_0086.png',
    skin_6:          'tile_0088.png',
    skin_7:          'tile_0096.png',
    skin_8:          'tile_0098.png',
    skin_9:          'tile_0100.png',
    skin_10:         'tile_0109.png',
    skin_11:         'tile_0111.png',
    skin_12:         'tile_0112.png',
    // Power-ups
    powerup_bomb_up: 'tile_0089.png',
    powerup_fire_up: 'tile_0103.png',
    powerup_speed_up:'tile_0102.png',
    powerup_shield:  'tile_0066.png',
  };

  const THEMES = {
    dungeon:  { floor: 'floor_dungeon',  wall: 'wall_dungeon',  brick: 'brick_dungeon',  name: 'Donjon' },
    fortress: { floor: 'floor_fortress', wall: 'wall_fortress', brick: 'brick_fortress', name: 'Forteresse' },
    crypt:    { floor: 'floor_crypt',    wall: 'wall_crypt',    brick: 'brick_crypt',    name: 'Crypte' },
  };

  const LAYOUTS = [
    { id: 'classic',   name: 'Classique' },
    { id: 'arena',     name: 'Arène' },
    { id: 'corridors', name: 'Couloirs' },
    { id: 'maze',      name: 'Labyrinthe' },
  ];

  const SKINS = [
    { id: 0, name: 'Chevalier' },
    { id: 1, name: 'Slime' },
    { id: 2, name: 'Démon' },
    { id: 3, name: 'Guerrier' },
    { id: 4, name: 'Gobelin' },
    { id: 5, name: 'Viking' },
    { id: 6, name: 'Moine' },
    { id: 7, name: 'Sorcier' },
    { id: 8, name: 'Barbare' },
    { id: 9, name: 'Paladin' },
    { id: 10, name: 'Ranger' },
    { id: 11, name: 'Nécro' },
    { id: 12, name: 'Singe' },
  ];

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
          resolve();
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
  function getSkins() { return SKINS; }
  function getThemes() { return THEMES; }
  function getLayouts() { return LAYOUTS; }

  function getTheme(themeId) {
    return THEMES[themeId] || THEMES.dungeon;
  }

  function getSkinSpritePath(skinId) {
    return SPRITE_PATH + SPRITE_MAP['skin_' + skinId];
  }

  function getThemeSpritePath(themeId, tileType) {
    const theme = THEMES[themeId] || THEMES.dungeon;
    return SPRITE_PATH + SPRITE_MAP[theme[tileType]];
  }

  return { load, get, isLoaded, getSkins, getThemes, getLayouts, getTheme, getSkinSpritePath, getThemeSpritePath, SPRITE_PATH, SPRITE_MAP };
})();
