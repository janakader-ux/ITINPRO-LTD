import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DocumentReadiness} from '../components/portal/DocumentReadiness';
import {validDocumentDeferral,deferredDocumentsAcknowledgement,missingFinalIdentity,basicIntakeFields} from '../lib/portal/document-readiness';

test('document deferral requires express acknowledgement and retains required final identity information',()=>{
  assert.equal(validDocumentDeferral({documentsLater:true}),false);
  assert.equal(validDocumentDeferral({documentsLater:true,acknowledgement:'true'}),false);
  assert.equal(validDocumentDeferral({documentsLater:true,acknowledgement:true}),true);
  assert.equal(validDocumentDeferral({}),true);
  assert.match(deferredDocumentsAcknowledgement,/proceed with payment now/);
  assert.match(deferredDocumentsAcknowledgement,/cannot submit/);
  assert.ok(missingFinalIdentity({firstName:'TEST'}).includes('dateOfBirth'));
  assert.ok(!basicIntakeFields.includes('visaNumber' as never));
});
test('document entry offers two prominent routes and collapses the full checklist',()=>{
  const html=renderToStaticMarkup(React.createElement(DocumentReadiness,{requirements:[{id:'passport',title:'Passport'}],busy:false,canDefer:true,onUpload:()=>{},onDefer:async()=>{}}));
  assert.equal((html.match(/type="radio"/g)||[]).length,2);
  assert.match(html,/Upload now/);assert.match(html,/Provide documents later and proceed/);
  assert.match(html,/<details><summary>View my full document checklist/);
  assert.match(html,/US visa pages and entry records, only if applicable/);
  assert.doesNotMatch(html,/type="file"/);
});

import {ClientJourney} from '../components/portal/ClientJourney';
import type {CaseData} from '../components/portal/CaseView';
import {makeInstructionSnapshot} from '../lib/portal/instructions';
test('the actual document step opens the readiness choice instead of an upload form',()=>{
  const snapshot=makeInstructionSnapshot('prepared-1040nr');
  const data={case:{id:'test-case',route_id:'prepared-1040nr',workflow:'payment-last',status:'collecting',fee:39500,tax_year:2026},payment:{status:'pending'},portal_agreements:[{accepted_at:'2026-10-21T12:00:00Z'}],portal_documents:[{item_id:'passport-spread',kind:'upload',state:'stored'}],portal_requests:[],portal_approvals:[],portal_answers:[],documentIntake:{snapshot,responses:{},applicability:{},category:snapshot.category},instructionVersions:[],paymentsEnabled:true,uploadsEnabled:true} as unknown as CaseData;
  const html=renderToStaticMarkup(React.createElement(ClientJourney,{data,fields:[],busy:false,message:'',upload:()=>React.createElement('div',null,'UPLOAD_INPUT'),onBack:async()=>{},perform:async()=>true,pay:async()=>true}));
  assert.match(html,/Are your documents ready/);
  assert.match(html,/Provide documents later and proceed/);
  assert.doesNotMatch(html,/UPLOAD_INPUT/);
});
