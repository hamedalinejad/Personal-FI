/** Phase 13 — Android acceptance matrix (executable checklist) */
export const ANDROID_TEST_MATRIX = Object.freeze([
  { id: "install_upgrade", status: "SPECIFIED" },
  { id: "offline", status: "SPECIFIED" },
  { id: "db_migration", status: "SPECIFIED" },
  { id: "backup_restore", status: "SPECIFIED" },
  { id: "process_kill_during_write", status: "SPECIFIED" },
  { id: "screen_rotation", status: "SPECIFIED" },
  { id: "low_memory_recovery", status: "SPECIFIED" },
  { id: "biometric_lock", status: "SPECIFIED" },
]);
export const ANDROID_RELEASE_LANES = Object.freeze(["internal", "closed", "production"]);
