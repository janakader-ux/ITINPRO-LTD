import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadForm } from '../components/LeadForm';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';

test('public application entry collects an enquiry and sends existing clients to MyDocSafe',()=>{
  const PublicIntake:FunctionComponent<{startApplication?:boolean}>=LeadForm;
  const html=renderToStaticMarkup(createElement(PublicIntake,{startApplication:true}));
  for(const name of ['firstName','lastName','email','phone'])assert.match(html,new RegExp(`name="${name}"`));
  assert.match(html,/No payment or document upload is needed here/);
  assert.doesNotMatch(html,/name="journeyPreference"|name="onboardingAddress"|type="file"|secure sign-in and your engagement/);
  const navigation=renderToStaticMarkup(createElement(SiteHeader))+renderToStaticMarkup(createElement(Footer));
  assert.equal((navigation.match(/href="https:\/\/app.mydocsafe.com"/g)||[]).length,2);
  assert.doesNotMatch(navigation,/href="\/portal"/);
});

test('saved-enquiry handoff opens the supplied MyDocSafe group link without enquiry data',async()=>{
  const { MyDocSafeNextStep }=await import('../components/MyDocSafeNextStep');
  const { myDocSafeSignupUrl }=await import('../lib/mydocsafe');
  const html=renderToStaticMarkup(createElement(MyDocSafeNextStep));
  assert.ok(html.includes(`href="${myDocSafeSignupUrl}"`));
  assert.match(html,/Continue to secure document upload/);
  assert.match(html,/same email address/);
  assert.match(html,/not automatically copied/);
  assert.equal(new URL(myDocSafeSignupUrl).search,'');
  const PublicIntake:FunctionComponent<{startApplication?:boolean}>=LeadForm;
  const unsent=renderToStaticMarkup(createElement(PublicIntake,{startApplication:true}));
  assert.ok(!unsent.includes(myDocSafeSignupUrl),'signup follows a saved enquiry, not the unsent form');
});
