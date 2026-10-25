'use client';
import { useState } from 'react';
import { documentStatusOptions,documentResponse,type DocumentStatus as Status } from '@/lib/portal/answer-support';
export function DocumentStatus({initial,uploaded,optional=false,busy,onBack,onContinue,last}:{initial?:{status:Status;note:string};uploaded:boolean;optional?:boolean;busy:boolean;onBack:()=>void;onContinue:(response:ReturnType<typeof documentResponse>|null)=>Promise<void>;last:boolean}){
  const [status,setStatus]=useState<Status|''>(initial?.status||''),[note,setNote]=useState(initial?.note||'');
  return <form className="portal-document-status" onSubmit={e=>{e.preventDefault();void onContinue(status?documentResponse(status,note):null);}}>
    <label>{uploaded?'If you need to explain this upload, choose a status (optional)':optional?'Optional status (if you want to add a note)':'If you cannot upload this document now, choose a reason to continue'}<select name="documentStatus" required={!uploaded&&!optional} disabled={busy} value={status} onChange={e=>setStatus(e.target.value as Status|'')}><option value="">{uploaded?'File received — awaiting team review':optional?'Optional — you can continue without this document':'Choose an option to continue'}</option>{documentStatusOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <p role="status" aria-live="polite">{uploaded?'Your file has been received and is awaiting team review. Select Save and continue to next document below.':optional?'This document is optional. You can leave the status blank and continue.':'Upload the file above, or choose a reason here if you need to provide it later. Required evidence must be resolved before IRS submission.'}</p>
    <label>Note for your adviser (optional)<textarea name="documentNote" maxLength={500} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></label>
    <div className="portal-actions"><button type="button" className="portal-secondary" disabled={busy} onClick={onBack}>Back</button><button disabled={busy}>{last?'Finish uploads and review':'Save and continue to next document'}</button></div>
  </form>;
}
