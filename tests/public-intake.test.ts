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
