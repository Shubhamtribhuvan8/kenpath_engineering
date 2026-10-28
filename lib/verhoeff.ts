const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function checksum(digits: number[]): number {
  let c = 0;
  for (let i = 0; i < digits.length; i += 1) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c;
}

/** Verhoeff check, the digit test UIDAI uses. These numbers are invented. */
export function isValidAadhaarShape(value: string): boolean {
  if (!/^\d{12}$/.test(value) || value[0] === "0" || value[0] === "1") return false;
  const digits = value.split("").map(Number).reverse();
  return checksum(digits) === 0;
}

export function verhoeffCheckDigit(base11: string): string {
  if (!/^\d{11}$/.test(base11)) throw new Error("Aadhaar base must be 11 digits");
  const digits = base11.split("").map(Number).reverse();
  let c = 0;
  for (let i = 0; i < digits.length; i += 1) {
    c = d[c][p[(i + 1) % 8][digits[i]]];
  }
  return String(inv[c]);
}

export function aadhaarFromBase(base11: string): string {
  return base11 + verhoeffCheckDigit(base11);
}

export function corruptAadhaar(valid: string): string {
  const flipped = String((Number(valid[11]) + 1) % 10);
  return valid.slice(0, 11) + flipped;
}
