import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentDatabase,stripeClient } from '../lib/payments';
import { startCaseCheckout } from '../lib/portal/checkout';
test('engagement checkout rejects unpaid signing bypasses, reuses sessions, and never charges a caller-supplied amount',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','APP_URL'],before=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch;
  const c={id:'11111111-1111-4111-8111-111111111111',owner_id:'22222222-2222-4222-8222-222222222222',payment_order_id:'33333333-3333-4333-8333-333333333333',fee:39500,price_category:'spouse',status:'awaiting_payment',test_only:true};
  let signed=false,orderAmount=39500,saveFails=true,creates=0,sessionRef:string|null=null,sessionStatus='open',stripeCalls=0;const requests:{body:string;key:string}[]=[];
  const session=()=>({id:'cs_test_signed',object:'checkout.session',status:sessionStatus,url:'https://checkout.stripe.com/test',livemode:false,amount_total:39500,currency:'gbp',metadata:{case_id:c.id,agreement_sha256:'a'.repeat(64)}});
  const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  try{
    Object.assign(process.env,{SUPABASE_URL:'https://test-only.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'TEST_ONLY',STRIPE_SECRET_KEY:'rk_test_TEST_ONLY',APP_URL:'https://itinpro.uk'});
    globalThis.fetch=async(input,options)=>{
      const url=String(input),method=options?.method||'GET';
      if(url.includes('/portal_agreements'))return json({accepted_at:signed?'2026-10-13T12:00:00Z':null,sha256:'a'.repeat(64)});
      if(url.includes('/payment_orders')){
        if(method==='GET')return json({id:c.payment_order_id,kind:'checkout',service_category:'spouse',amount:orderAmount,currency:'gbp',status:'pending',stripe_checkout_session_id:sessionRef});
        if(method==='PATCH'){if(saveFails){saveFails=false;return json({message:'Synthetic save failure'},400);}sessionRef='cs_test_signed';return new Response(null,{status:204});}
      }
      if(url.includes('api.stripe.com'))stripeCalls++;
      if(url.includes('/v1/prices/'))return json({object:'price',id:url.split('/').at(-1),livemode:false,active:true,unit_amount:39500,currency:'gbp'});
      if(url.includes('/v1/checkout/sessions')&&method==='POST'){
        creates++;const f=new URLSearchParams(String(options?.body));
        assert.equal(f.get('metadata[agreement_sha256]'),'a'.repeat(64));assert.equal(f.get('metadata[case_id]'),c.id);
        assert.equal(f.get('line_items[0][price]'),'price_1UPQJ0050EnIRMqj4aodcTOK');assert(!f.has('payment_method_types[0]'));
        assert.match(f.get('cancel_url')!,/\/portal\?case=/);assert.match(f.get('success_url')!,/payment=return/);
        requests.push({body:String(options?.body),key:new Headers(options?.headers).get('idempotency-key')!});return json(session());
      }
      if(url.includes('/v1/checkout/sessions/cs_test_signed'))return json(session());
      throw new Error(`Unexpected synthetic network path ${new URL(url).pathname}`);
    };
    const pay=(actor=c.owner_id)=>startCaseCheckout(paymentDatabase(),stripeClient(),c,actor,'test@example.com');
    await assert.rejects(pay('44444444-4444-4444-8444-444444444444'),/CASE_ACCESS_DENIED/);await assert.rejects(pay(),/AGREEMENT_REQUIRED/);assert.equal(stripeCalls,0);
    signed=true;orderAmount=1;await assert.rejects(pay(),/ORDER_MISMATCH/);assert.equal(stripeCalls,0);orderAmount=39500;
    await assert.rejects(pay(),(e:{message?:string})=>e.message==='Synthetic save failure');
    assert.equal(await pay(),'https://checkout.stripe.com/test');assert.deepEqual(requests[0],requests[1],'save retries use identical parameters and idempotency keys');
    assert.equal(await pay(),'https://checkout.stripe.com/test');assert.equal(creates,2,'existing session was retrieved, not recreated');
    sessionStatus='expired';await assert.rejects(pay(),/PAYMENT_SESSION_ENDED/);assert.equal(creates,2,'expired checkout must not create a duplicate charge');
  }finally{globalThis.fetch=original;for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
});
