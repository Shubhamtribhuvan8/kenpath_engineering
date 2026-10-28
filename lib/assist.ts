import type { Analysis, Application, Outcome } from "@/lib/types";

const MISSING_CODES = new Set([
  "MISSING_PHOTO",
  "MISSING_IDENTITY",
  "MISSING_DECLARATION",
  "DECLARATION_UNDATED",
  "MISSING_ADDRESS",
  "STALE_BILL",
  "MISSING_INCOME_PROOF",
  "AADHAAR_CHECK",
  "TALATHI_MISSING",
  "MINOR",
]);

const INCONSISTENCY_CODES = new Set([
  "NAME_MISMATCH",
  "VILLAGE_MISMATCH",
  "INCOME_CONTRADICTION",
  "PRIOR_CERTIFICATE",
  "TALATHI_CONTRADICTION",
]);

export type ClaudeBrief = {
  summary: string;
  missing: string[];
  inconsistencies: string[];
  reasons: string[];
  remark: string;
  watch: string;
};

export type Assistance = ClaudeBrief & {
  source: "claude" | "desk";
  model: string | null;
  outcome: Outcome;
};

export function dossierFor(app: Application, analysis: Analysis): string {
  return JSON.stringify(
    {
      file: app.id,
      applicant: {
        name: `${app.salutation} ${app.applicantName}`,
        relation: app.relation,
        age: app.age,
        village: app.village,
        occupation: app.occupationLabel,
        purpose: app.purpose,
        incomeNote: app.incomeNote,
        declaredAnnualIncome: app.declaredAnnualIncome,
        incomeYear: app.incomeYear,
        familySize: app.familySize,
        filedDaysAgo: app.filedDaysAgo,
      },
      aadhaarName: app.aadhaarName,
      documents: analysis.documents,
      incomeLines: analysis.incomeLines,
      talathi: app.talathi,
      previousOfficerNote: app.akNote,
      priorCertificate: app.prior,
      checks: analysis.trace.map((step) => ({ tool: step.name, result: step.result, status: step.status })),
      findings: analysis.findings.map((finding) => ({
        title: finding.title,
        detail: finding.detail,
        severity: finding.severity,
      })),
      policyOutcome: analysis.outcome,
      policyReasons: analysis.reasons,
    },
    null,
    2,
  );
}

export const ASSIST_SYSTEM = `You brief a Nayab Tehsildar in Chhatrapati Sambhajinagar before she decides an income certificate (उत्पन्नाचा दाखला).
Write in clear Marathi, as a careful colleague, not as a form letter.
The policyOutcome in the dossier is already decided by desk rules. Explain that outcome. Do not choose a different one.
A late or near deadline never changes policyOutcome. If the file is clean and late, tell her the 15-day limit is already over so she should sign today. Do not say lateness is a reason to reject.
Use only facts in the dossier. Do not invent documents, amounts, names, villages, or visits. Do not treat श्री, श्रीमती, or कुमारी as a name mismatch. If findings are empty, watch should only mention the deadline, not a new doubt.
Return one JSON object and no other text:
{
  "summary": "3 to 5 sentences. Who applied, for what, the declared income, what matters on this file, and the suggestion.",
  "missing": ["each missing or defective document. Empty array if nothing is missing."],
  "inconsistencies": ["each contradiction between the declaration and the evidence. Empty array if none."],
  "reasons": ["2 to 4 short reasons for the policy outcome"],
  "remark": "a draft शेरा she can edit. One or two specific sentences she could put on the file or send back to the citizen.",
  "watch": "the single thing she should look at before she signs. One sentence."
}`;

function asStrings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function parseClaudeBrief(raw: string): ClaudeBrief | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const remark = typeof record.remark === "string" ? record.remark.trim() : "";
  const watch = typeof record.watch === "string" ? record.watch.trim() : "";
  const reasons = asStrings(record.reasons, 5);
  if (!summary || reasons.length === 0 || remark.length < 12) return null;
  return {
    summary,
    missing: asStrings(record.missing, 8),
    inconsistencies: asStrings(record.inconsistencies, 8),
    reasons,
    remark,
    watch,
  };
}

export function deskBrief(analysis: Analysis): ClaudeBrief {
  const missing = analysis.findings.filter((finding) => MISSING_CODES.has(finding.code)).map((finding) => finding.detail);
  const inconsistencies = analysis.findings
    .filter((finding) => INCONSISTENCY_CODES.has(finding.code))
    .map((finding) => finding.detail);
  return {
    summary: analysis.summary,
    missing,
    inconsistencies,
    reasons: analysis.reasons,
    remark: analysis.reasons.join(" "),
    watch: analysis.findings[0]?.detail ?? "कागद आणि तलाठी अहवाल शेवटी एकदा तपासा.",
  };
}

export function fillGaps(brief: ClaudeBrief, analysis: Analysis): ClaudeBrief {
  const local = deskBrief(analysis);
  return {
    ...brief,
    missing: brief.missing.length > 0 ? brief.missing : local.missing,
    inconsistencies: brief.inconsistencies.length > 0 ? brief.inconsistencies : local.inconsistencies,
  };
}
