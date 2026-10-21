'use client';
import { useState } from 'react';
import { documentStatusOptions,documentResponse,type DocumentStatus as Status } from '@/lib/portal/answer-support';
export function DocumentStatus({initial,uploaded,busy,onBack,onContinue,last}:{initial?:{status:Status;note:string};uploaded:boolean;busy:boolean;onBack:()=>void;onContinue:(response:ReturnType<typeof documentResponse>|null)=>Promise<void>;last:boolean}){
  const [status,setStatus]=useState<Status|''>(initial?.status||''),[note,setNote]=useState(initial?.note||'');
  return <form className="portal-document-status" onSubmit={e=>{e.preventDefault();void onContinue(status?documentResponse(status,note):null);}}>
    <label>Document status{!uploaded?' — choose an option if you are not uploading now':''}<select name="documentStatus" required={!uploaded} disabled={busy} value={status} onChange={e=>setStatus(e.target.value as Status|'')}><option value="">{uploaded?'Uploaded — ready to continue':'Please select'}</option>{documentStatusOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <p>You can continue with any of these choices. Our team will review your response; required evidence must still be resolved before IRS submission.</p>
    <label>Note for your adviser (optional)<textarea name="documentNote" maxLength={500} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></label>
    <div className="portal-actions"><button type="button" className="portal-secondary" disabled={busy} onClick={onBack}>Back</button><button disabled={busy}>{last?'Save and continue to final check':'Save and next document'}</button></div>
  </form>;
}
