export const MONEY_ENTRIES_KEY = "ethan-money-entries";
export const CHECKLIST_TASKS_KEY = "ethan-checklist-tasks";
export const CHECKLIST_DATE_KEY = "ethan-checklist-date";
export const CHECKLIST_BONUS_DATES_KEY = "ethan-checklist-bonus-dates";
export const PAGE_DRAFTS_KEY = "ethan-page-drafts";

export const MONEY_PER_COMPLETE = 20;

export const DEFAULT_TASKS = [
  { id: 1, label: "Make my bed", done: false },
  { id: 2, label: "Practice basketball", done: false },
  { id: 3, label: "Finish homework", done: false },
  { id: 4, label: "Read for 20 minutes", done: false },
  { id: 5, label: "Tidy my room", done: false },
];

export function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createMoneyEntry({
  description,
  amount,
  type,
  date = todayKey(),
  now = Date.now(),
}) {
  const numericAmount = typeof amount === "number" ? amount : Number.parseFloat(amount);
  if (!description || !Number.isFinite(numericAmount)) {
    throw new Error("Money entries require a description and numeric amount.");
  }
  if (type !== "income" && type !== "expense") {
    throw new Error("Money entry type must be income or expense.");
  }

  return {
    id: now,
    date,
    description,
    amount: numericAmount,
    type,
  };
}

export function calculateBalance(entries) {
  return entries.reduce(
    (sum, entry) => entry.type === "income" ? sum + entry.amount : sum - entry.amount,
    0,
  );
}

export function awardChecklistBonus({ entries, awardedDates, dateKey, amount }) {
  if (awardedDates.includes(dateKey)) {
    return { entries, awardedDates, awarded: false };
  }

  return {
    entries: [
      ...entries,
      createMoneyEntry({
        description: "Daily checklist bonus",
        amount,
        type: "income",
        date: dateKey,
      }),
    ],
    awardedDates: [...awardedDates, dateKey],
    awarded: true,
  };
}

export function readJsonStorage(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}
