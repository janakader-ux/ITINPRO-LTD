# Payment-last sandbox workflow

Client steps: **Engagement → Your details → Documents → Payment**. One screen at a time, with saved progress and bottom navigation.

Clients sign a service-specific, priced engagement before providing detailed information. Signed clients can save partial answers and upload dummy documents before payment. They can continue with missing items; the server records those items for follow-up. Finishing Documents prepares the payment request. The invoice is not created merely by signing. Professional review and preparation remain payment-gated, and existing early-work/cancellation terms still apply. Accepted older engagements keep their original payment controls; only unsigned, unissued cases move to the new order.

The invoice retry window starts at the first invoice attempt rather than enquiry creation. Persisted invoices reopen rather than creating another charge. Confirmed payment moves the new case to review and creates one durable staff notification. Individual pre-payment uploads do not trigger staff notifications.

## Manual acceptance test

1. Create a synthetic ready case, or have Shaan issue an engagement for a synthetic short enquiry. Use a TEST name and an @example.com source address. Invitation recipient remains janakader@gmail.com.
2. Read the fee and engagement. Sign as the TEST applicant. Confirm no invoice is requested yet.
3. Fill some dummy details, leave one answer unknown, and save. Navigate forward/back and sign out/in to verify saved answers.
4. Upload a dummy file and leave one required document missing. Confirm you can continue to Payment and the missing items are recorded.
5. Open the Stripe test invoice; check the agreed GBP fee and the same invoice when reopening or staff resending. Use a Stripe test card only. Returning without payment must not begin professional review.
6. Wait for the signed webhook confirmation. Confirm the case moves to review, the receipt appears, and one review notification is queued. Check correct-case download permissions and mobile navigation.
7. Staff request missing information, review dummy scans, and release a dummy draft only after confirmed payment and the engagement work-start gate. Final foreign-address checks and original-document/signature checks remain required before simulated submission.

No real payment, document or IRS submission is authorized by these tests. Sandbox keys, dummy-only upload declarations and staff MFA stay enabled. Full authenticated signing, card payment, uploads, inbox receipt and mobile interaction still require the owner's manual acceptance test before production.


## Category instructions — 14 October 2026

The Documents stage contains three sections: category, standard documents, and category supporting evidence. The uploaded package supplies 26 client guides and 100 supporting-document entries. Only compatible guide variants appear for a reviewed service. Pension, partnership, rental, estate and general withholding variants require a saved choice; single-match routes select their guide automatically. Routes without an exact pack category retain the adviser checklist. EIN stays separate.

The portal provides complete UTF-8 instruction downloads and editable fictional letter drafts. Internal practitioner notes are not imported into the client bank. Portal adaptations specify blue ink as ITIN PRO practice, use secure portal support rather than email passport attachments, preserve current dependent-record rules, distinguish FIRPTA alternatives, and remove a universal ITIN-before-W-8BEN claim. The uploaded Word originals are unchanged.

Category and missing-document notes are saved under narrowly validated keys in existing case screening JSON; original screening declarations, route, fee and signed engagement stay unchanged. Concurrent changes use a compare-and-update filter. Changing the guide is blocked after intake is submitted for payment. Mandatory items cannot be marked not applicable; missing mandatory items remain recorded for staff follow-up. Payment-last cases may proceed with missing evidence, but simulated submission checks the mandatory checklist. Older accepted workflows retain their original upload IDs.

Acceptance checks:

1. On a synthetic pension case, select B12. Confirm beneficiary-specific files, conditional relationship evidence, optional death certificate and the matching sample. Save a missing-file note, reload and verify it on the client and staff views.
2. Confirm B14 cannot be submitted as a pension guide, mandatory files cannot be marked not applicable, and altered caller fees/routes/screening declarations are ignored.
3. Select B4/B5 for a partnership; confirm the agreement/EIN evidence remains mandatory. On D3, confirm alternative FIRPTA branches are conditional rather than all mandatory. CAA confirms the applicable branch.
4. Open the category instruction download with the signed-in owner, then sign out and test access denial. Verify another client's case cannot be downloaded.
5. Continue to payment with one missing mandatory file; confirm the selected guide, notes and missing IDs persist. Invoice is created at the document handoff, confirmed webhook payment begins review, and retries reuse the existing invoice.
6. Resolve missing evidence and complete staff original-document, draft and signature checks before simulated submission.

Automated verification covers all guide mappings, conditional requirements, rejected-file handling, older checklist compatibility, three-section rendering, download fail-closed behaviour, plus existing signing/payment/webhook/Postgres RLS tests. Authenticated browser signing/upload/card/receipt and mobile acceptance require the owner's portal session; do not report these as completed from unit tests.


## Document review and permanent versions — 14 October 2026 update

FIRPTA now asks for ITIN only or ITIN plus a refund return, seller/buyer role, completion, transaction year and purpose. The selected path creates mandatory evidence requirements. A current-year annual refund-return request displays next-year timing; withholding-certificate and non-recognition work require their own evidence and adviser review. Return preparation and specialist certificate work are separately quoted.

Document intake is stored separately from eligibility screening. Each case retains its issued instruction snapshot and download hashes; staff revisions archive the old version, record the reason, request renewed evidence and clear prior evidence acceptance. The packet includes 26 Word guides and 21 editable fictional letter templates. Templates explain issuer letterhead and wet-signature preparation, with blue ink described as ITIN PRO practice.

Uploaded files do not satisfy verification or simulated submission until staff accept them. Required originals must be checked, and conditional items require a recorded staff applicability decision. Existing signing, work-start and payment controls continue to apply.

Additional acceptance checks:

1. On a synthetic FIRPTA case, switch between completed sale, purchaser reporting and certificate paths before document handoff; verify the mandatory evidence changes. A buyer whose seller is not confirmed foreign must be referred for review.
2. For a 2026 refund request, verify the 2027 annual-return notice and separate fee wording. For a prior-year request, verify the signed return, basis records and remittance evidence are mandatory.
3. Leave a required document missing and continue to payment; verify it remains flagged and prevents simulated submission. Upload a dummy scan; verify upload alone still does not remove that block.
4. Staff accept dummy evidence, decide conditional applicability and check required originals. Verify only then that document controls allow the next stage, subject to the other draft/signature gates.
5. Revise instructions with a reason; verify old downloads remain accessible only to the correct case, the new version appears and old evidence acceptance is cleared.
6. Download a Word guide and editable letter while authenticated; verify filenames, formatting and archived file integrity.

Release status: the shared Supabase migration and public GitHub publishing require explicit approval following the prior automatic-review rejection. Authenticated browser signing/upload/Stripe test payment/receipt acceptance remains pending. Local tests do not establish that deployed browser flow is complete.
