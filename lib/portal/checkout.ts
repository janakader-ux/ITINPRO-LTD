import type Stripe from 'stripe';
import { appOrigin,fixedServicePrice,paymentDatabase,verifySandboxCatalog } from '../payments';
import { integrationIdentifier } from '../payment-security';
export type CheckoutCase={id:string;owner_id:string;fee:number;price_category:string;payment_order_id:string;status:string;test_only:boolean};
export async function startCaseCheckout(db:ReturnType<typeof paymentDatabase>,stripe:Stripe,c:CheckoutCase,actorId:string,email:string){
  if(c.owner_id!==actorId||!c.test_only||c.status==='cancelled')throw new Error('CASE_ACCESS_DENIED');
  const {data:a,error:ae}=await db.from('portal_agreements').select('accepted_at,sha256').eq('case_id',c.id).single();
  if(ae||!a?.accepted_at)throw new Error('AGREEMENT_REQUIRED');
  const {data:o,error:oe}=await db.from('payment_orders').select('*').eq('id',c.payment_order_id).single();
  if(oe||!o||o.kind!=='checkout'||o.amount!==c.fee||o.service_category!==c.price_category||o.currency!=='gbp')throw new Error('ORDER_MISMATCH');
  if(o.status==='paid')throw new Error('ALREADY_PAID');
  if(c.status!=='awaiting_payment')throw new Error('INVALID_INPUT');
  const {category,price}=fixedServicePrice(c.price_category);
  if(category.amount!==c.fee)throw new Error('ORDER_MISMATCH');
  await verifySandboxCatalog(stripe);
  if(o.stripe_checkout_session_id){
    const existing=await stripe.checkout.sessions.retrieve(o.stripe_checkout_session_id);
    if(existing.livemode||existing.metadata?.case_id!==c.id||existing.metadata?.agreement_sha256!==a.sha256||existing.amount_total!==c.fee||existing.currency!=='gbp')throw new Error('ORDER_MISMATCH');
    if(existing.status==='open'&&existing.url)return existing.url;
    throw new Error('PAYMENT_SESSION_ENDED');
  }
  if(o.status!=='pending')throw new Error('PAYMENT_SESSION_ENDED');
  const remotePrice=await stripe.prices.retrieve(price.priceId);
  if(remotePrice.livemode||!remotePrice.active||remotePrice.currency!=='gbp'||remotePrice.unit_amount!==c.fee)throw new Error('ORDER_MISMATCH');
  const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:email,adaptive_pricing:{enabled:false},
    line_items:[{price:price.priceId,quantity:1}],client_reference_id:o.id,
    metadata:{app:'itinpro',order_id:o.id,case_id:c.id,agreement_sha256:a.sha256,service_category:category.id},
    integration_identifier:integrationIdentifier(o.id),
    success_url:`${appOrigin()}/portal?case=${c.id}&payment=return`,cancel_url:`${appOrigin()}/portal?case=${c.id}&payment=cancelled`,
  },{idempotencyKey:`itinpro/engagement-checkout/${o.id}`});
  if(session.livemode||!session.url)throw new Error('SANDBOX_ONLY');
  const saved=await db.from('payment_orders').update({stripe_checkout_session_id:session.id}).eq('id',o.id).eq('status','pending');
  if(saved.error)throw saved.error;
  return session.url;
}
