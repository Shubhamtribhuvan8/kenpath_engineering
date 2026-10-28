import { describe, expect, it } from "vitest";
import { applications } from "@/lib/applications";
import { bucketOf } from "@/lib/triage";
import { reviewApplication } from "@/lib/review";
import { isValidAadhaarShape } from "@/lib/verhoeff";
import { inrWords } from "@/lib/words";

const byId = Object.fromEntries(applications.map((app) => [app.id, app]));

function outcome(id: string) {
  return reviewApplication(byId[id]).outcome;
}

function bucket(id: string) {
  const app = byId[id];
  return bucketOf(app, reviewApplication(app));
}

describe("income-certificate desk", () => {
  it("sorts the sample queue the way an officer should see it", () => {
    expect(outcome("1041")).toBe("approved");
    expect(bucket("1041")).toBe("deadline");
    expect(outcome("1042")).toBe("rejected");
    expect(reviewApplication(byId["1042"]).findings.map((finding) => finding.code)).toContain("INCOME_CONTRADICTION");
    expect(outcome("1043")).toBe("rejected");
    expect(reviewApplication(byId["1043"]).findings.map((finding) => finding.code)).toContain("TALATHI_CONTRADICTION");
    expect(outcome("1044")).toBe("rejected");
    expect(reviewApplication(byId["1044"]).findings.map((finding) => finding.code)).toContain("PRIOR_CERTIFICATE");
    expect(outcome("1045")).toBe("returned");
    expect(bucket("1045")).toBe("deadline");
    expect(reviewApplication(byId["1046"]).findings.map((finding) => finding.code).sort()).toEqual([
      "NAME_MISMATCH",
      "VILLAGE_MISMATCH",
    ]);
    expect(outcome("1047")).toBe("returned");
    expect(outcome("1048")).toBe("returned");
    expect(reviewApplication(byId["1048"]).findings.map((finding) => finding.code)).toContain("MINOR");
    expect(outcome("1049")).toBe("returned");
    expect(outcome("1050")).toBe("approved");
    expect(bucket("1050")).toBe("clear");
    expect(outcome("1051")).toBe("approved");
    expect(bucket("1051")).toBe("clear");
    expect(outcome("1052")).toBe("returned");
    expect(reviewApplication(byId["1052"]).findings.map((finding) => finding.code)).toContain("AADHAAR_CHECK");
    expect(outcome("1053")).toBe("returned");
    expect(outcome("1054")).toBe("approved");
    expect(bucket("1054")).toBe("deadline");
    expect(reviewApplication(byId["1055"]).findings.map((finding) => finding.code)).toEqual(["TALATHI_MISSING"]);
    expect(bucket("1055")).toBe("fix");
  });

  it("does not call a higher farm declaration fraud when the land estimate is lower", () => {
    const analysis = reviewApplication(byId["1054"]);
    expect(analysis.findings).toEqual([]);
    expect(analysis.incomeLines.find((line) => line.label.startsWith("जमिनीचा"))?.tone).toBe("ok");
  });

  it("grounds every brief in that file and ends with the officer", () => {
    for (const app of applications) {
      const analysis = reviewApplication(app);
      expect(analysis.summary).toContain(app.applicantName);
      expect(analysis.summary.endsWith("अंतिम निर्णय तुमचा आहे.")).toBe(true);
      expect(analysis.trace.map((step) => step.id)).toEqual([
        "deadline",
        "documents",
        "identity",
        "income",
        "prior",
        "talathi",
        "recommend",
      ]);
    }
  });
});

describe("sample aadhaar numbers", () => {
  it("passes the checksum except the one planted failure", () => {
    for (const app of applications) {
      expect(isValidAadhaarShape(app.aadhaar)).toBe(app.id !== "1052");
    }
  });
});

describe("certificate words", () => {
  it("reads the sample amounts in Marathi", () => {
    expect(inrWords(216000)).toBe("दोन लाख सोळा हजार रुपये");
    expect(inrWords(240000)).toBe("दोन लाख चाळीस हजार रुपये");
    expect(inrWords(60000)).toBe("साठ हजार रुपये");
    expect(inrWords(90000)).toBe("नव्वद हजार रुपये");
    expect(inrWords(48000)).toBe("अठ्ठेचाळीस हजार रुपये");
    expect(inrWords(12000)).toBe("बारा हजार रुपये");
    expect(inrWords(144000)).toBe("एक लाख चव्वेचाळीस हजार रुपये");
    expect(inrWords(84000)).toBe("चौऱ्याऐंशी हजार रुपये");
    expect(inrWords(96000)).toBe("शहाण्णव हजार रुपये");
    expect(inrWords(72000)).toBe("बाहत्तर हजार रुपये");
    expect(inrWords(108000)).toBe("एक लाख आठ हजार रुपये");
    expect(inrWords(150000)).toBe("एक लाख पन्नास हजार रुपये");
    expect(inrWords(120000)).toBe("एक लाख वीस हजार रुपये");
    expect(inrWords(320000)).toBe("तीन लाख वीस हजार रुपये");
  });
});
