import {
  fetchConfiguration,
  gameModesManager,
  cheatsManager,
} from './utils.js';
import { SnakeGameGUI } from './snakeGameGUI.js';

export function setupGame() {
  const container = document.getElementById('snake-container');
  fetchConfiguration().then(() => {
    cheatsManager.init();
    let gui = new SnakeGameGUI(gameModesManager.getLastGameMode());
    gui.attach(container);

    window.addEventListener('keydown', event => {
      switch (event.key) {
        case 'ArrowUp':
          gui.directionInput('up');
          break;
        case 'ArrowDown':
          gui.directionInput('down');
          break;
        case 'ArrowLeft':
          gui.directionInput('left');
          break;
        case 'ArrowRight':
          gui.directionInput('right');
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
