'use client';
import { useEffect,useRef,useState } from 'react';
import type { QuestionnaireField } from '@/lib/portal/questionnaire';
import { QuestionnaireFields } from './QuestionnaireFields';
import { portalPost } from './PortalApp';
const sections=[
  {title:'About you',fields:['firstName','middleName','lastName','birthName','dateOfBirth','sex','birthCountry','birthCity','citizenship']},
  {title:'Addresses and contact',fields:['foreignAddressStatus','foreignCountry','foreignAddress','mailingAddressChoice','mailingCountry','mailingAddress','contactEmailChoice','contactEmail']},
  {title:'Identity and U.S. history',fields:['passportIssuer','passportNumber','passportExpiry','foreignTaxId','visaType','visaNumber','visaExpiry','lastUsEntry','previousItin','priorItinName','ssnEligibility','signerAuthority']},
  {title:'Your tax situation',fields:['spouseName','spouseTaxId','relationship','treatyCountry','treatyArticle','companyName','companyEin','filingStatus','taxPurpose','institutionName','institutionCityState','durationOfStay','payerName','paymentYear','taxBenefit','propertyAddress','closingDate']},
  {title:'Anything else',fields:['notes']},
];
export function GuidedQuestionnaire({caseId,fields,initialAnswers,initialRevision,clientEmail,readOnly,onDocuments,onRegisterSave}:{caseId:string;fields:QuestionnaireField[];initialAnswers:Record<string,string>;initialRevision:number;clientEmail:string;readOnly:boolean;onDocuments:()=>void;onRegisterSave?:(save:(()=>Promise<void>)|null)=>void}){
  const [answers,setAnswers]=useState(initialAnswers),[step,setStep]=useState(0),[saveStatus,setSaveStatus]=useState('Saved'),[saving,setSaving]=useState(false);
  const latest=useRef(initialAnswers),saved=useRef(JSON.stringify(initialAnswers)),revision=useRef(initialRevision),queue=useRef<Promise<void>>(Promise.resolve()),conflict=useRef(false),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function save(){
    if(readOnly)return;
    const task=queue.current.then(async()=>{
      if(conflict.current)throw new Error('Reload this case to avoid overwriting changes from another session.');
      const snapshot=latest.current,serial=JSON.stringify(snapshot);if(serial===saved.current)return;
      if(mounted.current){setSaving(true);setSaveStatus('Saving…');}
      try{const result=await portalPost({action:'save-draft',caseId,answers:snapshot,revision:revision.current});revision.current=result.revision;saved.current=serial;if(mounted.current)setSaveStatus(JSON.stringify(latest.current)===serial?'Saved securely':'Changes waiting to save…');}
      catch(error){if((error as Error).message==='ANSWERS_VERSION_MISMATCH'){conflict.current=true;throw new Error('This case changed in another session. Reload before editing again.');}throw error;}
      finally{if(mounted.current)setSaving(false);}
    });
    queue.current=task.catch(()=>{});return task;
  }
  useEffect(()=>{onRegisterSave?.(save);return()=>onRegisterSave?.(null);},[onRegisterSave]);
  useEffect(()=>{function warn(e:BeforeUnloadEvent){if(!readOnly&&JSON.stringify(latest.current)!==saved.current){e.preventDefault();e.returnValue='';}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[readOnly]);
  useEffect(()=>{if(readOnly||JSON.stringify(answers)===saved.current)return;const timer=setTimeout(()=>void save().catch(e=>{if(mounted.current)setSaveStatus(`Not saved: ${e.message}`);}),1200);return()=>clearTimeout(timer);},[answers,readOnly]);
  async function move(next:number){if(!readOnly){try{await save();}catch(e){setSaveStatus(`Not saved: ${(e as Error).message}`);return;}}setStep(next);}
  const section=sections[step],visible=fields.filter(f=>section.fields.includes(f));
  return <div><p>Section {step+1} of {sections.length} · {section.title}</p><p role="status" aria-live="polite">{readOnly?'Staff view — read only':saveStatus}</p><p>You can leave unfinished sections and return later. Wait for “Saved securely” before closing the page. Required foreign-address details are checked when you send the case for review.</p>
    <div className="portal-nav">{sections.map((s,i)=><button key={s.title} type="button" aria-pressed={step===i} disabled={saving} onClick={()=>void move(i)}>{i+1}. {s.title}</button>)}</div>
    <QuestionnaireFields fields={visible} answers={answers} clientEmail={clientEmail} readOnly={readOnly} onChange={(field,value)=>{const next={...latest.current,[field]:value};latest.current=next;setAnswers(next);setSaveStatus('Changes waiting to save…');}}/>
    <div className="portal-nav">{step>0&&<button disabled={saving} onClick={()=>void move(step-1)}>Previous section</button>}{step<sections.length-1?<button disabled={saving} onClick={()=>void move(step+1)}>Save and continue</button>:<button disabled={saving} onClick={()=>void (async()=>{try{if(!readOnly)await save();onDocuments();}catch(e){setSaveStatus(`Not saved: ${(e as Error).message}`);}})()}>Continue to your documents</button>}{!readOnly&&<button disabled={saving} onClick={()=>void save().catch(e=>setSaveStatus(`Not saved: ${e.message}`))}>Save and return later</button>}</div>
  </div>;
}
