# ITIN PRO LTD — simple website and MyDocSafe process

Updated 12 November 2026. This replaces the previous custom-portal workflow.

## The process

1. **Website enquiry.** The client selects ITIN, EIN or tax-return support, supplies contact details and answers the existing short basic questions. Requests are saved in the existing Supabase enquiry database and emailed to staff. The website does not create a client case, send an engagement or request payment.
2. **Staff review.** Shan or Taz checks the information already received, confirms the service, fee and documents needed, and replies. Do not ask the client to repeat their website answers in another questionnaire.
3. **Personal MyDocSafe portal.** After a saved ITIN enquiry, the website offers the account owner’s Individual Clients group self-signup link. The client verifies the same email used for the enquiry and establishes their personal portal access. Staff matches the portal to the enquiry by email. EIN and tax-return enquiries continue through the staff-managed invitation process. The existing generic-named portal is a test workspace; never invite unrelated clients into one shared portal.
4. **Sign and exchange documents.** Use MyDocSafe's existing e-signature and Documents features. Send the appropriate engagement, request only the documents needed, and collect missing details through private portal messages. No workflow template or new form builder is required.
5. **Prepare and return.** Staff prepares the forms using the saved enquiry and private documents, requests corrections through the portal, and returns drafts or completed documents there. Arrange the required identity inspection, original signatures and IRS submission separately.
6. **Payment.** Staff arranges payment through the existing agreed business process after engagement. No website checkout, live Stripe integration or MyDocSafe payment automation is part of this change.

## Client-facing links

The website's Client portal link opens https://app.mydocsafe.com. Clients use their invitation and individual login. Do not publish a specific client's portal link or a document-upload bearer link as the general website button. The branded portal.itinpro.uk address can be configured later.

## Staff checklist for each case

- Enquiry reviewed and scope/fee confirmed.
- Correct engagement accepted.
- Required information/documents received and reviewed.
- Payment arranged/recorded manually.
- Preparation, original-document checks and signatures completed as applicable.
- Documents returned and submission/status recorded by staff.

The process can be managed manually for the two-person team. Leave the MyDocSafe workflow editor without sending a workflow; there is no need to delete the test workflow or recreate its stages.

## Trial and launch status

The owner has tested client invitations, client uploads, staff access and notifications, return-document access and simple electronic signatures. The account settings show **United Kingdom** storage. UK storage does not establish every processing or subprocessor location.

The owner confirmed that MyDocSafe replied that its UK Data Processing Agreement applies to this account. United Kingdom storage was verified in the account settings. Staff access controls, retention/deletion periods and the client-specific engagement must be ready before real client document collection. Do not treat the trial tests as a complete security or legal audit.

The privacy notice includes ICO reference **ZC273975**, MyDocSafe processing arrangements, Supabase enquiry storage in Ireland and Render website hosting in Oregon, United States.

## Repository boundary

The custom portal in app/portal, app/api/portal and lib/portal remains frozen. Preserve its sandbox-only switch, synthetic-data gates, private storage restrictions and rejection of live Stripe keys. Supabase remains required for the live enquiry form. No migration, credential or provider configuration change is needed for this process.

## Website signup connection

The account owner's public **Individual Clients group** self-signup link is configured in lib/mydocsafe.ts. After the website saves an ITIN enquiry successfully, a **Continue to secure document upload** button opens this link in a new tab. It is not displayed for a failed or unsent enquiry. Clients verify their email in MyDocSafe, then open Documents to upload requested files. Existing clients can use the header/footer Client portal sign-in link.

Website answers remain in the existing enquiry record and staff notification. They are not automatically copied to MyDocSafe. Staff matches by email, so clients should use the same email for both steps. No email, personal details or enquiry ID is appended to the signup URL.

This is a linked customer journey, not an API synchronisation. We have verified the supplied signup address responds, without submitting an email or creating an account. Check a new test signup produces a private client portal in the intended group before relying on it for additional clients. Never replace the group link with a single client's invitation or document-upload bearer link.
