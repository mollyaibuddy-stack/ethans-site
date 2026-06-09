import assert from "node:assert/strict";
import test from "node:test";

import {
  awardChecklistBonus,
  createMoneyEntry,
  todayKey,
} from "../lib/private-data.mjs";

test("awards the daily checklist bonus only once per date", () => {
  const dateKey = "2026-06-09";
  const first = awardChecklistBonus({
    entries: [],
    awardedDates: [],
    dateKey,
    amount: 20,
  });

  assert.equal(first.awarded, true);
  assert.equal(first.entries.length, 1);
  assert.equal(first.entries[0].amount, 20);
  assert.deepEqual(first.awardedDates, [dateKey]);

  const second = awardChecklistBonus({
    entries: first.entries,
    awardedDates: first.awardedDates,
    dateKey,
    amount: 20,
  });

  assert.equal(second.awarded, false);
  assert.equal(second.entries.length, 1);
  assert.deepEqual(second.awardedDates, [dateKey]);
});

test("creates stable money entries with numeric amounts", () => {
  const entry = createMoneyEntry({
    description: "Daily checklist bonus",
    amount: "20",
    type: "income",
    date: "2026-06-09",
    now: 12345,
  });

  assert.deepEqual(entry, {
    id: 12345,
    date: "2026-06-09",
    description: "Daily checklist bonus",
    amount: 20,
    type: "income",
  });
});

test("formats Melbourne dates as yyyy-mm-dd keys", () => {
  const date = new Date("2026-06-08T15:30:00.000Z");

  assert.equal(todayKey(date), "2026-06-09");
});
