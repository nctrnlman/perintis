import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "./types";
import { formatMonthYear } from "./format-date";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#000000" },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  contactLine: { fontSize: 9, color: "#333333", marginBottom: 12 },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  entryRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontFamily: "Helvetica-Bold" },
  entrySubtitle: { fontStyle: "italic", color: "#333333", marginBottom: 2 },
  bullet: { marginLeft: 10, marginTop: 2 },
  paragraph: { marginTop: 2, lineHeight: 1.4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  tag: { marginRight: 8 },
});

function contactParts(content: ResumeContent): string[] {
  return [
    content.personalInfo.location,
    content.personalInfo.phone,
    content.personalInfo.email,
    content.personalInfo.linkedinUrl,
    content.personalInfo.portfolioUrl,
  ].filter(Boolean);
}

function dateRange(startDate: string | null, endDate: string | null): string {
  const start = formatMonthYear(startDate);
  const end = endDate ? formatMonthYear(endDate) : "Present";
  return start ? `${start} - ${end}` : "";
}

export function ResumePdfDocument({ content }: { content: ResumeContent }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{content.personalInfo.fullName}</Text>
        <Text style={styles.contactLine}>{contactParts(content).join(" | ")}</Text>

        {content.summary && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.paragraph}>{content.summary}</Text>
          </>
        )}

        {content.workExperiences.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {content.workExperiences.map((entry) => (
              <View key={entry.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text>{dateRange(entry.startDate, entry.endDate)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[entry.company, entry.location].filter(Boolean).join(" | ")}
                </Text>
                {entry.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {content.educations.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Education</Text>
            {content.educations.map((entry) => (
              <View key={entry.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{entry.institution}</Text>
                  <Text>{dateRange(entry.startDate, entry.endDate)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[entry.degree, entry.fieldOfStudy, entry.location].filter(Boolean).join(" | ")}
                </Text>
                {entry.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {content.skills.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Skills</Text>
            <Text style={styles.paragraph}>
              {content.skills.map((s) => s.name).join(", ")}
            </Text>
          </>
        )}

        {content.certifications.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Certifications</Text>
            {content.certifications.map((cert) => (
              <View key={cert.id} style={styles.entryRow}>
                <Text>
                  {cert.name} - {cert.issuer}
                </Text>
                <Text>{formatMonthYear(cert.issueDate)}</Text>
              </View>
            ))}
          </>
        )}

        {content.projects.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Highlight Projects</Text>
            {content.projects.map((proj) => (
              <View key={proj.id} style={{ marginBottom: 8 }}>
                <Text style={styles.entryTitle}>
                  {proj.name}
                  {proj.client ? ` - ${proj.client}` : ""}
                </Text>
                {proj.role && <Text style={styles.entrySubtitle}>{proj.role}</Text>}
                {proj.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
                {proj.techStack.length > 0 && (
                  <Text style={styles.paragraph}>
                    Tech Stack: {proj.techStack.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {content.languages.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Languages</Text>
            <Text style={styles.paragraph}>
              {content.languages.map((l) => `${l.name} - ${l.proficiency}`).join(" | ")}
            </Text>
          </>
        )}
      </Page>
    </Document>
  );
}
