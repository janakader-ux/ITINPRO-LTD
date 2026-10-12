import { NextResponse } from 'next/server';
import { z } from 'zod';
import { portalClient, portalEnabled, portalSession, sendPortalLink,ensurePortalBucket } from '@/lib/portal/server';
import { sameOrigin } from '@/lib/portal/validation';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!portalEnabled()) return NextResponse.json({error:'Portal testing is not enabled.'},{status:503});
  if(!sameOrigin(request)) return NextResponse.json({error:'Please use the portal form.'},{status:403});
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return NextResponse.json({error:'Invalid form.'},{status:400});}
  try{
    if(body.action==='link'){
      const email=z.email().max(254).parse(body.email).toLowerCase();
      await sendPortalLink(email,true);
      return NextResponse.json({message:'If this email has portal access, a sign-in link has been sent. Check your inbox and spam folder.'});
    }
    const db=await portalClient();
    if(body.action==='confirm'){
      const hash=z.string().regex(/^[a-f0-9]{64}$/).parse(body.tokenHash);
      const type=z.enum(['magiclink','signup','invite']).parse(body.tokenType);
      const {error}=await db.auth.verifyOtp({token_hash:hash,type});
      if(error) return NextResponse.json({error:'This link has expired or has already been used. Request a new sign-in link.'},{status:400});
      await portalSession();
      return NextResponse.json({ok:true});
    }
    if(body.action==='signout'){await db.auth.signOut(); return NextResponse.json({ok:true});}
    const s=await portalSession();
    if(s.account.role!=='staff')return NextResponse.json({error:'Staff access required.'},{status:403});
    if(body.action==='mfa-enroll'){
      const {data:factors,error:factorError}=await db.auth.mfa.listFactors();
      if(factorError)throw factorError;
      const factor=factors.totp.find(x=>x.status==='verified');
      if(factor)return NextResponse.json({factorId:factor.id,enrolled:true});
      // Remove only this session's abandoned, unverified factors to allow setup retry.
      for(const f of factors.all.filter(x=>x.factor_type==='totp' && x.status==='unverified')) await db.auth.mfa.unenroll({factorId:f.id});
      const {data,error}=await db.auth.mfa.enroll({factorType:'totp',friendlyName:'ITIN PRO staff',issuer:'ITIN PRO'});
      if(error)throw error;
      return NextResponse.json({factorId:data.id,qrCode:data.totp.qr_code,secret:data.totp.secret});
    }
    if(body.action==='mfa-verify'){
      const factorId=z.uuid().parse(body.factorId),code=z.string().regex(/^\d{6}$/).parse(body.code);
      const {error}=await db.auth.mfa.challengeAndVerify({factorId,code});
      if(error)return NextResponse.json({error:'Check the authenticator code and try again.'},{status:400});
      // Provision only our sandbox private bucket, after the staff member proves MFA.
      await ensurePortalBucket();
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:'Invalid action.'},{status:400});
  }catch{
    // Never log provider errors that could contain email addresses or auth tokens.
    return NextResponse.json({error:'Unable to complete sign-in. Please try again or contact ITIN PRO.'},{status:503});
  }
}
