import type {
  CandidateInfo,
  CoverLetterPDFProps,
  FullReportPDFProps,
  SavedApplication,
} from "./types";
import { mapCandidateInfo } from "./api";

export function formatFrDate(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function slugifyFilename(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return slug || "candidature";
}

export function coverLetterFileName(companyName: string, jobTitle: string): string {
  return `Lettre_Motivation_${slugifyFilename(companyName)}_${slugifyFilename(jobTitle)}.pdf`;
}

export function fullReportFileName(companyName: string, jobTitle: string): string {
  return `Rapport_Candidature_${slugifyFilename(companyName)}_${slugifyFilename(jobTitle)}.pdf`;
}

export function normalizeLetterBody(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\u2028|\u2029|\u0085/g, "\n")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

export function letterParagraphs(letterBody: string): string[] {
  const cleanText = normalizeLetterBody(letterBody)
    .replace(/^\s*Madame\s*,\s*Monsieur\s*,?/i, "Madame, Monsieur,\n\n")
    .trim();

  return cleanText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

export function toCoverLetterProps(
  candidate: CandidateInfo,
  companyName: string,
  jobTitle: string,
  letterBody: string,
  letterDate?: string,
): CoverLetterPDFProps {
  return {
    candidateName: candidate.candidateName,
    candidateEmail: candidate.candidateEmail,
    candidatePhone: candidate.candidatePhone,
    candidateLocation: candidate.candidateLocation,
    companyName,
    jobTitle,
    letterBody,
    letterDate,
  };
}

export function applicationToPdfProps(application: SavedApplication): {
  letter: CoverLetterPDFProps;
  report: FullReportPDFProps;
} {
  const candidate = mapCandidateInfo(application.candidate_info);
  const letterDate = formatFrDate(application.created_at);
  const letter = toCoverLetterProps(
    candidate,
    application.company_name,
    application.job_title,
    application.cover_letter || "",
    letterDate,
  );

  return {
    letter,
    report: {
      ...letter,
      jobDescription: application.job_description,
      companyInfo: application.company_info,
      project: application.project,
      motivation: application.motivation,
      technicalQa: application.technical_qa,
      createdAt: application.created_at,
    },
  };
}
