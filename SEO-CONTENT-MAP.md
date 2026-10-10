# ITIN Pro UK search-intent map

Updated: 10 October 2026

This plan uses current search-result language and official IRS terminology. It does not claim keyword volumes without first-party Google Search Console or Google Ads Keyword Planner data.

| High-intent query cluster | Intent | Primary page |
| --- | --- | --- |
| ITIN application UK / apply for ITIN from UK | Apply / compare providers | `/guides/how-to-apply-for-itin-from-uk` |
| IRS Certifying Acceptance Agent UK / CAA ITIN UK | Find a regulated route | `/guides/certifying-acceptance-agent-itin` |
| ITIN without mailing passport to IRS | Solve document-risk concern | `/guides/certifying-acceptance-agent-itin` |
| Form W-7 UK / W-7 help UK | Application support | `/services/itin-form-w7` |
| 1040NR filing UK / US nonresident tax return UK | File a return / refund claim | `/guides/itin-for-form-1040nr` |
| ITIN US property sale UK / FIRPTA ITIN | Transaction deadline | `/guides/itin-for-sale-of-us-property` |
| ITIN Schedule K-1 UK / Form 8805 foreign partner | Partnership reporting | `/guides/itin-for-partnership-interest` |
| ITIN for US LLC owner UK | Business compliance | `/guides/itin-for-llc-owner` |
| ITIN for Amazon KDP UK / author royalty ITIN | Reduce/report royalty withholding | `/guides/itin-for-amazon-kdp-authors-uk` |
| US gambling tax refund UK / casino withholding 1040NR | Refund investigation | `/guides/itin-for-us-gambling-winnings-refund` |
| ITIN for 401k withdrawal UK / US pension ITIN | Retirement distribution | `/guides/itin-for-401k-pension-annuity` |
| ITIN spouse of US citizen UK | Joint-return support | `/guides/itin-for-spouse-of-us-citizen` |
| ITIN dependent child UK / child ITIN documents | Family filing | `/guides/itin-for-dependents` |
| ITIN US inheritance UK / estate distribution ITIN | Beneficiary reporting | `/guides/itin-for-us-inheritance-estate-distribution` |
| ITIN for US bank account UK | Banking / reporting evidence | `/guides/itin-for-us-bank-account` |
| ITIN renewal UK / expired ITIN | Renewal | `/guides/how-to-renew-itin` |
| acceptable ITIN documents UK / passport verification | Document checklist | `/guides/itin-acceptable-documents-passport` |
| ITIN agent Bedford / Milton Keynes / Luton / London | Local appointment | `/guides/itin-help-london-luton-heathrow-bedford-milton-keynes` |

## Conversion and GEO implementation

- Each guide opens with a direct question and relatable applicant scenario.
- Every guide contains a practical takeaway, reader question and enquiry CTA.
- Every guide emits `Article`, `BreadcrumbList` and `FAQPage` structured data.
- Titles, descriptions and keyword metadata align with the applicant's task rather than repeating generic “ITIN services” phrasing.
- `llms.txt` summarises services, scenarios, compliance boundaries and contact routes for AI crawlers.
- The main differentiator is stated precisely: eligible originals need not be mailed to the IRS, but a remote CAA interview still requires the CAA to possess the original or issuing-agency certified copy.

## Measurement after launch

1. Connect Google Search Console and submit `/sitemap.xml`.
2. Configure GA4 using `NEXT_PUBLIC_GA_MEASUREMENT_ID`; the tag remains consent-gated.
3. Track Search Console impressions, clicks, average position and page-level queries monthly.
4. Track completed enquiry submissions as the primary conversion after Supabase and Resend are configured.
5. Expand pages using actual Search Console query data; do not add repetitive city pages or invented search-volume claims.
