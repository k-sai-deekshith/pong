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

// Create our sound effects
const SOUNDS = {
  bounce: createBeepBuffer(500, 0.1),  // 500Hz, 100ms
  score: createBeepBuffer(800, 0.2),   // 800Hz, 200ms
  gameOver: createBeepBuffer(300, 0.5) // 300Hz, 500ms
};

// Audio state tracking
type AudioState = {
  loaded: boolean;
  error: string | null;
  lastPlayAttempt: number;
};

class GameAudio {
  private audioStates: Map<string, AudioState>;

  constructor() {
    this.audioStates = new Map();
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

    if (!state) {
      console.error(`[Audio Diagnostic] Sound ${soundKey} not found`);
      return;
    }

    try {
      state.lastPlayAttempt = Date.now();

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