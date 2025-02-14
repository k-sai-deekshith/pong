import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GameState, initialGameState, createInitialGameState, updateGame } from "@/lib/game";
import { playSound } from "@/lib/audio";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import GameOverDialog from "./GameOverDialog";
import { Play, Pause, RotateCcw } from "lucide-react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPaused, setIsPaused] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); // Added state for game over

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!gameStarted || isPaused) return;

    if (e.key === "w" || e.key === "s" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault(); // Prevent screen scrolling
    }

    if (e.key === "w") {
      setGameState(prev => ({ ...prev, leftPaddleMoving: -1 }));
    } else if (e.key === "s") {
      setGameState(prev => ({ ...prev, leftPaddleMoving: 1 }));
    } else if (e.key === "ArrowUp") {
      setGameState(prev => ({ ...prev, rightPaddleMoving: -1 }));
    } else if (e.key === "ArrowDown") {
      setGameState(prev => ({ ...prev, rightPaddleMoving: 1 }));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "s") {
      setGameState(prev => ({ ...prev, leftPaddleMoving: 0 }));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      setGameState(prev => ({ ...prev, rightPaddleMoving: 0 }));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, isPaused]);

  const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.strokeStyle = "#333";
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(
      state.leftPaddle.x,
      state.leftPaddle.y,
      state.leftPaddle.width,
      state.leftPaddle.height
    );
    ctx.fillRect(
      state.rightPaddle.x,
      state.rightPaddle.y,
      state.rightPaddle.width,
      state.rightPaddle.height
    );

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.font = "48px 'Inter'";
    ctx.fillStyle = "#666";
    ctx.fillText(state.leftScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(state.rightScore.toString(), (CANVAS_WIDTH / 4) * 3, 60);
  };

  useGameLoop((deltaTime) => {
    if (!gameStarted || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevState = gameState;
    const newState = updateGame(prevState, deltaTime);

    // Play sound for wall or paddle collisions
    if (newState.wallCollision || newState.paddleCollision) {
      console.log('Playing bounce sound');
      playSound.bounce();
    }

    // Check for scoring and play sound
    if (newState.scored) {
      console.log('Playing score sound');
      playSound.score();
    }

    // Check for game over
    if ((newState.leftScore >= 10 || newState.rightScore >= 10) && 
        !isGameOver && gameStarted && !isPaused) {
      console.log('Playing game over sound');
      playSound.gameOver();
      setIsGameOver(true); // Set game over state
    }

    setGameState(newState);
    draw(ctx, newState);
  });

  const handleReset = () => {
    const newState = createInitialGameState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset all state variables synchronously
    setGameState(newState);
    setIsPaused(true);
    setGameStarted(false);
    setIsGameOver(false); // Reset game over state

    // Draw the initial state immediately
    draw(ctx, newState);
  };

  const togglePause = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    setIsPaused(!isPaused);
  };


  if (isGameOver && gameStarted && !isPaused) {
    setIsPaused(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx, gameState);
  }, []);

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full aspect-[2/1] border border-border rounded-lg"
      />
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePause}
        >
          {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
          {!gameStarted ? "Start" : isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
      <GameOverDialog
        open={isGameOver}
        winner={gameState.leftScore >= 10 ? "Player 1" : "Player 2"}
        onReset={handleReset}
      />
    </div>
  );
}