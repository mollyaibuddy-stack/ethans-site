export const CYBER_FOOD_BEADS = [
  { name: "Ramen", palette: ["#f8d66d", "#c95c2e", "#f6efe2"] },
  { name: "Pizza", palette: ["#f6c453", "#d9483b", "#f7ead1"] },
  { name: "Burger", palette: ["#d89b4a", "#6d3f21", "#59a85a"] },
  { name: "Sushi", palette: ["#f7f4ea", "#ef6c79", "#1f7a68"] },
  { name: "Dumplings", palette: ["#f4e4c1", "#d6b27c", "#f9f1df"] },
  { name: "Tacos", palette: ["#f0b84c", "#75b95b", "#c44735"] },
  { name: "Curry", palette: ["#d9822b", "#f2c766", "#7b4b22"] },
  { name: "Chicken", palette: ["#d86b3d", "#f2b36f", "#fff1d7"] },
  { name: "Pasta", palette: ["#f3d36b", "#d94b36", "#fff0b8"] },
  { name: "Sandwich", palette: ["#f2d1a0", "#5aa35d", "#e85d4f"] },
  { name: "Hot Dog", palette: ["#d88f46", "#b92d2d", "#f2d37b"] },
  { name: "Pancakes", palette: ["#d99b4c", "#f4d08a", "#6b3d20"] },
];

export const FULL_TURN = Math.PI * 2;
export const BEAD_STEP = FULL_TURN / CYBER_FOOD_BEADS.length;
const ANGLE_EPSILON = 1e-12;

export function normalizeAngle(angle) {
  const normalized = angle % FULL_TURN;
  const positive = normalized < 0 ? normalized + FULL_TURN : normalized;
  const beadMultiple = Math.round(positive / BEAD_STEP) * BEAD_STEP;

  if (Math.abs(positive - beadMultiple) < ANGLE_EPSILON) {
    return beadMultiple >= FULL_TURN ? 0 : beadMultiple;
  }

  return positive;
}

export function getSelectedFood(rotation) {
  const normalized = normalizeAngle(-rotation);
  const index = Math.round(normalized / BEAD_STEP) % CYBER_FOOD_BEADS.length;
  return CYBER_FOOD_BEADS[index];
}

export function countBeadCrossings(previousRotation, nextRotation) {
  const previousSlot = Math.trunc(previousRotation / BEAD_STEP);
  const nextSlot = Math.trunc(nextRotation / BEAD_STEP);
  return Math.abs(nextSlot - previousSlot);
}
