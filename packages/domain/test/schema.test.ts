import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { normalizeAppSettings } from "../src/settings";
import { CREATE_MIGRATIONS_TABLE_SQL, DATABASE_MIGRATIONS } from "../src/schema";

let database: Database | undefined;

function migrate(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(CREATE_MIGRATIONS_TABLE_SQL);
  for (const migration of DATABASE_MIGRATIONS) {
    const exists = db.query("SELECT version FROM schema_migrations WHERE version = ?").get(migration.version);
    if (exists) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      db.query("INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.name, "2026-01-01T00:00:00.000Z");
    })();
  }
  return db;
}

afterEach(() => database?.close());

describe("migrationهای SQLite", () => {
  test("همه جدول‌ها را idempotent می‌سازد و foreign key فعال است", () => {
    database = migrate();
    const tableNames = database.query("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => (row as { name: string }).name);
    expect(tableNames).toEqual(expect.arrayContaining([
      "schema_migrations", "content_manifest", "content_sources", "content_items", "content_texts", "prayer_sessions", "session_step_state", "app_settings",
    ]));
    expect((database.query("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys).toBe(1);
    for (const migration of DATABASE_MIGRATIONS) database.exec(migration.sql);
    expect(database.query("SELECT COUNT(*) AS count FROM schema_migrations").get()).toEqual({ count: 2 });
  });

  test("فقط یک جلسه فعال می‌پذیرد و حذف آن stateها را cascade می‌کند", () => {
    database = migrate();
    const insert = database.query("INSERT INTO prayer_sessions(id, prayer_id, prayer_version, content_version, mode_id, current_step_id, started_at, updated_at) VALUES (?, 'night-prayer', 1, 1, 'witr-only', 'witr-intention', ?, ?)");
    insert.run("one", "now", "now");
    expect(() => insert.run("two", "now", "now")).toThrow();
    database.query("INSERT INTO session_step_state(session_id, step_id, count, resolution, updated_at) VALUES ('one', 'witr-intention', 0, 'completed', 'now')").run();
    database.query("DELETE FROM prayer_sessions WHERE id = 'one'").run();
    expect(database.query("SELECT COUNT(*) AS count FROM session_step_state").get()).toEqual({ count: 0 });
  });

  test("ارجاع محتوای بدون منبع معتبر را رد می‌کند", () => {
    database = migrate();
    database.query("INSERT INTO content_items(id, kind) VALUES ('x', 'dua')").run();
    expect(() => database!.query("INSERT INTO content_item_sources(content_id, source_id) VALUES ('x', 'missing')").run()).toThrow();
  });

  test("تنظیم ترجمه را در جدول key/value ذخیره و بازیابی می‌کند", () => {
    database = migrate();
    database.query("INSERT INTO app_settings(key, value, updated_at) VALUES (?, ?, ?)")
      .run("showPersianTranslation", JSON.stringify(true), "2026-01-01T00:00:00.000Z");
    const rows = database.query("SELECT key, value FROM app_settings").all() as Array<{ key: string; value: string }>;
    const stored = Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value) as unknown]));
    expect(normalizeAppSettings(stored).showPersianTranslation).toBeTrue();
  });

  test("پایان عبادت را مستقل از جلسهٔ فعال نگه می‌دارد", () => {
    database = migrate();
    database.query("INSERT INTO worship_completions(id, worship_id, mode_id, completed_at) VALUES (?, ?, ?, ?)")
      .run("done-1", "ziyarat-ashura", "complete", "2026-08-25T20:00:00.000Z");
    expect(database.query("SELECT worship_id, mode_id FROM worship_completions WHERE id = 'done-1'").get()).toEqual({
      worship_id: "ziyarat-ashura",
      mode_id: "complete",
    });
  });
});
