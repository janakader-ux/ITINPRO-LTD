import type { paymentDatabase } from '../payments';
import { documentHash } from './validation';
import { makeInstructionSnapshot,type DocumentIntake,type InstructionSnapshot } from './instructions';
import { checklistVersion,passportInstructions } from './checklists';
type Admin=ReturnType<typeof paymentDatabase>;
type CaseInfo={id:string;route_id:string;workflow?:string;owner_id:string};
export async function readDocumentIntake(admin:Admin,c:CaseInfo):Promise<DocumentIntake|null>{
  const r=await admin.from('portal_document_intake').select('*').eq('case_id',c.id).maybeSingle();if(r.error)throw r.error;
  if(!r.data?.instruction_version_id)return null;
  const v=await admin.from('portal_instruction_versions').select('snapshot').eq('id',r.data.instruction_version_id).eq('case_id',c.id).single();if(v.error)throw v.error;
  const stored=v.data.snapshot as InstructionSnapshot;
  const snapshot:InstructionSnapshot={...stored,version:checklistVersion,requirements:stored.requirements.map(item=>item.id==='passport-spread'?{...item,title:'Passport scan (for the ITIN applicant)',instructions:passportInstructions}:item.id==='address-evidence'?{...item,title:'Proof of address (for the ITIN applicant, optional)',instructions:'Not mandatory. If you have a joint bank account statement or joint utility bill showing the ITIN applicant’s name and address, you may upload it for ITIN PRO’s internal records and AML checks. Do not obtain a new document just for this request. It does not replace any IRS-required evidence.',conditional:'Optional — internal records and AML checks only',level:'optional' as const}:item)};
  return {...r.data,snapshot};
}
export async function ensureDocumentIntake(admin:Admin,c:CaseInfo):Promise<DocumentIntake>{
  const ready=await readDocumentIntake(admin,c);if(ready)return ready;
  const existing=await admin.from('portal_document_intake').select('*').eq('case_id',c.id).maybeSingle();if(existing.error)throw existing.error;
  const snapshot=makeInstructionSnapshot(c.route_id,existing.data?.category,null,c.workflow);
  const r=await admin.rpc('portal_save_document_intake',{p_case:c.id,p_actor:c.owner_id,p_revision:existing.data?.revision||0,p_value:{category:snapshot.category,firpta:null,responses:existing.data?.responses||{},applicability:{}},p_snapshot:snapshot,p_hash:documentHash(snapshot),p_action:'initialize'});
  if(r.error)throw r.error;return (await readDocumentIntake(admin,c))!;
}
export async function saveDocumentIntake(admin:Admin,c:CaseInfo,actor:string,previous:DocumentIntake,value:Record<string,unknown>,snapshot:InstructionSnapshot|null,action:string){
  const r=await admin.rpc('portal_save_document_intake',{p_case:c.id,p_actor:actor,p_revision:previous.revision,p_value:value,p_snapshot:snapshot,p_hash:snapshot?documentHash(snapshot):null,p_action:action});
  if(r.error)throw new Error(/DOCUMENT_VERSION_MISMATCH/.test(r.error.message)?'DOCUMENT_VERSION_MISMATCH':'INVALID_INPUT');return r.data;
}
