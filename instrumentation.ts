/**
 * Runs once when the server process starts (Next instrumentation). In the
 * standalone container there is no separate migrate/seed step, so we bring the
 * mounted SQLite volume up to date here: apply migrations, then idempotently
 * seed accounts + approved content. No-op-cheap on every boot.
 *
 * Only runs on the Node.js runtime; skipped on edge and during build.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.SKIP_DB_INIT === "1") return;

  const { db } = await import("@/lib/db");
  const { runMigrate, runSeed } = await import("@/lib/db-init");

  runMigrate(db);
  const r = runSeed(db);
  console.log(
    `[db-init] migrated + seeded: ${r.grammarPoints} lessons, ${r.exercises} exercises, ` +
      `${r.sentences} sentences; accounts: ${r.accounts.join(", ")}`,
  );
}
