/**
 * Sentence tokenization, normalization, contraction equivalence, and the
 * pure typing-session engine for 连词成句 (PLAN §5C, §6.5).
 *
 * Design:
 * - tokens are word tokens only; sentence punctuation is dropped at
 *   tokenization time ("标点自动补" happens in the UI).
 * - equivalence = global contraction groups (below) + sentence-local alt
 *   rules from content (lib/content/schema.ts altRule).
 * - the typing engine is NFA-style: all acceptable token sequences advance in
 *   parallel; typing a token eliminates incompatible sequences.
 */
import type { AltRule } from "@/lib/content/schema";

const WORD_RE = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

function unifyApostrophes(text: string): string {
  return text.replace(/[’‘]/g, "'");
}

export function tokenize(text: string): string[] {
  return unifyApostrophes(text).match(WORD_RE) ?? [];
}

export function normalizeToken(token: string): string {
  return unifyApostrophes(token).toLowerCase();
}

/** Normalized, punctuation-free, single-spaced form — for equality checks. */
export function normalizeText(text: string): string {
  return tokenize(text).map(normalizeToken).join(" ");
}

/**
 * Contraction equivalence groups (normalized). First variant is the
 * canonical (expanded) form used by canonicalizeContractions().
 * Ambiguous cases are resolved for A1-A2 content: 's → is, 'd → would.
 */
export const EQUIV_GROUPS: ReadonlyArray<ReadonlyArray<readonly string[]>> = [
  [["do", "not"], ["don't"]],
  [["does", "not"], ["doesn't"]],
  [["did", "not"], ["didn't"]],
  [["is", "not"], ["isn't"]],
  [["are", "not"], ["aren't"]],
  [["was", "not"], ["wasn't"]],
  [["were", "not"], ["weren't"]],
  [["will", "not"], ["won't"]],
  [["cannot"], ["can't"]],
  [["should", "not"], ["shouldn't"]],
  [["could", "not"], ["couldn't"]],
  [["would", "not"], ["wouldn't"]],
  [["must", "not"], ["mustn't"]],
  [["have", "not"], ["haven't"]],
  [["has", "not"], ["hasn't"]],
  [["had", "not"], ["hadn't"]],
  [["i", "am"], ["i'm"]],
  [["you", "are"], ["you're"]],
  [["we", "are"], ["we're"]],
  [["they", "are"], ["they're"]],
  [["he", "is"], ["he's"]],
  [["she", "is"], ["she's"]],
  [["it", "is"], ["it's"]],
  [["that", "is"], ["that's"]],
  [["there", "is"], ["there's"]],
  [["what", "is"], ["what's"]],
  [["who", "is"], ["who's"]],
  [["i", "have"], ["i've"]],
  [["you", "have"], ["you've"]],
  [["we", "have"], ["we've"]],
  [["they", "have"], ["they've"]],
  [["i", "will"], ["i'll"]],
  [["you", "will"], ["you'll"]],
  [["he", "will"], ["he'll"]],
  [["she", "will"], ["she'll"]],
  [["it", "will"], ["it'll"]],
  [["we", "will"], ["we'll"]],
  [["they", "will"], ["they'll"]],
  [["i", "would"], ["i'd"]],
  [["you", "would"], ["you'd"]],
  [["he", "would"], ["he'd"]],
  [["she", "would"], ["she'd"]],
  [["we", "would"], ["we'd"]],
  [["they", "would"], ["they'd"]],
  [["let", "us"], ["let's"]],
];

interface Substitution {
  start: number;
  end: number; // exclusive
  replacement: string[];
}

function matchesAt(tokens: string[], variant: readonly string[], start: number): boolean {
  if (start + variant.length > tokens.length) return false;
  for (let i = 0; i < variant.length; i++) {
    if (normalizeToken(tokens[start + i]) !== variant[i]) return false;
  }
  return true;
}

function collectSubstitutions(tokens: string[], alt: AltRule[]): Substitution[] {
  const subs: Substitution[] = [];
  for (const group of EQUIV_GROUPS) {
    for (let start = 0; start < tokens.length; start++) {
      for (const variant of group) {
        if (!matchesAt(tokens, variant, start)) continue;
        for (const other of group) {
          if (other === variant) continue;
          subs.push({ start, end: start + variant.length, replacement: [...other] });
        }
      }
    }
  }
  for (const rule of alt) {
    const [start, end] = rule.span;
    if (end > tokens.length) continue; // schema-level checkSentence reports this
    for (const option of rule.options) {
      subs.push({ start, end, replacement: [...option] });
    }
  }
  return subs;
}

export const MAX_SEQUENCES = 64;

/**
 * All acceptable token sequences for a sentence (canonical first),
 * deduplicated on normalized form and capped at MAX_SEQUENCES.
 */
export function expandSequences(tokens: string[], alt: AltRule[] = []): string[][] {
  const subs = collectSubstitutions(tokens, alt);
  const results: string[][] = [];
  const seen = new Set<string>();

  const emitOrWalk = (prefix: string[], pos: number) => {
    if (results.length >= MAX_SEQUENCES) return;
    if (pos >= tokens.length) {
      const key = prefix.map(normalizeToken).join(" ");
      if (!seen.has(key)) {
        seen.add(key);
        results.push(prefix);
      }
      return;
    }
    emitOrWalk([...prefix, tokens[pos]], pos + 1);
    for (const sub of subs) {
      if (sub.start !== pos) continue;
      emitOrWalk([...prefix, ...sub.replacement], sub.end);
    }
  };

  emitOrWalk([], 0);
  return results;
}

/** Rewrite every contraction to its canonical (expanded) form. */
export function canonicalizeContractions(text: string): string {
  const tokens = tokenize(text).map(normalizeToken);
  const out: string[] = [];
  let i = 0;
  outer: while (i < tokens.length) {
    for (const group of EQUIV_GROUPS) {
      // variants sorted longest-first so "do not" wins over prefix matches
      const variants = [...group].sort((a, b) => b.length - a.length);
      for (const variant of variants) {
        if (matchesAt(tokens, variant, i)) {
          out.push(...group[0]);
          i += variant.length;
          continue outer;
        }
      }
    }
    out.push(tokens[i]);
    i++;
  }
  return out.join(" ");
}

// ---------- typing session (pure; UI drives timers/hints around it) ----------

export interface TypingState {
  viable: ReadonlyArray<{ seq: string[]; pos: number }>;
}

export type TypeResult = "accepted" | "rejected" | "completed";

export function startTyping(tokens: string[], alt: AltRule[] = []): TypingState {
  return {
    viable: expandSequences(tokens, alt).map((seq) => ({ seq, pos: 0 })),
  };
}

export function typeToken(
  state: TypingState,
  word: string,
): { state: TypingState; result: TypeResult } {
  const w = normalizeToken(word.trim());
  const advanced = state.viable
    .filter((v) => v.pos < v.seq.length && normalizeToken(v.seq[v.pos]) === w)
    .map((v) => ({ seq: v.seq, pos: v.pos + 1 }));
  if (advanced.length === 0) {
    return { state, result: "rejected" };
  }
  const completed = advanced.some((v) => v.pos === v.seq.length);
  return { state: { viable: advanced }, result: completed ? "completed" : "accepted" };
}

/** Distinct next-token candidates in display form — the hint ladder's input. */
export function expectedNext(state: TypingState): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of state.viable) {
    if (v.pos >= v.seq.length) continue;
    const display = v.seq[v.pos];
    const key = normalizeToken(display);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(display);
    }
  }
  return out;
}
