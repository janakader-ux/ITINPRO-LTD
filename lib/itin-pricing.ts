// One shared catalogue for the form and server-side price selection.
// Amounts are GBP pence; ITIN fees cover Form W-7/CAA, while EIN is a separate service.
export const itinCategories = [
  { id: 'spouse', label: 'ITIN for spouse of a US citizen', amount: 39500 },
  { id: 'renewal', label: 'ITIN renewal', amount: 39500 },
  { id: 'prepared-1040nr', label: 'ITIN with an already prepared 1040-NR tax return', amount: 39500 },
  { id: 'llc', label: 'ITIN for an LLC', amount: 42500 },
  { id: 'llc-bank-account', label: 'ITIN for LLC owner with a US bank account (LLC and EIN required)', amount: 42500 },
  { id: 'partnership', label: 'ITIN for a partnership', amount: 45000 },
  { id: 'firpta', label: 'ITIN for sale of US property / FIRPTA', amount: 45000 },
  { id: 'pension-estate', label: 'ITIN for 401(k), US estate income or pension plan', amount: 49500 },
  { id: 'complex-compensation', label: 'ITIN for wages, scholarship or complex treaty-based compensation', amount: 55000 },
  { id: 'other', label: 'Other ITIN category', amount: 42500 },
  { id: 'tax-return-quote', label: 'US tax return preparation — separate quote', amount: null },
  { id: 'ein', label: 'EIN application', amount: 37500 },
] as const;

export type ItinCategoryId = (typeof itinCategories)[number]['id'];

export function getItinCategory(id: string) {
  return itinCategories.find(category => category.id === id);
}

export function formatItinFee(amount: number | null) {
  return amount === null ? 'Separately quoted' : `£${amount / 100} all-inclusive, no VAT`;
}

export const itinFeeScope = 'Form W-7 / CAA service only. US tax return preparation is separately quoted. EIN applications are a separate service at £375 all-inclusive, no VAT.';
export function serviceFeeScope(id: string) {
  if (id === 'ein') return 'EIN application service only, £375 all-inclusive, no VAT. ITIN applications and US tax return preparation are separate services.';
  if (id === 'tax-return-quote') return 'US tax return preparation is separately quoted. ITIN and EIN applications are separate services.';
  return itinFeeScope;
}

export const additionalChargesNotice = 'For additional travel or courier charges, please email Taz@itinpro.uk or Shan@itinpro.uk. We will confirm the charges and send a separate, customised invoice with an itemised breakdown.';
export const otherCategoryNotice = 'If your ITIN category is not listed, select Other and pay the £425 Other category fee. Describe your circumstances in the application notes or email us. We will review your category and confirm any fee difference, which can be paid later by separate invoice.';

export function categoryForGuide(slug: string): ItinCategoryId | undefined {
  const categories: Record<string, ItinCategoryId> = {
    'itin-for-spouse-of-us-citizen': 'spouse',
    'how-to-renew-itin': 'renewal',
    'itin-expired-how-to-check': 'renewal',
    'itin-for-form-1040nr': 'prepared-1040nr',
    'itin-for-llc-owner': 'llc',
    'itin-for-us-bank-account': 'llc-bank-account',
    'itin-for-partnership-interest': 'partnership',
    'itin-for-sale-of-us-property': 'firpta',
    'itin-for-401k-pension-annuity': 'pension-estate',
    'itin-for-us-inheritance-estate-distribution': 'pension-estate',
    'itin-for-students-f1-j1-m1': 'complex-compensation',
    'itin-for-professors-researchers-honoraria': 'complex-compensation',
  };
  return categories[slug] || (slug.startsWith('itin-for-') ? 'other' : undefined);
}
