import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewerEmail,submissionFields,requiresReview} from '../lib/reviewer-email';
test('reviewer email separates questions and answers, flags concerns and escapes client HTML',()=>{
 const result=reviewerEmail('Submission',submissionFields('Passport ready: No\nNotes: <img src=x onerror=alert(1)>\nPreference: Not sure',true));
 assert.match(result.html,/<strong>Passport ready<\/strong>/);
 assert.match(result.html,/REVIEW REQUIRED/);assert.match(result.html,/#b42318/);
 assert.ok(!result.html.includes('<img'));assert.match(result.html,/&lt;img/);
 assert.match(result.text,/Passport ready\nNo\n\n/);
 assert.equal(requiresReview('Do you have a Social Security number?','Yes'),true);
 assert.equal(requiresReview('Do you have a Social Security number?','No'),false);
 assert.equal(submissionFields('Notes: one\nsecond line',false)[0].answer,'Notes: one\nsecond line');
});
