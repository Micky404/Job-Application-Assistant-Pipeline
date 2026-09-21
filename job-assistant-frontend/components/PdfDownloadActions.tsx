"use client";

import { useState, useRef, type ReactElement } from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";
import CoverLetterPDF from "./CoverLetterPDF";
import FullReportPDF from "./FullReportPDF";
import type { CoverLetterPDFProps, FullReportPDFProps } from "@/lib/types";

const letterButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50";

const reportButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-black transition-colors disabled:opacity-50";

const historyButtonClass =
  "inline-flex w-full items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50";

const historyReportClass =
  "inline-flex w-full items-center justify-center rounded-lg border-2 border-slate-700 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50";

type Variant = "dashboard" | "history";
type DownloadKind = "letter" | "report";

interface PdfDownloadActionsProps {
  letter?: CoverLetterPDFProps | null;
  report?: FullReportPDFProps | null;
  letterFileName: string;
  reportFileName: string;
  variant?: Variant;
}

async function downloadPdf(document: ReactElement<DocumentProps>, fileName: string) {
  const blob = await pdf(document).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function PdfDownloadActions({
  letter,
  report,
  letterFileName,
  reportFileName,
  variant = "dashboard",
}: PdfDownloadActionsProps) {
  const [downloading, setDownloading] = useState<DownloadKind | null>(null);
  const letterRef = useRef(letter);
  const reportRef = useRef(report);
  letterRef.current = letter;
  reportRef.current = report;

  const hasLetter = Boolean(letter?.letterBody?.trim());
  const hasReport = Boolean(
    report &&
      (report.letterBody?.trim() ||
        report.companyInfo ||
        report.project ||
        report.motivation ||
        report.technicalQa),
  );

  const letterClass = variant === "history" ? historyButtonClass : letterButtonClass;
  const reportClass = variant === "history" ? historyReportClass : reportButtonClass;

  const handleDownload = async (kind: DownloadKind) => {
    setDownloading(kind);
    try {
      const currentLetter = letterRef.current;
      const currentReport = reportRef.current;
      if (kind === "letter" && currentLetter) {
        await downloadPdf(<CoverLetterPDF {...currentLetter} />, letterFileName);
      }
      if (kind === "report" && currentReport) {
        await downloadPdf(<FullReportPDF {...currentReport} />, reportFileName);
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de générer le PDF.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className={
        variant === "history"
          ? "flex flex-col gap-2"
          : "flex flex-wrap items-center gap-3"
      }
    >
      {hasLetter && letter ? (
        <button
          type="button"
          className={letterClass}
          disabled={downloading !== null}
          onClick={() => void handleDownload("letter")}
        >
          {downloading === "letter"
            ? "Préparation du PDF..."
            : variant === "history"
              ? "Télécharger la lettre (PDF)"
              : "Télécharger la lettre de motivation (PDF)"}
        </button>
      ) : null}

      {hasReport && report ? (
        <button
          type="button"
          className={reportClass}
          disabled={downloading !== null}
          onClick={() => void handleDownload("report")}
        >
          {downloading === "report"
            ? "Préparation du rapport..."
            : "Télécharger le rapport complet (PDF)"}
        </button>
      ) : null}
    </div>
  );
}
