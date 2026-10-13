import { authenticatorQrSource } from '../lib/portal/mfa-image';
import { parsePortalLinkFragment,portalTokenHashPattern } from '../lib/portal/login-link';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as casesGet,POST as casesPost } from '../app/api/portal/cases/route';
import { POST as authPost } from '../app/api/portal/auth/route';
import { sameOrigin,portalOrigin } from '../lib/portal/validation';
import { sendPortalLink } from '../lib/portal/server';
test('disabled portal and cross-origin writes cannot reach authentication, email, database or Stripe',async()=>{
  const before=process.env.PORTAL_MODE;const fetch=globalThis.fetch;let calls=0;
  try{delete process.env.PORTAL_MODE;globalThis.fetch=async()=>{calls++;throw new Error('No network expected');};
    assert.equal((await casesGet(new Request('https://itinpro.uk/api/portal/cases'))).status,503);
    assert.equal((await authPost(new Request('https://itinpro.uk/api/portal/auth',{method:'POST',body:'{}'}))).status,503);
    assert.equal((await casesPost(new Request('https://itinpro.uk/api/portal/cases',{method:'POST',headers:{origin:'https://attacker.example'},body:'{}'}))).status,403);
    assert.equal(calls,0);
  }finally{globalThis.fetch=fetch;if(before===undefined)delete process.env.PORTAL_MODE;else process.env.PORTAL_MODE=before;}
});
test('sign-in links are sent only to existing accounts or the configured first staff member, with safe URL fragments',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','PORTAL_STAFF_EMAIL','PAYMENT_TOKEN_SECRET','APP_URL'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const fetch=globalThis.fetch;const info=console.info;
  let generated=0,sent=0;const hash='b'.repeat(56);let mail='';const logs:string[]=[];
  try{Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'TEST_ONLY',RESEND_API_KEY:'TEST_ONLY',PORTAL_STAFF_EMAIL:'staff@example.com',PAYMENT_TOKEN_SECRET:'TEST_ONLY_SECRET',APP_URL:'https://itinpro.uk'});
    console.info=(...a)=>logs.push(a.join(' '));
    globalThis.fetch=async(input,options)=>{const url=String(input);const headers={'Content-Type':'application/json'};
      if(url.includes('/rest/v1/portal_accounts'))return new Response(options?.method==='POST'?'': 'null',{status:options?.method==='POST'?201:200,headers});
      if(url.includes('/rest/v1/rpc/portal_claim_login'))return new Response('true',{headers});
      if(url.includes('/auth/v1/admin/generate_link')){generated++;return new Response(JSON.stringify({id:'11111111-1111-4111-8111-111111111111',email:'staff@example.com',hashed_token:hash,verification_type:'signup',action_link:'https://test.supabase.co/auth/verify?token=PRIVATE'}),{headers});}
      if(url.includes('api.resend.com')){sent++;mail=String(options?.body);return new Response(JSON.stringify({id:'test_email_accepted'}),{headers});}
      throw new Error('Unexpected network call');
    };
    await sendPortalLink('unknown@example.com',true);assert.equal(generated,0);assert.equal(sent,0);
    await sendPortalLink('staff@example.com',true);assert.equal(generated,1);assert.equal(sent,1);
    assert.match(mail,/#token_hash=/);assert.match(mail,/type=signup/);assert(!mail.includes('/confirm?'));assert(!logs.join(' ').includes(hash));assert(!logs.join(' ').includes('staff@example.com'));
  }finally{globalThis.fetch=fetch;console.info=info;for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
});

test('Render proxy accepts only the configured public portal origin and email links use that host',()=>{
  const keys=['NODE_ENV','RENDER_EXTERNAL_URL','APP_URL'];
  const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try{
    Object.assign(process.env,{NODE_ENV:'production',RENDER_EXTERNAL_URL:'https://itinpro-uk.onrender.com',APP_URL:'https://itinpro.uk'});
    assert(!sameOrigin(new Request('http://localhost:10000/api/portal/auth',{headers:{origin:'https://itinpro-uk.onrender.com'}})));
    assert(!sameOrigin(new Request('http://localhost:10000/api/portal/auth',{headers:{origin:'https://attacker.example','x-forwarded-host':'attacker.example','x-forwarded-proto':'https'}})));
    assert(sameOrigin(new Request('http://localhost:10000/api/portal/auth',{headers:{origin:'https://itinpro.uk'}})));
    assert(!sameOrigin(new Request('http://localhost:10000/api/portal/auth')));
    assert.equal(portalOrigin(),'https://itinpro.uk');
    delete process.env.APP_URL;assert.equal(portalOrigin(),'https://itinpro-uk.onrender.com');
  }finally{for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
});

test('confirmation parses actual Supabase SHA-224 links and refuses missing or malformed credentials',()=>{
  for(const length of [56,64]){
    const hash='a'.repeat(length);
    assert.deepEqual(parsePortalLinkFragment(`#token_hash=${hash}&type=signup`),{tokenHash:hash,tokenType:'signup'});
    assert(portalTokenHashPattern.test(hash));
  }
  for(const hash of ['a'.repeat(55),'a'.repeat(57),'g'.repeat(56),'']){
    assert.equal(parsePortalLinkFragment(`#token_hash=${hash}&type=signup`),null);
    assert(!portalTokenHashPattern.test(hash));
  }
  assert.equal(parsePortalLinkFragment(''),null);
  assert.equal(parsePortalLinkFragment(`#token_hash=${'a'.repeat(56)}&type=recovery`),null);
});

test('authenticator QR images preserve Supabase data URLs instead of encoding them twice',()=>{
  const svg='<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
  const url=`data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`;
  assert.equal(authenticatorQrSource(url),url);
  assert.equal(decodeURIComponent(authenticatorQrSource(svg).split(',')[1]),svg);
  assert.equal(authenticatorQrSource('https://attacker.example/qr.svg'),'');
  assert.equal(authenticatorQrSource('data:text/html,<script/>'),'');
});
