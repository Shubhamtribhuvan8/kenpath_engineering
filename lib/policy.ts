export const RTS_DAYS = 15;
export const RTS_NEAR_DAYS = 12;
export const BILL_MAX_AGE_DAYS = 180;
export const PRIOR_MONTHS = 12;
export const PRIOR_GAP = 0.4;
export const INCOME_RATIO = 1.5;
export const INCOME_GAP_INR = 50_000;
export const BANK_RATIO = 2;
export const BANK_GAP_INR = 100_000;
export const LAND_IRRIGATED_PER_ACRE = 18_000;
export const LAND_DRY_PER_ACRE = 8_000;
export const MIN_AGE = 18;
export const NOTE_MIN_CHARS = 12;
export const SALARY_MATCH_RATIO = 0.2;

export const OFFICE = {
  state: "महाराष्ट्र शासन",
  department: "महसूल विभाग",
  service: "उत्पन्नाचा दाखला",
  taluka: "छत्रपती संभाजीनगर",
  district: "छत्रपती संभाजीनगर",
  designation: "नायब तहसीलदार",
  appellate: "तहसीलदार",
  act: "महाराष्ट्र लोकसेवा हक्क अधिनियम, २०१५",
  feeInr: 20,
} as const;

export const REJECT_CODES = new Set([
  "TALATHI_CONTRADICTION",
  "PRIOR_CERTIFICATE",
  "INCOME_CONTRADICTION",
]);
