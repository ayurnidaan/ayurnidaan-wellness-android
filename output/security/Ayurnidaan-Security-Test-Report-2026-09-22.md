# Ayurnidaan Security Test Report

> **Remediation update:** All nine findings have fixes implemented in the local working tree. See [Ayurnidaan-Security-Remediation-Report-2026-09-22.md](./Ayurnidaan-Security-Remediation-Report-2026-09-22.md) for the change and validation record. Hosted-backend deployment and dynamic authorization/payment retesting remain release gates.

**Assessment date:** 22 September 2026
**Assessed revision:** local `dev` branch working tree
**Scope:** Expo/React Native client, exported web bundle, Supabase migrations and configured development backend, Supabase Edge Functions, storage policies, AI integrations, and Razorpay payment workflow.

## Executive summary

The assessment found **3 high, 4 medium, and 2 low findings**. Ayurnidaan should not treat the current appointment and shop records as authoritative until the high-severity database authorization issues are fixed.

The strongest controls observed were:

- all 19 application tables created by the migrations have Row Level Security enabled;
- anonymous requests returned no protected patient rows;
- sensitive AI endpoints rejected unauthenticated requests with HTTP 401;
- the payment endpoint recalculates shop prices on the server, verifies address ownership, validates Razorpay signatures, and checks that the payment is captured;
- the production web export contains no Vercel OIDC token, Supabase service-role key, Razorpay secret, OpenRouter key, or live/test Razorpay secret pattern;
- `npm audit --omit=dev` reported no known vulnerabilities across 536 production dependencies;
- TypeScript compilation and the web export completed successfully.

The main release blockers are:

1. patients can create appointments without payment and can modify status, discussion summaries, and prescriptions on their own appointment rows;
2. patients can create shop orders and line items directly, with arbitrary totals and unit prices, without completing payment;
3. concurrent verification of a single captured payment can fulfil the purchase more than once.

## Method

The review used OWASP MASVS/MASTG categories as the mobile baseline. It included source and migration review, access-control analysis, dependency audit, Expo configuration checks, TypeScript compilation, a release-like web export, secret scanning of executable bundle files, and safe read-only requests against the Supabase project configured in `.env.local`.

No patient data was printed or retained. No accounts, orders, appointments, payments, or files were created or modified in the configured backend.

## Findings

### AYN-SEC-001 — Patients can forge and alter clinical appointments

**Severity:** High
**Category:** Broken object/property authorization; medical-record integrity
**Status:** Confirmed by database policy analysis

The `authenticated` role has unrestricted `INSERT` and `UPDATE` table privileges on `appointments`. Its policies check only that `user_id` matches the current user. Later migrations add `discussion_summary` and `prescription` without restricting column updates.

An authenticated patient can therefore bypass the Razorpay workflow by inserting an appointment directly. After an appointment exists, the patient can change its doctor, date, status, clinical summary, prescription, attachment metadata, and other columns while leaving `user_id` unchanged. Row-level security stops cross-patient access but does not protect sensitive columns within the patient's row.

**Evidence**

- `supabase/migrations/20260902180000_create_appointments.sql:17` grants `select, insert, update` to every authenticated user.
- The insert/update policies at lines 21–28 validate ownership only.
- `supabase/migrations/20260902220000_add_appointment_clinical_notes.sql:2` adds `discussion_summary` and `prescription` under the existing update privilege.

**Recommended fix**

- Revoke direct `INSERT` on appointments from `authenticated`; create appointments only in the payment fulfilment transaction.
- Revoke broad `UPDATE`; grant only explicitly patient-editable columns, or expose narrowly scoped RPCs for cancellation/rescheduling.
- Add a verified-doctor policy or server endpoint for clinical notes. It should validate `verified_doctors.auth_user_id`, doctor assignment, appointment status, and allowed columns.
- Add immutable audit fields for all clinical-note changes.

### AYN-SEC-002 — Users can create unpaid shop orders with arbitrary values

**Severity:** High
**Category:** Business-logic authorization; payment bypass
**Status:** Confirmed by database policy analysis

The `authenticated` role can insert directly into `shop_orders` and `shop_order_items`. Ownership policies do not verify a captured payment, calculate prices from `shop_products`, or reconcile the order total with its items. A user can create a `placed` order with `total_amount = 0` and arbitrary non-negative `unit_price` values.

The Razorpay Edge Function correctly calculates prices, but its controls are bypassable because the client role can write the final tables directly.

**Evidence**

- `supabase/migrations/20260902210000_create_shop_orders.sql:21–22` grants insert access to authenticated users.
- The policies at lines 25–32 check user ownership only.
- The schema accepts any non-negative total and unit price.

**Recommended fix**

- Revoke `INSERT` on both tables from `authenticated`.
- Create orders and items only through one server-side transaction after captured-payment verification.
- Derive totals and prices exclusively from active catalogue rows.
- Add a database constraint or trigger that prevents a paid order from existing without one matching paid transaction.

### AYN-SEC-003 — Payment fulfilment is vulnerable to a concurrency race

**Severity:** High
**Category:** Race condition; insufficient idempotency
**Status:** Confirmed by code-path analysis; concurrency exploit not sent to live Razorpay

`verifyAndFulfil` checks whether the transaction is already paid, creates the appointment/order, and only then updates the payment transaction to `paid`. Two concurrent valid verification requests can both observe an unpaid transaction and both fulfil it before either update becomes visible. This can create duplicate appointments or orders for one captured payment.

**Evidence**

- `supabase/functions/razorpay-payment/index.ts:43` performs the early paid check.
- Line 52 fulfils the resource.
- Line 53 updates the transaction to paid afterward.

**Recommended fix**

- Move verification state transition and fulfilment into a Postgres transaction/RPC.
- Atomically claim the payment row with a conditional transition such as `created -> processing`; allow only one caller to succeed.
- Enforce a unique relationship from each payment transaction to exactly one resource.
- Make webhook/native/callback paths call the same idempotent transaction.

### AYN-SEC-004 — No application-level quotas on costly AI endpoints

**Severity:** Medium
**Category:** Resource consumption; cost abuse
**Status:** Confirmed by source analysis

The AI endpoints require a valid user, but no per-user request quota, burst limit, daily budget, or concurrency limit is implemented. A user can automate calls to chat, assessment, meal scanning, and three recommendation generators. Several functions retry the provider up to three times, multiplying cost during malformed responses.

Provider-side HTTP 429 handling does not replace application-level controls because it protects the provider account only after capacity or quota has already been consumed.

**Recommended fix**

- Add a per-user and per-IP rate limiter before provider calls.
- Enforce daily token/image budgets and concurrency limits.
- Record usage without storing raw health prompts in operational logs.
- Apply tighter limits to image scanning and recommendation regeneration.

### AYN-SEC-005 — Sensitive local data is stored without app-level encryption

**Severity:** Medium
**Category:** Insecure local storage
**Status:** Confirmed by source analysis; physical-device extraction not performed

Native Supabase sessions persist in `AsyncStorage`. The app also stores cart data, local order/appointment snapshots, and a user's red-flag health message in `AsyncStorage`. AsyncStorage is not intended as a secure secret store and may be readable through device compromise, insecure backups, debugging, or local extraction.

**Evidence**

- `src/lib/supabase.ts:11–13` configures persistent sessions with AsyncStorage.
- `App.tsx:2499` stores the red-flag handoff text.
- `App.tsx:2161–2172` stores appointment/order snapshots.

**Recommended fix**

- Use an Expo SecureStore-backed auth storage adapter for session material where supported.
- Avoid persisting raw symptom/red-flag text; pass it in memory or store a short-lived encrypted reference.
- Treat server data as authoritative and remove locally duplicated medical/transaction records.
- Verify Android backup and iOS data-protection settings in signed builds.

### AYN-SEC-006 — Consent timestamps are user-controlled and lack version evidence

**Severity:** Medium
**Category:** Audit and consent integrity
**Status:** Confirmed by schema/policy analysis

Users have broad update access to their profile row, including `terms_accepted_at`. Account creation also accepts the timestamp from user-controlled authentication metadata. The record does not identify the terms/privacy/consent version, document hash, acceptance channel, or withdrawal history.

This does not expose another user's data, but it weakens the reliability of consent evidence for health-data processing.

**Recommended fix**

- Move consent into an append-only `consent_events` table written by a server function.
- Store document type, semantic version, content hash, accepted/withdrawn action, server timestamp, user ID, and channel.
- Remove direct client update access to consent timestamps.

### AYN-SEC-007 — Anonymous doctor applications can reserve identity data without proof

**Severity:** Medium
**Category:** Abuse prevention; identity workflow integrity
**Status:** Confirmed by source analysis; no test PII submitted

The security-definer `submit_doctor_application` function is executable by `anon`. It stores full Aadhaar and PAN values, relies on request booleans to assert that documents were supplied, and has no visible rate limit or challenge. Unique indexes cover active Aadhaar and PAN values.

An attacker who knows or guesses an identity can submit it first and block the legitimate doctor with a uniqueness violation. Repeated anonymous submissions can also create sensitive-PII handling and operational abuse.

**Recommended fix**

- Require verified phone/email authentication and server-side rate limits.
- Verify uploaded document ownership and existence rather than accepting booleans.
- Encrypt or tokenise Aadhaar/PAN, store only necessary derived/last-four values, and define retention/deletion rules.
- Add a protected recovery path for identity-reservation abuse.

### AYN-SEC-008 — Expo packages do not match the latest SDK 57 patch set

**Severity:** Low
**Category:** Patch management
**Status:** Reproduced with Expo Doctor

Expo Doctor passed 20 of 21 checks. It reported 13 patch-level mismatches, including Expo 57.0.20 where 57.0.24 was expected, plus older patch versions of asset, auth-session, camera, crypto, document picker, image picker, linking, location, splash screen, web browser, and related packages.

**Recommended fix**

- Run `npx expo install --check`, review SDK 57 changelogs, upgrade the patch versions together, then rebuild and retest authentication, camera/image upload, deep linking, and payments.

### AYN-SEC-009 — Broad CORS and detailed operational errors increase exposure

**Severity:** Low
**Category:** Security hardening
**Status:** Confirmed by source analysis

Every Edge Function permits `Access-Control-Allow-Origin: *`. Most sensitive operations still require bearer authentication, so this is not an authentication bypass. Several endpoints also return `error.message` to clients, which may expose provider status or internal operational details.

**Recommended fix**

- Allow only the production web origin and approved development origins for browser calls.
- Return stable public error codes/messages and retain detailed diagnostics only in redacted server logs.

## Tests executed

| Test | Result |
|---|---|
| Static secret scan of repository, excluding generated/binary content | Pass — no hard-coded privileged key found |
| `.env.local` source-control check | Pass — ignored and not tracked; history query found no tracked copy |
| Production dependency audit | Pass — 0 known vulnerabilities in 536 dependencies |
| TypeScript `--noEmit` compilation | Pass |
| Expo web export | Pass |
| Executable bundle exact-value secret scan | Pass — no privileged value/pattern found |
| Expo Doctor | Partial — 20/21 passed; 13 patch mismatches |
| RLS coverage across migration-created application tables | Pass — 19/19 enabled |
| Search for `USING (true)`, `WITH CHECK (true)`, RLS disable, broad grant-all patterns | Pass — none found |
| Anonymous read: profiles | Pass — HTTP 200 with empty result |
| Anonymous read: appointments | Pass — HTTP 401 |
| Anonymous read: shop orders | Pass — HTTP 200 with empty result |
| Anonymous read: payment transactions | Pass — HTTP 401 |
| Anonymous read: restricted `verified_doctors.auth_user_id` | Pass — HTTP 401 |
| Public doctor ID query | HTTP 200 with empty result; column route is intentionally public |
| Unauthenticated AI chat | Pass — HTTP 401 |
| Unauthenticated current-health chat | Pass — HTTP 401 |
| Unauthenticated meal scan | Pass — HTTP 401 |
| Fabricated payment checkout token | Pass — HTTP 410 |
| Payment amount source analysis | Pass — catalogue price and owned address are resolved server-side |
| Razorpay verification analysis | Pass — HMAC, order ID and captured-payment status are checked |
| Appointment and order direct-write authorization analysis | Fail — AYN-SEC-001 and AYN-SEC-002 |
| Payment fulfilment idempotency analysis | Fail — AYN-SEC-003 |

## Tests not executed

These require a dedicated test environment or signed device builds:

- cross-user reads/writes using Patient A and Patient B tokens;
- verified doctor versus unrelated/unverified doctor access;
- direct authenticated exploitation of appointment and shop-order policies;
- concurrent duplicate fulfilment against Razorpay test mode;
- OAuth redirect and account-switching lifecycle on Android and iOS;
- rooted/jailbroken device storage extraction, backup analysis, and runtime instrumentation;
- TLS interception, certificate handling, and release APK/IPA reverse engineering;
- malicious upload polyglots and signed-URL expiry with real test files;
- account deletion verification across database rows, storage objects, logs, backups, and third-party AI providers;
- load/rate-limit testing of AI functions.

The installed environment does not include Docker or the Supabase CLI, so migrations could not be applied to an isolated local database. The configured backend was tested only with anonymous, non-mutating requests.

## Remediation order and release criteria

1. Fix AYN-SEC-001 and AYN-SEC-002 by revoking direct writes and restricting clinical columns.
2. Make payment fulfilment atomic and idempotent (AYN-SEC-003).
3. Deploy the changes to a dedicated test Supabase project.
4. Create Patient A, Patient B, assigned doctor, unrelated doctor, and unverified doctor identities; execute the deferred authorization matrix.
5. Add AI quotas and harden local storage/consent evidence.
6. Update Expo patch versions and produce signed Android/iOS test builds.
7. Run dynamic mobile and upload/payment tests, then retest every finding.

Recommended release gate: no unresolved high-severity findings, all cross-account and doctor-assignment tests passing, one-and-only-one fulfilment for each Razorpay test payment under concurrency, no privileged secret in signed artifacts, and documented acceptance of any remaining medium risks.
