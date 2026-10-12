# ITIN PRO LTD — simpler client workflow

## Client entry

Three navigation choices: **ITIN/EIN Tax Return Service**, **ITIN Application**, **List of Information Required**. The service overview contains separate ITIN, EIN and U.S. tax-return cards, each with **Click Here**. The initial application selector is labelled **You want to**. All 24 reviewed ITIN situations remain available in the category dropdown; the corresponding canonical fee appears directly below. EIN is £375 all-inclusive, no VAT. Tax-return preparation is quoted separately.

The short service selector is placed ahead of the detailed home-page guides. A client sees a short optional checklist rather than immigration evidence or exception instructions. First name, last name, email and phone are mandatory for every request. Names and contact information are entered, rather than restricted to dropdowns. Country, status and other constrained application fields use dropdowns privately.

Every service offers:

- **A. I would like to complete the form application here.**
- **B. I just want somebody to contact me, and I will send the information via email.**

Online ITIN and EIN choices then ask **Are you ready to proceed?** with explicit Yes/No buttons. No and contact-only requests go to staff without checkout. The public form collects no passport, SSN, ITIN, EIN or company identifiers.

## Chosen order

1. Select service/category and see the fee.
2. Select online or contact assistance; confirm readiness for online applications.
3. Submit the four contact details and privacy consent.
4. Staff confirms the application route and issues the appropriate service-specific engagement.
5. Client accepts the engagement electronically; staff arranges payment.
6. After confirmed payment, invite the client to complete the relevant private application and upload documents now or later.
7. Client selects **Complete Process** to request review; notify staff without attaching sensitive documents.
8. Staff requests any missing information, prepares the forms and releases a draft for accuracy approval.
9. Arrange original signing and identity verification before recording submission.

Route confirmation is a short staff handoff, not an extra public questionnaire. It prevents charging for an unsupported exception and keeps the initial form reassuring.

## Service differences

| Service | Initial request | Private work after engagement/payment |
| --- | --- | --- |
| ITIN | Category, fee, contact preference, readiness, four contact fields | Internal W-7 preparation information or completed W-7 upload, mandatory foreign-address information, relevant evidence and supporting-letter draft where appropriate |
| EIN | £375 fee, short company formation/SS-4 checklist, contact preference, readiness, four contact fields | Separate EIN engagement; formation evidence; legal/trade name, mailing/physical address, responsible party and identifier/eligibility, entity/LLC type and members, reason, dates/accounting month, business activity, employees/first wages where relevant and prior EIN history; reviewed SS-4 and applicable signature/designee authorisation. No Form 8821 intake. |
| Tax return | Filing reason dropdown and four contact fields, contact preference | Staff contact and quote. No public tax questionnaire, uploads or checkout. Detailed return information only after separately agreed scope. |

The tax reason list includes 1040-NR, 1040/joint filing, rental, property sale, partnership, pension, royalties/investments, employment/scholarship, withholding refund and amended/overdue returns, plus a request for advice. This is enquiry triage, not a determination of filing status.

## Document instructions

Only the chosen ITIN checklist is shown privately. Relevant routes cover prepared 1040-NR/renewal returns, FIRPTA transaction evidence and applicable Forms 8288/8288-A or withholding-certificate documents, pension/401(k) issuer evidence, dependent residency/medical/school evidence, and other applicable routes. Do not impose an unsupported blanket visa-duration or filing-status rule; the reviewer confirms eligibility.

Passport preparation scan: the complete open spread, including the photo/data page and facing top page, all edges and readable text. No half-page crop. The scan supports preparation; subsequent CAA inspection of the original passport or acceptable issuing-agency-certified copy remains separate.

The engagement may be accepted electronically. Draft approval confirms accuracy only. Form W-7 requires its original handwritten signature and separate CAA verification. The internal questionnaire is not an IRS form or signature.

Supporting letters: the actual authorised issuer uses official letterhead and a handwritten blue-ink signature; clients retain the original and upload a clear scan. Explain that blue ink helps distinguish an original handwritten signature from a reproduced/digital-looking signature, reducing avoidable queries based on office experience. Do not describe blue ink as a universal IRS ink-colour rule, claim a rejection percentage or automatically accept digital signatures. Any issuer-specific alternative requires CAA review.

Exception 1(d) distribution template: actual withholding agent, applicant, current tax year, income/distributions and actual federal reporting/withholding obligation. The issuer must verify the facts. A company ownership letter alone does not establish eligibility.

Partnership/LLC taxed as a partnership: include signed agreement pages showing the partnership name, applicant name/signature and membership in a partnership conducting business in the United States. Show the EIN in the agreement or accompanying CP575/147C evidence as allowed by the current CAA guidance. The additional letter template supplements, rather than replaces, the agreement.

Foreign-address information remains mandatory in the private ITIN preparation record and enforced on save/review. If a client has relocated to the US and no longer has a foreign residence, escalate to the CAA for the permitted IRS treatment rather than inventing an address.

## Implementation and release state

This branch implements the simplified public enquiry, validates and saves its selections in the existing enquiry record, routes the request to staff, removes immediate public checkout from this new flow, provides editable issuer-letter drafts in the private ITIN case, makes the general detailed portal guide optional, opens cases at the engagement tab and labels final review **Complete Process** with a staff notification.

The engagement-before-payment sequence is a **staff-managed handoff** in this release. It does not automatically create a new client account, send an engagement from the short public enquiry, or start a self-service EIN case. The existing sandbox portal still creates ITIN cases from confirmed paid test orders and records their engagement afterwards. Do not present that test sequence as the completed new end-to-end automation. A later implementation requires pre-payment case creation/acceptance, a separate reviewed EIN agreement and SS-4 case type, secure invitation, payment gating and integration verification. Never reuse the ITIN-only engagement for EIN.

Existing sandbox safeguards remain: no live payments; dummy uploads only. These restrictions cannot be removed by changing public wording.

## Primary references reviewed 12 October 2026

- https://www.irs.gov/instructions/iw7
- https://www.irs.gov/individuals/itin-acceptance-agent-program (Exception 1(a) CAA requirements effective 1 June 2026)
- https://www.irs.gov/instructions/iss4
