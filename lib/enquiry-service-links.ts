// Public blog CTA codes map onto the existing intake routes.
export const enquiryServiceOptions = [
  ['itin','ITIN application'],['ein','EIN application'],['taxreturn','U.S. tax return'],
  ['firpta','US property / FIRPTA'],['gambling','Gambling winnings'],
  ['renewal','ITIN renewal'],['family','Spouse / dependent ITIN'],['mobile','Home or office visit'],
] as const;
export function enquiryServiceSelection(code:string) {
  switch(code) {
    case 'ein': return {service:'ein' as const,routeId:'',tab:'services',preference:''};
    case 'taxreturn': case 'tax-return-quote': return {service:'tax' as const,routeId:'',tab:'services',preference:''};
    case 'firpta': case 'gambling': case 'renewal': return {service:'itin' as const,routeId:code,tab:'application',preference:''};
    // The applicant chooses spouse or dependent before we assign a priced route.
    case 'family': return {service:'itin' as const,routeId:'not-sure',tab:'application',preference:''};
    case 'mobile': return {service:'itin' as const,routeId:'not-sure',tab:'application',preference:'contact'};
    case 'itin': return {service:'itin' as const,routeId:'',tab:'application',preference:''};
    default: return undefined;
  }
}
