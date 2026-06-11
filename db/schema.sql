CREATE TABLE IF NOT EXISTS money_entries (
  id TEXT PRIMARY KEY,
  occurred_on DATE NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_tasks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  position INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_completions (
  task_id TEXT NOT NULL REFERENCES checklist_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  done BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, completion_date)
);

CREATE TABLE IF NOT EXISTS checklist_bonus_awards (
  award_date DATE PRIMARY KEY,
  money_entry_id TEXT,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_drafts (
  slug TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cyber_food_beads (
  position INTEGER PRIMARY KEY CHECK (position >= 0 AND position < 12),
  name TEXT NOT NULL,
  image_data_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
