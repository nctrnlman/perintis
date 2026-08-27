import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  Paragraph,
  TextRun,
  UnderlineType,
} from "docx";
import { htmlToDocxParagraphs } from "./html-to-docx";

const HEADER_BORDER = { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } };

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface ContactPart {
  text: string;
  href?: string;
}

export interface CoverLetterDocxInput {
  companyName: string;
  createdAt: Date;
  bodyHtml: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  location: string | null;
}

function contactRun(part: ContactPart): TextRun | ExternalHyperlink {
  if (!part.href) {
    return new TextRun({ text: part.text, size: 20, color: "555555" });
  }

  return new ExternalHyperlink({
    link: part.href,
    children: [
      new TextRun({
        text: part.text,
        size: 20,
        color: "0563C1",
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
  });
}

export function buildCoverLetterDocx({
  companyName,
  createdAt,
  bodyHtml,
  fullName,
  email,
  phone,
  linkedinUrl,
  location,
}: CoverLetterDocxInput): Document {
  const contactParts: ContactPart[] = [
    email ? { text: email, href: `mailto:${email}` } : null,
    phone ? { text: phone, href: telHref(phone) } : null,
    linkedinUrl ? { text: linkedinUrl, href: linkedinUrl } : null,
    location ? { text: location } : null,
  ].filter((part): part is ContactPart => part !== null);

  const hasContactLine = contactParts.length > 0;
  const headerParagraphs: Paragraph[] = [];

  if (fullName) {
    headerParagraphs.push(
      new Paragraph({
        children: [new TextRun({ text: fullName, bold: true, size: 30 })],
        spacing: hasContactLine ? { after: 40 } : { after: 240 },
        border: hasContactLine ? undefined : HEADER_BORDER,
      })
    );
  }

  if (hasContactLine) {
    const children: (TextRun | ExternalHyperlink)[] = [];
    contactParts.forEach((part, index) => {
      if (index > 0) {
        children.push(new TextRun({ text: "  ·  ", size: 20, color: "555555" }));
      }
      children.push(contactRun(part));
    });

    headerParagraphs.push(
      new Paragraph({
        children,
        spacing: { after: 240 },
        border: HEADER_BORDER,
      })
    );
  }

  headerParagraphs.push(
    new Paragraph({
      children: [new TextRun({ text: formatLongDate(createdAt) })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Hiring Team" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: companyName })],
      spacing: { after: 240 },
    })
  );

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [...headerParagraphs, ...htmlToDocxParagraphs(bodyHtml)],
      },
    ],
  });
}
