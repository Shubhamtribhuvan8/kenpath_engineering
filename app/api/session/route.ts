import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const jar = await cookies();
  const officer = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!officer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json(officer);
}
