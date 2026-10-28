"use client";

import { useEffect, useState } from "react";
import { clearDesk, loadDesk, saveDecision, type DeskState } from "@/lib/storage";
import type { Decision, Officer } from "@/lib/types";

export function useDesk() {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [desk, setDesk] = useState<DeskState>({ byId: {}, audit: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/session").then(async (response) => {
      if (!response.ok) {
        window.location.href = "/login";
        return;
      }
      const data = (await response.json()) as Officer;
      if (live) setOfficer(data);
    });
    setDesk(loadDesk());
    setReady(true);
    return () => {
      live = false;
    };
  }, []);

  function reset() {
    if (!window.confirm("नोंदवलेले निर्णय पुसून नमुना पंक्ती परत आणायची?")) return;
    setDesk(clearDesk());
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function record(decision: Decision) {
    setDesk((current) => saveDecision(current, decision));
  }

  return { officer, desk, ready, reset, logout, record };
}
