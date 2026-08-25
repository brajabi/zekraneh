export interface DatabaseMigration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

export const CREATE_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);`;

export const DATABASE_MIGRATIONS: readonly DatabaseMigration[] = [
  {
    version: 1,
    name: "initial_content_sessions_and_settings",
    sql: `
CREATE TABLE IF NOT EXISTS content_manifest (
  singleton_key INTEGER PRIMARY KEY NOT NULL DEFAULT 1 CHECK (singleton_key = 1),
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  content_version INTEGER NOT NULL CHECK (content_version > 0),
  seeded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_sources (
  id TEXT PRIMARY KEY NOT NULL,
  title_fa TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  url TEXT NOT NULL,
  reviewed INTEGER NOT NULL DEFAULT 0 CHECK (reviewed IN (0, 1))
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('surah', 'dua', 'dhikr'))
);

CREATE TABLE IF NOT EXISTS content_item_sources (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES content_sources(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (content_id, source_id)
);

CREATE TABLE IF NOT EXISTS content_texts (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('fa', 'ar')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (content_id, locale)
);

CREATE TABLE IF NOT EXISTS prayer_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  singleton_key INTEGER NOT NULL DEFAULT 1 UNIQUE CHECK (singleton_key = 1),
  prayer_id TEXT NOT NULL,
  prayer_version INTEGER NOT NULL CHECK (prayer_version > 0),
  content_version INTEGER NOT NULL CHECK (content_version > 0),
  mode_id TEXT NOT NULL,
  current_step_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_step_state (
  session_id TEXT NOT NULL REFERENCES prayer_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  resolution TEXT CHECK (resolution IS NULL OR resolution IN ('completed', 'skipped')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, step_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_step_state_session
  ON session_step_state(session_id);`,
  },
  {
    version: 2,
    name: "worship_completion_history",
    sql: `
CREATE TABLE IF NOT EXISTS worship_completions (
  id TEXT PRIMARY KEY NOT NULL,
  worship_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_worship_completions_completed_at
  ON worship_completions(completed_at DESC);`,
  },
];
