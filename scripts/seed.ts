/**
 * pnpm seed — idempotent projection of content/ into SQLite (PLAN §3, CLAUDE §10).
 * Thin CLI wrapper over lib/db-init (shared with the container-boot path).
 */
import { db } from "@/lib/db";
import { runMigrate, runSeed } from "@/lib/db-init";

runMigrate(db);
const r = runSeed(db);

console.log(`seed: accounts ensured (${r.accounts.join(", ")})`);
if (r.skipped.length > 0) {
  console.log(`seed: skipped ${r.skipped.length} draft file(s): ${r.skipped.join(", ")}`);
}
console.log(
  `seed: OK — ${r.grammarPoints} grammar points, ${r.exercises} exercises, ${r.sentences} sentences upserted`,
);
