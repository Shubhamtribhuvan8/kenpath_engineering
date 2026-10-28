import { inr } from "@/lib/format";
import {
  BANK_GAP_INR,
  BANK_RATIO,
  BILL_MAX_AGE_DAYS,
  INCOME_GAP_INR,
  INCOME_RATIO,
  LAND_DRY_PER_ACRE,
  LAND_IRRIGATED_PER_ACRE,
  MIN_AGE,
  OFFICE,
  PRIOR_GAP,
  PRIOR_MONTHS,
  REJECT_CODES,
  RTS_DAYS,
  RTS_NEAR_DAYS,
  SALARY_MATCH_RATIO,
} from "@/lib/policy";
import type { Application, DocumentRow, Finding, IncomeLine, Outcome, ToolTrace, TraceStatus } from "@/lib/types";
import { isValidAadhaarShape } from "@/lib/verhoeff";

type Part = { trace: ToolTrace; findings: Finding[] };

function normName(value: string): string {
  return value.normalize("NFC").replace(/\u093c/g, "").replace(/[\s\u200d]+/g, "");
}

export function landEstimate(acres: number, irrigated: boolean): number {
  const rate = irrigated ? LAND_IRRIGATED_PER_ACRE : LAND_DRY_PER_ACRE;
  return Math.round(acres * rate);
}

function proofNeed(app: Application): { required: boolean; label: string } {
  switch (app.occupation) {
    case "farm":
      return { required: true, label: "सातबारा उतारा" };
    case "salary":
      return { required: true, label: "वेतन प्रमाणपत्र" };
    case "pension":
      return { required: true, label: "पेन्शन आदेश" };
    case "business":
      return { required: true, label: "धंद्याचा पुरावा" };
    case "wage":
      return { required: false, label: "उत्पन्नाचा जोडपुरावा" };
  }
}

export function decide(findings: Finding[]): Outcome {
  if (findings.some((finding) => REJECT_CODES.has(finding.code))) return "rejected";
  if (findings.length > 0) return "returned";
  return "approved";
}

function checkDeadline(app: Application): Part {
  const left = RTS_DAYS - app.filedDaysAgo;
  let status: TraceStatus = "ok";
  let result = `${app.filedDaysAgo} दिवस झाले. ${left} दिवस शिल्लक. मर्यादा ${RTS_DAYS} दिवस.`;
  if (left < 0) {
    status = "bad";
    result = `${app.filedDaysAgo} दिवस झाले. मर्यादा ${RTS_DAYS} दिवस होती. मुदत ${-left} दिवसांनी संपली.`;
  } else if (app.filedDaysAgo >= RTS_NEAR_DAYS) {
    status = "warn";
  }
  return { findings: [], trace: { id: "deadline", name: "मुदत", result, status } };
}

function checkDocuments(app: Application): Part & { rows: DocumentRow[] } {
  const rows: DocumentRow[] = [];
  const findings: Finding[] = [];

  if (!app.photo) {
    findings.push({
      code: "MISSING_PHOTO",
      severity: "medium",
      title: "छायाचित्र नाही",
      detail: "छायाचित्र जोडलेले नाही.",
    });
    rows.push({ label: "छायाचित्र", state: "missing", note: "जोडलेले नाही" });
  } else {
    rows.push({ label: "छायाचित्र", state: "ok", note: "जोडले आहे" });
  }

  if (!app.identityProof) {
    findings.push({
      code: "MISSING_IDENTITY",
      severity: "medium",
      title: "ओळखपत्र नाही",
      detail: "ओळखपत्र जोडलेले नाही.",
    });
    rows.push({ label: "ओळखपत्र (आधार)", state: "missing", note: "जोडलेले नाही" });
  } else {
    rows.push({ label: "ओळखपत्र (आधार)", state: "ok", note: "जोडले आहे" });
  }

  if (!app.selfDeclaration.present) {
    findings.push({
      code: "MISSING_DECLARATION",
      severity: "medium",
      title: "स्वयंघोषणापत्र नाही",
      detail: "स्वयंघोषणापत्र जोडलेले नाही. उत्पन्नाच्या दाखल्यात ते अनिवार्य आहे.",
    });
    rows.push({ label: "स्वयंघोषणापत्र", state: "missing", note: "जोडलेले नाही" });
  } else if (!app.selfDeclaration.dated) {
    findings.push({
      code: "DECLARATION_UNDATED",
      severity: "medium",
      title: "स्वयंघोषणापत्रावर तारीख नाही",
      detail: "स्वयंघोषणापत्र आहे, पण त्यावर तारीख नाही.",
    });
    rows.push({ label: "स्वयंघोषणापत्र", state: "bad", note: "तारीख नाही" });
  } else {
    rows.push({ label: "स्वयंघोषणापत्र", state: "ok", note: "तारीख आहे" });
  }

  if (!app.addressProof.present) {
    findings.push({
      code: "MISSING_ADDRESS",
      severity: "medium",
      title: "पत्त्याचा पुरावा नाही",
      detail: "पत्त्याचा पुरावा जोडलेला नाही.",
    });
    rows.push({ label: "पत्त्याचा पुरावा", state: "missing", note: "जोडलेला नाही" });
  } else if (app.addressProof.ageDays !== null && app.addressProof.ageDays > BILL_MAX_AGE_DAYS) {
    findings.push({
      code: "STALE_BILL",
      severity: "medium",
      title: "पत्त्याचे बिल जुने",
      detail: `${app.addressProof.kind} ${app.addressProof.ageDays} दिवसांपूर्वीचे आहे. डेस्कची मर्यादा ${BILL_MAX_AGE_DAYS} दिवस आहे.`,
    });
    rows.push({
      label: "पत्त्याचा पुरावा",
      state: "bad",
      note: `${app.addressProof.kind} · ${app.addressProof.ageDays} दिवस जुने`,
    });
  } else {
    const age = app.addressProof.ageDays === null ? "कालमर्यादा लागू नाही" : `${app.addressProof.ageDays} दिवस`;
    rows.push({ label: "पत्त्याचा पुरावा", state: "ok", note: `${app.addressProof.kind} · ${age}` });
  }

  const proof = proofNeed(app);
  if (proof.required && !app.incomeProof.present) {
    findings.push({
      code: "MISSING_INCOME_PROOF",
      severity: "medium",
      title: `${proof.label} नाही`,
      detail: `${proof.label} जोडलेला नाही.`,
    });
    rows.push({ label: proof.label, state: "missing", note: "जोडलेला नाही" });
  } else if (app.incomeProof.present) {
    rows.push({ label: proof.label, state: "ok", note: app.incomeProof.kind });
  } else {
    rows.push({ label: proof.label, state: "ok", note: "या व्यवसायासाठी अनिवार्य नाही" });
  }

  rows.push({ label: "फी", state: "ok", note: `${inr(OFFICE.feeInr)} भरली` });

  return {
    rows,
    findings,
    trace: {
      id: "documents",
      name: "कागदपत्रे",
      status: findings.length ? "warn" : "ok",
      result: findings.length
        ? `${findings.length} उणीव: ${findings.map((finding) => finding.title).join(", ")}.`
        : "अनिवार्य कागदपत्रे पूर्ण आहेत. फी भरली आहे.",
    },
  };
}

function checkIdentity(app: Application): Part {
  const findings: Finding[] = [];
  if (app.age < MIN_AGE) {
    findings.push({
      code: "MINOR",
      severity: "medium",
      title: "अर्जदार अज्ञान",
      detail: `अर्जदार ${app.age} वर्षांचे आहेत. अज्ञान व्यक्तीचा अर्ज पालकांमार्फत यावा.`,
    });
  }
  if (!isValidAadhaarShape(app.aadhaar)) {
    findings.push({
      code: "AADHAAR_CHECK",
      severity: "medium",
      title: "आधार अंक तपासणी अयशस्वी",
      detail: "आधार क्रमांकाची तपासणी अयशस्वी. अंक चुकीचा असू शकतो, किंवा चुकीचे पत्रक जोडले गेले असू शकते.",
    });
  }
  if (normName(app.applicantName) !== normName(app.aadhaarName)) {
    findings.push({
      code: "NAME_MISMATCH",
      severity: "medium",
      title: "नाव आधाराशी जुळत नाही",
      detail: `अर्जातील नाव "${app.applicantName}" आणि आधारावरील नाव "${app.aadhaarName}" जुळत नाही.`,
    });
  }
  if (app.addressProof.present && app.addressProof.village !== app.village) {
    findings.push({
      code: "VILLAGE_MISMATCH",
      severity: "medium",
      title: "गाव पत्त्याशी जुळत नाही",
      detail: `अर्जातील गाव ${app.village} आणि पत्त्याच्या पुराव्यातील गाव ${app.addressProof.village} वेगळे आहेत.`,
    });
  }
  return {
    findings,
    trace: {
      id: "identity",
      name: "ओळख",
      status: findings.length ? "warn" : "ok",
      result: findings.length
        ? `${findings.map((finding) => finding.title).join(". ")}.`
        : `नाव जुळते. वय ${app.age}. आधार अंकाची तपासणी यशस्वी.`,
    },
  };
}

function incomeFindings(app: Application): Finding[] {
  const findings: Finding[] = [];
  const declared = app.declaredAnnualIncome;
  const yearly = [
    app.signals.monthlySalary == null ? null : ["वेतन प्रमाणपत्रातील वार्षिक रक्कम", app.signals.monthlySalary * 12],
    app.signals.monthlyPension == null ? null : ["पेन्शनची वार्षिक रक्कम", app.signals.monthlyPension * 12],
  ].filter((item): item is [string, number] => item !== null);

  for (const [label, amount] of yearly) {
    if (declared > 0 && amount / declared >= INCOME_RATIO && amount - declared >= INCOME_GAP_INR) {
      findings.push({
        code: "INCOME_CONTRADICTION",
        severity: "high",
        title: "उत्पन्न घोषणेशी विसंगत",
        detail: `${label} ${inr(amount)} आहे. घोषित उत्पन्न ${inr(declared)} आहे. फरक तुलनेच्या मर्यादेबाहेर आहे.`,
      });
    }
  }

  if (app.signals.landAcres != null) {
    const estimate = landEstimate(app.signals.landAcres, app.signals.irrigated);
    if (declared > 0 && estimate / declared >= INCOME_RATIO && estimate - declared >= INCOME_GAP_INR) {
      const water = app.signals.irrigated ? "सिंचित" : "कोरडवाहू";
      findings.push({
        code: "INCOME_CONTRADICTION",
        severity: "high",
        title: "जमिनीचा अंदाज घोषणेपेक्षा जास्त",
        detail: `जमीन ${app.signals.landAcres} एकर (${water}). मोटा अंदाज ${inr(estimate)}. दर सिंचित ${inr(LAND_IRRIGATED_PER_ACRE)} आणि कोरडवाहू ${inr(LAND_DRY_PER_ACRE)} प्रति एकर. हा कायदेशीर दर नाही. घोषणा ${inr(declared)}.`,
      });
    }
  }

  if (app.signals.bankAnnualCredit != null) {
    const amount = app.signals.bankAnnualCredit;
    if (declared > 0 && amount / declared >= BANK_RATIO && amount - declared >= BANK_GAP_INR) {
      findings.push({
        code: "INCOME_CONTRADICTION",
        severity: "high",
        title: "खाते जमा घोषणेशी विसंगत",
        detail: `खात्यातील वार्षिक जमा ${inr(amount)} आहे. ही रक्कम उत्पन्न नाही, पण घोषित ${inr(declared)} पेक्षा खूप जास्त आहे.`,
      });
    }
  }

  return findings;
}

function compareIncome(app: Application): Part {
  const findings = incomeFindings(app);
  return {
    findings,
    trace: {
      id: "income",
      name: "उत्पन्न",
      status: findings.length ? "bad" : "ok",
      result: findings.length
        ? findings.map((finding) => finding.detail).join(" ")
        : `घोषित ${inr(app.declaredAnnualIncome)}. जोडलेले संकेत विरोधात नाहीत.`,
    },
  };
}

function judgeAmount(amount: number, declared: number, kind: "income" | "bank"): Pick<IncomeLine, "note" | "tone"> {
  const low = declared * (1 - SALARY_MATCH_RATIO);
  const high = declared * (1 + SALARY_MATCH_RATIO);
  if (amount >= low && amount <= high) return { note: "घोषणेशी जुळते", tone: "ok" };
  const gap = amount - declared;
  const ratio = declared === 0 ? Number.POSITIVE_INFINITY : amount / declared;
  const bad =
    kind === "bank"
      ? ratio >= BANK_RATIO && gap >= BANK_GAP_INR
      : ratio >= INCOME_RATIO && gap >= INCOME_GAP_INR;
  if (bad) return { note: "घोषणेच्या विरोधात", tone: "bad" };
  if (amount < declared) return { note: "घोषणेखाली. इतर स्रोत असू शकतात.", tone: "ok" };
  return { note: "फरक मर्यादेत", tone: "muted" };
}

function incomeLines(app: Application): IncomeLine[] {
  const declared = app.declaredAnnualIncome;
  const lines: IncomeLine[] = [
    { label: "घोषित वार्षिक उत्पन्न", value: inr(declared), note: app.incomeNote, tone: "muted" },
  ];
  if (app.signals.monthlySalary != null) {
    const annual = app.signals.monthlySalary * 12;
    const judged = judgeAmount(annual, declared, "income");
    lines.push({
      label: "वेतन, वार्षिक",
      value: inr(annual),
      note: `${inr(app.signals.monthlySalary)} मासिक. ${judged.note}`,
      tone: judged.tone,
    });
  }
  if (app.signals.monthlyPension != null) {
    const annual = app.signals.monthlyPension * 12;
    const judged = judgeAmount(annual, declared, "income");
    lines.push({
      label: "पेन्शन, वार्षिक",
      value: inr(annual),
      note: `${inr(app.signals.monthlyPension)} मासिक. ${judged.note}`,
      tone: judged.tone,
    });
  }
  if (app.signals.landAcres != null) {
    const estimate = landEstimate(app.signals.landAcres, app.signals.irrigated);
    const judged = judgeAmount(estimate, declared, "income");
    const water = app.signals.irrigated ? "सिंचित" : "कोरडवाहू";
    lines.push({
      label: "जमिनीचा मोटा अंदाज",
      value: inr(estimate),
      note: `${app.signals.landAcres} एकर, ${water}. ${judged.note}`,
      tone: judged.tone,
    });
  }
  if (app.signals.bankAnnualCredit != null) {
    const judged = judgeAmount(app.signals.bankAnnualCredit, declared, "bank");
    lines.push({
      label: "खात्यातील वार्षिक जमा",
      value: inr(app.signals.bankAnnualCredit),
      note: `हे उत्पन्न नाही. ${judged.note}`,
      tone: judged.tone,
    });
  }
  if (app.prior) {
    const gap = Math.abs(app.prior.income - declared) / app.prior.income;
    const bad = app.prior.monthsAgo <= PRIOR_MONTHS && gap > PRIOR_GAP;
    lines.push({
      label: "आधीचा दाखला",
      value: inr(app.prior.income),
      note: `${app.prior.id}, ${app.prior.monthsAgo} महिन्यांपूर्वी`,
      tone: bad ? "bad" : "ok",
    });
  }
  return lines;
}

function checkPrior(app: Application): Part {
  if (!app.prior) {
    return {
      findings: [],
      trace: {
        id: "prior",
        name: "जुना दाखला",
        status: "ok",
        result: `${PRIOR_MONTHS} महिन्यांत आधीचा दाखला सापडला नाही.`,
      },
    };
  }
  const gap = Math.abs(app.prior.income - app.declaredAnnualIncome) / app.prior.income;
  if (app.prior.monthsAgo <= PRIOR_MONTHS && gap > PRIOR_GAP) {
    const detail = `${app.prior.monthsAgo} महिन्यांपूर्वी दाखला ${app.prior.id} मध्ये उत्पन्न ${inr(app.prior.income)} नोंदले आहे. आताची घोषणा ${inr(app.declaredAnnualIncome)} आहे.`;
    return {
      findings: [{ code: "PRIOR_CERTIFICATE", severity: "high", title: "आधीच्या दाखल्याशी फारक", detail }],
      trace: { id: "prior", name: "जुना दाखला", status: "bad", result: detail },
    };
  }
  return {
    findings: [],
    trace: {
      id: "prior",
      name: "जुना दाखला",
      status: "ok",
      result: `${app.prior.monthsAgo} महिन्यांपूर्वीचा दाखला ${inr(app.prior.income)} आहे. फरक मर्यादेत आहे.`,
    },
  };
}

function readTalathi(app: Application): Part {
  if (app.talathi.status === "contradict") {
    return {
      findings: [
        {
          code: "TALATHI_CONTRADICTION",
          severity: "high",
          title: "तलाठी अहवाल विरोधात",
          detail: app.talathi.note,
        },
      ],
      trace: { id: "talathi", name: "तलाठी अहवाल", status: "bad", result: app.talathi.note },
    };
  }
  if (app.talathi.status === "missing") {
    const detail = "तलाठी अहवाल अद्याप आलेला नाही. कागद पूर्ण दिसले तरी चौकशीशिवाय मंजूर करू नये.";
    return {
      findings: [{ code: "TALATHI_MISSING", severity: "medium", title: "तलाठी अहवाल नाही", detail }],
      trace: { id: "talathi", name: "तलाठी अहवाल", status: "warn", result: detail },
    };
  }
  return {
    findings: [],
    trace: { id: "talathi", name: "तलाठी अहवाल", status: "ok", result: app.talathi.note },
  };
}

function recommendTrace(outcome: Outcome): ToolTrace {
  const label = outcome === "approved" ? "मंजूर" : outcome === "rejected" ? "नामंजूर" : "दुरुस्तीसाठी परत";
  return {
    id: "recommend",
    name: "शिफारस",
    status: outcome === "approved" ? "ok" : outcome === "rejected" ? "bad" : "warn",
    result: `शिफारस: ${label}. हे अंतिम आदेश नाही.`,
  };
}

function reasonsFor(outcome: Outcome, findings: Finding[]): string[] {
  if (outcome === "approved") {
    return [
      "अनिवार्य कागदपत्रे पूर्ण आहेत.",
      "नाव, गाव आणि आधार अंक जुळतात.",
      "उत्पन्नाचे संकेत घोषणेच्या विरोधात नाहीत.",
      "तलाठी अहवाल सुसंगत आहे.",
    ];
  }
  return findings.map((finding) => finding.detail);
}

function summarize(app: Application, outcome: Outcome, findings: Finding[]): string {
  const head = `${app.salutation} ${app.applicantName}, ${app.village}, यांनी ${app.purpose} या कारणासाठी सन ${app.incomeYear} चे वार्षिक उत्पन्न ${inr(app.declaredAnnualIncome)} घोषित केले आहे.`;
  const mid = findings.length
    ? findings.map((finding) => finding.detail).join(" ")
    : "अनिवार्य कागदपत्रे पूर्ण आहेत. ओळख जुळते. उत्पन्नाचे संकेत घोषणेच्या विरोधात नाहीत. तलाठी अहवाल सुसंगत आहे.";
  const tail =
    outcome === "approved"
      ? "शिफारस मंजुरीची आहे."
      : outcome === "rejected"
        ? "शिफारस नामंजुरीची आहे. उणीव भरून निघणारी असेल, तर दुरुस्तीसाठी परत पाठवणे तुमच्या हाती आहे."
        : "शिफारस दुरुस्तीची आहे.";
  return `${head} ${mid} ${tail} अंतिम निर्णय तुमचा आहे.`;
}

export function reviewApplication(app: Application) {
  const deadline = checkDeadline(app);
  const documents = checkDocuments(app);
  const identity = checkIdentity(app);
  const income = compareIncome(app);
  const prior = checkPrior(app);
  const talathi = readTalathi(app);
  const findings = [documents, identity, income, prior, talathi].flatMap((part) => part.findings);
  const outcome = decide(findings);
  return {
    outcome,
    summary: summarize(app, outcome, findings),
    findings,
    reasons: reasonsFor(outcome, findings),
    trace: [deadline.trace, documents.trace, identity.trace, income.trace, prior.trace, talathi.trace, recommendTrace(outcome)],
    incomeLines: incomeLines(app),
    documents: documents.rows,
  };
}
