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
  const htmlLink=link.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const html=`<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your ITIN PRO client portal access</title></head>
<body style="margin:0;padding:24px 12px;background:#f3f5f8;font-family:Arial,Helvetica,sans-serif;color:#12233b;font-size:17px;line-height:1.6;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">Use your secure link to open your ITIN PRO client portal.</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border:1px solid #d9e0e8;border-radius:12px;background:#ffffff;border-collapse:separate;">
        <tr><td align="center" style="padding:28px 28px 12px;">
          <a href="https://itinpro.uk/" style="text-decoration:none;">
            <img src="https://itinpro.uk/email-logo-420x199.png" width="210" alt="ITIN PRO — Certified Acceptance Agent support" style="display:block;width:210px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
          </a>
        </td></tr>
        <tr><td style="padding:14px 36px 32px;">
          <h1 style="margin:0 0 18px;color:#071b31;font-size:26px;line-height:1.25;font-weight:700;">Your ITIN PRO client portal access</h1>
          <p style="margin:0 0 16px;">Thank you for choosing ITIN PRO. Use the secure link below to sign in to your client portal and continue your application.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
            <tr><td align="center" bgcolor="#087a50" style="border-radius:7px;">
              <a href="${htmlLink}" style="display:inline-block;padding:15px 24px;border:1px solid #087a50;border-radius:7px;background:#087a50;color:#ffffff;font-size:17px;font-weight:700;line-height:1.3;text-align:center;text-decoration:none;">Open my secure client portal</a>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;font-weight:700;">If the button does not open, copy this link into your browser:</p>
          <p style="margin:0 0 20px;word-break:break-all;font-size:14px;line-height:1.5;"><a href="${htmlLink}" style="color:#075fc2;">${htmlLink}</a></p>
          <p style="margin:0 0 14px;padding:14px 16px;border-left:3px solid #c7a04b;background:#f7f8fa;color:#334155;font-size:15px;">This link is single-use and should not be forwarded. If you did not request access, you can ignore this email.</p>
          <p style="margin:0;color:#5b6675;font-size:15px;">For your security, do not reply with passports or tax documents. Upload documents only through the secure client portal.</p>
        </td></tr>
        <tr><td style="padding:17px 28px;border-top:1px solid #e5eaf0;background:#f8fafc;color:#5b6675;text-align:center;font-size:13px;line-height:1.5;">ITIN PRO · Independent UK service providing Certifying Acceptance Agent support.<br>ITIN PRO is not the IRS and does not issue or guarantee ITINs.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const sent=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL || 'ITIN PRO <enquiries@itinpro.uk>',to:email,
    subject:'Your secure ITIN PRO client portal access',
    text:`Thank you for choosing ITIN PRO. Use this secure, single-use link to sign in to your client portal and continue your application:\n\n${link}\n\nIf you did not request access, you can ignore this email. Do not forward the link. For your security, do not reply with passports or tax documents; upload documents only through the secure client portal.`,
    html});
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

