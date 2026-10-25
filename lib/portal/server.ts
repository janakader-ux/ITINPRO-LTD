import { portalCaseId } from './login-link';
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
  return ['DOCUMENT_VERSION_MISMATCH','SIGN_IN_REQUIRED','STAFF_MFA_REQUIRED','CASE_NOT_FOUND','CASE_ACCESS_DENIED','PAYMENT_REQUIRED','AGREEMENT_REQUIRED','UNKNOWN_APPLICATION_ROUTE','UPLOADS_DISABLED','FILE_SIZE','FILE_TYPE','INVALID_INPUT','AGREEMENT_VERSION_MISMATCH','ANSWERS_VERSION_MISMATCH','DRAFT_VERSION_MISMATCH','SANDBOX_ONLY','ENQUIRY_ALREADY_REVIEWED','TEST_CLIENT_NOT_READY'].includes(code) ? code : 'PORTAL_TEMPORARILY_UNAVAILABLE';
}
export async function sendPortalLink(email: string, bootstrapStaff=false,caseId?:string) {
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
  const destination=portalCaseId(caseId)?`?case=${caseId}`:'';
  const link=`${origin}/portal/confirm${destination}#token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${tokenType}`;
  const resend=new Resend(process.env.RESEND_API_KEY);
  const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char));
  const emailLink=escapeHtml(link);
  const logoUrl=escapeHtml(`${origin}/email-logo-600x284.png`);
  const text=`Your ITIN PRO secure client portal is ready.

1. Open your secure sign-in link:
${link}

2. Select “Continue to sign in” on the page. Use the same browser for the link and your application.
3. Complete the steps shown: review and sign the engagement letter, enter your details, upload the requested documents, then follow the next step in the portal. Select Continue at the bottom of each step.
4. Have one non-US mailing address ready. The application cannot be submitted without it.

Testing portal: This portal is currently in sandbox mode. Use dummy details and documents only. No live payments are processed.

This sign-in link is single-use; do not forward it. If you did not request this email, ignore it. Never send passports or tax documents by email.

ITIN PRO
enquiries@itinpro.uk`;
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>ITIN PRO secure portal sign-in</title></head>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#172b4d;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f5f9;"><tr><td align="center" style="padding:32px 14px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #e3e9f0;border-radius:12px;">
<tr><td align="center" style="padding:28px 28px 18px;"><img src="${logoUrl}" width="168" alt="ITIN PRO — Certified Acceptance Agents" style="display:block;width:168px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:8px 34px 30px;font-size:16px;line-height:1.65;">
<p style="margin:0 0 8px;color:#52657c;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Secure client portal</p>
<h1 style="margin:0 0 14px;color:#142b4a;font-size:28px;line-height:1.25;">Your ITIN PRO portal is ready</h1>
<p style="margin:0 0 22px;">Use the secure link below to sign in and continue your ITIN application.</p>
<p style="margin:0 0 28px;text-align:center;"><a href="${emailLink}" style="display:inline-block;background:#155eef;border-radius:8px;color:#fff;text-decoration:none;font-size:17px;font-weight:700;padding:15px 26px;">Open your secure portal</a></p>
<h2 style="margin:0 0 12px;color:#142b4a;font-size:20px;">How to get started</h2>
<ol style="margin:0 0 22px;padding-left:24px;"><li style="padding-bottom:10px;">Open the secure portal using the button above.</li><li style="padding-bottom:10px;">Select <strong>Continue to sign in</strong>. Use the same browser for the email link and your application.</li><li style="padding-bottom:10px;">Follow the portal steps: review and sign the engagement letter, enter your details, upload requested documents, and continue through the next step shown. Select <strong>Continue</strong> at the bottom of each step.</li><li>Have one non-US mailing address ready. The application cannot be submitted without it.</li></ol>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;background:#fff7e6;border:1px solid #f4d58b;border-radius:8px;"><tr><td style="padding:14px 16px;color:#59410b;font-size:15px;line-height:1.55;"><strong>Testing portal:</strong> Use dummy details and documents only. No live payments are processed.</td></tr></table>
<p style="margin:0 0 12px;font-size:14px;color:#52657c;">This single-use sign-in link is private. Do not forward it. If you did not request this email, you can ignore it.</p>
<p style="margin:0;font-size:14px;color:#52657c;">For your security, never send passports or tax documents by email. Need help? Contact <a href="mailto:enquiries@itinpro.uk" style="color:#155eef;">enquiries@itinpro.uk</a>.</p>
</td></tr>
<tr><td style="padding:18px 34px;background:#f7f9fc;border-top:1px solid #e8edf3;border-radius:0 0 12px 12px;color:#52657c;font-size:13px;">ITIN PRO · Secure client portal</td></tr>
</table><p style="margin:16px 0 0;color:#738196;font-size:12px;line-height:1.5;">If the button does not work, copy and paste this link into your browser:<br><a href="${emailLink}" style="color:#155eef;word-break:break-all;">${emailLink}</a></p>
</td></tr></table></body></html>`;
  const sent=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL || 'ITIN PRO <enquiries@itinpro.uk>',to:email,
    subject:'ITIN PRO secure portal — sign in',text,html});
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

