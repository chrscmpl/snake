'use strict';

class SnakeGame {
  #size;
  #map;
  #headPosition;
  #tailPosition;
  #headDirection;
  #pastMoves;
  #lastMovedDirection;
  #gameOver;
  #snakeLength;
  #totalCells;
  #gameWon;
  #score;
  #foodScoreValue;
  #timeScoreValue;
  #scoreIntervalTimeValue;
  #scoreInterval;

  constructor(
    size,
    startingLength,
    foodScore = 100,
    timeInterval = 1000,
    timeScore = 10
  ) {
    if (startingLength > size / 2) {
      throw new Error('Invalid starting length');
    }
    this.#size = size;
    this.#totalCells = size ** 2;
    this.#gameOver = false;
    this.#gameWon = false;
    this.#snakeLength = startingLength;
    this.#score = 0;
    this.#foodScoreValue = foodScore;
    this.#timeScoreValue = timeScore;
    this.#scoreIntervalTimeValue = timeInterval;
    this.#map = Array.from({ length: this.#size }, () =>
      Array.from({ length: this.#size }, () => 0)
    );
    this.#headPosition = [
      Math.floor(this.#size / 2),
      Math.floor(this.#size / 2),
    ];
    this.#setCellAt(this.#headPosition, 'head');
    this.#tailPosition = [
      this.#headPosition[0],
      this.#headPosition[1] - startingLength + 1,
    ];
    this.#setCellAt(this.#tailPosition, 'tail');
    this.#headDirection = 'right';
    this.#lastMovedDirection = 'right';
    this.#pastMoves = Array.from({ length: this.#size }, () =>
      Array.from({ length: this.#size }, () => null)
    );
    this.#setPastMoveAt(this.#tailPosition, 'right');
    for (let i = 1; i < startingLength - 1; i++) {
      this.#setCellAt(
        [this.#tailPosition[0], this.#tailPosition[1] + i],
        'body'
      );
      this.#setPastMoveAt(
        [this.#tailPosition[0], this.#tailPosition[1] + i],
        'right'
      );
    }
    this.#scoreInterval = setInterval(
      (() => {
        this.#score += this.#timeScoreValue;
      }).bind(this),
      this.#scoreIntervalTimeValue
    );
  }

  #getStatusValue(string) {
    return this.cellStatuses.get(string);
  }

  // #getStatusString(value) {
  //   return [...this.cellStatuses.entries()].find(
  //     ([key, val]) => val === value
  //   )[0];
  // }

  #getDirectionValue(string) {
    return this.directions.get(string);
  }

  // #getDirectionString(value) {
  //   return [...this.directions.entries()].find(
  //     ([key, val]) => val === value
  //   )[0];
  // }

  #getCellIndexesAtDirection([i, j], direction) {
    const [shiftRow, shiftColumn] = this.#getDirectionValue(direction);
    return [(i + shiftRow) % this.#size][(j + shiftColumn) % this.#size];
  }

  #getCellAt(position) {
    return position.reduce((arr, index) => arr[index], this.#map);
  }

  #setCellAt(position, value) {
    this.#map[position[0]][position[1]] = this.#getStatusValue(value);
  }

  #getPastMoveAt(position) {
    return position.reduce((arr, index) => arr[index], this.#pastMoves);
  }

  #setPastMoveAt(position, value) {
    this.#pastMoves[position[0]][position[1]] = value;
  }

  #shiftIndex(startingIndex, movement) {
    return startingIndex + movement;
  }

  #setGameOver() {
    clearInterval(this.#scoreInterval);
    this.#gameOver = true;
  }

  #setGameWon() {
    clearInterval(this.#scoreInterval);
    this.#gameWon = true;
  }

  spawnFood() {
    if (this.#gameOver || this.#gameWon) return;
    while (true) {
      const i = Math.floor(Math.random() * this.#size);
      const j = Math.floor(Math.random() * this.#size);
      if (this.#setFood(i, j)) {
        return [i, j];
      }
    }
  }

  move() {
    if (this.#gameOver) return [];
    let changes = [];
    let foodEaten = false;
    this.#headDirection;

    this.#setPastMoveAt(this.#headPosition, this.#headDirection);

    const [shiftRowHead, shiftColumnHead] = this.#getDirectionValue(
      this.#headDirection
    );

    this.#setCellAt(this.#headPosition, 'body');
    changes.push({
      position: this.#headPosition,
      status: 'body',
      direction: [this.#lastMovedDirection, this.#headDirection],
    });

    const [nextRow, nextColumn] = [
      this.#shiftIndex(this.#headPosition[0], shiftRowHead),
      this.#shiftIndex(this.#headPosition[1], shiftColumnHead),
    ];

    if (
      nextRow >= this.#size ||
      nextColumn >= this.#size ||
      nextRow < 0 ||
      nextColumn < 0 ||
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('body') ||
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('tail')
    ) {
      this.#setGameOver();
      return [];
    } else if (
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('food')
    ) {
      foodEaten = true;
    }

    this.#headPosition = [nextRow, nextColumn];

    this.#setCellAt(this.#headPosition, 'head');
    changes.push({
      position: this.#headPosition,
      status: 'head',
      direction: [this.#headDirection],
    });

    if (foodEaten) {
      this.#lastMovedDirection = this.#headDirection;
      this.#snakeLength++;
      this.#score += this.#foodScoreValue;
      if (this.#snakeLength === this.#totalCells) this.#setGameWon();
      changes.push({
        position: this.spawnFood(),
        status: 'food',
        direction: [],
      });
      return changes;
    }

    const [shiftRowTail, shiftColumnTail] = this.#getDirectionValue(
      this.#getPastMoveAt(this.#tailPosition)
    );

    this.#setPastMoveAt(this.#tailPosition, null);
    this.#setCellAt(this.#tailPosition, 'empty');
    changes.push({
      position: this.#tailPosition,
      status: 'empty',
      direction: [],
    });

    this.#tailPosition = [
      this.#shiftIndex(this.#tailPosition[0], shiftRowTail),
      this.#shiftIndex(this.#tailPosition[1], shiftColumnTail),
    ];
    this.#setCellAt(this.#tailPosition, 'tail');
    changes.push({
      position: this.#tailPosition,
      status: 'tail',
      direction: [this.#getPastMoveAt(this.#tailPosition)],
    });
    this.#lastMovedDirection = this.#headDirection;
    return changes;
  }

  // get map() {
  //   return this.#map.map(row => row.map(cell => this.#getStatusString(cell)));
  // }
  // get pastMoves() {
  //   return this.#pastMoves.map(row =>
  //     row.map(cell => this.#getDirectionString(cell))
  //   );
  // }

  get headPosition() {
    return this.#headPosition;
  }

  get score() {
    return this.#score;
  }

  isGameOver() {
    return this.#gameOver;
  }

  isGameWon() {
    return this.#gameWon;
  }

  #setFood(i, j) {
    if (this.#getCellAt([i, j]) !== this.#getStatusValue('empty')) {
      return false;
    }
    this.#setCellAt([i, j], 'food');
    return true;
  }

  setDirection(direction) {
    const verticalDirections = ['up', 'down'];
    const horizontalDirections = ['left', 'right'];
    if (
      (verticalDirections.includes(this.#lastMovedDirection) &&
        verticalDirections.includes(direction)) ||
      (horizontalDirections.includes(this.#lastMovedDirection) &&
        horizontalDirections.includes(direction))
    ) {
      return;
    }
    this.#headDirection = direction;
  }

  stop() {
    clearInterval(this.#scoreInterval);
  }
}

SnakeGame.prototype.directions = new Map([
  ['none', null],
  ['up', [-1, 0]],
  ['down', [1, 0]],
  ['left', [0, -1]],
  ['right', [0, 1]],
]);

SnakeGame.prototype.cellStatuses = new Map([
  ['empty', 0],
  ['head', 1],
  ['body', 2],
  ['tail', 3],
  ['food', 4],
]);

class SnakeGameGUI {
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

  constructor(gameMode) {
    this.#gameMode = gameMode;
    const gameModeParams = this.#getGameModeParams(gameMode);
    this.#game = new SnakeGame(
      gameModeParams.size,
      gameModeParams.startingLength
    );
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
  }

  #getGameModeParams(gameMode) {
    const params = this.modes.get(gameMode);
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
    for (let i = 1; i < startingLength - 1; i++) {
      this.#cells[headPosition[0]][headPosition[1] - i].classList.add(
        'body',
        'right-right'
      );
    }
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
      arrowBtn.addEventListener('click', () => {
        this.setDirection(direction);
      });
      arrowBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        this.setDirection(direction);
        arrowBtn.classList.add('active');
        setTimeout(() => {
          arrowBtn.classList.remove('active');
        }, 100);
      });

      arrowContainer.appendChild(arrowBtn);
    }
    inputContainer.appendChild(arrowContainer);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('snake-buttons-container');
    const startButton = document.createElement('button');
    startButton.classList.add('snake-start-button');
    startButton.textContent = 'START';
    startButton.addEventListener('click', () => {
      this.start();
    });
    startButton.addEventListener('touchstart', event => {
      event.preventDefault();
      this.start();
      startButton.classList.add('active');
      setTimeout(() => {
        startButton.classList.remove('active');
      }, 100);
    });
    buttonsContainer.appendChild(startButton);
    inputContainer.appendChild(buttonsContainer);
    this.#container.appendChild(inputContainer);
  }

  #createGameModeSelection() {
    this.#gameModeSelection = document.createElement('div');
    this.#gameModeSelection.classList.add('snake-game-mode-selection');
    this.#gameModeButtons = new Map();
    for (const mode of this.modes.keys()) {
      const modeButton = document.createElement('button');
      this.#gameModeButtons.set(mode, modeButton);
      modeButton.classList.add(
        'snake-game-mode-button',
        `snake-${mode}-button`
      );
      if (mode === this.#gameMode) {
        modeButton.classList.add('selected');
      }
      modeButton.textContent = mode.toUpperCase();
      modeButton.addEventListener('click', () => {
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
    highScoreHeader.innerHTML = `<span>HIGH SCORES</span><span>${
      this.#gameMode
    }</span>`.toUpperCase();
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
      }, this.countdownNumberDuration * (4 - i));
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

  start(gameMode = this.#gameMode) {
    if (this.#lockStart || this.isGameRunning()) return;
    this.#lockStart = true;
    const gameModeParams = this.#getGameModeParams(gameMode);
    if (this.isGameStarted()) this.#restart(gameMode, gameModeParams);
    this.#displayCountdown();
    setTimeout(() => {
      this.#startIntervals(gameModeParams);
      this.#container.classList.add('playing');
      this.#spawnFood();
      this.#lockStart = false;
    }, this.countdownNumberDuration * 3);
  }

  #restart(
    gameMode = this.#gameMode,
    gameModeParams = this.#getGameModeParams(gameMode)
  ) {
    this.#gameMode = gameMode;
    this.#game.stop();
    this.stop();
    this.#container.classList.remove('game-over');
    this.#container.classList.remove('game-won');
    this.#game = new SnakeGame(
      gameModeParams.size,
      gameModeParams.startingLength
    );
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
    const gameModes = [...this.modes.keys()];
    this.#restart(
      gameModes[(gameModes.indexOf(this.#gameMode) + 1) % gameModes.length]
    );
  }
}

SnakeGameGUI.prototype.countdownNumberDuration = 300;

SnakeGameGUI.prototype.modes = new Map();
SnakeGameGUI.prototype.modes.set('easy', {
  size: 12,
  startingLength: 3,
  moveTimeout: 120,
});
SnakeGameGUI.prototype.modes.set('medium', {
  size: 16,
  startingLength: 3,
  moveTimeout: 80,
});
SnakeGameGUI.prototype.modes.set('hard', {
  size: 20,
  startingLength: 3,
  moveTimeout: 50,
});
// SnakeGameGUI.prototype.modes.set('insane', {
//   size: 24,
//   startingLength: 3,
//   moveTimeout: 30,
// });

const highScoreManager = {
  gameModes: [...SnakeGameGUI.prototype.modes.keys()],
  getHighScores(gameMode) {
    if (!this.gameModes.includes(gameMode))
      throw new Error('Invalid game mode');
    if (!localStorage) return [];
    return JSON.parse(localStorage.getItem(`highScores-${gameMode}`)) ?? [];
  },
  saveHighScore(gameMode, score) {
    if (!this.gameModes.includes(gameMode))
      throw new Error('Invalid game mode');
    if (!localStorage) return [];
    let highScores =
      JSON.parse(localStorage.getItem(`highScores-${gameMode}`)) ?? [];
    highScores.push(score);
    highScores = highScores.sort((a, b) => b - a).slice(0, 10);
    localStorage.setItem(`highScores-${gameMode}`, JSON.stringify(highScores));
    return highScores;
  },
};

function setupGame() {
  const container = document.getElementById('snake-container');
  let gui = new SnakeGameGUI('medium');
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
        gui.start();
        break;
      case ' ':
        gui.advanceGameMode();
        break;
      default:
        return;
    }
    event.preventDefault();
  });
}
