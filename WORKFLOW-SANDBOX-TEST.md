# Engagement-first sandbox acceptance test

This change implements the ITIN workflow approved on 13 October 2026. It is not a production launch. EIN and tax-return enquiries keep their separate existing flow.

## Behaviour

- Public ITIN intake asks seven screening questions and supports **Help me choose**. It does not collect passport/tax identifiers or offer checkout.
- Ready-client self-service is available for supported fixed-fee routes when SSN/passport/prior-application/evidence answers are consistent and document/original-verification declarations are complete. This is onboarding screening based on client declarations, not CAA certification or a final eligibility decision. Unsupported/complex/uncertain routes, missing evidence, prior failures and contact requests use the assisted path.
- MFA-authenticated staff review a synthetic enquiry, confirm the route and canonical fee, record eligibility/evidence/original-document/fee checks, and issue an engagement with a client invitation.
- Case, pending payment order, frozen engagement and review audit are created together in one transaction. Issuing the engagement does not create a Stripe checkout session or charge anyone.
- Client signing happens before payment. Signing a new case automatically creates/finalizes/sends a Stripe sandbox service invoice bound to the case and signed agreement hash. The client can open the same invoice from Payment; staff can resend it without creating another invoice. A durable portal payment-request email handles Stripe’s sandbox email suppression. Provider acceptance is not proof of inbox receipt. Existing checkout cases retain their checkout path. Stale incomplete invoice requests and void invoices require adviser review.
- A verified Stripe webhook reconciles the matching order. Only confirmed payment unlocks questionnaire saves and uploads. The return URL alone does not unlock anything.
- Clients see four steps: Engagement → Payment → Your details → Documents. A compact progress indicator replaces client tabs; Back/Continue actions stay beside the task. Signing advances to payment; verified payment advances to details. Only staff see the full case-management tabs.
- Payment opens in a separate window when the browser permits it, keeping the current application in place. The portal checks confirmation on focus and every 15 seconds while the payment step is visible.
- Documents appear one at a time, with optional requirements/help and the passport illustration. Final review lists missing required uploads; both the client and server block sending incomplete required uploads. Draft decisions and later requests appear within step 4 when needed.
- Questionnaire has five short sections, partial server saves and revision checks. Foreign address is validated when sending for review. Case navigation saves pending edits; closing with unsaved edits prompts a warning. Screen, questionnaire part and document position are view-only URL parameters, containing no answers or credentials. Required foreign-address completion returns the client to the address part; client questionnaire tabs are replaced by bottom navigation.
- Clients can save the signed engagement as a PDF using the engagement's print/save button. W-7 wet signing, CAA interview and original-document inspection remain separate.
- Client portal links are present in desktop/mobile navigation and footer. The portal remains noindex and clearly labelled as a test version.

## Applied schema

Both `20261013164052_engagement_first_workflow.sql` and `20261013191500_selfservice_and_invoice_workflow.sql` were applied to the existing ITIN PRO Supabase project. Existing cases default to `legacy-paid-first`, preserving their signing rule. New sensitive tables/RPCs have no direct anonymous or authenticated write access; server operations must check session ownership or staff MFA.

## Verification completed

Production build and type checking pass. All 37 automated tests pass, including real Postgres/PGlite tests for transactional creation, unsigned-payment rejection, webhook unlock, client isolation, staff MFA, stale agreement/revision rejection, duplicate operations and legacy compatibility; checkout and invoice tests verify frozen fees, signed-agreement binding, identical retry parameters, reopening/resending the same invoice and stale/void guards. SQL tests check automated declaration gates and distinguish automatic audit events from staff actions.

Security advisors show no new schema warnings. Existing server-only tables intentionally have RLS with no public policies. An existing leaked-password-protection warning remains; this portal signs in through email links.

The revised client screens render successfully in the component checks. The cloud browser rejected opening the local offline fixture because file URLs are blocked; no alternate browser route was used. A synthetic interactive HTML demonstration is available for owner review. This is not a real authenticated payment/upload acceptance test. Desktop/mobile interaction, real inbox receipt, real sandbox Stripe checkout and upload/download remain to be verified in the deployed sandbox. They must not be described as passed yet.

## Deployment configuration

Repository publication was explicitly approved on 13 October 2026. Use the existing Render ITIN PRO LTD workspace and `itinpro-uk` service. Merge only after reviewing the changes. Configure `APP_URL=https://itinpro.uk`, `PORTAL_MODE=sandbox`, `PORTAL_STAFF_EMAIL=shan@itinpro.uk` and `PORTAL_TEST_CLIENT_EMAIL=janakader@gmail.com`.

Enable `PAYMENTS_ENABLED=true` only for the existing matching **test** key/catalog and `PORTAL_UPLOADS_ENABLED=true` for dummy-document testing. The application rejects live Stripe keys and live events. Merge environment changes without replacing existing secrets. No live-account activation or live-key change is part of this work.

## Guided manual test

1. First test the automatic path: choose prepared Form 1040-NR, online/ready, answer No to SSN eligibility and prior ITIN applications, Yes to current passport/prepared return, then provide a synthetic engagement address/year and confirm all three declarations. Check that an engagement is issued without staff action, then complete steps 3–7. Also test that uncertain SSN eligibility, missing declarations, a prior non-renewal application and an unsupported route use the assisted path.
2. Open `https://itinpro.uk/?sandbox=1#enquiry`. Choose ITIN and **Help me choose**, then online/ready. Use **TEST Applicant**, `workflow-test@example.com`, a dummy phone and synthetic answers. Submit and check the staff notification arrives.
3. Open `/portal` as `shan@itinpro.uk`, complete existing staff MFA, and select the new eligibility enquiry. Use a supported route such as spouse, a synthetic address/year, and review notes. Confirm the four screening checks and issue the engagement.
4. Open the client invitation at `janakader@gmail.com`. Confirm no payment is required to read/sign the engagement. Confirm Information/Documents are locked. Sign as **TEST Applicant** and save the signed letter as PDF.
5. Open the Stripe test invoice after signing. Verify Shaan can resend the same invoice ID. Start the test payment. Use Stripe test-card details only. Confirm the quoted fee and GBP currency. Leave the invoice once and verify the engagement stays signed and collection stays locked. Reopen the same invoice and complete payment.
6. Refresh the case until the webhook confirms payment. Check Information/Documents unlock; merely returning from Stripe must not unlock them. Do not pay again while confirmation is pending.
7. Enter only dummy questionnaire answers. Verify partial saving, switching sections, returning after sign-out and mobile layout. Confirm a missing foreign address blocks sending for review and another client cannot see the case.
8. Upload dummy PDF/JPG/PNG files. Staff review scans, request one replacement and release a dummy draft. Client approves the exact draft. Staff record only simulated original checks and submission; no real IRS filing occurs.
9. Confirm every email goes to the existing approved test/staff recipients, download access works only for the correct case, and no real personal information entered the test.

## Remaining before production

Complete the deployed manual test and review any failures. Separately confirm live Stripe account activation, production payment catalog/webhooks, production portal/storage controls and the firm's pending ICO/retention arrangements. This sandbox change alone does not clear real-client onboarding.
