import assert from "node:assert/strict";
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
