import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/checkout/route';
import { createCheckoutToken } from '../lib/payment-security';

test('checkout uses canonical prices and retries after a database-save failure without creating another session',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PAYMENT_TOKEN_SECRET','PAYMENTS_ENABLED'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const fetchBefore=globalThis.fetch;
  const errorBefore=console.error;console.error=()=>{};
  const enquiryId='11111111-1111-4111-8111-111111111111';const orderId='22222222-2222-4222-8222-222222222222';
  const order={id:orderId,enquiry_id:enquiryId,kind:'checkout',service_category:'spouse',amount:39500,status:'pending',stripe_checkout_session_id:null as string|null};
  const session={id:'cs_test_example',object:'checkout.session',status:'open',url:'https://checkout.stripe.com/c/pay/test-example',livemode:false};
  let saveFails=true;let createRequests=0;let creates=0;let originalParams='';let originalKey='';
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  try {
    process.env.SUPABASE_URL='https://test-only.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY';
    process.env.STRIPE_SECRET_KEY='rk_test_TEST_ONLY';process.env.STRIPE_WEBHOOK_SECRET='whsec_TEST_ONLY';
    process.env.PAYMENT_TOKEN_SECRET='TEST_ONLY_SIGNING_SECRET';process.env.PAYMENTS_ENABLED='true';
    globalThis.fetch=async(input,options)=>{
      const url=String(input);const method=options?.method || 'GET';
      if(url.includes('/rest/v1/enquiries'))return json({id:enquiryId,email:'test@example.com'});
      if(url.includes('/rest/v1/payment_orders')){
        if(method==='GET')return json(order);
        if(method==='POST')return new Response(null,{status:201});
        if(method==='PATCH'){
          if(saveFails){saveFails=false;return json({code:'TEST_DB_FAILURE',message:'Simulated write failure'},400);}
          order.stripe_checkout_session_id=session.id;return new Response(null,{status:204});
        }
      }
      if(url.includes('/v1/prices/'))return json({id:'price_1UPQJ0050EnIRMqj4aodcTOK',object:'price',active:true,currency:'gbp',unit_amount:39500,livemode:false});
      if(url.includes('/v1/checkout/sessions')&&method==='POST'){
        createRequests++;const params=String(options?.body);const headers=new Headers(options?.headers);const key=headers.get('idempotency-key') || '';
        const form=new URLSearchParams(params);
        assert.equal(form.get('line_items[0][price]'),'price_1UPQJ0050EnIRMqj4aodcTOK');
        assert.equal(form.get('adaptive_pricing[enabled]'),'false','quoted fees must stay in GBP');
        assert.equal(form.has('payment_method_types[0]'),false);
        if(!creates){creates++;originalParams=params;originalKey=key;}
        else {assert.equal(params,originalParams);assert.equal(key,originalKey);}
        return json(session);
      }
      if(url.includes('/v1/checkout/sessions/cs_test_example'))return json(session);
      throw new Error('Unexpected test network call');
    };
    const token=createCheckoutToken(enquiryId,'spouse',process.env.PAYMENT_TOKEN_SECRET);
    const request=()=>new Request('https://itinpro-uk.onrender.com/api/checkout',{method:'POST',body:JSON.stringify({token,amount:1}),headers:{'Content-Type':'application/json'}});
    assert.equal((await POST(request())).status,503,'save failure must not return a checkout URL');
    assert.equal((await POST(request())).status,200);
    assert.equal((await POST(request())).status,200,'existing open session is reused');
    assert.equal(createRequests,2);assert.equal(creates,1);
  } finally {
    globalThis.fetch=fetchBefore;console.error=errorBefore;
    for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
  }
});
