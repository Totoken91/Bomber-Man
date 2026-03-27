const Renderer = (() => {
  const TILE_SIZE = 48;
  const PLAYER_COLORS = ['#f1c40f', '#3498db', '#e74c3c', '#2ecc71'];
  const POWERUP_COLORS = {
    'bomb_up': '#9b59b6',
    'fire_up': '#e67e22',
    'speed_up': '#1abc9c'
  };
  const POWERUP_LABELS = {
    'bomb_up': 'B+',
    'fire_up': 'F+',
    'speed_up': 'S+'
  };

  let canvas, ctx;
  let gridCols = 15, gridRows = 13;

  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    canvas.width = gridCols * TILE_SIZE;
    canvas.height = gridRows * TILE_SIZE;
  }

  function render(gameState) {
    if (!gameState || !gameState.map) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw map
    const map = gameState.map;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (tile) {
          case 0: // EMPTY
            ctx.fillStyle = '#4a7c59';
            break;
          case 1: // WALL
            ctx.fillStyle = '#5c5c5c';
            break;
          case 2: // BRICK
            ctx.fillStyle = '#c0835a';
            break;
        }
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Brick pattern
        if (tile === 2) {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
          ctx.moveTo(px + TILE_SIZE / 2, py);
          ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
          ctx.stroke();
        }

        // Wall 3D effect
        if (tile === 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(px, py, TILE_SIZE, 3);
          ctx.fillRect(px, py, 3, TILE_SIZE);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
          ctx.fillRect(px + TILE_SIZE - 3, py, 3, TILE_SIZE);
        }
      }
    }

    // Draw power-ups
    if (gameState.powerUps) {
      for (const pu of gameState.powerUps) {
        const px = pu.x * TILE_SIZE;
        const py = pu.y * TILE_SIZE;

        // Background
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Power-up icon
        ctx.fillStyle = POWERUP_COLORS[pu.type] || '#fff';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_LABELS[pu.type] || '?', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
      }
    }

    // Draw bombs
    if (gameState.bombs) {
      for (const bomb of gameState.bombs) {
        const px = bomb.x * TILE_SIZE + TILE_SIZE / 2;
        const py = bomb.y * TILE_SIZE + TILE_SIZE / 2;

        // Pulsing animation
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.1;
        const r = TILE_SIZE * 0.3 * pulse;

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

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
        ctx.arc(px + 4, py - r - 8, 3, 0, Math.PI * 2);
        ctx.fill();
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

        const px = player.x * TILE_SIZE + TILE_SIZE / 2;
        const py = player.y * TILE_SIZE + TILE_SIZE / 2;
        const color = PLAYER_COLORS[player.colorIndex] || '#fff';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(px, py + TILE_SIZE * 0.3, TILE_SIZE * 0.28, TILE_SIZE * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py - 2, TILE_SIZE * 0.32, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px - 5, py - 6, 4, 0, Math.PI * 2);
        ctx.arc(px + 5, py - 6, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px - 4, py - 5, 2, 0, Math.PI * 2);
        ctx.arc(px + 6, py - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Name tag
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const nameWidth = ctx.measureText(player.name).width;
        ctx.fillRect(px - nameWidth / 2 - 4, py - TILE_SIZE * 0.5 - 16, nameWidth + 8, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(player.name, px, py - TILE_SIZE * 0.5 - 2);
      }
    }
  }

  return { init, render, TILE_SIZE };
})();
