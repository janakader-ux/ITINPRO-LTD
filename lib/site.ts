export const contact = {
  taz: { name: 'Thasneem Alzari (Taz) CAA', email: 'Taz@itinpro.uk', phone: '+44 7864 113967' },
  shan: { name: 'Shan', email: 'Shan@itinpro.uk', phone: '+44 7864 999586' },
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
  { slug: 'itin-form-w7', title: 'ITIN application — Form W-7', short: 'All eligible W-7 categories, evidence review and compliant document route.', image: '/images/guide-w7-document-review-v2.webp' },
  { slug: '1040nr-tax-return', title: '1040-NR tax returns', short: 'US non-resident filing support for income, withholding and refund claims.', image: '/images/guide-1040nr-investor-v2.webp' },
  { slug: 'gambling-refund', title: 'Gambling withholding review', short: 'Eligibility review and 1040-NR support where US gambling tax was withheld.', image: '/images/guide-withholding-refund-v2.webp' },
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
  'itin-for-us-gambling-winnings-refund': '/images/guide-withholding-refund-v2.webp',
  'itin-for-us-inheritance-estate-distribution': '/images/guide-inheritance-estate-v2.webp',
  'itin-for-amazon-kdp-authors-uk': '/images/guide-royalty-1099-v2.webp',
  'what-is-an-itin': '/images/guide-w7-document-review-v2.webp',
  'why-do-i-need-an-itin': '/images/hero-consultation.webp',
  'itin-vs-ssn': '/images/guide-w7-document-review-v2.webp',
  'how-to-apply-for-itin-from-uk': '/images/guide-w7-document-review-v2.webp',
  'certifying-acceptance-agent-itin': '/images/guide-w7-document-review-v2.webp',
  'itin-for-form-1040nr': '/images/guide-1040nr-investor-v2.webp',
  'itin-for-llc-owner': '/images/guide-partnership-k1-8805-v2.webp',
  'itin-for-partnership-interest': '/images/guide-partnership-k1-8805-v2.webp',
  'itin-for-us-bank-account': '/images/guide-us-bank-account-v2.webp',
  'itin-for-spouse-of-us-citizen': '/images/guide-family-spouse-dependent-v2.webp',
  'how-to-renew-itin': '/images/guide-document-renewal.webp',
  'itin-expired-how-to-check': '/images/guide-document-renewal.webp',
  'itin-for-401k-pension-annuity': '/images/guide-401k-pension-v2.webp',
  'itin-for-sale-of-us-property': '/images/guide-property-firpta-v3.webp',
  'itin-for-royalty-rental-income-uk-treaty': '/images/guide-royalty-1099-v2.webp',
  'itin-for-dependents': '/images/guide-family-spouse-dependent-v2.webp',
  'allowable-tax-benefit-itin': '/images/guide-family-spouse-dependent-v2.webp',
  'itin-for-children-documents': '/images/guide-family-spouse-dependent-v2.webp',
  'itin-for-students-f1-j1-m1': '/images/guide-student-scholarship.webp',
  'itin-for-professors-researchers-honoraria': '/images/guide-student-scholarship.webp',
  'itin-for-us-mortgage-interest': '/images/guide-us-mortgage.webp',
  'itin-acceptable-documents-passport': '/images/guide-w7-document-review-v2.webp',
  'itin-processing-time': '/images/guide-w7-document-review-v2.webp',
  'itin-and-e-filing-rules': '/images/guide-1040nr-investor-v2.webp',
  'form-w7-mistakes-line-by-line': '/images/guide-w7-document-review-v2.webp',
  'itin-for-deceased-taxpayer': '/images/guide-inheritance-estate-v2.webp',
  'itin-does-not-give-work-rights': '/images/hero-consultation.webp',
  'itin-help-london-luton-heathrow-bedford-milton-keynes': '/images/mobile-visit.webp'
};

export function guideImage(category: string, slug?: string) {
  if (slug && guideImages[slug]) return guideImages[slug];
  if (/Property/i.test(category)) return '/images/guide-property-firpta-v3.webp';
  if (/Business|Treaty/i.test(category)) return '/images/guide-partnership-k1-8805-v2.webp';
  if (/Family|Study|Retirement|Special/i.test(category)) return '/images/guide-family-spouse-dependent-v2.webp';
  if (/Documents|Process|Renewal/i.test(category)) return '/images/guide-document-renewal.webp';
  return '/images/guide-1040nr-investor-v2.webp';
}
