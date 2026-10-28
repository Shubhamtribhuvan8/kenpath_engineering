import { applications } from "@/lib/applications";
import { sla } from "@/lib/format";
import { RTS_NEAR_DAYS } from "@/lib/policy";
import { reviewApplication } from "@/lib/review";
import type { Analysis, Application, Bucket } from "@/lib/types";

const ORDER: Bucket[] = ["scrutiny", "deadline", "clear", "fix"];

export function bucketOf(app: Application, analysis: Analysis): Bucket {
  if (analysis.outcome === "rejected") return "scrutiny";
  if (app.filedDaysAgo >= RTS_NEAR_DAYS) return "deadline";
  if (analysis.outcome === "approved") return "clear";
  return "fix";
}

export function sortInBucket(rows: Application[]): Application[] {
  return [...rows].sort((a, b) => b.filedDaysAgo - a.filedDaysAgo || a.id.localeCompare(b.id));
}

export function rowReason(app: Application, analysis: Analysis, bucket: Bucket): string {
  if (bucket === "deadline" && analysis.findings.length === 0) {
    return sla(app.filedDaysAgo).kind === "over"
      ? "मुदत संपली आहे, पण फाइल स्वच्छ आहे. आज मंजूर करता येईल."
      : "मुदत जवळ आहे आणि फाइल स्वच्छ आहे.";
  }
  return analysis.findings[0]?.title ?? "निकालासाठी तयार";
}

export function nextPendingId(decided: Set<string>): string | null {
  for (const bucket of ORDER) {
    const rows = sortInBucket(
      applications.filter((app) => !decided.has(app.id) && bucketOf(app, reviewApplication(app)) === bucket),
    );
    if (rows[0]) return rows[0].id;
  }
  return null;
}
