import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentDatabase } from '@/lib/payments';
import { portalEnabled,portalSession,safePortalError } from '@/lib/portal/server';
import { ensureDocumentIntake } from '@/lib/portal/document-intake-server';
import type { InstructionSnapshot } from '@/lib/portal/instructions';
export const runtime='nodejs';
export async function GET(request:Request){
  try{
    if(!portalEnabled())throw new Error('SANDBOX_ONLY');
    const s=await portalSession(),params=new URL(request.url).searchParams,id=z.uuid().parse(params.get('caseId'));
    const {data:c,error}=await s.db.from('portal_cases').select('id,route_id,owner_id,workflow').eq('id',id).maybeSingle();
    if(error||!c)throw new Error('CASE_NOT_FOUND');
    let snapshot:InstructionSnapshot;
    if(params.has('versionId')){
      const versionId=z.uuid().parse(params.get('versionId'));
      const v=await s.db.from('portal_instruction_versions').select('snapshot').eq('id',versionId).eq('case_id',id).maybeSingle();
      if(v.error||!v.data)throw new Error('CASE_NOT_FOUND');snapshot=v.data.snapshot;
    }else snapshot=(await ensureDocumentIntake(paymentDatabase(),c)).snapshot;
    const headers:Record<string,string>={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
    if(params.get('format')==='docx'){
      const file=params.get('kind')==='letter'?snapshot.letterFile:snapshot.instructionFile;
      if(!file||!/^\d{4}-\d{2}-\d{2}\.\d+\/[A-D]\d{1,2}-(instructions|letter)\.docx$/.test(file))throw new Error('INVALID_INPUT');
      const bytes=await readFile(join(process.cwd(),'docs','client-instructions',file));
      const expected=params.get('kind')==='letter'?snapshot.letterFileHash:snapshot.instructionFileHash;
      if(!expected||createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error('ARCHIVED_FILE_CHANGED');
      headers['Content-Type']='application/vnd.openxmlformats-officedocument.wordprocessingml.document';headers['Content-Disposition']=`attachment; filename="ITIN-PRO-${file.split('/')[1]}"`;
      return new Response(new Uint8Array(bytes),{headers});
    }
    headers['Content-Type']='text/plain; charset=utf-8';headers['Content-Disposition']=`attachment; filename="ITIN-PRO-${snapshot.category||'case'}-${snapshot.version}-Instructions.txt"`;
    return new Response(snapshot.text,{headers});
  }catch(error){return NextResponse.json({error:safePortalError(error)},{status:404,headers:{'Cache-Control':'no-store'}});}
}
