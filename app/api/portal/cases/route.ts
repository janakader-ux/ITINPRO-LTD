import { randomUUID,createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentDatabase,stripeClient,verifySandboxCatalog,paymentConfigurationReady } from '@/lib/payments';
import { portalEnabled,portalSession,portalBucket,uploadsEnabled,ensurePortalBucket,sendPortalLink,safePortalError } from '@/lib/portal/server';
import { getApplicationRoute,routeChecklist,routeFee,checklistVersion } from '@/lib/portal/checklists';
import { sameOrigin,caseInput,answersInput,draftAnswersInput,foreignAddressInput,validateFile } from '@/lib/portal/validation';
import { engagementSnapshot } from '@/lib/portal/engagement';
import { queuePortalNotice,repairAndRetryNotices } from '@/lib/portal/notifications';
import { compatibleApplicationRoutes,sandboxRecipient } from '@/lib/portal/case-options';
import { normalizeQuestionnaireAnswers } from '@/lib/portal/questionnaire';
import { createReviewedCase } from '@/lib/portal/create-reviewed-case';
import { issueCaseInvoice } from '@/lib/portal/invoice';
import { missingRequiredUploads } from '@/lib/portal/client-journey';
import { casePaymentMatches } from '@/lib/portal/workflow';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function context(caseId?:string) {
  if(!portalEnabled())throw new Error('SANDBOX_ONLY');
  const session=await portalSession();
  const admin=paymentDatabase();
  if(!caseId)return {...session,admin,c:null};
  const id=z.uuid().parse(caseId);
  const {data:c,error}=await session.db.from('portal_cases').select('*').eq('id',id).maybeSingle();
  if(error || !c)throw new Error('CASE_NOT_FOUND');
  return {...session,admin,c};
}
async function audit(admin:ReturnType<typeof paymentDatabase>,caseId:string,actor:string,action:string,detail:Record<string,unknown>={}) {
  const r=await admin.from('portal_audit').insert({case_id:caseId,actor_id:actor,action,detail});if(r.error)throw r.error;
}
async function canCollect(admin:ReturnType<typeof paymentDatabase>,c:NonNullable<Awaited<ReturnType<typeof context>>['c']>) {
  if(!c.test_only || c.status==='cancelled')throw new Error('SANDBOX_ONLY');
  const {data:p,error:pe}=await admin.from('payment_orders').select('id,status,amount,currency,kind,service_category').eq('id',c.payment_order_id).single();
  if(pe || !casePaymentMatches(c,p))throw new Error('PAYMENT_REQUIRED');
  const {data:a,error:ae}=await admin.from('portal_agreements').select('accepted_at,work_may_start_at').eq('case_id',c.id).single();
  if(ae || !a.accepted_at)throw new Error('AGREEMENT_REQUIRED');
  return a;
}
async function canUpload(admin:ReturnType<typeof paymentDatabase>,c:NonNullable<Awaited<ReturnType<typeof context>>['c']>){
  if(!uploadsEnabled())throw new Error('UPLOADS_DISABLED');return canCollect(admin,c);
}
export async function GET(request:Request) {
  try{
    const query=new URL(request.url).searchParams;
    const s=await context(query.get('caseId') || undefined);
    if(query.get('enquiries')==='yes'){
      if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      const {data,error}=await s.admin.from('enquiries').select('id,name,email,reason,message,intake,created_at').contains('intake',{testOnly:true,service:'itin'}).order('created_at',{ascending:false}).limit(30);
      if(error)throw error;
      const issued=data?.length?await s.admin.from('payment_orders').select('enquiry_id,portal_cases!inner(id)').in('enquiry_id',data.map(e=>e.id)):{data:[],error:null};if(issued.error)throw issued.error;
      const issuedIds=new Set(issued.data?.map(o=>o.enquiry_id));
      return json({enquiries:data?.filter(e=>!issuedIds.has(e.id)),testClientEmail:process.env.PORTAL_TEST_CLIENT_EMAIL?.trim().toLowerCase()||null});
    }
    if(query.get('orders')==='yes'){
      if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      const {data,error}=await s.admin.from('payment_orders').select('id,service_category,amount,enquiries!inner(name,email,message)').eq('kind','checkout').eq('status','paid').order('created_at',{ascending:false}).limit(30);
      if(error)throw error;
      return json({orders:(data||[]).filter(x=>{const e=x.enquiries as unknown as {email:string;message:string};return e.email.endsWith('@example.com') && e.message.startsWith('AUTOMATED TEST ONLY') && compatibleApplicationRoutes({category:x.service_category,amount:x.amount}).length>0;}).map(x=>({id:x.id,category:x.service_category,amount:x.amount})),testClientEmail:process.env.PORTAL_TEST_CLIENT_EMAIL?.trim().toLowerCase() || null});
    }
    if(!s.c){const {data,error}=await s.db.from('portal_cases').select('id,legal_name,route_id,status,created_at').order('created_at',{ascending:false}).limit(100);if(error)throw error;return json({cases:data,role:s.account.role,staffMfa:s.staff});}
    const names=['portal_answers','portal_agreements','portal_documents','portal_requests','portal_approvals'] as const;
    const results=await Promise.all(names.map(name=>s.db.from(name).select('*').eq('case_id',s.c!.id)));
    for(const result of results)if(result.error)throw result.error;
    const value=Object.fromEntries(names.map((name,i)=>[name,results[i].data]));
    // Case access was already checked with session RLS. Staff cannot read another
    // account through the self-only account policy, so resolve its email server-side.
    const owner=await s.admin.from('portal_accounts').select('email').eq('user_id',s.c.owner_id).single();if(owner.error)throw owner.error;
    const payment=await s.admin.from('payment_orders').select('id,status,amount,currency,service_category,kind,paid_at').eq('id',s.c.payment_order_id).single();if(payment.error)throw payment.error;
    return json({clientEmail:owner.data.email,case:s.c,role:s.account.role,staffMfa:s.staff,uploadsEnabled:uploadsEnabled(),payment:payment.data,paymentsEnabled:paymentConfigurationReady(),...value});
  }catch(error){const code=safePortalError(error);return json({error:code},code==='SIGN_IN_REQUIRED'?401:code==='CASE_NOT_FOUND'?404:code==='STAFF_MFA_REQUIRED'?403:503);}
}
export async function POST(request:Request) {
  if(!sameOrigin(request))return json({error:'Use the portal form.'},403);
  try{
    const multipart=request.headers.get('content-type')?.startsWith('multipart/form-data');
    if(multipart){
      const length=Number(request.headers.get('content-length'));
      if(!length || length>11*1024*1024)throw new Error('FILE_SIZE');
      if(!uploadsEnabled())throw new Error('UPLOADS_DISABLED');
      const form=await request.formData();
      if(form.get('syntheticOnly')!=='yes')throw new Error('SANDBOX_ONLY');
      const s=await context(String(form.get('caseId')||''));
      const c=s.c!;const agreement=await canUpload(s.admin,c);
      const file=form.get('file');if(!(file instanceof File))throw new Error('INVALID_INPUT');
      const item=z.string().max(80).parse(form.get('itemId'));
      const kind=z.enum(['upload','draft','submission','outcome','internal']).parse(form.get('kind')||'upload');
      if(!s.staff && (s.account.role!=='client' || s.user.id!==c.owner_id || kind!=='upload'))throw new Error('STAFF_MFA_REQUIRED');
      if(kind!=='upload' && new Date(agreement.work_may_start_at).getTime()>Date.now())throw new Error('AGREEMENT_REQUIRED');
      if(kind==='upload' && !routeChecklist(c.route_id).some(x=>x.id===item) && item!=='completed-w7'){
        const requested=await s.db.from('portal_requests').select('id').eq('case_id',c.id).eq('item_id',item).eq('resolved',false).limit(1);
        if(requested.error || !requested.data?.length)throw new Error('INVALID_INPUT');
      }
      if(!s.staff && !['collecting','missing_information','review'].includes(c.status))throw new Error('INVALID_INPUT');
      // Client ownership is derived from the authenticated case, not the upload name/path.
      const bytes=new Uint8Array(await file.arrayBuffer());const ext=validateFile(bytes,file.name,file.type);
      const id=randomUUID(),path=`${c.id}/${kind}/${id}.${ext}`,hash=createHash('sha256').update(bytes).digest('hex');
      await ensurePortalBucket();
      const uploaded=await s.admin.storage.from(portalBucket).upload(path,bytes,{contentType:file.type,upsert:false});
      if(uploaded.error)throw uploaded.error;
      const recorded=await s.admin.from('portal_documents').insert({id,case_id:c.id,uploaded_by:s.user.id,item_id:item,name:file.name.replace(/[\r\n]/g,'').slice(0,200),path,mime:file.type,byte_size:bytes.length,sha256:hash,kind,visibility:kind==='upload'?'client':'staff'});
      if(recorded.error){console.error('itinpro_portal_record_failure',JSON.stringify({documentId:id}));throw recorded.error;}
      await audit(s.admin,c.id,s.user.id,'document_uploaded',{document_id:id,sha256:hash,kind});
      await queuePortalNotice(c.id,`upload-${id}`,'staff').catch(()=>{});
      return json({ok:true,documentId:id},201);
    }
    const body=await request.json();
    if(body.action==='review-enquiry'){
      const s=await context();if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      return json({ok:true,...await createReviewedCase(s.admin,s.user.id,body.input)},201);
    }
    if(body.action==='create'){
      const s=await context();if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      const input=caseInput.parse(body.input);const route=getApplicationRoute(input.routeId)!;
      const {data:order,error:oe}=await s.admin.from('payment_orders').select('*').eq('id',input.orderId).single();
      if(!oe && !compatibleApplicationRoutes({category:order.service_category,amount:order.amount}).some(x=>x.id===input.routeId))return json({error:'This payment does not match the selected ITIN route. Choose a matching ITIN test order; EIN orders cannot be used here.'},400);
      if(oe || order.status!=='paid' || order.kind!=='checkout' || order.amount!==routeFee(input.routeId) || order.service_category!==route.priceCategory || order.currency!=='gbp')throw new Error('PAYMENT_REQUIRED');
      const {data:e,error:ee}=await s.admin.from('enquiries').select('email,message').eq('id',order.enquiry_id).single();
      if(ee || !e.email.toLowerCase().endsWith('@example.com') || !e.message.startsWith('AUTOMATED TEST ONLY') || !/TEST/i.test(input.legalName))throw new Error('SANDBOX_ONLY');
      const stripe=stripeClient();await verifySandboxCatalog(stripe);
      const remote=await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if(remote.livemode || remote.payment_status!=='paid' || remote.amount_total!==order.amount || remote.currency!=='gbp' || remote.metadata?.order_id!==order.id)throw new Error('PAYMENT_REQUIRED');
      const recipient=sandboxRecipient(e,process.env.PORTAL_TEST_CLIENT_EMAIL);
      let nominatedUserId:string|undefined;
      if(recipient!==e.email.toLowerCase()){
        const nominee=await s.admin.from('portal_accounts').select('user_id,email,role,active').eq('email',recipient).maybeSingle();
        if(nominee.error || !nominee.data || nominee.data.role!=='client' || !nominee.data.active)return json({error:'The nominated client-test account is not ready. Sign in to that client account first.'},400);
        nominatedUserId=nominee.data.user_id;
      }
      // Named tester override applies only to synthetic sandbox orders. The paid
      // Stripe session, category, amount and staff MFA checks above remain required.
      const {data:link,error:le}=await s.admin.auth.admin.generateLink({type:'magiclink',email:recipient});
      if(le || !link.user || link.user.email?.toLowerCase()!==recipient || (nominatedUserId && link.user.id!==nominatedUserId))throw le || new Error('AUTH_ACCOUNT_FAILED');
      const a=await s.admin.from('portal_accounts').upsert({user_id:link.user.id,email:recipient,role:'client'}, {onConflict:'user_id',ignoreDuplicates:true});if(a.error)throw a.error;
      const {data:account,error:ace}=await s.admin.from('portal_accounts').select('role,active,email').eq('user_id',link.user.id).single();
      if(ace || account.role!=='client' || !account.active || account.email!==recipient)throw new Error('INVALID_INPUT');
      const inserted=await s.admin.from('portal_cases').upsert({owner_id:link.user.id,payment_order_id:order.id,legal_name:input.legalName,address:input.address,route_id:input.routeId,price_category:route.priceCategory,fee:order.amount,tax_year:input.taxYear,checklist_version:checklistVersion,test_only:true},{onConflict:'payment_order_id',ignoreDuplicates:true}).select('*').maybeSingle();
      if(inserted.error)throw inserted.error;
      if(!inserted.data){const existing=await s.admin.from('portal_cases').select('*').eq('payment_order_id',order.id).single();if(existing.error)throw existing.error;if(existing.data.owner_id!==link.user.id || existing.data.route_id!==input.routeId || existing.data.legal_name!==input.legalName || existing.data.address!==input.address || existing.data.tax_year!==input.taxYear)return json({error:'This payment already has a different case.'},409);const repaired=await s.admin.from('portal_agreements').upsert({case_id:existing.data.id,...engagementSnapshot(existing.data)},{onConflict:'case_id',ignoreDuplicates:true});if(repaired.error)throw repaired.error;return json({ok:true,caseId:existing.data.id});}
      const snapshot=engagementSnapshot(inserted.data);
      const agreement=await s.admin.from('portal_agreements').insert({case_id:inserted.data.id,...snapshot});if(agreement.error)throw agreement.error;
      await audit(s.admin,inserted.data.id,s.user.id,'case_created',{order_id:order.id,route:route.id,nominated_test_client:recipient!==e.email.toLowerCase()});
      await queuePortalNotice(inserted.data.id,`case-${inserted.data.id}`,'client').catch(()=>{});
      return json({ok:true,caseId:inserted.data.id},201);
    }
    const s=await context(body.caseId),c=s.c!;
    if(s.account.role==='staff' && !s.staff)throw new Error('STAFF_MFA_REQUIRED');
    if(body.action==='invite'){
      if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      const {data:a,error}=await s.admin.from('portal_accounts').select('email').eq('user_id',c.owner_id).single();if(error)throw error;
      await sendPortalLink(a.email);await audit(s.admin,c.id,s.user.id,'access_link_requested');return json({ok:true,message:'Access link requested; inbox delivery must be checked separately.'});
    }
    if(body.action==='answers'||body.action==='save-draft'){
      if(s.user.id!==c.owner_id || !['collecting','review','missing_information'].includes(c.status))throw new Error('INVALID_INPUT');
      await canCollect(s.admin,c);
      if(!body.answers || typeof body.answers!=='object' || Array.isArray(body.answers))return json({error:'Please check the questionnaire answers.'},400);
      const parsed=(body.action==='save-draft'?draftAnswersInput:answersInput).safeParse(normalizeQuestionnaireAnswers(body.answers,s.user.email!));
      if(!parsed.success){const foreign=parsed.error.issues.some(x=>['foreignAddress','foreignCountry'].includes(String(x.path[0])));return json({error:foreign?'Foreign address is mandatory. Enter a complete foreign address and select its non-US country. If you need help, contact the CAA before sending for review.':'Please check the questionnaire fields.',fields:[...new Set(parsed.error.issues.map(x=>String(x.path[0])))]},400);}
      const input=parsed.data;
      const revision=z.number().int().nonnegative().parse(body.revision??0);
      const r=await s.admin.rpc('portal_save_answers',{p_case:c.id,p_actor:s.user.id,p_answers:input,p_revision:revision});
      if(r.error)throw new Error(/ANSWERS_VERSION_MISMATCH/.test(r.error.message)?'ANSWERS_VERSION_MISMATCH':'INVALID_INPUT');
      return json({ok:true,revision:r.data});
    }
    if(body.action==='accept'){
      if(s.user.id!==c.owner_id)throw new Error('INVALID_INPUT');
      const input=z.object({hash:z.string().regex(/^[a-f0-9]{64}$/),signature:z.string().trim().min(2).max(100),terms:z.literal(true),documents:z.literal(true),identity:z.literal(true),privacy:z.literal(true),startEarly:z.boolean()}).parse(body.acceptance);
      const r=await s.admin.rpc('portal_accept_agreement',{p_case:c.id,p_actor:s.user.id,p_hash:input.hash,p_signature:input.signature,p_early:input.startEarly});if(r.error)throw new Error(/VERSION_MISMATCH/.test(r.error.message)?'AGREEMENT_VERSION_MISMATCH':'INVALID_INPUT');
      await queuePortalNotice(c.id,`signed-${c.id}`,'staff').catch(()=>{});
      let invoicePending=false;
      if(paymentConfigurationReady()&&c.workflow==='engagement-first'){try{await issueCaseInvoice(s.admin,stripeClient(),c.id);}catch{invoicePending=true;}}
      return json({ok:true,result:r.data,invoicePending});
    }
    if(body.action==='send-invoice'){
      if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
      if(!paymentConfigurationReady())throw new Error('SANDBOX_ONLY');
      const resendId=z.uuid().parse(body.resendId);
      const invoice=await issueCaseInvoice(s.admin,stripeClient(),c.id,resendId);
      return json({ok:true,invoiceId:invoice.invoiceId,notification:invoice.notification});
    }
    if(body.action==='submit'){
      if(s.user.id!==c.owner_id)throw new Error('INVALID_INPUT');await canUpload(s.admin,c);
      const answers=await s.admin.from('portal_answers').select('answers').eq('case_id',c.id).maybeSingle();if(answers.error)throw answers.error;
      if(!foreignAddressInput.safeParse(answers.data?.answers).success)return json({error:'Complete and save the mandatory foreign address and non-US country in Information before sending documents for review.'},400);
      const files=await s.admin.from('portal_documents').select('item_id,kind,state').eq('case_id',c.id);if(files.error)throw files.error;
      const missing=missingRequiredUploads(routeChecklist(c.route_id),files.data||[]);if(missing.length)return json({error:'Upload the remaining required documents before sending for review.',missing},400);
      const r=await s.admin.from('portal_cases').update({status:'review'}).eq('id',c.id).in('status',['collecting','missing_information']);if(r.error)throw r.error;
      await audit(s.admin,c.id,s.user.id,'review_requested');
      const notification=await queuePortalNotice(c.id,`review-${c.id}-${c.status}`,'staff').catch(()=>({pending:1,delivery:'unverified'}));
      return json({ok:true,notification});
    }
    if(body.action==='approve'){
      if(s.user.id!==c.owner_id)throw new Error('INVALID_INPUT');
      const input=z.object({documentId:z.uuid(),hash:z.string().regex(/^[a-f0-9]{64}$/),decision:z.enum(['approved','changes_requested']),comment:z.string().max(1500)}).parse(body.decision);
      const r=await s.admin.rpc('portal_decide_draft',{p_case:c.id,p_actor:s.user.id,p_document:input.documentId,p_hash:input.hash,p_decision:input.decision,p_comment:input.comment});if(r.error)throw new Error(/VERSION_MISMATCH/.test(r.error.message)?'DRAFT_VERSION_MISMATCH':'INVALID_INPUT');return json({ok:true,result:r.data});
    }
    if(!s.staff)throw new Error('STAFF_MFA_REQUIRED');
    if(body.action==='request'){
      const item=z.string().min(1).max(80).parse(body.itemId),message=z.string().trim().min(10).max(1500).parse(body.message);
      const r=await s.admin.from('portal_requests').insert({case_id:c.id,item_id:item,message,created_by:s.user.id}).select('id').single();if(r.error)throw r.error;
      const u=await s.admin.from('portal_cases').update({status:'missing_information'}).eq('id',c.id);if(u.error)throw u.error;
      await audit(s.admin,c.id,s.user.id,'information_requested',{item_id:item});const notification=await queuePortalNotice(c.id,`request-${r.data.id}`,'client').catch(()=>({pending:1,delivery:'unverified'}));return json({ok:true,notification});
    }
    if(body.action==='resolve'){
      const id=z.uuid().parse(body.requestId);const r=await s.admin.from('portal_requests').update({resolved:true}).eq('id',id).eq('case_id',c.id);if(r.error)throw r.error;await audit(s.admin,c.id,s.user.id,'request_resolved',{request_id:id});return json({ok:true});
    }
    if(body.action==='review-document'){
      const id=z.uuid().parse(body.documentId);const state=z.enum(['accepted','replace_requested']).parse(body.state);
      const r=await s.admin.from('portal_documents').update({state}).eq('id',id).eq('case_id',c.id);if(r.error)throw r.error;await audit(s.admin,c.id,s.user.id,'document_reviewed',{document_id:id,state});return json({ok:true});
    }
    // Draft release and submission gates need atomic transactions. Added RPC below.
    if(body.action==='release'){
      await canCollect(s.admin,c);
      const documentId=z.uuid().parse(body.documentId);const r=await s.admin.rpc('portal_release_draft',{p_case:c.id,p_actor:s.user.id,p_document:documentId});if(r.error)throw new Error('INVALID_INPUT');const notification=await queuePortalNotice(c.id,`draft-${documentId}`,'client').catch(()=>({pending:1,delivery:'unverified'}));return json({ok:true,notification});
    }
    if(body.action==='share-record'){
      const id=z.uuid().parse(body.documentId);const r=await s.admin.from('portal_documents').update({visibility:'client'}).eq('id',id).eq('case_id',c.id).in('kind',['submission','outcome']);if(r.error)throw r.error;
      await audit(s.admin,c.id,s.user.id,'record_shared',{document_id:id});await queuePortalNotice(c.id,`record-${id}`,'client').catch(()=>{});return json({ok:true});
    }
    if(body.action==='retry-notices'){return json({ok:true,notification:await repairAndRetryNotices(c.id)});}
    if(body.action==='stage'){
      const stage=z.enum(['verification','submitted','complete']).parse(body.stage);
      if(stage==='submitted'){const answers=await s.admin.from('portal_answers').select('answers').eq('case_id',c.id).maybeSingle();if(answers.error)throw answers.error;if(!foreignAddressInput.safeParse(answers.data?.answers).success)return json({error:'Mandatory foreign-address information is missing. Request and review it before recording submission.'},400);}
      const details=stage==='verification'?z.object({verifier:z.string().trim().min(2).max(100),route:z.enum(['in-person','video-with-original-in-hand','issuing-agency-certified-copy']),originalDocumentHeld:z.literal(true),interviewConducted:z.literal(true),originalW7Signature:z.literal(true)}).parse(body.details):stage==='submitted'?z.object({reference:z.string().trim().min(3).max(200)}).parse(body.details):{};
      const r=await s.admin.rpc('portal_record_stage',{p_case:c.id,p_actor:s.user.id,p_stage:stage,p_details:details});if(r.error)throw new Error('INVALID_INPUT');return json({ok:true,message:'Sandbox stage recorded. No application was submitted to the IRS.'});
    }
    return json({error:'Invalid action.'},400);
  }catch(error){const code=safePortalError(error);return json({error:code},code==='SIGN_IN_REQUIRED'?401:code==='CASE_NOT_FOUND'?404:code==='STAFF_MFA_REQUIRED'?403:code==='PORTAL_TEMPORARILY_UNAVAILABLE'?503:400);}
}
