import test from 'node:test';
import { itinBasics } from './fixtures/basic-intake';
import assert from 'node:assert/strict';
import { POST } from '../app/api/enquiries/route';

test('enquiry route validates inputs, distinguishes malformed config and does not reject a saved enquiry on email failure', async () => {
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','PAYMENTS_ENABLED','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PAYMENT_TOKEN_SECRET'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const originalFetch=globalThis.fetch; const originalError=console.error;const originalInfo=console.info;
  const logs:string[]=[]; console.error=(...args)=>logs.push(args.join(' ')); console.info=()=>{};
  let fetches=0;let savedReason='';let savedMessage='';
  const payload={name:'AUTOMATED TEST ONLY',email:'test@example.com',reason:'browser tampered price £1',serviceCategory:'spouse',
    location:'Bedford, UK (synthetic test)',appointment:'Not sure',message:'AUTOMATED TEST ONLY. Do not follow up.',consent:'yes',website:'',amount:100};
  const request=(body:unknown)=>new Request('https://itinpro-uk.onrender.com/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    process.env.SUPABASE_URL='https://test-only.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY_SERVICE_KEY';
    process.env.RESEND_API_KEY='TEST_ONLY_RESEND_KEY';process.env.PAYMENTS_ENABLED='false';
    globalThis.fetch=async(input,options)=>{
      fetches++;const url=String(input);
      if(url.includes('/rest/v1/enquiries')) {
        savedReason=JSON.parse(String(options?.body)).reason;savedMessage=JSON.parse(String(options?.body)).message;
        return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111'}),{status:201,headers:{'Content-Type':'application/json'}});
      }
      if(url.startsWith('https://api.resend.com/')){const email=JSON.parse(String(options?.body));assert.match(email.html,/<strong>Client name<\/strong>/);assert.match(email.text,/Client name\n/);return new Response(JSON.stringify({name:'validation_error',message:'API key is invalid'}),{status:400,headers:{'Content-Type':'application/json'}});}
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
    assert.ok(logs.some(x=>x.includes('INVALID_EMAIL_API_KEY')));
    assert.ok(savedReason.includes('£395'));assert.ok(!savedReason.includes('£1'));
    process.env.PAYMENTS_ENABLED='true';process.env.STRIPE_SECRET_KEY='sk_test_SYNTHETIC';process.env.STRIPE_WEBHOOK_SECRET='whsec_SYNTHETIC';process.env.PAYMENT_TOKEN_SECRET='SYNTHETIC_SECRET';
    const simple=await POST(request({flowVersion:'simple-v1',firstName:'Test',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',service:'itin',applicationRoute:'llc-bank-account',basic:itinBasics,preference:'online',readiness:'yes',consent:'yes'}));
    assert.equal(simple.status,201);assert.equal((await simple.json()).checkoutToken,undefined,'short intake must not offer payment before engagement');assert.match(savedReason,/£425/);assert.match(savedMessage,/Country where you currently live: United Kingdom/);
    const count=fetches;const missingBasics=await POST(request({flowVersion:'simple-v1',firstName:'Test',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',service:'ein',preference:'contact',basic:{},consent:'yes'}));assert.equal(missingBasics.status,400);assert.equal(fetches,count);
    const rejected=await POST(request({flowVersion:'unknown',...payload}));assert.equal(rejected.status,400,'new intake must not fall through to legacy checkout');
    assert.ok(!logs.join(' ').includes(payload.email));assert.ok(!logs.join(' ').includes('TEST_ONLY_SERVICE_KEY'));
  } finally {
    globalThis.fetch=originalFetch;console.error=originalError;console.info=originalInfo;
    for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}
  }
});


test('ready sandbox applications return their created case; contact and review routes do not',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','PORTAL_MODE','PORTAL_TEST_CLIENT_EMAIL'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const fetchBefore=globalThis.fetch,infoBefore=console.info,errorBefore=console.error;
  const enquiryId='11111111-1111-4111-8111-111111111111',caseId='22222222-2222-4222-8222-222222222222',userId='33333333-3333-4333-8333-333333333333';
  let saved:Record<string,any>={},creates=0;
  const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  const raw={flowVersion:'eligibility-v2',service:'itin',firstName:'TEST',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',applicationRoute:'prepared-1040nr',preference:'online',readiness:'yes',consent:'yes',testOnly:true,
    basic:{residenceCountry:'United Kingdom',citizenshipCountry:'United Kingdom',ssnEligibility:'No',previousItinApplication:'No',passportReady:'Yes',returnReady:'Yes',contactMethod:'Email'},
    onboarding:{address:'Synthetic address only',taxYear:2026,documentsReady:true,taxPurposeUnderstood:true,originalsUnderstood:true}};
  const send=(body:unknown)=>POST(new Request('https://itinpro.uk/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
  try{
    process.env.SUPABASE_URL='https://test-only.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY';
    process.env.PORTAL_MODE='sandbox';delete process.env.PORTAL_TEST_CLIENT_EMAIL;delete process.env.RESEND_API_KEY;
    console.info=()=>{};console.error=()=>{};
    globalThis.fetch=async(input,options)=>{
      const url=String(input),method=options?.method||'GET';
      if(url.includes('/rest/v1/enquiries')){if(method==='POST'){saved=JSON.parse(String(options?.body));return json({id:enquiryId},201);}return json({id:enquiryId,...saved});}
      if(url.includes('/auth/v1/admin/generate_link'))return json({id:userId,email:'test@example.com'});
      if(url.includes('/rest/v1/portal_accounts'))return method==='POST'?new Response(null,{status:201}):json({user_id:userId,email:'test@example.com',role:'client',active:true});
      if(url.includes('/rpc/portal_create_engagement_case')){creates++;return json(caseId);}
      if(url.includes('/rest/v1/portal_document_intake'))return json({instruction_version_id:enquiryId,revision:0});
      if(url.includes('/rest/v1/portal_instruction_versions'))return json({snapshot:{requirements:[]}});
      if(url.includes('/rest/v1/portal_notifications'))return new Response(null,{status:201});
      throw new Error('Unexpected test network call');
    };
    const ready=await send(raw),result=await ready.json();
    assert.equal(ready.status,201);assert.equal(result.journey,'self-service');assert.equal(result.caseId,caseId);assert.equal(creates,1);
    const question=await send({...raw,preference:'contact',readiness:'no',eligibilityCheck:true});
    const q=await question.json();assert.equal(q.journey,'assisted');assert.equal(q.caseId,undefined);assert.equal(creates,1);
    const review=await send({...raw,basic:{...raw.basic,ssnEligibility:'Not sure'}});
    const v=await review.json();assert.equal(v.journey,'assisted');assert.equal(v.caseId,undefined);assert.equal(creates,1);
  }finally{
    globalThis.fetch=fetchBefore;console.info=infoBefore;console.error=errorBefore;
    for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}
  }
});
