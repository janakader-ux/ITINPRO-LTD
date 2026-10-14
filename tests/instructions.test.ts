import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { instructionGuides,guidesForRoute,caseGuide,instructionChecklist,instructionText } from '../lib/portal/instructions';
import { applicationRoutes,routeChecklist } from '../lib/portal/checklists';
import { missingRequiredUploads } from '../lib/portal/client-journey';
import { DocumentInstructions } from '../components/portal/DocumentInstructions';
test('all 26 client categories map to real routes; no internal notes are client content',()=>{
  assert.equal(instructionGuides.length,26);
  assert.equal(new Set(instructionGuides.map(g=>g.code)).size,26);
  for(const guide of instructionGuides){
    assert(guide.items.length);
    for(const route of guide.routes)assert(applicationRoutes.some(r=>r.id===route));
    assert(!guide.fullText.includes('INTERNAL — DO NOT SEND'));
    assert(!instructionText(guide,guide.routes[0]).includes('blue or black'));
    assert(!instructionText(guide,guide.routes[0]).includes('email clear scans'));
  }
});
test('ambiguous pension and estate guides require a saved compatible selection',()=>{
  assert.equal(guidesForRoute('pension').length,2);
  assert.equal(caseGuide('pension'),undefined);
  assert.equal(caseGuide('pension',{instructionCategory:'B12'})?.code,'B12');
  assert.equal(caseGuide('pension',{instructionCategory:'B14'}),undefined);
  assert.equal(caseGuide('prepared-1040nr')?.code,'A1');
  assert.equal(caseGuide('ein'),undefined);
});
test('pension-beneficiary uploads reflect the selected guide and preserve optional status',()=>{
  const items=instructionChecklist('pension',{instructionCategory:'B12'},'payment-last');
  assert(items.some(i=>i.id==='b12-1'&&!i.conditional));
  assert(items.some(i=>i.id==='b12-3'&&i.conditional?.startsWith('Optional')));
  assert(!items.some(i=>i.id.startsWith('b11-')));
  assert(missingRequiredUploads(items,[]).includes('b12-1'));
  assert(!missingRequiredUploads(items,[]).includes('b12-3'));
  assert(missingRequiredUploads(items,[],{'b12-3':{status:'later',note:'Will obtain'}}).includes('b12-3'));
  assert(!missingRequiredUploads(items,[],{'b12-3':{status:'not-applicable',note:'No death certificate available'}}).includes('b12-3'));
  assert(missingRequiredUploads(items,[{item_id:'b12-1',kind:'upload',state:'replace_requested'}]).includes('b12-1'));
});
test('alternative FIRPTA routes are conditional, and dependent residency retains current controls',()=>{
  const firpta=instructionChecklist('firpta');
  assert(firpta.filter(i=>i.id.startsWith('d3-')).every(i=>i.conditional));
  const dependent=instructionChecklist('dependent');
  assert(dependent.some(i=>i.id==='dependent-residency'&&i.instructions.includes('under 24')));
  const partnership=instructionChecklist('partnership',{instructionCategory:'B4'});
  assert(partnership.some(i=>i.instructions.includes('Operating Agreement')&&!i.conditional));
});
test('older agreed workflows retain their existing upload item IDs',()=>{
  assert.deepEqual(instructionChecklist('prepared-1040nr',undefined,'engagement-first'),routeChecklist('prepared-1040nr'));
  assert.deepEqual(instructionChecklist('llc-bank-account',undefined,'legacy-paid-first'),routeChecklist('llc-bank-account'));
});
test('instruction panel renders three stages, a case-specific download and no global category picker',()=>{
  const html=renderToStaticMarkup(createElement(DocumentInstructions,{caseId:'test-case',routeId:'pension',screening:{instructionCategory:'B12'},busy:false,locked:false,choose:async()=>true}));
  for(const text of ['1. Your category','2. Standard documents','3. Supporting documents','B12','caseId=test-case','original','Mandatory'])assert(html.includes(text));
  assert(!html.includes('B14 —'));
});

test('instruction downloads fail closed before authentication when sandbox is disabled',async()=>{
  const {GET}=await import('../app/api/portal/instructions/route');
  const original=process.env.PORTAL_MODE,network=globalThis.fetch;let calls=0;
  try{
    delete process.env.PORTAL_MODE;globalThis.fetch=async()=>{calls++;throw new Error('Unexpected request');};
    const response=await GET(new Request('https://itinpro.uk/api/portal/instructions?caseId=11111111-1111-4111-8111-111111111111'));
    assert.equal(response.status,404);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(calls,0);
  }finally{globalThis.fetch=network;if(original===undefined)delete process.env.PORTAL_MODE;else process.env.PORTAL_MODE=original;}
});
