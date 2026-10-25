import { answerSupportStatus } from './answer-support';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getApplicationRoute } from './checklists';
import { basicFields } from './fields';
import { foreignCountryOptions } from './questionnaire';
export { basicFields } from './fields';
export const caseInput = z.object({ orderId: z.uuid(), routeId: z.string().refine(x => !!getApplicationRoute(x)), legalName: z.string().trim().min(2).max(100), address: z.string().trim().min(10).max(500), taxYear: z.number().int().min(2000).max(new Date().getUTCFullYear() + 1) });
const addressFields=Object.fromEntries(basicFields.map(x=>[x,z.string().trim().max(x.toLowerCase().includes('address')||x==='notes'?1500:200).optional()]));
const foreignAddressSchema=z.object({
  foreignAddress:z.string().trim().max(1500).optional().default(''),
  foreignCountry:z.string().refine(value=>foreignCountryOptions.includes(value),'Select a country outside the United States.'),
  foreignAddressStatus:z.string().optional(),
  w7Reason:z.string().optional()
}).superRefine((value,ctx)=>{
  const countryOnly=value.foreignAddressStatus==='moved-country-only'&&value.w7Reason!=='b';
  if(countryOnly)return;
  if((value.foreignAddress||'').trim().length<10)ctx.addIssue({code:'custom',path:['foreignAddress'],message:'Enter one complete foreign address.'});
  if(answerSupportStatus(value.foreignAddress||''))ctx.addIssue({code:'custom',path:['foreignAddress'],message:'Resolve the foreign address with the CAA team.'});
});
export const foreignAddressInput=foreignAddressSchema;
const baseAnswers=z.object(addressFields).extend({
  foreignAddress:foreignAddressSchema.shape.foreignAddress,
  foreignCountry:foreignAddressSchema.shape.foreignCountry,
  contactEmail:z.union([z.email(),z.literal('')]).optional()
}).strict();
export const answersInput=baseAnswers.superRefine((value,ctx)=>{
  if(value.contactEmailChoice==='Use another contact email'&&!z.email().safeParse(value.contactEmail).success)ctx.addIssue({code:'custom',path:['contactEmail'],message:'Enter a valid contact email.'});
  const answer=(key:string)=>String((value as Record<string,unknown>)[key]||'');
  const required=['applicationType','w7Reason','birthNameDifferent','firstName','lastName','dateOfBirth','sex','birthCountry','citizenship','foreignCountry','mailingAddressChoice','phoneNumber','passportIssuer','passportNumber','passportExpiry','previousItinStatus','visaType'];
  for(const key of required)if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Complete this required Form W-7 detail.'});
  if(value.mailingAddressChoice==='Different mailing address')for(const key of ['mailingCountry','mailingStreetAddress','mailingCity'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Complete the different mailing address.'});
  if(value.foreignAddressStatus!=='moved-country-only'||value.w7Reason==='b')for(const key of ['foreignStreetAddress','foreignCity'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Complete the foreign street address and city.'});
  if(value.passportExpiry&&/^\d{4}-\d{2}-\d{2}$/.test(value.passportExpiry)&&value.passportExpiry<new Date().toISOString().slice(0,10))ctx.addIssue({code:'custom',path:['passportExpiry'],message:'The passport must be unexpired when you submit your application.'});
  if(value.applicationType==='renewal'&&value.previousItinStatus!=='Yes')ctx.addIssue({code:'custom',path:['previousItinStatus'],message:'A renewal needs the previously assigned ITIN details.'});
  if((value.w7Reason==='f'||value.w7Reason==='h')&&!String(value.treatyClaimStatus||'').trim())ctx.addIssue({code:'custom',path:['treatyClaimStatus'],message:'Select Yes, No or Not sure.'});
  if(value.w7Reason==='a'||value.w7Reason==='h'||value.w7Reason==='f')if(!String(value.boxHException||'').trim())ctx.addIssue({code:'custom',path:['boxHException'],message:'Select the applicable box h exception, or ask the CAA team to review.'});
  if(value.w7Reason==='a'||(value.w7Reason==='f'||value.w7Reason==='h')&&value.treatyClaimStatus==='yes')if(!String(value.treatyArticle||'').trim())ctx.addIssue({code:'custom',path:['treatyArticle'],message:'Enter the treaty article or select “Not sure” for CAA review.'});
  if(value.w7Reason==='d'||value.w7Reason==='e')for(const key of ['usPersonFirstName','usPersonLastName'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Enter the U.S. citizen or resident alien’s name.'});
  if(value.w7Reason==='d'&&!String(value.relationship||'').trim())ctx.addIssue({code:'custom',path:['relationship'],message:'Enter the relationship to the U.S. person.'});
  if(value.w7Reason==='f')for(const key of ['institutionName','institutionCityState','durationOfStay'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Complete the student, professor or researcher details.'});
  if(value.w7Reason==='h'&&!String(value.notes||'').trim())ctx.addIssue({code:'custom',path:['notes'],message:'Explain your reason and the U.S. income or transaction.'});
  if(['h','f'].includes(value.w7Reason||'')&&['1a','1b'].includes(value.boxHException||'')&&!String(value.companyEin||'').trim())ctx.addIssue({code:'custom',path:['companyEin'],message:'Enter the partnership or business EIN from your evidence.'});
  if(['h','f'].includes(value.w7Reason||'')&&['3','4'].includes(value.boxHException||''))for(const key of ['propertyAddress','closingDate'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Enter the U.S. property address and transaction date.'});
  if(['b','c','d','e','f','g'].includes(value.w7Reason||'')&&!String(value.taxReturnStatus||'').trim())ctx.addIssue({code:'custom',path:['taxReturnStatus'],message:'Select the status of your U.S. tax return.'});
  if(value.visaType&&value.visaType!=='No U.S. visa'&&!value.visaType.startsWith('Not sure'))for(const key of ['visaNumber','visaExpiry','lastUsEntry'])if(!answer(key).trim())ctx.addIssue({code:'custom',path:[key],message:'Complete the U.S. visa detail or contact the CAA team.'});
});
export const draftAnswersInput=z.object(addressFields).strict();
export function documentHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
export function validateFile(bytes: Uint8Array, name: string, mime: string) {
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('FILE_SIZE');
  const ext = name.split('.').at(-1)?.toLowerCase();
  const expected = mime === 'application/pdf' && ext === 'pdf' && Buffer.from(bytes.subarray(0,5)).toString() === '%PDF-' ? 'pdf' :
    mime === 'image/png' && ext === 'png' && Buffer.from(bytes.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' :
    mime === 'image/jpeg' && (ext === 'jpg' || ext === 'jpeg') && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : null;
  if (!expected) throw new Error('FILE_TYPE');
  return expected;
}
export function portalOrigin(fallback = 'https://itinpro-uk.onrender.com') {
  return new URL(process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || fallback).origin;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.NODE_ENV === 'production' ? portalOrigin(request.url) : new URL(request.url).origin;
  return !!origin && origin === expected;
}
