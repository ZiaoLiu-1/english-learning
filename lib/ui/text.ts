/** Pure text-shaping helpers for the learn UI (no markdown lib per contract). */

/** Split a plain-text explanation into paragraphs on blank lines. */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
