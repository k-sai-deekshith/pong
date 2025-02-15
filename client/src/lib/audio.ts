// Create audio instances for game sounds
const bounceSound = new Audio("./sounds/bounce.mp3");
const scoreSound = new Audio("./sounds/score.mp3");
const gameOverSound = new Audio("./sounds/game-over.mp3");

// Set volume levels to maximum for testing
bounceSound.volume = 1.0; // Maximum volume
scoreSound.volume = 1.0; // Maximum volume
gameOverSound.volume = 1.0; // Maximum volume

export const playSound = {
  bounce: () => {
    bounceSound.currentTime = 0;
    bounceSound.play().catch((error) => {
      console.error('Error playing bounce sound:', error);
    });
  },
  score: () => {
    scoreSound.currentTime = 0;
    scoreSound.play().catch((error) => {
      console.error('Error playing score sound:', error);
    });
  },
  gameOver: () => {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch((error) => {
      console.error('Error playing game over sound:', error);
    });
  },
};