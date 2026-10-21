// Keep guide links on the precise application route, rather than the first route
// sharing its price (for example, an estate and pension both cost the same).
const routes: Record<string,string> = {
  'itin-for-us-inheritance-estate-distribution':'estate',
  'itin-for-401k-pension-annuity':'pension',
  'itin-for-sale-of-us-property':'firpta',
  'itin-for-partnership-interest':'partnership',
  'itin-for-llc-owner':'llc-dividend',
  'itin-for-us-bank-account':'llc-bank-account',
  'itin-for-spouse-of-us-citizen':'spouse',
  'itin-for-dependents':'dependent',
  'itin-for-children-documents':'dependent',
  'allowable-tax-benefit-itin':'dependent',
  'itin-for-amazon-kdp-authors-uk':'royalties',
  'itin-for-form-1040nr':'prepared-1040nr',
  'itin-for-us-gambling-winnings-refund':'gambling',
  'itin-for-us-mortgage-interest':'mortgage-interest',
  'how-to-renew-itin':'renewal',
  'itin-expired-how-to-check':'renewal',
};
export function guideApplicationLink(slug:string) {
  const route=routes[slug];
  return route?`/apply?route=${route}#enquiry`:'/apply#enquiry';
}
