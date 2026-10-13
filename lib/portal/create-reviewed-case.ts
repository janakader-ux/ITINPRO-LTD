import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { paymentDatabase } from '../payments';
import { getApplicationRoute,routeFee,checklistVersion } from './checklists';
import { engagementSnapshot } from './engagement';
import { sandboxRecipient } from './case-options';
import { reviewCaseInput } from './workflow';
import { selfServiceReady } from '../eligibility-intake';
import { queuePortalNotice } from './notifications';

export async function createReviewedCase(admin:ReturnType<typeof paymentDatabase>,actorId:string|null,raw:unknown){
  const input=reviewCaseInput.parse(raw),route=getApplicationRoute(input.routeId)!;
  const {data:e,error}=await admin.from('enquiries').select('id,email,message,intake').eq('id',input.enquiryId).single();
  if(error||!e||e.intake?.testOnly!==true||e.intake?.service!=='itin'||!/^TEST\b/i.test(input.legalName))throw new Error('SANDBOX_ONLY');
  if(actorId===null&&!selfServiceReady(e.intake))throw new Error('SCREENING_REQUIRED');
  const recipient=sandboxRecipient(e,process.env.PORTAL_TEST_CLIENT_EMAIL);
  let nominatedId:string|undefined;
  if(recipient!==e.email.toLowerCase()){
    const nominee=await admin.from('portal_accounts').select('user_id,role,active').eq('email',recipient).maybeSingle();
    if(nominee.error||!nominee.data?.active||nominee.data.role!=='client')throw new Error('TEST_CLIENT_NOT_READY');
    nominatedId=nominee.data.user_id;
  }
  const {data:link,error:le}=await admin.auth.admin.generateLink({type:'magiclink',email:recipient});
  if(le||!link.user||link.user.email?.toLowerCase()!==recipient||(nominatedId&&link.user.id!==nominatedId))throw new Error('AUTH_ACCOUNT_FAILED');
  const a=await admin.from('portal_accounts').upsert({user_id:link.user.id,email:recipient,role:'client'},{onConflict:'user_id',ignoreDuplicates:true});if(a.error)throw a.error;
  const account=await admin.from('portal_accounts').select('role,active,email').eq('user_id',link.user.id).single();
  if(account.error||account.data.role!=='client'||!account.data.active||account.data.email!==recipient)throw new Error('INVALID_INPUT');
  const c={id:randomUUID(),owner_id:link.user.id,enquiry_id:e.id,legal_name:input.legalName,address:input.address,
    route_id:route.id,price_category:route.priceCategory,fee:routeFee(route.id),tax_year:input.taxYear,
    workflow:'payment-last',checklist_version:checklistVersion,screening:{...input.screening,mode:actorId===null?'self-service':'assisted'},created_at:new Date().toISOString()};
  const agreement=engagementSnapshot(c);
  const result=await admin.rpc('portal_create_engagement_case',{p_case:c,p_agreement:agreement.snapshot,p_hash:agreement.sha256,p_actor:actorId});
  if(result.error)throw new Error(/ENQUIRY_ALREADY_REVIEWED|ORDER_MISMATCH/.test(result.error.message)?'ENQUIRY_ALREADY_REVIEWED':'PORTAL_TEMPORARILY_UNAVAILABLE');
  const caseId=z.uuid().parse(result.data);
  const notification=await queuePortalNotice(caseId,`case-${caseId}`,'client').catch(()=>({pending:1,delivery:'unverified'}));
  return {caseId,notification};
}
