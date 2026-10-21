import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentStatus } from '../components/portal/DocumentStatus';
import { QuestionnaireFields } from '../components/portal/QuestionnaireFields';
import { answerSupportOptions,answersNeedingReview,documentResponse,documentStatusOptions } from '../lib/portal/answer-support';
import { draftAnswersInput,foreignAddressInput } from '../lib/portal/validation';
import { submissionDocumentBlockers } from '../lib/portal/instructions';
import { missingRequiredUploads } from '../lib/portal/client-journey';

test('every missing-document choice saves without a note but does not waive submission evidence',()=>{
  for(const choice of documentStatusOptions){
    const response=documentResponse(choice.value);
    assert.equal(response.status,choice.value);assert.ok(response.note.length>=3);
    assert.deepEqual(missingRequiredUploads([{id:'return'}],[],{return:response}),['return']);
    assert.deepEqual(missingRequiredUploads([{id:'visa',conditional:'If held'}],[],{visa:response}),choice.value==='not-applicable'?[]:['visa']);
    assert.deepEqual(submissionDocumentBlockers([{id:'return',title:'Return',instructions:'Required',basis:'IRS',level:'mandatory'}],[]),['review:return']);
  }
});
test('missing-document controls are visible, require a status and keep notes optional',()=>{
  const html=renderToStaticMarkup(React.createElement(DocumentStatus,{uploaded:false,busy:false,last:false,onBack:()=>{},onContinue:async()=>{}}));
  for(const choice of documentStatusOptions)assert.ok(html.includes(choice.label));
  assert.match(html,/<select[^>]*required/);
  assert.doesNotMatch(html,/<textarea[^>]*required/);
  assert.ok(!html.includes('<details'));
  assert.ok(html.includes('Save and next document'));
  const uploaded=renderToStaticMarkup(React.createElement(DocumentStatus,{uploaded:true,busy:false,last:true,onBack:()=>{},onContinue:async()=>{}}));
  assert.doesNotMatch(uploaded,/<select[^>]*required/);
});
test('help choices save as explicit declarations, disable mistaken date entry, and cannot pass the final foreign-address check',()=>{
  for(const option of answerSupportOptions){
    const answers={dateOfBirth:option.answer,foreignAddress:option.answer,foreignCountry:'United Kingdom'};
    assert.ok(draftAnswersInput.safeParse(answers).success);
    assert.deepEqual(answersNeedingReview(answers),['dateOfBirth','foreignAddress']);
    assert.equal(foreignAddressInput.safeParse(answers).success,false);
    const html=renderToStaticMarkup(React.createElement(QuestionnaireFields,{fields:['dateOfBirth','foreignAddress'],answers,clientEmail:'test@example.com',readOnly:false,allowIncomplete:true,onChange:()=>{}}));
    assert.ok(html.includes('Saved for staff review'));
    assert.doesNotMatch(html,/type="date"/);
    for(const help of answerSupportOptions)assert.ok(html.includes(help.label));
  }
  assert.deepEqual(answersNeedingReview({firstName:'TEST'}),[]);
});
