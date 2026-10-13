import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { eligibilityIntakeSchema,eligibilityQuestions,normalizeEligibilityIntake,selfServiceReady } from '../lib/eligibility-intake';
import { clientNextAction } from '../lib/portal/workflow';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',staff='33333333-3333-4333-8333-333333333333',enquiry='44444444-4444-4444-8444-444444444444',caseId='55555555-5555-4555-8555-555555555555';
test('short eligibility supports help choosing, screens SSN eligibility and excludes detailed identifiers',()=>{
  const raw={flowVersion:'eligibility-v2',service:'itin',firstName:'TEST',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',applicationRoute:'not-sure',preference:'online',readiness:'yes',consent:'yes',testOnly:true,
    basic:{residenceCountry:'United Kingdom',citizenshipCountry:'United Kingdom',ssnEligibility:'Not sure',previousItinApplication:'No',passportReady:'Yes',returnReady:'Not sure',contactMethod:'Email',passportNumber:'DO_NOT_STORE'}};
  const parsed=eligibilityIntakeSchema.parse(raw),saved=normalizeEligibilityIntake(parsed);
  assert.equal(eligibilityQuestions.filter(x=>x.required).length,7);assert.equal(saved.intake.testOnly,true);assert.match(saved.reason,/Help me choose/);
  assert(!saved.message.includes('DO_NOT_STORE'));assert(!JSON.stringify(saved.intake).includes('DO_NOT_STORE'));
  assert.equal(eligibilityIntakeSchema.safeParse({...raw,email:'real@company.com'}).success,false);
  assert.equal(eligibilityIntakeSchema.safeParse({...raw,basic:{...raw.basic,ssnEligibility:''}}).success,false);
  assert.equal(clientNextAction('awaiting_agreement',false,false).tab,'engagement');
  assert.equal(clientNextAction('awaiting_payment',true,false).tab,'payment');
  assert.equal(clientNextAction('collecting',true,true).tab,'information');
});
test('Postgres enforces engagement before payment, intake before payment, retries, revisions and legacy compatibility',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth,storage to authenticated,anon,service_role;grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;
      create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;`);
    for(const f of ['supabase.sql','supabase-payments.sql','supabase-portal.sql','supabase/migrations/20261013164052_engagement_first_workflow.sql','supabase/migrations/20261013191500_selfservice_and_invoice_workflow.sql','supabase/migrations/20261013204000_payment_last_workflow.sql'])await db.exec(await readFile(new URL(`../${f}`,import.meta.url),'utf8'));
    await db.exec(`insert into auth.users values('${owner}'),('${other}'),('${staff}');insert into portal_accounts(user_id,email,role) values('${owner}','owner@example.com','client'),('${other}','other@example.com','client'),('${staff}','staff@example.com','staff');`);
    const intake={flowVersion:'eligibility-v2',service:'itin',testOnly:true};
    await db.query("insert into enquiries(id,name,email,reason,location,message,consented_at,intake) values($1,'TEST APPLICANT','test@example.com','Synthetic spouse enquiry','UK','AUTOMATED TEST ONLY',now(),$2)",[enquiry,intake]);
    const screening={ssnIneligible:true,federalTaxPurpose:true,evidenceRoute:'tax-return',evidenceNotes:'Synthetic completed tax return reviewed',originalsExplained:true,feesExplained:true};
    const c={id:caseId,owner_id:owner,enquiry_id:enquiry,legal_name:'TEST APPLICANT',address:'Synthetic UK address',route_id:'spouse',price_category:'spouse',fee:39500,tax_year:2026,checklist_version:'test',screening};
    const agreement={version:'test',paragraphs:['Synthetic agreement'],tables:[]},hash='a'.repeat(64);
    const create=(actor=staff,changes={})=>db.query<{id:string}>('select portal_create_engagement_case($1,$2,$3,$4) as id',[{...c,...changes},agreement,hash,actor]);
    await assert.rejects(create(owner),/STAFF_REQUIRED/);
    await assert.rejects(create(staff,{screening:{...screening,ssnIneligible:false}}),/SCREENING_REQUIRED/);
    assert.equal((await db.query('select * from payment_orders')).rows.length,0,'rejected review must not leave an order');
    assert.equal((await create()).rows[0].id,caseId);assert.equal((await create()).rows[0].id,caseId,'retry reuses the case and agreement');
    assert.equal((await db.query('select * from portal_agreements')).rows.length,1);
    await assert.rejects(create(staff,{fee:45000}),/ENQUIRY_ALREADY_REVIEWED/);
    const order=(await db.query<{id:string}>('select id from payment_orders')).rows[0].id;
    await db.query('update payment_orders set stripe_invoice_id=$1 where id=$2',['in_test_workflow',order]);
    const paid=()=>db.query('select apply_payment_event($1,$2,$3,39500,$4,$5,$6)',['evt_workflow_paid',order,'in_test_workflow','gbp','invoice','paid']);
    await assert.rejects(paid(),/AGREEMENT_REQUIRED/);assert.equal((await db.query('select * from payment_events')).rows.length,0,'failed event is not consumed');
    const accept=(actor=owner,h=hash)=>db.query('select portal_accept_agreement($1,$2,$3,$4,true)',[caseId,actor,h,'TEST APPLICANT']);
    await assert.rejects(accept(other),/CASE_ACCESS_DENIED/);await assert.rejects(accept(owner,'b'.repeat(64)),/AGREEMENT_VERSION_MISMATCH/);
    await accept();await accept();
    assert.equal((await db.query<{status:string}>('select status from portal_cases')).rows[0].status,'collecting');
    const save=(actor=owner,rev=0)=>db.query<{revision:number}>('select portal_save_answers($1,$2,$3,$4) as revision',[caseId,actor,{firstName:'TEST'},rev]);
    assert.equal((await save()).rows[0].revision,1,'signed unpaid client can save partial intake');
    await assert.rejects(paid(),/INTAKE_REQUIRED/);
    await assert.rejects(db.query('select portal_prepare_payment($1,$2,$3)',[caseId,other,[]]),/CASE_ACCESS_DENIED/);
    await db.query('select portal_prepare_payment($1,$2,$3)',[caseId,owner,['passport-spread','foreign-address']]);
    await db.query('select portal_prepare_payment($1,$2,$3)',[caseId,owner,['passport-spread','foreign-address']]);
    await db.query("update payment_orders set created_at=now()-interval '3 days' where id=$1",[order]);
    await db.query('update payment_orders set stripe_invoice_id=null where id=$1',[order]);
    const started=(await db.query<{started:string}>('select portal_claim_invoice_start($1) as started',[order])).rows[0].started;
    assert(Date.now()-Date.parse(started)<60000,'first invoice attempt can start days after enquiry');
    assert.equal(String((await db.query<{started:string}>('select portal_claim_invoice_start($1) as started',[order])).rows[0].started),String(started),'invoice retries share their original attempt time');
    await db.query('update payment_orders set stripe_invoice_id=$1 where id=$2',['in_test_workflow',order]);
    await paid();await paid();
    assert.equal((await db.query<{status:string}>('select status from portal_cases')).rows[0].status,'review');
    assert.equal((await db.query('select * from portal_notifications')).rows.length,1,'one durable review notification despite retries');
    assert.equal((await save(owner,1)).rows[0].revision,2,'partial draft does not require foreign address yet');
    await assert.rejects(save(other,2),/CASE_ACCESS_DENIED/);await assert.rejects(save(owner,0),/ANSWERS_VERSION_MISMATCH/);
    assert.equal((await save(owner,2)).rows[0].revision,3);
    await db.query("select apply_payment_event($1,$2,$3,39500,'gbp','invoice','failed')",['evt_late_fail',order,'in_test_workflow']);
    assert.equal((await db.query<{status:string}>('select status from payment_orders')).rows[0].status,'paid');
    await db.exec(`set request.jwt.claim.sub='${other}';set request.jwt.claims='{"aal":"aal1"}';set role authenticated;`);
    assert.equal((await db.query('select * from portal_cases')).rows.length,0);
    await assert.rejects(db.query('select portal_save_answers($1,$2,$3,$4)',[caseId,owner,{},2]),/permission denied/);
    await db.exec(`reset role;set request.jwt.claim.sub='${staff}';set request.jwt.claims='{"aal":"aal1"}';set role authenticated;`);
    assert.equal((await db.query('select * from portal_cases')).rows.length,0);
    await db.exec(`reset role;set request.jwt.claims='{"aal":"aal2"}';set role authenticated;`);
    assert.equal((await db.query('select * from portal_cases')).rows.length,1);
    await db.exec('reset role;');
    const autoEnquiry='66666666-6666-4666-8666-666666666666',autoCase='77777777-7777-4777-8777-777777777777';
    const autoIntake={...intake,applicationRoute:'spouse',preference:'online',readiness:'yes',basic:{ssnEligibility:'No',previousItinApplication:'No',passportReady:'Yes',returnReady:'Yes'},onboarding:{address:c.address,taxYear:c.tax_year,documentsReady:true,taxPurposeUnderstood:true,originalsUnderstood:true}};
    await db.query("insert into enquiries(id,name,email,reason,location,message,consented_at,intake) values($1,'TEST AUTO','auto@example.com','Synthetic automatic enquiry','UK','AUTOMATED TEST ONLY',now(),$2)",[autoEnquiry,autoIntake]);
    const autoCreate=()=>db.query('select portal_create_engagement_case($1,$2,$3,null)',[{...c,id:autoCase,enquiry_id:autoEnquiry,screening:{...screening,mode:'self-service'}},agreement,hash]);
    for(const field of ['documentsReady','taxPurposeUnderstood','originalsUnderstood']){
      await db.query('update enquiries set intake=$1 where id=$2',[{...autoIntake,onboarding:{...autoIntake.onboarding,[field]:false}},autoEnquiry]);
      await assert.rejects(autoCreate(),/SCREENING_REQUIRED/);
    }
    await db.query('update enquiries set intake=$1 where id=$2',[autoIntake,autoEnquiry]);await autoCreate();await autoCreate();
    assert.equal((await db.query('select * from portal_cases where id=$1',[autoCase])).rows.length,1);
    assert.equal((await db.query<{actor_id:string|null}>('select actor_id from portal_audit where case_id=$1',[autoCase])).rows[0].actor_id,null);
    // Existing paid-first cases retain the old signing requirement after this migration.
    await db.exec(`insert into payment_orders(id,kind,service_category,amount,status) values('${other}','checkout','spouse',39500,'pending');
      insert into portal_cases(id,owner_id,payment_order_id,legal_name,address,route_id,price_category,fee,tax_year,checklist_version) values('${other}','${other}','${other}','TEST LEGACY','Synthetic address','spouse','spouse',39500,2026,'test');
      insert into portal_agreements(case_id,version,snapshot,sha256) values('${other}','test','{}',repeat('b',64));`);
    await assert.rejects(db.query('select portal_accept_agreement($1,$2,$3,$4,true)',[other,other,'b'.repeat(64),'TEST LEGACY']),/PAYMENT_REQUIRED/);
  }finally{await db.close();}
});

test('ready onboarding requires a supported fixed fee, consistent screening and complete declarations',()=>{
  const intake={flowVersion:'eligibility-v2',service:'itin',applicationRoute:'prepared-1040nr',preference:'online',readiness:'yes',testOnly:true,basic:{ssnEligibility:'No',previousItinApplication:'No',passportReady:'Yes',returnReady:'Yes'},onboarding:{address:'Synthetic address',taxYear:2026,documentsReady:true,taxPurposeUnderstood:true,originalsUnderstood:true}} as Parameters<typeof selfServiceReady>[0];
  assert.equal(selfServiceReady(intake),true);
  for(const change of [{applicationRoute:'not-sure'},{applicationRoute:'dependent'},{preference:'contact' as const},{readiness:'no' as const},{onboarding:undefined},{basic:{...intake.basic,ssnEligibility:'Not sure'}},{basic:{...intake.basic,previousItinApplication:'Yes'}}])assert.equal(selfServiceReady({...intake,...change}),false);
});
