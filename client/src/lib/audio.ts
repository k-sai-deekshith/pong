// Create audio instances for game sounds
const bounceSound = new Audio("/sounds/bounce.mp3");
const scoreSound = new Audio("/sounds/score.mp3");
const gameOverSound = new Audio("/sounds/game-over.mp3");

// Set volume levels
bounceSound.volume = 0.3;
scoreSound.volume = 0.4;
gameOverSound.volume = 0.5;

export const playSound = {
  bounce: () => {
    bounceSound.currentTime = 0;
    bounceSound.play().catch(() => {
      // Ignore errors if audio isn't loaded yet
    });
  },
  score: () => {
    scoreSound.currentTime = 0;
    scoreSound.play().catch(() => {
      // Ignore errors if audio isn't loaded yet
    });
  },
  gameOver: () => {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(() => {
      // Ignore errors if audio isn't loaded yet
    });
  },
};
