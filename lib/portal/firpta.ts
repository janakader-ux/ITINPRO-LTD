import { z } from 'zod';
import type { Requirement } from './checklists';
export const firptaInput=z.object({service:z.enum(['itin-only','itin-and-return']),role:z.enum(['seller','buyer']),completed:z.boolean(),transactionYear:z.number().int().min(2000).max(new Date().getUTCFullYear()+1),purpose:z.enum(['reporting','certificate','nonrecognition','refund']),foreignSeller:z.enum(['yes','no','not-sure']).optional(),returnPreparation:z.enum(['already-prepared','request-quote']).optional()}).strict().superRefine((v,ctx)=>{
  if(v.service==='itin-and-return'&&(v.role!=='seller'||!v.completed||v.purpose!=='refund'||!v.returnPreparation))ctx.addIssue({code:'custom',message:'A refund-return request requires a completed sale by the seller and a return-preparation choice.'});
  if(v.service==='itin-only'&&v.purpose==='refund')ctx.addIssue({code:'custom',message:'Choose ITIN and tax return for a refund-return request.'});
  if(v.role==='buyer'&&!v.foreignSeller)ctx.addIssue({code:'custom',message:'Confirm whether the seller is a foreign person.'});
  if(!v.completed&&v.purpose==='reporting')ctx.addIssue({code:'custom',message:'For a transaction before completion, ask your adviser about the withholding-certificate route.'});
});
export type FirptaSelection=z.infer<typeof firptaInput>;
export type FirptaPath='completed-sale'|'certificate'|'buyer-reporting'|'refund-return'|'nonrecognition'|'review-required';
export function firptaPath(v:FirptaSelection,now=new Date()):FirptaPath{
  if(v.role==='buyer'&&v.foreignSeller!=='yes')return 'review-required';
  if(v.service==='itin-and-return')return v.transactionYear>=now.getUTCFullYear()?'completed-sale':'refund-return';
  if(v.purpose==='certificate')return 'certificate';
  if(v.purpose==='nonrecognition')return 'nonrecognition';
  return v.role==='buyer'?'buyer-reporting':'completed-sale';
}
export const separateReturnFee='Your checkout fee covers the Form W-7 / CAA service only. If you request Form 1040-NR preparation, we will review your uploaded documents and send a separate quote and engagement. No tax-return preparation fee is included in this payment or charged without your agreement. Form 8288-B preparation or specialist certificate work, if needed, is also separately agreed.';
export function firptaTiming(v:FirptaSelection,now=new Date()){
  if(v.service!=='itin-and-return')return 'An ITIN exception application may proceed with the applicable transaction forms and evidence after adviser review. It is separate from filing an annual tax return.';
  if(v.transactionYear>=now.getUTCFullYear())return `For a ${v.transactionYear} calendar-year sale, the normal Form 1040-NR refund return is prepared and filed in ${v.transactionYear+1}, after the tax year ends and the correct final forms are available. We can review an ITIN exception application now, then quote separately for the return. A withholding-certificate or early-refund request is a different procedure and requires separate adviser review; it is not an early annual Form 1040-NR.`;
  return `For the ${v.transactionYear} sale, an eligible Form 1040-NR refund return may accompany Form W-7 once the correct final tax-year forms, withholding evidence, signed return and adviser checks are complete. Tax-return preparation is separately quoted.`;
}
const required=(id:string,title:string,instructions:string,original=false):Requirement=>({id,title,instructions,basis:'IRS',original,level:'mandatory',templateType:'evidence'});
export function firptaRequirements(v:FirptaSelection,now=new Date()):Requirement[]{
  const path=firptaPath(v,now);
  const contract=required('firpta-contract',v.role==='buyer'?'Signed purchase agreement':'Sales contract or closing statement','Upload the signed sale/purchase agreement, HUD-1 settlement statement or Closing Disclosure identifying the applicant, parties, property and relevant transaction date.');
  const withholding=[required('firpta-8288','Form 8288','Provide the completed Form 8288 filed by the buyer or closing/escrow agent.'),required('firpta-8288a','Form 8288-A','Provide the applicant-specific Form 8288-A. Each seller needs their own withholding statement. Include IRS-stamped Copy B if available; if missing, explain and ask your adviser.')];
  if(path==='review-required')return [contract];
  if(path==='certificate')return [contract,required('firpta-8288b','Completed Form 8288-B','Provide the completed withholding-certificate application requesting reduction or elimination of withholding. Form 8288-B is not a general property-purchase exemption form. Your adviser confirms the applicant and required signatory.',true)];
  if(path==='nonrecognition')return [contract,required('firpta-nonrecognition','Non-recognition notice and transaction evidence','Provide the applicable signed notice and documents supporting the specific non-recognition transaction. A general exemption claim is insufficient; specialist adviser review is required.',true)];
  if(path==='refund-return')return [contract,...withholding,required('firpta-remittance','Withholding remittance proof','Provide the closing agent’s remittance confirmation or other evidence that the withholding was paid to the IRS. We will check the withholding credit, including stamped Form 8288-A Copy B or appropriate alternative evidence.'),required('firpta-basis','Purchase cost and sale expense evidence','Provide the original acquisition closing statement, capital improvement records and sale expenses so the tax preparer can calculate gain and the correct tax liability.'),required('firpta-signed-return','Final signed Form 1040-NR and schedules','If already prepared, upload the correct tax-year return and schedules. If you requested a quote, our team will arrange this after a separate engagement. The final signed return must be reviewed before a return-based W-7 package can be submitted.',true)];
  return [contract,...withholding,{...required('firpta-remittance','Withholding remittance proof','Upload remittance evidence if available. Explain if payment is pending or you cannot obtain it; your adviser will confirm whether additional evidence is required.'),conditional:'If available or requested by the adviser',level:'conditional'}];
}
