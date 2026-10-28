import type { Decision } from "@/lib/types";

const KEY = "nivada-desk-v1";

export type DeskState = {
  byId: Record<string, Decision>;
  audit: Decision[];
};

const empty: DeskState = { byId: {}, audit: [] };

export function loadDesk(): DeskState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as DeskState;
    if (!parsed || typeof parsed.byId !== "object" || !Array.isArray(parsed.audit)) return empty;
    return parsed;
  } catch {
    return empty;
  }
}

export function saveDecision(current: DeskState, decision: Decision): DeskState {
  const next: DeskState = {
    byId: { ...current.byId, [decision.applicationId]: decision },
    audit: [decision, ...current.audit.filter((item) => item.applicationId !== decision.applicationId)],
  };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearDesk(): DeskState {
  window.localStorage.removeItem(KEY);
  return empty;
}
