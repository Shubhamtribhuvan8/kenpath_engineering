export type Occupation = "salary" | "farm" | "business" | "wage" | "pension";

export type TalathiStatus = "match" | "contradict" | "missing";

export type Outcome = "approved" | "rejected" | "returned";

export type Application = {
  id: string;
  salutation: string;
  applicantName: string;
  relation: string;
  age: number;
  gender: "female" | "male";
  village: string;
  occupation: Occupation;
  occupationLabel: string;
  purpose: string;
  incomeNote: string;
  declaredAnnualIncome: number;
  incomeYear: string;
  filedDaysAgo: number;
  mobile: string;
  aadhaar: string;
  aadhaarName: string;
  familySize: number;
  akNote: string;
  photo: boolean;
  identityProof: boolean;
  selfDeclaration: { present: boolean; dated: boolean };
  addressProof: {
    present: boolean;
    kind: string;
    village: string;
    ageDays: number | null;
  };
  incomeProof: { present: boolean; kind: string };
  signals: {
    monthlySalary: number | null;
    monthlyPension: number | null;
    landAcres: number | null;
    irrigated: boolean;
    bankAnnualCredit: number | null;
  };
  talathi: { status: TalathiStatus; note: string };
  prior: { monthsAgo: number; income: number; id: string } | null;
};

export type Finding = {
  code: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
};

export type TraceStatus = "ok" | "warn" | "bad" | "info";

export type ToolTrace = {
  id: string;
  name: string;
  result: string;
  status: TraceStatus;
};

export type IncomeLine = {
  label: string;
  value: string;
  note: string;
  tone: "ok" | "bad" | "muted";
};

export type DocumentRow = {
  label: string;
  state: "ok" | "missing" | "bad";
  note: string;
};

export type Analysis = {
  outcome: Outcome;
  summary: string;
  findings: Finding[];
  reasons: string[];
  trace: ToolTrace[];
  incomeLines: IncomeLine[];
  documents: DocumentRow[];
};

export type Decision = {
  applicationId: string;
  outcome: Outcome;
  note: string;
  officerName: string;
  suggestion: Outcome;
  overrode: boolean;
  decidedAt: string;
};

export type Officer = {
  username: string;
  name: string;
  role: string;
};

export type Bucket = "scrutiny" | "deadline" | "clear" | "fix";
