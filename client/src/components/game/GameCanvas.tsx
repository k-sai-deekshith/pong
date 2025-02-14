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

  const draw = (ctx: CanvasRenderingContext2D) => {
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
      gameState.leftPaddle.x,
      gameState.leftPaddle.y,
      gameState.leftPaddle.width,
      gameState.leftPaddle.height
    );
    ctx.fillRect(
      gameState.rightPaddle.x,
      gameState.rightPaddle.y,
      gameState.rightPaddle.width,
      gameState.rightPaddle.height
    );

    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.font = "48px 'Inter'";
    ctx.fillStyle = "#666";
    ctx.fillText(gameState.leftScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(gameState.rightScore.toString(), (CANVAS_WIDTH / 4) * 3, 60);
  };

  useGameLoop((deltaTime) => {
    if (!gameStarted || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prevState = gameState;
    const newState = updateGame(prevState, deltaTime);

    // Check for scoring
    if (newState.leftScore !== prevState.leftScore || newState.rightScore !== prevState.rightScore) {
      playSound.score();
    }

    // Check for paddle hits
    if (Math.abs(newState.ball.speedX) !== Math.abs(prevState.ball.speedX)) {
      playSound.bounce();
    }

    setGameState(newState);
    draw(ctx);
  });

  const handleReset = () => {
    setGameState(createInitialGameState());
    setIsPaused(true);
    setGameStarted(false);

    // Redraw the canvas immediately with the reset state
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        draw(ctx);
      }
    }
  };

  const togglePause = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    setIsPaused(!isPaused);
  };

  const isGameOver = gameState.leftScore >= 10 || gameState.rightScore >= 10;
  if (isGameOver && gameStarted && !isPaused) {
    setIsPaused(true);
    playSound.gameOver();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        draw(ctx);
      }
    }
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
        open={isGameOver && gameStarted}
        winner={gameState.leftScore >= 10 ? "Player 1" : "Player 2"}
        onReset={handleReset}
      />
    </div>
  );
}