# Editorial image manifest

All production images are compressed WebP files served through `next/image`. They contain no real client records, readable tax identifiers, IRS seals or endorsement badges.

| Image | Intended scenario |
| --- | --- |
| `guide-w7-document-review-v2.webp` | In-person passport inspection and Form W-7 preparation |
| `guide-1040nr-investor-v2.webp` | Foreign investor reviewing a Form 1040-NR filing |
| `guide-royalty-1099-v2.webp` | UK author reviewing publisher royalties and US information reporting |
| `guide-withholding-refund-v2.webp` | Form 1042-S and US withholding refund review |
| `guide-property-firpta-v3.webp` | UK / European seller reviewing a US property sale under FIRPTA |
| `guide-partnership-k1-8805-v2.webp` | Foreign partners reviewing Schedule K-1 and Form 8805 |
| `guide-401k-pension-v2.webp` | UK resident reviewing a 401(k) or pension distribution |
| `guide-family-spouse-dependent-v2.webp` | Spouse and dependent child discussing a family filing |
| `guide-us-bank-account-v2.webp` | Nonresident reviewing US bank onboarding and tax identification |
| `guide-inheritance-estate-v2.webp` | UK beneficiary reviewing a US estate distribution |
| `guide-us-property-sale-v2.webp` | UK / European seller reviewing a US property sale with an adviser |
| `guide-partnership-k1-8805.webp` | Foreign partners reviewing Schedule K-1 / Form 8805 reporting |
| `guide-401k-pension.webp` | Mature UK resident reviewing a 401(k), pension or annuity distribution |
| `guide-us-citizen-spouse.webp` | Foreign spouse and US spouse discussing a joint US tax filing |
| `guide-dependent-child.webp` | Parent and child reviewing dependent documentation |
| `guide-us-bank-account.webp` | Foreign entrepreneur discussing a US business bank account |
| `guide-gambling-withholding.webp` | UK traveller reviewing US casino withholding and refund evidence |
| `guide-student-scholarship.webp` | International student, professor or researcher reviewing university documents |
| `guide-author-royalties.webp` | UK author / creator reviewing US royalty reporting |
| `guide-inheritance-estate.webp` | Beneficiary or executor reviewing a US estate distribution |
| `guide-us-mortgage.webp` | Foreign buyer reviewing a US mortgage and property documents |
| `guide-document-renewal.webp` | Passport inspection, Form W-7 document preparation and ITIN renewal |

The slug-to-image mapping is maintained in `lib/site.ts`. Every guide has an explicit mapping so future category changes cannot silently replace its image with an unrelated generic asset.

The supplied reference images were used only to understand subject matter. The v2/v3 files above are original generated compositions and avoid IRS seals, official badges, real personal data and third-party brand marks. Critical form names, rules and calls to action remain live HTML rather than baked into imagery.
