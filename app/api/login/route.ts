import { NextResponse } from "next/server";
import { sessionCookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";
import { authenticate } from "@/lib/users";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("username" in body) || !("password" in body)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const record = body as { username: unknown; password: unknown };
  const officer = await authenticate(String(record.username), String(record.password));
  if (!officer) {
    return NextResponse.json({ error: "नाव किंवा पासवर्ड चुकीचा आहे." }, { status: 401 });
  }
  const response = NextResponse.json(officer);
  response.cookies.set(SESSION_COOKIE, await signSession(officer), sessionCookieOptions());
  return response;
}
