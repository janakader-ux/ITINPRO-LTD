# ITIN PRO sandbox client portal

Prepared 12 October 2026. This is a test implementation, not approval to collect real passports, taxpayer identifiers or client documents. Live Stripe payments remain disabled.

## First staff sign-in

Open https://itinpro-uk.onrender.com/portal and request a sign-in link using the configured staff mailbox. Open the email, select Continue, then enroll/verify an authenticator app. Staff case access requires both a server-owned staff role and Supabase AAL2. The sandbox private Storage bucket is created through the Storage API only after successful staff MFA.

The configured first staff address is supplied by `PORTAL_STAFF_EMAIL`. It is not an editable browser role field. The login flow uses Supabase admin-generated single-use tokens and the existing Resend sender. No additional SMTP provider or paid e-signature platform is required to test this flow. Unknown email addresses cannot receive portal access. A staff-reviewed paid case establishes a client account and links it to the exact payer email from the enquiry.

Auth tokens are sent in a URL fragment, removed from the address bar on load, and consumed only after an explicit same-origin POST. They are not placed in server URL logs. Portal/API responses use private no-store caching, no-referrer, noindex, frame protection and a restrictive CSP. Analytics are excluded from portal pages. Session cookies are HttpOnly, secure in production and SameSite=Lax. Supabase session renewal runs in Next.js proxy and every API verifies the user with Auth.

## Configuration

The server needs the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PAYMENT_TOKEN_SECRET` and `APP_URL`. Add the active Supabase publishable key as `SUPABASE_PUBLISHABLE_KEY`; never expose the private service key in a browser variable or repository.

- `PORTAL_MODE=sandbox` enables the beta. There is no live mode in this implementation.
- `PORTAL_STAFF_EMAIL` identifies the first authorised staff mailbox.
- `PORTAL_UPLOADS_ENABLED=false` keeps all uploads closed initially.
- `PAYMENTS_ENABLED=false` keeps public sandbox checkout closed after the completed payment tests.

Apply `supabase-portal.sql` using the Supabase migration connector. It adds the portal tables, indexes, RLS policies and guarded service-only RPCs without changing existing enquiries or payment orders. Bucket `itinpro-case-files-sandbox` is always private and limited to PDF/JPEG/PNG, 10 MB maximum. Storage metadata is never written through SQL. All object writes go through the Storage API.

## Case workflow

1. Staff review the actual W-7 tax purpose and choose the checklist route. Pricing categories and IRS routes are separate concepts.
2. A sandbox case can be created only from a synthetic, paid checkout order whose amount, GBP currency, category and Stripe sandbox session match. Names must identify a test and the payer email must be example.com.
3. The client receives a portal update, signs in, reviews the personalised source engagement and explicitly accepts terms, document-readiness/identity declarations and the privacy notice. Early commencement during the cancellation period is a separate, unticked choice. The accepted snapshot/hash, signer identity/email and timestamp are preserved. Clients can print/save the letter and acceptance record as a PDF; server-stored PDF generation is a later enhancement, not implemented.
4. When explicitly enabled for dummy-document testing, uploads require paid status, accepted engagement and an authenticated case owner. Staff can add documents after MFA. Only placeholder data is authorised.
5. Questionnaire answers are saved to that case. Conditional upload requirements are displayed. A client can supply a completed W-7 instead of duplicating its preparation data.
6. Staff review scans, create specific missing-information requests and mark requests resolved after reviewing responses. A completed upload does not prove that the document is valid or that CAA verification occurred.
7. Drafts are initially staff-only. Staff explicitly release a draft; the client can approve or request changes on that exact document/hash. Older draft decisions cannot approve a newer draft. Professional drafting/release is gated by the agreement's work-start time.
8. Verification/submission/outcome tabs record sandbox simulations only. Submission-stage recording requires approved current draft, recorded original-document interview checks, required original W-7 signature and no unresolved information requests. No IRS submission is sent by this application.

Client documents, engagement records, questionnaire answers, released drafts, requests and shared submission/outcome records appear within one case. Internal drafts/notes stay staff-only. Downloads pass through authenticated application and Storage RLS checks; no public or service-role sharing URLs are issued. Client/account creation cannot be based on a name or folder path.

Portal updates use Resend and fixed idempotency keys. Notification outbox rows retain pending provider failures; staff retry can reconstruct missing queue entries from the saved case, requests and documents. Provider acceptance is not inbox delivery. No taxpayer information or documents are included in these emails. Background scheduled retry/delivery-webhook processing is not yet configured.

## Checklist coverage and source handling

See [Application document instructions](APPLICATION-DOCUMENT-INSTRUCTIONS.md) for the expanded 24-route matrix and client signing instructions. The new routes separate resident returns, visa-holder families, student returns, treaty wages, treaty/non-treaty scholarships and business/resident bank interest. Questionnaire fields now include the applicable institution, payer/year, property transaction, tax benefit and signing-authority information. New cases use checklist version `2026-10-12.2`; existing signed engagement snapshots are preserved.

The guide covers spouse, dependent/child, renewal, prepared 1040-NR, LLC distribution, LLC bank-account, partnership, rental, FIRPTA, pension/IRA, estate, wages/scholarship/treaty compensation, gambling, mortgage reporting, corporate reporting and Other routes. Canonical existing prices are reused. Unlisted routes use the agreed Other category provisionally, subject to review; no new Stripe prices were created.

Source questionnaires are internal references. Original attachments have not been modified or published. The W-7 workbook supplies field groups; obsolete sample years are replaced by the approved case year. The engagement source is preserved as a versioned template. A clean code-native passport diagram replaces the watermarked stock preview; it illustrates the complete photograph/data page and facing top page, without identity data.

Supporting letters: require original handwritten BLUE INK signatures on official issuer letterhead as ITIN PRO's preparation practice. Explain that blue ink helps distinguish a handwritten original from a reproduced signature based on case-handling experience. Do not claim a universal IRS ink-colour rule or an unsupported rejection percentage. Issuer exceptions need CAA review. Electronic engagement acceptance and draft approval do not substitute for the original W-7 signature or CAA inspection.

Spouse route: the firm's standard service uses MFJ; other filing statuses need staff review of the actual filing obligation/allowable benefit rather than a blanket statutory rejection rule. Dependent checklists account for age, passport-entry evidence, residency and military/Canada/Mexico exceptions; there is no blanket three-month visa gate. For Exception 1(a), include agreement name/EIN/applicant name and signature requirements effective 1 June 2026. LLC ownership/bank-account ownership alone does not establish eligibility.

Official rule references checked 12 October 2026:

- https://www.irs.gov/instructions/iw7
- https://www.irs.gov/individuals/itin-acceptance-agent-program
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/schema/design
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink

## Validation and remaining launch work

Automated validation includes the existing 12 payment/enquiry tests plus eight portal tests (20 total): complete canonical route/fee mapping, source engagement substitution, attachment validation, same-origin guards, closed-mode protection, safe mail-link generation/recipient restrictions, and two real Postgres PGlite tests covering clients A/B, staff without/with MFA, anonymous access, revoked users, direct-write denial, role escalation denial, Storage-object isolation, agreement version/duplicate checks, early-work wait, draft release/approval replay, original-verification/submission gates and login throttling.

These are isolated database/application tests, not an end-to-end proof of live Supabase Auth, mailbox delivery or Storage upload/download. Real uploads remain closed until those tests pass. SQL role/read-access checks and Supabase advisors are also run on the connected schema after migration.

Before real client collection: complete authenticated two-client upload/download testing; add file malware scanning/quarantine and a tested separate object backup/restore; approve retention/deletion/access-revocation procedures and the portal privacy/DPA configuration; professionally review the engagement eligibility/cancellation clauses; finish the enquiry/engagement-before-payment onboarding path and activation controls; approve recipient/delivery monitoring; test mobile/passwordless recovery and staff MFA recovery. Supabase Pro is recommended for live availability/database backups, but database backups do not back up Storage file objects. EIN and tax-service portal modules follow after ITIN beta testing.

## Nominated client for manual sandbox testing

Set `PORTAL_TEST_CLIENT_EMAIL` to an explicitly nominated tester who has already signed in and has an active client account. Staff with MFA can assign synthetic `example.com` test-payment cases to that account. The original order must still be an automated sandbox test, with a paid Stripe sandbox session whose metadata, category, amount and currency match. No arbitrary browser recipient, unpaid order or live payment can use this override. Assignment is recorded in the audit log; existing cases cannot be reassigned by retrying creation. The form excludes EIN and filters routes by the actual paid ITIN category/amount. Real uploads and public payment activation remain separate launch steps.
