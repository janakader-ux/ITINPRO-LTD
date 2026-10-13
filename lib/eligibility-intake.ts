import { z } from 'zod';
import { basicQuestionError, type BasicQuestion } from './basic-service-questions';
import countries from './portal/countries.json';
import { getApplicationRoute } from './portal/checklists';
import { getItinCategory } from './itin-pricing';

const yn = ['Yes', 'No', 'Not sure'] as const;
export const eligibilityQuestions: BasicQuestion[] = [
  {id:'residenceCountry',label:'Which country do you live in?',options:countries.map(c=>c.name),required:true},
  {id:'citizenshipCountry',label:'What is your country of citizenship?',options:countries.map(c=>c.name),required:true},
  {id:'ssnEligibility',label:'Do you have, qualify for, or have a pending application for a U.S. Social Security number?',options:yn,required:true,help:'Choose “Not sure” if you need our team to check. Do not enter any number.'},
  {id:'previousItinApplication',label:'Have you applied for an ITIN before?',options:yn,required:true},
  {id:'passportReady',label:'Do you have a current passport?',options:['Yes','Expired / renewal in progress','No','Not sure'],required:true},
  {id:'returnReady',label:'Do you already have a prepared U.S. tax return?',options:['Yes','No','Not needed / applying with supporting evidence','Not sure'],required:true},
  {id:'contactMethod',label:'How would you like us to contact you?',options:['Email','Phone','Either'],required:true},
  {id:'notes',label:'Anything else we should know?',kind:'textarea',maxLength:500,help:'Optional. No passport numbers, tax identifiers or bank details.'},
];
export const eligibilityIntakeSchema = z.object({
  flowVersion:z.literal('eligibility-v2'),service:z.literal('itin'),
  firstName:z.string().trim().min(1).max(50),lastName:z.string().trim().min(1).max(50),
  email:z.email(),phone:z.string().trim().min(5).max(40),
  applicationRoute:z.string().refine(v=>v==='not-sure'||!!getApplicationRoute(v)),
  preference:z.enum(['online','contact']),readiness:z.enum(['yes','no']).optional(),
  basic:z.record(z.string(),z.string().trim().max(1000)),consent:z.literal('yes'),website:z.string().max(0).optional(),
  testOnly:z.boolean().optional(),
  onboarding:z.object({address:z.string().trim().min(10).max(500),taxYear:z.number().int().min(2000).max(new Date().getUTCFullYear()+1),documentsReady:z.literal(true),taxPurposeUnderstood:z.literal(true),originalsUnderstood:z.literal(true)}).optional(),
}).superRefine((v,ctx)=>{
  for(const q of eligibilityQuestions){const e=basicQuestionError(q,v.basic[q.id]);if(e)ctx.addIssue({code:'custom',path:['basic',q.id],message:e});}
  if(v.preference==='online'&&!v.readiness)ctx.addIssue({code:'custom',path:['readiness'],message:'Tell us whether you are ready.'});
  if(v.testOnly&&(!v.email.toLowerCase().endsWith('@example.com')||!/^TEST\b/i.test(`${v.firstName} ${v.lastName}`)))ctx.addIssue({code:'custom',path:['testOnly'],message:'Use a TEST name and an example.com email for a synthetic enquiry.'});
});
export function normalizeEligibilityIntake(v:z.infer<typeof eligibilityIntakeSchema>){
  const route=getApplicationRoute(v.applicationRoute),category=getItinCategory(route?.priceCategory||'other')!;
  const basic=Object.fromEntries(eligibilityQuestions.filter(q=>v.basic[q.id]).map(q=>[q.id,v.basic[q.id]]));
  return {name:`${v.firstName} ${v.lastName}`,email:v.email,phone:v.phone,
    reason:route?.title||'Help me choose an ITIN route',serviceCategory:category.id,
    location:basic.residenceCountry,appointment:'To be arranged',llcAndEinConfirmed:undefined,
    consent:v.consent,website:v.website,
    intake:{flowVersion:v.flowVersion,service:'itin',applicationRoute:v.applicationRoute,preference:v.preference,readiness:v.readiness||'no',basic,testOnly:v.testOnly===true,onboarding:v.onboarding},
    message:[v.testOnly?'AUTOMATED TEST ONLY — synthetic enquiry':'Short ITIN eligibility enquiry',
      `Situation: ${route?.title||'Help me choose'}`,`Preference: ${v.preference}`,
      ...eligibilityQuestions.filter(q=>basic[q.id]).map(q=>`${q.label}: ${basic[q.id]}`),
      'Engagement must be signed before payment. Final CAA review and original-document verification are required before IRS submission.'].join('\n')};
}

export function selfServiceReady(v:ReturnType<typeof normalizeEligibilityIntake>['intake']){
  const route=getApplicationRoute(v.applicationRoute),category=route&&getItinCategory(route.priceCategory);
  const prior=v.applicationRoute==='renewal'?'Yes':'No';
  const returnRoute=['prepared-1040nr','spouse','renewal'].includes(v.applicationRoute);
  return !!route&&!!category?.amount&&!['other','complex-compensation'].includes(route.priceCategory)
    &&v.preference==='online'&&v.readiness==='yes'&&v.basic.ssnEligibility==='No'
    &&v.basic.previousItinApplication===prior&&v.basic.passportReady==='Yes'
    &&v.basic.returnReady===(returnRoute?'Yes':'Not needed / applying with supporting evidence')
    &&!!v.onboarding?.documentsReady&&!!v.onboarding.taxPurposeUnderstood&&!!v.onboarding.originalsUnderstood;
}
