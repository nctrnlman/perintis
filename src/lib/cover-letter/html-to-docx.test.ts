import { describe, expect, it } from "vitest";
import { Document, Packer, Paragraph } from "docx";
import { htmlToDocxParagraphs } from "./html-to-docx";

describe("htmlToDocxParagraphs", () => {
  it("returns one Paragraph per block", () => {
    const html = "<p>First.</p><p>Second.</p>";
    const result = htmlToDocxParagraphs(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(Paragraph);
  });

  it("returns one Paragraph per list item", () => {
    const html = "<ul><li><p>A</p></li><li><p>B</p></li><li><p>C</p></li></ul>";
    expect(htmlToDocxParagraphs(html)).toHaveLength(3);
  });

  it("returns a Paragraph for a horizontal rule", () => {
    const html = "<p>Before</p><hr><p>After</p>";
    expect(htmlToDocxParagraphs(html)).toHaveLength(3);
  });

  it("renders a document containing every supported construct to a non-empty buffer", async () => {
    const html =
      "<p>Plain <strong>bold</strong> <em>italic</em> <s>struck</s> <code>code</code>.</p>" +
      "<ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>" +
      "<ol><li><p>Step one</p></li><li><p>Step two</p></li></ol>" +
      "<hr>" +
      "<p>Closing paragraph.</p>";

    const document = new Document({
      sections: [{ children: htmlToDocxParagraphs(html) }],
    });

    const buffer = await Packer.toBuffer(document);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("returns an empty array for empty input", () => {
    expect(htmlToDocxParagraphs("")).toEqual([]);
  });
});
