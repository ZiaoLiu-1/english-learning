/**
 * pnpm content:tts — pre-generate sentence audio via edge-tts into
 * data/audio/tts/{sha1(text)}.mp3 (PLAN §5H SYS-2), then backfill
 * sentences.audio_path. Idempotent: existing files are skipped; a re-run only
 * fills gaps. edge-tts runs as a build/content-time Python CLI, so it never
 * enters the app runtime image.
 *
 * Requires: `python3 -m pip install --user edge-tts`.
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sentences } from "@/drizzle/schema";

const execFileAsync = promisify(execFile);

const VOICE = process.env.TTS_VOICE ?? "en-US-JennyNeural";
const CONCURRENCY = 5;
const OUT_DIR = path.join(process.cwd(), "data", "audio", "tts");
const REL_DIR = "audio/tts";

function sha1(text: string): string {
  return createHash("sha1").update(text).digest("hex");
}

async function generate(text: string, outPath: string): Promise<void> {
  const tmp = `${outPath}.tmp`;
  await execFileAsync("python3", [
    "-m",
    "edge_tts",
    "--voice",
    VOICE,
    "--text",
    text,
    "--write-media",
    tmp,
  ]);
  if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
    throw new Error("edge-tts produced no audio");
  }
  fs.renameSync(tmp, outPath); // atomic: a half-written file never looks "done"
}

interface Job {
  id: number;
  text: string;
  hash: string;
  outPath: string;
  relPath: string;
}

async function run(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows = db
    .select({ id: sentences.id, en: sentences.en, audioPath: sentences.audioPath })
    .from(sentences)
    .all();

  const jobs: Job[] = rows.map((r) => {
    const hash = sha1(r.en);
    return {
      id: r.id,
      text: r.en,
      hash,
      outPath: path.join(OUT_DIR, `${hash}.mp3`),
      relPath: `${REL_DIR}/${hash}.mp3`,
    };
  });

  let generated = 0;
  let skipped = 0;
  let backfilled = 0;
  const failures: { text: string; error: string }[] = [];

  const backfill = (job: Job, current: string | null) => {
    if (current !== job.relPath) {
      db.update(sentences).set({ audioPath: job.relPath }).where(eq(sentences.id, job.id)).run();
      backfilled++;
    }
  };

  const audioPathById = new Map(rows.map((r) => [r.id, r.audioPath]));

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      if (fs.existsSync(job.outPath) && fs.statSync(job.outPath).size > 0) {
        skipped++;
        backfill(job, audioPathById.get(job.id) ?? null);
        continue;
      }
      let ok = false;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          await generate(job.text, job.outPath);
          ok = true;
        } catch (e) {
          if (attempt === 2) failures.push({ text: job.text, error: String(e) });
        }
      }
      if (ok) {
        generated++;
        backfill(job, audioPathById.get(job.id) ?? null);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  for (const f of failures) console.error(`FAIL  "${f.text}": ${f.error}`);
  console.log(
    `content:tts ${failures.length === 0 ? "OK" : "FAILED"} — ` +
      `${generated} generated, ${skipped} cached, ${backfilled} paths backfilled, ` +
      `${failures.length} failed`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

run();
