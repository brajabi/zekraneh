import {
  CREATE_MIGRATIONS_TABLE_SQL,
  DATABASE_MIGRATIONS,
  normalizeAppSettings,
  assertValidContentBundle,
  buildContentSeedStatements,
  type AppSettings,
  type ContentBundle,
  type PrayerSession,
  type SessionStepState,
  type WorshipCompletion,
} from "@zekraneh/domain";
import * as SQLite from "expo-sqlite";

type SessionRow = Omit<PrayerSession, "stepStates" | "prayerId" | "prayerVersion" | "contentVersion" | "modeId" | "currentStepId" | "startedAt" | "updatedAt"> & {
  prayer_id: string;
  prayer_version: number;
  content_version: number;
  mode_id: string;
  current_step_id: string;
  started_at: string;
  updated_at: string;
};

interface StepRow {
  step_id: string;
  count: number;
  resolution: "completed" | "skipped" | null;
  updated_at: string;
}

interface CompletionRow {
  id: string;
  worship_id: string;
  mode_id: string;
  completed_at: string;
}

export class ZekranehDatabase {
  private constructor(private readonly db: SQLite.SQLiteDatabase) {}

  static async open(bundle: ContentBundle): Promise<ZekranehDatabase> {
    assertValidContentBundle(bundle);
    const sqlite = await SQLite.openDatabaseAsync("zekraneh.db");
    await sqlite.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    const database = new ZekranehDatabase(sqlite);
    await database.migrate();
    await database.seedIfNeeded(bundle);
    return database;
  }

  private async migrate(): Promise<void> {
    await this.db.execAsync(CREATE_MIGRATIONS_TABLE_SQL);
    for (const migration of DATABASE_MIGRATIONS) {
      const applied = await this.db.getFirstAsync<{ version: number }>(
        "SELECT version FROM schema_migrations WHERE version = ?",
        migration.version,
      );
      if (applied) continue;
      await this.db.withTransactionAsync(async () => {
        await this.db.execAsync(migration.sql);
        await this.db.runAsync(
          "INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)",
          migration.version,
          migration.name,
          new Date().toISOString(),
        );
      });
    }
  }

  private async seedIfNeeded(bundle: ContentBundle): Promise<void> {
    const manifest = await this.db.getFirstAsync<{ content_version: number }>(
      "SELECT content_version FROM content_manifest WHERE singleton_key = 1",
    );
    if (manifest?.content_version === bundle.contentVersion) return;
    await this.db.withTransactionAsync(async () => {
      for (const statement of buildContentSeedStatements(bundle)) {
        await this.db.runAsync(statement.sql, [...statement.params]);
      }
    });
  }

  async loadActiveSession(): Promise<PrayerSession | null> {
    const row = await this.db.getFirstAsync<SessionRow>("SELECT * FROM prayer_sessions WHERE singleton_key = 1");
    if (!row) return null;
    const stateRows = await this.db.getAllAsync<StepRow>(
      "SELECT step_id, count, resolution, updated_at FROM session_step_state WHERE session_id = ?",
      row.id,
    );
    const stepStates = Object.fromEntries(
      stateRows.map((state): [string, SessionStepState] => [
        state.step_id,
        {
          stepId: state.step_id,
          count: state.count,
          resolution: state.resolution,
          updatedAt: state.updated_at,
        },
      ]),
    );
    return {
      id: row.id,
      prayerId: row.prayer_id,
      prayerVersion: row.prayer_version,
      contentVersion: row.content_version,
      modeId: row.mode_id,
      currentStepId: row.current_step_id,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      stepStates,
    };
  }

  async replaceActiveSession(session: PrayerSession): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync("DELETE FROM prayer_sessions");
      await this.insertSession(session);
    });
  }

  async saveSession(session: PrayerSession): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE prayer_sessions SET current_step_id = ?, updated_at = ? WHERE id = ?`,
        session.currentStepId,
        session.updatedAt,
        session.id,
      );
      for (const state of Object.values(session.stepStates)) {
        await this.db.runAsync(
          `INSERT INTO session_step_state(session_id, step_id, count, resolution, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(session_id, step_id) DO UPDATE SET
             count = excluded.count,
             resolution = excluded.resolution,
             updated_at = excluded.updated_at`,
          session.id,
          state.stepId,
          state.count,
          state.resolution,
          state.updatedAt,
        );
      }
    });
  }

  private async insertSession(session: PrayerSession): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO prayer_sessions(
        id, singleton_key, prayer_id, prayer_version, content_version, mode_id,
        current_step_id, started_at, updated_at
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      session.prayerId,
      session.prayerVersion,
      session.contentVersion,
      session.modeId,
      session.currentStepId,
      session.startedAt,
      session.updatedAt,
    );
  }

  async clearActiveSession(): Promise<void> {
    await this.db.runAsync("DELETE FROM prayer_sessions");
  }

  async loadCompletions(): Promise<readonly WorshipCompletion[]> {
    const rows = await this.db.getAllAsync<CompletionRow>(
      "SELECT id, worship_id, mode_id, completed_at FROM worship_completions ORDER BY completed_at DESC",
    );
    return rows.map((row) => ({
      id: row.id,
      worshipId: row.worship_id,
      modeId: row.mode_id,
      completedAt: row.completed_at,
    }));
  }

  async completeSession(completion: WorshipCompletion): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        "INSERT INTO worship_completions(id, worship_id, mode_id, completed_at) VALUES (?, ?, ?, ?)",
        completion.id,
        completion.worshipId,
        completion.modeId,
        completion.completedAt,
      );
      await this.db.runAsync("DELETE FROM prayer_sessions");
    });
  }

  async loadSettings(): Promise<AppSettings> {
    const rows = await this.db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM app_settings");
    const stored = Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value) as unknown]));
    return normalizeAppSettings(stored);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const now = new Date().toISOString();
    await this.db.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(settings)) {
        await this.db.runAsync(
          `INSERT INTO app_settings(key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          key,
          JSON.stringify(value),
          now,
        );
      }
    });
  }
}

export class SerialWriteQueue {
  private tail: Promise<void> = Promise.resolve();

  enqueue(write: () => Promise<void>): void {
    this.tail = this.tail.then(write, write);
  }

  async flush(): Promise<void> {
    await this.tail;
  }
}
