import { parseBlocks, type Block } from "./parse-rich-text";

function blockText(block: Block): string {
  if (block.type === "horizontalRule") return "";
  return block.segments.map((seg) => seg.text).join("");
}

export function htmlToPlainText(html: string): string {
  const lines: string[] = [];

  for (const block of parseBlocks(html)) {
    if (block.type === "horizontalRule") continue;

    const text = blockText(block);
    if (!text) continue;

    lines.push(block.type === "bulletItem" || block.type === "numberedItem" ? `- ${text}` : text);
  }

  return lines.join("\n");
}
