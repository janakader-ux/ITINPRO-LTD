import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { POST } from '../app/api/stripe/webhook/route';

test('webhook verifies raw-body signatures and returns a retry response for database failures',async()=>{
  const keys=['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch; const originalError=console.error;console.error=()=>{};
  let calls=0;
  try {
    process.env.STRIPE_SECRET_KEY='rk_test_TEST_ONLY_NOT_A_REAL_KEY';process.env.STRIPE_WEBHOOK_SECRET='whsec_test_only';
    process.env.SUPABASE_URL='https://test-only.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY';
    globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({code:'PGRST202',message:'Test missing migration'}),{status:404,headers:{'Content-Type':'application/json'}});};
    const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
    const event={id:'evt_test',object:'event',type:'checkout.session.completed',livemode:false,
      data:{object:{id:'cs_test_example',object:'checkout.session',metadata:{app:'itinpro',order_id:'11111111-1111-4111-8111-111111111111'},
        payment_status:'paid',amount_total:39500,currency:'gbp'}}};
    const payload=JSON.stringify(event);
    const request=(body:string,signature:string)=>new Request('https://itinpro-uk.onrender.com/api/stripe/webhook',{method:'POST',body,headers:{'stripe-signature':signature}});
    const signed=stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
    assert.equal((await POST(request(payload,'bad-signature'))).status,400);assert.equal(calls,0);
    assert.equal((await POST(request(payload+' ',signed))).status,400);assert.equal(calls,0);
    assert.equal((await POST(request(payload,signed))).status,503);assert.equal(calls,1);
    const unpaid=JSON.stringify({...event,data:{object:{...event.data.object,payment_status:'unpaid'}}});
    const unpaidSigned=stripe.webhooks.generateTestHeaderString({payload:unpaid,secret:process.env.STRIPE_WEBHOOK_SECRET});
    assert.equal((await POST(request(unpaid,unpaidSigned))).status,200);assert.equal(calls,1);
  } finally {
    globalThis.fetch=originalFetch;console.error=originalError;
    for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
  }
});
