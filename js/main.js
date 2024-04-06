import {
  fetchConfiguration,
  gameModesManager,
  cheatsManager,
  audioManager,
} from './utils.js';
import { SnakeGame } from './snakeGame.js';

export function setupGame() {
  const container = document.getElementById('snake-container');
  fetchConfiguration().then(() => {
    cheatsManager.init();
    audioManager.init();
    let game = new SnakeGame(gameModesManager.getLastGameMode());
    game.attach(container);

    window.addEventListener('keydown', event => {
      switch (event.key) {
        case 'ArrowUp':
          game.directionInput('up');
          break;
        case 'ArrowDown':
          game.directionInput('down');
          break;
        case 'ArrowLeft':
          game.directionInput('left');
          break;
        case 'ArrowRight':
          game.directionInput('right');
          break;
        case 'Enter':
          game.pauseOrPlay();
          break;
        case ' ':
          game.advanceGameMode();
          break;
        default:
          return;
      }
      event.preventDefault();
    });
  });
}
