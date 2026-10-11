export const contact = {
  taz: { name: 'Thasneem Alzari (Taz) CAA', email: 'Taz@itinpro.uk', phone: '+44 7864 113967' },
  shan: { name: 'Shan', email: 'Shan@itinpro.uk', phone: '+44 7864 998586' },
  address: '18 Sundew Close, Bedford, Bedfordshire, MK42 0SR, United Kingdom'
};

export const company = {
  legalName: 'ITIN PRO LTD',
  companyNumber: '17336134',
  status: 'Active',
  type: 'Private limited Company',
  registeredOffice: '18 Sundew Close, Bedford, England, MK42 0SR',
  companiesHouseUrl: 'https://find-and-update.company-information.service.gov.uk/company/17336134'
};

export const services = [
  { slug: 'itin-form-w7', title: 'ITIN application — Form W-7', short: 'All eligible W-7 categories, evidence review and compliant document route.', image: '/images/campaign/itin-form-w7-application.webp' },
  { slug: '1040nr-tax-return', title: '1040-NR tax returns', short: 'US non-resident filing support for income, withholding and refund claims.', image: '/images/campaign/itin-1040nr-nonresident-filer.webp' },
  { slug: 'gambling-refund', title: 'Gambling withholding review', short: 'Eligibility review and 1040-NR support where US gambling tax was withheld.', image: '/images/campaign/itin-gambling-gaming-winnings.webp' },
  { slug: 'mobile-verification', title: 'UK mobile appointments', short: 'Bedford appointments and agreed home or office visits with quoted travel costs.', image: '/images/mobile-visit.webp' }
];

export const faqs = [
  { question: 'Can I get an ITIN in the UK without mailing my passport to the IRS?', answer: 'Often, yes. For eligible applicants, a Certifying Acceptance Agent can inspect the original passport or an issuing-agency certified copy, prepare Form W-7 (COA), and submit the application without sending that verified document to the IRS. Applicant type and document rules must be checked first.' },
  { question: 'Can a video call replace the passport inspection?', answer: 'No. IRS guidance permits video conferencing for the interview, but the CAA must have the original identification document or an issuing-agency certified copy in their possession during the interview.' },
  { question: 'Does using a CAA make the IRS issue an ITIN faster?', answer: 'A CAA can reduce document risk and avoid sending eligible original documents to the IRS. It does not control or guarantee IRS processing time or approval.' },
  { question: 'Can you visit my home or office?', answer: 'Appointments can be arranged in Bedford and, subject to availability and an agreed travel fee, at homes or offices across the UK. Selected St Pancras, Heathrow and Luton meeting options may also be available.' },
  { question: 'Can UK residents reclaim US casino withholding?', answer: 'Some non-resident taxpayers may be eligible for treaty treatment or a refund, depending on the gambling type, documents, residence and filing facts. A 1040-NR review is required; eligibility is never automatic.' }
];

const guideImages: Record<string, string> = {
  'itin-for-us-gambling-winnings-refund': '/images/campaign/itin-gambling-gaming-winnings.webp',
  'itin-for-us-inheritance-estate-distribution': '/images/campaign/itin-us-inheritance.webp',
  'itin-for-amazon-kdp-authors-uk': '/images/campaign/itin-amazon-kdp-royalties.webp',
  'what-is-an-itin': '/images/campaign/itin-form-w7-application.webp',
  'why-do-i-need-an-itin': '/images/campaign/itin-form-w7-application.webp',
  'itin-vs-ssn': '/images/campaign/itin-form-w7-application.webp',
  'how-to-apply-for-itin-from-uk': '/images/campaign/itin-form-w7-application.webp',
  'certifying-acceptance-agent-itin': '/images/campaign/itin-form-w7-application.webp',
  'itin-for-form-1040nr': '/images/campaign/itin-1040nr-nonresident-filer.webp',
  'itin-for-llc-owner': '/images/campaign/itin-us-llc-owner.webp',
  'itin-for-partnership-interest': '/images/campaign/itin-partnership-k1-8805.webp',
  'itin-for-us-bank-account': '/images/campaign/itin-us-bank-account.webp',
  'itin-for-spouse-of-us-citizen': '/images/campaign/itin-spouse-us-citizen.webp',
  'how-to-renew-itin': '/images/campaign/itin-renewal.webp',
  'itin-expired-how-to-check': '/images/campaign/itin-renewal.webp',
  'itin-for-401k-pension-annuity': '/images/campaign/itin-us-pension-401k-1099r.webp',
  'itin-for-sale-of-us-property': '/images/campaign/itin-us-property-firpta.webp',
  'itin-for-royalty-rental-income-uk-treaty': '/images/campaign/itin-amazon-kdp-royalties.webp',
  'itin-for-dependents': '/images/campaign/itin-dependent-child.webp',
  'allowable-tax-benefit-itin': '/images/campaign/itin-dependent-child.webp',
  'itin-for-children-documents': '/images/campaign/itin-dependent-child.webp',
  'itin-for-students-f1-j1-m1': '/images/campaign/itin-student-researcher.webp',
  'itin-for-professors-researchers-honoraria': '/images/campaign/itin-student-researcher.webp',
  'itin-for-us-mortgage-interest': '/images/campaign/itin-us-bank-account.webp',
  'itin-acceptable-documents-passport': '/images/campaign/itin-form-w7-application.webp',
  'itin-processing-time': '/images/campaign/itin-form-w7-application.webp',
  'itin-and-e-filing-rules': '/images/campaign/itin-1040nr-nonresident-filer.webp',
  'form-w7-mistakes-line-by-line': '/images/campaign/itin-form-w7-application.webp',
  'itin-for-deceased-taxpayer': '/images/campaign/itin-us-inheritance.webp',
  'itin-does-not-give-work-rights': '/images/campaign/itin-1040nr-nonresident-filer.webp',
  'itin-help-london-luton-heathrow-bedford-milton-keynes': '/images/mobile-visit.webp'
};

export function guideImage(category: string, slug?: string) {
  if (slug && guideImages[slug]) return guideImages[slug];
  if (/Property/i.test(category)) return '/images/campaign/itin-us-property-firpta.webp';
  if (/Business|Treaty/i.test(category)) return '/images/campaign/itin-partnership-k1-8805.webp';
  if (/Family/i.test(category)) return '/images/campaign/itin-spouse-us-citizen.webp';
  if (/Study/i.test(category)) return '/images/campaign/itin-student-researcher.webp';
  if (/Retirement/i.test(category)) return '/images/campaign/itin-us-pension-401k-1099r.webp';
  if (/Renewal/i.test(category)) return '/images/campaign/itin-renewal.webp';
  if (/Documents|Process|Special/i.test(category)) return '/images/campaign/itin-form-w7-application.webp';
  return '/images/campaign/itin-1040nr-nonresident-filer.webp';
}
