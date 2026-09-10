import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));

function openMigrationDb(dataDir) {
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

function loadCanonicalSchemaSql() {
  const candidates = [
    join(process.cwd(), "docs/core/db/schema.sql"),
    join(__dirname, "../../../docs/core/db/schema.sql"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf8")
        .split("\n")
        .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
        .join("\n");
    }
  }
  throw new Error("SCHEMA_SQL_MISSING");
}

/**
 * B-027: deterministic chain validation
 * - sorted by from
 * - continuous from→to
 * - unique from versions
 */
export function validateMigrationChain(migrations) {
  const sorted = [...migrations].sort((a, b) => a.from - b.from || a.to - b.to);
  if (!sorted.length) return sorted;
  const fromSeen = new Set();
  let expected = sorted[0].from;
  for (const m of sorted) {
    if (fromSeen.has(m.from)) {
      throw new Error(`MIGRATION_DUPLICATE_FROM:${m.from}`);
    }
    fromSeen.add(m.from);
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

/**
 * Apply migrations deterministically:
 * currentVersion → exactly one migration with from===current → apply → advance → repeat
 */
export async function runMigrations({ dataDir, migrations }) {
  const chain = validateMigrationChain(migrations);
  const db = openMigrationDb(dataDir);
  const applied = [];

  try {
    db.exec("BEGIN IMMEDIATE");
    let version = db.prepare("SELECT version FROM schema_version WHERE id = 1").get()?.version ?? 0;

    while (true) {
      const next = chain.filter((m) => m.from === version);
      if (next.length === 0) break;
      if (next.length > 1) {
        throw new Error(`MIGRATION_AMBIGUOUS_FROM:${version}`);
      }
      const m = next[0];
      const sum = checksumOf(m);
      const existing = db.prepare("SELECT id, checksum FROM schema_migrations WHERE id = ?").get(m.id);
      if (existing) {
        if (existing.checksum !== sum) {
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
      } else {
        throw new Error(`MIGRATION_NO_BODY:${m.id}`);
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

    // Reject if any migration starts above current with no path
    const orphan = chain.find((m) => m.from > version);
    if (orphan) {
      throw new Error(`MIGRATION_CHAIN_GAP:at_version=${version},next=${orphan.from}`);
    }

    db.exec("COMMIT");
    db.close();
    return { version, applied };
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    try {
      db.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export function defaultMigrationChain() {
  return [
    {
      id: "m000_canonical_schema",
      from: 0,
      to: 1,
      sql: loadCanonicalSchemaSql(),
    },
  ];
}

/** Bootstrap: apply schema.sql as migration 0→1 */
export async function bootstrapDatabase(dataDir) {
  return runMigrations({ dataDir, migrations: defaultMigrationChain() });
}

/**
 * Sync schema ensure for openDb (B-026).
 * Applies default chain if schema_version is behind or fin_operations missing.
 */
export function ensureSchemaSync(db) {
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

  let version = db.prepare("SELECT version FROM schema_version WHERE id = 1").get()?.version ?? 0;
  const hasOps = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fin_operations'")
    .get();

  if (version === 0 || !hasOps) {
    const chain = defaultMigrationChain();
    for (const m of chain) {
      if (m.from !== version) continue;
      const sum = checksumOf(m);
      const existing = db.prepare("SELECT id, checksum FROM schema_migrations WHERE id = ?").get(m.id);
      if (existing) {
        if (existing.checksum !== sum) throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${m.id}`);
        version = m.to;
        db.prepare(`UPDATE schema_version SET version = ? WHERE id = 1`).run(version);
        continue;
      }
      if (m.sql) db.exec(m.sql);
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO schema_migrations (id, from_version, to_version, checksum, applied_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(m.id, m.from, m.to, sum, now);
      db.prepare(`UPDATE schema_version SET version = ? WHERE id = 1`).run(m.to);
      version = m.to;
    }
  }

  const finalHasOps = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fin_operations'")
    .get();
  if (!finalHasOps) {
    throw new Error("SCHEMA_BOOTSTRAP_FAILED:fin_operations");
  }
  return version;
}
