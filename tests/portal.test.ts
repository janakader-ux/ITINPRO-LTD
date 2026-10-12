import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuestionnaireFields } from '../components/portal/QuestionnaireFields';
import { basicFields } from '../lib/portal/fields';
import { selectOptions,normalizeQuestionnaireAnswers,countryOptions } from '../lib/portal/questionnaire';
import { foreignAddressInput } from '../lib/portal/validation';
import { compatibleApplicationRoutes,sandboxRecipient } from '../lib/portal/case-options';
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

test('ITIN case choices exclude EIN and price/category mismatches; test recipient cannot override a real order',()=>{
  assert.deepEqual(compatibleApplicationRoutes({category:'ein',amount:37500}),[]);
  assert.deepEqual(compatibleApplicationRoutes({category:'llc-bank-account',amount:42500}).map(x=>x.id),['llc-bank-account','business-bank-interest']);
  assert.deepEqual(compatibleApplicationRoutes({category:'spouse',amount:37500}),[]);
  assert.deepEqual(compatibleApplicationRoutes({category:'spouse',amount:39500}).map(x=>x.id),['spouse']);
  const synthetic={email:'payment@example.com',message:'AUTOMATED TEST ONLY. Dummy payment.'};
  assert.equal(sandboxRecipient(synthetic,'Tester@Example.test'),'tester@example.test');
  assert.equal(sandboxRecipient(synthetic),synthetic.email);
  assert.throws(()=>sandboxRecipient({...synthetic,email:'realpayer@example.test'},'tester@example.test'));
  assert.throws(()=>sandboxRecipient({...synthetic,message:'A real client enquiry'},'tester@example.test'));
  assert.throws(()=>sandboxRecipient(synthetic,'invalid-email'));
});

test('foreign address is mandatory and US countries or blank details cannot progress; address/email choices copy safely',()=>{
  const valid={foreignAddress:'1 TEST Road, Test City, TEST POSTCODE',foreignCountry:'United Kingdom'};
  assert(foreignAddressInput.safeParse(valid).success);
  assert(answersInput.safeParse(valid).success);
  for(const invalid of [{},{...valid,foreignAddress:'   '},{...valid,foreignCountry:''},{...valid,foreignCountry:'United States'},{...valid,foreignCountry:'USA'}]){
    assert(!foreignAddressInput.safeParse(invalid).success);
    assert(!answersInput.safeParse(invalid).success);
  }
  const copied=normalizeQuestionnaireAnswers({...valid,mailingAddressChoice:'Same as foreign address',mailingAddress:'',mailingCountry:'',contactEmailChoice:'Use my portal email',contactEmail:'injected@example.test'},'tester@example.test');
  assert.equal(copied.mailingAddress,valid.foreignAddress);assert.equal(copied.mailingCountry,valid.foreignCountry);assert.equal(copied.contactEmail,'tester@example.test');
  assert(!answersInput.safeParse({...valid,role:'staff'}).success);
  assert(!answersInput.safeParse({...valid,contactEmailChoice:'Use another contact email',contactEmail:''}).success);
  const different=normalizeQuestionnaireAnswers({...valid,mailingAddressChoice:'Different mailing address',mailingAddress:'2 OTHER TEST Road',contactEmailChoice:'Use another contact email',contactEmail:'alternative@example.test'},'tester@example.test');
  assert.equal(different.mailingAddress,'2 OTHER TEST Road');assert.equal(different.contactEmail,'alternative@example.test');assert(answersInput.safeParse(different).success);
  assert(selectOptions.filingStatus?.includes('Married filing jointly'));assert(selectOptions.visaType?.includes('F-1'));assert(countryOptions.includes('United States'));
});

test('questionnaire renders mandatory foreign inputs, dropdowns and live copied addresses without losing saved dates',()=>{
  const html=renderToStaticMarkup(createElement(QuestionnaireFields,{fields:[...basicFields],answers:{foreignAddress:'1 TEST Road, Test City',foreignCountry:'United Kingdom',mailingAddressChoice:'Same as foreign address',mailingAddress:'OLD ADDRESS',contactEmailChoice:'Use my portal email',contactEmail:'old@example.test',dateOfBirth:'01/01/1980'},clientEmail:'tester@example.test',readOnly:false,onChange:()=>{}}));
  assert.match(html,/<select[^>]*name="foreignCountry"[^>]*required/);
  assert.match(html,/<textarea[^>]*name="foreignAddress"[^>]*required/);
  assert.match(html,/<select[^>]*name="filingStatus"/);
  assert.match(html,/<select[^>]*name="visaType"/);
  assert.match(html,/<textarea[^>]*name="mailingAddress"[^>]*disabled[^>]*>1 TEST Road, Test City/);
  assert.match(html,/<input[^>]*name="contactEmail"[^>]*value="tester@example.test"/);
  assert.match(html,/<input(?=[^>]*name="dateOfBirth")(?=[^>]*type="text")(?=[^>]*value="01\/01\/1980")[^>]*>/);
  assert(!html.includes('OLD ADDRESS'));
});
