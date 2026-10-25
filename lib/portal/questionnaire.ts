import countries from './countries.json';
import type { basicFields } from './fields';
export type QuestionnaireField = typeof basicFields[number];
export const countryOptions = countries.map(x=>x.name);
export const foreignCountryOptions = countries.filter(x=>x.code!=='US').map(x=>x.name);

export const visaWaiverCountries = [
  'Andorra','Australia','Austria','Belgium','Brunei','Chile','Croatia','Czechia','Denmark','Estonia',
  'Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Israel','Italy','Japan','Latvia',
  'Liechtenstein','Lithuania','Luxembourg','Malta','Monaco','Netherlands','New Zealand','Norway','Poland',
  'Portugal','Qatar','San Marino','Singapore','Slovakia','Slovenia','South Korea','Spain','Sweden',
  'Switzerland','Taiwan','United Kingdom'
] as const;

export const foreignAddressWarning = 'One complete address outside the United States is required for your ITIN application. If you have moved to the U.S. and no longer have a permanent foreign residence, select the relevant option for CAA review. A nonresident filing a U.S. return must provide a complete recent foreign address.';
export const foreignAddressExceptionNote = 'If you have moved to the United States and have no permanent foreign residence, IRS instructions may allow the last foreign country only on line 3 for some applicants. This does not apply to reason b: a nonresident filing a U.S. return must provide the complete most recent foreign address. Ask the CAA team if unsure.';
export const mailingAddressNote = 'This is the address the IRS will use for notices about your ITIN, including an approval notice, and to return any original documents. Please make sure it is correct.';
export const vwpNote = 'A country marked “Visa Waiver Program” is on the current U.S. VWP list. Travel without a visa still requires an approved ESTA and depends on individual travel-history and other rules. ESTA is not a U.S. visa. If you have no U.S. visa, select “No U.S. visa.” British citizens must meet the U.S. Department of State’s permanent-abode condition.';
export const selectOptions: Partial<Record<QuestionnaireField,string[]>> = {
  applicationType:['new','renewal'],
  w7Reason:['a','b','c','d','e','f','g','h'],
  boxHException:['no-exception','1a','1b','1c','1d','2a','2b','2c','2d','3','4','5','unsure'],
  treatyClaimStatus:['yes','no','unsure'],
  taxReturnStatus:['ready','preparing','separate-quote','unsure'],
  birthNameDifferent:['Yes','No'],
  sex:['Male','Female'],
  birthCountry:countryOptions,citizenship:countryOptions,passportIssuer:countryOptions,
  foreignCountry:foreignCountryOptions,mailingCountry:countryOptions,
  foreignAddressStatus:['current','most-recent','moved-country-only','unsure'],
  mailingAddressChoice:['Same as foreign address','Different mailing address'],
  contactEmailChoice:['Use my portal email','Use another contact email'],
  previousItinStatus:['Yes','No','Not sure — ask the CAA team'],
  previousItinType:['ITIN','IRSN','Both','Not sure'],
  visaType:['No U.S. visa','B-1','B-2','B-1/B-2','F-1','F-2','J-1','J-2','M-1','M-2','H-1B','H-4','L-1','L-2','O-1','O-3','Other — give details in Notes','Not sure — staff review'],
  relationship:['Child','Parent','Grandchild','Other qualifying relative — explain in Notes','Not sure — staff review'],
  ssnEligibility:['I do not have an SSN and am not eligible','I already have an SSN','I may be eligible for an SSN','My SSN application is pending','Not sure — staff review'],
  signerAuthority:['Applicant','Parent signing for a child under 18 who cannot sign','Court-appointed guardian','Representative with the required Form 2848','Other / not sure — staff review'],
  taxBenefit:['Credit for other dependents','Head of household','Qualifying surviving spouse','American opportunity tax credit','Premium tax credit','Child and dependent care credit','Joint return with spouse','Applicant has their own filing obligation','Not sure — tax-preparer review'],
  paymentYear:Array.from({length:new Date().getUTCFullYear()-1999+1},(_,i)=>String(new Date().getUTCFullYear()+1-i)),
};
export const selectOptionLabels: Partial<Record<QuestionnaireField,Record<string,string>>> = {
  applicationType:{new:'Apply for a new ITIN',renewal:'Renew an existing ITIN'},
  w7Reason:{
    a:'a — Nonresident alien claiming a U.S. tax treaty benefit',
    b:'b — Nonresident alien filing a U.S. federal tax return',
    c:'c — U.S. resident alien filing a U.S. federal tax return',
    d:'d — Dependent of a U.S. citizen or resident alien',
    e:'e — Spouse of a U.S. citizen or resident alien',
    f:'f — Nonresident student, professor or researcher filing a return or claiming an exception',
    g:'g — Dependent or spouse of a nonresident alien holding a U.S. visa',
    h:'h — Other reason (CAA review required)'
  },
  boxHException:{
    'no-exception':'No exception — filing a U.S. tax return',
    '1a':'Exception 1(a) — Partnership or LLC partnership income',
    '1b':'Exception 1(b) — Business bank account interest',
    '1c':'Exception 1(c) — Personal bank account interest (U.S. resident aliens only under IRS criteria)',
    '1d':'Exception 1(d) — Current-year pension, annuity, rental, royalty, dividend or other passive distribution (CAA review for 401(k) income)',
    '2a':'Exception 2(a) — Treaty wages, salary, compensation or honoraria',
    '2b':'Exception 2(b) — Treaty scholarship, fellowship or grant',
    '2c':'Exception 2(c) — Taxable scholarship, fellowship or grant (no treaty claim)',
    '2d':'Exception 2(d) — Treaty gambling winnings (special rules apply)',
    '3':'Exception 3 — U.S. mortgage interest with third-party reporting',
    '4':'Exception 4 — U.S. real-property sale or transfer (FIRPTA)',
    '5':'Exception 5 — Foreign corporation reporting under T.D. 9363',
    unsure:'Not sure — ask the CAA team to review'
  },
  treatyClaimStatus:{yes:'Yes — I am claiming a treaty benefit',no:'No — I am not claiming a treaty benefit',unsure:'I am not sure — CAA review needed'},
  taxReturnStatus:{ready:'Yes — my U.S. tax return is complete and ready to upload',preparing:'My CPA is preparing the return','separate-quote':'I need a separate quote for ITIN PRO to prepare the return',unsure:'I am not sure — please review'},
  foreignAddressStatus:{
    current:'This is my current foreign residence',
    'most-recent':'I moved to the U.S.; this is my most recent foreign residence',
    'moved-country-only':'I moved to the U.S. and no longer have a permanent foreign residence (country only; CAA review)',
    unsure:'I am not sure — ask the CAA team'
  }
};
export const dateFields = new Set<QuestionnaireField>(['dateOfBirth','passportExpiry','visaExpiry','closingDate']);
export const multilineFields = new Set<QuestionnaireField>(['mailingAddress','foreignAddress','taxPurpose','notes','additionalCitizenships','propertyAddress']);
export function formatAddress(parts:Record<string,unknown>,prefix:'foreign'|'mailing'){
  const keys=prefix==='foreign'?['foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode']:['mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode'];
  return keys.map(k=>String(parts[k]||'').trim()).filter(Boolean).join(', ');
}
export function isForeignAddressComplete(answers:Record<string,unknown>={}){
  const country=String(answers.foreignCountry||'');
  if(!foreignCountryOptions.includes(country))return false;
  if(answers.foreignAddressStatus==='moved-country-only'&&answers.w7Reason!=='b')return true;
  const structured=!!(answers.foreignStreetAddress||answers.foreignCity||answers.foreignRegion||answers.foreignPostalCode);
  if(structured)return !!String(answers.foreignStreetAddress||'').trim()&&!!String(answers.foreignCity||'').trim();
  return String(answers.foreignAddress||'').trim().length>=10;
}
export function normalizeQuestionnaireAnswers(value: Record<string,unknown>, portalEmail:string) {
  const result={...value};
  const splitLegacy=(value:unknown,prefix:'foreign'|'mailing')=>{
    const raw=String(value||'').trim();
    if(!raw)return;
    const parts=raw.split(',').map(x=>x.trim()).filter(Boolean);
    const keys=prefix==='foreign'?['foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode']:['mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode'];
    if(!keys.some(key=>String(result[key]||'').trim())){
      result[keys[0]]=parts[0]||'';
      result[keys[1]]=parts[1]||'';
      result[keys[2]]=parts[2]||'';
      result[keys[3]]=parts[3]||'';
    }
  };
  splitLegacy(result.foreignAddress,'foreign');
  splitLegacy(result.mailingAddress,'mailing');
  const mailingChoice=result.mailingAddressChoice||'Same as foreign address';
  result.mailingAddressChoice=mailingChoice;
  if(mailingChoice==='Same as foreign address'){
    result.mailingAddress=formatAddress(result,'foreign')||result.foreignAddress;
    result.mailingCountry=result.foreignCountry;
  }else{
    result.mailingAddress=formatAddress(result,'mailing')||result.mailingAddress;
  }
  result.foreignAddress=formatAddress(result,'foreign')||result.foreignAddress;
  if(result.w7Reason==='a'||result.treatyClaimStatus==='yes')result.treatyCountry=result.foreignCountry;
  if(!result.contactEmailChoice)result.contactEmailChoice='Use my portal email';
  if(result.contactEmailChoice==='Use my portal email')result.contactEmail=portalEmail;
  return result;
}
