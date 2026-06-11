# Cyber Food Beads Custom Foods v0.2 Design

## Goal

Add server-persisted customization for Cyber Food Beads. Ethan should be able to edit all 12 bead food names, upload one image per bead, save the custom set to the server, close the browser, reopen the site, and still see those custom beads on the Projects page.

## Scope

Build version `0.2.0`, updated `June 12, 2026`.

Add:

- A `Customize Foods` button on the Cyber Food Beads project card.
- A customization screen or full-width panel for all 12 beads.
- Editable English food name for each bead.
- Image upload for each bead.
- Automatic image crop/resize/compression before saving.
- Server-side persistence in the existing database.
- Public loading of saved custom foods on `/projects`.
- Fallback to the current 12 default foods when no server configuration exists.

Do not add:

- Multiple food sets.
- User accounts or roles beyond the existing private API/session pattern.
- Object storage such as S3, Vercel Blob, or Cloudinary.
- Manual crop UI.
- More than 12 beads.
- Uncompressed original-image storage.

## Storage Decision

Use the existing Neon/Postgres-backed server storage. Store the final compressed image as a Data URL in the database.

This is acceptable for v0.2 because there are only 12 images, each image is resized to `256x256`, and each processed Data URL is size-limited before it is accepted by the API. This avoids adding another storage provider and keeps deployment simple.

## Image Processing

Image processing happens in the browser before upload:

1. User selects an image file.
2. Client loads it into an `Image` object.
3. Client draws a centered square crop into a `256x256` canvas.
4. Client exports the canvas using `canvas.toBlob("image/webp", quality)` when supported.
5. If WebP export is not supported, the client falls back to JPEG.
6. Client converts the compressed Blob to a Data URL for server persistence.
7. Client rejects images whose processed Data URL is larger than `150KB`.

The server validates:

- exactly 12 bead records
- positions are `0` through `11`
- each name is non-empty and at most 40 characters after trimming
- each `imageDataUrl` is empty or starts with `data:image/`
- each `imageDataUrl` is at most `150KB`

The server never stores original uploaded images.

## Database

Extend the private schema with:

```sql
CREATE TABLE IF NOT EXISTS cyber_food_beads (
  position INTEGER PRIMARY KEY CHECK (position >= 0 AND position < 12),
  name TEXT NOT NULL,
  image_data_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

When this table is empty, the app uses the default `CYBER_FOOD_BEADS` list. Saving writes all 12 rows with upsert semantics.

## API

Add public read API:

- `GET /api/cyber-food-beads`
- Returns `{ foods: [...] }`
- If the database is unavailable or empty, returns the default foods without uploaded images.

Add private write API:

- `GET /api/private/cyber-food-beads`
- Returns current editable server configuration.
- `POST /api/private/cyber-food-beads`
- Accepts `{ foods: [{ position, name, imageDataUrl }] }`
- Validates and saves exactly 12 rows.

The private write API follows the existing `withPrivateStore` pattern. The public read API must not require a private session.

## UI

On the Cyber Food Beads card:

- Add a `Customize Foods` button near `Pan`, `Stop`, `Reset`.
- Opening customization shows a dedicated editing panel below the 3D scene.
- The panel lists 12 rows in bead order.
- Each row contains:
  - bead number
  - text input for food name
  - file input button
  - image preview or fallback marker
  - compact status/error text when needed
- The panel has:
  - `Save Foods`
  - `Cancel`
  - `Reset to Defaults`

After save:

- The panel closes.
- The 3D bead textures update without needing a page reload.
- Future reloads fetch the saved server configuration.

## Rendering

Each bead can render from one of two texture sources:

- Uploaded image Data URL: draw the uploaded image into a circular canvas texture with light shading, then apply it to the sphere.
- No uploaded image: use the existing generated food-icon canvas drawing.

Food names still do not appear on the beads. Food names appear only in the final result modal.

## Architecture

Add or update:

- `lib/cyber-food-beads.mjs`
  - add validation helpers for custom food payloads
  - keep default food list and selection math
- `lib/private-store.mjs`
  - add `cyber_food_beads` schema
  - add methods for listing and saving custom foods
- `app/api/cyber-food-beads/route.ts`
  - public read endpoint
- `app/api/private/cyber-food-beads/route.ts`
  - private editable read/write endpoint
- `components/CyberFoodBeads.tsx`
  - load server foods on mount
  - render custom image textures
  - show customization panel
  - process image uploads
  - save via private endpoint
- `app/globals.css`
  - add scoped customization panel styles
- tests
  - validate custom payload rules
  - validate schema/API source contracts
  - validate UI source contract for customization controls and image processing

## Error Handling

- If public read fails, keep using defaults and keep the game playable.
- If private save fails, keep the panel open and show the error.
- If image processing fails, keep the previous image for that bead and show an error for that row.
- If a processed image is too large, reject it before saving.

## Testing

Add unit/source tests for:

- 12-row validation accepts valid payloads.
- validation rejects missing rows, duplicate positions, empty names, overlong names, invalid Data URLs, and oversized Data URLs.
- schema creation includes `cyber_food_beads`.
- public API source imports defaults and returns a fallback.
- private API source uses `withPrivateStore`.
- component source includes `Customize Foods`, image upload handling, canvas resizing to `256`, `toBlob`, save/cancel/reset controls, and server fetches.

Run:

- `npm test`
- `npm run build`

Browser QA:

- Open `/projects`.
- Verify defaults still render before custom save.
- Open `Customize Foods`.
- Change one food name and upload one image.
- Save.
- Verify the ring updates.
- Refresh page.
- Verify the saved name/image persists.
- Stop after a spin and verify the result modal uses the saved name.
