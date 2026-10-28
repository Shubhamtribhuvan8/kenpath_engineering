import { OFFICE, RTS_DAYS, RTS_NEAR_DAYS } from "@/lib/policy";
import type { Bucket, Outcome } from "@/lib/types";

const MONTHS = [
  "जानेवारी",
  "फेब्रुवारी",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "ऑक्टोबर",
  "नोव्हेंबर",
  "डिसेंबर",
];

export function kolkataToday(offsetDays = 0): Date {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = stamp.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays));
}

export function formatDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, d] = day.split("-").map(Number);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${d} ${MONTHS[month - 1]} ${year}, ${time}`;
}

export function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fileNumber(id: string): string {
  return `उत्प/${id}`;
}

export function groupAadhaar(value: string): string {
  return value.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export type SlaKind = "ok" | "near" | "over";

export function sla(filedDaysAgo: number): { kind: SlaKind; label: string } {
  const left = RTS_DAYS - filedDaysAgo;
  if (left < 0) return { kind: "over", label: `मुदत संपली · ${-left} दिवस` };
  if (filedDaysAgo >= RTS_NEAR_DAYS) return { kind: "near", label: `${left} दिवस शिल्लक` };
  return { kind: "ok", label: `${left} दिवस शिल्लक` };
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  approved: "मंजूर",
  rejected: "नामंजूर",
  returned: "दुरुस्ती",
};

export const BUCKET_TITLE: Record<Bucket, string> = {
  scrutiny: "चौकशी हवी",
  deadline: "मुदत जवळ किंवा संपली",
  clear: "आज निकाल द्या",
  fix: "दुरुस्तीची रांग",
};

export const BUCKET_NOTE: Record<Bucket, string> = {
  scrutiny: "शिफारस नामंजुरीची आहे. खोटेपणा दुरुस्त होऊ शकत असेल, तर परत पाठवणे तुमच्या हाती आहे.",
  deadline: `लोकसेवा हक्काची मर्यादा ${RTS_DAYS} दिवस. स्वच्छ असेल तर आज काढा, उणीव असेल तर आजच परत पाठवा.`,
  clear: "कागद, ओळख आणि तलाठी अहवाल जुळतात. जुने अर्ज आधी निकालात काढा, म्हणजे ते मुदतीत अडकणार नाहीत.",
  fix: "कागद किंवा जुळणी अधूरी आहे. मुदत अजून आहे, पण अर्जदाराला नेमकी उणीव कळायला हवी.",
};

export function addressLine(village: string): string {
  return `${village}, ता. ${OFFICE.taluka}, जि. ${OFFICE.district}`;
}
