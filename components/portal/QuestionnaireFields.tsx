'use client';
import { answerSupportOptions,answerSupportStatus } from '@/lib/portal/answer-support';
import { basicFields } from '@/lib/portal/fields';
import { selectOptions,selectOptionLabels,visaWaiverCountries,dateFields,multilineFields,type QuestionnaireField,foreignAddressWarning,foreignAddressExceptionNote,mailingAddressNote,vwpNote } from '@/lib/portal/questionnaire';

const labels:Partial<Record<typeof basicFields[number],string>>={
  applicationType:'Form W-7 application type',
  w7Reason:'Reason for your ITIN application (Form W-7 box a–h)',
  boxHException:'Form W-7 box h — exception category',
  treatyClaimStatus:'Are you claiming U.S. tax treaty benefits?',
  taxReturnStatus:'',
  firstName:'Legal first name (as on passport)',
  middleName:'Legal middle name, if any',
  lastName:'Legal last name (as on passport)',
  birthNameDifferent:'Is your name at birth different from your current legal name?',
  birthFirstName:'Name at birth — first name',
  birthMiddleName:'Name at birth — middle name, if any',
  birthLastName:'Name at birth — last name',
  dateOfBirth:'Date of birth',
  sex:'Sex for Form W-7',
  birthCountry:'Country of birth',
  birthCity:'City and state or province of birth (optional)',
  citizenship:'Country of citizenship',
  additionalCitizenships:'Other citizenship countries, if you have more than one',
  foreignAddressStatus:'Which foreign address are you providing?',
  foreignCountry:'Foreign address country',
  foreignStreetAddress:'Foreign address — street and number',
  foreignCity:'Foreign address — city or town',
  foreignRegion:'Foreign address — state or province (if used)',
  foreignPostalCode:'Foreign address — postal code (if used)',
  mailingAddressChoice:'Where should the IRS send notices and return original documents?',
  mailingCountry:'Mailing address country',
  mailingStreetAddress:'Different mailing address — street and number',
  mailingCity:'Different mailing address — city or town',
  mailingRegion:'Different mailing address — state or province (if used)',
  mailingPostalCode:'Different mailing address — postal code (if used)',
  contactEmail:'Contact email address',
  phoneNumber:'Phone number for CAA contact',
  passportIssuer:'Passport issuing country',
  passportNumber:'Passport number',
  passportExpiry:'Passport expiry date',
  foreignTaxId:'Foreign tax ID (if issued)',
  visaType:'U.S. visa status (if any)',
  visaNumber:'U.S. visa number',
  visaExpiry:'U.S. visa expiry date',
  lastUsEntry:'Date you entered the United States for this ITIN purpose, or “Never entered”',
  previousItinStatus:'Have you ever received an ITIN or IRSN?',
  previousItinType:'Which previous number did you receive?',
  previousItin:'Previous ITIN number',
  previousIrsn:'IRS temporary number (IRSN)',
  irsNoticeType:'IRS notice number, if shown on your letter',
  priorItinFirstName:'Name used for prior ITIN/IRSN — first name',
  priorItinMiddleName:'Name used for prior ITIN/IRSN — middle name, if any',
  priorItinLastName:'Name used for prior ITIN/IRSN — last name',
  relationship:'Relationship to the U.S. citizen/resident alien',
  usPersonFirstName:'U.S. citizen/resident person — first name',
  usPersonMiddleName:'U.S. citizen/resident person — middle name, if any',
  usPersonLastName:'U.S. citizen/resident person — last name',
  usPersonTaxId:'U.S. citizen/resident person — SSN or ITIN (optional here)',
  institutionName:'College, university or institution name',
  institutionCityState:'Institution city and state',
  durationOfStay:'Length of stay in the United States',
  companyName:'U.S. company, partnership or bank',
  companyEin:'Partnership or company EIN, if shown on your evidence',
  filingStatus:'Tax-return filing status',
  taxPurpose:'U.S. federal tax purpose / income details',
  ssnEligibility:'Do you have or qualify for a U.S. Social Security number?',
  signerAuthority:'Who will sign Form W-7 and under what authority?',
  payerName:'U.S. payer, trustee or withholding agent',
  paymentYear:'Year of payment or distribution',
  taxBenefit:'Tax benefit claimed for the spouse or dependent',
  propertyAddress:'U.S. property address',
  closingDate:'Property sale or closing date',
  notes:'Anything else the CAA team should know'
};

const legacyFields = new Set<QuestionnaireField>(['birthName','treatyCountry','spouseName','spouseTaxId','priorItinName','foreignAddress','mailingAddress']);
const mailingAddressFields = new Set<QuestionnaireField>(['mailingCountry','mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode','mailingAddressHelp']);
const birthNameFields = new Set<QuestionnaireField>(['birthFirstName','birthMiddleName','birthLastName']);
const priorItinFields = new Set<QuestionnaireField>(['previousItinType','previousItin','previousIrsn','irsNoticeType','priorItinFirstName','priorItinMiddleName','priorItinLastName']);
const visaDetailFields = new Set<QuestionnaireField>(['visaNumber','visaExpiry']);
const usPersonFields = new Set<QuestionnaireField>(['usPersonFirstName','usPersonMiddleName','usPersonLastName','usPersonTaxId']);
const institutionFields = new Set<QuestionnaireField>(['institutionName','institutionCityState','durationOfStay']);

export function QuestionnaireFields({fields,answers,clientEmail,readOnly,allowIncomplete=false,onChange}:{fields:QuestionnaireField[];answers:Record<string,string>;clientEmail:string;readOnly:boolean;allowIncomplete?:boolean;onChange:(field:QuestionnaireField,value:string)=>void}){
  const mailingChoice=answers.mailingAddressChoice||'Same as foreign address';
  const emailChoice=answers.contactEmailChoice||'Use my portal email';
  const reason=answers.w7Reason||'';
  const treatyRequired=reason==='a'||((reason==='f'||reason==='h')&&answers.treatyClaimStatus==='yes');
  const showBoxH=reason==='a'||reason==='h'||reason==='f';
  const foreignOnly=answers.foreignAddressStatus==='moved-country-only';
  const showMailing=mailingChoice==='Different mailing address';
  const showPrior=answers.previousItinStatus==='Yes'||answers.applicationType==='renewal';
  const hasPriorIrsn=showPrior&&['IRSN (temporary IRS number)','Both'].includes(answers.previousItinType||'');
  const hasPriorItin=showPrior&&['ITIN','Both'].includes(answers.previousItinType||'');
  const vwp=new Set<string>(visaWaiverCountries as readonly string[]);
  const vwpEligible=vwp.has(answers.citizenship||'');
  const mailingHelpStatus=answerSupportStatus(answers.mailingAddressHelp||'');
  return <div className="portal-fields">{fields.filter(x=>{
    if(legacyFields.has(x))return false;
    if(mailingAddressFields.has(x)&&(!showMailing||x==='mailingAddressHelp'&&readOnly))return false;
    if(birthNameFields.has(x)&&answers.birthNameDifferent!=='Yes')return false;
    if(priorItinFields.has(x)&&!showPrior)return false;
    if(x==='previousItin'&&!hasPriorItin)return false;
    if(x==='previousIrsn'&&!hasPriorIrsn)return false;
    if(x==='irsNoticeType'&&!hasPriorIrsn)return false;
    if(visaDetailFields.has(x)&&(!answers.visaType||answers.visaType==='No U.S. visa'||answers.visaType==='Visa Waiver Program / ESTA'||answers.visaType.startsWith('Not sure')))return false;
    if(x==='treatyArticle'&&!treatyRequired)return false;
    if(x==='boxHException'&&!showBoxH)return false;
    if(x==='treatyClaimStatus'&&reason!=='f'&&reason!=='h')return false;
    if(usPersonFields.has(x)&&reason!=='d'&&reason!=='e')return false;
    if(x==='relationship'&&reason!=='d')return false;
    if(institutionFields.has(x)&&reason!=='f')return false;
    if((x==='companyName'||x==='companyEin')&&!(reason==='h'&&['1a','1b','1c'].includes(answers.boxHException||'')))return false;
    if(x==='payerName'&&!(['h','f'].includes(reason)&&['1d','2a','2b','2c','2d'].includes(answers.boxHException||'')))return false;
    if(x==='paymentYear'&&!(['h','f'].includes(reason)&&['1d','2a','2b','2c','2d'].includes(answers.boxHException||'')))return false;
    if((x==='propertyAddress'||x==='closingDate')&&!(['h','f'].includes(reason)&&['3','4'].includes(answers.boxHException||'')))return false;
    if(foreignOnly&&['foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode'].includes(x))return false;
    return true;
  }).map(x=>{
    const saved=answers[x]||'';
    const portalContact=x==='contactEmail'&&emailChoice==='Use my portal email';
    const disabled=readOnly||portalContact;
    const value=x==='mailingAddressChoice'?mailingChoice:portalContact?clientEmail:saved;
    const change=(next:string)=>onChange(x,next);
    const options=selectOptions[x];
    const optionsForReason=options?.filter(option=>!(x==='boxHException'&&reason==='a'&&option==='no-exception')&&!(x==='boxHException'&&reason==='h'&&option==='no-exception'));
    let required=['applicationType','w7Reason','birthNameDifferent','firstName','lastName','dateOfBirth','sex','birthCountry','citizenship','foreignCountry','foreignAddressStatus','foreignStreetAddress','foreignCity','mailingAddressChoice','phoneNumber','passportIssuer','passportNumber','passportExpiry','previousItinStatus','visaType'].includes(x);
    if(x==='foreignStreetAddress'||x==='foreignCity')required=!foreignOnly||reason==='b';
    if(x==='boxHException')required=reason==='a'||reason==='h'||reason==='f';
    if(x==='treatyClaimStatus')required=reason==='f'||reason==='h';
    if(x==='visaNumber'||x==='visaExpiry')required=!!answers.visaType&&answers.visaType!=='No U.S. visa'&&answers.visaType!=='Visa Waiver Program / ESTA'&&!answers.visaType.startsWith('Not sure');
    if(x==='lastUsEntry')required=!!answers.visaType&&answers.visaType!=='No U.S. visa'&&answers.visaType!=='Visa Waiver Program / ESTA'&&!answers.visaType.startsWith('Not sure');
    if(x==='treatyArticle')required=treatyRequired;
    if(priorItinFields.has(x))required=showPrior&&(['priorItinFirstName','priorItinLastName'].includes(x));
    if(x==='previousItinType')required=showPrior;
    if(x==='irsNoticeType')required=hasPriorIrsn;
    if(x==='previousIrsn')required=hasPriorIrsn;
    if(x==='previousItin')required=hasPriorItin;
    if(x==='filingStatus')required=!!answers.taxPurpose&&['1040','1040-NR'].includes(answers.taxPurpose);
    if(usPersonFields.has(x))required=x!=='usPersonTaxId';
    if(mailingAddressFields.has(x)&&showMailing)required=['mailingCountry','mailingStreetAddress','mailingCity'].includes(x);
    if(x==='contactEmail'&&emailChoice==='Use another contact email')required=true;
    if(x==='taxPurpose')required=true;
    if(x==='notes'&&reason==='h')required=true;
    if(x==='companyEin'&&reason==='h'&&['1a','1b'].includes(answers.boxHException||''))required=true;
    if((x==='propertyAddress'||x==='closingDate')&&['h','f'].includes(reason)&&['3','4'].includes(answers.boxHException||''))required=true;
    const hint=x==='w7Reason'&&reason==='a'
      ?'A treaty claim needs box h and an Exception 1 or 2 designation. The treaty country is taken from your foreign-address country; enter the treaty article or select “Not sure” in the article field for CAA review.'
      :x==='w7Reason'&&reason==='b'
      ?'A complete Form 1040-NR is usually needed unless an IRS exception applies. Tax-return preparation is a separate service. Upload a return prepared by you or your CPA, or request a separate quote.'
      :x==='w7Reason'&&reason==='c'
      ?'This reason is for a foreign person who is a U.S. resident alien under the tax residency rules, including the substantial presence test. Meeting 183 days alone does not determine every case.'
      :x==='w7Reason'&&reason==='d'
      ?'Use this for someone who can be claimed as a dependent on a U.S. return and is not eligible for an SSN. Eligibility and U.S. residency evidence depend on the case.'
      :x==='w7Reason'&&reason==='e'
      ?'Use this for a spouse of a U.S. citizen or resident alien who meets the Form W-7 category rules. A spouse is not treated as a dependent.'
      :x==='w7Reason'&&reason==='f'
      ?'This category is for a nonresident student, professor or researcher filing a return or claiming an exception. Form W-7 also asks for the institution, location and length of stay.'
      :x==='w7Reason'&&reason==='g'
      ?'This category is for a spouse or dependent who entered the United States with a nonresident alien visa holder. Visa and entry details are needed.'
      :x==='w7Reason'&&reason==='h'
      ?'Choose h only when a–g do not describe your reason. The CAA team must review your evidence and confirm whether the reason qualifies.'
      :x==='boxHException'
      ?'An exception is not automatic. The IRS requires current-year reporting or withholding evidence and supporting documents for the selected category. If unsure, choose CAA review.'
      :x==='taxReturnStatus'&&['b','c','d','e','f','g'].includes(reason)
      ?'If you want ITIN PRO to prepare a U.S. return, that work is separate from the ITIN service and needs a separate quote and engagement.'
      :x==='mailingAddressChoice'
      ?(showMailing?mailingAddressNote:'The foreign address will also be used as your IRS mailing address.')
      :x==='foreignAddressStatus'&&foreignOnly
      ?foreignAddressExceptionNote
      :x==='foreignCountry'
      ?foreignAddressWarning
      :x==='visaType'
      ?(vwpEligible?vwpNote:'Form W-7 line 6c asks only about U.S. nonimmigrant visas. If you do not hold a U.S. visa, select “No U.S. visa”.')
      :x==='passportExpiry'
      ?'The passport you upload must be unexpired. If it has expired, renew it before continuing or contact the CAA team to review another accepted identity document.'
      :x==='foreignTaxId'
      ?'Optional. Enter N/A if your country of tax residence has not issued a foreign tax ID or you do not have one.'
      :x==='usPersonTaxId'
      ?'You may leave this blank here, but upload the relevant U.S. tax return securely so the CAA team can complete Form W-7 before submission.'
      :x==='notes'&&reason==='h'
      ?'Briefly explain why you need an ITIN and the U.S. income or transaction involved. The CAA team will confirm that the reason and evidence meet IRS rules.'
      :x==='previousItinStatus'&&answers.applicationType==='renewal'
      ?'For a renewal, select Yes and enter the previously assigned ITIN and the name used on it.'
      :x==='previousIrsn'
      ?'An IRSN is a temporary IRS number used while an application is being processed. Enter it exactly as shown on your IRS notice, letter or tax return.'
      :x==='irsNoticeType'
      ?'Choose the CP number printed on your IRS letter, if there is one. CP565 confirms an ITIN assignment; CP566 asks for more information; CP567 reports a rejection. IRSNs may not have a separate CP notice, so choose “No notice number shown” or “Not sure” when appropriate.'
      :x==='taxPurpose'
      ?'Choose Form 1040 for a U.S. resident return or Form 1040-NR for a nonresident return. If you are claiming an exception, choose that option.'
      :'';
    const dateInput=dateFields.has(x)&&(!saved||/^\d{4}-\d{2}-\d{2}$/.test(saved));
    const inputType=x==='contactEmail'?'email':x==='phoneNumber'?'tel':dateInput?'date':'text';
    return <div key={x} className="portal-answer-field"><label>{labels[x]||x.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}{required?<span className="portal-required-mark" aria-label="required"> *</span>:null}
      {options?<select name={x} value={value} disabled={disabled} required={required&&!allowIncomplete} onChange={e=>change(e.target.value)}><option value="">Please select</option>{(x==='visaType'&&vwpEligible?[...(optionsForReason||[]),'Visa Waiver Program / ESTA']:(optionsForReason||[])).map(option=><option key={option} value={option}>{selectOptionLabels[x]?.[option]||option}</option>)}</select>:
      multilineFields.has(x)?<textarea name={x} rows={3} value={value} onChange={e=>change(e.target.value)} disabled={disabled} required={required&&!allowIncomplete} minLength={x==='foreignStreetAddress'||x==='foreignCity'?2:undefined} maxLength={1500} placeholder={x==='additionalCitizenships'?'List each additional country in full, separated by commas':undefined}/>:
      <input name={x} type={inputType} value={value} onChange={e=>change(e.target.value)} disabled={disabled} required={required&&!allowIncomplete} maxLength={200} placeholder={x==='foreignTaxId'?'Enter the number or N/A':x==='treatyArticle'?'Article number or “Not sure — CAA review”':x==='lastUsEntry'?'MM/DD/YYYY or Never entered':x==='phoneNumber'?'+44… or your country code':undefined}/>}
      {portalContact&&<small>{clientEmail} — this is also your portal sign-in email.</small>}
      {x==='contactEmail'&&emailChoice==='Use another contact email'&&<small>This email is for CAA contact. Portal sign-in continues to use {clientEmail}.</small>}
    </label>
    {!!hint&&<p className="portal-field-note">{hint}</p>}
    {x==='mailingStreetAddress'&&showMailing&&<label className="portal-answer-support">Need help with this different mailing address?<select aria-label="Help with different mailing address" value={mailingHelpStatus} disabled={readOnly} onChange={e=>onChange('mailingAddressHelp',answerSupportOptions.find(option=>option.value===e.target.value)?.answer||'')}><option value="">I will enter the address</option>{answerSupportOptions.filter(option=>option.value!=='not-applicable').map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
    {!!mailingHelpStatus&&x==='mailingStreetAddress'&&<p className="portal-follow-up">Saved for CAA follow-up. We still need the final mailing address before submission.</p>}
    </div>;
  })}</div>;
}
