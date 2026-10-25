'use client';
import { useState } from 'react';
import { documentStatusOptions,documentResponse,type DocumentStatus as Status } from '@/lib/portal/answer-support';
export function DocumentStatus({initial,uploaded,optional=false,busy,onBack,onContinue,onMoreDocuments,onFinish,last}:{initial?:{status:Status;note:string};uploaded:boolean;optional?:boolean;busy:boolean;onBack:()=>void;onContinue:(response:ReturnType<typeof documentResponse>|null)=>Promise<void>;onMoreDocuments:()=>void;onFinish:()=>void;last:boolean}){
  const [status,setStatus]=useState<Status|''>(initial?.status||''),[note,setNote]=useState(initial?.note||'');
  if(uploaded)return <section className="portal-document-status portal-upload-next" aria-labelledby="other-documents-question">
    <fieldset disabled={busy}>
      <legend id="other-documents-question">Do you have any other documents to upload?</legend>
      <p>Your file is received. Choose Yes to continue to another document upload, or No to finish uploads and move on.</p>
      <div className="portal-actions">
        <button type="button" onClick={onMoreDocuments}>Yes — upload another document</button>
        <button type="button" className="portal-secondary" onClick={onFinish}>No — review and continue</button>
      </div>
    </fieldset>
  </section>;
  return <form className="portal-document-status" onSubmit={e=>{e.preventDefault();void onContinue(status?documentResponse(status,note):null);}}>
    <label>{optional?'Optional status (if you want to add a note)':'If you cannot upload this document now, choose a reason to continue'}<select name="documentStatus" required={!optional} disabled={busy} value={status} onChange={e=>setStatus(e.target.value as Status|'')}><option value="">{optional?'Optional — you can continue without this document':'Choose an option to continue'}</option>{documentStatusOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <p role="status" aria-live="polite">{optional?'This document is optional. You can leave the status blank and continue.':'Upload the file above, or choose a reason here if you need to provide it later. Required evidence must be resolved before IRS submission.'}</p>
    <label>Note for your adviser (optional)<textarea name="documentNote" maxLength={500} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></label>
    <div className="portal-actions"><button type="button" className="portal-secondary" disabled={busy} onClick={onBack}>Back</button><button disabled={busy}>{last?'Finish uploads and review':'Save and continue to next document'}</button></div>
  </form>;
}