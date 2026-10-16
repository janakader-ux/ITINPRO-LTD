import { portalOrigin } from './validation';
import { Resend } from 'resend';
import { paymentDatabase } from '../payments';
import { sendPortalLink } from './server';
export async function queuePortalNotice(caseId:string,eventKey:string,recipient:'client'|'staff') {
  const db=paymentDatabase();
  const insert=await db.from('portal_notifications').upsert({event_key:eventKey,case_id:caseId,recipient},{onConflict:'event_key',ignoreDuplicates:true});
  if(insert.error)throw insert.error;
  return sendPendingNotices(caseId);
}
export async function sendPendingNotices(caseId:string) {
  const db=paymentDatabase();const pending=await db.from('portal_notifications').select('event_key,recipient').eq('case_id',caseId).eq('state','pending').limit(20);
  if(pending.error)throw pending.error;
  const c=await db.from('portal_cases').select('owner_id,workflow').eq('id',caseId).single();if(c.error)throw c.error;
  const owner=await db.from('portal_accounts').select('email').eq('user_id',c.data.owner_id).single();if(owner.error)throw owner.error;
  let accepted=0;const resend=new Resend(process.env.RESEND_API_KEY);
  const origin=portalOrigin();
  for(const item of pending.data || []){
    try{
      const to=item.recipient==='staff'?process.env.PORTAL_STAFF_EMAIL?.trim():owner.data.email;
      if(!to)continue;
      if(item.event_key===`case-${caseId}`&&item.recipient==='client'&&['engagement-first','payment-last'].includes(c.data.workflow)){
        const sent=await sendPortalLink(to,false,caseId);if(!sent)continue;
        const saved=await db.from('portal_notifications').update({state:'accepted',provider_email_id:sent.emailId}).eq('event_key',item.event_key).eq('state','pending');if(saved.error)continue;
        accepted++;continue;
      }
      const r=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL || 'ITIN PRO <enquiries@itinpro.uk>',to,
        subject:item.event_key.startsWith('invoice-')?'[SANDBOX TEST] ITIN PRO — signed engagement: invoice ready':'[SANDBOX TEST] ITIN PRO — secure portal update',text:`${item.event_key.startsWith('invoice-')?'Your engagement is signed. Your Stripe test invoice is ready: open Payment in your secure portal. This is a simulated payment request; no real funds are charged.\n':''}There is an update to your ITIN PRO case ${caseId}.\nSign in securely at ${origin}/portal to review the case and any outstanding actions.\nDocuments are available only in the portal. Do not reply with passports or tax identifiers.\nThis is the sandbox portal; do not upload real documents.`},{idempotencyKey:`portal/${item.event_key}`});
      if(r.error || !r.data?.id)continue;
      const saved=await db.from('portal_notifications').update({state:'accepted',provider_email_id:r.data.id}).eq('event_key',item.event_key).eq('state','pending');if(saved.error)continue;
      accepted++;
    }catch{ /* Keep the durable outbox entry pending for staff retry; never log PII. */ }
  }
  return {accepted,pending:(pending.data?.length||0)-accepted,delivery:'unverified' as const};
}
export async function repairAndRetryNotices(caseId:string) {
  const db=paymentDatabase();
  const requests=await db.from('portal_requests').select('id').eq('case_id',caseId);
  const documents=await db.from('portal_documents').select('id,kind,visibility').eq('case_id',caseId);
  if(requests.error || documents.error)throw requests.error || documents.error;
  const c=await db.from('portal_cases').select('workflow,payment_order_id').eq('id',caseId).single();if(c.error)throw c.error;
  const payment=await db.from('payment_orders').select('status').eq('id',c.data.payment_order_id).single();if(payment.error)throw payment.error;
  const notifyUploads=c.data.workflow!=='payment-last'||payment.data.status==='paid';
  const entries=[{event_key:`case-${caseId}`,case_id:caseId,recipient:'client'},
    ...(requests.data||[]).map(x=>({event_key:`request-${x.id}`,case_id:caseId,recipient:'client'})),
    ...(documents.data||[]).flatMap(x=>[...(notifyUploads?[{event_key:`upload-${x.id}`,case_id:caseId,recipient:'staff'}]:[]),
      ...(x.kind==='draft' && x.visibility==='client'?[{event_key:`draft-${x.id}`,case_id:caseId,recipient:'client'}]:[]),
      ...(['submission','outcome'].includes(x.kind) && x.visibility==='client'?[{event_key:`record-${x.id}`,case_id:caseId,recipient:'client'}]:[])])];
  const insert=await db.from('portal_notifications').upsert(entries,{onConflict:'event_key',ignoreDuplicates:true});if(insert.error)throw insert.error;
  return sendPendingNotices(caseId);
}

