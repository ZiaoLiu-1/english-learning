/**
 * Shared DB initialization: migrations + idempotent content/account seed.
 * Uses only runtime deps (drizzle-orm, bcryptjs, zod via content schema) so it
 * runs both from `pnpm seed` (tsx) and from the standalone server at boot
 * (instrumentation.ts) — no drizzle-kit / tsx needed in the runtime image.
 *
 * Idempotent: conflict targets are users.name, grammar_points.code,
 * exercises.uid, sentences.uid. Only status:approved content is ingested.
 */
import bcrypt from "bcryptjs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Db } from "@/lib/db";
import { exercises, grammarPoints, sentences, users } from "@/drizzle/schema";
import {
  discoverContent,
  loadExercisesFile,
  loadGrammarLesson,
  loadSentencePack,
} from "@/lib/content/load";

export function runMigrate(db: Db, migrationsFolder = "./drizzle/migrations"): void {
  migrate(db, { migrationsFolder });
}

export interface SeedResult {
  accounts: string[];
  grammarPoints: number;
  exercises: number;
  sentences: number;
  skipped: string[];
}

export function runSeed(db: Db, contentRoot = process.cwd()): SeedResult {
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

  const files = discoverContent(contentRoot);
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
    const set = {
      stage: lesson.frontmatter.stage,
      ord: lesson.frontmatter.ord,
      titleZh: lesson.frontmatter.title_zh,
      explainMd: lesson.explainMd,
      pitfallsMd: lesson.pitfallsMd,
      prereqCodes: lesson.frontmatter.prereq,
    };
    db.insert(grammarPoints)
      .values({ code: lesson.frontmatter.lesson, ...set })
      .onConflictDoUpdate({ target: grammarPoints.code, set })
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
      db.insert(exercises).values(row).onConflictDoUpdate({ target: exercises.uid, set: row }).run();
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
      const row = {
        uid: s.uid,
        en: s.en,
        zh: s.zh,
        tokensJson: s.tokens,
        altJson: s.alt,
        gpCodes: [...new Set([...packGp, ...s.gp_codes])],
        packId: pack.pack,
        level: s.level,
        // audioPath is filled by pnpm content:tts (deterministic sha1 path)
      };
      db.insert(sentences).values(row).onConflictDoUpdate({ target: sentences.uid, set: row }).run();
      sentCount++;
    }
  }

  return {
    accounts: accounts.map((a) => a.name),
    grammarPoints: gpCount,
    exercises: exCount,
    sentences: sentCount,
    skipped,
  };
}
