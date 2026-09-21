import { fetchApplication, fetchApplications } from "./api";
import type { SavedApplication, SavedApplicationSummary } from "./types";

const EVENT_NAME = "applications:changed";
const CHANNEL_NAME = "job-assistant-applications";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (channel) return channel;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
  return channel;
}

export function notifyApplicationsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
  getChannel()?.postMessage("changed");
}

export function onApplicationsChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onWindow = () => handler();
  window.addEventListener(EVENT_NAME, onWindow);

  const ch = getChannel();
  const onMessage = () => handler();
  ch?.addEventListener("message", onMessage);

  return () => {
    window.removeEventListener(EVENT_NAME, onWindow);
    ch?.removeEventListener("message", onMessage);
  };
}

export function toApplicationSummary(record: SavedApplication): SavedApplicationSummary {
  return {
    id: record.id,
    company_name: record.company_name,
    job_title: record.job_title,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function fetchApplicationDetails(
  applications: SavedApplicationSummary[],
): Promise<Record<string, SavedApplication>> {
  const entries = await Promise.all(
    applications.map(async (item) => {
      try {
        const detail = await fetchApplication(item.id);
        return [item.id, detail] as const;
      } catch {
        return null;
      }
    }),
  );

  const details: Record<string, SavedApplication> = {};
  for (const entry of entries) {
    if (entry) details[entry[0]] = entry[1];
  }
  return details;
}

export async function loadApplicationsWithDetails(): Promise<{
  applications: SavedApplicationSummary[];
  details: Record<string, SavedApplication>;
}> {
  const applications = await fetchApplications();
  const details = await fetchApplicationDetails(applications);
  return { applications, details };
}
