/**
 * pnpm seed — idempotent projection of content/ into SQLite (PLAN §3, CLAUDE §10).
 * - applies pending migrations first
 * - upserts the two fixed accounts (admin + learner); never overwrites an
 *   existing password hash
 * - only files with frontmatter/status "approved" are ingested; drafts are
 *   listed but skipped (gary flips draft → approved after review)
 * Safe to run repeatedly: conflict targets are users.name, grammar_points.code,
 * exercises.uid, sentences.uid.
 */
import bcrypt from "bcryptjs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/lib/db";
import {
  exercises,
  grammarPoints,
  sentences,
  users,
} from "@/drizzle/schema";
import {
  discoverContent,
  loadExercisesFile,
  loadGrammarLesson,
  loadSentencePack,
} from "@/lib/content/load";

migrate(db, { migrationsFolder: "./drizzle/migrations" });

// ---------- accounts ----------

const accounts = [
  {
    name: process.env.SEED_ADMIN_NAME ?? "gary",
    role: "admin" as const,
    password: process.env.SEED_ADMIN_PASSWORD ?? "admin-dev-password",
  },
  {
    name: process.env.SEED_LEARNER_NAME ?? "learner",
    role: "learner" as const,
    password: process.env.SEED_LEARNER_PASSWORD ?? "learner-dev-password",
  },
];

for (const a of accounts) {
  db.insert(users)
    .values({
      name: a.name,
      role: a.role,
      pwHash: bcrypt.hashSync(a.password, 10),
      settingsJson: {},
    })
    .onConflictDoNothing({ target: users.name })
    .run();
}
console.log(`seed: accounts ensured (${accounts.map((a) => a.name).join(", ")})`);

// ---------- content ----------

const files = discoverContent(process.cwd());
const skipped: string[] = [];
let gpCount = 0;
let exCount = 0;
let sentCount = 0;

for (const f of files.grammarMd) {
  const lesson = loadGrammarLesson(f);
  if (lesson.frontmatter.status !== "approved") {
    skipped.push(lesson.file);
    continue;
  }
  db.insert(grammarPoints)
    .values({
      code: lesson.frontmatter.lesson,
      stage: lesson.frontmatter.stage,
      ord: lesson.frontmatter.ord,
      titleZh: lesson.frontmatter.title_zh,
      explainMd: lesson.explainMd,
      pitfallsMd: lesson.pitfallsMd,
      prereqCodes: lesson.frontmatter.prereq,
    })
    .onConflictDoUpdate({
      target: grammarPoints.code,
      set: {
        stage: lesson.frontmatter.stage,
        ord: lesson.frontmatter.ord,
        titleZh: lesson.frontmatter.title_zh,
        explainMd: lesson.explainMd,
        pitfallsMd: lesson.pitfallsMd,
        prereqCodes: lesson.frontmatter.prereq,
      },
    })
    .run();
  gpCount++;
}

const gpIdByCode = new Map(
  db
    .select({ id: grammarPoints.id, code: grammarPoints.code })
    .from(grammarPoints)
    .all()
    .map((r) => [r.code, r.id]),
);

for (const f of files.exercises) {
  const file = loadExercisesFile(f);
  if (file.status !== "approved") {
    skipped.push(`${file.lesson}.exercises.json`);
    continue;
  }
  const gpId = gpIdByCode.get(file.lesson);
  if (gpId === undefined) {
    throw new Error(`seed: ${file.lesson}.exercises.json approved but ${file.lesson}.md is not`);
  }
  for (const ex of file.exercises) {
    const row = {
      uid: ex.uid,
      gpId,
      type: ex.type,
      payloadJson: ex.payload,
      answerJson: ex.answer,
      explainZh: ex.explain_zh,
      difficulty: ex.difficulty,
      source: "content",
    };
    db.insert(exercises)
      .values(row)
      .onConflictDoUpdate({ target: exercises.uid, set: row })
      .run();
    exCount++;
  }
}

for (const f of files.packs) {
  const pack = loadSentencePack(f);
  if (pack.status !== "approved") {
    skipped.push(pack.pack === "daily-300" ? "daily-300.json" : `pack-${pack.pack}.json`);
    continue;
  }
  const packGp = pack.pack === "daily-300" ? [] : [pack.pack];
  for (const s of pack.sentences) {
    const gpCodes = [...new Set([...packGp, ...s.gp_codes])];
    const row = {
      uid: s.uid,
      en: s.en,
      zh: s.zh,
      tokensJson: s.tokens,
      altJson: s.alt,
      gpCodes,
      packId: pack.pack,
      level: s.level,
      // audioPath is filled by pnpm content:tts (deterministic sha1 path)
    };
    db.insert(sentences)
      .values(row)
      .onConflictDoUpdate({ target: sentences.uid, set: row })
      .run();
    sentCount++;
  }
}

if (skipped.length > 0) {
  console.log(`seed: skipped ${skipped.length} draft file(s): ${skipped.join(", ")}`);
}
console.log(
  `seed: OK — ${gpCount} grammar points, ${exCount} exercises, ${sentCount} sentences upserted`,
);
