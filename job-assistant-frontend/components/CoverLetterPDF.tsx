"use client";

import { Document, Font, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CoverLetterPDFProps } from "@/lib/types";
import { formatFrDate, normalizeLetterBody } from "@/lib/pdf";

Font.registerHyphenationCallback((word) => [word]);

const noHyphen = (word: string) => [word];

const styles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1e293b",
  },
  headerBlock: {
    marginBottom: 12,
  },
  sender: {
    marginBottom: 14,
  },
  senderName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    marginBottom: 3,
    color: "#1e293b",
  },
  senderMeta: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
  },
  recipient: {
    alignItems: "flex-end",
    marginBottom: 18,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: "#334155",
  },
  objetBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  objetText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#1e293b",
  },
  greeting: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  bodyParagraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: "justify",
    marginBottom: 12,
  },
  closingBlock: {
    marginTop: 15,
  },
  closingParagraph: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: "justify",
    marginBottom: 12,
  },
  signature: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    lineHeight: 1.5,
  },
});

function isGreeting(text: string): boolean {
  return /^Madame\s*,\s*Monsieur\s*,?\s*$/i.test(text.replace(/\s+/g, " ").trim());
}

function isClosing(text: string): boolean {
  return /^(je vous prie|veuillez agréer|veuillez agreer|veuillez recevoir|dans l['’]attente|cordialement|salutations|je reste à votre disposition|restant à votre disposition)/i.test(
    text.trim(),
  );
}

function isSignature(text: string): boolean {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact || compact.length > 80) return false;
  const words = compact.split(" ").filter(Boolean);
  return words.length <= 6 && !compact.includes("?");
}

function splitCoverLetter(letterBody: string): {
  greeting: string | null;
  body: string[];
  closing: string[];
} {
  const greeting = /^\s*Madame\s*,\s*Monsieur\s*,?/i.test(letterBody)
    ? "Madame, Monsieur,"
    : null;

  const cleanText = normalizeLetterBody(letterBody)
    .replace(/^\s*Madame\s*,\s*Monsieur\s*,?/i, "")
    .trim();

  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const rest = paragraphs[0] && isGreeting(paragraphs[0]) ? paragraphs.slice(1) : paragraphs;

  let closing: string[] = [];
  let body = rest;

  if (rest.length >= 2) {
    const last = rest[rest.length - 1];
    const prev = rest[rest.length - 2];
    if (isSignature(last) && (isClosing(prev) || rest.length >= 4)) {
      closing = rest.slice(-2);
      body = rest.slice(0, -2);
    } else if (isClosing(last) || isSignature(last)) {
      closing = [last];
      body = rest.slice(0, -1);
    }
  } else if (rest.length === 1 && (isClosing(rest[0]) || isSignature(rest[0]))) {
    closing = rest;
    body = [];
  }

  return { greeting, body, closing };
}

export function CoverLetterPDF({
  candidateName,
  candidateEmail,
  candidatePhone,
  candidateLocation,
  companyName,
  jobTitle,
  letterBody,
  letterDate,
}: CoverLetterPDFProps) {
  const { greeting, body, closing } = splitCoverLetter(letterBody);
  const objet = jobTitle
    ? `Objet : Candidature au poste de ${jobTitle}`
    : "Objet : Candidature";
  const closingParagraphs = closing.slice(0, -1);
  const signature = closing.length ? closing[closing.length - 1] : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <View style={styles.sender}>
            {candidateName ? (
              <Text hyphenationCallback={noHyphen} style={styles.senderName}>
                {candidateName}
              </Text>
            ) : null}
            {candidateEmail ? (
              <Text hyphenationCallback={noHyphen} style={styles.senderMeta}>
                {candidateEmail}
              </Text>
            ) : null}
            {candidatePhone ? (
              <Text hyphenationCallback={noHyphen} style={styles.senderMeta}>
                {candidatePhone}
              </Text>
            ) : null}
            {candidateLocation ? (
              <Text hyphenationCallback={noHyphen} style={styles.senderMeta}>
                {candidateLocation}
              </Text>
            ) : null}
          </View>

          <View style={styles.recipient}>
            {companyName ? (
              <Text hyphenationCallback={noHyphen} style={styles.companyName}>
                {companyName}
              </Text>
            ) : null}
            <Text hyphenationCallback={noHyphen} style={styles.date}>
              {letterDate || formatFrDate()}
            </Text>
          </View>
        </View>

        <View style={styles.objetBox}>
          <Text hyphenationCallback={noHyphen} style={styles.objetText}>
            {objet}
          </Text>
        </View>

        {greeting ? (
          <View style={styles.greeting}>
            <Text hyphenationCallback={noHyphen} style={styles.greetingText}>
              {greeting}
            </Text>
          </View>
        ) : null}

        {body.map((paragraph, index) => (
          <View key={`body-${index}`}>
            <Text hyphenationCallback={noHyphen} style={styles.bodyParagraph}>
              {paragraph}
            </Text>
          </View>
        ))}

        {closing.length > 0 ? (
          <View style={styles.closingBlock}>
            {closingParagraphs.map((paragraph, index) => (
              <View key={`closing-${index}`}>
                <Text hyphenationCallback={noHyphen} style={styles.closingParagraph}>
                  {paragraph}
                </Text>
              </View>
            ))}
            {signature ? (
              <Text hyphenationCallback={noHyphen} style={styles.signature}>
                {signature}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export default CoverLetterPDF;
