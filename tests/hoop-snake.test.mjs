import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceGame,
  changeDirection,
  createInitialGame,
  generateFood,
} from "../lib/hoop-snake.mjs";

test("moves the snake one square in the current direction", () => {
  const game = createInitialGame({
    snake: [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }],
    food: { x: 8, y: 8 },
    status: "running",
  });

  const next = advanceGame(game);

  assert.deepEqual(next.snake, [{ x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 }]);
  assert.equal(next.score, 0);
  assert.equal(next.status, "running");
});

test("does not allow reversing directly into the snake body", () => {
  const game = createInitialGame({ direction: "right", nextDirection: "right" });

  const next = changeDirection(game, "left");

  assert.equal(next.nextDirection, "right");
});

test("grows and scores when eating food", () => {
  const game = createInitialGame({
    snake: [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }],
    food: { x: 5, y: 4 },
    status: "running",
  });

  const next = advanceGame(game, { nextFood: () => ({ x: 8, y: 8 }) });

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake[0], { x: 5, y: 4 });
  assert.deepEqual(next.food, { x: 8, y: 8 });
});

test("ends the game when the snake hits a wall", () => {
  const game = createInitialGame({
    snake: [{ x: 11, y: 4 }, { x: 10, y: 4 }, { x: 9, y: 4 }],
    food: { x: 2, y: 2 },
    status: "running",
  });

  const next = advanceGame(game);

  assert.equal(next.status, "game-over");
});

test("ends the game when the snake hits itself", () => {
  const game = createInitialGame({
    snake: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
      { x: 4, y: 4 },
    ],
    direction: "right",
    nextDirection: "down",
    food: { x: 9, y: 9 },
    status: "running",
  });

  const next = advanceGame(game);

  assert.equal(next.status, "game-over");
});

test("generates food only on empty cells", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  assert.deepEqual(generateFood({ snake, gridSize: 3, random: () => 0 }), { x: 0, y: 1 });
});
