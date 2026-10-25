export const deferredDocumentsAcknowledgement='I understand that I must provide the outstanding information and documents later. I would like to proceed to payment now. Payment does not confirm eligibility or document approval, and ITIN PRO cannot submit my application until all required information, documents, original-document checks and signatures have been received and reviewed.';
export function validDocumentDeferral(value:{documentsLater?:unknown;acknowledgement?:unknown}){return value.documentsLater!==true||value.acknowledgement===true;}
export const basicIntakeFields=['applicationType','w7Reason','birthNameDifferent','foreignCountry','foreignAddressStatus','firstName','middleName','lastName','birthNameDifferent','birthFirstName','birthMiddleName','birthLastName','dateOfBirth','sex','birthCountry','birthCity','citizenship','foreignAddressStatus','foreignCountry','foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode','mailingAddressChoice','mailingCountry','mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode','contactEmailChoice','contactEmail','phoneNumber'] as const;
export const finalIdentityFields=['applicationType','w7Reason','birthNameDifferent','foreignAddressStatus','foreignCountry','firstName','lastName','dateOfBirth','birthCountry','citizenship','sex','phoneNumber','mailingAddressChoice','passportIssuer','passportNumber','passportExpiry','previousItinStatus','visaType'] as const;
export function missingFinalIdentity(answers:Record<string,unknown>={}){
  const missing:string[]=finalIdentityFields.filter(key=>typeof answers[key]!=='string'||!(answers[key] as string).trim());
  if(answers.mailingAddressChoice==='Different mailing address'){
    for(const key of ['mailingCountry','mailingStreetAddress','mailingCity'])if(typeof answers[key]!=='string'||!(answers[key] as string).trim())missing.push(key);
  }
  if(answers.foreignAddressStatus!=='moved-country-only'||answers.w7Reason==='b'){
    for(const key of ['foreignStreetAddress','foreignCity'])if(typeof answers[key]!=='string'||!(answers[key] as string).trim())missing.push(key);
  }
  if((answers.w7Reason==='f'||answers.w7Reason==='h')&&!String(answers.treatyClaimStatus||'').trim())missing.push('treatyClaimStatus');
  if(answers.passportExpiry&&/^\\d{4}-\\d{2}-\\d{2}$/.test(String(answers.passportExpiry))&&String(answers.passportExpiry)<new Date().toISOString().slice(0,10))missing.push('passportExpiry');
  if(answers.w7Reason==='a'||answers.w7Reason==='h'||answers.w7Reason==='f'){
    if(!String(answers.boxHException||'').trim())missing.push('boxHException');
  }
  if(!String(answers.taxPurpose||'').trim())missing.push('taxPurpose');
  if(['1040','1040-NR'].includes(String(answers.taxPurpose||''))&&!String(answers.filingStatus||'').trim())missing.push('filingStatus');
  if(answers.w7Reason==='d'||answers.w7Reason==='e'){
    for(const key of ['usPersonFirstName','usPersonLastName'])if(!String(answers[key]||'').trim())missing.push(key);
  }
  if(answers.w7Reason==='d'&&!String(answers.relationship||'').trim())missing.push('relationship');
  if(answers.w7Reason==='f')for(const key of ['institutionName','institutionCityState','durationOfStay'])if(!String(answers[key]||'').trim())missing.push(key);
  if(answers.w7Reason==='h'&&!String(answers.notes||'').trim())missing.push('notes');
  if(['h','f'].includes(String(answers.w7Reason||''))&&['1a','1b'].includes(String(answers.boxHException||''))&&!String(answers.companyEin||'').trim())missing.push('companyEin');
  if(['h','f'].includes(String(answers.w7Reason||''))&&['3','4'].includes(String(answers.boxHException||'')))for(const key of ['propertyAddress','closingDate'])if(!String(answers[key]||'').trim())missing.push(key);
  if(answers.w7Reason==='a'||(answers.w7Reason==='f'||answers.w7Reason==='h')&&answers.treatyClaimStatus==='yes'){
    if(!String(answers.treatyArticle||'').trim())missing.push('treatyArticle');
  }
  if(answers.visaType&&answers.visaType!=='No U.S. visa'&&answers.visaType!=='Visa Waiver Program / ESTA'&&!String(answers.visaType).startsWith('Not sure')){
    for(const key of ['visaNumber','visaExpiry','lastUsEntry'])if(!String(answers[key]||'').trim())missing.push(key);
  }
  if(answers.previousItinStatus==='Yes'||answers.applicationType==='renewal'){
    const kind=String(answers.previousItinType||'');
    if(!kind)missing.push('previousItinType');
    if(['ITIN','Both'].includes(kind)&&!String(answers.previousItin||'').trim())missing.push('previousItin');
    if(['IRSN (temporary IRS number)','Both'].includes(kind)){
      if(!String(answers.previousIrsn||'').trim())missing.push('previousIrsn');
      if(!String(answers.irsNoticeType||'').trim())missing.push('irsNoticeType');
    }
    if(!String(answers.priorItinFirstName||'').trim())missing.push('priorItinFirstName');
    if(!String(answers.priorItinLastName||'').trim())missing.push('priorItinLastName');
  }
  return [...new Set(missing)];
}
