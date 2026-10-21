'use client';
import { useState } from 'react';
import { deferredDocumentsAcknowledgement } from '@/lib/portal/document-readiness';
export function DocumentReadiness({requirements,busy,canDefer,onUpload,onDefer}:{requirements:{id:string;title:string;conditional?:string}[];busy:boolean;canDefer:boolean;onUpload:()=>void;onDefer:()=>Promise<void>}){
  const [choice,setChoice]=useState(''),[acknowledged,setAcknowledged]=useState(false);
  return <section className="portal-readiness" aria-labelledby="document-readiness-title"><h3 id="document-readiness-title">Are your documents ready?</h3><p>This is the information required for your application. You can upload now, or provide it later and pay now.</p>
    <ul><li>A clear colour scan of your passport.</li><li>Proof of address for our records.</li><li>US visa pages and entry records, only if applicable.</li><li>Supporting tax documents for your selected application category.</li></ul>
    <details><summary>View my full document checklist ({requirements.length} items)</summary><ul>{requirements.map(r=><li key={r.id}>{r.title}{r.conditional?' — if applicable / optional':''}</li>)}</ul></details>
    <fieldset disabled={busy}><legend>Choose how you would like to proceed</legend><label className="portal-readiness-choice"><input type="radio" name="uploadReadiness" value="now" checked={choice==='now'} onChange={()=>setChoice('now')}/><span><strong>Upload now</strong><br/>I have my documents ready and would like to upload them.</span></label>{canDefer&&<label className="portal-readiness-choice"><input type="radio" name="uploadReadiness" value="later" checked={choice==='later'} onChange={()=>setChoice('later')}/><span><strong>Provide documents later and proceed</strong><br/>I do not have all the documents yet. I would like to pay now and provide them later.</span></label>}
    {choice==='later'&&<div className="portal-defer-notice"><p><strong>Before you pay</strong></p><p>We cannot complete or submit your application until all required information and documents have been provided and reviewed.</p><label><input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>{deferredDocumentsAcknowledgement}</label></div>}
    <div className="portal-actions"><button disabled={!choice||(choice==='later'&&!acknowledged)} onClick={()=>choice==='now'?onUpload():void onDefer()}>{choice==='later'?'Save my acknowledgement and continue to payment':'Continue to upload documents'}</button></div></fieldset>
  </section>;
}
