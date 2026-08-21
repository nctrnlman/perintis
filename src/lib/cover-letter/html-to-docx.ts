import { BorderStyle, Paragraph, TextRun } from "docx";
import { parseBlocks, type Block, type InlineSegment } from "./parse-rich-text";

function segmentsToRuns(segments: InlineSegment[]): TextRun[] {
  return segments.map(
    (seg) =>
      new TextRun({
        text: seg.text,
        bold: seg.bold,
        italics: seg.italic,
        strike: seg.strike,
        font: seg.code ? "Courier New" : undefined,
      })
  );
}

function blockToParagraph(block: Block, numberedIndex: number): Paragraph {
  if (block.type === "horizontalRule") {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" } },
    });
  }

  if (block.type === "bulletItem") {
    return new Paragraph({ children: segmentsToRuns(block.segments), bullet: { level: 0 } });
  }

  if (block.type === "numberedItem") {
    return new Paragraph({
      children: [new TextRun({ text: `${numberedIndex}. ` }), ...segmentsToRuns(block.segments)],
    });
  }

  return new Paragraph({ children: segmentsToRuns(block.segments) });
}

export function htmlToDocxParagraphs(html: string): Paragraph[] {
  const blocks = parseBlocks(html);
  let numberedIndex = 0;

  return blocks.map((block) => {
    numberedIndex = block.type === "numberedItem" ? numberedIndex + 1 : 0;
    return blockToParagraph(block, numberedIndex);
  });
}
