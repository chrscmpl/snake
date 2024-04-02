export let configuration;

export async function fetchConfiguration() {
  try {
    const res = await fetch('configuration.json');
    if (!res.ok) {
      throw new Error('No configuration file found');
    }
    const data = await res.json();
    configuration = data;
  } catch (err) {
    configuration = {
      gameModes: {
        easy: {
          size: 12,
          startingLength: 3,
          moveTimeout: 200,
        },
        medium: {
          size: 16,
          startingLength: 3,
          moveTimeout: 150,
        },
        hard: {
          size: 20,
          startingLength: 3,
          moveTimeout: 100,
        },
      },
      smoothAnimations: true,
    };
  }
}

export const gameModesManager = {
  getGameModeParams(gameMode) {
    return configuration.gameModes[gameMode];
  },
  saveLastGameMode(gameMode) {
    if (!localStorage) return;
    localStorage.setItem('lastGameMode', gameMode);
  },
  getLastGameMode() {
    const defaultGameMode = Object.keys(configuration.gameModes)[0];
    if (!localStorage) {
      return defaultGameMode;
    }
    const lastGameMode = localStorage.getItem('lastGameMode');
    if (Object.keys(configuration.gameModes).includes(lastGameMode)) {
      return lastGameMode;
    }
    return defaultGameMode;
  },
};

export const highScoreManager = {
  getHighScores(gameMode) {
    if (!configuration.gameModes.hasOwnProperty(gameMode))
      throw new Error('Invalid game mode');
    if (!localStorage) return [];
    return JSON.parse(localStorage.getItem(`highScores-${gameMode}`)) ?? [];
  },
  saveHighScore(gameMode, score) {
    if (!configuration.gameModes.hasOwnProperty(gameMode))
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
