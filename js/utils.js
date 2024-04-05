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

  let muteMusic = localStorage.getItem('muteMusic') === 'true';
  let muteSounds = localStorage.getItem('muteSounds') === 'true';

  let themeAudio;
  let soundAudios = [];

  const updateLocalStorage = () => {
    if (!localStorage) return;
    localStorage.setItem('muteMusic', muteMusic);
    localStorage.setItem('muteSounds', muteSounds);
  };

  class Audio {
    #volume;
    #audio;
    constructor(src, volume, loop, muted) {
      this.#audio = document.createElement('audio');
      if (src) this.#audio.src = src;
      this.volume = volume;
      this.#audio.volume = muted ? 0 : this.#volume;
      if (loop) {
        this.#audio.loop = true;
      } else {
        soundAudios.push(this);
        this.#audio.addEventListener('ended', () => {
          this.#audio.remove();
          soundAudios = soundAudios.filter(audio => audio !== this);
        });
      }
      document.body.appendChild(this.#audio);
    }
    set volume(vol) {
      this.#volume = vol > 1 ? 1 : vol < 0 ? 0 : vol;
    }
    play() {
      this.#audio.play();
    }
    pause() {
      this.#audio.pause();
    }
    mute() {
      this.#audio.volume = 0;
    }
    unmute() {
      this.#audio.volume = this.#volume;
    }
    isMuted() {
      return this.#audio.volume === 0;
    }
    switch(src, volume) {
      this.#audio.src = src;
      this.volume = volume;
      this.#audio.volume = volume;
    }
  }

  return {
    init() {
      mainVolume = configuration.mainVolume;
      soundVolume = configuration.soundVolume;
      musicVolume = configuration.musicVolume;
      themeAudio = new Audio(null, mainVolume * musicVolume, true, muteMusic);
    },
    setTheme(track) {
      try {
        themeAudio.switch(track.src, mainVolume * musicVolume * track.volume);
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
      themeAudio.mute();
      muteMusic = true;
      updateLocalStorage();
    },
    unmuteTheme() {
      themeAudio.unmute();
      muteMusic = false;
      updateLocalStorage();
    },
    playSound(track) {
      const sound = new Audio(
        track.src,
        mainVolume * soundVolume * track.volume,
        false,
        muteSounds
      );
      sound.play();
    },
    muteSounds() {
      soundAudios.forEach(audio => audio.mute());
      muteSounds = true;
      updateLocalStorage();
    },
    unmuteSounds() {
      soundAudios.forEach(audio => audio.unmute());
      muteSounds = false;
      updateLocalStorage();
    },
  };
})();
