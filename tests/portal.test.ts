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
  assert.match(signatureInstructions,/BLUE INK/);assert.match(signatureInstructions,/our practice/);assert.match(passportInstructions,/the full page immediately above it/);
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
  // 4951173 ("Build Form W-7 client intake") split the single foreignAddress box into
  // foreignStreetAddress / foreignCity / foreignRegion / foreignPostalCode, and made
  // answersInput require the full W-7 identity set. A complete fixture is therefore
  // needed to assert the positive case; the address rules below are what this test guards.
  // foreignAddress is the composed string that normalizeQuestionnaireAnswers builds from
  // the structured parts, and it is what foreignAddressInput actually checks (length >= 10).
  // Saved answers always carry it, so the fixture does too.
  const address={foreignCountry:'United Kingdom',foreignStreetAddress:'1 TEST Road',foreignCity:'Test City',foreignRegion:'Testshire',foreignPostalCode:'TE5 7XX',foreignAddress:'1 TEST Road, Test City, Testshire, TE5 7XX'};
  const valid={...address,applicationType:'new',w7Reason:'b',birthNameDifferent:'No',firstName:'TEST',lastName:'CLIENT',dateOfBirth:'01/01/1980',sex:'Male',birthCountry:'United Kingdom',citizenship:'United Kingdom',mailingAddressChoice:'Same as foreign address',phoneNumber:'+44 1234 567890',passportIssuer:'United Kingdom',passportNumber:'TEST123456',passportExpiry:'2030-01-01',previousItinStatus:'No',visaType:'No U.S. visa',taxPurpose:'1040-NR',filingStatus:'Not yet filed'};
  assert(foreignAddressInput.safeParse(valid).success);
  assert(answersInput.safeParse(valid).success);
  // The load-bearing rule: a blank address, a missing country, or any spelling of the
  // United States must fail both the address check and the full answers check.
  for(const invalid of [{},{...valid,foreignStreetAddress:'   ',foreignCity:'   ',foreignAddress:'   '},{...valid,foreignCountry:''},{...valid,foreignCountry:'United States'},{...valid,foreignCountry:'USA'}]){
    assert(!foreignAddressInput.safeParse(invalid).success);
    assert(!answersInput.safeParse(invalid).success);
  }
  // Same-as-foreign composes the mailing address from the structured parts, and a
  // client-supplied contact email never overrides the portal sign-in email.
  const copied=normalizeQuestionnaireAnswers({...valid,contactEmailChoice:'Use my portal email',contactEmail:'injected@example.test'},'tester@example.test');
  assert.equal(copied.mailingAddress,'1 TEST Road, Test City, Testshire, TE5 7XX');
  assert.equal(copied.mailingCountry,'United Kingdom');
  assert.equal(copied.contactEmail,'tester@example.test');
  assert(!answersInput.safeParse({...valid,role:'staff'}).success);
  assert(!answersInput.safeParse({...valid,contactEmailChoice:'Use another contact email',contactEmail:''}).success);
  const different=normalizeQuestionnaireAnswers({...valid,mailingAddressChoice:'Different mailing address',mailingCountry:'United States',mailingStreetAddress:'2 OTHER TEST Road',mailingCity:'Otherville',contactEmailChoice:'Use another contact email',contactEmail:'alternative@example.test'},'tester@example.test');
  assert.equal(different.mailingAddress,'2 OTHER TEST Road, Otherville');
  assert.equal(different.contactEmail,'alternative@example.test');
  assert(answersInput.safeParse(different).success);
  // filingStatus now means "have you filed", not the IRS filing status, so the old
  // 'Married filing jointly' option is gone; validation accepts only these two.
  assert.deepEqual(selectOptions.filingStatus,['Filed already','Not yet filed']);
  assert(selectOptions.visaType?.includes('F-1'));assert(countryOptions.includes('United States'));
});

test('questionnaire renders mandatory foreign inputs, dropdowns and live copied addresses without losing saved dates',()=>{
  const html=renderToStaticMarkup(createElement(QuestionnaireFields,{fields:[...basicFields],answers:{foreignCountry:'United Kingdom',foreignStreetAddress:'1 TEST Road',foreignCity:'Test City',mailingAddressChoice:'Same as foreign address',mailingAddress:'OLD ADDRESS',contactEmailChoice:'Use my portal email',contactEmail:'old@example.test',dateOfBirth:'01/01/1980'},clientEmail:'tester@example.test',readOnly:false,onChange:()=>{}}));
  // Structured foreign address since 4951173: country, street and city are the mandatory
  // parts, region and postcode are optional, and the old single box is gone.
  assert.match(html,/<select[^>]*name="foreignCountry"[^>]*required/);
  assert.match(html,/<input(?=[^>]*name="foreignStreetAddress")(?=[^>]*required)[^>]*>/);
  assert.match(html,/<input(?=[^>]*name="foreignCity")(?=[^>]*required)[^>]*>/);
  assert.doesNotMatch(html,/name="foreignAddress"/);
  assert.match(html,/<input(?=[^>]*name="foreignRegion")(?![^>]*required)[^>]*>/);
  assert.match(html,/<input(?=[^>]*name="foreignPostalCode")(?![^>]*required)[^>]*>/);
  assert.match(html,/<select[^>]*name="filingStatus"/);
  assert.match(html,/<select(?=[^>]*name="visaType")(?=[^>]*required)[^>]*>/);
  // Same-as-foreign hides the mailing fields entirely rather than showing a disabled
  // copy, so a stale saved mailing address can never be displayed or resubmitted.
  assert.doesNotMatch(html,/name="mailingStreetAddress"/);
  assert.match(html,/The foreign address will also be used as your IRS mailing address/);
  assert.match(html,/<input[^>]*name="contactEmail"[^>]*value="tester@example.test"/);
  assert.match(html,/<input(?=[^>]*name="dateOfBirth")(?=[^>]*type="text")(?=[^>]*value="01\/01\/1980")[^>]*>/);
  assert(!html.includes('OLD ADDRESS'));
});

 test('payment-last engagement describes intake before payment without changing source work-start terms',()=>{
 const e=engagementSnapshot({id:'11111111-1111-4111-8111-111111111111',legal_name:'TEST APPLICANT',address:'Dummy address',route_id:'spouse',fee:39500,tax_year:2026,created_at:'2026-10-13T12:00:00Z',workflow:'payment-last'});
 assert.match(e.version,/payment-last$/);assert.match(e.snapshot.paragraphs.join(' '),/upload the documents you have, then pay/);assert.match(e.snapshot.paragraphs.join(' '),/Professional review and preparation begin only after confirmed payment/);
 });
