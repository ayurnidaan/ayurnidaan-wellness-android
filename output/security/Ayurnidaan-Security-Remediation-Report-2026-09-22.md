# Ayurnidaan Security Remediation Report

**Implementation date:** 22 September 2026
**Branch:** local `dev` working tree
**Result:** fixes implemented for all 3 high, 4 medium, and 2 low findings
**Activation status:** client changes are ready to build; the new database migration and updated Edge Functions must be deployed together before the backend protections are active.

## Implemented changes

| Finding | Implementation | Code status |
|---|---|---|
| AYN-SEC-001 — forged/altered appointments | Revoked patient insert/update rights. Paid appointments are created only by a service-role payment transaction. Clinical notes use a verified, assigned-doctor RPC that completes the appointment and writes an immutable audit row. | Implemented |
| AYN-SEC-002 — unpaid shop orders | Revoked authenticated inserts on order and line-item tables. Catalogue prices, owned delivery address, order, items, and paid transaction are now finalized server-side. | Implemented |
| AYN-SEC-003 — payment race | Added one atomic Postgres fulfilment RPC with a row lock and idempotent paid-resource return. Razorpay callback and native verification call the same RPC. | Implemented |
| AYN-SEC-004 — AI cost abuse | Added transaction-safe per-user quotas before all AI/provider calls and the payment endpoint. Meal scans and plan generation use stricter daily limits. | Implemented |
| AYN-SEC-005 — insecure local storage | Moved native Supabase sessions to chunked Expo SecureStore storage. Removed local medical, order, and appointment snapshots; red-flag text is passed only in memory. | Implemented |
| AYN-SEC-006 — weak consent evidence | Added append-only, server-timestamped consent events with document version, SHA-256, action, channel, and user. Removed direct client access to acceptance timestamps and made privacy-setting changes auditable. | Implemented |
| AYN-SEC-007 — doctor application abuse | Requires authentication, owned uploaded files, and a daily quota. Raw Aadhaar/PAN values are cleared; keyed fingerprints and last-four values are retained in a client-inaccessible store. | Implemented |
| AYN-SEC-008 — Expo patch mismatch | Updated the complete Expo SDK 57 patch set and added the SecureStore config plugin. | Implemented |
| AYN-SEC-009 — broad CORS/errors | Replaced wildcard CORS with an origin allowlist and replaced operational client errors with stable public messages. | Implemented |

The consent record is bound to `Ayurnidaan-Terms-Privacy-Consent-v5.0.pdf` with SHA-256 `4641d907ce0e3eaf2ac34d763bb69244ed58076a2c1657f288777041ea17ffff`, verified against the repository file during this run.

## Validation completed

| Check | Result |
|---|---|
| Security regression checks | Pass — 12/12 invariants |
| TypeScript application compilation | Pass |
| Deno type-check for all 8 Edge Functions | Pass |
| Expo Doctor | Pass — 21/21 checks |
| Production dependency audit | Pass — 0 known vulnerabilities across 527 production dependencies |
| Expo web production export | Pass |
| Generated executable/text bundle secret scan | Pass — no privileged exact value or secret pattern found |
| Terms PDF hash verification | Pass |
| Source scan for direct appointment/order writes, demo payment bypass, wildcard CORS, and local medical snapshots | Pass — no match |
| Repository worktree and Git-history secret scan | Pass — no high-confidence secret or configured sensitive value found |
| Aadhaar/PAN value scan | Pass — no identifier value found; historical numeric asset-hash matches were manually triaged |
| Optional-consent, AI-context and adult-boundary regression checks | Pass |

Run the repeatable repository checks with:

```text
npm run security:check
npx tsc --noEmit
npx expo-doctor
npm audit --omit=dev
```

## Deployment and release gate

Deploy `20260922090000_security_hardening.sql` before deploying the updated Edge Functions. Configure `ALLOWED_WEB_ORIGINS` with the exact production and approved development origins. Deploy the eight changed functions together so they all see the quota RPC and shared CORS helper.

After deployment to a dedicated test project, the release gate remains:

1. Execute cross-user access tests with Patient A and Patient B.
2. Test assigned, unrelated, and unverified doctor attempts to write clinical notes.
3. Send concurrent valid Razorpay test-mode verification requests and confirm exactly one resource exists.
4. Verify direct authenticated appointment/order inserts fail.
5. Exercise each quota and confirm HTTP 429 after its configured limit.
6. Test SecureStore persistence, logout cleanup, deep links, uploads, and payments in signed Android and iOS builds.

These dynamic tests were not sent to the configured backend because the environment has no isolated Supabase test database, verified test identities, or authorized Razorpay test transaction. The migration has therefore not been applied to the hosted project from this task.
