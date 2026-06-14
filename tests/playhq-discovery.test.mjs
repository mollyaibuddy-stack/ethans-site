import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePlayHqProfileUrl,
  selectPlayHqProfileSearchResult,
  validateEthanProfileText,
} from "../lib/playhq-discovery.mjs";

const ethanProfileUrl = "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria";

test("normalizes direct and Google redirect PlayHQ profile URLs", () => {
  assert.equal(
    normalizePlayHqProfileUrl("https://www.google.com/url?q=https%3A%2F%2Fwww.playhq.com%2Fpublic%2Fprofile%2Fcc95e1dd-387b-47f3-b4f6-2887d65b7da5%2Fstatistics%3Ftenant%3Dbasketball-victoria&sa=U"),
    ethanProfileUrl,
  );
  assert.equal(
    normalizePlayHqProfileUrl("https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics"),
    ethanProfileUrl,
  );
});

test("selects Ethan's PlayHQ profile from search results", () => {
  assert.equal(
    selectPlayHqProfileSearchResult([
      { href: "https://example.com", title: "Wrong result", text: "Not PlayHQ" },
      { href: ethanProfileUrl, title: "Ethan He - Public Profile | PlayHQ", text: "Bulleen Boomers Basketball Club" },
    ]),
    ethanProfileUrl,
  );
});

test("validates profile text belongs to Ethan and Bulleen Boomers", () => {
  assert.equal(validateEthanProfileText("Ethan He Statistics Career Bulleen Boomers Basketball Club"), true);
  assert.equal(validateEthanProfileText("Ethan Hill Basketball Allen University"), false);
});
