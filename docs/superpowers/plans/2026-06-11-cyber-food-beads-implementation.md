# Cyber Food Beads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ethan's `Cyber Food Beads / 赛博盘串` project below Hoop Snake with a playable 12-bead Three.js food ring, drag inertia, generated tick sounds, and English result modal.

**Architecture:** Keep the feature isolated in one client component plus one pure helper module. Pure bead math lives in `lib/cyber-food-beads.mjs` and is covered by Node tests. The React component owns Three.js setup, pointer interaction, Web Audio unlock, animation cleanup, and the result modal.

**Tech Stack:** Next.js App Router, React client component, Three.js, Web Audio API, Node `node:test`, Playwright/browser verification.

---

## File Structure

- Create `lib/cyber-food-beads.mjs`
  - exports the 12-food list
  - normalizes angles
  - maps ring rotation to selected food
  - counts bead boundary crossings for tick playback
- Create `tests/cyber-food-beads.test.mjs`
  - locks food list, selection math, angle normalization, and crossing counts
- Create `components/CyberFoodBeads.tsx`
  - client-only Three.js scene
  - canvas mount and cleanup
  - pointer drag, inertia, pan/stop/reset buttons
  - Web Audio generated tick
  - English result modal
- Modify `app/projects/page.tsx`
  - import and render `CyberFoodBeads` below `HoopSnakeGame`
- Modify `app/globals.css`
  - scoped Cyber Food Beads card/canvas/control/modal styles
- Modify `tests/projects-game-ui.test.mjs`
  - source tests for page integration, metadata, pointer handlers, controls, audio API, and brand avoidance
- Modify `package.json` and `package-lock.json`
  - add `three`

## Task 1: Pure Bead Math

**Files:**
- Create: `lib/cyber-food-beads.mjs`
- Create: `tests/cyber-food-beads.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `tests/cyber-food-beads.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  BEAD_STEP,
  CYBER_FOOD_BEADS,
  countBeadCrossings,
  getSelectedFood,
  normalizeAngle,
} from "../lib/cyber-food-beads.mjs";

test("Cyber Food Beads has 12 generic foods", () => {
  assert.deepEqual(CYBER_FOOD_BEADS.map(food => food.name), [
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/cyber-food-beads.test.mjs
```

Expected: FAIL because `../lib/cyber-food-beads.mjs` does not exist.

- [ ] **Step 3: Implement the helper module**

Create `lib/cyber-food-beads.mjs`:

```js
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

export function normalizeAngle(angle) {
  const normalized = angle % FULL_TURN;
  return normalized < 0 ? normalized + FULL_TURN : normalized;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/cyber-food-beads.test.mjs
```

Expected: PASS for the new helper tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/cyber-food-beads.mjs tests/cyber-food-beads.test.mjs
git commit -m "Add Cyber Food Beads selection logic"
```

## Task 2: Project UI Source Contract

**Files:**
- Modify: `tests/projects-game-ui.test.mjs`

- [ ] **Step 1: Write failing source tests**

Add Cyber Food Beads source reads and tests to `tests/projects-game-ui.test.mjs`:

```js
const cyberFoodSource = fs.readFileSync(new URL("../components/CyberFoodBeads.tsx", import.meta.url), "utf8");
```

Add tests:

```js
test("projects page includes Cyber Food Beads after Hoop Snake", () => {
  assert.match(projectsSource, /import CyberFoodBeads from "@\/components\/CyberFoodBeads";/);
  assert.match(projectsSource, /<HoopSnakeGame \/>[\s\S]*<CyberFoodBeads \/>/);
});

test("Cyber Food Beads shows update date and version", () => {
  assert.match(cyberFoodSource, /PROJECT_VERSION = "0\.1\.0"/);
  assert.match(cyberFoodSource, /PROJECT_UPDATED = "June 11, 2026"/);
  assert.match(cyberFoodSource, /Version {PROJECT_VERSION}/);
  assert.match(cyberFoodSource, /Updated {PROJECT_UPDATED}/);
});

test("Cyber Food Beads supports pointer dragging, audio ticks, and controls", () => {
  assert.match(cyberFoodSource, /Cyber Food Beads/);
  assert.match(cyberFoodSource, /onPointerDown/);
  assert.match(cyberFoodSource, /onPointerMove/);
  assert.match(cyberFoodSource, /onPointerUp/);
  assert.match(cyberFoodSource, /AudioContext/);
  assert.match(cyberFoodSource, />Pan</);
  assert.match(cyberFoodSource, />Stop</);
  assert.match(cyberFoodSource, />Reset</);
});

test("Cyber Food Beads avoids real fast-food brands", () => {
  assert.doesNotMatch(cyberFoodSource, /McDonald|KFC|Hungry Jack|Burger King|Domino|Pizza Hut|Subway|Taco Bell/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/projects-game-ui.test.mjs
```

Expected: FAIL because `components/CyberFoodBeads.tsx` does not exist and the page does not import it.

## Task 3: Three.js Component and Styling

**Files:**
- Create: `components/CyberFoodBeads.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install Three.js**

Run:

```bash
npm install three
```

Expected: `three` is added to `dependencies`.

- [ ] **Step 2: Implement `CyberFoodBeads`**

Create `components/CyberFoodBeads.tsx` as a client component. It must:

- import `* as THREE from "three"`
- import `CYBER_FOOD_BEADS`, `countBeadCrossings`, and `getSelectedFood`
- create a scene, camera, renderer, lights, and 12 sphere meshes
- create bead textures with canvas drawings and no text
- handle `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`
- unlock Web Audio after first pointer/click
- call a short generated tick on boundary crossings
- clean up renderer, animation frame, geometry, materials, and textures on unmount
- render title, subtitle, version/date, canvas host, `Pan`, `Stop`, `Reset`, and result modal

- [ ] **Step 3: Render it on Projects**

Modify `app/projects/page.tsx`:

```tsx
import Navbar from "@/components/Navbar";
import CyberFoodBeads from "@/components/CyberFoodBeads";
import HoopSnakeGame from "@/components/HoopSnakeGame";

export default function Projects() {
  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Projects</h1>
        <p>Things I've made and built.</p>
        <HoopSnakeGame />
        <CyberFoodBeads />
      </main>
    </>
  );
}
```

- [ ] **Step 4: Add scoped CSS**

Append styles to the Projects section of `app/globals.css` for:

- `.cyber-food-beads`
- `.cyber-food-header`
- `.cyber-food-scene`
- `.cyber-food-canvas-host`
- `.cyber-food-selector`
- `.cyber-food-actions`
- `.cyber-food-result-modal`
- `.cyber-food-result-card`

The canvas area must use stable responsive dimensions and `touch-action: none`.

- [ ] **Step 5: Run source tests**

Run:

```bash
npm test -- tests/projects-game-ui.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json package-lock.json app/projects/page.tsx app/globals.css components/CyberFoodBeads.tsx tests/projects-game-ui.test.mjs
git commit -m "Add Cyber Food Beads project UI"
```

## Task 4: Full Verification and Browser QA

**Files:**
- Modify if needed based on failures only.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Build production bundle**

Run:

```bash
npm run build
```

Expected: Next.js build succeeds.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev
```

Expected: local server starts, usually on `http://localhost:3000`.

- [ ] **Step 4: Browser visual verification**

Open `http://localhost:3000/projects` and verify:

- Hoop Snake still renders first
- Cyber Food Beads renders below it
- canvas is nonblank on desktop width
- canvas is nonblank on mobile width
- ring is framed correctly and not overlapping controls
- dragging rotates the beads
- `Pan` starts motion
- `Stop` opens an English result modal
- `Reset` clears the modal and resets the ring

- [ ] **Step 5: Commit any QA fixes**

If browser QA requires changes, commit them:

```bash
git add app/globals.css components/CyberFoodBeads.tsx tests
git commit -m "Polish Cyber Food Beads interaction"
```

