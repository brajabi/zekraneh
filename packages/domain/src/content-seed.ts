import type { ContentBundle } from "./types";

export type SqlValue = string | number | null;

export interface SqlStatement {
  readonly sql: string;
  readonly params: readonly SqlValue[];
}

export function buildContentSeedStatements(bundle: ContentBundle, seededAt = new Date().toISOString()): readonly SqlStatement[] {
  const statements: SqlStatement[] = [
    { sql: "DELETE FROM content_item_sources", params: [] },
    { sql: "DELETE FROM content_texts", params: [] },
    { sql: "DELETE FROM content_items", params: [] },
    { sql: "DELETE FROM content_sources", params: [] },
  ];

  for (const source of bundle.sources) {
    statements.push({
      sql: "INSERT INTO content_sources(id, title_fa, title_ar, url, reviewed) VALUES (?, ?, ?, ?, ?)",
      params: [source.id, source.title.fa, source.title.ar, source.url, source.reviewed ? 1 : 0],
    });
  }

  for (const item of bundle.items) {
    statements.push({ sql: "INSERT INTO content_items(id, kind) VALUES (?, ?)", params: [item.id, item.kind] });
    for (const sourceId of item.sourceIds) {
      statements.push({
        sql: "INSERT INTO content_item_sources(content_id, source_id) VALUES (?, ?)",
        params: [item.id, sourceId],
      });
    }
    for (const locale of ["fa", "ar"] as const) {
      statements.push({
        sql: "INSERT INTO content_texts(content_id, locale, title, body) VALUES (?, ?, ?, ?)",
        params: [item.id, locale, item.title[locale], item.text[locale]],
      });
    }
  }

  statements.push({
    sql: `INSERT INTO content_manifest(singleton_key, schema_version, content_version, seeded_at)
          VALUES (1, ?, ?, ?)
          ON CONFLICT(singleton_key) DO UPDATE SET
            schema_version = excluded.schema_version,
            content_version = excluded.content_version,
            seeded_at = excluded.seeded_at`,
    params: [bundle.schemaVersion, bundle.contentVersion, seededAt],
  });
  return statements;
}
