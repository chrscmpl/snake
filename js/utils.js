export let configuration;

export async function fetchConfiguration() {
  try {
    const res = await fetch('game-config.json');
    if (!res.ok) {
      throw new Error('No configuration file found');
    }
    const data = await res.json();
    configuration = data;
  } catch (err) {
    console.error(err);
    alert('Failed to fetch configuration file. Please refresh the page.');
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

export const cheatsManager = (function () {
  let cheatStatuses;

  return {
    init() {
      cheatStatuses = [];
      for (let i = 0; i < configuration.cheats.length; i++) {
        cheatStatuses.push({ cheatIndex: i, currentIndex: 0 });
      }
    },

    getCheat(cheatName) {
      if (!localStorage) return false;
      return localStorage.getItem(cheatName) === 'true';
    },

    setCheat(cheatName, value) {
      if (!localStorage) return;
      localStorage.setItem(cheatName, value);
    },

    inputDirection(direction) {
      if (!localStorage) return null;
      let ret = null;
      for (let cheatStatus of cheatStatuses) {
        const cheat = configuration.cheats[cheatStatus.cheatIndex];
        if (direction === cheat.sequence[cheatStatus.currentIndex]) {
          cheatStatus.currentIndex++;
          if (cheatStatus.currentIndex === cheat.sequence.length) {
            cheatStatus.currentIndex = 0;
            const newValue = !this.getCheat(cheat.name);
            localStorage.setItem(cheat.name, newValue);
            ret = { ...cheat };
            ret.value = newValue;
          }
        } else {
          cheatStatus.currentIndex = 0;
        }
      }
      return ret;
    },
  };
})();

export const audioManager = (function () {
  let mainVolume = 0;
  let soundVolume = 0;
  let musicVolume = 0;

  let muteMusic = localStorage
    ? localStorage.getItem('muteMusic') === 'true'
    : false;
  let muteSounds = localStorage
    ? localStorage.getItem('muteSounds') === 'true'
    : false;

  let themeAudio;
  let mainAudioContext;
  let mainGainNode;
  let themeGainNode;
  let soundsGainNode;

  let initialized = false;

  const createContext = () => {
    mainAudioContext = new AudioContext();

    mainGainNode = mainAudioContext.createGain();
    mainGainNode.connect(mainAudioContext.destination);

    themeGainNode = mainAudioContext.createGain();
    themeGainNode.connect(mainGainNode);

    soundsGainNode = mainAudioContext.createGain();
    soundsGainNode.connect(mainGainNode);
  };

  const updateLocalStorage = () => {
    if (!localStorage) return;
    localStorage.setItem('muteMusic', muteMusic);
    localStorage.setItem('muteSounds', muteSounds);
  };

  class EasyAudio {
    #audio;
    #src;
    #gainNode;
    constructor(destination, src, volume, loop) {
      this.#audio = src ? new Audio(src) : new Audio();
      this.#gainNode = mainAudioContext.createGain();
      this.#gainNode.connect(destination);
      this.#src = mainAudioContext.createMediaElementSource(this.#audio);
      this.#src.connect(this.#gainNode);
      this.volume = volume;
      if (loop) {
        this.#audio.loop = true;
      } else {
        this.#audio.addEventListener('ended', () => {
          this.#src.disconnect();
          this.#gainNode.disconnect();
        });
      }
    }
    set volume(vol) {
      this.#gainNode.gain.value = vol;
    }
    play() {
      this.#audio.play();
    }
    pause() {
      this.#audio.pause();
    }
    switch(src, volume) {
      this.#audio.src = src;
      this.volume = volume;
    }
  }

  return {
    isInitialized: false,
    init() {
      createContext();
      mainVolume = configuration.mainVolume;
      soundVolume = configuration.soundVolume;
      musicVolume = configuration.musicVolume;
      mainGainNode.gain.value = mainVolume;
      themeGainNode.gain.value = musicVolume;
      soundsGainNode.gain.value = soundVolume;
      themeAudio = new EasyAudio(themeGainNode, null, musicVolume, true);
      initialized = true;
    },
    get isInitialized() {
      return initialized;
    },
    setTheme(track) {
      try {
        themeAudio.switch(track.src, track.volume);
      } catch (e) {
        console.error(e);
      }
    },
    playTheme() {
      themeAudio.play();
    },
    pauseTheme() {
      themeAudio.pause();
    },
    muteTheme() {
      if (initialized) themeGainNode.gain.value = 0;
      muteMusic = true;
      updateLocalStorage();
    },
    unmuteTheme() {
      if (initialized) themeGainNode.gain.value = musicVolume;
      muteMusic = false;
      updateLocalStorage();
    },
    isThemeMuted() {
      return muteMusic;
    },
    playSound(track) {
      const sound = new EasyAudio(
        soundsGainNode,
        track.src,
        track.volume,
        false
      );
      sound.play();
    },
    muteSounds() {
      if (initialized) soundsGainNode.gain.value = 0;
      muteSounds = true;
      updateLocalStorage();
    },
    unmuteSounds() {
      if (initialized) soundsGainNode.gain.value = soundVolume;
      muteSounds = false;
      updateLocalStorage();
    },
    areSoundsMuted() {
      return muteSounds;
    },
  };
})();

export const imagePreloader = (function () {
  return {
    async preloadImage(url) {
      let image = new Image();
      image.src = url;
    },
  };
})();

export const audioPreloader = (function () {
  return {
    async preloadAudio(url) {
      let audio = new Audio();
      audio.src = url;
    },
  };
})();
