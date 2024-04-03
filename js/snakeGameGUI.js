import { SnakeGame } from './snakeGame.js';
import { configuration, highScoreManager, gameModesManager } from './utils.js';

export class SnakeGameGUI {
  #container;
  #scoreDisplay;
  #highScoresDisplay;
  #gameModeSelection;
  #gameModeButtons;
  #board;
  #game;
  #size;
  #cells;
  #moveInterval;
  #gameMode;
  #lockStart;
  #animationStyles;
  #GameModeStyles;
  #AssetStyles;
  #countdownNumberDuration;

  constructor(gameMode) {
    this.#setGameMode(gameMode);
    this.#loadAssets(gameMode);
    gameModesManager.saveLastGameMode(gameMode);
    const gameModeParams = this.#getGameModeParams(gameMode);

    this.#initGame(gameModeParams);
    this.#createBoard(gameModeParams.size, gameModeParams.startingLength);

    this.#container = document.createElement('div');
    this.#container.classList.add('snake-container');
    this.#container.appendChild(this.#board);
    this.#highScoresDisplay = document.createElement('div');
    this.#highScoresDisplay.classList.add('snake-high-scores');
    this.#highScoresDisplay.innerHTML =
      '<div class="snake-high-score-header">High Scores</div>';
    const highScoresList = document.createElement('div');
    highScoresList.classList.add('snake-high-scores-list');
    this.#highScoresDisplay.appendChild(highScoresList);
    this.#container.appendChild(this.#highScoresDisplay);
    this.#displayHighScores(highScoreManager.getHighScores(this.#gameMode));
    const topBar = document.createElement('div');
    topBar.classList.add('snake-top-bar');
    this.#scoreDisplay = document.createElement('div');
    this.#scoreDisplay.classList.add('snake-score');
    topBar.appendChild(this.#scoreDisplay);
    this.#createGameModeSelection();
    topBar.appendChild(this.#gameModeSelection);
    this.#container.appendChild(topBar);
    this.#updateScore();
    this.#createInputs();
    this.#countdownNumberDuration = configuration.countdownDuration / 3;
  }

  #getGameModeParams(gameMode) {
    const params = configuration.gameModes[gameMode];
    if (!params) {
      throw new Error('Invalid game mode');
    }
    return params;
  }

  #createBoard(size, startingLength) {
    this.#size = size;
    this.#board = document.createElement('div');
    this.#board.classList.add('snake-board');
    this.#board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.#cells = [];
    for (let i = 0; i < size; i++) {
      this.#cells[i] = [];
      for (let j = 0; j < size; j++) {
        let cell = document.createElement('div');
        cell.classList.add('empty');
        this.#board.appendChild(cell);
        this.#cells[i][j] = cell;
      }
    }
    const headPosition = this.#game.headPosition;
    this.#cells[headPosition[0]][headPosition[1]].classList.add(
      'head',
      'right'
    );
    for (let i = 1; i < startingLength - 2; i++) {
      this.#cells[headPosition[0]][headPosition[1] - i].classList.add(
        'body',
        'right-right'
      );
    }
    this.#cells[headPosition[0]][
      headPosition[1] - startingLength + 2
    ].classList.add('body', 'left-left', 'reverse');
    this.#cells[headPosition[0]][
      headPosition[1] - startingLength + 1
    ].classList.add('tail', 'right');
  }

  #createInputs() {
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('snake-inputs');
    const arrowContainer = document.createElement('div');
    arrowContainer.classList.add('snake-arrows-container');
    for (const direction of this.#game.directions.keys()) {
      if (direction === 'none') continue;
      const arrowBtn = document.createElement('button');
      arrowBtn.classList.add('snake-arrow-button', `snake-${direction}-button`);
      arrowBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-short" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/> </svg>';
      this.#addBtnEventListener(arrowBtn, this.setDirection, direction);
      arrowContainer.appendChild(arrowBtn);
    }
    inputContainer.appendChild(arrowContainer);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('snake-buttons-container');
    const startButton = document.createElement('button');
    startButton.classList.add('snake-start-button');
    startButton.textContent = 'START';
    this.#addBtnEventListener(startButton, this.start);
    buttonsContainer.appendChild(startButton);
    inputContainer.appendChild(buttonsContainer);
    this.#container.appendChild(inputContainer);
  }

  #addBtnEventListener(btn, functionIn, ...args) {
    const fun = functionIn.bind(this);
    btn.addEventListener('click', () => {
      fun(...args);
    });
    btn.addEventListener('touchstart', event => {
      event.preventDefault();
      fun(...args);
      btn.classList.add('active');
    });
    btn.addEventListener('touchend', () => {
      setTimeout(() => {
        btn.classList.remove('active');
      }, 100);
    });
  }

  #createGameModeSelection() {
    this.#gameModeSelection = document.createElement('div');
    this.#gameModeSelection.classList.add('snake-game-mode-selection');
    this.#gameModeButtons = new Map();
    for (const mode of Object.keys(configuration.gameModes)) {
      const modeButton = document.createElement('button');
      this.#gameModeButtons.set(mode, modeButton);
      modeButton.classList.add(
        'snake-game-mode-button',
        `snake-${mode}-button`
      );
      if (mode === this.#gameMode) {
        modeButton.classList.add('selected');
      }
      modeButton.textContent = mode.toUpperCase().split('-').join(' ');
      modeButton.addEventListener('click', () => {
        if (!this.isGameRunning())
          this.#restart(mode, this.#getGameModeParams(mode));
      });
      this.#gameModeSelection.appendChild(modeButton);
    }
  }

  #updateScore() {
    this.#scoreDisplay.innerHTML = `<span class="score">${
      this.#game.score
    }</span>`;
  }

  #displayHighScores(highScores) {
    const highScoreHeader = this.#highScoresDisplay.children[0];
    highScoreHeader.innerHTML = `<span>HIGH SCORES</span><span>${this.#gameMode
      .toUpperCase()
      .split('-')
      .join(' ')}</span>`;
    const highScoresList = this.#highScoresDisplay.children[1];
    highScoresList.innerHTML = '';
    for (const score of highScores) {
      const scoreElement = document.createElement('div');
      scoreElement.classList.add('high-score');
      scoreElement.textContent = score;
      highScoresList.appendChild(scoreElement);
    }
  }

  move() {
    if (this.#game.isGameOver() || this.#game.isGameWon()) return;
    const changes = this.#game.move();
    changes.forEach(change => {
      const [i, j] = change.position;
      this.#cells[i][j].className = change.status;
      const direction = change.direction.join('-');
      if (direction) {
        this.#cells[i][j].classList.add(direction);
      }
    });
    if (this.#game.isGameWon()) {
      this.endGame(true);
    } else if (this.#game.isGameOver()) {
      this.endGame(false);
    }
    this.#updateScore();
  }

  endGame(won = false) {
    this.#game.stop();
    this.stop();
    this.#container.classList.add(won ? 'game-won' : 'game-over');
    this.#displayHighScores(
      highScoreManager.saveHighScore(this.#gameMode, this.#game.score)
    );
  }

  setDirection(direction) {
    if (!this.isGameStarted()) return;
    this.#game.setDirection(direction);
  }

  attach(container) {
    container.appendChild(this.#container);
  }

  #displayCountdown() {
    this.#container.classList.add('countdown-3');
    for (let i = 3; i > 0; i--) {
      setTimeout(() => {
        this.#container.classList.remove(`countdown-${i}`);
        if (i > 1) this.#container.classList.add(`countdown-${i - 1}`);
      }, this.#countdownNumberDuration * (4 - i));
    }
  }

  #startIntervals(gameModeParams) {
    this.#moveInterval = setInterval(() => {
      this.move();
    }, gameModeParams.moveTimeout);
  }

  #spawnFood() {
    const foodPosition = this.#game.spawnFood();
    this.#cells[foodPosition[0]][foodPosition[1]].classList.add('food');
  }

  #initGame(gameModeParams = this.#getGameModeParams(this.#gameMode)) {
    this.#game = new SnakeGame(
      gameModeParams.size,
      gameModeParams.startingLength,
      1,
      0,
      0
    );
  }

  start(gameMode = this.#gameMode) {
    if (this.#lockStart || this.isGameRunning()) return;
    this.#lockStart = true;
    const gameModeParams = this.#getGameModeParams(gameMode);
    if (this.isGameStarted()) this.#restart(gameMode, gameModeParams);
    this.#displayCountdown();
    setTimeout(() => {
      this.#game.start();
      this.#startIntervals(gameModeParams);
      this.#container.classList.add('playing');
      this.#spawnFood();
      this.#lockStart = false;
      this.#initAnimations(gameModeParams.moveTimeout);
    }, this.#countdownNumberDuration * 3);
  }

  #restart(
    gameMode = this.#gameMode,
    gameModeParams = this.#getGameModeParams(gameMode)
  ) {
    this.#setGameMode(gameMode);
    this.#loadAssets(gameMode);
    gameModesManager.saveLastGameMode(gameMode);
    this.#game.stop();
    this.stop();
    this.#container.classList.remove('game-over');
    this.#container.classList.remove('game-won');
    this.#initGame(gameModeParams);
    const oldBoard = this.#board;
    this.#createBoard(gameModeParams.size, gameModeParams.startingLength);
    this.#container.replaceChild(this.#board, oldBoard);
    this.#updateScore();
    this.#displayHighScores(highScoreManager.getHighScores(this.#gameMode));
    for (const button of this.#gameModeButtons.entries()) {
      if (button[0] === gameMode) {
        button[1].classList.add('selected');
      } else {
        button[1].classList.remove('selected');
      }
    }
    if (this.#animationStyles) {
      this.#animationStyles.remove();
      this.#animationStyles = null;
    }
  }

  #initAnimations(
    moveTimeout = this.#getGameModeParams(this.#gameMode).moveTimeout
  ) {
    if (!configuration.smoothAnimations) return;
    let styles = '';
    for (const direction of this.#game.directions.keys()) {
      const opposite =
        direction === 'up'
          ? 'down'
          : direction === 'down'
          ? 'up'
          : direction === 'left'
          ? 'right'
          : 'left';
      styles += `
      .${direction} {animation: move-${direction} ${
        moveTimeout + 10 // + 10 removes glitching effects
      }ms linear;}
      .head.${opposite}::after {animation: stretch-${direction} ${
        moveTimeout + 10
      }ms linear;}
      .tail.${direction}::after {animation: stretch-${direction} ${moveTimeout}ms linear reverse;}`;
    }
    this.#animationStyles = document.createElement('style');
    this.#animationStyles.textContent = styles;
    document.head.appendChild(this.#animationStyles);
  }

  #setGameMode(gameMode) {
    this.#gameMode = gameMode;
    if (this.#GameModeStyles) this.#GameModeStyles.remove();
    this.#GameModeStyles = document.createElement('style');
    let styles = '';
    for (const variable of Object.entries(
      configuration.gameModes[gameMode].styles
    )) {
      styles += `--${variable[0]}: ${variable[1]};`;
    }
    this.#GameModeStyles.textContent = `:root {${styles}}`;
    document.head.appendChild(this.#GameModeStyles);
  }

  #loadAssets(gameMode) {
    const location = configuration.gameModes[gameMode].assetsLocation;
    if (this.#AssetStyles) this.#AssetStyles.remove();
    this.#AssetStyles = document.createElement('style');
    let styles = '';
    for (const asset of configuration.assets) {
      const img = new Image();
      img.src = `${location}/${asset.name}`;
      styles += `--${asset.varName}: url(${location}/${asset.name});`;
    }
    this.#AssetStyles.textContent = `:root {${styles}}`;
    document.head.appendChild(this.#AssetStyles);
  }

  isGameStarted() {
    return (
      this.#moveInterval != null ||
      this.#game.isGameOver() ||
      this.#game.isGameWon()
    );
  }

  isGameRunning() {
    return this.#moveInterval != null;
  }

  stop() {
    clearInterval(this.#moveInterval);
    this.#moveInterval = null;
    this.#container.classList.remove('playing');
  }

  advanceGameMode() {
    if (this.isGameRunning()) return;
    const gameModes = Object.keys(configuration.gameModes);
    this.#restart(
      gameModes[(gameModes.indexOf(this.#gameMode) + 1) % gameModes.length]
    );
  }
}
