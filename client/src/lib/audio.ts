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

// Create a celebratory sound effect
function createCelebrationBuffer(): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const duration = 0.6; // 600ms total duration
  const samples = duration * sampleRate;
  const buffer = ctx.createBuffer(1, samples, sampleRate);
  const channel = buffer.getChannelData(0);

  // Create a rising sequence of tones
  const baseFreq = 400;
  const frequencies = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
  const noteDuration = duration / frequencies.length;

  frequencies.forEach((freq, index) => {
    const startSample = Math.floor(index * noteDuration * sampleRate);
    const endSample = Math.floor((index + 1) * noteDuration * sampleRate);

    for (let i = startSample; i < endSample; i++) {
      // Add envelope to smooth transitions
      const progress = (i - startSample) / (endSample - startSample);
      const envelope = Math.sin(progress * Math.PI); // Creates a smooth rise and fall
      channel[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * envelope * 0.5;
    }
  });

  return buffer;
}

// Create our sound effects with shorter durations
const SOUNDS = {
  bounce: createBeepBuffer(500, 0.05),  // 500Hz, 50ms
  score: createBeepBuffer(800, 0.1),    // 800Hz, 100ms
  gameOver: createCelebrationBuffer()    // Celebratory sound effect
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