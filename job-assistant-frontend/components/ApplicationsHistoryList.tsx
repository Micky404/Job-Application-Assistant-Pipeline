"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  applicationToPdfProps,
  coverLetterFileName,
  formatFrDate,
  fullReportFileName,
} from "@/lib/pdf";
import type { SavedApplication, SavedApplicationSummary } from "@/lib/types";

const PdfDownloadActions = dynamic(() => import("@/components/PdfDownloadActions"), {
  ssr: false,
  loading: () => (
    <span className="text-sm font-semibold text-gray-600">Préparation du PDF…</span>
  ),
});

interface ApplicationsHistoryListProps {
  applications: SavedApplicationSummary[];
  details: Record<string, SavedApplication>;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

export default function ApplicationsHistoryList({
  applications,
  details,
  deletingId,
  onDelete,
}: ApplicationsHistoryListProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md">
        <p className="font-semibold text-black">
          Aucune candidature enregistrée pour le moment. Lancez un agent depuis
          l&apos;assistant pour constituer l&apos;historique.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {applications.map((application) => {
        const detail = details[application.id];
        const pdf = detail ? applicationToPdfProps(detail) : null;
        const isDeleting = deletingId === application.id;
        return (
          <article
            key={application.id}
            className="relative bg-white p-6 rounded-xl border-2 border-gray-400 shadow-md space-y-4"
          >
            <button
              type="button"
              aria-label="Supprimer cette candidature"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(application.id);
              }}
              className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="text-xs font-bold">…</span>
              ) : (
                <span aria-hidden className="text-lg font-bold leading-none">
                  ✕
                </span>
              )}
            </button>

            <div className="pr-10">
              <p className="text-sm font-semibold text-slate-600">
                {formatFrDate(application.created_at)}
              </p>
              <h2 className="text-2xl font-extrabold text-black mt-1">
                {application.company_name || "Entreprise non renseignée"}
              </h2>
              <p className="text-lg font-bold text-blue-900">
                {application.job_title || "Poste non renseigné"}
              </p>
            </div>

            <Link
              href={`/?applicationId=${application.id}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 transition-colors"
            >
              Voir / Recharger les résultats
            </Link>

            {pdf ? (
              <PdfDownloadActions
                variant="history"
                letter={pdf.letter}
                report={pdf.report}
                letterFileName={coverLetterFileName(
                  application.company_name,
                  application.job_title,
                )}
                reportFileName={fullReportFileName(
                  application.company_name,
                  application.job_title,
                )}
              />
            ) : (
              <p className="text-sm font-semibold text-gray-600">
                Chargement des documents…
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
