import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

/** Detect gaps: after sorting by from, each step must continue from previous to */
export function validateMigrationChain(migrations) {
  const sorted = [...migrations].sort((a, b) => a.from - b.from || a.to - b.to);
  if (!sorted.length) return sorted;
  let expected = sorted[0].from;
  for (const m of sorted) {
    if (m.from !== expected) {
      throw new Error(`MIGRATION_CHAIN_GAP:expected_from=${expected},got=${m.from},id=${m.id}`);
    }
    if (m.to <= m.from) {
      throw new Error(`MIGRATION_INVALID_RANGE:${m.id}`);
    }
    expected = m.to;
  }
  return sorted;
}

export async function runMigrations({ dataDir, migrations }) {
  const chain = validateMigrationChain(migrations);
  const db = openDb(dataDir);
  const row = db.prepare("SELECT version FROM schema_version WHERE id = 1").get();
  let version = row ? row.version : 0;
  const applied = [];

  // Acquire simple lock via IMMEDIATE on version row
  try {
    db.exec("BEGIN IMMEDIATE");
    const locked = db.prepare("SELECT version FROM schema_version WHERE id = 1").get();
    version = locked ? locked.version : 0;

    for (const m of chain) {
      if (m.from !== version) {
        // later migrations wait; if from > version and no match, gap relative to current
        if (m.from > version) {
          // skip until we catch up — but if nothing applies and chain has higher from, error
          continue;
        }
        continue;
      }

      const existing = db.prepare("SELECT id, checksum FROM schema_migrations WHERE id = ?").get(m.id);
      const sum = checksumOf(m);
      if (existing) {
        if (existing.checksum !== sum) {
          db.exec("ROLLBACK");
          db.close();
          throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${m.id}`);
        }
        version = m.to;
        db.prepare(`UPDATE schema_version SET version = ? WHERE id = 1`).run(version);
        continue;
      }

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
      version = m.to;
      applied.push({ id: m.id, from: m.from, to: m.to, success: true, checksum: sum });
    }

    // If registry has migrations starting above current with no path, fail
    const pending = chain.filter((m) => m.from >= version && !applied.find((a) => a.id === m.id));
    const stuck = chain.find((m) => m.from > version && !chain.some((x) => x.from === version));
    if (stuck && version < stuck.from && !chain.some((m) => m.from === version)) {
      db.exec("ROLLBACK");
      db.close();
      throw new Error(`MIGRATION_CHAIN_GAP:at_version=${version},next=${stuck.from}`);
    }

    db.exec("COMMIT");
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    db.close();
    throw e;
  }

  db.close();
  return { version, applied };
}

/** Bootstrap: apply schema.sql as migration 0→1 if empty */
export async function bootstrapDatabase(dataDir) {
  const schemaPath = join(process.cwd(), "docs/core/db/schema.sql");
  const alt = join(__dirname, "../../../docs/core/db/schema.sql");
  const path = existsSync(schemaPath) ? schemaPath : alt;
  const sql = readFileSync(path, "utf8");
  const prepared = sql
    .split("\n")
    .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
    .join("\n");

  return runMigrations({
    dataDir,
    migrations: [
      {
        id: "m000_canonical_schema",
        from: 0,
        to: 1,
        sql: prepared,
      },
    ],
  });
}
