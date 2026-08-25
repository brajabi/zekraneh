import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import {
  CREATE_MIGRATIONS_TABLE_SQL,
  DATABASE_MIGRATIONS,
  buildContentSeedStatements,
  type ContentBundle,
} from "@zekraneh/domain";
import { contentBundle } from "../src";

let database: Database | undefined;

function setup(): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(CREATE_MIGRATIONS_TABLE_SQL);
  for (const migration of DATABASE_MIGRATIONS) db.exec(migration.sql);
  return db;
}

function seed(db: Database, bundle: ContentBundle): void {
  db.transaction(() => {
    for (const statement of buildContentSeedStatements(bundle, "now")) {
      db.query(statement.sql).run(...statement.params);
    }
  })();
}

afterEach(() => database?.close());

describe("seed محتوا", () => {
  test("seed مجدد idempotent است و همه ارجاع‌ها معتبر می‌مانند", () => {
    database = setup();
    seed(database, contentBundle);
    seed(database, contentBundle);
    expect(database.query("SELECT COUNT(*) AS count FROM content_items").get()).toEqual({ count: contentBundle.items.length });
    expect(database.query("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  test("نسخه bundled جدید manifest را به‌روز می‌کند", () => {
    database = setup();
    seed(database, contentBundle);
    const updated = { ...structuredClone(contentBundle), contentVersion: 2 } as ContentBundle;
    seed(database, updated);
    expect(database.query("SELECT content_version FROM content_manifest WHERE singleton_key = 1").get()).toEqual({ content_version: 2 });
  });
});
