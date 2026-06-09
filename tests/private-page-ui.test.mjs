import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const privatePageSource = fs.readFileSync(new URL("../app/private/page.tsx", import.meta.url), "utf8");

test("PIN page uses the large button style for Back to home", () => {
  assert.match(
    privatePageSource,
    /<a href="\/" className="back-button pin-home-button">Back to home<\/a>/,
  );
});

test("Private landing page restores an existing authenticated session", () => {
  assert.match(privatePageSource, /fetch\("\/api\/private\/session"\)/);
  assert.match(privatePageSource, /data\?\.authenticated/);
});

test("Private list page includes a Back to home button", () => {
  assert.match(
    privatePageSource,
    /<div className="private-links">[\s\S]*<a href="\/private\/editor" className="card-link">Page Editor<\/a>\s*<\/div>\s*<a href="\/" className="back-button pin-home-button">Back to home<\/a>/,
  );
});
