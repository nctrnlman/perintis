import { Document, Page, StyleSheet, Text } from "@react-pdf/renderer";
import Html from "react-pdf-html";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#000000" },
  positionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  meta: { fontSize: 10, color: "#333333", marginBottom: 16 },
});

const richTextStyle = { fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 };
const richTextStylesheet = { p: { marginBottom: 10 } };

interface CoverLetterPdfProps {
  companyName: string;
  positionTitle: string;
  createdAt: Date;
  bodyHtml: string;
}

export function CoverLetterPdfDocument({
  companyName,
  positionTitle,
  createdAt,
  bodyHtml,
}: CoverLetterPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.positionTitle}>{positionTitle}</Text>
        <Text style={styles.meta}>
          {companyName} - {createdAt.toLocaleDateString("en-CA")}
        </Text>
        <Html style={richTextStyle} stylesheet={richTextStylesheet}>
          {bodyHtml}
        </Html>
      </Page>
    </Document>
  );
}
