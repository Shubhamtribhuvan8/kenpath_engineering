import type { Officer } from "@/lib/types";

function account(): { username: string; password: string } {
  return {
    username: process.env.NIVADA_OFFICER_USERNAME?.trim() ?? "",
    password: process.env.NIVADA_OFFICER_PASSWORD ?? "",
  };
}

function officer(): Officer {
  return {
    username: account().username,
    name: "मेघा कुलकर्णी",
    role: "नायब तहसीलदार",
  };
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(bytes);
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a[i] ^ b[i];
  return out === 0;
}

export async function authenticate(username: string, password: string): Promise<Officer | null> {
  const expected = account();
  if (!expected.username || !expected.password) return null;
  const [givenUser, givenPass, realUser, realPass] = await Promise.all([
    digest(username),
    digest(password),
    digest(expected.username),
    digest(expected.password),
  ]);
  if (givenUser.length !== realUser.length || givenPass.length !== realPass.length) return null;
  if (!equalBytes(givenUser, realUser) || !equalBytes(givenPass, realPass)) return null;
  return officer();
}
