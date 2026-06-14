import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_PLAYHQ_CONFIG,
  readPlayHqConfig,
  sanitizePlayHqConfig,
  writePlayHqConfig,
} from "../lib/playhq-config.mjs";

test("sanitizes PlayHQ updater config from local UI input", () => {
  const config = sanitizePlayHqConfig({
    searchQuery: "  Ethan He playhq bulleen boomers  ",
    profileUrl: "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics",
    teamUrl: "https://www.playhq.com/basketball-victoria/org/bulleen-boomers-basketball-club/a8924dee/edjba-winter-2026/teams/bulleen-u13-boys-19/21d72c62",
  });

  assert.equal(config.searchQuery, "Ethan He playhq bulleen boomers");
  assert.equal(
    config.profileUrl,
    "https://www.playhq.com/public/profile/cc95e1dd-387b-47f3-b4f6-2887d65b7da5/statistics?tenant=basketball-victoria",
  );
  assert.equal(config.teamUrl.includes("playhq.com/basketball-victoria"), true);
});

test("rejects invalid manually supplied PlayHQ URLs", () => {
  assert.throws(
    () => sanitizePlayHqConfig({ profileUrl: "https://example.com/not-playhq" }),
    /Profile URL must be a PlayHQ public profile statistics URL/,
  );
  assert.throws(
    () => sanitizePlayHqConfig({ teamUrl: "https://example.com/team" }),
    /Team URL must be a PlayHQ URL/,
  );
});

test("reads and writes local PlayHQ config with defaults", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "playhq-config-"));
  const configPath = path.join(tempDir, "playhq-updater.json");

  assert.deepEqual(readPlayHqConfig(configPath), DEFAULT_PLAYHQ_CONFIG);

  const saved = writePlayHqConfig(configPath, {
    searchQuery: "Ethan He PlayHQ",
    profileUrl: DEFAULT_PLAYHQ_CONFIG.profileUrl,
    teamUrl: DEFAULT_PLAYHQ_CONFIG.teamUrl,
  });

  assert.equal(saved.searchQuery, "Ethan He PlayHQ");
  assert.deepEqual(readPlayHqConfig(configPath), saved);
});
