export interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
}

export type Block =
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "bulletItem"; segments: InlineSegment[] }
  | { type: "numberedItem"; segments: InlineSegment[] }
  | { type: "horizontalRule" };

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_match, name: string) => HTML_ENTITIES[name]);
}

const INLINE_MARK_TAGS: Record<string, keyof Omit<InlineSegment, "text">> = {
  strong: "bold",
  em: "italic",
  s: "strike",
  code: "code",
};

function parseInline(html: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const active = { bold: false, italic: false, strike: false, code: false };
  const tagRegex = /<(\/?)(strong|em|s|code)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  function pushText(raw: string) {
    const text = decodeHtmlEntities(raw);
    if (!text) return;
    segments.push({ text, ...active });
  }

  while ((match = tagRegex.exec(html)) !== null) {
    pushText(html.slice(lastIndex, match.index));
    const [, closing, tag] = match;
    active[INLINE_MARK_TAGS[tag]] = closing !== "/";
    lastIndex = tagRegex.lastIndex;
  }
  pushText(html.slice(lastIndex));

  return segments;
}

function parseListItems(html: string): string[] {
  const items: string[] = [];
  const itemRegex = /<li>([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(html)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function unwrapParagraph(html: string): string {
  const match = /^<p>([\s\S]*)<\/p>$/.exec(html.trim());
  return match ? match[1] : html;
}

export function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const blockRegex = /<hr\s*\/?>|<(p|ul|ol)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const [full, tag, inner] = match;

    if (full.startsWith("<hr")) {
      blocks.push({ type: "horizontalRule" });
      continue;
    }

    if (tag === "p") {
      blocks.push({ type: "paragraph", segments: parseInline(inner) });
      continue;
    }

    const itemType = tag === "ul" ? "bulletItem" : "numberedItem";
    for (const item of parseListItems(inner)) {
      blocks.push({ type: itemType, segments: parseInline(unwrapParagraph(item)) });
    }
  }

  return blocks;
}
