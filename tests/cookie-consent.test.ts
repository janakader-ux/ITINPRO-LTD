import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsAllowed,readCookieChoice,saveCookieChoice } from '../lib/cookie-consent';

test('analytics requires explicit consent, remains off in the portal and stops on rejection',()=>{
  let raw:string|null=null;
  const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
  assert.equal(analyticsAllowed(storage,false),false);
  assert.equal(saveCookieChoice(storage,true),true);
  assert.equal(analyticsAllowed(storage,false),true);
  assert.equal(analyticsAllowed(storage,true),false);
  assert.equal(saveCookieChoice(storage,false),true);
  assert.equal(analyticsAllowed(storage,false),false);
  for(const bad of ['{broken','null','{"analytics":"false","necessary":true,"date":"today"}','{}']){
    raw=bad;assert.equal(readCookieChoice(storage),null);assert.equal(analyticsAllowed(storage,false),false);
  }
  assert.equal(readCookieChoice({getItem:()=>{throw new Error('Storage blocked');}}),null);
  assert.equal(saveCookieChoice({setItem:()=>{throw new Error('Storage blocked');}},true),false);
});
