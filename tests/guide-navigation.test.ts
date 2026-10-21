import test from 'node:test';
import assert from 'node:assert/strict';
import { guideApplicationLink } from '../lib/guide-navigation';
import { getApplicationRoute } from '../lib/portal/checklists';
import guides from '../lib/guides.json';

test('guide links preserve the precise route even when multiple routes share a price',()=>{
  assert.equal(guideApplicationLink('itin-for-us-inheritance-estate-distribution'),'/apply?route=estate#enquiry');
  assert.equal(guideApplicationLink('itin-for-401k-pension-annuity'),'/apply?route=pension#enquiry');
  assert.equal(guideApplicationLink('itin-for-dependents'),'/apply?route=dependent#enquiry');
  assert.equal(guideApplicationLink('itin-for-llc-owner'),'/apply?route=llc-dividend#enquiry');
  for(const guide of guides){
    const url=new URL(guideApplicationLink(guide.slug),'https://itinpro.uk');
    assert.equal(url.pathname,'/apply'); assert.equal(url.hash,'#enquiry');
    if(url.searchParams.has('route'))assert.ok(getApplicationRoute(url.searchParams.get('route')!));
  }
  assert.equal(guideApplicationLink('what-is-an-itin'),'/apply#enquiry');
});
