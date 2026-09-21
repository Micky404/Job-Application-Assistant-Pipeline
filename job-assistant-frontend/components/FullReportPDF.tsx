"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FullReportPDFProps } from "@/lib/types";
import { formatFrDate, letterParagraphs } from "@/lib/pdf";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: "#1e293b",
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#334155",
  },
  meta: {
    fontSize: 9,
    color: "#475569",
    marginTop: 4,
  },
  section: {
    marginTop: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#1e3a8a",
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.45,
    textAlign: "justify",
    marginBottom: 6,
  },
  letterBlock: {
    marginBottom: 6,
  },
  item: {
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 8,
  },
  qaBlock: {
    marginBottom: 6,
  },
  qaQuestion: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  pitfall: {
    fontSize: 9,
    color: "#b91c1c",
    marginTop: 1,
  },
});

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((item, index) => (
        <Text key={`${index}-${item.slice(0, 20)}`} style={styles.item}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

export function FullReportPDF({
  candidateName,
  candidateEmail,
  candidatePhone,
  candidateLocation,
  companyName,
  jobTitle,
  letterBody,
  companyInfo,
  project,
  motivation,
  technicalQa,
  createdAt,
}: FullReportPDFProps) {
  const contact = [candidateEmail, candidatePhone, candidateLocation]
    .filter(Boolean)
    .join("  ·  ");
  const heading = [jobTitle, companyName].filter(Boolean).join(" — ");
  const paragraphs = letterBody ? letterParagraphs(letterBody) : [];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de candidature</Text>
          {heading ? <Text style={styles.subtitle}>{heading}</Text> : null}
          {candidateName ? <Text style={styles.meta}>{candidateName}</Text> : null}
          {contact ? <Text style={styles.meta}>{contact}</Text> : null}
          <Text style={styles.meta}>{formatFrDate(createdAt)}</Text>
        </View>

        {paragraphs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lettre de motivation</Text>
            {paragraphs.map((paragraph, index) => (
              <View key={`letter-${index}`} style={styles.letterBlock}>
                <Text style={styles.paragraph}>{paragraph}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {companyInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recherche entreprise</Text>
            {companyInfo.company_overview ? (
              <Text style={styles.paragraph}>{companyInfo.company_overview}</Text>
            ) : null}
            {companyInfo.key_tech_focus?.length ? (
              <View>
                <Text style={styles.qaQuestion}>Focus techniques</Text>
                <BulletList items={companyInfo.key_tech_focus} />
              </View>
            ) : null}
            {companyInfo.interview_questions?.length ? (
              <View>
                <Text style={[styles.qaQuestion, { marginTop: 6 }]}>
                  {"Questions d'entretien"}
                </Text>
                <BulletList items={companyInfo.interview_questions} />
              </View>
            ) : null}
          </View>
        ) : null}

        {project ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projet recommandé</Text>
            {project.title ? (
              <Text style={styles.qaQuestion}>{project.title}</Text>
            ) : null}
            {project.pitch ? (
              <Text style={styles.paragraph}>{project.pitch}</Text>
            ) : null}
            <BulletList items={project.key_metrics} />
            <BulletList items={project.tech_stack} />
          </View>
        ) : null}

        {motivation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pitch de motivation</Text>
            {motivation.hook_sentence ? (
              <Text style={styles.paragraph}>{motivation.hook_sentence}</Text>
            ) : null}
            {motivation.spoken_pitch ? (
              <Text style={styles.paragraph}>{motivation.spoken_pitch}</Text>
            ) : null}
            <BulletList items={motivation.core_arguments} />
          </View>
        ) : null}

        {technicalQa?.questions_and_answers?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Q&A technique</Text>
            {technicalQa.questions_and_answers.map((qa, index) => (
              <View key={`qa-${index}`} style={styles.qaBlock}>
                <Text style={styles.qaQuestion}>
                  Q{index + 1}. {qa.question}
                </Text>
                <Text style={styles.paragraph}>{qa.suggested_answer}</Text>
                {qa.common_pitfall ? (
                  <Text style={styles.pitfall}>Piège : {qa.common_pitfall}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export default FullReportPDF;
