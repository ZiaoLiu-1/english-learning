import { describe, expect, it } from "vitest";
import { FrontmatterError, parseFrontmatter } from "@/lib/content/frontmatter";

const doc = (fm: string, body = "hello") => `---\n${fm}\n---\n${body}`;

describe("parseFrontmatter", () => {
  it("parses scalars, numbers, booleans", () => {
    const { frontmatter, body } = parseFrontmatter(
      doc("lesson: L01\nord: 3\napproved: false\ntitle_zh: 词性总览"),
      "t.md",
    );
    expect(frontmatter).toEqual({
      lesson: "L01",
      ord: 3,
      approved: false,
      title_zh: "词性总览",
    });
    expect(body).toBe("hello");
  });

  it("parses quoted strings preserving special chars", () => {
    const { frontmatter } = parseFrontmatter(doc('title_zh: "a: b, c"'), "t.md");
    expect(frontmatter.title_zh).toBe("a: b, c");
  });

  it("parses inline arrays", () => {
    const { frontmatter } = parseFrontmatter(
      doc('prereq: [L01, L02, "L03"]\nempty: []'),
      "t.md",
    );
    expect(frontmatter.prereq).toEqual(["L01", "L02", "L03"]);
    expect(frontmatter.empty).toEqual([]);
  });

  it("keeps body intact including --- later in the text", () => {
    const { body } = parseFrontmatter(doc("lesson: L01", "a\n---\nb"), "t.md");
    expect(body).toBe("a\n---\nb");
  });

  it("skips blank lines and comments inside the block", () => {
    const { frontmatter } = parseFrontmatter(doc("# note\n\nlesson: L01"), "t.md");
    expect(frontmatter).toEqual({ lesson: "L01" });
  });

  it("rejects a file without frontmatter", () => {
    expect(() => parseFrontmatter("# just markdown", "t.md")).toThrow(FrontmatterError);
  });

  it("rejects an unclosed block", () => {
    expect(() => parseFrontmatter("---\nlesson: L01\nbody", "t.md")).toThrow(/never closed/);
  });

  it("rejects nested/multiline values", () => {
    expect(() => parseFrontmatter(doc("meta:"), "t.md")).toThrow(FrontmatterError);
    expect(() => parseFrontmatter(doc("meta: a: b"), "t.md")).toThrow(/nested/);
  });

  it("rejects duplicate keys", () => {
    expect(() => parseFrontmatter(doc("a: 1\na: 2"), "t.md")).toThrow(/duplicate/);
  });

  it("rejects unparseable lines", () => {
    expect(() => parseFrontmatter(doc("not a kv line"), "t.md")).toThrow(/unparseable/);
  });
});
