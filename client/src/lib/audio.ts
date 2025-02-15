// Audio Context singleton
let audioContext: AudioContext | null = null;

// Initialize audio context on demand
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Generate a simple beep sound
function createBeepBuffer(frequency: number, duration: number): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const samples = duration * sampleRate;
  const buffer = ctx.createBuffer(1, samples, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < samples; i++) {
    channel[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }

  return buffer;
}

// Create our sound effects with shorter durations
const SOUNDS = {
  bounce: createBeepBuffer(500, 0.05),  // 500Hz, 50ms
  score: createBeepBuffer(800, 0.1),    // 800Hz, 100ms
  gameOver: createBeepBuffer(300, 0.3)  // 300Hz, 300ms
};

// Audio state tracking
type AudioState = {
  loaded: boolean;
  error: string | null;
  lastPlayAttempt: number;
};

class GameAudio {
  private audioStates: Map<string, AudioState>;
  private lastPlayTime: Map<string, number>;
  private readonly MIN_PLAY_INTERVAL = 50; // Minimum ms between sound plays

  constructor() {
    this.audioStates = new Map();
    this.lastPlayTime = new Map();
    this.initializeAudio();
  }

  private initializeAudio() {
    Object.keys(SOUNDS).forEach((key) => {
      console.log(`[Audio Diagnostic] Initializing ${key} sound`);

      this.audioStates.set(key, {
        loaded: true, // Buffer-based sounds are always "loaded"
        error: null,
        lastPlayAttempt: 0
      });
      this.lastPlayTime.set(key, 0);
    });
  }

  public getDiagnostics(): Record<string, AudioState> {
    const diagnostics: Record<string, AudioState> = {};
    this.audioStates.forEach((state, key) => {
      diagnostics[key] = { ...state };
    });
    return diagnostics;
  }

  public async play(soundKey: keyof typeof SOUNDS) {
    const ctx = getAudioContext();
    const state = this.audioStates.get(soundKey);
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(soundKey) || 0;

    if (!state || now - lastPlay < this.MIN_PLAY_INTERVAL) {
      return;
    }

    try {
      state.lastPlayAttempt = now;
      this.lastPlayTime.set(soundKey, now);

      const source = ctx.createBufferSource();
      source.buffer = SOUNDS[soundKey];
      source.connect(ctx.destination);
      source.start();

      state.error = null;
    } catch (error) {
      console.error(`[Audio Diagnostic] Error playing ${soundKey}:`, error);
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