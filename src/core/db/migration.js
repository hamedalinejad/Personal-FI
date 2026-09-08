import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

/**
 * P0-013-style migration: version inside SQLite transaction.
 * schema_migrations(id, checksum, applied_at)
 */
function openDb(dataDir) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "personal-fi.sqlite"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      from_version INTEGER NOT NULL,
      to_version INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 0);
  `);
  return db;
}

function checksumOf(m) {
  const payload = JSON.stringify({ id: m.id, from: m.from, to: m.to, sql: m.sql || "" });
  return createHash("sha256").update(payload).digest("hex");
}

export async function runMigrations({ dataDir, migrations }) {
  const db = openDb(dataDir);
  const row = db.prepare("SELECT version FROM schema_version WHERE id = 1").get();
  let version = row ? row.version : 0;
  const applied = [];

  for (const m of migrations) {
    if (m.from !== version) continue;

    const existing = db.prepare("SELECT id, checksum FROM schema_migrations WHERE id = ?").get(m.id);
    const sum = checksumOf(m);
    if (existing) {
      if (existing.checksum !== sum) {
        db.close();
        throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${m.id}`);
      }
      version = m.to;
      continue;
    }

    try {
      db.exec("BEGIN IMMEDIATE");
      if (typeof m.up === "function") {
        await m.up({ db, exec: (sql) => db.exec(sql) });
      } else if (m.sql) {
        db.exec(m.sql);
      }
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO schema_migrations (id, from_version, to_version, checksum, applied_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(m.id, m.from, m.to, sum, now);
      db.prepare(`UPDATE schema_version SET version = ? WHERE id = 1`).run(m.to);
      db.exec("COMMIT");
      version = m.to;
      applied.push({ id: m.id, from: m.from, to: m.to, success: true, checksum: sum });
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* ignore */
      }
      db.close();
      throw e;
    }
  }

  db.close();
  return { version, applied };
}
