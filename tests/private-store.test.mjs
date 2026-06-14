import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  EDITABLE_PAGES,
  amountToCents,
  centsToAmount,
  createDraftEntry,
  isChecklistComplete,
  mapMoneyRow,
  updateDraftEntry,
} from "../lib/private-store.mjs";

const privateStoreSource = fs.readFileSync(new URL("../lib/private-store.mjs", import.meta.url), "utf8");
const schemaSource = fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const checklistRouteSource = fs.readFileSync(new URL("../app/api/private/checklist/route.ts", import.meta.url), "utf8");

test("converts money amounts to integer cents for database storage", () => {
  assert.equal(amountToCents("20"), 2000);
  assert.equal(amountToCents(3.5), 350);
  assert.equal(centsToAmount(1299), 12.99);
});

test("maps database money rows back to the private page entry format", () => {
  assert.deepEqual(
    mapMoneyRow({
      id: "entry-1",
      occurred_on: "2026-06-10",
      description: "Daily checklist bonus",
      amount_cents: 2000,
      type: "income",
    }),
    {
      id: "entry-1",
      date: "2026-06-10",
      description: "Daily checklist bonus",
      amount: 20,
      type: "income",
    },
  );
});

test("detects checklist completion only when every task is done", () => {
  assert.equal(isChecklistComplete([]), false);
  assert.equal(isChecklistComplete([{ done: true }, { done: false }]), false);
  assert.equal(isChecklistComplete([{ done: true }, { done: true }]), true);
});

test("page editor excludes gallery drafts", () => {
  assert.deepEqual(EDITABLE_PAGES, ["about", "hobbies", "projects", "blog"]);
});

test("creates and updates structured editor draft entries", () => {
  const entry = createDraftEntry({
    title: "Basketball",
    text: "Training after school",
    image: "data:image/png;base64,abc",
    now: 123,
  });

  assert.deepEqual(entry, {
    id: "123",
    title: "Basketball",
    text: "Training after school",
    image: "data:image/png;base64,abc",
  });

  assert.deepEqual(
    updateDraftEntry([entry], entry.id, { title: "Basketball training", image: "" }),
    [{
      id: "123",
      title: "Basketball training",
      text: "Training after school",
      image: "",
    }],
  );
});

test("private schema includes Cyber Food Beads storage", () => {
  assert.match(privateStoreSource, /CREATE TABLE IF NOT EXISTS cyber_food_beads/);
  assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS cyber_food_beads/);
  assert.match(privateStoreSource, /listCyberFoodBeads/);
  assert.match(privateStoreSource, /saveCyberFoodBeads/);
});

test("private schema includes weekly checklist multiplier storage", () => {
  assert.match(privateStoreSource, /CREATE TABLE IF NOT EXISTS checklist_weekly_multipliers/);
  assert.match(privateStoreSource, /CREATE TABLE IF NOT EXISTS weekly_checklist_tasks/);
  assert.match(privateStoreSource, /CREATE TABLE IF NOT EXISTS weekly_checklist_completions/);
  assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS checklist_weekly_multipliers/);
  assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS weekly_checklist_tasks/);
  assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS weekly_checklist_completions/);
  assert.match(privateStoreSource, /maybeAwardWeeklyIncomeMultiplier/);
  assert.match(privateStoreSource, /WEEKLY_MULTIPLIER_SOURCE/);
  assert.match(privateStoreSource, /DEFAULT_WEEKLY_TASKS/);
  assert.match(privateStoreSource, /setWeeklyChecklistTaskDone/);
  assert.match(privateStoreSource, /addWeeklyChecklistTask/);
  assert.match(privateStoreSource, /removeWeeklyChecklistTask/);
  assert.match(checklistRouteSource, /body\.action === "addWeekly"/);
  assert.match(checklistRouteSource, /body\.action === "removeWeekly"/);
  assert.match(privateStoreSource, /await maybeAwardWeeklyIncomeMultiplier\(date\);/);
  assert.match(privateStoreSource, /await maybeAwardWeeklyIncomeMultiplier\(dateKey\);/);
});
