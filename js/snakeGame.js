import { SnakeCore } from './snakeCore.js';
import {
  configuration,
  highScoreManager,
  gameModesManager,
  cheatsManager,
  audioManager,
  imagePreloader,
  audioPreloader,
  MathUtils,
} from './utils.js';

export class SnakeGame {
  #container;
  #scoreDisplay;
  #highScoresDisplay;
  #gameModeSelectionContainer;
  #gameModeSelection;
  #gameModeButtons;
  #pauseOrPlayButton;
  #availablePausesCounter;
  #alert;
  #board;
  #core;
  #size;
  #cells;
  #moveInterval;
  #gameMode;
  #lockStart;
  #animationStyles;
  #GameModeStyles;
  #effectStyles;
  #effectTimeouts;
  #AssetStyles;
  #countdownNumberDuration;
  #started;
  #availablePauses;
  #infinitePause;
  effectsTemporaries;

  constructor(gameMode) {
    this.#setGameMode(gameMode);
    this.#loadAssets(gameMode);
    gameModesManager.saveLastGameMode(gameMode);
    const gameModeParams = this.#getGameModeParams(gameMode);

    this.#initCore(gameModeParams);
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
    topBar.appendChild(this.#gameModeSelectionContainer);
    this.#container.appendChild(topBar);
    this.#updateScore();
    this.#createInputs();
    this.#countdownNumberDuration = configuration.countdownDuration / 3;
    this.#started = false;
    this.#infinitePause = cheatsManager.getCheat('infinite-pause');
    this.#setAvailablePauses(this.#gameMode);
    this.#alert = document.createElement('div');
    this.#alert.classList.add('snake-alert');
    this.effectsTemporaries = [];
    this.#container.appendChild(this.#alert);
    this.#playEffect('onInit');
  }

  get score() {
    return this.#core.score;
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
    const headPosition = this.#core.headPosition;
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

  #setAvailablePauses(gameMode) {
    this.#availablePauses = this.#infinitePause
      ? Infinity
      : configuration.gameModes[gameMode].pauseLimit;
  }

  #createInputs() {
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('snake-inputs');
    const arrowContainer = document.createElement('div');
    arrowContainer.classList.add('snake-arrows-container');
    for (const direction of this.#core.directions.keys()) {
      if (direction === 'none') continue;
      const arrowBtn = document.createElement('button');
      arrowBtn.classList.add('snake-arrow-button', `snake-${direction}-button`);
      arrowBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right-short" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/> </svg>';
      this.#addBtnEventListener(arrowBtn, this.directionInput, direction);
      arrowContainer.appendChild(arrowBtn);
    }
    inputContainer.appendChild(arrowContainer);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('snake-buttons-container');
    this.#pauseOrPlayButton = document.createElement('button');
    this.#pauseOrPlayButton.classList.add('snake-button', 'snake-start-button');
    this.#pauseOrPlayButton.textContent = 'START';
    this.#addBtnEventListener(this.#pauseOrPlayButton, this.pauseOrPlay);
    buttonsContainer.appendChild(this.#pauseOrPlayButton);

    buttonsContainer.appendChild(
      this.#createMuteButton(
        'music',
        audioManager.muteTheme,
        audioManager.unmuteTheme,
        audioManager.isThemeMuted
      )
    );
    buttonsContainer.appendChild(
      this.#createMuteButton(
        'sounds',
        audioManager.muteSounds,
        audioManager.unmuteSounds,
        audioManager.areSoundsMuted
      )
    );

    inputContainer.appendChild(buttonsContainer);
    this.#container.appendChild(inputContainer);
  }

  #createMuteButton(name, mute, unmute, isMuted) {
    const upperCaseName = name.toUpperCase();
    const muteButton = document.createElement('button');
    muteButton.classList.add('snake-button', `snake-mute-${name}-button`);
    if (isMuted()) {
      muteButton.classList.add('muted');
      muteButton.textContent = `UNMUTE ${upperCaseName}`;
    } else {
      muteButton.classList.add('unmuted');
      muteButton.textContent = `MUTE ${upperCaseName}`;
    }

    this.#addBtnEventListener(muteButton, () => {
      if (!isMuted()) {
        muteButton.classList.remove('unmuted');
        muteButton.classList.add('muted');
        muteButton.textContent = `UNMUTE ${upperCaseName}`;
        mute();
      } else {
        muteButton.classList.remove('muted');
        muteButton.classList.add('unmuted');
        muteButton.textContent = `MUTE ${upperCaseName}`;
        unmute();
      }
    });
    return muteButton;
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
    this.#gameModeSelectionContainer = document.createElement('div');
    this.#gameModeSelectionContainer.classList.add(
      'snake-game-mode-selection-container'
    );
    const label = document.createElement('label');
    label.textContent = 'Select stage:';
    label.classList.add('snake-game-mode-label');
    label.htmlFor = 'snake-game-mode-selection';
    this.#gameModeSelectionContainer.appendChild(label);
    this.#gameModeSelection = document.createElement('select');
    this.#gameModeSelection.id = 'snake-game-mode-selection';
    this.#gameModeSelection.name = 'snake-game-mode-selection';
    this.#gameModeSelection.classList.add('snake-game-mode-selection');
    this.#gameModeButtons = new Map();
    for (const mode of Object.keys(configuration.gameModes)) {
      const option = document.createElement('option');
      this.#gameModeButtons.set(mode, option);
      option.classList.add('snake-game-mode-option');
      option.value = mode;
      if (mode === this.#gameMode) {
        option.classList.add('selected');
      }
      option.textContent = `${mode.charAt(0).toUpperCase()}${mode
        .substring(1)
        .split('-')
        .join(' ')}`;
      this.#gameModeSelection.appendChild(option);
    }
    this.#gameModeSelection.value = this.#gameMode;
    this.#gameModeSelectionContainer.appendChild(this.#gameModeSelection);

    this.#gameModeSelection.addEventListener('change', () => {
      const mode = this.#gameModeSelection.value;
      if (!this.isGameRunning())
        this.#restart(mode, this.#getGameModeParams(mode));
    });
  }

  #updateScore() {
    this.#scoreDisplay.innerHTML = `<span class="score">${
      this.#core.score
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
    if (this.#core.isGameOver() || this.#core.isGameWon()) return;
    const scoreBefore = this.#core.score;
    const changes = this.#core.move();
    changes.forEach(change => {
      const [i, j] = change.position;
      this.#cells[i][j].className = change.status;
      const direction = change.direction.join('-');
      if (direction) {
        this.#cells[i][j].classList.add(direction);
      }
    });
    if (this.#core.isGameWon()) {
      this.endGame(true);
    } else if (this.#core.isGameOver()) {
      this.endGame(false);
    }
    if (this.#core.score > scoreBefore) {
      this.#updateScore();
      this.#undoEffect('onNearFood');
      this.#playEffect('onEat');
    } else if (this.#core.isNearFood()) {
      this.#playEffect('onNearFood');
    }
  }

  endGame(won = false) {
    this.#started = false;
    this.#core.stop();
    this.stop();
    this.#container.classList.add(won ? 'game-won' : 'game-over');
    this.#gameModeSelection.disabled = false;
    this.#displayHighScores(
      highScoreManager.saveHighScore(this.#gameMode, this.#core.score)
    );
    this.#pauseOrPlayButton.innerHTML = 'START';
    this.#pauseOrPlayButton.classList.remove('pause');
    audioManager.pauseTheme();
    this.#playEffect(won ? 'onGameWon' : 'onGameOver');
  }

  directionInput(direction) {
    if (this.isGameRunning() && !this.isGamePaused()) {
      this.#setDirection(direction);
    } else {
      this.#cheatInput(direction);
    }
  }

  #cheatInput(direction) {
    const cheat = cheatsManager.inputDirection(direction);
    if (!cheat) return;
    this[`${cheat.action}`](cheat.value);
    this.#displayAlert(
      `Cheat ${cheat.value ? '' : 'de'}activated: ${cheat.name
        .split('-')
        .join(' ')}`
    );
  }

  #setDirection(direction) {
    this.#core.setDirection(direction);
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
    const foodPosition = this.#core.spawnFood();
    this.#cells[foodPosition[0]][foodPosition[1]].classList.add('food');
  }

  #initCore(gameModeParams = this.#getGameModeParams(this.#gameMode)) {
    this.#core = new SnakeCore(
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
    if (!audioManager.isInitialized) {
      audioManager.init();
      audioManager.setTheme(gameModeParams.audio.theme);
    }
    if (this.wasGameStarted()) this.#restart(gameMode, gameModeParams);
    this.#gameModeSelection.disabled = true;
    this.#displayCountdown();
    setTimeout(() => {
      this.#core.start();
      this.#started = true;
      this.#startIntervals(gameModeParams);
      this.#container.classList.add('playing');
      this.#spawnFood();
      this.#initAnimations(gameModeParams.moveTimeout);
      this.#stylePauseButton();
      this.#updateAvailablePausesCounter();
      audioManager.playTheme();
      this.#lockStart = false;
    }, this.#countdownNumberDuration * 3);
  }

  #restart(
    gameMode = this.#gameMode,
    gameModeParams = this.#getGameModeParams(gameMode)
  ) {
    this.#started = false;
    this.#setGameMode(gameMode);
    this.#loadAssets(gameMode);
    gameModesManager.saveLastGameMode(gameMode);
    this.#core.stop();
    this.stop();
    this.#container.className = 'snake-container';
    this.#initCore(gameModeParams);
    const oldBoard = this.#board;
    this.#createBoard(gameModeParams.size, gameModeParams.startingLength);
    this.#container.replaceChild(this.#board, oldBoard);
    this.#updateScore();
    this.#displayHighScores(highScoreManager.getHighScores(this.#gameMode));
    this.#gameModeSelection.value = gameMode;
    this.#setAvailablePauses(this.#gameMode);
    this.effectsTemporaries = [];
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
    if (!audioManager.isInitialized) audioManager.init();
    audioManager.setTheme(gameModeParams.audio.theme);
    this.#playEffect('onInit');
  }

  #initAnimations(
    moveTimeout = this.#getGameModeParams(this.#gameMode).moveTimeout
  ) {
    if (!configuration.smoothAnimations) return;
    let styles = '';
    for (const direction of this.#core.directions.keys()) {
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

  #initEffects() {
    this.#effectTimeouts = {};
    let styles = '';
    const assetsLocation =
      configuration.gameModes[this.#gameMode].assetsLocation;
    for (const effect of Object.entries(
      configuration.gameModes[this.#gameMode].effects
    )) {
      if (!effect[1].styles) continue;
      for (const style of effect[1].styles) {
        for (const selector of style.selectors ?? ['']) {
          styles += `.${style.className} ${selector},`;
        }
        styles = styles.slice(0, -1) + '{';
        for (const rule of style.rules) {
          styles += `${rule.property ?? `--${rule.variable}`}: ${
            rule.value ?? `url(${assetsLocation}/${rule.url})`
          };`;
        }
        styles += '}';
      }
    }
    this.#effectStyles = document.createElement('style');
    this.#effectStyles.textContent = styles;
    document.head.appendChild(this.#effectStyles);
  }

  #stylePauseButton() {
    this.#pauseOrPlayButton.classList.add('pause');
    this.#pauseOrPlayButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16"><path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5"/></svg>';
    this.#availablePausesCounter = document.createElement('span');
    this.#availablePausesCounter.classList.add('snake-available-pauses');
    this.#availablePausesCounter.textContent = this.#availablePauses;
    this.#pauseOrPlayButton.appendChild(this.#availablePausesCounter);
  }

  #updateAvailablePausesCounter() {
    this.#availablePausesCounter.textContent = this.#infinitePause
      ? ''
      : this.#availablePauses;
    if (!this.#infinitePause && this.#availablePauses === 0) {
      this.#pauseOrPlayButton.classList.add('no-pauses-left');
    }
  }

  #setGameMode(gameMode) {
    if (this.#gameMode === gameMode) return;
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
    this.#effectStyles?.remove();
    this.#initEffects();
  }

  #loadAssets(gameMode) {
    const location = configuration.gameModes[gameMode].assetsLocation;
    if (this.#AssetStyles) this.#AssetStyles.remove();
    this.#AssetStyles = document.createElement('style');
    let styles = '';
    for (const asset of configuration.assets) {
      imagePreloader.preloadImage(`${location}/${asset.name}`);
      styles += `--${asset.varName}: url(${location}/${asset.name});`;
    }
    this.#AssetStyles.textContent = `:root {${styles}}`;
    document.head.appendChild(this.#AssetStyles);

    for (const audio of Object.values(
      configuration.gameModes[gameMode].audio
    )) {
      audioPreloader.preloadAudio(audio.src);
    }

    this.#loadEffectAssets(gameMode);
  }

  #loadEffectAssets(gameMode) {
    const effects = configuration.gameModes[gameMode].effects;
    if (!effects) return;
    const location = configuration.gameModes[gameMode].assetsLocation;
    for (const effect of Object.values(effects)) {
      if (effect.styles) {
        for (const style of effect.styles) {
          for (const rule of style.rules) {
            if (rule.url) {
              imagePreloader.preloadImage(`${location}/${rule.url}`);
            }
          }
        }
      }
      if (effect.sounds) {
        for (const sound of effect.sounds) {
          audioPreloader.preloadAudio(sound.src);
        }
      }
    }
  }

  wasGameStarted() {
    return this.#started || this.#core.isGameOver() || this.#core.isGameWon();
  }

  isGamePaused() {
    return this.#moveInterval == null && this.#started;
  }

  isGameRunning() {
    return this.#started;
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

  #displayAlert(str) {
    this.#alert.textContent = str;
    this.#alert.classList.add('shown');
    setTimeout(() => {
      this.#alert.classList.remove('shown');
    }, 2000);
  }

  #pause() {
    if (this.#availablePauses === 0) return;
    this.#availablePauses--;
    this.#updateAvailablePausesCounter();
    this.stop();
    this.#container.classList.add('paused');
    audioManager.pauseTheme();
    this.#playEffect('onPause');
  }

  #unpause() {
    this.#startIntervals(this.#getGameModeParams(this.#gameMode));
    this.#container.classList.remove('paused');
    this.#container.classList.add('playing');
    audioManager.playTheme();
    this.#playEffect('onUnpause');
  }

  pauseOrPlay() {
    if (this.isGameRunning() && !this.isGamePaused()) {
      this.#pause();
    } else if (this.wasGameStarted() && this.isGamePaused()) {
      this.#unpause();
    } else {
      this.start();
    }
  }

  #playEffect(name) {
    const effect = configuration.gameModes[this.#gameMode].effects[name];
    if (!effect) return;
    this.#stopEffectRemoval(name);
    if (effect.actions) {
      effect.actions.forEach(action => {
        if (
          action.condition &&
          !eval(this.#parseEffectAction(action.condition))
        )
          return;
        eval(this.#parseEffectAction(action.action));
      });
    }
    if (effect.sounds) {
      effect.sounds.forEach(sound => {
        if (sound.condition && !eval(this.#parseEffectAction(sound.condition)))
          return;
        audioManager.playSound(sound);
      });
    }
    if (effect.styles) {
      effect.styles.forEach(style => {
        if (style.dynamicUpdate)
          this.#container.classList.remove(style.className);
        if (style.condition && !eval(this.#parseEffectAction(style.condition)))
          return;
        this.#container.classList.add(style.className);
        if (style.duration)
          this.#effectTimeouts[name].push(
            setTimeout(() => {
              this.#container.classList.remove(style.className);
              this.#effectTimeouts[name] = null;
            }, style.duration)
          );
      });
    }
  }

  #undoEffect(name) {
    const effect = configuration.gameModes[this.#gameMode].effects[name];
    if (!effect) return;
    this.#stopEffectRemoval(name);
    if (effect.styles) {
      effect.styles.forEach(style => {
        this.#container.classList.remove(style.className);
      });
    }
  }

  #stopEffectRemoval(name) {
    if (this.#effectTimeouts[name]) {
      this.#effectTimeouts[name].forEach(timeout => clearTimeout(timeout));
    }
    this.#effectTimeouts[name] = [];
  }

  #parseEffectAction(action) {
    return action.replace(
      /\$(\d+)/g,
      (_, n) => `this.effectsTemporaries[${n}]`
    );
  }

  setInfinitePause(enabled) {
    this.#infinitePause = enabled;
    this.#availablePauses = enabled
      ? Infinity
      : configuration.gameModes[this.#gameMode].pauseLimit;
    if (this.isGameRunning()) this.#updateAvailablePausesCounter();
  }
}
