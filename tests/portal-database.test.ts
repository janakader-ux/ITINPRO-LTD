import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',staff='33333333-3333-4333-8333-333333333333';
const ca='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',cb='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',da='aaaaaaaa-1111-4111-8111-111111111111',ds='aaaaaaaa-2222-4222-8222-222222222222';
test('real Postgres portal policies isolate clients, require staff MFA and deny direct writes',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth,storage to authenticated,anon,service_role;
      grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;grant select on storage.objects to authenticated,anon;grant all on storage.objects to service_role;
      create table public.payment_orders(id uuid primary key,status text,amount bigint,currency text);
      grant all on payment_orders to service_role;`);
    await db.exec(await readFile(new URL('../supabase-portal.sql',import.meta.url),'utf8'));
    await db.exec(`insert into auth.users values('${a}'),('${b}'),('${staff}');
      insert into portal_accounts(user_id,email,role) values('${a}','a@example.com','client'),('${b}','b@example.com','client'),('${staff}','staff@example.com','staff');
      insert into payment_orders values('${a}','paid',42500,'gbp'),('${b}','paid',42500,'gbp');
      insert into portal_cases(id,owner_id,payment_order_id,legal_name,address,route_id,price_category,fee,tax_year,checklist_version) values
      ('${ca}','${a}','${a}','TEST A','Synthetic address','llc-dividend','llc',42500,2026,'test'),('${cb}','${b}','${b}','TEST B','Synthetic address','llc-dividend','llc',42500,2026,'test');
      insert into portal_documents(id,case_id,uploaded_by,item_id,name,path,mime,byte_size,sha256,kind,visibility) values
      ('${da}','${ca}','${a}','passport-spread','dummy.pdf','${ca}/upload/dummy.pdf','application/pdf',12,repeat('a',64),'upload','client'),
      ('${ds}','${ca}','${staff}','draft-w7','internal.pdf','${ca}/draft/internal.pdf','application/pdf',12,repeat('b',64),'draft','staff');
      insert into storage.objects(bucket_id,name) values('itinpro-case-files-sandbox','${ca}/upload/dummy.pdf'),('itinpro-case-files-sandbox','${ca}/draft/internal.pdf');`);
    async function identity(id:string,aal='aal1'){await db.exec(`reset role;set request.jwt.claim.sub='${id}';set request.jwt.claims='{"aal":"${aal}","user_metadata":{"role":"staff"}}';set role authenticated;`);}
    await identity(a,'aal2');
    assert.equal((await db.query('select * from portal_cases')).rows.length,1);
    assert.equal((await db.query('select * from portal_cases where id=$1',[cb])).rows.length,0);
    assert.equal((await db.query('select * from portal_documents')).rows.length,1);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await assert.rejects(db.exec("update portal_accounts set role='staff'"),/permission denied/);
    await assert.rejects(db.exec('update portal_cases set fee=1'),/permission denied/);
    await assert.rejects(db.exec(`select public.portal_accept_agreement('${ca}','${a}',repeat('a',64),'TEST',true)`),/permission denied/);
    await identity(b);assert.equal((await db.query('select * from portal_cases')).rows.length,1);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await identity(staff);assert.equal((await db.query('select * from portal_cases')).rows.length,0);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await identity(staff,'aal2');assert.equal((await db.query('select * from portal_cases')).rows.length,2);assert.equal((await db.query('select * from portal_documents')).rows.length,2);assert.equal((await db.query('select * from storage.objects')).rows.length,2);
    await db.exec(`reset role;update portal_accounts set active=false where user_id='${a}';`);await identity(a);assert.equal((await db.query('select * from portal_cases')).rows.length,0);
    await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from portal_cases'),/permission denied/);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  }finally{await db.close();}
});
test('agreement and draft RPCs reject wrong actors, stale versions and duplicate decisions atomically',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
      create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
      create table payment_orders(id uuid primary key,status text,amount bigint,currency text);`);
    await db.exec(await readFile(new URL('../supabase-portal.sql',import.meta.url),'utf8'));
    await db.exec(`insert into auth.users values('${a}'),('${b}'),('${staff}');insert into portal_accounts(user_id,email,role) values('${a}','a@example.com','client'),('${b}','b@example.com','client'),('${staff}','staff@example.com','staff');
      insert into payment_orders values('${a}','paid',42500,'gbp');insert into portal_cases(id,owner_id,payment_order_id,legal_name,address,route_id,price_category,fee,tax_year,checklist_version) values('${ca}','${a}','${a}','TEST','Dummy address','llc-dividend','llc',42500,2026,'test');
      insert into portal_agreements(case_id,version,snapshot,sha256) values('${ca}','test','{}',repeat('a',64));`);
    const accept=(actor=a,hash='a'.repeat(64),early=false)=>db.query<{result:string}>('select portal_accept_agreement($1,$2,$3,$4,$5) as result',[ca,actor,hash,'TEST APPLICANT',early]);
    await assert.rejects(accept(b),/CASE_ACCESS_DENIED/);await assert.rejects(accept(a,'b'.repeat(64)),/AGREEMENT_VERSION_MISMATCH/);
    assert.equal((await accept()).rows[0].result,'accepted');assert.equal((await accept(a,'a'.repeat(64),true)).rows[0].result,'already_accepted');
    const agreement=(await db.query<{start_early:boolean;waiting:boolean}>("select start_early,work_may_start_at>now()+interval '13 days' as waiting from portal_agreements")).rows[0];assert(!agreement.start_early);assert(agreement.waiting);
    await db.exec(`insert into portal_documents(id,case_id,uploaded_by,item_id,name,path,mime,byte_size,sha256,kind,visibility) values('${da}','${ca}','${staff}','draft-w7','dummy.pdf','dummy.pdf','application/pdf',12,repeat('b',64),'draft','staff');`);
    await assert.rejects(db.query('select portal_release_draft($1,$2,$3)',[ca,staff,da]),/WORK_START_NOT_AUTHORISED/);
    await db.exec("update portal_agreements set work_may_start_at=now()-interval '1 minute'");
    await db.query('select portal_release_draft($1,$2,$3)',[ca,staff,da]);
    const decide=(actor=a,hash='b'.repeat(64))=>db.query<{result:string}>('select portal_decide_draft($1,$2,$3,$4,$5,$6) as result',[ca,actor,da,hash,'approved','']);
    await assert.rejects(decide(b),/CASE_ACCESS_DENIED/);await assert.rejects(decide(a,'a'.repeat(64)),/DRAFT_VERSION_MISMATCH/);
    assert.equal((await decide()).rows[0].result,'recorded');assert.equal((await decide()).rows[0].result,'already_recorded');
    assert.equal((await db.query<{status:string}>('select status from portal_cases')).rows[0].status,'draft_approved');assert.equal((await db.query('select * from portal_approvals')).rows.length,1);
    await assert.rejects(db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'submitted',{reference:'TEST'}]),/VERIFICATION_OR_INFORMATION_REQUIRED/);
    await assert.rejects(db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'verification',{verifier:'TEST CAA'}]),/ORIGINAL_CHECKS_REQUIRED/);
    await db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'verification',{verifier:'TEST CAA',originalDocumentHeld:true,interviewConducted:true,originalW7Signature:true}]);
    await db.exec(`insert into portal_requests(case_id,item_id,message,created_by) values('${ca}','passport-spread','TEST missing information','${staff}')`);
    await assert.rejects(db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'submitted',{reference:'TEST'}]),/VERIFICATION_OR_INFORMATION_REQUIRED/);
    await db.exec('update portal_requests set resolved=true');
    await db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'submitted',{reference:'TEST DISPATCH'}]);
    await db.query('select portal_record_stage($1,$2,$3,$4)',[ca,staff,'complete',{}]);
    assert.equal((await db.query<{status:string}>('select status from portal_cases')).rows[0].status,'complete');
    assert.equal((await db.query<{result:boolean}>("select portal_claim_login(repeat('a',64)) as result")).rows[0].result,true);assert.equal((await db.query<{result:boolean}>("select portal_claim_login(repeat('a',64)) as result")).rows[0].result,false);
  }finally{await db.close();}
});
