/**
 * pnpm content:validate — quality gate for everything under content/.
 * Structural zod validation + cross-field checks + filename pairing.
 * Errors exit 1; warnings are printed but pass.
 */
import path from "node:path";
import {
  ContentError,
  discoverContent,
  loadExercisesFile,
  loadGrammarLesson,
  loadSentencePack,
} from "@/lib/content/load";
import { checkExercise, checkSentence, type ContentIssue } from "@/lib/content/schema";

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

function pushIssues(issues: ContentIssue[]) {
  for (const i of issues) errors.push(`${i.file} [${i.ref}]: ${i.message}`);
}

// TODO(M0 task: engines): replace with lib/tokenize.ts normalize once it lands.
function roughNormalize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[.,!?;:"“”()—…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cjkCount(s: string): number {
  return (s.match(/[一-鿿]/g) ?? []).length;
}

const files = discoverContent(root);
const seenUids = new Map<string, string>(); // uid -> file
const lessonsWithMd = new Set<string>();
const lessonsWithExercises = new Set<string>();
const lessonsWithPack = new Set<string>();

function claimUid(uid: string, file: string) {
  const prev = seenUids.get(uid);
  if (prev) errors.push(`${file} [${uid}]: uid already used in ${prev}`);
  else seenUids.set(uid, file);
}

let exerciseCount = 0;
let sentenceCount = 0;

for (const f of files.grammarMd) {
  const rel = path.basename(f);
  try {
    const lesson = loadGrammarLesson(f);
    lessonsWithMd.add(lesson.frontmatter.lesson);
    const n = cjkCount(lesson.explainMd);
    if (n > 600) {
      errors.push(`${rel} [讲解]: ${n} CJK chars — hard limit 600 (contract says ≤500)`);
    } else if (n > 500) {
      warnings.push(`${rel} [讲解]: ${n} CJK chars — contract says ≤500, trim it`);
    }
  } catch (e) {
    errors.push(e instanceof ContentError ? e.message : `${rel}: ${String(e)}`);
  }
}

for (const f of files.exercises) {
  const rel = path.basename(f);
  try {
    const file = loadExercisesFile(f);
    lessonsWithExercises.add(file.lesson);
    exerciseCount += file.exercises.length;
    if (file.exercises.length < 18) {
      warnings.push(`${rel}: only ${file.exercises.length} exercises (plan: 25, floor: 18)`);
    }
    for (const ex of file.exercises) {
      claimUid(ex.uid, rel);
      if (!ex.uid.startsWith(`${file.lesson}-`)) {
        errors.push(`${rel} [${ex.uid}]: uid must start with "${file.lesson}-"`);
      }
      pushIssues(checkExercise(ex, rel));
    }
  } catch (e) {
    errors.push(e instanceof ContentError ? e.message : `${rel}: ${String(e)}`);
  }
}

for (const f of files.packs) {
  const rel = path.basename(f);
  try {
    const pack = loadSentencePack(f);
    if (pack.pack !== "daily-300") lessonsWithPack.add(pack.pack);
    sentenceCount += pack.sentences.length;
    const uidPrefix = pack.pack === "daily-300" ? "daily-" : `${pack.pack}-`;
    for (const s of pack.sentences) {
      claimUid(s.uid, rel);
      if (!s.uid.startsWith(uidPrefix)) {
        errors.push(`${rel} [${s.uid}]: uid must start with "${uidPrefix}"`);
      }
      pushIssues(checkSentence(s, rel));
      if (roughNormalize(s.tokens.join(" ")) !== roughNormalize(s.en)) {
        errors.push(`${rel} [${s.uid}]: tokens do not reproduce "en" after normalization`);
      }
    }
  } catch (e) {
    errors.push(e instanceof ContentError ? e.message : `${rel}: ${String(e)}`);
  }
}

for (const code of lessonsWithMd) {
  if (!lessonsWithExercises.has(code)) warnings.push(`${code}: has .md but no exercises file`);
  if (!lessonsWithPack.has(code)) warnings.push(`${code}: has .md but no sentence pack`);
}
for (const code of lessonsWithExercises) {
  if (!lessonsWithMd.has(code)) errors.push(`${code}: exercises file without ${code}.md`);
}
for (const code of lessonsWithPack) {
  if (!lessonsWithMd.has(code)) errors.push(`pack-${code}: sentence pack without ${code}.md`);
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(
  `content:validate ${errors.length === 0 ? "OK" : "FAILED"} — ` +
    `${lessonsWithMd.size} lessons, ${exerciseCount} exercises, ${sentenceCount} sentences, ` +
    `${warnings.length} warnings, ${errors.length} errors`,
);
process.exit(errors.length === 0 ? 0 : 1);
