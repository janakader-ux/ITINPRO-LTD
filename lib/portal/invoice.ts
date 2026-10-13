import type Stripe from 'stripe';
import { paymentDatabase,verifySandboxCatalog } from '../payments';
import { queuePortalNotice } from './notifications';

// The signed case, not browser input, fixes the recipient, scope and amount.
export async function issueCaseInvoice(db:ReturnType<typeof paymentDatabase>,stripe:Stripe,caseId:string,resendKey?:string){
  const c=await db.from('portal_cases').select('*').eq('id',caseId).single();
  if(c.error||!c.data?.test_only||c.data.status!=='awaiting_payment')throw new Error('CASE_ACCESS_DENIED');
  if(c.data.workflow==='payment-last'&&!c.data.intake_submitted_at)throw new Error('INTAKE_REQUIRED');
  const a=await db.from('portal_agreements').select('accepted_at,sha256').eq('case_id',caseId).single();
  if(a.error||!a.data?.accepted_at)throw new Error('AGREEMENT_REQUIRED');
  const o=await db.from('payment_orders').select('*').eq('id',c.data.payment_order_id).single();
  const order=o.data;
  if(o.error||!order||order.kind!=='invoice'||order.status==='paid'||order.amount!==c.data.fee||order.currency!=='gbp'||order.service_category!==c.data.price_category)throw new Error('ORDER_MISMATCH');
  const owner=await db.from('portal_accounts').select('email,active,role').eq('user_id',c.data.owner_id).single();
  if(owner.error||!owner.data?.active||owner.data.role!=='client'||owner.data.email!==process.env.PORTAL_TEST_CLIENT_EMAIL?.trim().toLowerCase())throw new Error('SANDBOX_ONLY');
  await verifySandboxCatalog(stripe);
  const claim=await db.rpc('portal_claim_invoice_start',{p_order:order.id});if(claim.error||!claim.data)throw claim.error||new Error('INVALID_INPUT');
  const stale=Date.now()-Date.parse(claim.data)>23*60*60*1000;
  if(stale&&!order.stripe_invoice_id)throw new Error('PAYMENT_SESSION_ENDED');
  const key=`itinpro/case-invoice/${order.id}`;
  const customer=order.stripe_customer_id?await stripe.customers.retrieve(order.stripe_customer_id):await stripe.customers.create({email:owner.data.email,name:c.data.legal_name,metadata:{app:'itinpro',case_id:caseId}},{idempotencyKey:`${key}/customer`});
  if(customer.deleted||customer.livemode||customer.email!==owner.data.email)throw new Error('SANDBOX_ONLY');
  const savedCustomer=await db.from('payment_orders').update({stripe_customer_id:customer.id}).eq('id',order.id);if(savedCustomer.error)throw savedCustomer.error;
  let invoice=order.stripe_invoice_id?await stripe.invoices.retrieve(order.stripe_invoice_id):await stripe.invoices.create({customer:customer.id,collection_method:'send_invoice',days_until_due:7,auto_advance:false,pending_invoice_items_behavior:'exclude',default_tax_rates:[],automatic_tax:{enabled:false},description:'ITIN PRO full ITIN application service — Form W-7 / CAA; tax-return preparation excluded; no VAT',metadata:{app:'itinpro',order_id:order.id,case_id:caseId,agreement_sha256:a.data.sha256}},{idempotencyKey:key});
  if(invoice.livemode||!invoice.id||invoice.customer!==customer.id||invoice.metadata?.order_id!==order.id||invoice.metadata?.case_id!==caseId||invoice.metadata?.agreement_sha256!==a.data.sha256)throw new Error('ORDER_MISMATCH');
  const saved=await db.from('payment_orders').update({stripe_invoice_id:invoice.id}).eq('id',order.id);if(saved.error)throw saved.error;
  if(invoice.status==='draft'){
    if(stale)throw new Error('PAYMENT_SESSION_ENDED');
    await stripe.invoiceItems.create({customer:customer.id,invoice:invoice.id,amount:c.data.fee,currency:'gbp',description:'Agreed full ITIN application service — Form W-7 / CAA',tax_rates:[]},{idempotencyKey:`${key}/line`});
    invoice=await stripe.invoices.retrieve(invoice.id);
    if(invoice.total!==c.data.fee||invoice.currency!=='gbp')throw new Error('ORDER_MISMATCH');
    invoice=await stripe.invoices.finalizeInvoice(invoice.id!,{auto_advance:false},{idempotencyKey:`${key}/finalize`});
  }
  if(invoice.status!=='open'||invoice.total!==c.data.fee||invoice.currency!=='gbp'||!invoice.hosted_invoice_url)throw new Error('PAYMENT_SESSION_ENDED');
  await stripe.invoices.sendInvoice(invoice.id!,{}, {idempotencyKey:`${key}/send/${resendKey||'initial'}`});
  // Stripe suppresses routine sandbox customer emails. Our durable notification
  // directs the nominated tester to the portal, where the same invoice is opened.
  const notification=await queuePortalNotice(caseId,`invoice-${invoice.id}-${resendKey||'initial'}`,'client').catch(()=>({pending:1,delivery:'unverified' as const}));
  return {url:invoice.hosted_invoice_url,invoiceId:invoice.id,notification,sandbox:true};
}
