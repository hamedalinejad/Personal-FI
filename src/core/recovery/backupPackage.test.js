import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checksumBytes,
  hasSqliteHeader,
  validateBackupPackage,
  corruptPackage,
} from "./backupPackage.js";

describe("backupPackage BUG-P0-07/08", () => {
  it("checksum is stable", () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    assert.equal(checksumBytes(a), checksumBytes(a));
  });

  it("rejects empty package", () => {
    const r = validateBackupPackage({});
    assert.equal(r.ok, false);
    assert.equal(r.code, "BACKUP_EMPTY");
  });

  it("rejects bad magic", () => {
    const r = validateBackupPackage({
      magic: "XXXX",
      formatVersion: "1",
      bytes: [1, 2, 3],
      checksum: "0",
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, "BACKUP_MAGIC_MISMATCH");
  });

  it("rejects non-sqlite header", () => {
    const bytes = Array.from({ length: 32 }, (_, i) => i);
    const r = validateBackupPackage({
      magic: "PFIB",
      formatVersion: "1",
      bytes,
      checksum: checksumBytes(new Uint8Array(bytes)),
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, "BACKUP_NOT_SQLITE");
  });

  it("hasSqliteHeader detects magic", () => {
    const header = new TextEncoder().encode("SQLite format 3\u0000");
    const buf = new Uint8Array(32);
    buf.set(header);
    assert.equal(hasSqliteHeader(buf), true);
    assert.equal(hasSqliteHeader(new Uint8Array(8)), false);
  });

  it("checksum mismatch after corrupt", () => {
    const header = new TextEncoder().encode("SQLite format 3\u0000");
    const buf = new Uint8Array(200);
    buf.set(header);
    for (let i = 16; i < 200; i++) buf[i] = i % 256;
    const pkg = {
      magic: "PFIB",
      formatVersion: "1",
      bytes: Array.from(buf),
      checksum: checksumBytes(buf),
    };
    assert.equal(validateBackupPackage(pkg).ok, true);
    const bad = corruptPackage(pkg);
    const r = validateBackupPackage(bad);
    assert.equal(r.ok, false);
    assert.equal(r.code, "BACKUP_CHECKSUM_MISMATCH");
  });
});
