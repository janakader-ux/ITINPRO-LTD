import { NextResponse } from 'next/server';
import { z } from 'zod';
import { portalEnabled,portalSession,portalBucket,safePortalError } from '@/lib/portal/server';
export const runtime='nodejs';
export async function GET(request:Request) {
  try {
    if(!portalEnabled())throw new Error('SANDBOX_ONLY');
    const s=await portalSession();const id=z.uuid().parse(new URL(request.url).searchParams.get('id'));
    const {data:doc,error}=await s.db.from('portal_documents').select('path,name').eq('id',id).maybeSingle();
    if(error || !doc)throw new Error('CASE_NOT_FOUND');
    // The session's Storage RLS must also allow the object. Never mint a service-role URL.
    const file=await s.db.storage.from(portalBucket).download(doc.path);
    if(file.error || !file.data)throw new Error('CASE_NOT_FOUND');
    return new Response(await file.data.arrayBuffer(),{headers:{'Content-Type':'application/octet-stream',
      'Content-Disposition':`attachment; filename="${doc.name.replace(/[^a-zA-Z0-9._ -]/g,'_')}"`,
      'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
  }catch(error){return NextResponse.json({error:safePortalError(error)},{status:404,headers:{'Cache-Control':'no-store'}});}
}
