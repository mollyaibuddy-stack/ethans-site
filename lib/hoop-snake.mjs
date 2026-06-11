export const GRID_SIZE = 12;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const DEFAULT_SNAKE = [
  { x: 5, y: 6 },
  { x: 4, y: 6 },
  { x: 3, y: 6 },
];

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isReverse(current, next) {
  const currentVector = DIRECTIONS[current];
  const nextVector = DIRECTIONS[next];
  return currentVector.x + nextVector.x === 0 && currentVector.y + nextVector.y === 0;
}

function cloneCells(cells) {
  return cells.map(cell => ({ ...cell }));
}

export function createInitialGame(options = {}) {
  const snake = cloneCells(options.snake || DEFAULT_SNAKE);
  const direction = options.direction || "right";

  return {
    gridSize: options.gridSize || GRID_SIZE,
    snake,
    food: { ...(options.food || { x: 8, y: 6 }) },
    direction,
    nextDirection: options.nextDirection || direction,
    score: options.score || 0,
    status: options.status || "ready",
  };
}

export function changeDirection(game, nextDirection) {
  if (!DIRECTIONS[nextDirection] || isReverse(game.direction, nextDirection)) {
    return game;
  }

  return {
    ...game,
    nextDirection,
  };
}

export function generateFood({ snake, gridSize = GRID_SIZE, random = Math.random }) {
  const occupied = new Set(snake.map(cell => `${cell.x},${cell.y}`));
  const emptyCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(random() * emptyCells.length)];
}

export function advanceGame(game, options = {}) {
  if (game.status !== "running") return game;

  const direction = game.nextDirection;
  const vector = DIRECTIONS[direction];
  const head = game.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };
  const ateFood = sameCell(nextHead, game.food);
  const collisionBody = ateFood ? game.snake : game.snake.slice(0, -1);
  const hitWall = nextHead.x < 0
    || nextHead.y < 0
    || nextHead.x >= game.gridSize
    || nextHead.y >= game.gridSize;
  const hitSelf = collisionBody.some(cell => sameCell(cell, nextHead));

  if (hitWall || hitSelf) {
    return {
      ...game,
      direction,
      status: "game-over",
    };
  }

  const snake = ateFood
    ? [nextHead, ...game.snake]
    : [nextHead, ...game.snake.slice(0, -1)];

  return {
    ...game,
    direction,
    snake,
    food: ateFood
      ? (options.nextFood ? options.nextFood(snake) : generateFood({ snake, gridSize: game.gridSize }))
      : game.food,
    score: ateFood ? game.score + 1 : game.score,
  };
}
