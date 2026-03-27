const Input = (() => {
  const keys = {};
  let bombPressed = false;

  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      bombPressed = true;
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  function getInput() {
    let direction = null;

    if (keys['ArrowUp'] || keys['w'] || keys['z']) direction = 'up';
    else if (keys['ArrowDown'] || keys['s']) direction = 'down';
    else if (keys['ArrowLeft'] || keys['q'] || keys['a']) direction = 'left';
    else if (keys['ArrowRight'] || keys['d']) direction = 'right';

    const bomb = bombPressed;
    bombPressed = false;

    return { direction, bomb };
  }

  return { getInput };
})();
