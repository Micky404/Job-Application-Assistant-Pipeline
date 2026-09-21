"use client";

import { useCallback, useEffect, useState } from "react";
import ApplicationsHistoryList from "@/components/ApplicationsHistoryList";
import { deleteApplication, fetchApplications } from "@/lib/api";
import {
  fetchApplicationDetails,
  notifyApplicationsChanged,
  onApplicationsChanged,
} from "@/lib/applications-sync";
import type { SavedApplication, SavedApplicationSummary } from "@/lib/types";

export default function HistoryPage() {
  const [applications, setApplications] = useState<SavedApplicationSummary[]>([]);
  const [details, setDetails] = useState<Record<string, SavedApplication>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refreshApplications = useCallback(async () => {
    const list = await fetchApplications();
    setApplications(list);
    setError("");
    setLoading(false);
    const nextDetails = await fetchApplicationDetails(list);
    setDetails(nextDetails);
    return list;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await refreshApplications();
      } catch {
        setError("Impossible de charger l'historique des candidatures.");
      } finally {
        setLoading(false);
      }
    };

    void load();
    const unsubscribe = onApplicationsChanged(() => {
      void refreshApplications().catch(() => undefined);
    });
    const onFocus = () => {
      void refreshApplications().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshApplications]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette candidature de l'historique ?")) return;

    setDeletingId(id);
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
      setDetails((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      notifyApplicationsChanged();
    } catch {
      alert("Impossible de supprimer cette candidature.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-black">Historique des candidatures</h1>
          <p className="mt-2 text-black font-medium">
            Retrouvez vos lettres, rapports et résultats d&apos;agents déjà générés.
          </p>
        </div>

        {loading ? (
          <p className="font-semibold text-black">Chargement de l&apos;historique…</p>
        ) : error ? (
          <p className="font-semibold text-red-700">{error}</p>
        ) : (
          <ApplicationsHistoryList
            applications={applications}
            details={details}
            deletingId={deletingId}
            onDelete={(id) => void handleDelete(id)}
          />
        )}
      </div>
    </main>
  );
}
