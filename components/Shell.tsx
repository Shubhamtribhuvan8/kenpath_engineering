"use client";

import Link from "next/link";
import { ReactNode, useRef } from "react";
import { OFFICE, RTS_DAYS, RTS_NEAR_DAYS, BILL_MAX_AGE_DAYS, PRIOR_GAP, INCOME_RATIO, INCOME_GAP_INR, BANK_RATIO, BANK_GAP_INR, LAND_IRRIGATED_PER_ACRE, LAND_DRY_PER_ACRE, MIN_AGE } from "@/lib/policy";
import { inr } from "@/lib/format";
import type { Officer } from "@/lib/types";

const sections = [
  {
    title: "नामंजूर तेव्हा सुचवले जाते",
    lines: [
      "तलाठी अहवाल घोषित उत्पन्नाच्या विरोधात असेल.",
      `बारा महिन्यांतल्या आधीच्या दाखल्यात ${Math.round(PRIOR_GAP * 100)} टक्क्यांपेक्षा जास्त फरक असेल.`,
      `वेतन, पेन्शन किंवा जमिनीचा मोटा अंदाज घोषणेच्या ${INCOME_RATIO} पट आणि किमान ${inr(INCOME_GAP_INR)} ने जास्त असेल.`,
      `खात्यातील वार्षिक जमा घोषणेच्या ${BANK_RATIO} पट आणि किमान ${inr(BANK_GAP_INR)} ने जास्त असेल. जमा म्हणजे उत्पन्न नव्हे.`,
    ],
  },
  {
    title: "दुरुस्ती तेव्हा सुचवली जाते",
    lines: [
      "स्वयंघोषणापत्र, छायाचित्र, ओळखपत्र किंवा पत्त्याचा पुरावा उणा असेल, किंवा घोषणापत्रावर तारीख नसेल.",
      "शेतीला सातबारा, वेतनाला प्रमाणपत्र, पेन्शनला आदेश, धंद्याला पुरावा हवा.",
      `वीज किंवा पाणी बिल ${BILL_MAX_AGE_DAYS} दिवसांपेक्षा जुने असेल.`,
      "अर्जातील नाव किंवा गाव पत्त्याच्या पुराव्याशी जुळत नसेल.",
      "आधार क्रमांकाची तपासणी अयशस्वी झाली.",
      `अर्जदार ${MIN_AGE} वर्षांखालील असेल. अर्ज पालकांमार्फत यावा.`,
      "तलाठी अहवाल अद्याप आलेला नसेल. कागद पूर्ण दिसले तरी चौकशीशिवाय मंजूर करू नये.",
    ],
  },
  {
    title: "पंक्तीचा क्रम",
    lines: [
      "आधी चौकशी: नामंजुरीची शिफारस.",
      `मग मुदत: ${RTS_NEAR_DAYS} किंवा अधिक दिवस झालेले अर्ज. मर्यादा ${RTS_DAYS} दिवस.`,
      "मग आज निकाल: स्वच्छ फाइल्स, जुन्या आधी.",
      "शेवटी दुरुस्तीची रांग, जिथे मुदत अजून बाकी आहे.",
    ],
  },
];

export function Shell({
  officer,
  children,
  onLogout,
  onReset,
}: {
  officer: Officer | null;
  children: ReactNode;
  onLogout: () => void;
  onReset?: () => void;
}) {
  const rulesRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <strong>निवाडा</strong>
          <span>
            {OFFICE.service} · तहसील {OFFICE.taluka}
          </span>
        </Link>
        <div className="officer">
          <button className="text-btn" type="button" onClick={() => rulesRef.current?.showModal()}>
            नियम
          </button>
          {onReset ? (
            <button className="text-btn" type="button" onClick={onReset}>
              नमुना रीसेट
            </button>
          ) : null}
          {officer ? (
            <p>
              <strong>{officer.name}</strong>
              <span>{officer.role}</span>
            </p>
          ) : null}
          <button className="text-btn" type="button" onClick={onLogout}>
            बाहेर
          </button>
        </div>
      </header>
      {children}
      <dialog
        ref={rulesRef}
        onClick={(event) => {
          if (event.target === rulesRef.current) rulesRef.current?.close();
        }}
      >
        <h2>शिफारस कशी तयार होते</h2>
        <p>
          {OFFICE.act}. सेवा: {OFFICE.service}. मुदत {RTS_DAYS} दिवस. नियुक्त अधिकारी: {OFFICE.designation}. प्रथम अपील:{" "}
          {OFFICE.appellate}. फी {inr(OFFICE.feeInr)}.
        </p>
        {sections.map((section) => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            <ul>
              {section.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <p>
          जमिनीचा दर सिंचित {inr(LAND_IRRIGATED_PER_ACRE)} आणि कोरडवाहू {inr(LAND_DRY_PER_ACRE)} प्रति एकर हा कायदेशीर दर नाही.
          तो फक्त तुलना आहे. शिफारस आदेश नाही. शेरा तुमचा. शिफारस बदलल्यास ती नोंद राहते.
        </p>
        <button className="btn" type="button" onClick={() => rulesRef.current?.close()}>
          बंद करा
        </button>
      </dialog>
    </>
  );
}
