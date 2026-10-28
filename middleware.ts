import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/login") || pathname.startsWith("/api/logout")) {
    return NextResponse.next();
  }

  const officer = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (!officer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (officer) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!officer) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
