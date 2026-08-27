import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import Html from "react-pdf-html";

const styles = StyleSheet.create({
  page: { padding: 72, fontSize: 11, fontFamily: "Helvetica", color: "#000000" },
  header: { borderBottomWidth: 1, borderBottomColor: "#CCCCCC", paddingBottom: 12, marginBottom: 16 },
  name: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  contactLine: { fontSize: 10, color: "#333333" },
  contactLink: { color: "#333333", textDecoration: "none" },
  date: { fontSize: 11, marginBottom: 16 },
  recipient: { fontSize: 11, lineHeight: 1.4, marginBottom: 16 },
});

const richTextStyle = { fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 };
const richTextStylesheet = { p: { marginBottom: 10, textAlign: "justify" as const } };

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

interface CoverLetterPdfProps {
  companyName: string;
  createdAt: Date;
  bodyHtml: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  location: string | null;
}

export function CoverLetterPdfDocument({
  companyName,
  createdAt,
  bodyHtml,
  fullName,
  email,
  phone,
  linkedinUrl,
  location,
}: CoverLetterPdfProps) {
  const contactParts: ContactPart[] = [
    email ? { text: email, href: `mailto:${email}` } : null,
    phone ? { text: phone, href: telHref(phone) } : null,
    linkedinUrl ? { text: linkedinUrl, href: linkedinUrl } : null,
    location ? { text: location } : null,
  ].filter((part): part is ContactPart => part !== null);

  const hasHeader = Boolean(fullName) || contactParts.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {hasHeader && (
          <View style={styles.header}>
            {fullName && <Text style={styles.name}>{fullName}</Text>}
            {contactParts.length > 0 && (
              <Text style={styles.contactLine}>
                {contactParts.map((part, index) => (
                  <Text key={index}>
                    {index > 0 && "  ·  "}
                    {part.href ? (
                      <Link src={part.href} style={styles.contactLink}>
                        {part.text}
                      </Link>
                    ) : (
                      part.text
                    )}
                  </Text>
                ))}
              </Text>
            )}
          </View>
        )}
        <Text style={styles.date}>{formatLongDate(createdAt)}</Text>
        <Text style={styles.recipient}>{"Hiring Team\n" + companyName}</Text>
        <Html style={richTextStyle} stylesheet={richTextStylesheet}>
          {bodyHtml}
        </Html>
      </Page>
    </Document>
  );
}
