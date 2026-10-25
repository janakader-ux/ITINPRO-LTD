export type W7AnswerSet = Record<string,string|undefined>;
const val=(answers:W7AnswerSet,key:string)=>String(answers[key]||'').trim();
const date=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?`${value.slice(5,7)}/${value.slice(8,10)}/${value.slice(0,4)}`:value;
const fullName=(answers:W7AnswerSet,prefix:string)=>[val(answers,prefix+'FirstName'),val(answers,prefix+'MiddleName'),val(answers,prefix+'LastName')].filter(Boolean).join(' ');
const foreignAddress=(answers:W7AnswerSet)=>[val(answers,'foreignStreetAddress'),val(answers,'foreignCity'),val(answers,'foreignRegion'),val(answers,'foreignPostalCode')].filter(Boolean).join(', ')||val(answers,'foreignAddress');
const mailingAddress=(answers:W7AnswerSet)=>answers.mailingAddressChoice==='Different mailing address'
  ?[val(answers,'mailingStreetAddress'),val(answers,'mailingCity'),val(answers,'mailingRegion'),val(answers,'mailingPostalCode')].filter(Boolean).join(', ')||val(answers,'mailingAddress')
  :foreignAddress(answers);

export function toW7ImportData(answers:W7AnswerSet){
  const priorName=fullName(answers,'priorItin')||val(answers,'priorItinName');
  const visa=val(answers,'visaType');
  return {
    applicationType:val(answers,'applicationType'),
    boxes:{a:answers.w7Reason==='a',b:answers.w7Reason==='b',c:answers.w7Reason==='c',d:answers.w7Reason==='d',e:answers.w7Reason==='e',f:answers.w7Reason==='f',g:answers.w7Reason==='g',h:answers.w7Reason==='h'},
    reason:val(answers,'w7Reason'),
    boxH:{exception:val(answers,'boxHException'),treatyClaim:answers.w7Reason==='a'||answers.treatyClaimStatus==='yes',treatyCountry:val(answers,'foreignCountry'),treatyArticle:val(answers,'treatyArticle')},
    line1:{firstName:val(answers,'firstName'),middleName:val(answers,'middleName'),lastName:val(answers,'lastName'),otherName:answers.birthNameDifferent==='Yes'?(fullName(answers,'birth')||val(answers,'birthName')):''},
    line2:{address:mailingAddress(answers),country:answers.mailingAddressChoice==='Different mailing address'?val(answers,'mailingCountry'):val(answers,'foreignCountry')},
    line3:{address:foreignAddress(answers),country:val(answers,'foreignCountry'),countryOnly:answers.foreignAddressStatus==='moved-country-only'},
    line4:{dateOfBirth:date(val(answers,'dateOfBirth')),cityAndCountryOfBirth:[val(answers,'birthCity'),val(answers,'birthCountry')].filter(Boolean).join(', ')},
    line5:{sex:val(answers,'sex')},
    line6a:{countryOfCitizenship:[val(answers,'citizenship'),...val(answers,'additionalCitizenships').split(',').map(x=>x.trim()).filter(Boolean)].filter(Boolean)},
    line6b:{foreignTaxId:val(answers,'foreignTaxId')||'N/A'},
    line6c:{visaType:visa||'No U.S. visa',visaNumber:visa&&visa!=='No U.S. visa'?val(answers,'visaNumber'):'',visaExpiry:visa&&visa!=='No U.S. visa'?date(val(answers,'visaExpiry')):''},
    line6d:{documentType:'Passport',issuingCountry:val(answers,'passportIssuer'),number:val(answers,'passportNumber'),expiryDate:date(val(answers,'passportExpiry')),dateOfEntry:date(val(answers,'lastUsEntry'))},
    line6e:{previouslyAssigned:answers.previousItinStatus==='Yes'?'Yes':answers.previousItinStatus==='No'?'No':'CAA review required',status:val(answers,'previousItinStatus'),numberType:val(answers,'previousItinType'),number:val(answers,'previousItin'),name:priorName},
    line6f:{birthName:answers.birthNameDifferent==='Yes'?(fullName(answers,'birth')||val(answers,'birthName')):'',priorItinName:priorName},
    line6g:{institution:val(answers,'institutionName'),institutionCityState:val(answers,'institutionCityState'),duration:val(answers,'durationOfStay'),company:val(answers,'companyName'),companyEin:val(answers,'companyEin')},
    usPerson:{relationship:val(answers,'relationship'),fullName:fullName(answers,'usPerson')||val(answers,'spouseName'),ssnOrItin:val(answers,'usPersonTaxId')||val(answers,'spouseTaxId')},
    taxReturn:{status:val(answers,'taxReturnStatus'),filingStatus:val(answers,'filingStatus'),purpose:val(answers,'taxPurpose'),incomeCategory:val(answers,'boxHException'),payer:val(answers,'payerName'),paymentYear:val(answers,'paymentYear'),taxBenefit:val(answers,'taxBenefit'),propertyAddress:val(answers,'propertyAddress'),closingDate:date(val(answers,'closingDate'))},
    contact:{email:val(answers,'contactEmail'),phone:val(answers,'phoneNumber')},
    signature:{signerAuthority:val(answers,'signerAuthority')}
  };
}
