const Renderer = (() => {
  const TILE_SIZE = 48;
  const SPRITE_SIZE = 16;
  const PLAYER_COLORS = ['#f1c40f', '#3498db', '#e74c3c', '#2ecc71'];

  let canvas, ctx;
  let gridCols = 15, gridRows = 13;

  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    canvas.width = gridCols * TILE_SIZE;
    canvas.height = gridRows * TILE_SIZE;
    ctx.imageSmoothingEnabled = false;
  }

  function drawSprite(name, px, py) {
    const sprite = SpriteLoader.get(name);
    if (sprite) {
      ctx.drawImage(sprite, 0, 0, SPRITE_SIZE, SPRITE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
      return true;
    }
    return false;
  }

  function render(gameState) {
    if (!gameState || !gameState.map) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map
    const map = gameState.map;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Always draw floor first
        if (!drawSprite('floor', px, py)) {
          ctx.fillStyle = '#4a7c59';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Draw wall or brick on top of floor
        if (tile === 1) {
          if (!drawSprite('wall', px, py)) {
            ctx.fillStyle = '#5c5c5c';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        } else if (tile === 2) {
          if (!drawSprite('brick', px, py)) {
            ctx.fillStyle = '#c0835a';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Draw power-ups
    if (gameState.powerUps) {
      for (const pu of gameState.powerUps) {
        const px = pu.x * TILE_SIZE;
        const py = pu.y * TILE_SIZE;

        const spriteName = 'powerup_' + pu.type;
        if (!drawSprite(spriteName, px, py)) {
          // Fallback
          ctx.fillStyle = '#9b59b6';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw explosions
    if (gameState.explosions) {
      for (const explosion of gameState.explosions) {
        for (const cell of explosion.cells) {
          const px = cell.x * TILE_SIZE;
          const py = cell.y * TILE_SIZE;
          const alpha = Math.min(1, explosion.timer / 300);

          ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.6})`;
          ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);

          ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.4})`;
          ctx.fillRect(px + 14, py + 14, TILE_SIZE - 28, TILE_SIZE - 28);
        }
      }
    }

    // Draw players
    if (gameState.players) {
      for (const player of gameState.players) {
        if (!player.alive) continue;

        const drawX = Math.round(player.x * TILE_SIZE);
        const drawY = Math.round(player.y * TILE_SIZE);
        const centerX = drawX + TILE_SIZE / 2;
        const centerY = drawY + TILE_SIZE / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, drawY + TILE_SIZE * 0.85, TILE_SIZE * 0.3, TILE_SIZE * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player sprite
        const spriteName = 'player_' + player.colorIndex;
        if (!drawSprite(spriteName, drawX, drawY)) {
          // Fallback to colored circle
          const color = PLAYER_COLORS[player.colorIndex] || '#fff';
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerX, centerY - 2, TILE_SIZE * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Name tag
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const nameWidth = ctx.measureText(player.name).width;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(centerX - nameWidth / 2 - 4, drawY - 14, nameWidth + 8, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(player.name, centerX, drawY);
      }
    }

    // Draw bombs (AFTER players so they're always visible)
    if (gameState.bombs) {
      for (const bomb of gameState.bombs) {
        const px = bomb.x * TILE_SIZE + TILE_SIZE / 2;
        const py = bomb.y * TILE_SIZE + TILE_SIZE / 2;

        const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;
        const r = TILE_SIZE * 0.38 * pulse;

        // Red glow for visibility
        ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
        ctx.beginPath();
        ctx.arc(px, py, r + 6, 0, Math.PI * 2);
        ctx.fill();

        // Bomb body
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // Red outline for contrast
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fuse
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py - r);
        ctx.lineTo(px + 4, py - r - 8);
        ctx.stroke();

        // Spark
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(px + 4, py - r - 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Timer ring indicator
        if (bomb.timer !== undefined) {
          const timerRatio = Math.max(0, bomb.timer / 3000);
          ctx.strokeStyle = `rgba(241, 196, 15, ${0.5 + 0.5 * (1 - timerRatio)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, r + 3, -Math.PI / 2, -Math.PI / 2 + timerRatio * Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  return { init, render, TILE_SIZE };
})();
