/**
 * Content file loaders — shared by scripts/validate_content.ts, scripts/seed.ts
 * and (later) the admin import API. Loaders throw ContentError with the file
 * path in the message; callers decide whether to aggregate or abort.
 */
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { parseFrontmatter } from "@/lib/content/frontmatter";
import {
  exercisesFile,
  grammarFrontmatter,
  sentencePack,
  type ExercisesFile,
  type GrammarFrontmatter,
  type SentencePack,
} from "@/lib/content/schema";

export class ContentError extends Error {}

export interface GrammarLesson {
  file: string;
  frontmatter: GrammarFrontmatter;
  explainMd: string;
  pitfallsMd: string;
}

function fmtZodError(file: string, error: z.ZodError): ContentError {
  const lines = error.issues
    .slice(0, 10)
    .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`);
  return new ContentError(`${file}: schema validation failed\n${lines.join("\n")}`);
}

const EXPLAIN_HEADING = "## 讲解";
const PITFALLS_HEADING = "## 常见错误";

export function loadGrammarLesson(filePath: string): GrammarLesson {
  const rel = path.basename(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(raw, rel);
  const parsed = grammarFrontmatter.safeParse(frontmatter);
  if (!parsed.success) throw fmtZodError(rel, parsed.error);

  const expectedName = `${parsed.data.lesson}.md`;
  if (rel !== expectedName) {
    throw new ContentError(`${rel}: frontmatter lesson=${parsed.data.lesson} does not match filename`);
  }

  const explainIdx = body.indexOf(EXPLAIN_HEADING);
  const pitfallsIdx = body.indexOf(PITFALLS_HEADING);
  if (explainIdx === -1 || pitfallsIdx === -1 || pitfallsIdx < explainIdx) {
    throw new ContentError(
      `${rel}: body must contain "${EXPLAIN_HEADING}" followed by "${PITFALLS_HEADING}"`,
    );
  }
  const explainMd = body.slice(explainIdx + EXPLAIN_HEADING.length, pitfallsIdx).trim();
  const pitfallsMd = body.slice(pitfallsIdx + PITFALLS_HEADING.length).trim();
  if (explainMd.length === 0) throw new ContentError(`${rel}: "${EXPLAIN_HEADING}" section is empty`);
  if (pitfallsMd.length === 0) throw new ContentError(`${rel}: "${PITFALLS_HEADING}" section is empty`);

  return { file: rel, frontmatter: parsed.data, explainMd, pitfallsMd };
}

export function loadExercisesFile(filePath: string): ExercisesFile {
  const rel = path.basename(filePath);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = exercisesFile.safeParse(raw);
  if (!parsed.success) throw fmtZodError(rel, parsed.error);
  const expectedName = `${parsed.data.lesson}.exercises.json`;
  if (rel !== expectedName) {
    throw new ContentError(`${rel}: lesson=${parsed.data.lesson} does not match filename`);
  }
  return parsed.data;
}

export function loadSentencePack(filePath: string): SentencePack {
  const rel = path.basename(filePath);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = sentencePack.safeParse(raw);
  if (!parsed.success) throw fmtZodError(rel, parsed.error);
  const expectedName =
    parsed.data.pack === "daily-300" ? "daily-300.json" : `pack-${parsed.data.pack}.json`;
  if (rel !== expectedName) {
    throw new ContentError(`${rel}: pack=${parsed.data.pack} does not match filename`);
  }
  return parsed.data;
}

export interface ContentFiles {
  grammarMd: string[];
  exercises: string[];
  packs: string[];
}

export function discoverContent(rootDir: string): ContentFiles {
  const contentDir = path.join(rootDir, "content");
  const listDir = (sub: string): string[] => {
    const dir = path.join(contentDir, sub);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .map((f) => path.join(dir, f))
      .filter((f) => fs.statSync(f).isFile());
  };
  const grammar = listDir("grammar");
  const sentences = listDir("sentences");
  return {
    grammarMd: grammar.filter((f) => f.endsWith(".md")),
    exercises: grammar.filter((f) => f.endsWith(".exercises.json")),
    packs: sentences.filter((f) => f.endsWith(".json")),
  };
}
