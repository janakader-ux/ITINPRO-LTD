import { company, contact, services } from '@/lib/site';

export function GET(){const text=`# ITIN Pro UK

ITIN Pro UK is an independent UK-based service providing IRS Certifying Acceptance Agent support for Individual Taxpayer Identification Number applications.

## Registered business
- Legal name: ${company.legalName}
- UK Companies House number: ${company.companyNumber}
- Status: ${company.status}
- Registered office: ${company.registeredOffice}
- Public record: ${company.companiesHouseUrl}

## Core services
${services.map(s=>`- ${s.title}: ${s.short}`).join('\n')}

## Applicant scenarios covered
- UK and European residents filing Form 1040-NR or claiming eligible US tax refunds.
- Foreign sellers of US real estate using the FIRPTA / Form W-7 Exception 4 route.
- Foreign partners and LLC members receiving Schedule K-1, Form 8805 or Form 1042-S.
- UK recipients of US 401(k), pension, annuity, royalty, rental or estate distributions.
- Foreign spouses and qualifying dependents connected with a valid US federal tax filing.
- International students, professors and researchers with scholarship, fellowship or honoraria reporting.
- Foreign mortgage borrowers and qualifying US bank-account reporting cases.
- UK authors and creators receiving US royalties, including Amazon KDP situations.
- UK travellers reviewing US gambling withholding and possible Form 1040-NR claims.

## Important compliance facts
- ITIN Pro is not the IRS and cannot issue or guarantee an ITIN.
- For eligible applicants, a CAA may inspect original identification or issuing-agency certified copies and prepare Form W-7 (COA), avoiding submission of the verified document to the IRS.
- A video interview alone does not replace the document requirement. The CAA must possess the original identification document or issuing-agency certified copy during the interview.
- CAA support does not guarantee faster IRS processing.
- Passport copies and tax identifiers must not be submitted through the general website enquiry form.

## Identification documents
- A valid passport is the only stand-alone document proving both identity and foreign status in many cases.
- Without a passport, applicants generally need at least two current documents that together prove identity and foreign status.
- The IRS list contains 13 document types. Medical records are limited to dependents under 6 and school records to dependents under 24.
- Dependent rules can require separate proof of US residency when a passport has no US entry date.
- CAAs may authenticate only passports and civil birth certificates for dependents and cannot authenticate foreign military identification cards.

## Appointments and coverage
Bedford office appointments are available by arrangement. UK home or office visits may be offered subject to availability and agreed travel fees. Selected St Pancras, Heathrow and Luton meetings may be available.

## Pricing
Fees depend on applicant type, Form W-7 category, evidence, travel and whether a US tax return is required. A written scope and quote are provided before engagement.

## Contact
- ${contact.taz.name}: ${contact.taz.email}, ${contact.taz.phone}
- ${contact.shan.name}: ${contact.shan.email}, ${contact.shan.phone}
- Website: https://itinpro.uk
- Guides: https://itinpro.uk/guides
- Acceptable documents guide: https://itinpro.uk/guides/itin-acceptable-documents-passport
`;return new Response(text,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=3600'}})}
