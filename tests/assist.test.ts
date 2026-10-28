import { describe, expect, it } from "vitest";
import { parseClaudeBrief } from "@/lib/assist";

describe("Claude brief parser", () => {
  it("reads a fenced JSON brief and ignores a conflicting outcome", () => {
    const raw = `Here is the brief:
\`\`\`json
{
  "summary": "विकास जाधव यांनी शुल्क सवलतीसाठी ₹2,40,000 दाखवले आहे. खात्यातील जमा त्यापेक्षा खूप जास्त आहे.",
  "missing": [],
  "inconsistencies": ["खात्यातील वार्षिक जमा ₹8,40,000 घोषित उत्पन्नापेक्षा खूप जास्त आहे."],
  "outcome": "approved",
  "reasons": ["जमा ही उत्पन्न नाही, पण फरक मोठा आहे.", "तलाठीने खातेवही पाहिली नाही."],
  "remark": "खात्यातील जमा घोषित उत्पन्नाशी जुळत नाही. स्पष्टीकरणाशिवाय दाखला देता येणार नाही.",
  "watch": "नामंजूर करण्यापूर्वी अर्जदाराला स्पष्टीकरण मागायचे का ते ठरवा."
}
\`\`\``;
    const brief = parseClaudeBrief(raw);
    expect(brief?.inconsistencies).toHaveLength(1);
    expect(brief?.remark.startsWith("खात्यातील जमा")).toBe(true);
    expect(brief?.reasons).toHaveLength(2);
  });

  it("rejects a brief that has no usable remark", () => {
    expect(parseClaudeBrief('{"summary":"ok","reasons":["एक"],"remark":"छोटे"}')).toBeNull();
  });
});
