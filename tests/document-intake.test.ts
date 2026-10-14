import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { firptaInput,firptaRequirements,firptaPath,firptaTiming,type FirptaSelection } from '../lib/portal/firpta';
import { makeInstructionSnapshot,submissionDocumentBlockers } from '../lib/portal/instructions';
import { documentHash } from '../lib/portal/validation';
const now=new Date('2026-10-14T12:00:00Z');
const selection:FirptaSelection={service:'itin-only',role:'seller',completed:true,transactionYear:2026,purpose:'reporting'};
test('FIRPTA answers enforce branch evidence and distinguish purchasers from ordinary property buying',()=>{
  assert.deepEqual(firptaRequirements(selection,now).filter(r=>!r.conditional).map(r=>r.id),['firpta-contract','firpta-8288','firpta-8288a']);
  const certificate={...selection,completed:false,purpose:'certificate' as const};
  assert(firptaInput.safeParse(certificate).success);
  assert.deepEqual(firptaRequirements(certificate,now).map(r=>r.id),['firpta-contract','firpta-8288b']);
  assert(!firptaInput.safeParse({...selection,completed:false}).success);
  const purchaser={...selection,role:'buyer' as const,foreignSeller:'yes' as const};
  assert.equal(firptaPath(purchaser,now),'buyer-reporting');
  assert.equal(firptaPath({...purchaser,foreignSeller:'no'},now),'review-required');
  assert(!firptaInput.safeParse({...purchaser,service:'itin-and-return'}).success);
});
test('a 2026 annual refund return is deferred to 2027; past-year refund evidence is mandatory',()=>{
  const refund={...selection,service:'itin-and-return' as const,purpose:'refund' as const,returnPreparation:'request-quote' as const};
  assert.match(firptaTiming(refund,now),/2027/);
  assert.equal(firptaPath(refund,now),'completed-sale');
  assert(!firptaRequirements(refund,now).some(r=>r.id==='firpta-signed-return'));
  const ready={...refund,transactionYear:2025};
  assert.equal(firptaPath(ready,now),'refund-return');
  for(const id of ['firpta-remittance','firpta-basis','firpta-signed-return'])assert(firptaRequirements(ready,now).some(r=>r.id===id&&r.level==='mandatory'));
  assert.match(makeInstructionSnapshot('firpta','D3',refund,'payment-last',new Date('2027-02-01')).text,/Final signed Form 1040-NR/);
});
test('submission requires reviewed evidence, checked originals and staff decisions on conditions',()=>{
  const requirements=[{id:'letter',title:'Letter',instructions:'Evidence',basis:'IRS' as const,original:true,level:'mandatory' as const},{id:'visa',title:'Visa',instructions:'Evidence',basis:'IRS' as const,level:'conditional' as const,conditional:'If applicable'}];
  assert.deepEqual(submissionDocumentBlockers(requirements,[{item_id:'letter',kind:'upload',state:'stored'}]),['review:letter','applicability:visa']);
  assert.deepEqual(submissionDocumentBlockers(requirements,[{item_id:'letter',kind:'upload',state:'accepted'}],{visa:{required:false,note:'Not held'}}),['original:letter']);
  assert.deepEqual(submissionDocumentBlockers(requirements,[{item_id:'letter',kind:'upload',state:'accepted',original_checked:true}],{visa:{required:false,note:'Not held'}}),[]);
  assert.deepEqual(submissionDocumentBlockers(requirements,[{item_id:'letter',kind:'upload',state:'replace_requested',original_checked:true}],{visa:{required:false,note:'Not held'}}),['review:letter']);
});
test('Postgres saves document intake separately, archives immutable versions, rejects stale updates and gates submission',async()=>{
  const db=new PGlite();
  const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',staff='33333333-3333-4333-8333-333333333333',caseId='44444444-4444-4444-8444-444444444444',enquiry='55555555-5555-4555-8555-555555555555';
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    grant usage on schema auth,storage to authenticated,anon,service_role;grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;
    create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;`);
    for(const f of ['supabase.sql','supabase-payments.sql','supabase-portal.sql',...(await readdir(new URL('../supabase/migrations',import.meta.url))).sort().map(f=>'supabase/migrations/'+f)])await db.exec(await readFile(new URL('../'+f,import.meta.url),'utf8'));
    await db.exec(`insert into auth.users values('${owner}'),('${other}'),('${staff}');insert into portal_accounts(user_id,email,role) values('${owner}','owner@example.com','client'),('${other}','other@example.com','client'),('${staff}','staff@example.com','staff');`);
    await db.query("insert into enquiries(id,name,email,reason,location,message,consented_at,intake) values($1,'TEST APPLICANT','test@example.com','Synthetic FIRPTA enquiry','UK','AUTOMATED TEST ONLY',now(),$2)",[enquiry,{service:'itin',testOnly:true}]);
    const screening={mode:'assisted',ssnIneligible:true,federalTaxPurpose:true,evidenceRoute:'exception',evidenceNotes:'Reviewed synthetic completed sale',originalsExplained:true,feesExplained:true};
    const c={id:caseId,owner_id:owner,enquiry_id:enquiry,legal_name:'TEST APPLICANT',address:'Synthetic UK address',route_id:'firpta',price_category:'firpta',fee:45000,tax_year:2026,checklist_version:'test',screening};
    await db.query('select portal_create_engagement_case($1,$2,$3,$4)',[c,{version:'test',paragraphs:['Test agreement']},'a'.repeat(64),staff]);
    const snap=makeInstructionSnapshot('firpta','D3',selection,'payment-last',now);
    const value={category:'D3',firpta:selection,responses:{},applicability:{}};
    const save=(actor=owner,revision=0,action='initialize',snapshot:unknown=snap,v:unknown=value)=>db.query('select portal_save_document_intake($1,$2,$3,$4,$5,$6,$7)',[caseId,actor,revision,v,snapshot,snapshot?documentHash(snapshot):null,action]);
    await assert.rejects(save(other),/CASE_ACCESS_DENIED/);
    await save();await save();
    assert.equal((await db.query('select * from portal_instruction_versions')).rows.length,1,'initialize retries do not create a new version');
    await db.query('select portal_accept_agreement($1,$2,$3,$4,true)',[caseId,owner,'a'.repeat(64),'TEST APPLICANT']);
    await save(owner,1,'document-status',null,{...value,responses:{'passport-spread':{status:'later',note:'Will bring original'}}});
    await assert.rejects(save(owner,1,'document-status',null,value),/DOCUMENT_VERSION_MISMATCH/);
    assert.deepEqual((await db.query<{screening:unknown}>('select screening from portal_cases')).rows[0].screening,screening,'eligibility screening is unchanged');
    await db.query('select portal_prepare_payment($1,$2,$3)',[caseId,owner,[]]);
    await assert.rejects(save(owner,2,'firpta-selection'),/INTAKE_LOCKED/);
    const order=(await db.query<{id:string}>('select id from payment_orders')).rows[0].id;
    await db.query("update payment_orders set status='paid' where id=$1",[order]);
    const applicability=Object.fromEntries(snap.requirements.filter(r=>r.level==='conditional').map(r=>[r.id,{required:false,note:'Reviewed not applicable'}]));
    await save(staff,2,'review-applicability',null,{...value,applicability});
    await db.query("update portal_cases set status='verification',caa_verification='{}',original_w7_received_at=now() where id=$1",[caseId]);
    await assert.rejects(db.query('select portal_record_stage($1,$2,$3,$4)',[caseId,staff,'submitted',{reference:'TEST'}]),/DOCUMENT_REVIEW_REQUIRED/);
    for(const req of snap.requirements.filter(r=>r.level==='mandatory')){
      const inserted=await db.query<{id:string}>(`insert into portal_documents(case_id,uploaded_by,item_id,name,path,mime,byte_size,sha256,state) values($1,$2,$3,'dummy.pdf',$4,'application/pdf',10,$5,'stored') returning id`,[caseId,owner,req.id,`${caseId}/${req.id}.pdf`,'b'.repeat(64)]);
      await db.query('select portal_review_document($1,$2,$3,$4,$5,$6)',[caseId,staff,inserted.rows[0].id,'accepted','not-received','Synthetic scan review']);
    }
    await db.query('select portal_record_stage($1,$2,$3,$4)',[caseId,staff,'submitted',{reference:'TEST DISPATCH'}]);
    await db.query("update portal_cases set status='review' where id=$1",[caseId]);
    await save(staff,3,'revise-instructions',{...snap,version:'next-test'}, {...value,revisionReason:'Updated IRS requirements need renewed evidence review'});
    assert.equal((await db.query('select * from portal_instruction_versions')).rows.length,2);
    assert.deepEqual((await db.query<{snapshot:unknown}>('select snapshot from portal_instruction_versions order by created_at limit 1')).rows[0].snapshot,snap,'earlier instructions remain unchanged');
    await db.exec('set role service_role');await assert.rejects(db.exec("update portal_instruction_versions set version='changed'"),/permission denied/);await db.exec('reset role');
    await db.exec(`set request.jwt.claim.sub='${other}';set request.jwt.claims='{"aal":"aal1"}';set role authenticated;`);
    assert.equal((await db.query('select * from portal_instruction_versions')).rows.length,0);assert.equal((await db.query('select * from portal_document_intake')).rows.length,0);
    await assert.rejects(db.exec("update portal_document_intake set responses='{}'"),/permission denied/);
  }finally{await db.close();}
});
