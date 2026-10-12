import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/enquiries/route';

test('enquiry route validates inputs, distinguishes malformed config and does not reject a saved enquiry on email failure', async () => {
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','PAYMENTS_ENABLED'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch; const originalError=console.error;const originalInfo=console.info;
  const logs:string[]=[]; console.error=(...args)=>logs.push(args.join(' ')); console.info=()=>{};
  let fetches=0;let savedReason='';
  const payload={name:'AUTOMATED TEST ONLY',email:'test@example.com',reason:'browser tampered price £1',serviceCategory:'spouse',
    location:'Bedford, UK (synthetic test)',appointment:'Not sure',message:'AUTOMATED TEST ONLY. Do not follow up.',consent:'yes',website:'',amount:100};
  const request=(body:unknown)=>new Request('https://itinpro-uk.onrender.com/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    process.env.SUPABASE_URL='https://test-only.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY_SERVICE_KEY';
    process.env.RESEND_API_KEY='TEST_ONLY_RESEND_KEY';process.env.PAYMENTS_ENABLED='false';
    globalThis.fetch=async(input,options)=>{
      fetches++;const url=String(input);
      if(url.includes('/rest/v1/enquiries')) {
        savedReason=JSON.parse(String(options?.body)).reason;
        return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111'}),{status:201,headers:{'Content-Type':'application/json'}});
      }
      if(url.startsWith('https://api.resend.com/'))return new Response(JSON.stringify({name:'validation_error',message:'Test provider rejection'}),{status:422,headers:{'Content-Type':'application/json'}});
      throw new Error('Unexpected network call in test');
    };
    const invalid=await POST(request({...payload,serviceCategory:'unknown'}));assert.equal(invalid.status,400);assert.equal(fetches,0);
    const llc=await POST(request({...payload,serviceCategory:'llc-bank-account'}));assert.equal(llc.status,400);assert.equal(fetches,0);
    process.env.SUPABASE_URL='not-a-project-url';
    const malformed=await POST(request(payload));assert.equal(malformed.status,503);
    assert.ok(logs.some(x=>x.includes('INVALID_SUPABASE_URL')));assert.equal(fetches,0);
    process.env.SUPABASE_URL='https://test-only.supabase.co';
    const accepted=await POST(request(payload));assert.equal(accepted.status,201);
    const result=await accepted.json();assert.equal(result.notification,'pending');assert.ok(result.enquiryId);
    assert.ok(savedReason.includes('£395'));assert.ok(!savedReason.includes('£1'));
    assert.ok(!logs.join(' ').includes(payload.email));assert.ok(!logs.join(' ').includes('TEST_ONLY_SERVICE_KEY'));
  } finally {
    globalThis.fetch=originalFetch;console.error=originalError;console.info=originalInfo;
    for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
  }
});
