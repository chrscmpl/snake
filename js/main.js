import { fetchConfiguration, gameModesManager } from './utils.js';
import { SnakeGameGUI } from './snakeGameGUI.js';

export function setupGame() {
  const container = document.getElementById('snake-container');
  fetchConfiguration().then(() => {
    let gui = new SnakeGameGUI(gameModesManager.getLastGameMode());
    gui.attach(container);

    window.addEventListener('keydown', event => {
      switch (event.key) {
        case 'ArrowUp':
          gui.setDirection('up');
          break;
        case 'ArrowDown':
          gui.setDirection('down');
          break;
        case 'ArrowLeft':
          gui.setDirection('left');
          break;
        case 'ArrowRight':
          gui.setDirection('right');
          break;
        case 'Enter':
          gui.pauseOrPlay();
          break;
        case ' ':
          gui.advanceGameMode();
          break;
        default:
          return;
      }
      event.preventDefault();
    });
  });
}
