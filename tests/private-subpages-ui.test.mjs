import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const privateSubpages = [
  "../app/private/money/page.tsx",
  "../app/private/checklist/page.tsx",
  "../app/private/editor/page.tsx",
];

test("private child pages require the same-tab private session marker", () => {
  for (const subpage of privateSubpages) {
    const source = fs.readFileSync(new URL(subpage, import.meta.url), "utf8");
    assert.match(source, /import PrivateTabGuard from "@\/components\/PrivateTabGuard";/);
    assert.match(source, /<PrivateTabGuard \/>/);
  }
});
