import {
  DEFAULT_TASKS,
  MONEY_PER_COMPLETE,
  WEEKLY_CHECKLIST_TARGET,
  WEEKLY_MULTIPLIER_DESCRIPTION,
  WEEKLY_MULTIPLIER_SOURCE,
  todayKey as defaultTodayKey,
  weekRangeForDateKey,
} from "./private-data.mjs";
import {
  defaultCyberFoodBeads,
  normalizeCyberFoodPayload,
} from "./cyber-food-beads.mjs";

export const EDITABLE_PAGES = ["about", "hobbies", "projects", "blog"];
export const ENTRY_DRAFT_PAGES = ["hobbies", "projects", "blog"];

export function amountToCents(amount) {
  const numericAmount = typeof amount === "number" ? amount : Number.parseFloat(amount);
  if (!Number.isFinite(numericAmount)) {
    throw new Error("Amount must be numeric.");
  }
  return Math.round(numericAmount * 100);
}

export function centsToAmount(cents) {
  return Number((Number(cents) / 100).toFixed(2));
}

export function mapMoneyRow(row) {
  return {
    id: String(row.id),
    date: typeof row.occurred_on === "string"
      ? row.occurred_on
      : defaultTodayKey(new Date(row.occurred_on)),
    description: row.description,
    amount: centsToAmount(row.amount_cents),
    type: row.type,
  };
}

export function isChecklistComplete(tasks) {
  return tasks.length > 0 && tasks.every(task => task.done);
}

export function createDraftEntry({ title = "", text = "", image = "", now = Date.now() }) {
  return {
    id: String(now),
    title: String(title),
    text: String(text),
    image: String(image || ""),
  };
}

export function updateDraftEntry(entries, id, patch) {
  return entries.map(entry => entry.id === id ? { ...entry, ...patch } : entry);
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task) {
  return {
    id: String(task.id),
    label: task.label,
    done: Boolean(task.done),
  };
}

function validateEditablePage(page) {
  if (!EDITABLE_PAGES.includes(page)) {
    throw new Error("Unknown editable page.");
  }
}

export async function ensurePrivateSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS money_entries (
      id TEXT PRIMARY KEY,
      occurred_on DATE NOT NULL,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_tasks (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      position INTEGER NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_completions (
      task_id TEXT NOT NULL REFERENCES checklist_tasks(id) ON DELETE CASCADE,
      completion_date DATE NOT NULL,
      done BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (task_id, completion_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_bonus_awards (
      award_date DATE PRIMARY KEY,
      money_entry_id TEXT,
      amount_cents INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checklist_weekly_multipliers (
      week_start DATE PRIMARY KEY,
      money_entry_id TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS page_drafts (
      slug TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cyber_food_beads (
      position INTEGER PRIMARY KEY CHECK (position >= 0 AND position < 12),
      name TEXT NOT NULL,
      image_data_url TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function createPrivateStore(sql, options = {}) {
  const todayKey = options.todayKey || defaultTodayKey;

  async function ensureDefaultTasks() {
    const rows = await sql`SELECT COUNT(*)::int AS count FROM checklist_tasks`;
    if (Number(rows[0]?.count || 0) > 0) return;

    for (const [index, task] of DEFAULT_TASKS.entries()) {
      await sql`
        INSERT INTO checklist_tasks (id, label, position, active)
        VALUES (${String(task.id)}, ${task.label}, ${index}, TRUE)
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }

  async function maybeAwardChecklistBonus(dateKey) {
    const tasks = await listChecklistTasks(dateKey);
    if (!isChecklistComplete(tasks)) return false;

    const awardRows = await sql`
      INSERT INTO checklist_bonus_awards (award_date, amount_cents)
      VALUES (${dateKey}, ${amountToCents(MONEY_PER_COMPLETE)})
      ON CONFLICT (award_date) DO NOTHING
      RETURNING award_date
    `;

    if (awardRows.length === 0) return false;

    const entryId = newId();
    await sql`
      INSERT INTO money_entries (id, occurred_on, description, amount_cents, type, source)
      VALUES (
        ${entryId},
        ${dateKey},
        ${"Daily checklist bonus"},
        ${amountToCents(MONEY_PER_COMPLETE)},
        ${"income"},
        ${"checklist"}
      )
    `;
    await sql`
      UPDATE checklist_bonus_awards
      SET money_entry_id = ${entryId}
      WHERE award_date = ${dateKey}
    `;

    return true;
  }

  async function maybeAwardWeeklyIncomeMultiplier(dateKey) {
    const { start: weekStart, end: weekEnd } = weekRangeForDateKey(dateKey);
    const completionRows = await sql`
      SELECT COUNT(DISTINCT award_date)::int AS count
      FROM checklist_bonus_awards
      WHERE award_date >= ${weekStart}
        AND award_date <= ${weekEnd}
    `;

    if (Number(completionRows[0]?.count || 0) < WEEKLY_CHECKLIST_TARGET) {
      return false;
    }

    const incomeRows = await sql`
      SELECT COALESCE(SUM(amount_cents), 0)::int AS income_cents
      FROM money_entries
      WHERE occurred_on >= ${weekStart}
        AND occurred_on <= ${weekEnd}
        AND type = ${"income"}
        AND source <> ${WEEKLY_MULTIPLIER_SOURCE}
    `;
    const incomeCents = Number(incomeRows[0]?.income_cents || 0);
    if (incomeCents <= 0) return false;

    const multiplierRows = await sql`
      SELECT week_start::text, money_entry_id, amount_cents
      FROM checklist_weekly_multipliers
      WHERE week_start = ${weekStart}
      LIMIT 1
    `;
    const existing = multiplierRows[0];

    if (existing?.money_entry_id) {
      if (Number(existing.amount_cents) === incomeCents) return false;

      await sql`
        UPDATE money_entries
        SET amount_cents = ${incomeCents},
            occurred_on = ${dateKey},
            description = ${WEEKLY_MULTIPLIER_DESCRIPTION},
            type = ${"income"},
            source = ${WEEKLY_MULTIPLIER_SOURCE}
        WHERE id = ${existing.money_entry_id}
      `;
      await sql`
        UPDATE checklist_weekly_multipliers
        SET amount_cents = ${incomeCents},
            updated_at = NOW()
        WHERE week_start = ${weekStart}
      `;
      return true;
    }

    const entryId = newId();
    await sql`
      INSERT INTO money_entries (id, occurred_on, description, amount_cents, type, source)
      VALUES (
        ${entryId},
        ${dateKey},
        ${WEEKLY_MULTIPLIER_DESCRIPTION},
        ${incomeCents},
        ${"income"},
        ${WEEKLY_MULTIPLIER_SOURCE}
      )
    `;
    await sql`
      INSERT INTO checklist_weekly_multipliers (week_start, money_entry_id, amount_cents, updated_at)
      VALUES (${weekStart}, ${entryId}, ${incomeCents}, NOW())
      ON CONFLICT (week_start)
      DO UPDATE SET
        money_entry_id = EXCLUDED.money_entry_id,
        amount_cents = EXCLUDED.amount_cents,
        updated_at = NOW()
    `;

    return true;
  }

  async function listChecklistTasks(dateKey) {
    await ensureDefaultTasks();
    const rows = await sql`
      SELECT
        task.id,
        task.label,
        COALESCE(done.done, FALSE) AS done
      FROM checklist_tasks task
      LEFT JOIN checklist_completions done
        ON done.task_id = task.id
       AND done.completion_date = ${dateKey}
      WHERE task.active = TRUE
      ORDER BY task.position ASC, task.created_at ASC
    `;

    return rows.map(normalizeTask);
  }

  async function getChecklistState() {
    const dateKey = todayKey();
    const tasks = await listChecklistTasks(dateKey);
    const awards = await sql`
      SELECT award_date
      FROM checklist_bonus_awards
      WHERE award_date = ${dateKey}
      LIMIT 1
    `;

    return {
      dateKey,
      tasks,
      bonusAdded: awards.length > 0,
    };
  }

  return {
    async ensureSchema() {
      await ensurePrivateSchema(sql);
      await ensureDefaultTasks();
    },

    async listMoneyEntries() {
      const rows = await sql`
        SELECT id, occurred_on::text, description, amount_cents, type
        FROM money_entries
        ORDER BY created_at ASC
      `;
      return rows.map(mapMoneyRow);
    },

    async addMoneyEntry(input) {
      const description = typeof input.description === "string" ? input.description.trim() : "";
      const type = input.type === "expense" ? "expense" : "income";
      const amountCents = amountToCents(input.amount);
      const date = input.date || todayKey();

      if (!description) {
        throw new Error("Description is required.");
      }

      const id = newId();
      const rows = await sql`
        INSERT INTO money_entries (id, occurred_on, description, amount_cents, type, source)
        VALUES (${id}, ${date}, ${description}, ${amountCents}, ${type}, ${"manual"})
        RETURNING id, occurred_on::text, description, amount_cents, type
      `;

      await maybeAwardWeeklyIncomeMultiplier(date);

      return mapMoneyRow(rows[0]);
    },

    async getChecklistState() {
      return getChecklistState();
    },

    async setChecklistTaskDone(id, done) {
      const dateKey = todayKey();
      await sql`
        INSERT INTO checklist_completions (task_id, completion_date, done, updated_at)
        VALUES (${String(id)}, ${dateKey}, ${Boolean(done)}, NOW())
        ON CONFLICT (task_id, completion_date)
        DO UPDATE SET done = EXCLUDED.done, updated_at = NOW()
      `;

      await maybeAwardChecklistBonus(dateKey);
      await maybeAwardWeeklyIncomeMultiplier(dateKey);
      return getChecklistState();
    },

    async addChecklistTask(label) {
      const trimmedLabel = typeof label === "string" ? label.trim() : "";
      if (!trimmedLabel) {
        throw new Error("Task label is required.");
      }

      await ensureDefaultTasks();
      const maxRows = await sql`
        SELECT COALESCE(MAX(position), 0)::int AS max_position
        FROM checklist_tasks
      `;
      await sql`
        INSERT INTO checklist_tasks (id, label, position, active)
        VALUES (${newId()}, ${trimmedLabel}, ${Number(maxRows[0]?.max_position || 0) + 1}, TRUE)
      `;

      return getChecklistState();
    },

    async removeChecklistTask(id) {
      await sql`
        UPDATE checklist_tasks
        SET active = FALSE
        WHERE id = ${String(id)}
      `;
      return getChecklistState();
    },

    async getPageDrafts() {
      const rows = await sql`
        SELECT slug, content
        FROM page_drafts
        ORDER BY slug ASC
      `;

      return Object.fromEntries(rows.map(row => [row.slug, row.content]));
    },

    async savePageDraft(page, content) {
      validateEditablePage(page);
      await sql`
        INSERT INTO page_drafts (slug, content, updated_at)
        VALUES (${page}, ${String(content || "")}, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
      `;

      return this.getPageDrafts();
    },

    async listCyberFoodBeads() {
      const rows = await sql`
        SELECT position, name, image_data_url
        FROM cyber_food_beads
        ORDER BY position ASC
      `;

      if (rows.length !== 12) return defaultCyberFoodBeads();
      return rows.map(row => ({
        position: Number(row.position),
        name: row.name,
        imageDataUrl: row.image_data_url || "",
      }));
    },

    async saveCyberFoodBeads(foods) {
      const normalized = normalizeCyberFoodPayload(foods);
      for (const food of normalized) {
        await sql`
          INSERT INTO cyber_food_beads (position, name, image_data_url, updated_at)
          VALUES (${food.position}, ${food.name}, ${food.imageDataUrl}, NOW())
          ON CONFLICT (position)
          DO UPDATE SET
            name = EXCLUDED.name,
            image_data_url = EXCLUDED.image_data_url,
            updated_at = NOW()
        `;
      }

      return this.listCyberFoodBeads();
    },
  };
}
