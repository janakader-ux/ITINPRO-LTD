import countries from './portal/countries.json';
export type IntakeService='itin'|'ein'|'tax';
export type BasicQuestion={id:string;label:string;kind?:'text'|'textarea';options?:readonly string[];required?:boolean;maxLength?:number;help?:string};
const yn=['Yes','No','Not sure'] as const;
const countryNames=countries.map(x=>x.name);
const q=(id:string,label:string,options?:readonly string[],required=true):BasicQuestion=>({id,label,options,required});
export function basicServiceQuestions(service:IntakeService,routeId:string,basic:Record<string,string>={},year=new Date().getUTCFullYear()):BasicQuestion[]{
  const common=[q('residenceCountry','Country where you currently live',countryNames),q('contactMethod','How should we contact you?',['Email','Phone','Either'])];
  let specific:BasicQuestion[];
  if(service==='ein')specific=[
    {...q('companyName','Legal company / applicant name'),maxLength:120},
    q('entityType','Business / entity type',['LLC','Corporation','Partnership','Sole proprietor','Trust / estate','Other','Not sure']),
    q('formationCountry','Country of formation / organisation',countryNames),
    q('formationReady','Is your company formation document available?',['Yes','Formation is in progress','Not applicable','Not sure']),
    ...(basic.entityType==='LLC'?[q('llcMembers','Number of LLC members',['One','Two or more','Not sure'])]:[]),
    q('einReason','Why do you need an EIN?',['Starting a business','Business bank account','Hiring employees','Tax filing / reporting','Change of organisation','Trust / estate','Other / please advise']),
    {...q('businessActivity','Main business activity'),maxLength:200,help:'A short description is enough.'},
    {...q('responsiblePartyName','Name of the owner / person responsible for the entity'),maxLength:100},
    q('previousEin','Has this entity previously applied for or received an EIN?',yn),
  ];
  else if(service==='tax')specific=[
    q('taxYear','Which tax year do you need help with?',[...Array.from({length:11},(_,i)=>String(year-i)),'Multiple years','Earlier year','Not sure']),
    q('previousUsReturn','Have you filed a U.S. tax return before?',yn),
    q('usStatus','Have you ever been a U.S. citizen or green card holder?',['Never','Current U.S. citizen','Former U.S. citizen','Current green card holder','Former green card holder','Not sure']),
    q('usVisaHistory','Have you held a U.S. visa?',yn),
    q('taxIdAvailable','Do you already have an SSN or ITIN?',['SSN','ITIN','Neither','Applied for one / awaiting it','Not sure']),
    q('taxRecordsReady','Are your tax / income documents available?',['Yes','Some are available','Not yet','Not sure']),
  ];
  else specific=[
    q('citizenshipCountry','Country of citizenship',countryNames),
    {...q('foreignCountry','Country of your foreign address',countryNames.filter(x=>x!=='United States')),help:'Foreign-address information is mandatory for preparation. We will collect the full address privately. If you no longer have a foreign residence, choose your last country and tell our team in the notes.'},
    q('usStatus','Have you ever been a U.S. citizen or green card holder?',['Never','Current U.S. citizen','Former U.S. citizen','Current green card holder','Former green card holder','Not sure']),
    q('usVisaHistory','Have you held a U.S. visa?',yn),
    q('previousItinApplication','Have you applied for an ITIN before?',yn),
    q('passportReady','Do you have a current passport?',['Yes','Expired / renewal in progress','No','Not sure']),
    ...(routeId==='renewal'?[
      q('renewalReason','Why are you renewing?',['IRS renewal notice','Need to file a U.S. return','Advised that my ITIN expired','Other / please advise']),
      q('returnReady','Is the relevant U.S. tax return available?',['Current return prepared','Previous return available','Need help preparing a return','Not sure']),
    ]:[q('returnReady','Do you have a prepared U.S. tax return?',['Yes','No','Not needed / applying with supporting evidence','Not sure'])]),
  ];
  const filingYear=service==='tax'&&/^\d{4}$/.test(basic.taxYear||'')?Number(basic.taxYear):year;
  const travel=service==='ein'?[]:Array.from({length:3},(_,i)=>q(`usTime${i}`,`Time spent in the U.S. in ${filingYear-i}`,['None','1–30 days','31–90 days','91–182 days','183 days or more','Not sure'],false));
  return [...common,...specific,{...q('town','Town / city where you are based',undefined,false),maxLength:100},...travel,
    q('referral','How did you hear about ITIN PRO LTD?',['Google / other search','IRS website','Recommendation','Social media','Other'],false),
    {id:'notes',label:'Anything else you would like us to know?',kind:'textarea',maxLength:500,help:'Optional. Include other citizenships or explain a previous application. Do not enter passport numbers, SSNs, ITINs, EINs or bank details.'}];
}
export function basicQuestionError(field:BasicQuestion,value:string|undefined){
  const text=(value||'').trim();
  if(!text)return field.required?'Please complete this question.':undefined;
  if(field.options&&!field.options.includes(text))return 'Choose one of the listed answers.';
  if(text.length>(field.maxLength||1000))return 'Please shorten this answer.';
}
export function summarizeBasicQuestions(service:IntakeService,routeId:string,basic:Record<string,string>,year=new Date().getUTCFullYear()){
  return basicServiceQuestions(service,routeId,basic,year).filter(f=>basic[f.id]?.trim()).map(f=>`${f.label}: ${basic[f.id].trim()}`).join('\n');
}
