import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_WEEKLY_TASKS,
  awardChecklistBonus,
  calculateWeeklyMultiplierAmount,
  createMoneyEntry,
  isWeeklyChecklistMultiplierUnlocked,
  isWeeklyMultiplierEligible,
  todayKey,
  weekRangeForDateKey,
  WEEKLY_CHECKLIST_TARGET,
  WEEKLY_MULTIPLIER_DESCRIPTION,
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

test("uses Reading Journal as the first weekly checklist item", () => {
  assert.deepEqual(DEFAULT_WEEKLY_TASKS, [
    { id: "reading-journal", label: "Reading Journal", done: false },
  ]);
});

test("uses Monday to Sunday ranges for weekly checklist multipliers", () => {
  assert.deepEqual(weekRangeForDateKey("2026-06-14"), {
    start: "2026-06-08",
    end: "2026-06-14",
  });
  assert.deepEqual(weekRangeForDateKey("2026-06-15"), {
    start: "2026-06-15",
    end: "2026-06-21",
  });
});

test("unlocks the weekly multiplier after five checklist completion dates in one week", () => {
  const completedDates = [
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
  ];

  assert.equal(WEEKLY_CHECKLIST_TARGET, 5);
  assert.equal(isWeeklyChecklistMultiplierUnlocked(completedDates, "2026-06-08"), true);
  assert.equal(isWeeklyChecklistMultiplierUnlocked(completedDates.slice(0, 4), "2026-06-08"), false);
  assert.equal(isWeeklyChecklistMultiplierUnlocked([...completedDates.slice(0, 4), "2026-06-15"], "2026-06-08"), false);
});

test("requires the weekly checklist before the weekly multiplier is eligible", () => {
  const completedDates = [
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
  ];

  assert.equal(
    isWeeklyMultiplierEligible(completedDates, [{ id: "reading-journal", label: "Reading Journal", done: false }], "2026-06-08"),
    false,
  );
  assert.equal(
    isWeeklyMultiplierEligible(completedDates, [{ id: "reading-journal", label: "Reading Journal", done: true }], "2026-06-08"),
    true,
  );
});

test("calculates the weekly multiplier from income only without compounding itself", () => {
  const amount = calculateWeeklyMultiplierAmount([
    { date: "2026-06-08", description: "Daily checklist bonus", amount: 20, type: "income" },
    { date: "2026-06-10", description: "Pocket money", amount: 15, type: "income" },
    { date: "2026-06-11", description: "Snack", amount: 7, type: "expense" },
    { date: "2026-06-12", description: WEEKLY_MULTIPLIER_DESCRIPTION, amount: 35, type: "income" },
    { date: "2026-06-15", description: "Next week", amount: 100, type: "income" },
  ], "2026-06-08");

  assert.equal(amount, 35);
});
