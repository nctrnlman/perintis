import { describe, expect, it } from "vitest";
import { parseBlocks } from "./parse-rich-text";

describe("parseBlocks", () => {
  it("parses a plain paragraph into a single text segment", () => {
    expect(parseBlocks("<p>Hello world.</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "Hello world.", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("tracks bold, italic, strike, and code marks separately", () => {
    expect(
      parseBlocks("<p>Plain <strong>bold</strong> <em>italic</em> <s>struck</s> <code>code</code>.</p>")
    ).toEqual([
      {
        type: "paragraph",
        segments: [
          { text: "Plain ", bold: false, italic: false, strike: false, code: false },
          { text: "bold", bold: true, italic: false, strike: false, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "italic", bold: false, italic: true, strike: false, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "struck", bold: false, italic: false, strike: true, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "code", bold: false, italic: false, strike: false, code: true },
          { text: ".", bold: false, italic: false, strike: false, code: false },
        ],
      },
    ]);
  });

  it("handles nested marks (bold + italic on the same text)", () => {
    expect(parseBlocks("<p><em><strong>both</strong></em></p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "both", bold: true, italic: true, strike: false, code: false }],
      },
    ]);
  });

  it("decodes HTML entities in text", () => {
    expect(parseBlocks("<p>R&amp;D &lt;team&gt;</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "R&D <team>", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses a bullet list into one bulletItem block per <li>, unwrapping the nested <p>", () => {
    expect(parseBlocks("<ul><li><p>First</p></li><li><p>Second</p></li></ul>")).toEqual([
      {
        type: "bulletItem",
        segments: [{ text: "First", bold: false, italic: false, strike: false, code: false }],
      },
      {
        type: "bulletItem",
        segments: [{ text: "Second", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses an ordered list into numberedItem blocks", () => {
    expect(parseBlocks("<ol><li><p>Step one</p></li></ol>")).toEqual([
      {
        type: "numberedItem",
        segments: [{ text: "Step one", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses a horizontal rule into its own block", () => {
    expect(parseBlocks("<p>Before</p><hr><p>After</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "Before", bold: false, italic: false, strike: false, code: false }],
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        segments: [{ text: "After", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseBlocks("")).toEqual([]);
  });
});
