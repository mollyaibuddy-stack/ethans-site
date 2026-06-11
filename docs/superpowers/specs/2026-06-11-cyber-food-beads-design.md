# Cyber Food Beads v0.1 Design

## Goal

Add Ethan's second project to the Projects page: **Cyber Food Beads / 赛博盘串**. It should feel like a small playable 3D food decision toy: the user drags a bead ring on a phone, hears synchronized tick sounds as beads pass the selector, then stops the ring to get an English food result.

## Scope

Build version `0.1.0`, updated `June 11, 2026`.

Include 12 generic food beads:

- Ramen
- Pizza
- Burger
- Sushi
- Dumplings
- Tacos
- Curry
- Chicken
- Pasta
- Sandwich
- Hot Dog
- Pancakes

Do not include real restaurant or fast-food logos. Do not add a database, custom food editor, result history, accounts, or admin controls.

## Recommended Approach

Use the 3D ring-first approach.

1. `Three.js` renders a circular necklace of 12 `SphereGeometry` beads.
2. Each bead uses a generated `CanvasTexture` with a simple food-icon style drawing and no text.
3. Pointer/touch dragging rotates the ring directly, with inertia after release.
4. Bead crossings at the selector emit generated Web Audio tick sounds.
5. `Stop` decelerates the ring and selects the bead under the selector.

Alternatives considered:

- A 2D CSS wheel would be quicker, but it would not match the uploaded 3D demo or direct bead-dragging feel.
- A conventional picker grid would be easier to maintain, but it would lose the 赛博盘串 concept.

## Page Structure

The Projects page keeps Hoop Snake as the first project and adds Cyber Food Beads below it.

The new project card includes:

- Title: `Cyber Food Beads`
- Subtitle/label: `赛博盘串`
- Metadata chips: `Version 0.1.0`, `Updated June 11, 2026`
- A full-width 3D canvas inside the project card
- A visible selector near the top/front of the ring
- Controls: `Pan`, `Stop`, `Reset`
- Result modal text in English, for example: `Today we eat: "Pizza"`

Food names are not shown on the beads. Food names only appear in the final result modal.

## Interaction

The component unlocks Web Audio on the first user touch/click. Before unlock, gameplay still works silently.

Dragging behavior:

- Pointer/touch drag rotates the ring along the horizontal drag axis.
- Faster drags produce faster angular velocity.
- On release, inertia keeps the ring moving and gradually slows it.
- Every bead boundary crossing at the selector triggers one short tick.
- Tick cadence is derived from actual bead crossings, so faster motion naturally produces faster `da-da-da` rhythm.

Buttons:

- `Pan` starts or boosts a smooth spin.
- `Stop` applies stronger deceleration and then resolves to the nearest bead under the selector.
- `Reset` returns the ring to the initial angle and clears the result.

## Architecture

Add an isolated client component:

- `components/CyberFoodBeads.tsx`
  - owns Three.js scene setup, pointer handling, animation loop, audio unlock, buttons, and result modal
  - imports pure helper logic for bead math

Add a pure helper module:

- `lib/cyber-food-beads.mjs`
  - exports the food list
  - calculates bead angle steps
  - normalizes rotation
  - maps rotation to the selected bead
  - detects crossed bead boundaries for tick events

Update:

- `app/projects/page.tsx` imports and renders `<CyberFoodBeads />` below `<HoopSnakeGame />`
- `app/globals.css` adds scoped styles for the project card, canvas frame, controls, and modal
- `package.json` adds `three` if it is not already installed

## Testing

Add focused unit tests for pure selection math:

- food list contains 12 items
- selection returns the expected bead for known rotations
- rotation normalization handles negative and large angles
- crossing detection returns tick counts when the ring moves across bead boundaries

Extend UI source tests to verify:

- Projects page imports and renders Cyber Food Beads after Hoop Snake
- Cyber Food Beads shows version/date metadata
- The component includes touch/pointer handlers
- The component includes `Pan`, `Stop`, `Reset`
- The component includes Web Audio API usage
- The component does not include real fast-food brand names or logos

Run:

- `npm test`
- `npm run build`

After implementation, run a local dev server and verify the canvas with browser screenshots/pixel checks on desktop and mobile widths. The canvas must be nonblank, framed correctly, and responsive. Manual interaction should confirm dragging, inertia, tick sounds after audio unlock, and result modal behavior.

## Risks

Three.js must be loaded only in the client component to avoid server-rendering failures. The animation loop must be cleaned up on unmount. Web Audio must be created after a user gesture so mobile browsers allow sound. Touch handling must use `touch-action: none` on the canvas area so phone dragging controls the ring instead of scrolling the page while interacting.
