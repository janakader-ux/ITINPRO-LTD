import { portalOrigin } from './validation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { paymentDatabase } from '../payments';
import { createHmac } from 'node:crypto';
import { Resend } from 'resend';
export const portalBucket = 'itinpro-case-files-sandbox';
export function portalEnabled() { return process.env.PORTAL_MODE === 'sandbox'; }
export function uploadsEnabled() { return portalEnabled() && process.env.PORTAL_UPLOADS_ENABLED === 'true'; }
export async function portalClient() {
  const jar = await cookies();
  const url = process.env.SUPABASE_URL?.trim(), key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('PORTAL_AUTH_NOT_CONFIGURED');
  return createServerClient(url, key, { cookies: { getAll: () => jar.getAll(), setAll: values => {
    try { values.forEach(({name,value,options}) => jar.set(name,value,{...options,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'})); }
    catch { /* Read-only server components; all session refresh/login writes happen in route handlers. */ }
  } } });
}
export async function portalSession() {
  const db = await portalClient();
  const {data,error} = await db.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) throw new Error('SIGN_IN_REQUIRED');
  const {data: account,error: accountError} = await db.from('portal_accounts').select('user_id,email,role,active').eq('user_id',data.user.id).maybeSingle();
  if (accountError || !account?.active || account.email !== data.user.email?.toLowerCase()) throw new Error('SIGN_IN_REQUIRED');
  const {data: assurance,error: assuranceError} = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) throw new Error('SIGN_IN_REQUIRED');
  return {db,user:data.user,account,staff:account.role==='staff' && assurance?.currentLevel==='aal2'};
}
export function safePortalError(error: unknown) {
  const code=(error as {message?:string})?.message || '';
  return ['SIGN_IN_REQUIRED','STAFF_MFA_REQUIRED','CASE_NOT_FOUND','CASE_ACCESS_DENIED','PAYMENT_REQUIRED','AGREEMENT_REQUIRED','UNKNOWN_APPLICATION_ROUTE','UPLOADS_DISABLED','FILE_SIZE','FILE_TYPE','INVALID_INPUT','AGREEMENT_VERSION_MISMATCH','ANSWERS_VERSION_MISMATCH','DRAFT_VERSION_MISMATCH','SANDBOX_ONLY','ENQUIRY_ALREADY_REVIEWED','TEST_CLIENT_NOT_READY'].includes(code) ? code : 'PORTAL_TEMPORARILY_UNAVAILABLE';
}
export async function sendPortalLink(email: string, bootstrapStaff=false) {
  const admin=paymentDatabase();
  const configuredStaff=(process.env.PORTAL_STAFF_EMAIL || '').trim().toLowerCase();
  const existing=await admin.from('portal_accounts').select('user_id,role,active').eq('email',email).maybeSingle();
  if (existing.error) throw existing.error;
  if (!existing.data && !(bootstrapStaff && email===configuredStaff)) return;
  if (existing.data && !existing.data.active) return;
  const key=process.env.PAYMENT_TOKEN_SECRET;
  if (!key) throw new Error('PORTAL_AUTH_NOT_CONFIGURED');
  const rateKey=createHmac('sha256',key).update(`portal-login:${email}`).digest('hex');
  const {data:allowed,error:rateError}=await admin.rpc('portal_claim_login',{p_key:rateKey});
  if (rateError) throw rateError;
  if (!allowed) return;
  // generateLink returns credentials without sending Supabase's default SMTP email.
  // Delivery uses the already configured ITIN PRO Resend sender.
  const {data,error}=await admin.auth.admin.generateLink({type:'magiclink',email});
  if (error || !data.user || !data.properties?.hashed_token) throw error || new Error('AUTH_LINK_FAILED');
  if (data.user.email?.toLowerCase() !== email) throw new Error('AUTH_EMAIL_MISMATCH');
  if (existing.data && existing.data.user_id !== data.user.id) throw new Error('AUTH_ACCOUNT_MISMATCH');
  if (!existing.data) {
    const {error:insertError}=await admin.from('portal_accounts').insert({user_id:data.user.id,email,role:'staff'});
    if (insertError) throw insertError;
  }
  const origin=portalOrigin();
  const tokenType=data.properties.verification_type;
  if(!['magiclink','signup','invite'].includes(tokenType))throw new Error('AUTH_LINK_FAILED');
  // URL fragments do not reach server access logs. Confirmation requires an explicit POST.
  const link=`${origin}/portal/confirm#token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${tokenType}`;
  const resend=new Resend(process.env.RESEND_API_KEY);
  const sent=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL || 'ITIN PRO <enquiries@itinpro.uk>',to:email,
    subject:'ITIN PRO secure portal — sign in',text:`Use this single-use link to sign in to your ITIN PRO portal:\n${link}\n\nOpen the link and select Continue to sign in. If you did not request it, ignore this email. Do not forward this link. Never reply with passports or tax documents.`});
  if (sent.error || !sent.data?.id) throw sent.error || new Error('EMAIL_NOT_ACCEPTED');
  // Provider acceptance is not evidence of inbox delivery. Never log the link/token/email.
  console.info('itinpro_portal_email_accepted',JSON.stringify({emailId:sent.data.id}));
  return {emailId:sent.data.id};
}
export async function ensurePortalBucket() {
  const admin=paymentDatabase();
  const {data,error}=await admin.storage.getBucket(portalBucket);
  if (data) { if(data.public) throw new Error('PRIVATE_BUCKET_REQUIRED'); return; }
  if (error && String(error.statusCode)!=='404' && !/not found/i.test(error.message)) throw error;
  const created=await admin.storage.createBucket(portalBucket,{public:false,fileSizeLimit:10*1024*1024,allowedMimeTypes:['application/pdf','image/jpeg','image/png']});
  if(created.error && !/already exists/i.test(created.error.message)) throw created.error;
  const checked=await admin.storage.getBucket(portalBucket);
  if(checked.error || !checked.data || checked.data.public) throw new Error('PRIVATE_BUCKET_REQUIRED');
}
