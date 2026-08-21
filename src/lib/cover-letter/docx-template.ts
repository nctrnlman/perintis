import { Document, Paragraph, TextRun } from "docx";
import { htmlToDocxParagraphs } from "./html-to-docx";

export interface CoverLetterDocxInput {
  companyName: string;
  positionTitle: string;
  createdAt: Date;
  bodyHtml: string;
}

export function buildCoverLetterDocx({
  companyName,
  positionTitle,
  createdAt,
  bodyHtml,
}: CoverLetterDocxInput): Document {
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: positionTitle, bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${companyName} - ${createdAt.toLocaleDateString("en-CA")}`,
                color: "555555",
              }),
            ],
            spacing: { after: 200 },
          }),
          ...htmlToDocxParagraphs(bodyHtml),
        ],
      },
    ],
  });
}
