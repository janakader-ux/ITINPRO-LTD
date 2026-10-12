import countries from './countries.json';
import type { basicFields } from './fields';
export type QuestionnaireField = typeof basicFields[number];
export const countryOptions = countries.map(x=>x.name);
export const foreignCountryOptions = countries.filter(x=>x.code!=='US').map(x=>x.name);
export const foreignAddressWarning = 'Foreign address — mandatory. Provide one complete address outside the United States, including the country and postcode where used. If you have relocated to the US, provide your most recent foreign address. Missing required foreign-address information can cause IRS rejection or delays. ITIN PRO requires these details for preparation; if you cannot provide them, contact your CAA before sending the case for review.';
export const foreignAddressExceptionNote = 'IRS line 3 has a limited country-only provision for some applicants who no longer have a permanent foreign residence after relocating to the US. It does not apply to reason b (nonresident filing a federal return). Your CAA must review any such case; do not leave this section blank.';
export const selectOptions: Partial<Record<QuestionnaireField,string[]>> = {
  sex:['Male','Female','Ask the preparation team'],
  birthCountry:countryOptions,citizenship:[...countryOptions,'Multiple countries — give details in Notes'],passportIssuer:countryOptions,treatyCountry:countryOptions,
  foreignCountry:foreignCountryOptions,mailingCountry:countryOptions,
  foreignAddressStatus:['Current permanent / normal foreign residence','Most recent foreign residence after moving to the US','I need CAA help with the foreign-address requirement'],
  mailingAddressChoice:['Same as foreign address','Different mailing address'],
  contactEmailChoice:['Use my portal email','Use another contact email'],
  filingStatus:['Single','Married filing jointly','Married filing separately','Head of household','Qualifying surviving spouse','No return — exception under review','To be confirmed by the tax preparer'],
  visaType:['No US visa','Visa Waiver / ESTA','B-1','B-2','B-1/B-2','F-1','F-2','J-1','J-2','M-1','M-2','H-1B','H-4','L-1','L-2','O-1','O-3','Other — give details in Notes','Not sure — staff review'],
  relationship:['Spouse','Child','Parent','Other relative — explain in Notes','Court-appointed guardian','Other — explain in Notes'],
  ssnEligibility:['I do not have an SSN and am not eligible','I already have an SSN','I may be eligible for an SSN','My SSN application is pending','Not sure — staff review'],
  signerAuthority:['Applicant','Parent signing for a child under 18 who cannot sign','Court-appointed guardian','Representative with the required Form 2848','Other / not sure — staff review'],
  taxBenefit:['Credit for other dependents','Head of household','Qualifying surviving spouse','American opportunity tax credit','Premium tax credit','Child and dependent care credit','Joint return with spouse','Applicant has their own filing obligation','Not sure — tax-preparer review'],
  paymentYear:Array.from({length:new Date().getUTCFullYear()-1999+1},(_,i)=>String(new Date().getUTCFullYear()+1-i)),
};
export const dateFields = new Set<QuestionnaireField>(['dateOfBirth','passportExpiry','visaExpiry','closingDate']);
export const multilineFields = new Set<QuestionnaireField>(['mailingAddress','foreignAddress','propertyAddress','taxPurpose','notes']);
export function normalizeQuestionnaireAnswers(value: Record<string,unknown>, portalEmail:string) {
  const result={...value};
  if(result.mailingAddressChoice==='Same as foreign address'){
    result.mailingAddress=result.foreignAddress;
    result.mailingCountry=result.foreignCountry;
  }
  if(result.contactEmailChoice==='Use my portal email')result.contactEmail=portalEmail;
  return result;
}
