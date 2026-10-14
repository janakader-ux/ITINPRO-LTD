import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enquiryServiceSelection } from '../lib/enquiry-service-links';
import posts from '../lib/blog-posts.json';
test('every blog CTA resolves to the correct existing intake service and route',()=>{
  for(const p of posts)assert.ok(enquiryServiceSelection(new URL(p.cta.url).searchParams.get('service')!));
  assert.equal(enquiryServiceSelection('ein')?.service,'ein');
  assert.equal(enquiryServiceSelection('taxreturn')?.service,'tax');
  for(const code of ['firpta','gambling','renewal'])assert.equal(enquiryServiceSelection(code)?.routeId,code);
  assert.equal(enquiryServiceSelection('family')?.routeId,'not-sure');
  assert.equal(enquiryServiceSelection('mobile')?.preference,'contact');
  assert.equal(enquiryServiceSelection('invalid'),undefined);
});
