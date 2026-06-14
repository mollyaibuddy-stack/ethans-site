import assert from "node:assert/strict";
import test from "node:test";

import { parsePlayerStatsText } from "../lib/playhq-stats.mjs";

test("parses PlayHQ career and current season stats without reading the season year as games", () => {
  const stats = parsePlayerStatsText(`
    Ethan He Statistics Basketball VIC
    Career Bulleen Boomers Basketball Club 154 Games Played 442 Total Points 46 1 Point 198 2 Points - 3 Points 149 Total Fouls
    Season Stats Select season Winter 2026 Summer 2025/26
    EDJBA, Winter 2026 Bulleen Boomers Basketball Club Player 5 Games Played 60 Total Points 2 1 Point 29 2 Points - 3 Points 7 Total Fouls
  `);

  assert.deepEqual(stats.career, {
    games: 154,
    pts: 442,
    onePt: 46,
    twoPt: 198,
    fouls: 149,
  });
  assert.deepEqual(stats.season, {
    games: 5,
    pts: 60,
    onePt: 2,
    twoPt: 29,
    fouls: 7,
  });
});
