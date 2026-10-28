"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("नाव किंवा पासवर्ड चुकीचा आहे.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="form-card">
      <h2>प्रवेश</h2>
      <p className="meta">नायब तहसीलदार डेस्क. प्रवेश स्वतंत्रपणे दिला जातो.</p>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>वापरकर्ता नाव</span>
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          <span>पासवर्ड</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "तपासत आहोत…" : "प्रवेश करा"}
        </button>
      </form>
      <p className="fine">आधी हे तीन अर्ज पाहा: उत्प/1054, उत्प/1042, उत्प/1055.</p>
    </div>
  );
}
