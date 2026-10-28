"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Assistance } from "@/lib/assist";
import { findApplication } from "@/lib/applications";
import {
  OUTCOME_LABEL,
  addressLine,
  fileNumber,
  formatDate,
  formatWhen,
  groupAadhaar,
  inr,
  kolkataToday,
  sla,
} from "@/lib/format";
import { NOTE_MIN_CHARS, OFFICE } from "@/lib/policy";
import { reviewApplication } from "@/lib/review";
import { nextPendingId } from "@/lib/triage";
import type { Decision, Outcome } from "@/lib/types";
import { Shell } from "@/components/Shell";
import { useDesk } from "@/components/useDesk";
import { inrWords } from "@/lib/words";

const hints: Record<Outcome, string> = {
  approved: "मंजुरीची थोडक्यात नोंद. उदाहरण: कागद आणि तलाठी अहवाल जुळतो.",
  rejected: "नामंजुरीचे कारण अर्जदाराला समजेल असे लिहा.",
  returned: "नेमकी उणीव लिहा, जेणेकरून अर्जदार ती भरून परत पाठवेल.",
};

export function CaseView({ id }: { id: string }) {
  const { officer, desk, ready, reset, logout, record } = useDesk();
  const app = findApplication(id);
  const analysis = useMemo(() => (app ? reviewApplication(app) : null), [app]);
  const assistance = useAssistance(id);
  const [remarkApply, setRemarkApply] = useState<{ id: string; text: string; nonce: number } | null>(null);

  if (!ready || !officer) {
    return (
      <Shell officer={officer} onLogout={logout}>
        <main className="page">
          <p className="loading">फाइल उघडत आहोत…</p>
        </main>
      </Shell>
    );
  }

  if (!app || !analysis) {
    return (
      <Shell officer={officer} onLogout={logout} onReset={reset}>
        <main className="page">
          <Link href="/" className="back">
            पंक्तीकडे
          </Link>
          <h1>हा अर्ज नमुन्यात नाही</h1>
        </main>
      </Shell>
    );
  }

  const existing = desk.byId[app.id];
  const filedOn = formatDate(kolkataToday(-app.filedDaysAgo));
  const time = sla(app.filedDaysAgo);
  const nextId = nextPendingId(new Set(Object.keys(desk.byId)));

  return (
    <Shell officer={officer} onLogout={logout} onReset={reset}>
      <main className="page case">
        <Link href="/" className="back">
          पंक्तीकडे
        </Link>
        <header className="case-head">
          <div>
            <p className="kicker num">{fileNumber(app.id)}</p>
            <h1>
              {app.salutation} {app.applicantName}
            </h1>
            <p className="meta">{addressLine(app.village)}</p>
          </div>
          <span className={`pill ${analysis.outcome}`}>शिफारस: {OUTCOME_LABEL[analysis.outcome]}</span>
        </header>
        <section className="facts">
          <div>
            <span>वय</span>
            <strong>{app.age}</strong>
          </div>
          <div>
            <span>व्यवसाय</span>
            <strong>{app.occupationLabel}</strong>
          </div>
          <div>
            <span>उद्देश</span>
            <strong>{app.purpose}</strong>
          </div>
          <div>
            <span>घोषित उत्पन्न</span>
            <strong className="num">{inr(app.declaredAnnualIncome)}</strong>
          </div>
          <div>
            <span>दाखल दिनांक</span>
            <strong>{filedOn}</strong>
          </div>
          <div>
            <span>मुदत</span>
            <strong className={`sla ${time.kind}`}>{time.label}</strong>
          </div>
          <div>
            <span>कुटुंब</span>
            <strong>{app.familySize}</strong>
          </div>
          <div>
            <span>फी</span>
            <strong className="num">{inr(OFFICE.feeInr)} भरली</strong>
          </div>
        </section>
        <div className="layout">
          <div>
            <section className="panel">
              <h2>कागदपत्रे</h2>
              <table>
                <thead>
                  <tr>
                    <th>कागद</th>
                    <th>स्थिती</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.documents.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={`doc-${row.state}`}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ak">
                आधार: <span className="num">{groupAadhaar(app.aadhaar)}</span> · आधारावरील नाव: {app.aadhaarName}
              </p>
              <p className="ak">मोबाइल: <span className="num">{app.mobile}</span> · {app.relation}</p>
            </section>
            <section className="panel">
              <h2>उत्पन्नाची सांगड</h2>
              <table>
                <tbody>
                  {analysis.incomeLines.map((line) => (
                    <tr key={line.label}>
                      <th>{line.label}</th>
                      <td className="num">{line.value}</td>
                      <td className={`tone-${line.tone}`}>{line.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="panel">
              <h2>तलाठी अहवाल</h2>
              <blockquote className="quote">{app.talathi.note}</blockquote>
              <p className="ak">अवल कारकून शेरा: {app.akNote}</p>
            </section>
          </div>
          <aside className="side">
            <AssistantPanel
              assistance={assistance}
              onUseRemark={(text) => setRemarkApply({ id: app.id, text, nonce: Date.now() })}
            />
            <section className="panel">
              <h2>सहाय्यकाने ही साधने वापरली</h2>
              <ol className="trace">
                {analysis.trace.map((step, index) => (
                  <li key={step.id}>
                    <span className={`dot ${step.status}`} />
                    <span>
                      <span className="step num">{String(index + 1).padStart(2, "0")}</span> {step.name}
                    </span>
                    <span>{step.result}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
        <DecisionDock
          key={`${app.id}:${existing?.decidedAt ?? "open"}`}
          suggestion={analysis.outcome}
          existing={existing}
          nextId={nextId}
          officerName={officer.name}
          remarkApply={remarkApply}
          fileId={app.id}
          onSave={(outcome, note, overrode) => {
            const decision: Decision = {
              applicationId: app.id,
              outcome,
              note,
              officerName: officer.name,
              suggestion: analysis.outcome,
              overrode,
              decidedAt: new Date().toISOString(),
            };
            record(decision);
          }}
          certificate={
            existing?.outcome === "approved" ? (
              <Certificate
                name={`${app.salutation} ${app.applicantName}`}
                relation={app.relation}
                village={app.village}
                income={app.declaredAnnualIncome}
                year={app.incomeYear}
                purpose={app.purpose}
                familySize={app.familySize}
                when={formatWhen(existing.decidedAt)}
                officer={existing.officerName}
                fileId={fileNumber(app.id)}
              />
            ) : null
          }
        />
      </main>
    </Shell>
  );
}

function useAssistance(id: string): Assistance | null {
  const [assistance, setAssistance] = useState<Assistance | null>(null);
  useEffect(() => {
    let live = true;
    setAssistance(null);
    fetch(`/api/applications/${id}/assist`).then(async (response) => {
      if (!response.ok || !live) return;
      const data = (await response.json()) as Assistance;
      if (live) setAssistance(data);
    });
    return () => {
      live = false;
    };
  }, [id]);
  return assistance;
}

function AssistantPanel({ assistance, onUseRemark }: { assistance: Assistance | null; onUseRemark: (text: string) => void }) {
  if (!assistance) {
    return (
      <section className="panel">
        <h2>सहाय्यक</h2>
        <p className="loading">Claude फाइल वाचत आहे…</p>
      </section>
    );
  }
  return (
    <section className="panel assist">
      <div className="assist-kicker">
        <h2>सहाय्यक</h2>
        <span className="num">{assistance.source === "claude" ? assistance.model : "नियम सार"}</span>
      </div>
      <p className="summary">{assistance.summary}</p>
      <h3>उणीव</h3>
      {assistance.missing.length === 0 ? <p className="meta">अनिवार्य कागद उणे नाहीत.</p> : <ul className="reasons">{assistance.missing.map((item) => <li key={item}>{item}</li>)}</ul>}
      <h3>विसंगती</h3>
      {assistance.inconsistencies.length === 0 ? (
        <p className="meta">विसंगती आढळली नाही.</p>
      ) : (
        <ul className="reasons">{assistance.inconsistencies.map((item) => <li key={item}>{item}</li>)}</ul>
      )}
      <h3>शिफारस: {OUTCOME_LABEL[assistance.outcome]}</h3>
      <ul className="reasons">
        {assistance.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {assistance.watch ? <p className="watch">{assistance.watch}</p> : null}
      <p className="remark-draft">{assistance.remark}</p>
      <button className="btn" type="button" onClick={() => onUseRemark(assistance.remark)}>
        हा शेरा वापरा
      </button>
      <p className="fine">शिफारस डेस्कच्या नियमाची आहे. Claude ती मराठीत सांगतो. अंतिम निर्णय तुमचा आहे.</p>
    </section>
  );
}

function DecisionDock({
  suggestion,
  existing,
  nextId,
  officerName,
  remarkApply,
  fileId,
  onSave,
  certificate,
}: {
  suggestion: Outcome;
  existing?: Decision;
  nextId: string | null;
  officerName: string;
  remarkApply: { id: string; text: string; nonce: number } | null;
  fileId: string;
  onSave: (outcome: Outcome, note: string, overrode: boolean) => void;
  certificate: ReactNode;
}) {
  const [choice, setChoice] = useState<Outcome>(existing?.outcome ?? suggestion);
  const [note, setNote] = useState(existing?.note ?? "");
  const [overrideOk, setOverrideOk] = useState(false);
  const [editing, setEditing] = useState(!existing);
  const [error, setError] = useState("");
  const certRef = useRef<HTMLDialogElement>(null);
  const overrode = choice !== suggestion;

  useEffect(() => {
    if (!remarkApply || remarkApply.id !== fileId) return;
    setNote(remarkApply.text);
    setEditing(true);
    setError("");
  }, [remarkApply, fileId]);

  function submit() {
    if (note.trim().length < NOTE_MIN_CHARS) {
      setError(`शेरा किमान ${NOTE_MIN_CHARS} अक्षरांचा हवा.`);
      return;
    }
    if (overrode && !overrideOk) {
      setError("शिफारस बदलत असाल तर खालील नोंद निवडा.");
      return;
    }
    setError("");
    onSave(choice, note.trim(), overrode);
  }

  return (
    <div className="dock">
      <div className="dock-inner">
        {existing && !editing ? (
          <div className={`banner ${existing.outcome}`}>
            <strong>
              {OUTCOME_LABEL[existing.outcome]} नोंदले · {officerName}
            </strong>
            <p>
              {existing.overrode ? "ही शिफारस बदलून घेतलेला निर्णय. " : "शिफारसीनुसार. "}
              {existing.note}
            </p>
            <div className="links">
              <button className="btn" type="button" onClick={() => setEditing(true)}>
                निर्णय बदला
              </button>
              {existing.outcome === "approved" ? (
                <button className="btn primary" type="button" onClick={() => certRef.current?.showModal()}>
                  दाखल्याचा मसुदा
                </button>
              ) : null}
              {nextId ? (
                <Link className="btn" href={`/applications/${nextId}`}>
                  पुढील तातडीचा अर्ज
                </Link>
              ) : (
                <Link className="btn" href="/">
                  पंक्तीकडे
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="choices" role="radiogroup" aria-label="निर्णय">
              {(["approved", "rejected", "returned"] as Outcome[]).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  role="radio"
                  aria-checked={choice === outcome}
                  className="choice"
                  onClick={() => {
                    setChoice(outcome);
                    setOverrideOk(false);
                    setError("");
                  }}
                >
                  {outcome === "approved" ? "मंजूर" : outcome === "rejected" ? "नामंजूर" : "दुरुस्तीसाठी परत"}
                  <small>{outcome === suggestion ? "शिफारस" : "शिफारस वेगळी"}</small>
                </button>
              ))}
            </div>
            <label className="field">
              <span>शेरा</span>
              <textarea rows={2} value={note} placeholder={hints[choice]} onChange={(event) => setNote(event.target.value)} />
            </label>
            {overrode ? (
              <label className="check">
                <input type="checkbox" checked={overrideOk} onChange={(event) => setOverrideOk(event.target.checked)} />
                <span>ही शिफारस मी बदलत आहे. निर्णय माझा आहे.</span>
              </label>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <div className="dock-actions">
              <span className="meta">शिफारस बांधणारी नाही. दाखला तेव्हाच, जेव्हा तुम्ही मंजूर करता.</span>
              <button className={`btn ${choice === "rejected" ? "danger" : choice === "returned" ? "warn" : "primary"}`} type="button" onClick={submit}>
                {overrode ? "शिफारस बदलून नोंदवा" : `${OUTCOME_LABEL[choice]} नोंदवा`}
              </button>
            </div>
          </>
        )}
      </div>
      <dialog ref={certRef}>
        {certificate}
        <div className="links no-print" style={{ marginTop: "0.8rem" }}>
          <button className="btn" type="button" onClick={() => window.print()}>
            छापा
          </button>
          <button className="btn" type="button" onClick={() => certRef.current?.close()}>
            बंद करा
          </button>
        </div>
      </dialog>
    </div>
  );
}

function Certificate({
  name,
  relation,
  village,
  income,
  year,
  purpose,
  familySize,
  when,
  officer,
  fileId,
}: {
  name: string;
  relation: string;
  village: string;
  income: number;
  year: string;
  purpose: string;
  familySize: number;
  when: string;
  officer: string;
  fileId: string;
}) {
  return (
    <article className="certificate">
      <header>
        <p className="kicker">{OFFICE.state}</p>
        <p className="kicker">{OFFICE.department}</p>
        <h2 className="cert-title">उत्पन्नाचा दाखला</h2>
        <p className="num">
          तहसील कार्यालय, {OFFICE.taluka} · {fileId}
        </p>
      </header>
      <p className="watermark">नमुना</p>
      <p>
        प्रमाणित करण्यात येते की {name}, {relation}, रा. {addressLine(village)}, यांचे सन {year} चे वार्षिक उत्पन्न {inr(income)} (
        {inrWords(income)}) आहे.
      </p>
      <p>हा दाखला {purpose} या कारणासाठी आहे. कुटुंब संख्या {familySize}.</p>
      <div className="cert-foot">
        <p>
          ठिकाण: {OFFICE.taluka}
          <br />
          दिनांक: {when}
        </p>
        <p className="cert-sign">
          {officer}
          <br />
          {OFFICE.designation}
        </p>
      </div>
      <p className="fine">हा केवळ डेमो मसुदा आहे. डिजिटल सही नाही. कोणताही वैध दाखला जारी झालेला नाही.</p>
    </article>
  );
}
