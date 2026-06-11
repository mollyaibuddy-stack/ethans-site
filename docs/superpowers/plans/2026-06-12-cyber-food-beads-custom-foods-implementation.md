# Cyber Food Beads Custom Foods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-persisted customization for all 12 Cyber Food Beads names and uploaded bead images.

**Architecture:** Keep durable data in the existing Neon/Postgres private store and expose it through one public read endpoint plus one private save endpoint. Keep image resizing/compression in the client before sending Data URLs to the server. Keep the game playable on defaults when the API is empty or unavailable.

**Tech Stack:** Next.js App Router route handlers, existing Neon/Postgres store, React client component, Three.js CanvasTexture, browser Canvas image processing, Node `node:test`.

---

## File Structure

- Modify `lib/cyber-food-beads.mjs`
  - add constants for bead count, max name length, max image Data URL length
  - add `defaultCyberFoodBeads()`
  - add `normalizeCyberFoodPayload(input)`
  - keep existing selection math intact
- Modify `tests/cyber-food-beads.test.mjs`
  - cover custom payload validation
- Modify `lib/private-store.mjs`
  - create `cyber_food_beads` table in `ensurePrivateSchema`
  - add `listCyberFoodBeads()`
  - add `saveCyberFoodBeads(foods)`
- Modify `db/schema.sql`
  - add the table for manual schema parity
- Modify `tests/private-store.test.mjs`
  - source-level schema/method coverage
- Create `app/api/cyber-food-beads/route.ts`
  - public GET endpoint with default fallback
- Create `app/api/private/cyber-food-beads/route.ts`
  - private GET/POST endpoint
- Modify `tests/projects-game-ui.test.mjs`
  - source tests for customization UI and endpoints
- Modify `components/CyberFoodBeads.tsx`
  - bump version/date
  - fetch server foods
  - add customization panel
  - process image files to 256x256 compressed Data URLs
  - save to private endpoint
  - update bead textures from custom images
- Modify `app/globals.css`
  - scoped customization styles

## Task 1: Custom Food Validation

**Files:**
- Modify: `lib/cyber-food-beads.mjs`
- Modify: `tests/cyber-food-beads.test.mjs`

- [ ] **Step 1: Write failing tests**

Add tests to `tests/cyber-food-beads.test.mjs`:

```js
import {
  MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH,
  MAX_CYBER_FOOD_NAME_LENGTH,
  defaultCyberFoodBeads,
  normalizeCyberFoodPayload,
} from "../lib/cyber-food-beads.mjs";

test("normalizes valid custom food payloads", () => {
  const imageDataUrl = "data:image/webp;base64,abc";
  const foods = defaultCyberFoodBeads().map((food, position) => ({
    position,
    name: ` ${food.name} Custom `,
    imageDataUrl: position === 0 ? imageDataUrl : "",
  }));

  const normalized = normalizeCyberFoodPayload(foods);

  assert.equal(normalized.length, 12);
  assert.deepEqual(normalized[0], {
    position: 0,
    name: "Ramen Custom",
    imageDataUrl,
  });
});

test("rejects invalid custom food payloads", () => {
  assert.throws(() => normalizeCyberFoodPayload([]), /exactly 12/);
  assert.throws(
    () => normalizeCyberFoodPayload(defaultCyberFoodBeads().map((food, position) => ({ position: 0, name: food.name, imageDataUrl: "" }))),
    /duplicate/i,
  );
  assert.throws(
    () => normalizeCyberFoodPayload(defaultCyberFoodBeads().map((food, position) => ({ position, name: "", imageDataUrl: "" }))),
    /name is required/i,
  );
  assert.throws(
    () => normalizeCyberFoodPayload(defaultCyberFoodBeads().map((food, position) => ({ position, name: "x".repeat(MAX_CYBER_FOOD_NAME_LENGTH + 1), imageDataUrl: "" }))),
    /name is too long/i,
  );
  assert.throws(
    () => normalizeCyberFoodPayload(defaultCyberFoodBeads().map((food, position) => ({ position, name: food.name, imageDataUrl: "https://example.com/a.png" }))),
    /invalid image/i,
  );
  assert.throws(
    () => normalizeCyberFoodPayload(defaultCyberFoodBeads().map((food, position) => ({ position, name: food.name, imageDataUrl: `data:image/png;base64,${"a".repeat(MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH)}` }))),
    /image is too large/i,
  );
});
```

- [ ] **Step 2: Run red test**

Run:

```bash
node --test tests/cyber-food-beads.test.mjs
```

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement validation helpers**

In `lib/cyber-food-beads.mjs`, add:

```js
export const CYBER_FOOD_BEAD_COUNT = 12;
export const MAX_CYBER_FOOD_NAME_LENGTH = 40;
export const MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH = 150 * 1024;

export function defaultCyberFoodBeads() {
  return CYBER_FOOD_BEADS.map((food, position) => ({
    position,
    name: food.name,
    imageDataUrl: "",
  }));
}

export function normalizeCyberFoodPayload(input) {
  if (!Array.isArray(input) || input.length !== CYBER_FOOD_BEAD_COUNT) {
    throw new Error("Cyber Food Beads requires exactly 12 foods.");
  }

  const seen = new Set();
  const normalized = input.map(item => {
    const position = Number(item?.position);
    if (!Number.isInteger(position) || position < 0 || position >= CYBER_FOOD_BEAD_COUNT) {
      throw new Error("Cyber Food Beads position must be 0 through 11.");
    }
    if (seen.has(position)) {
      throw new Error("Cyber Food Beads positions must not duplicate.");
    }
    seen.add(position);

    const name = String(item?.name || "").trim();
    if (!name) throw new Error("Cyber Food Beads name is required.");
    if (name.length > MAX_CYBER_FOOD_NAME_LENGTH) {
      throw new Error("Cyber Food Beads name is too long.");
    }

    const imageDataUrl = String(item?.imageDataUrl || "");
    if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) {
      throw new Error("Cyber Food Beads invalid image data URL.");
    }
    if (imageDataUrl.length > MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH) {
      throw new Error("Cyber Food Beads image is too large.");
    }

    return { position, name, imageDataUrl };
  });

  return normalized.sort((a, b) => a.position - b.position);
}
```

- [ ] **Step 4: Run green test**

Run:

```bash
node --test tests/cyber-food-beads.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add lib/cyber-food-beads.mjs tests/cyber-food-beads.test.mjs
git commit -m "Add Cyber Food Beads custom validation"
```

## Task 2: Database Store and API

**Files:**
- Modify: `lib/private-store.mjs`
- Modify: `db/schema.sql`
- Modify: `tests/private-store.test.mjs`
- Create: `app/api/cyber-food-beads/route.ts`
- Create: `app/api/private/cyber-food-beads/route.ts`

- [ ] **Step 1: Write failing tests**

Add source tests to `tests/private-store.test.mjs`:

```js
import fs from "node:fs";

const privateStoreSource = fs.readFileSync(new URL("../lib/private-store.mjs", import.meta.url), "utf8");
const schemaSource = fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

test("private schema includes Cyber Food Beads storage", () => {
  assert.match(privateStoreSource, /CREATE TABLE IF NOT EXISTS cyber_food_beads/);
  assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS cyber_food_beads/);
  assert.match(privateStoreSource, /listCyberFoodBeads/);
  assert.match(privateStoreSource, /saveCyberFoodBeads/);
});
```

Add source tests to `tests/projects-game-ui.test.mjs`:

```js
const publicCyberApiSource = fs.readFileSync(new URL("../app/api/cyber-food-beads/route.ts", import.meta.url), "utf8");
const privateCyberApiSource = fs.readFileSync(new URL("../app/api/private/cyber-food-beads/route.ts", import.meta.url), "utf8");

test("Cyber Food Beads has public and private server APIs", () => {
  assert.match(publicCyberApiSource, /defaultCyberFoodBeads/);
  assert.match(publicCyberApiSource, /listCyberFoodBeads/);
  assert.match(privateCyberApiSource, /withPrivateStore/);
  assert.match(privateCyberApiSource, /saveCyberFoodBeads/);
});
```

- [ ] **Step 2: Run red tests**

Run:

```bash
npm test -- tests/private-store.test.mjs tests/projects-game-ui.test.mjs
```

Expected: FAIL because the API files and store methods do not exist.

- [ ] **Step 3: Implement schema and store**

In `lib/private-store.mjs` import:

```js
import {
  defaultCyberFoodBeads,
  normalizeCyberFoodPayload,
} from "./cyber-food-beads.mjs";
```

Add the `cyber_food_beads` table to `ensurePrivateSchema`, then add methods:

```js
async listCyberFoodBeads() {
  const rows = await sql`
    SELECT position, name, image_data_url
    FROM cyber_food_beads
    ORDER BY position ASC
  `;
  if (rows.length !== 12) return defaultCyberFoodBeads();
  return rows.map(row => ({
    position: Number(row.position),
    name: row.name,
    imageDataUrl: row.image_data_url || "",
  }));
},

async saveCyberFoodBeads(foods) {
  const normalized = normalizeCyberFoodPayload(foods);
  for (const food of normalized) {
    await sql`
      INSERT INTO cyber_food_beads (position, name, image_data_url, updated_at)
      VALUES (${food.position}, ${food.name}, ${food.imageDataUrl}, NOW())
      ON CONFLICT (position)
      DO UPDATE SET name = EXCLUDED.name, image_data_url = EXCLUDED.image_data_url, updated_at = NOW()
    `;
  }
  return this.listCyberFoodBeads();
},
```

Add equivalent DDL to `db/schema.sql`.

- [ ] **Step 4: Implement routes**

Create `app/api/cyber-food-beads/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db.mjs";
import { createPrivateStore } from "@/lib/private-store.mjs";
import { defaultCyberFoodBeads } from "@/lib/cyber-food-beads.mjs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const store = createPrivateStore(getSql());
    await store.ensureSchema();
    return NextResponse.json({ foods: await store.listCyberFoodBeads() });
  } catch {
    return NextResponse.json({ foods: defaultCyberFoodBeads() });
  }
}
```

Create `app/api/private/cyber-food-beads/route.ts`:

```ts
import { NextRequest } from "next/server";
import { withPrivateStore } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  return withPrivateStore(async store => ({
    foods: await store.listCyberFoodBeads(),
  }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  return withPrivateStore(async store => ({
    foods: await store.saveCyberFoodBeads(body?.foods),
  }));
}
```

- [ ] **Step 5: Run green tests**

Run:

```bash
npm test -- tests/private-store.test.mjs tests/projects-game-ui.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add lib/private-store.mjs db/schema.sql tests/private-store.test.mjs tests/projects-game-ui.test.mjs app/api/cyber-food-beads/route.ts app/api/private/cyber-food-beads/route.ts
git commit -m "Add Cyber Food Beads server storage"
```

## Task 3: Customization UI and Image Textures

**Files:**
- Modify: `components/CyberFoodBeads.tsx`
- Modify: `app/globals.css`
- Modify: `tests/projects-game-ui.test.mjs`

- [ ] **Step 1: Write failing source tests**

Extend `tests/projects-game-ui.test.mjs`:

```js
test("Cyber Food Beads supports server-customized foods and uploads", () => {
  assert.match(cyberFoodSource, /PROJECT_VERSION = "0\.2\.0"/);
  assert.match(cyberFoodSource, /PROJECT_UPDATED = "June 12, 2026"/);
  assert.match(cyberFoodSource, /fetch\("\/api\/cyber-food-beads"\)/);
  assert.match(cyberFoodSource, /fetch\("\/api\/private\/cyber-food-beads"/);
  assert.match(cyberFoodSource, /Customize Foods/);
  assert.match(cyberFoodSource, /Save Foods/);
  assert.match(cyberFoodSource, /Reset to Defaults/);
  assert.match(cyberFoodSource, /canvas\.width = 256/);
  assert.match(cyberFoodSource, /canvas\.height = 256/);
  assert.match(cyberFoodSource, /\.toBlob\(/);
  assert.match(cyberFoodSource, /imageDataUrl/);
});
```

- [ ] **Step 2: Run red test**

Run:

```bash
npm test -- tests/projects-game-ui.test.mjs
```

Expected: FAIL because the component still lacks customization.

- [ ] **Step 3: Implement component behavior**

Update `components/CyberFoodBeads.tsx`:

- Set `PROJECT_VERSION = "0.2.0"` and `PROJECT_UPDATED = "June 12, 2026"`.
- Use a `foods` state initialized from `defaultCyberFoodBeads()`.
- Fetch `/api/cyber-food-beads` on mount and update `foods`.
- Build Three.js bead textures from `foods`.
- If a food has `imageDataUrl`, load it and draw it into a `CanvasTexture`.
- Add `Customize Foods`, `Save Foods`, `Cancel`, and `Reset to Defaults`.
- Add a `processFoodImage(file)` helper that uses a 256 canvas and `toBlob`.
- POST `{ foods: draftFoods }` to `/api/private/cyber-food-beads`.

- [ ] **Step 4: Implement CSS**

Append scoped styles:

- `.cyber-food-customizer`
- `.cyber-food-custom-row`
- `.cyber-food-custom-preview`
- `.cyber-food-custom-actions`
- `.cyber-food-message`

- [ ] **Step 5: Run source tests**

Run:

```bash
npm test -- tests/projects-game-ui.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add components/CyberFoodBeads.tsx app/globals.css tests/projects-game-ui.test.mjs
git commit -m "Add Cyber Food Beads customization UI"
```

## Task 4: Verification and Browser QA

**Files:**
- Modify only if verification reveals a bug.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js build succeeds.

- [ ] **Step 3: Verify rendered flow**

Run local dev server:

```bash
npm run dev
```

Open `http://localhost:3000/projects` and verify:

- defaults render before custom save
- `Customize Foods` opens the editor
- editing a name updates the draft
- uploading an image shows a preview
- saving closes the editor
- the bead texture updates
- refreshing keeps the saved name/image
- stopping the ring shows the saved food name in the result modal

- [ ] **Step 4: Commit QA fixes**

If needed:

```bash
git add components/CyberFoodBeads.tsx app/globals.css tests lib app/api db
git commit -m "Polish Cyber Food Beads custom foods"
```

