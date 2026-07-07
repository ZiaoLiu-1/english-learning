import { describe, expect, it } from "vitest";
import {
  expandSequences,
  expectedNext,
  normalizeText,
  normalizeToken,
  startTyping,
  tokenize,
  typeToken,
} from "@/lib/tokenize";

describe("tokenize", () => {
  it("splits a plain sentence and drops sentence punctuation", () => {
    expect(tokenize("I am a driver.")).toEqual(["I", "am", "a", "driver"]);
  });

  it("handles commas, question marks, exclamations, quotes", () => {
    expect(tokenize('Yes, I like it!')).toEqual(["Yes", "I", "like", "it"]);
    expect(tokenize('Do you work "here"?')).toEqual(["Do", "you", "work", "here"]);
    expect(tokenize("Wait — what happened…")).toEqual(["Wait", "what", "happened"]);
  });

  it("keeps apostrophes and hyphens inside words", () => {
    expect(tokenize("I don't have a part-time job.")).toEqual([
      "I",
      "don't",
      "have",
      "a",
      "part-time",
      "job",
    ]);
  });

  it("normalizes unicode apostrophes", () => {
    expect(tokenize("I don’t know.")).toEqual(["I", "don't", "know"]);
  });

  it("keeps numbers", () => {
    expect(tokenize("I have 2 books.")).toEqual(["I", "have", "2", "books"]);
  });

  it("collapses irregular whitespace", () => {
    expect(tokenize("  I   am\n here ")).toEqual(["I", "am", "here"]);
  });

  it("returns [] for empty or punctuation-only input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("?!.")).toEqual([]);
  });
});

describe("normalizeToken / normalizeText", () => {
  it("lowercases and unifies apostrophes", () => {
    expect(normalizeToken("Don’t")).toBe("don't");
    expect(normalizeToken("HELLO")).toBe("hello");
  });

  it("normalizeText joins normalized tokens", () => {
    expect(normalizeText("He DOESN’T work, here!")).toBe("he doesn't work here");
  });
});

describe("expandSequences (contraction equivalence groups)", () => {
  it("expands a contraction into its long form", () => {
    const seqs = expandSequences(["I", "don't", "know"]);
    const norm = seqs.map((s) => s.map((t) => normalizeToken(t)).join(" "));
    expect(norm).toContain("i don't know");
    expect(norm).toContain("i do not know");
  });

  it("contracts a long form into its short form", () => {
    const seqs = expandSequences(["I", "do", "not", "know"]);
    const norm = seqs.map((s) => s.map((t) => normalizeToken(t)).join(" "));
    expect(norm).toContain("i don't know");
  });

  it("handles multiple independent contraction sites", () => {
    const seqs = expandSequences(["I'm", "sure", "he", "isn't", "here"]);
    const norm = new Set(seqs.map((s) => s.map(normalizeToken).join(" ")));
    expect(norm).toContain("i am sure he is not here");
    expect(norm).toContain("i'm sure he isn't here");
    expect(norm).toContain("i am sure he isn't here");
    expect(norm).toContain("i'm sure he is not here");
  });

  it("applies sentence-specific alt rules", () => {
    const seqs = expandSequences(["I", "like", "football"], [
      { span: [2, 3], options: [["soccer"]] },
    ]);
    const norm = seqs.map((s) => s.map(normalizeToken).join(" "));
    expect(norm).toContain("i like football");
    expect(norm).toContain("i like soccer");
  });

  it("caps combinatorial explosion", () => {
    const tokens = Array.from({ length: 12 }, () => ["do", "not"]).flat();
    expect(expandSequences(tokens).length).toBeLessThanOrEqual(64);
  });

  it("ignores alt rules whose span exceeds the token count", () => {
    const seqs = expandSequences(["I", "agree"], [{ span: [1, 5], options: [["disagree"]] }]);
    expect(seqs).toEqual([["I", "agree"]]);
  });

  it("dedupes sequences that normalize identically", () => {
    const seqs = expandSequences(["I", "like", "it"], [
      { span: [1, 2], options: [["LIKE"]] },
    ]);
    expect(seqs).toHaveLength(1);
  });

  it("won't → will not round-trips", () => {
    const norm = expandSequences(["I", "won't", "go"]).map((s) =>
      s.map(normalizeToken).join(" "),
    );
    expect(norm).toContain("i will not go");
  });

  it("can't ↔ cannot", () => {
    const a = expandSequences(["I", "can't", "swim"]).map((s) =>
      s.map(normalizeToken).join(" "),
    );
    expect(a).toContain("i cannot swim");
    const b = expandSequences(["I", "cannot", "swim"]).map((s) =>
      s.map(normalizeToken).join(" "),
    );
    expect(b).toContain("i can't swim");
  });
});

describe("typing session", () => {
  it("accepts the canonical path token by token", () => {
    const state = startTyping(["I", "am", "happy"]);
    let r = typeToken(state, "i");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "am");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "HAPPY");
    expect(r.result).toBe("completed");
  });

  it("rejects a wrong token without advancing", () => {
    const state = startTyping(["I", "am", "happy"]);
    const r = typeToken(state, "you");
    expect(r.result).toBe("rejected");
    const r2 = typeToken(r.state, "I");
    expect(r2.result).toBe("accepted");
  });

  it("accepts a contraction for the two-token long form", () => {
    const state = startTyping(["He", "does", "not", "work"]);
    let r = typeToken(state, "he");
    r = typeToken(r.state, "doesn't");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "work");
    expect(r.result).toBe("completed");
  });

  it("accepts the long form when canonical has a contraction", () => {
    const state = startTyping(["He", "doesn't", "work"]);
    let r = typeToken(state, "he");
    r = typeToken(r.state, "does");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "not");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "work");
    expect(r.result).toBe("completed");
  });

  it("once a branch is taken, incompatible continuations are rejected", () => {
    const state = startTyping(["He", "does", "not", "work"]);
    let r = typeToken(state, "he");
    r = typeToken(r.state, "doesn't");
    const bad = typeToken(r.state, "not");
    expect(bad.result).toBe("rejected");
  });

  it("expectedNext offers hint candidates in display form", () => {
    const state = startTyping(["He", "doesn't", "work"]);
    expect(expectedNext(state)).toContain("He");
    const r = typeToken(state, "he");
    const next = expectedNext(r.state);
    expect(next).toContain("doesn't");
    expect(next).toContain("does");
  });

  it("completes only when a full sequence is consumed", () => {
    const state = startTyping(["do", "not", "stop"]);
    let r = typeToken(state, "don't");
    expect(r.result).toBe("accepted");
    r = typeToken(r.state, "stop");
    expect(r.result).toBe("completed");
  });

  it("expectedNext is empty once the sentence is completed", () => {
    const r = typeToken(startTyping(["Stop"]), "stop");
    expect(r.result).toBe("completed");
    expect(expectedNext(r.state)).toEqual([]);
  });
});
