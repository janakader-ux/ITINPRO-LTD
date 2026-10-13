import test from 'node:test';
import assert from 'node:assert/strict';
import { resumeClientStep,missingRequiredUploads } from '../lib/portal/client-journey';
test('client resume respects signing/payment gates and returns to the ongoing task',()=>{
  assert.equal(resumeClientStep(false,false,'awaiting_agreement',false,3),0);
  assert.equal(resumeClientStep(true,false,'awaiting_payment',false,3),1);
  assert.equal(resumeClientStep(true,true,'collecting',false),2);
  assert.equal(resumeClientStep(true,true,'collecting',true),3);
  assert.equal(resumeClientStep(true,true,'draft_shared',true),3);
  assert.equal(resumeClientStep(true,true,'collecting',false,0),0);
  assert.equal(resumeClientStep(true,true,'collecting',false,99),2);
});
test('required-upload checks ignore conditional/optional files, drafts and rejected replacements',()=>{
  const required=[{id:'passport'},{id:'return'},{id:'visa',conditional:'If held'}];
  assert.deepEqual(missingRequiredUploads(required,[]),['passport','return']);
  assert.deepEqual(missingRequiredUploads(required,[{item_id:'passport',kind:'draft',state:'accepted'},{item_id:'return',kind:'upload',state:'replace_requested'}]),['passport','return']);
  assert.deepEqual(missingRequiredUploads(required,[{item_id:'passport',kind:'upload',state:'stored'},{item_id:'return',kind:'upload',state:'accepted'}]),[]);
});
