import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const projectsSource = fs.readFileSync(new URL("../app/projects/page.tsx", import.meta.url), "utf8");
const gameSource = fs.readFileSync(new URL("../components/HoopSnakeGame.tsx", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("projects page includes Hoop Snake as Ethan's first game", () => {
  assert.match(projectsSource, /import HoopSnakeGame from "@\/components\/HoopSnakeGame";/);
  assert.match(projectsSource, /<HoopSnakeGame \/>/);
});

test("Hoop Snake shows update date and version", () => {
  assert.match(gameSource, /PROJECT_VERSION = "0\.1\.0"/);
  assert.match(gameSource, /PROJECT_UPDATED = "June 11, 2026"/);
  assert.match(gameSource, /Version {PROJECT_VERSION}/);
  assert.match(gameSource, /Updated {PROJECT_UPDATED}/);
  assert.match(cssSource, /\.project-meta/);
});

test("Hoop Snake supports touch controls", () => {
  assert.match(gameSource, /Hoop Snake/);
  assert.match(gameSource, /onTouchStart/);
  assert.match(gameSource, /onTouchEnd/);
  assert.match(gameSource, /aria-label="Move up"/);
  assert.match(gameSource, /aria-label="Move left"/);
  assert.match(gameSource, /aria-label="Move right"/);
  assert.match(gameSource, /aria-label="Move down"/);
});

test("Hoop Snake board has fixed responsive grid styling", () => {
  assert.match(cssSource, /\.snake-board\s*{[\s\S]*grid-template-columns:\s*repeat\(12,\s*1fr\);/);
  assert.match(cssSource, /\.snake-cell\s*{[\s\S]*aspect-ratio:\s*1;/);
  assert.match(cssSource, /\.snake-control-button\s*{[\s\S]*min-height:\s*54px;/);
});
