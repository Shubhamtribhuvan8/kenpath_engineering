import { findApplication } from "@/lib/applications";
import { ASSIST_SYSTEM, deskBrief, dossierFor, fillGaps, parseClaudeBrief, type Assistance } from "@/lib/assist";
import { reviewApplication } from "@/lib/review";
import { NextResponse } from "next/server";

const cache = new Map<string, Assistance>();
const BRIEF_VERSION = 3;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = findApplication(id);
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });

  const cached = cache.get(`${BRIEF_VERSION}:${id}`);
  if (cached) return NextResponse.json(cached);

  const analysis = reviewApplication(app);
  const model = process.env.ANTHROPIC_MODEL?.trim() || "";
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() || "";
  if (!apiKey || !model) {
    return NextResponse.json(localAssistance(analysis));
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        temperature: 0.2,
        system: ASSIST_SYSTEM,
        messages: [{ role: "user", content: dossierFor(app, analysis) }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) {
      return NextResponse.json(localAssistance(analysis));
    }
    const payload = (await response.json()) as { content?: { type: string; text?: string }[]; model?: string };
    const text = payload.content?.filter((block) => block.type === "text").map((block) => block.text ?? "").join("\n") ?? "";
    const parsed = parseClaudeBrief(text);
    if (!parsed) return NextResponse.json(localAssistance(analysis));
    const assistance: Assistance = {
      ...fillGaps(parsed, analysis),
      source: "claude",
      model: payload.model || model,
      outcome: analysis.outcome,
    };
    cache.set(`${BRIEF_VERSION}:${id}`, assistance);
    return NextResponse.json(assistance);
  } catch {
    return NextResponse.json(localAssistance(analysis));
  }
}

function localAssistance(analysis: ReturnType<typeof reviewApplication>): Assistance {
  return { ...deskBrief(analysis), source: "desk", model: null, outcome: analysis.outcome };
}
