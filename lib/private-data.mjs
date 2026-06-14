export const MONEY_ENTRIES_KEY = "ethan-money-entries";
export const CHECKLIST_TASKS_KEY = "ethan-checklist-tasks";
export const CHECKLIST_DATE_KEY = "ethan-checklist-date";
export const CHECKLIST_BONUS_DATES_KEY = "ethan-checklist-bonus-dates";
export const PAGE_DRAFTS_KEY = "ethan-page-drafts";

export const MONEY_PER_COMPLETE = 20;
export const WEEKLY_CHECKLIST_TARGET = 5;
export const WEEKLY_MULTIPLIER_SOURCE = "weekly_checklist_multiplier";
export const WEEKLY_MULTIPLIER_DESCRIPTION = "Weekly checklist income match";

export const DEFAULT_TASKS = [
  { id: 1, label: "Make my bed", done: false },
  { id: 2, label: "Practice basketball", done: false },
  { id: 3, label: "Finish homework", done: false },
  { id: 4, label: "Read for 20 minutes", done: false },
  { id: 5, label: "Tidy my room", done: false },
];

export const DEFAULT_WEEKLY_TASKS = [
  { id: "reading-journal", label: "Reading Journal", done: false },
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

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function weekRangeForDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const start = addDaysToDateKey(dateKey, -mondayOffset);

  return {
    start,
    end: addDaysToDateKey(start, 6),
  };
}

export function isDateKeyInWeek(dateKey, weekStart) {
  const { end } = weekRangeForDateKey(weekStart);
  return dateKey >= weekStart && dateKey <= end;
}

export function isWeeklyChecklistMultiplierUnlocked(completedDates, weekStart) {
  const uniqueDates = new Set(completedDates.filter(dateKey => isDateKeyInWeek(dateKey, weekStart)));
  return uniqueDates.size >= WEEKLY_CHECKLIST_TARGET;
}

export function isWeeklyMultiplierEligible(completedDates, weeklyTasks, weekStart) {
  return isWeeklyChecklistMultiplierUnlocked(completedDates, weekStart)
    && weeklyTasks.length > 0
    && weeklyTasks.every(task => task.done);
}

export function isWeeklyMultiplierEntry(entry) {
  return entry.source === WEEKLY_MULTIPLIER_SOURCE
    || entry.description === WEEKLY_MULTIPLIER_DESCRIPTION;
}

export function calculateWeeklyMultiplierAmount(entries, weekStart) {
  return entries.reduce((sum, entry) => {
    if (entry.type !== "income" || !isDateKeyInWeek(entry.date, weekStart) || isWeeklyMultiplierEntry(entry)) {
      return sum;
    }

    return sum + Number(entry.amount || 0);
  }, 0);
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
