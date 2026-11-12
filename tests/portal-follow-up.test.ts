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
  const html=renderToStaticMarkup(React.createElement(DocumentStatus,{uploaded:false,busy:false,last:false,onBack:()=>{},onContinue:async()=>{},onMoreDocuments:()=>{},onFinish:()=>{}}));
  for(const choice of documentStatusOptions)assert.ok(html.includes(choice.label));
  assert.match(html,/<select[^>]*required/);
  assert.doesNotMatch(html,/<textarea[^>]*required/);
  assert.ok(!html.includes('<details'));
  assert.ok(html.includes('Save and next document'));
  const uploaded=renderToStaticMarkup(React.createElement(DocumentStatus,{uploaded:true,busy:false,last:true,onBack:()=>{},onContinue:async()=>{},onMoreDocuments:()=>{},onFinish:()=>{}}));
  assert.match(uploaded,/Do you have any other documents to upload\?/);
  assert.match(uploaded,/Yes — upload another document/);
  assert.match(uploaded,/No — review and continue/);
  assert.doesNotMatch(uploaded,/<select[^>]*required/);
});
test('help choices save as explicit declarations, disable mistaken date entry, and cannot pass the final foreign-address check',()=>{
  for(const option of answerSupportOptions){
    const answers={dateOfBirth:option.answer,foreignAddress:option.answer,foreignCountry:'United Kingdom'};
    assert.ok(draftAnswersInput.safeParse(answers).success);
    assert.deepEqual(answersNeedingReview(answers),['dateOfBirth','foreignAddress']);
    assert.equal(foreignAddressInput.safeParse(answers).success,false);
    const html=renderToStaticMarkup(React.createElement(QuestionnaireFields,{fields:['dateOfBirth','foreignAddress'],answers,clientEmail:'test@example.com',readOnly:false,allowIncomplete:true,onChange:()=>{}}));
    assert.doesNotMatch(html,/type="date"/);
    // 57fd652 ("Simplify ITIN intake") deliberately removed the per-field
    // "Need help with this answer?" selector from every question, narrowing it to
    // the different-mailing-address field only. So no help selector or review
    // marker is expected here any more. What must still hold is the data side,
    // asserted above: the declaration is saved, answersNeedingReview() reports the
    // field, and the foreign-address check still refuses to pass.
    assert.doesNotMatch(html,/portal-answer-support/);
  }
  assert.deepEqual(answersNeedingReview({firstName:'TEST'}),[]);
});

test('the surviving mailing-address help choice is offered, marked for follow-up and reported for review',()=>{
  // Where the help selector still lives after 57fd652: the different-mailing-address
  // field. This keeps coverage of the marker and the three choices, which the test
  // above lost when the per-field selectors went.
  for(const option of answerSupportOptions.filter(o=>o.value!=='not-applicable')){
    const answers={mailingAddressChoice:'Different mailing address',mailingAddressHelp:option.answer};
    const html=renderToStaticMarkup(React.createElement(QuestionnaireFields,{fields:['mailingStreetAddress'],answers,clientEmail:'test@example.com',readOnly:false,allowIncomplete:true,onChange:()=>{}}));
    assert.match(html,/Need help with this different mailing address\?/);
    assert.ok(html.includes('Saved for CAA follow-up'));
    assert.match(html,/We still need the final mailing address before submission/);
    assert.ok(html.includes(option.label));
    // A parked mailing address is still reported for staff review, so the
    // submission gate in app/api/portal/cases/route.ts continues to refuse it.
    assert.deepEqual(answersNeedingReview(answers),['mailingAddressHelp']);
  }
  // Without the different-address choice there is no selector to offer.
  const same=renderToStaticMarkup(React.createElement(QuestionnaireFields,{fields:['mailingStreetAddress'],answers:{mailingAddressChoice:'Same as foreign address'},clientEmail:'test@example.com',readOnly:false,allowIncomplete:true,onChange:()=>{}}));
  assert.doesNotMatch(same,/Need help with this different mailing address/);
});
