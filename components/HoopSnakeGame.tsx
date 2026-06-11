"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceGame,
  changeDirection,
  createInitialGame,
} from "@/lib/hoop-snake.mjs";

type Direction = "up" | "down" | "left" | "right";
type Cell = { x: number; y: number };

const PROJECT_VERSION = "0.1.0";
const PROJECT_UPDATED = "June 11, 2026";

const keyboardDirections: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

function cellKey(cell: Cell) {
  return `${cell.x},${cell.y}`;
}

function isSameCell(a: Cell, b: Cell) {
  return a.x === b.x && a.y === b.y;
}

export default function HoopSnakeGame() {
  const [game, setGame] = useState(() => createInitialGame());
  const touchStart = useRef<Cell | null>(null);

  const move = useCallback((direction: Direction) => {
    setGame(current => changeDirection(current, direction));
  }, []);

  const startGame = () => {
    setGame(current => {
      if (current.status === "game-over") {
        return createInitialGame({ status: "running" });
      }

      return {
        ...current,
        status: "running",
      };
    });
  };

  const pauseGame = () => {
    setGame(current => current.status === "running" ? { ...current, status: "paused" } : current);
  };

  const resetGame = () => {
    setGame(createInitialGame());
  };

  useEffect(() => {
    if (game.status !== "running") return;

    const timer = window.setInterval(() => {
      setGame(current => advanceGame(current));
    }, 160);

    return () => window.clearInterval(timer);
  }, [game.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = keyboardDirections[event.code];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

    move(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up"));
  };

  const snakeCells = new Set(game.snake.map(cellKey));
  const head = game.snake[0];
  const cells = Array.from({ length: game.gridSize * game.gridSize }, (_, index) => ({
    x: index % game.gridSize,
    y: Math.floor(index / game.gridSize),
  }));
  const statusText = game.status === "game-over"
    ? "Game over"
    : game.status === "running"
      ? "Playing"
      : game.status === "paused"
        ? "Paused"
        : "Ready";

  return (
    <section className="snake-game" aria-label="Hoop Snake game">
      <div className="snake-game-header">
        <div>
          <h2>Hoop Snake</h2>
          <p className="muted">Guide the snake to collect basketballs and keep the streak alive.</p>
          <p className="project-meta">
            <span>Version {PROJECT_VERSION}</span>
            <span>Updated {PROJECT_UPDATED}</span>
          </p>
        </div>
        <div className="snake-score" aria-label="Score">
          <span>{game.score}</span>
          <small>Score</small>
        </div>
      </div>

      <div className="snake-status-row">
        <span className={"snake-status snake-status-" + game.status}>{statusText}</span>
        <div className="snake-actions">
          <button type="button" onClick={startGame}>{game.status === "game-over" ? "Play Again" : "Start"}</button>
          <button type="button" onClick={pauseGame} disabled={game.status !== "running"}>Pause</button>
          <button type="button" onClick={resetGame}>Reset</button>
        </div>
      </div>

      <div
        className="snake-board"
        role="grid"
        aria-label="Hoop Snake board"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {cells.map(cell => {
          const isHead = isSameCell(cell, head);
          const isSnake = snakeCells.has(cellKey(cell));
          const isFood = isSameCell(cell, game.food);
          const className = [
            "snake-cell",
            isSnake ? "snake-cell-body" : "",
            isHead ? "snake-cell-head" : "",
            isFood ? "snake-cell-food" : "",
          ].filter(Boolean).join(" ");

          return (
            <span
              key={cellKey(cell)}
              className={className}
              role="gridcell"
              data-x={cell.x}
              data-y={cell.y}
              data-snake-head={isHead ? "true" : undefined}
            />
          );
        })}
      </div>

      <div className="snake-controls" aria-label="Touch controls">
        <button type="button" className="snake-control-button snake-control-up" aria-label="Move up" onClick={() => move("up")}>Up</button>
        <button type="button" className="snake-control-button snake-control-left" aria-label="Move left" onClick={() => move("left")}>Left</button>
        <button type="button" className="snake-control-button snake-control-right" aria-label="Move right" onClick={() => move("right")}>Right</button>
        <button type="button" className="snake-control-button snake-control-down" aria-label="Move down" onClick={() => move("down")}>Down</button>
      </div>
    </section>
  );
}
