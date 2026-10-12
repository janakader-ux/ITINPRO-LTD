import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationRoutes,routeChecklist,routeFee,signatureInstructions,passportInstructions } from '../lib/portal/checklists';
import { caseInput,answersInput,validateFile,sameOrigin } from '../lib/portal/validation';
import { engagementSnapshot } from '../lib/portal/engagement';
test('all portal routes have stable unique checklist items and canonical category fees',()=>{
  assert.equal(new Set(applicationRoutes.map(x=>x.id)).size,applicationRoutes.length);
  for(const route of applicationRoutes){const items=routeChecklist(route.id);assert.equal(new Set(items.map(x=>x.id)).size,items.length);assert(items.some(x=>x.id==='passport-spread'));assert(routeFee(route.id)>0);}
  assert.equal(routeFee('spouse'),39500);assert.equal(routeFee('renewal'),39500);assert.equal(routeFee('llc-dividend'),42500);assert.equal(routeFee('partnership'),45000);assert.equal(routeFee('firpta'),45000);assert.equal(routeFee('pension'),49500);
  assert.throws(()=>routeChecklist('nonexistent'));
  assert.match(signatureInstructions,/BLUE INK/);assert.match(signatureInstructions,/our practice/);assert.match(passportInstructions,/facing top page/);
  assert.match(routeChecklist('partnership').find(x=>x.id==='partnership-agreement')!.instructions,/name and signature/);
});
test('untrusted price/role/path fields are excluded and attachment headers, sizes and types are checked',()=>{
  const input=caseInput.parse({orderId:'11111111-1111-4111-8111-111111111111',routeId:'llc-dividend',legalName:'AUTOMATED TEST',address:'Synthetic test address',taxYear:2026,fee:1,owner_id:'attacker'});
  assert(!('fee' in input));assert(!('owner_id' in input));
  assert.throws(()=>answersInput.parse({role:'staff'}));
  assert.equal(validateFile(Buffer.from('%PDF-1.7\nDUMMY'), 'dummy.pdf','application/pdf'),'pdf');
  assert.throws(()=>validateFile(Buffer.from('<script>'), 'dummy.pdf','application/pdf'));
  assert.throws(()=>validateFile(Buffer.from('%PDF-'), 'dummy.html','application/pdf'));
  assert.throws(()=>validateFile(new Uint8Array(10485761),'big.pdf','application/pdf'));
  assert(!sameOrigin(new Request('https://itinpro.uk/api/portal/cases',{headers:{origin:'https://attacker.example'}})));
  assert(!sameOrigin(new Request('https://itinpro.uk/api/portal/cases')));
  assert(sameOrigin(new Request('https://itinpro.uk/api/portal/cases',{headers:{origin:'https://itinpro.uk'}})));
});
test('engagement uses source terms and canonical case details, with no unresolved placeholders',()=>{
  const e=engagementSnapshot({id:'11111111-1111-4111-8111-111111111111',legal_name:'AUTOMATED TEST',address:'Dummy address',route_id:'partnership',fee:45000,tax_year:2026,created_at:'2026-10-12T12:00:00Z'});
  assert.match(JSON.stringify(e.snapshot),/£450/);assert.match(JSON.stringify(e.snapshot),/all-inclusive, no VAT/);
  assert(!JSON.stringify(e.snapshot).includes('{{'));assert.equal(e.sha256.length,64);
  assert.match(JSON.stringify(e.snapshot),/14 days/);assert.match(JSON.stringify(e.snapshot),/separate engagement letter/);
});

test('distinct IRS exception pathways keep required evidence and do not confuse scan approval with signing',()=>{
  const text=(id:string)=>JSON.stringify(routeChecklist(id));
  assert.match(text('wages-treaty'),/8233/);
  assert.match(text('scholarship-treaty'),/W-8BEN/);
  assert.match(text('scholarship-no-treaty'),/must accompany W-7/);
  assert.match(text('business-bank-interest'),/effectively connected/);
  assert.match(text('resident-bank-interest'),/resident-alien status/);
  assert.match(text('gambling'),/gaming official acting as an IRS ITIN Acceptance Agent/);
  assert.match(text('renewal'),/previous-year copy alone does not replace/);
  assert.match(text('dependent'),/under age 6/);
  assert.match(text('dependent'),/age 6 to under 18/);
  assert.match(text('dependent'),/12 months/);
  assert.equal(routeChecklist('partnership').find(x=>x.id==='partnership-letter')!.basis,'ITIN PRO');
  for(const id of ['student-return','wages-treaty','scholarship-treaty','scholarship-no-treaty']) assert.equal(routeFee(id),55000);
});
