import type { paymentDatabase } from '../payments';
import { documentHash } from './validation';
import { makeInstructionSnapshot,type DocumentIntake,type InstructionSnapshot } from './instructions';
type Admin=ReturnType<typeof paymentDatabase>;
type CaseInfo={id:string;route_id:string;workflow?:string;owner_id:string};
export async function readDocumentIntake(admin:Admin,c:CaseInfo):Promise<DocumentIntake|null>{
  const r=await admin.from('portal_document_intake').select('*').eq('case_id',c.id).maybeSingle();if(r.error)throw r.error;
  if(!r.data?.instruction_version_id)return null;
  const v=await admin.from('portal_instruction_versions').select('snapshot').eq('id',r.data.instruction_version_id).eq('case_id',c.id).single();if(v.error)throw v.error;
  return {...r.data,snapshot:v.data.snapshot as InstructionSnapshot};
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
