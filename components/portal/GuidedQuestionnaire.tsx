'use client';
import { useEffect,useRef,useState } from 'react';
import type { QuestionnaireField } from '@/lib/portal/questionnaire';
import { basicIntakeFields,missingFinalIdentity } from '@/lib/portal/document-readiness';
import { QuestionnaireFields } from './QuestionnaireFields';
import { normalizeQuestionnaireAnswers } from '@/lib/portal/questionnaire';
import { portalPost } from './PortalApp';
const sections=[
  {title:'Application type and reason',fields:['applicationType','w7Reason','boxHException','treatyClaimStatus','treatyArticle']},
  {title:'About you',fields:['firstName','middleName','lastName','birthNameDifferent','birthFirstName','birthMiddleName','birthLastName','dateOfBirth','sex','birthCountry','birthCity','citizenship','additionalCitizenships']},
  {title:'Addresses and contact',fields:['foreignAddressStatus','foreignCountry','foreignStreetAddress','foreignCity','foreignRegion','foreignPostalCode','foreignAddress','mailingAddressChoice','mailingCountry','mailingStreetAddress','mailingCity','mailingRegion','mailingPostalCode','mailingAddress','mailingAddressHelp','contactEmailChoice','contactEmail','phoneNumber']},
  {title:'Identity and U.S. history',fields:['passportIssuer','passportNumber','passportExpiry','foreignTaxId','visaType','visaNumber','visaExpiry','lastUsEntry','previousItinStatus','previousItinType','previousItin','previousIrsn','irsNoticeType','priorItinFirstName','priorItinMiddleName','priorItinLastName','ssnEligibility','signerAuthority']},
  {title:'Your tax situation',fields:['relationship','usPersonFirstName','usPersonMiddleName','usPersonLastName','usPersonTaxId','institutionName','institutionCityState','durationOfStay','companyName','companyEin','filingStatus','taxPurpose','payerName','paymentYear','taxBenefit','propertyAddress','closingDate']},
  {title:'Anything else',fields:['notes']},
];
export function GuidedQuestionnaire({caseId,fields,initialAnswers,initialRevision,clientEmail,readOnly,allowIncomplete=false,onDocuments,onRegisterSave,onBack}:{caseId:string;fields:QuestionnaireField[];initialAnswers:Record<string,string>;initialRevision:number;clientEmail:string;readOnly:boolean;allowIncomplete?:boolean;onDocuments:(answers:Record<string,string>)=>void;onBack?:()=>void;onRegisterSave?:(save:(()=>Promise<void>)|null)=>void}){
  const minimal=allowIncomplete&&!readOnly;
  const activeSections=minimal?[{title:'Basic details',fields:[...basicIntakeFields] as string[]}]:sections;
  const normalizedInitial=normalizeQuestionnaireAnswers(initialAnswers,clientEmail) as Record<string,string>;
  const [answers,setAnswers]=useState(normalizedInitial),[step,setStep]=useState(()=>{const raw=typeof window==='undefined'?null:new URLSearchParams(window.location.search).get('part');const n=Number(raw);return raw!==null&&Number.isInteger(n)&&n>=0&&n<activeSections.length?n:0;}),[saveStatus,setSaveStatus]=useState('Saved'),[saving,setSaving]=useState(false),[transitioningTo,setTransitioningTo]=useState<number|null>(null);
  const sectionHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{sectionHeading.current?.focus({preventScroll:true});sectionHeading.current?.scrollIntoView({block:'start'});},[step]);
  const latest=useRef(normalizedInitial),saved=useRef(JSON.stringify(initialAnswers)),revision=useRef(initialRevision),queue=useRef<Promise<void>>(Promise.resolve()),conflict=useRef(false),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function save(){
    if(readOnly)return;
    const task=queue.current.then(async()=>{
      if(conflict.current)throw new Error('Reload this case to avoid overwriting changes from another session.');
      const snapshot=normalizeQuestionnaireAnswers(latest.current,clientEmail),serial=JSON.stringify(snapshot);if(serial===saved.current)return;
      if(mounted.current){setSaving(true);setSaveStatus('Saving your details securely…');}
      try{const result=await portalPost({action:'save-draft',caseId,answers:snapshot,revision:revision.current});revision.current=result.revision;saved.current=serial;if(mounted.current)setSaveStatus(JSON.stringify(normalizeQuestionnaireAnswers(latest.current,clientEmail))===serial?'Saved securely':'Changes waiting to save…');}
      catch(error){if((error as Error).message==='ANSWERS_VERSION_MISMATCH'){conflict.current=true;throw new Error('This case changed in another session. Reload before editing again.');}throw error;}
      finally{if(mounted.current)setSaving(false);}
    });
    queue.current=task.catch(()=>{});return task;
  }
  useEffect(()=>{onRegisterSave?.(save);return()=>onRegisterSave?.(null);},[onRegisterSave]);
  useEffect(()=>{function warn(e:BeforeUnloadEvent){if(!readOnly&&JSON.stringify(normalizeQuestionnaireAnswers(latest.current,clientEmail))!==saved.current){e.preventDefault();e.returnValue='';}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[readOnly,clientEmail]);
  useEffect(()=>{if(readOnly||JSON.stringify(normalizeQuestionnaireAnswers(answers,clientEmail))===saved.current)return;const timer=setTimeout(()=>void save().catch(e=>{if(mounted.current)setSaveStatus(`Not saved: ${e.message}`);}),900);return()=>clearTimeout(timer);},[answers,readOnly,clientEmail]);
  async function move(next:number){if(transitioningTo!==null)return;setTransitioningTo(next);if(!readOnly){setSaveStatus('Please wait — saving your details and moving to the next section…');try{await save();}catch(e){setSaveStatus(`Not saved: ${(e as Error).message}`);setTransitioningTo(null);return;}}setStep(next);if(!readOnly){const url=new URL(window.location.href);url.searchParams.set('part',String(next));window.history.replaceState(null,'',url);}setTransitioningTo(null);}
  const section=activeSections[step],visible=fields.filter(f=>section.fields.includes(f));
  return <div aria-busy={saving||transitioningTo!==null}><ol className="portal-intake-progress" aria-label="Details progress">{activeSections.map((item,i)=><li key={item.title} className={i<step?'is-complete':i===step?'is-current':''}><span>{i<step?'✓':i+1}</span><span className="portal-intake-progress-label">{item.title}</span></li>)}</ol><p>Section {step+1} of {activeSections.length}</p><h3 ref={sectionHeading} tabIndex={-1}>{section.title}</h3><p role="status" aria-live="polite">{readOnly?'Staff view — read only':saveStatus}</p><p>Your details save as you go. Select Save and continue to move on.</p>{transitioningTo!==null&&<p className="portal-transition-status" role="status" aria-live="assertive">Please wait — saving your details and moving to the next section. Do not go back or refresh.</p>}
    {readOnly&&<div className="portal-nav">{sections.map((s,i)=><button key={s.title} type="button" aria-pressed={step===i} disabled={saving} onClick={()=>void move(i)}>{i+1}. {s.title}</button>)}</div>}
    <p className="portal-required-legend">* Required</p><QuestionnaireFields fields={visible} answers={answers} clientEmail={clientEmail} readOnly={readOnly} allowIncomplete={allowIncomplete} onChange={(field,value)=>{const next={...latest.current,[field]:value};latest.current=next;setAnswers(next);setSaveStatus('Changes waiting to save…');}}/>
    {minimal&&<details><summary>Additional details (complete now or later)</summary><p>Complete the remaining Form W-7 details now if you have them. Our CAA team will review any items you are unsure about. U.S. visa details are only needed if you have a U.S. visa.</p><QuestionnaireFields fields={fields.filter(f=>!basicIntakeFields.includes(f as typeof basicIntakeFields[number]))} answers={answers} clientEmail={clientEmail} readOnly={readOnly} allowIncomplete onChange={(field,value)=>{const next={...latest.current,[field]:value};latest.current=next;setAnswers(next);setSaveStatus('Changes waiting to save…');}}/></details>}
    <div className="portal-actions">{step===0&&onBack&&<button className="portal-secondary" disabled={saving||transitioningTo!==null} onClick={onBack}>Back to engagement</button>}{step>0&&<button disabled={saving||transitioningTo!==null} onClick={()=>void move(step-1)}>Previous</button>}{step<activeSections.length-1?<button disabled={saving||transitioningTo!==null} onClick={()=>void move(step+1)}>{saving||transitioningTo!==null?'Please wait — moving to next section…':'Save and continue'}</button>:<button disabled={saving||transitioningTo!==null} onClick={()=>void (async()=>{try{if(!readOnly)await save();if(!readOnly&&!allowIncomplete){const missing=missingFinalIdentity(latest.current);if(missing.length){const index=sections.findIndex(s=>s.fields.some(f=>missing.includes(f)));setStep(index>=0?index:0);setSaveStatus('Complete the required Form W-7 details in this section before continuing.');return;}}onDocuments(normalizeQuestionnaireAnswers(latest.current,clientEmail) as Record<string,string>);}catch(e){setSaveStatus(`Not saved: ${(e as Error).message}`);}})()}>{saving?'Saving and opening documents…':'Continue to your documents'}</button>}{!readOnly&&<button disabled={saving||transitioningTo!==null} onClick={()=>void save().catch(e=>setSaveStatus(`Not saved: ${e.message}`))}>Save and return later</button>}</div><p role="status" aria-live="polite">{saveStatus}</p>
  </div>;
}
