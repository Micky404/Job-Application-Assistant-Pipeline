import type {
  BackendCandidateInfo,
  CandidateInfo,
  SaveApplicationPayload,
  SavedApplication,
  SavedApplicationSummary,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function mapCandidateInfo(
  info?: BackendCandidateInfo | CandidateInfo | null,
): CandidateInfo {
  if (!info) {
    return {
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      candidateLocation: "",
    };
  }

  const backend = info as BackendCandidateInfo;
  const frontend = info as CandidateInfo;
  const fullName =
    frontend.candidateName ||
    backend.full_name ||
    [backend.first_name, backend.last_name].filter(Boolean).join(" ").trim();

  return {
    candidateName: fullName,
    candidateEmail: frontend.candidateEmail || backend.email || "",
    candidatePhone: frontend.candidatePhone || backend.phone || "",
    candidateLocation: frontend.candidateLocation || backend.location || "",
  };
}

export async function saveApplication(
  payload: SaveApplicationPayload,
): Promise<SavedApplication> {
  const res = await fetch(`${API_URL}/api/applications/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Impossible d'enregistrer la candidature.");
  }
  return res.json();
}

export async function fetchApplications(): Promise<SavedApplicationSummary[]> {
  const res = await fetch(`${API_URL}/api/applications`);
  if (!res.ok) {
    throw new Error("Impossible de charger l'historique.");
  }
  const data = await res.json();
  return data.applications ?? [];
}

export async function fetchApplication(
  id: string,
): Promise<SavedApplication> {
  const res = await fetch(`${API_URL}/api/applications/${id}`);
  if (!res.ok) {
    throw new Error("Candidature introuvable.");
  }
  return res.json();
}

export async function deleteApplication(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_URL}/api/applications/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Impossible de supprimer la candidature.");
  }
  return res.json();
}
