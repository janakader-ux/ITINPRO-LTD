'use client';
import { useEffect,useState } from 'react';
import { applicationRoutes,routeFee } from '@/lib/portal/checklists';
import { portalPost } from './PortalApp';
type Enquiry={id:string;name:string;reason:string;message:string;intake:{applicationRoute?:string;basic?:Record<string,string>}};
export function EnquiryReview({onCreated}:{onCreated:(id:string)=>void}){
  const [enquiries,setEnquiries]=useState<Enquiry[]>([]),[selected,setSelected]=useState(''),[routeId,setRouteId]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const enquiry=enquiries.find(e=>e.id===selected),route=applicationRoutes.find(r=>r.id===routeId);
  async function load(){const r=await fetch('/api/portal/cases?enquiries=yes',{cache:'no-store'});const x=await r.json();if(!r.ok)throw new Error(x.error);setEnquiries(x.enquiries||[]);}
  useEffect(()=>{void load().catch(e=>setMessage(e.message));},[]);
  function choose(id:string){setSelected(id);const e=enquiries.find(x=>x.id===id);setRouteId(applicationRoutes.some(r=>r.id===e?.intake.applicationRoute)?e!.intake.applicationRoute!:'');setMessage('');}
  return <section className="portal-panel"><h2>Review an eligibility enquiry</h2><p>Confirm the tax purpose, evidence and complete fee before issuing the engagement. No payment is needed to create this case.</p><p className="portal-test">Only synthetic ITIN enquiries appear here. Use the <a href="/?sandbox=1#enquiry">sandbox enquiry form</a> with a TEST name, an example.com email and dummy details. EIN and tax-return engagements remain separate.</p>{message&&<p role="status">{message}</p>}
    <button disabled={busy} onClick={()=>void load().catch(e=>setMessage(e.message))}>Refresh enquiries</button>
    <label>Enquiry<select value={selected} onChange={e=>choose(e.target.value)}><option value="">Select a synthetic enquiry</option>{enquiries.map(e=><option key={e.id} value={e.id}>{e.name} — {e.reason}</option>)}</select></label>
    {enquiry&&<><details open><summary>Enquiry answers</summary><p style={{whiteSpace:'pre-wrap'}}>{enquiry.message}</p></details>
      <form key={selected} onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setMessage('');try{
        const x=await portalPost({action:'review-enquiry',input:{enquiryId:selected,routeId,legalName:f.get('legalName'),address:f.get('address'),taxYear:Number(f.get('taxYear')),
          screening:{ssnIneligible:f.has('ssn'),federalTaxPurpose:f.has('purpose'),evidenceRoute:f.get('evidenceRoute'),evidenceNotes:f.get('evidenceNotes'),originalsExplained:f.has('originals'),feesExplained:f.has('fees')}}});
        onCreated(x.caseId);
      }catch(err){setMessage((err as Error).message);}finally{setBusy(false);}}}>
        <label>Reviewed ITIN route<select required value={routeId} onChange={e=>setRouteId(e.target.value)}><option value="">Choose after review</option>{applicationRoutes.map(r=><option key={r.id} value={r.id}>{r.title} — £{routeFee(r.id)/100}</option>)}</select></label>
        {route&&<div className="portal-test"><strong>CAA review points</strong><ul>{route.review.map(x=><li key={x}>{x}</li>)}</ul><p>W-7/CAA fee: £{routeFee(route.id)/100}, all-inclusive, no VAT. Tax-return preparation and agreed travel/courier work are separate.</p></div>}
        <label>Confirmed applicant legal name<input name="legalName" defaultValue={enquiry.name} required minLength={2} maxLength={100}/></label>
        <label>Address for the engagement<textarea name="address" required minLength={10} maxLength={500} placeholder="Synthetic address for this test"/></label>
        <label>Tax year / distribution year<input type="number" name="taxYear" defaultValue={new Date().getFullYear()} min="2000" max={new Date().getFullYear()+1} required/></label>
        <label>Reviewed evidence route<select name="evidenceRoute" required><option value="">Choose one</option><option value="tax-return">Application with a prepared tax return</option><option value="exception">Reviewed IRS exception and supporting evidence</option></select></label>
        <label>Review notes: tax purpose, evidence and any separately quoted work<textarea name="evidenceNotes" required minLength={10} maxLength={1000}/></label>
        <label><input name="ssn" type="checkbox" required/> I checked that the applicant has no SSN, is not eligible for one and has no pending SSN application.</label>
        <label><input name="purpose" type="checkbox" required/> I reviewed the federal tax purpose and applicable evidence route.</label>
        <label><input name="originals" type="checkbox" required/> I explained original-document inspection, the interview and final wet signatures.</label>
        <label><input name="fees" type="checkbox" required/> I confirmed the service fee, exclusions and any separately agreed charges with the applicant.</label>
        <button disabled={busy||!route}>Issue engagement and invite test client</button>
      </form></>}
  </section>;
}
