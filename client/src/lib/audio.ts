// Sound file paths
const SOUND_FILES = {
  bounce: "/sounds/bounce.mp3",
  score: "/sounds/score.mp3",
  gameOver: "/sounds/game-over.mp3"
};

// Audio state tracking
type AudioState = {
  loaded: boolean;
  error: string | null;
  lastPlayAttempt: number;
};

class GameAudio {
  private sounds: Map<string, HTMLAudioElement>;
  private audioStates: Map<string, AudioState>;

  constructor() {
    this.sounds = new Map();
    this.audioStates = new Map();
    this.initializeAudio();
  }

  private initializeAudio() {
    Object.entries(SOUND_FILES).forEach(([key, path]) => {
      const audio = new Audio(path);

      // Set maximum volume
      audio.volume = 1.0;

      // Initialize state
      this.audioStates.set(key, {
        loaded: false,
        error: null,
        lastPlayAttempt: 0
      });

      // Add event listeners for diagnostics
      audio.addEventListener('canplaythrough', () => {
        console.log(`[Audio Diagnostic] ${key} loaded successfully`);
        const state = this.audioStates.get(key);
        if (state) {
          state.loaded = true;
          state.error = null;
        }
      });

      audio.addEventListener('error', (e) => {
        console.error(`[Audio Diagnostic] Error loading ${key}:`, e);
        const state = this.audioStates.get(key);
        if (state) {
          state.loaded = false;
          state.error = e.type;
        }
      });

      this.sounds.set(key, audio);

      // Preload the audio
      audio.load();
    });
  }

  public getDiagnostics(): Record<string, AudioState> {
    const diagnostics: Record<string, AudioState> = {};
    this.audioStates.forEach((state, key) => {
      diagnostics[key] = { ...state };
    });
    return diagnostics;
  }

  public async play(soundKey: keyof typeof SOUND_FILES) {
    const audio = this.sounds.get(soundKey);
    const state = this.audioStates.get(soundKey);

    if (!audio || !state) {
      console.error(`[Audio Diagnostic] Sound ${soundKey} not found`);
      return;
    }

    try {
      state.lastPlayAttempt = Date.now();
      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error(`[Audio Diagnostic] Error playing ${soundKey}:`, error);
          state.error = error.message;
        });
      }
    } catch (error) {
      console.error(`[Audio Diagnostic] Unexpected error playing ${soundKey}:`, error);
      state.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }
}

// Create and export a single instance
export const gameAudio = new GameAudio();

// Export the play functions with the same interface as before
export const playSound = {
  bounce: () => gameAudio.play('bounce'),
  score: () => gameAudio.play('score'),
  gameOver: () => gameAudio.play('gameOver')
};

// Export diagnostics
export const getAudioDiagnostics = () => gameAudio.getDiagnostics();