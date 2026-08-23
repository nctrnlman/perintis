import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./html-to-plain-text";

describe("htmlToPlainText", () => {
  it("joins multiple paragraphs with newlines instead of concatenating them", () => {
    expect(htmlToPlainText("<p>First paragraph.</p><p>Second paragraph.</p>")).toBe(
      "First paragraph.\nSecond paragraph."
    );
  });

  it("strips inline formatting tags while keeping the text", () => {
    expect(htmlToPlainText("<p>We need <strong>React</strong> and <em>TypeScript</em>.</p>")).toBe(
      "We need React and TypeScript."
    );
  });

  it("prefixes bullet and numbered list items with a dash, one per line", () => {
    expect(
      htmlToPlainText(
        "<p>Requirements:</p><ul><li><p>3+ years experience</p></li><li><p>React knowledge</p></li></ul>"
      )
    ).toBe("Requirements:\n- 3+ years experience\n- React knowledge");
  });

  it("drops horizontal rules and empty blocks without leaving blank lines", () => {
    expect(htmlToPlainText("<p>Before</p><hr><p>After</p>")).toBe("Before\nAfter");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText("<p></p>")).toBe("");
  });
});
