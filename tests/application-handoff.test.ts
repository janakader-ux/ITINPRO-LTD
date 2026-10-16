import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibilityIntakeSchema,normalizeEligibilityIntake,selfServiceReady } from '../lib/eligibility-intake';
import { portalCaseId } from '../lib/portal/login-link';

test('eligibility-only requests remain enquiries even with otherwise ready answers',()=>{
  const raw={flowVersion:'eligibility-v2',service:'itin',firstName:'TEST',lastName:'Applicant',email:'test@example.com',phone:'+44 123456789',applicationRoute:'prepared-1040nr',preference:'contact',readiness:'no',consent:'yes',testOnly:true,eligibilityCheck:true,
    basic:{residenceCountry:'United Kingdom',citizenshipCountry:'United Kingdom',ssnEligibility:'No',previousItinApplication:'No',passportReady:'Yes',returnReady:'Yes',contactMethod:'Email'},
    onboarding:{address:'Synthetic address only',taxYear:2026,documentsReady:true,taxPurposeUnderstood:true,originalsUnderstood:true}};
  const enquiry=normalizeEligibilityIntake(eligibilityIntakeSchema.parse(raw));
  assert.equal(enquiry.intake.eligibilityCheck,true);
  assert.match(enquiry.message,/Requested: please check ITIN eligibility and respond/);
  assert.equal(selfServiceReady(enquiry.intake),false);
  const application=normalizeEligibilityIntake(eligibilityIntakeSchema.parse({...raw,preference:'online',readiness:'yes'}));
  assert.equal(application.intake.eligibilityCheck,false);
  assert.equal(selfServiceReady(application.intake),true);
  assert.equal(selfServiceReady({...application.intake,basic:{...application.intake.basic,ssnEligibility:'Not sure'}}),false);
});

test('email handoff preserves only a case UUID, never an external redirect',()=>{
  const id='11111111-1111-4111-8111-111111111111';
  assert.equal(portalCaseId(id),id);
  for(const value of [undefined,null,'https://example.com','//example.com',id+'&next=https://example.com','../admin','a'.repeat(36)])assert.equal(portalCaseId(value),null);
});
