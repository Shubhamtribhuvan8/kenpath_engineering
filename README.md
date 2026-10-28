# निवाडा

A Marathi desk for the Nayab Tehsildar who issues income certificates in Chhatrapati Sambhajinagar.

An officer opens one queue, sees which files need a hard look and which clean files are about to miss the legal deadline, reads a grounded brief on each file, and only then approves, rejects, or sends it back. The brief never signs the certificate.

Live desk: [https://nivada.vercel.app](https://nivada.vercel.app)

Sign-in is one officer account. The username and password are **not** in this repository, not on the login screen, and not in git history of this project. Set them in `.env` for a local run. The same values are configured on the host for the live desk and can be sent separately to a reviewer.

## The problem

In Maharashtra the income certificate (उत्पन्नाचा दाखला) is a notified service under the Maharashtra Right to Public Services Act, 2015.

- Time limit: 15 days
- Designated officer: Nayab Tehsildar
- First appeal: Tehsildar
- Fee: ₹20

The citizen applies on Aaple Sarkar. A tehsil clerk checks the form, the attachments, and the fee. An Awwal Karkun (अवल कारकून) checks again. The file then waits on the Nayab Tehsildar's table. That last table is the slow part. The portal already accepted the application. Someone still has to read it, notice a stale electricity bill, a name that does not match Aadhaar, a talathi report that contradicts the declared income, or a clean file that has already crossed day 15.

I worked with e-governance systems in this district, at block and panchayat level: e-Gramswaraj, ServiceOnline, CSC, PFMS. The form was never the bottleneck. The officer's queue was.

This desk starts at that queue. It does not pretend to be Aaple Sarkar, and it does not replace the tehsil register.

## Who it affects

The person at the table is Megha Kulkarni, Nayab Tehsildar, Tehsil Chhatrapati Sambhajinagar. She is fictional.

The people waiting on her are also fictional. A late clean file means a citizen misses a scholarship, a fee waiver, or a scheme window. A careless approval means a certificate that should not exist. A vague "return" means the citizen is sent home without being told which paper is missing.

Villages in the sample are made-up wadis. Phone numbers and Aadhaar-shaped numbers are made up. Nothing here is a real citizen, and the desk must not be loaded with real citizen data.

## What the officer can do

1. See the pending queue in the order a person at that table actually needs:
   - **चौकशी हवी** — the checks suggest rejection
   - **मुदत जवळ किंवा संपली** — day 12 or later, including clean files that are simply late
   - **आज निकाल द्या** — complete, consistent files, oldest first
   - **दुरुस्तीची रांग** — fixable gaps, deadline still open
2. Search by name, village, or file number. The search filters the queue and the local decision list.
3. Open a file and get AI assistance: a Marathi summary, the missing documents, the inconsistencies, a suggested decision, and the reasons. A draft remark can be dropped into the decision box and edited. The button for that is **हा शेरा वापरा**.
4. See the seven checks the desk ran, in order. The model is only allowed to explain those results.
5. Approve (मंजूर), reject (नामंजूर), or send back for correction (दुरुस्ती). A remark of at least 12 characters is required. If she disagrees with the suggestion, she has to tick that she is overriding it, and the override is stored with the decision.
6. After an approval, open a sample certificate draft. It is watermarked **नमुना**. It is not a legal certificate and it has no digital signature.
7. Open **नियम** in the header and read the same policy the code uses. **नमुना रीसेट** clears decisions stored in this browser.

Three files are enough to see the product:

| File | Why it is there |
| --- | --- |
| उत्प/1054 रामकिशोर सुतार | Clean farm file, deadline already over. The queue buried a file she can finish today. A higher declared income than the rough land estimate is not treated as fraud. |
| उत्प/1042 विकास जाधव | Shop papers look fine. Bank credits are far above the declared income. Suggested rejection. She can still send it back. |
| उत्प/1055 नंदा भोसले | Papers look complete and the salary matches. The talathi report has not come in. Do not approve yet. |

The other twelve files cover a prior certificate, a talathi contradiction, a missing declaration, a name or village mismatch, a stale address bill, an applicant under 18, a missing photograph, a pension file, a matching salary, a bad Aadhaar checksum, and an undated declaration.

## How a suggestion is made

The desk runs seven pure checks, in this order, before any model is called:

1. **Deadline.** The Maharashtra limit used here is 15 days. Day 12 and later is "near". Being late never, by itself, changes the suggested outcome. A late clean file is still an approval, and the queue puts it where she will see it today.
2. **Documents.** Self-declaration, photograph, identity, and address proof are required. The declaration needs a date. An electricity or water bill older than 180 days is stale. Farming needs a 7/12 extract, salary needs a certificate, pension needs an order, and a business needs proof of the trade.
3. **Identity.** The name and village on the application are compared with the address proof. श्री and श्रीमती are salutations, not a name mismatch. The Aadhaar-shaped number is checked with the Verhoeff digit test only. There is no call to UIDAI. An applicant under 18 is returned so a parent can apply.
4. **Income signals.** Salary or pension is compared with the declaration. Land is compared at ₹18,000 an acre irrigated and ₹8,000 dry. That is a comparison, not a government rate, and the screen says so. A declared income above the land estimate is not fraud. Bank credits are a different test: annual credits above twice the declaration and at least ₹1,00,000 are a suggested rejection, because credits are not the same thing as income, but a gap that large needs an explanation.
5. **Prior certificate.** A certificate from the last 12 months whose income differs by more than 40 percent is a suggested rejection.
6. **Talathi report.** A missing report is a return, even when every other paper looks complete. A report that contradicts the declared income is a suggested rejection.
7. **Recommendation.** Contradiction suggests rejection (`TALATHI_CONTRADICTION`, `PRIOR_CERTIFICATE`, `INCOME_CONTRADICTION`). Everything else that is missing or mismatched suggests return. A file that passes suggests approval.

The queue then sorts each bucket by days pending, longest first.

Claude receives the file and those results. It writes the Marathi summary, the missing list, the inconsistencies, the reasons, a draft remark, and one "watch" line. It is not allowed to change `policyOutcome`. If the key is missing or the call fails, the officer still gets the rule-based brief. The model name is `ANTHROPIC_MODEL`.

## Technical decisions

**One Next.js application.** The desk, the session, and the review tools live together. App Router, React 19, TypeScript. Styles are hand-written CSS so the Marathi desk does not depend on a utility framework. A separate Python service would not make the judgement clearer, and it would give a reviewer a second process to run.

**Marathi on the screen, English in this file.** The officer works in Marathi. The hiring review does not have to.

**Rules decide. The model explains.** The seven checks are pure functions. `npm test` locks the sample queue, so a copy change cannot silently flip a rejection into an approval. The model is instructed not to invent a name mismatch out of a salutation, and not to treat a missed deadline as a reason to reject.

**Login is a signed cookie** for a single demo officer. The cookie is HMAC-signed with Web Crypto, lasts 12 hours, and is marked secure in production. Middleware sends an unsigned visitor to `/login`. API routes other than login and logout return 401 without a session.

**Secrets stay out of the repository.** Officer username, officer password, `NIVADA_SESSION_SECRET`, and `ANTHROPIC_API_KEY` are environment variables. `.env` is gitignored. `.env.example` lists the names and leaves the values empty. Production refuses to sign a session if `NIVADA_SESSION_SECRET` is missing. Sign-in fails closed if the officer account is not configured.

**No database.** The fifteen sample files are code. Her decisions stay in `localStorage` under `nivada-desk-v1`. A production desk would write the remark, the outcome, and the override into the tehsil register. It would not calculate them in the browser.

**Sample Aadhaar numbers only pass the Verhoeff checksum**, which is the digit check UIDAI uses. They are not issued numbers. One file fails the check on purpose.

## Layout of the code

| Path | What it is |
| --- | --- |
| `app/page.tsx`, `components/Desk.tsx` | The queue |
| `app/applications/[id]/page.tsx`, `components/CaseView.tsx` | One file, the brief, and the decision |
| `app/login/page.tsx`, `components/LoginForm.tsx` | Sign-in. The form does not display the account. |
| `app/api/login`, `logout`, `session` | Session cookie |
| `app/api/applications/[id]/assist` | Claude brief, with an in-memory cache |
| `lib/policy.ts` | Office, deadlines, and the thresholds |
| `lib/review.ts` | The seven checks and the suggested outcome |
| `lib/triage.ts` | Queue buckets |
| `lib/assist.ts` | Prompt, parser, and the rule-based fallback |
| `lib/applications.ts` | Fifteen fictional files |
| `lib/users.ts`, `lib/session.ts` | Account check and signed cookie |
| `middleware.ts` | Gate for pages and API routes |
| `tests/` | Queue outcomes, Aadhaar check, amount words, brief parser |

## Run it locally

Node.js 20 or newer.

```bash
cp .env.example .env
```

Fill in `.env` on your own machine. Do not commit it.

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

Without `ANTHROPIC_API_KEY`, each file still opens. The brief is then the rule summary, marked as such, and the suggested outcome does not change.

## What I would add next, and did not

The talathi's report coming in from a phone instead of a field on the file. A digital signature and a push back into Aaple Sarkar. A register that survives a new browser. I would not let the model sign the certificate.

## Sample notice

All applicants, villages, phone numbers, and identity numbers in this repository are fictitious. Do not load real citizen data into this desk.
