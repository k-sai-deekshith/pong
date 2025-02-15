import { useEffect, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { GameState, initialGameState, createInitialGameState, updateGame } from "@/lib/game";
import { playSound } from "@/lib/audio";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import GameOverDialog from "./GameOverDialog";
import { Play, Pause, RotateCcw, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const MIN_PADDLE_HEIGHT = 40;
const MAX_PADDLE_HEIGHT = 100;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isPaused, setIsPaused] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [paddleHeight, setPaddleHeight] = useState(60);

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

  // Update paddle heights when slider changes
  useEffect(() => {
    setGameState(prev => {
      const leftCenter = prev.leftPaddle.y + (prev.leftPaddle.height / 2);
      const rightCenter = prev.rightPaddle.y + (prev.rightPaddle.height / 2);

      return {
        ...prev,
        leftPaddle: {
          ...prev.leftPaddle,
          height: paddleHeight,
          y: Math.max(0, Math.min(CANVAS_HEIGHT - paddleHeight, leftCenter - (paddleHeight / 2)))
        },
        rightPaddle: {
          ...prev.rightPaddle,
          height: paddleHeight,
          y: Math.max(0, Math.min(CANVAS_HEIGHT - paddleHeight, rightCenter - (paddleHeight / 2)))
        }
      };
    });
  }, [paddleHeight]);

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

    if (newState.wallCollision || newState.paddleCollision) {
      playSound.bounce();
    }

    if (newState.scored) {
      playSound.score();
    }

    if ((newState.leftScore >= 10 || newState.rightScore >= 10) &&
      !isGameOver && gameStarted && !isPaused) {
      playSound.gameOver();
      setIsGameOver(true);
    }

    setGameState(newState);
    draw(ctx, newState);
  });

  const handleReset = () => {
    const newState = createInitialGameState();
    newState.leftPaddle.height = paddleHeight;
    newState.rightPaddle.height = paddleHeight;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setGameState(newState);
    setIsPaused(true);
    setGameStarted(false);
    setIsGameOver(false);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Paddle Height</span>
                <span className="text-sm font-medium">{paddleHeight}px</span>
              </div>
              <Slider
                value={[paddleHeight]}
                onValueChange={([value]) => setPaddleHeight(value)}
                min={MIN_PADDLE_HEIGHT}
                max={MAX_PADDLE_HEIGHT}
                step={5}
                className="w-full"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GameOverDialog
        open={isGameOver}
        winner={gameState.leftScore >= 10 ? "Player 1" : "Player 2"}
        onReset={handleReset}
      />
    </div>
  );
}