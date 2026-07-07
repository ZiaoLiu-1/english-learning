/**
 * Strict YAML-subset frontmatter parser for content files.
 *
 * We own the content format (see content/prompts/content_draft.md), so instead
 * of a YAML dependency we accept exactly:
 *   ---
 *   key: scalar            (string | number | true/false)
 *   key: "quoted string"
 *   key: [a, b, "c d"]     (inline array of scalars)
 *   ---
 * Anything else (nesting, multiline, block arrays) is a loud error.
 */

export type FrontmatterValue = string | number | boolean | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  body: string;
}

export class FrontmatterError extends Error {}

function parseScalar(raw: string): string | number | boolean {
  const s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    return s.slice(1, -1);
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return Number.parseFloat(s);
  if (s.length === 0) {
    throw new FrontmatterError("empty value (block/multiline values are not supported)");
  }
  if (s.includes(":") || s.startsWith("-") || s.startsWith("#")) {
    throw new FrontmatterError(
      `value "${s}" looks like nested YAML — only flat scalars/arrays are supported`,
    );
  }
  return s;
}

function parseArray(raw: string): string[] {
  const inner = raw.trim().slice(1, -1).trim();
  if (inner.length === 0) return [];
  return inner.split(",").map((part) => {
    const v = parseScalar(part);
    if (typeof v !== "string") {
      return String(v);
    }
    return v;
  });
}

export function parseFrontmatter(raw: string, file: string): ParsedMarkdown {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new FrontmatterError(`${file}: must start with a "---" frontmatter block`);
  }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) {
    throw new FrontmatterError(`${file}: frontmatter block is never closed with "---"`);
  }
  const frontmatter: Frontmatter = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim().length === 0 || line.trim().startsWith("#")) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*):(.*)$/.exec(line);
    if (!m) {
      throw new FrontmatterError(`${file}: unparseable frontmatter line ${i + 1}: "${line}"`);
    }
    const key = m[1];
    const rest = m[2].trim();
    if (key in frontmatter) {
      throw new FrontmatterError(`${file}: duplicate frontmatter key "${key}"`);
    }
    try {
      if (rest.startsWith("[") && rest.endsWith("]")) {
        frontmatter[key] = parseArray(rest);
      } else {
        frontmatter[key] = parseScalar(rest);
      }
    } catch (e) {
      if (e instanceof FrontmatterError) {
        throw new FrontmatterError(`${file}: key "${key}": ${e.message}`);
      }
      throw e;
    }
  }
  return { frontmatter, body: lines.slice(end + 1).join("\n") };
}
