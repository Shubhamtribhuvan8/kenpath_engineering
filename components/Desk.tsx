"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { applications } from "@/lib/applications";
import { BUCKET_NOTE, BUCKET_TITLE, OUTCOME_LABEL, fileNumber, formatWhen, sla } from "@/lib/format";
import { reviewApplication } from "@/lib/review";
import { bucketOf, rowReason, sortInBucket } from "@/lib/triage";
import type { Bucket } from "@/lib/types";
import { Shell } from "@/components/Shell";
import { useDesk } from "@/components/useDesk";

const buckets: Bucket[] = ["scrutiny", "deadline", "clear", "fix"];

export function Desk() {
  const { officer, desk, ready, reset, logout } = useDesk();
  const [query, setQuery] = useState("");
  const analyses = useMemo(() => new Map(applications.map((app) => [app.id, reviewApplication(app)])), []);

  if (!ready || !officer) {
    return (
      <Shell officer={officer} onLogout={logout}>
        <main className="page">
          <p className="loading">पटल उघडत आहोत…</p>
        </main>
      </Shell>
    );
  }

  const pending = applications.filter((app) => !desk.byId[app.id]);
  const needle = query.trim();
  const visible = pending.filter((app) => {
    if (!needle) return true;
    return [app.applicantName, app.village, app.id, fileNumber(app.id), app.purpose, app.occupationLabel].some((value) =>
      value.includes(needle),
    );
  });
  const counts = Object.fromEntries(
    buckets.map((bucket) => [bucket, pending.filter((app) => bucketOf(app, analyses.get(app.id)!) === bucket).length]),
  ) as Record<Bucket, number>;
  const groups = buckets
    .map((bucket) => ({
      bucket,
      rows: sortInBucket(visible.filter((app) => bucketOf(app, analyses.get(app.id)!) === bucket)),
    }))
    .filter((group) => group.rows.length > 0);
  const audit = desk.audit.filter((item) => {
    if (!needle) return true;
    const app = applications.find((row) => row.id === item.applicationId);
    return [app?.applicantName, app?.village, item.applicationId, item.note, fileNumber(item.applicationId)].some((value) =>
      value?.includes(needle),
    );
  });

  return (
    <Shell officer={officer} onLogout={logout} onReset={reset}>
      <main className="page">
        <p className="sample">काल्पनिक अर्ज. या पंक्तीत कोणताही खरा नागरिक नाही.</p>
        <section className="stats" aria-label="पंक्तीची स्थिती">
          <div className="stat stat-pending">
            <strong>{pending.length}</strong>
            <span>प्रलंबित</span>
          </div>
          <div className="stat stat-scrutiny">
            <strong>{counts.scrutiny}</strong>
            <span>चौकशी</span>
          </div>
          <div className="stat stat-deadline">
            <strong>{counts.deadline}</strong>
            <span>मुदत</span>
          </div>
          <div className="stat stat-clear">
            <strong>{counts.clear}</strong>
            <span>आज निकाल</span>
          </div>
          <div className="stat stat-fix">
            <strong>{counts.fix}</strong>
            <span>दुरुस्ती</span>
          </div>
        </section>
        <p className="intro">
          ही पंक्ती नायब तहसीलदारांच्या टेबलावरचे प्रलंबित उत्पन्नाचे दाखले आहे. आधी चौकशी, मग मुदत संपलेले अर्ज. स्वच्छ फाइल मुदतीत गाडून ठेवायची नाही.
        </p>
        <div className="toolbar">
          <label className="search">
            <span>शोध</span>
            <input
              type="search"
              value={query}
              placeholder="नाव, गाव किंवा अर्ज क्रमांक"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {groups.length === 0 ? (
          <p>{pending.length === 0 ? "पंक्ती रिकामी आहे. नमुना रीसेट केल्यास अर्ज परत येतील." : "या शोधात प्रलंबित अर्ज नाही."}</p>
        ) : (
          groups.map((group) => (
            <section className={`section section-${group.bucket}`} key={group.bucket}>
              <h2>
                {BUCKET_TITLE[group.bucket]}
                <span className="count">{group.rows.length}</span>
              </h2>
              <p>{BUCKET_NOTE[group.bucket]}</p>
              <div className="list">
                {group.rows.map((app) => {
                  const analysis = analyses.get(app.id)!;
                  const time = sla(app.filedDaysAgo);
                  return (
                    <Link key={app.id} href={`/applications/${app.id}`} className={`row ${group.bucket}`}>
                      <span className="file-id num">{fileNumber(app.id)}</span>
                      <span className="who">
                        <span className="name">{app.applicantName}</span>
                        <span className="meta">
                          {app.village} · {app.occupationLabel} · {app.filedDaysAgo} दिवस
                        </span>
                      </span>
                      <span className={`pill ${analysis.outcome}`}>{OUTCOME_LABEL[analysis.outcome]}</span>
                      <span className="why">{rowReason(app, analysis, group.bucket)}</span>
                      <span className={`sla ${time.kind}`}>{time.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
        {audit.length > 0 ? (
          <section className="section">
            <h2>
              नोंदवलेले निर्णय
              <span className="count">{audit.length}</span>
            </h2>
            <div className="list">
              {audit.map((item) => {
                const app = applications.find((row) => row.id === item.applicationId);
                return (
                  <Link key={`${item.applicationId}-${item.decidedAt}`} href={`/applications/${item.applicationId}`} className="row">
                    <span className="file-id num">{fileNumber(item.applicationId)}</span>
                    <span className="who">
                      <span className="name">{app?.applicantName}</span>
                      <span className="meta">{formatWhen(item.decidedAt)}</span>
                    </span>
                    <span className={`pill ${item.outcome}`}>{OUTCOME_LABEL[item.outcome]}</span>
                    <span className="audit-note">
                      {item.overrode ? "शिफारस बदलली. " : "शिफारसीनुसार. "}
                      {item.note}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}
