import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentDatabase,stripeClient } from '../lib/payments';
import { issueCaseInvoice } from '../lib/portal/invoice';
test('service invoice requires signing, uses frozen fees, reopens the same invoice and guards stale retries',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','PORTAL_TEST_CLIENT_EMAIL','APP_URL'],before=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch;
  const id='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222',ownerId='33333333-3333-4333-8333-333333333333',hash='a'.repeat(64);
  let signed=false,amount=39500,creates=0,status='draft',stale=false,customerRef:string|null=null,invoiceRef:string|null=null;
  const sends:string[]=[];
  const json=(v:unknown)=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
  const invoice=()=>({id:'in_test_case',customer:'cus_test_case',livemode:false,status,total:39500,currency:'gbp',hosted_invoice_url:'https://invoice.stripe.com/test',metadata:{app:'itinpro',case_id:id,order_id:orderId,agreement_sha256:hash}});
  try{
    Object.assign(process.env,{SUPABASE_URL:'https://test-only.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'TEST_ONLY',STRIPE_SECRET_KEY:'rk_test_TEST_ONLY',PORTAL_TEST_CLIENT_EMAIL:'tester@example.com',APP_URL:'https://itinpro.uk'});
    globalThis.fetch=async(input,options)=>{
      const u=new URL(String(input)),method=options?.method||'GET';
      if(u.pathname.endsWith('/portal_cases'))return json({id,owner_id:ownerId,payment_order_id:orderId,legal_name:'TEST APPLICANT',fee:39500,price_category:'spouse',status:'awaiting_payment',test_only:true,workflow:'engagement-first'});
      if(u.pathname.endsWith('/portal_agreements'))return json({accepted_at:signed?'2026-10-13':null,sha256:hash});
      if(u.pathname.endsWith('/portal_accounts'))return json({email:'tester@example.com',active:true,role:'client'});
      if(u.pathname.endsWith('/portal_notifications'))return method==='GET'?json([]):new Response(null,{status:204});
      if(u.pathname.endsWith('/payment_orders')){
        if(method==='GET')return json({id:orderId,kind:'invoice',status:'pending',amount,currency:'gbp',service_category:'spouse',created_at:new Date(Date.now()-(stale?86400000:0)).toISOString(),stripe_customer_id:customerRef,stripe_invoice_id:invoiceRef});
        const b=JSON.parse(String(options?.body));if(b.stripe_customer_id)customerRef=b.stripe_customer_id;if(b.stripe_invoice_id)invoiceRef=b.stripe_invoice_id;return new Response(null,{status:204});
      }
      if(u.pathname.startsWith('/v1/prices/'))return json({id:u.pathname.split('/').at(-1),active:true,livemode:false,currency:'gbp',unit_amount:39500});
      if(u.pathname.startsWith('/v1/customers'))return json({id:'cus_test_case',email:'tester@example.com',livemode:false});
      if(u.pathname==='/v1/invoices'&&method==='POST'){
        creates++;const b=new URLSearchParams(String(options?.body));assert.equal(b.get('collection_method'),'send_invoice');assert.equal(b.get('metadata[agreement_sha256]'),hash);return json(invoice());
      }
      if(u.pathname==='/v1/invoiceitems'){
        const b=new URLSearchParams(String(options?.body));assert.equal(b.get('amount'),'39500');assert.equal(b.get('invoice'),'in_test_case');return json({id:'ii_test'});
      }
      if(u.pathname.endsWith('/finalize')){status='open';return json(invoice());}
      if(u.pathname.endsWith('/send')){sends.push(new Headers(options?.headers).get('idempotency-key')!);return json(invoice());}
      if(u.pathname==='/v1/invoices/in_test_case')return json(invoice());
      throw new Error(`Unexpected synthetic path ${u.pathname}`);
    };
    const run=(key?:string)=>issueCaseInvoice(paymentDatabase(),stripeClient(),id,key);
    await assert.rejects(run(),/AGREEMENT_REQUIRED/);assert.equal(creates,0);
    signed=true;amount=1;await assert.rejects(run(),/ORDER_MISMATCH/);assert.equal(creates,0);amount=39500;
    assert.equal((await run()).invoiceId,'in_test_case');assert.equal((await run()).url,'https://invoice.stripe.com/test');
    await run('staff-resend');assert.equal(creates,1);assert.equal(sends[0],sends[1]);assert.notEqual(sends[1],sends[2]);
    status='void';await assert.rejects(run(),/PAYMENT_SESSION_ENDED/);assert.equal(creates,1);
    invoiceRef=null;stale=true;await assert.rejects(run(),/PAYMENT_SESSION_ENDED/);assert.equal(creates,1);
  }finally{globalThis.fetch=original;for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
});
