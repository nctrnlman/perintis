import { describe, expect, it } from "vitest";
import { paragraphsToHtml } from "./paragraphs-to-html";

describe("paragraphsToHtml", () => {
  it("wraps each paragraph in a <p> tag", () => {
    expect(paragraphsToHtml(["First paragraph.", "Second paragraph."])).toBe(
      "<p>First paragraph.</p><p>Second paragraph.</p>"
    );
  });

  it("trims whitespace and drops empty paragraphs", () => {
    expect(paragraphsToHtml(["  Hello.  ", "", "   "])).toBe("<p>Hello.</p>");
  });

  it("escapes HTML special characters", () => {
    expect(paragraphsToHtml(["R&D team, <script> included."])).toBe(
      "<p>R&amp;D team, &lt;script&gt; included.</p>"
    );
  });

  it("returns an empty string for an empty array", () => {
    expect(paragraphsToHtml([])).toBe("");
  });
});
