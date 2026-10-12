import test from 'node:test';
import { itinBasics,einBasics,taxBasics } from './fixtures/basic-intake';
import assert from 'node:assert/strict';
import { simpleIntakeSchema, normalizeSimpleIntake } from '../lib/service-intake';
const base={flowVersion:'simple-v1',firstName:'Test',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',service:'itin',applicationRoute:'llc-dividend',preference:'online',readiness:'yes',basic:itinBasics,consent:'yes'};
test('short intake requires contact and readiness without collecting public tax identifiers',()=>{
  assert.equal(simpleIntakeSchema.safeParse(base).success,true);
  for(const field of ['firstName','lastName','email','phone','applicationRoute','readiness'])assert.equal(simpleIntakeSchema.safeParse({...base,[field]:''}).success,false,field);
  assert.equal(simpleIntakeSchema.safeParse({...base,applicationRoute:'ein'}).success,false);
  assert.equal(simpleIntakeSchema.safeParse({...base,preference:'contact',readiness:undefined}).success,true);
  const parsed=simpleIntakeSchema.parse({...base,serviceCategory:'spouse',amount:1,passportNumber:'SHOULD_NOT_BE_SAVED'});
  const saved=normalizeSimpleIntake(parsed);
  assert.equal(saved.serviceCategory,'llc');
  assert.equal(saved.message.includes('SHOULD_NOT_BE_SAVED'),false);
  assert.match(saved.message,/send the service-specific engagement/);
});
test('EIN remains separate and tax returns are minimal contact requests',()=>{
  const ein=normalizeSimpleIntake(simpleIntakeSchema.parse({...base,service:'ein',applicationRoute:undefined,basic:einBasics}));
  assert.equal(ein.serviceCategory,'ein');
  assert.equal(ein.message.includes('8821'),false);
  const tax={...base,service:'tax',applicationRoute:undefined,basic:taxBasics,readiness:undefined,taxReason:'US non-resident return (Form 1040-NR)'};
  assert.equal(simpleIntakeSchema.safeParse({...tax,taxReason:undefined}).success,false);
  const saved=normalizeSimpleIntake(simpleIntakeSchema.parse(tax));
  assert.equal(saved.serviceCategory,'tax-return-quote');assert.match(saved.message,/Staff to contact client/);
  assert.match(normalizeSimpleIntake(simpleIntakeSchema.parse({...base,readiness:'no'})).message,/do not request checkout/);
});

test('contact-me still requires service-specific basics and renewal questions',()=>{
  const contact={...base,preference:'contact',readiness:undefined};
  assert.equal(simpleIntakeSchema.safeParse({...contact,basic:{}}).success,false);
  assert.equal(simpleIntakeSchema.safeParse({...contact,basic:{...itinBasics,foreignCountry:'United States'}}).success,false);
  assert.equal(simpleIntakeSchema.safeParse({...contact,applicationRoute:'renewal'}).success,false);
  const renewed=simpleIntakeSchema.parse({...contact,applicationRoute:'renewal',basic:{...itinBasics,renewalReason:'IRS renewal notice',returnReady:'Previous return available'}});
  assert.match(normalizeSimpleIntake(renewed).message,/IRS renewal notice/);
  const ein={...contact,service:'ein',applicationRoute:undefined,basic:einBasics};
  assert.equal(simpleIntakeSchema.safeParse({...ein,basic:{...einBasics,llcMembers:''}}).success,false);
  const saved=normalizeSimpleIntake(simpleIntakeSchema.parse({...ein,basic:{...einBasics,passportNumber:'DO_NOT_RETAIN',foreignCountry:'DO_NOT_RETAIN',notes:'Please call tomorrow.'}}));
  assert.match(saved.message,/SYNTHETIC EXAMPLE LLC/);assert.match(saved.message,/Please call tomorrow/);assert.equal(saved.message.includes('DO_NOT_RETAIN'),false);assert.equal(saved.location,'United Kingdom');
  const tax={...contact,service:'tax',applicationRoute:undefined,taxReason:'US non-resident return (Form 1040-NR)',basic:taxBasics};
  assert.equal(simpleIntakeSchema.safeParse({...tax,basic:{...taxBasics,taxYear:''}}).success,false);
  assert.match(normalizeSimpleIntake(simpleIntakeSchema.parse(tax)).message,/Which tax year.*2025/);
});

test('basic forms render service-specific dropdowns and keep optional questions collapsed',async()=>{
  const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
  const {BasicServiceQuestions}=await import('../components/BasicServiceQuestions');
  const html=renderToStaticMarkup(createElement(BasicServiceQuestions,{service:'ein',routeId:'',values:einBasics,onChange:()=>{}}));
  assert.match(html,/About your EIN application/);assert.match(html,/<input(?=[^>]*name="basic.companyName")(?=[^>]*required)[^>]*>/);assert.match(html,/name="basic.llcMembers"/);
  assert.match(html,/<details class=/);assert.equal(/<details[^>]* open/.test(html),false);assert.equal(html.includes('name="basic.passportNumber"'),false);
});
