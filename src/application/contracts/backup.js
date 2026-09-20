/**
 * Platform-neutral backup package contract (R-M23).
 * Browser and Node hosts must satisfy this shape.
 * Re-exports validation from core recovery.
 */

export {
  createBackupPackage,
  validateBackupPackage,
  restoreBackupPackage,
  corruptPackage,
  checksumBytes,
  hasSqliteHeader,
} from "../../core/recovery/backupPackage.js";

/**
 * @typedef {object} BackupPackage
 * @property {number[]} bytes
 * @property {string} checksum
 * @property {string} formatVersion
 * @property {string} [schemaVersion]
 * @property {string|null} [bookId]
 * @property {string|null} [label]
 * @property {string} [createdAt]
 * @property {string} [magic]
 */
