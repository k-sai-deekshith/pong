import { GameState } from "./types";

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
}

export interface GameState {
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  leftScore: number;
  rightScore: number;
  leftPaddleMoving: number;
  rightPaddleMoving: number;
  wallCollision?: boolean;
  paddleCollision?: boolean;
  scored?: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const DEFAULT_PADDLE_HEIGHT = 60;
const BALL_RADIUS = 5;
const PADDLE_SPEED = 300;
const INITIAL_BALL_SPEED = 300;
const SPEED_INCREASE_FACTOR = 1.05;

export function createInitialGameState(): GameState {
  return {
    leftPaddle: {
      x: 50,
      y: CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: DEFAULT_PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
    },
    rightPaddle: {
      x: CANVAS_WIDTH - 50 - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - DEFAULT_PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: DEFAULT_PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
    },
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      speedX: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      speedY: 0,
    },
    leftScore: 0,
    rightScore: 0,
    leftPaddleMoving: 0,
    rightPaddleMoving: 0,
  };
}

export const initialGameState = createInitialGameState();

function resetBall(ball: Ball, goingLeft: boolean = Math.random() > 0.5) {
  ball.x = CANVAS_WIDTH / 2;
  ball.y = CANVAS_HEIGHT / 2;
  ball.speedX = goingLeft ? -INITIAL_BALL_SPEED : INITIAL_BALL_SPEED;
  ball.speedY = (Math.random() - 0.5) * INITIAL_BALL_SPEED;
}

function checkCollision(ball: Ball, paddle: Paddle): boolean {
  return (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height
  );
}

export function updateGame(state: GameState, deltaTime: number): GameState {
  const newState = { ...state };

  // Update paddle positions
  if (state.leftPaddleMoving !== 0) {
    newState.leftPaddle.y += state.leftPaddleMoving * state.leftPaddle.speed * deltaTime;
    newState.leftPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - state.leftPaddle.height, newState.leftPaddle.y));
  }

  if (state.rightPaddleMoving !== 0) {
    newState.rightPaddle.y += state.rightPaddleMoving * state.rightPaddle.speed * deltaTime;
    newState.rightPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - state.rightPaddle.height, newState.rightPaddle.y));
  }

  // Reset collision flags at the start of each update
  newState.wallCollision = false;
  newState.paddleCollision = false;
  newState.scored = false;

  // Update ball position
  newState.ball.x += newState.ball.speedX * deltaTime;
  newState.ball.y += newState.ball.speedY * deltaTime;

  // Ball collision with top and bottom walls
  if (newState.ball.y - BALL_RADIUS <= 0 || newState.ball.y + BALL_RADIUS >= CANVAS_HEIGHT) {
    newState.ball.speedY = -newState.ball.speedY;
    newState.wallCollision = true;
    return newState;
  }

  // Ball collision with paddles
  if (checkCollision(newState.ball, newState.leftPaddle)) {
    newState.ball.speedX = Math.abs(newState.ball.speedX) * SPEED_INCREASE_FACTOR;
    const relativeIntersectY = (newState.leftPaddle.y + (newState.leftPaddle.height / 2)) - newState.ball.y;
    newState.ball.speedY = -(relativeIntersectY / (newState.leftPaddle.height / 2)) * Math.abs(newState.ball.speedX);
    newState.paddleCollision = true;
    return newState;
  }

  if (checkCollision(newState.ball, newState.rightPaddle)) {
    newState.ball.speedX = -Math.abs(newState.ball.speedX) * SPEED_INCREASE_FACTOR;
    const relativeIntersectY = (newState.rightPaddle.y + (newState.rightPaddle.height / 2)) - newState.ball.y;
    newState.ball.speedY = -(relativeIntersectY / (newState.rightPaddle.height / 2)) * Math.abs(newState.ball.speedX);
    newState.paddleCollision = true;
    return newState;
  }

  // Scoring
  if (newState.ball.x + BALL_RADIUS < 0) {
    newState.rightScore++;
    resetBall(newState.ball, false);
    newState.scored = true;
    return newState;
  } else if (newState.ball.x - BALL_RADIUS > CANVAS_WIDTH) {
    newState.leftScore++;
    resetBall(newState.ball, true);
    newState.scored = true;
    return newState;
  }

  return newState;
}