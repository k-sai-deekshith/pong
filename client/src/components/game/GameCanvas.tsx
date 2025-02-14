import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GameState, initialGameState, updateGame } from "@/lib/game";
import GameOverDialog from "./GameOverDialog";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPaused, setIsPaused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
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
  }, []);

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setGameState(prev => updateGame(prev, deltaTime));
    draw(ctx);
  });

  const handleReset = () => {
    setGameState(initialGameState);
    setIsPaused(false);
  };

  const isGameOver = gameState.leftScore >= 10 || gameState.rightScore >= 10;
  if (isGameOver && !isPaused) {
    setIsPaused(true);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full aspect-[2/1] border border-border rounded-lg"
      />
      <GameOverDialog
        open={isGameOver}
        winner={gameState.leftScore >= 10 ? "Player 1" : "Player 2"}
        onReset={handleReset}
      />
    </>
  );
}
