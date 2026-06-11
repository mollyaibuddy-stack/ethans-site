import assert from "node:assert/strict";
import test from "node:test";

import {
  BEAD_STEP,
  CYBER_FOOD_BEADS,
  FULL_TURN,
  countBeadCrossings,
  getSelectedFood,
  normalizeAngle,
} from "../lib/cyber-food-beads.mjs";

test("Cyber Food Beads has 12 generic foods", () => {
  assert.deepEqual(CYBER_FOOD_BEADS.map((food) => food.name), [
    "Ramen",
    "Pizza",
    "Burger",
    "Sushi",
    "Dumplings",
    "Tacos",
    "Curry",
    "Chicken",
    "Pasta",
    "Sandwich",
    "Hot Dog",
    "Pancakes",
  ]);
  assert.equal(FULL_TURN, Math.PI * 2);
  assert.equal(BEAD_STEP, FULL_TURN / 12);
});

test("normalizes angles into one full turn", () => {
  assert.equal(normalizeAngle(0), 0);
  assert.equal(normalizeAngle(Math.PI * 2), 0);
  assert.equal(normalizeAngle(-BEAD_STEP), Math.PI * 2 - BEAD_STEP);
  assert.equal(normalizeAngle(Math.PI * 4 + BEAD_STEP), BEAD_STEP);
});

test("selects the nearest food under the selector", () => {
  assert.equal(getSelectedFood(0).name, "Ramen");
  assert.equal(getSelectedFood(-BEAD_STEP).name, "Pizza");
  assert.equal(getSelectedFood(-BEAD_STEP * 11).name, "Pancakes");
  assert.equal(getSelectedFood(-BEAD_STEP * 12).name, "Ramen");
});

test("counts bead boundary crossings for tick cadence", () => {
  assert.equal(countBeadCrossings(0, BEAD_STEP * 0.4), 0);
  assert.equal(countBeadCrossings(0, BEAD_STEP * 1.2), 1);
  assert.equal(countBeadCrossings(0, BEAD_STEP * 3.4), 3);
  assert.equal(countBeadCrossings(BEAD_STEP * 3.4, BEAD_STEP * 1.1), 2);
});
