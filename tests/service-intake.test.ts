import test from 'node:test';
import assert from 'node:assert/strict';
import { simpleIntakeSchema, normalizeSimpleIntake } from '../lib/service-intake';
const base={flowVersion:'simple-v1',firstName:'Test',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',service:'itin',applicationRoute:'llc-dividend',preference:'online',readiness:'yes',consent:'yes'};
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
  const ein=normalizeSimpleIntake(simpleIntakeSchema.parse({...base,service:'ein',applicationRoute:undefined}));
  assert.equal(ein.serviceCategory,'ein');
  assert.equal(ein.message.includes('8821'),false);
  const tax={...base,service:'tax',applicationRoute:undefined,readiness:undefined,taxReason:'US non-resident return (Form 1040-NR)'};
  assert.equal(simpleIntakeSchema.safeParse({...tax,taxReason:undefined}).success,false);
  const saved=normalizeSimpleIntake(simpleIntakeSchema.parse(tax));
  assert.equal(saved.serviceCategory,'tax-return-quote');assert.match(saved.message,/Staff to contact client/);
  assert.match(normalizeSimpleIntake(simpleIntakeSchema.parse({...base,readiness:'no'})).message,/do not request checkout/);
});
