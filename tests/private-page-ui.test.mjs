import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const privatePageSource = fs.readFileSync(new URL("../app/private/page.tsx", import.meta.url), "utf8");

test("PIN page uses the large button style for Back to home", () => {
  assert.match(
    privatePageSource,
    /<a href="\/" className="back-button">Back to home<\/a>/,
  );
});
