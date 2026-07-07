/**
 * Full data model per docs/PLAN.md §6.3.
 *
 * Conventions (ADR-001):
 * - DB names snake_case; TS properties camelCase.
 * - JSON columns: text with { mode: "json" }.
 * - Instant timestamps: integer epoch seconds (default unixepoch()).
 * - Day-granular fields (srs due, plan date): text ISO "YYYY-MM-DD".
 * - Scalar FK columns store row ids; JSON arrays inside content-projected
 *   rows store stable content codes ("L07") so seed stays single-pass idempotent.
 * - `uid` on exercises/sentences is the natural key from content files,
 *   the upsert conflict target for `pnpm seed`.
 * - dict_ecdict lives in a separate data/dict.db (ADR-001), not here.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () => integer("id").primaryKey({ autoIncrement: true });
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull().unique(),
  pwHash: text("pw_hash").notNull(),
  role: text("role", { enum: ["admin", "learner"] }).notNull(),
  settingsJson: text("settings_json", { mode: "json" })
    .notNull()
    .default(sql`'{}'`),
});

export const grammarPoints = sqliteTable("grammar_points", {
  id: id(),
  stage: integer("stage").notNull(), // 1-4
  ord: integer("ord").notNull(),
  code: text("code").notNull().unique(), // L01..L42
  titleZh: text("title_zh").notNull(),
  explainMd: text("explain_md").notNull(),
  pitfallsMd: text("pitfalls_md"),
  prereqCodes: text("prereq_codes", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
});

export const exercises = sqliteTable(
  "exercises",
  {
    id: id(),
    uid: text("uid").notNull().unique(), // natural key from content, e.g. "L01-mcq-01"
    gpId: integer("gp_id").references(() => grammarPoints.id),
    phoneme: text("phoneme"),
    type: text("type", {
      enum: [
        "mcq",
        "cloze",
        "correct",
        "order",
        "translate",
        "minimal_pair",
        "dictation",
      ],
    }).notNull(),
    payloadJson: text("payload_json", { mode: "json" }).notNull(),
    answerJson: text("answer_json", { mode: "json" }).notNull(),
    explainZh: text("explain_zh"),
    difficulty: integer("difficulty").notNull().default(1), // 1-3
    source: text("source"),
  },
  (t) => [index("exercises_gp_idx").on(t.gpId)],
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    responseJson: text("response_json", { mode: "json" }),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    usedHint: integer("used_hint", { mode: "boolean" }).notNull().default(false),
    msUsed: integer("ms_used"),
    createdAt: createdAt(),
  },
  (t) => [
    index("attempts_user_exercise_idx").on(t.userId, t.exerciseId),
    index("attempts_user_time_idx").on(t.userId, t.createdAt),
  ],
);

export const sentences = sqliteTable(
  "sentences",
  {
    id: id(),
    uid: text("uid").notNull().unique(), // e.g. "L01-s-01", "daily-042"
    en: text("en").notNull(),
    zh: text("zh").notNull(),
    tokensJson: text("tokens_json", { mode: "json" }).$type<string[]>().notNull(),
    altJson: text("alt_json", { mode: "json" }), // contraction equivalence groups
    audioPath: text("audio_path"),
    gpCodes: text("gp_codes", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    packId: text("pack_id"), // "L01".."L42" | "daily-300"
    level: integer("level").notNull().default(1),
  },
  (t) => [index("sentences_pack_idx").on(t.packId)],
);

export const materials = sqliteTable("materials", {
  id: id(),
  kind: text("kind", { enum: ["lle", "voa1", "voa_std", "custom"] }).notNull(),
  title: text("title").notNull(),
  level: integer("level").notNull(), // 1-3
  audioPath: text("audio_path").notNull(),
  transcriptJson: text("transcript_json", { mode: "json" }).notNull(), // [{t0,t1,en,zh?}]
  durationS: integer("duration_s"),
  wordCount: integer("word_count"),
  publishedAt: text("published_at"), // ISO date of source article
});

export const dictationLogs = sqliteTable(
  "dictation_logs",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id),
    segIdx: integer("seg_idx").notNull(),
    answer: text("answer").notNull(),
    diffJson: text("diff_json", { mode: "json" }).notNull(),
    score: real("score").notNull(), // equal words / reference words, 0-1
    createdAt: createdAt(),
  },
  (t) => [index("dictation_user_material_idx").on(t.userId, t.materialId)],
);

export const recordings = sqliteTable("recordings", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  refType: text("ref_type", {
    enum: ["sentence", "material_seg", "topic"],
  }).notNull(),
  refId: text("ref_id").notNull(), // "42" | "materialId:segIdx" | topic id
  audioPath: text("audio_path").notNull(),
  transcript: text("transcript"),
  intelligibility: real("intelligibility"), // 0-1 word match rate
  createdAt: createdAt(),
});

export const productions = sqliteTable("productions", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind", { enum: ["sentence", "paragraph", "speaking"] }).notNull(),
  prompt: text("prompt").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "reviewed"] })
    .notNull()
    .default("pending"),
  reviewJson: text("review_json", { mode: "json" }),
  createdAt: createdAt(),
});

export const llmJobs = sqliteTable("llm_jobs", {
  id: id(),
  type: text("type", {
    enum: ["sentence_review", "speaking_review", "weekly_report", "final_report"],
  }).notNull(),
  payloadJson: text("payload_json", { mode: "json" }).notNull(),
  provider: text("provider", { enum: ["api", "file"] }).notNull(),
  status: text("status", { enum: ["pending", "exported", "done"] })
    .notNull()
    .default("pending"),
  resultJson: text("result_json", { mode: "json" }),
  createdAt: createdAt(),
  doneAt: integer("done_at", { mode: "timestamp" }),
});

export const srsCards = sqliteTable(
  "srs_cards",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    refType: text("ref_type", {
      enum: ["gp", "exercise", "sentence", "word", "phoneme"],
    }).notNull(),
    refId: text("ref_id").notNull(), // row id as string, or the word itself
    ef: real("ef").notNull().default(2.5),
    intervalD: integer("interval_d").notNull().default(0),
    due: text("due").notNull(), // ISO date "YYYY-MM-DD"
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
  },
  (t) => [
    uniqueIndex("srs_user_ref_uq").on(t.userId, t.refType, t.refId),
    index("srs_user_due_idx").on(t.userId, t.due),
  ],
);

export const wordbook = sqliteTable(
  "wordbook",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    word: text("word").notNull(),
    sourceRef: text("source_ref"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("wordbook_user_word_uq").on(t.userId, t.word)],
);

export const dailyPlans = sqliteTable(
  "daily_plans",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(), // ISO date "YYYY-MM-DD"
    itemsJson: text("items_json", { mode: "json" }).notNull(),
    doneJson: text("done_json", { mode: "json" }).notNull().default(sql`'[]'`),
    minutesActual: integer("minutes_actual").notNull().default(0),
  },
  (t) => [uniqueIndex("daily_plans_user_date_uq").on(t.userId, t.date)],
);

export const tests = sqliteTable("tests", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind", { enum: ["diagnostic", "weekly", "final"] }).notNull(),
  answersJson: text("answers_json", { mode: "json" }),
  scoresJson: text("scores_json", { mode: "json" }),
  reportMd: text("report_md"),
  createdAt: createdAt(),
});

export const events = sqliteTable(
  "events",
  {
    id: id(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    metaJson: text("meta_json", { mode: "json" }),
    ts: integer("ts", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("events_user_ts_idx").on(t.userId, t.ts)],
);

export type User = typeof users.$inferSelect;
export type GrammarPoint = typeof grammarPoints.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Sentence = typeof sentences.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type DictationLog = typeof dictationLogs.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type Production = typeof productions.$inferSelect;
export type LlmJob = typeof llmJobs.$inferSelect;
export type SrsCard = typeof srsCards.$inferSelect;
export type WordbookEntry = typeof wordbook.$inferSelect;
export type DailyPlan = typeof dailyPlans.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type Event = typeof events.$inferSelect;
