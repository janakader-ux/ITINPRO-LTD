import { reviewerEmail, submissionFields } from '@/lib/reviewer-email';
import { simpleIntakeSchema, normalizeSimpleIntake } from '@/lib/service-intake';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';
import { getItinCategory, formatItinFee, serviceFeeScope, additionalChargesNotice, otherCategoryNotice } from '@/lib/itin-pricing';
import { paymentConfigurationReady } from '@/lib/payments';
import { createCheckoutToken } from '@/lib/payment-security';
import { createReviewedCase } from '@/lib/portal/create-reviewed-case';
import { portalEnabled } from '@/lib/portal/server';
import { eligibilityIntakeSchema, normalizeEligibilityIntake, selfServiceReady } from '@/lib/eligibility-intake';

const schema = z.object({
  name: z.string().trim().min(2).max(100), email: z.email(),
  phone: z.string().max(40).optional(), reason: z.string().min(2).max(120),
  serviceCategory: z.string().refine(id => Boolean(getItinCategory(id)), 'Unknown service category'),
  llcAndEinConfirmed: z.literal('yes').optional(),
  location: z.string().trim().min(2).max(120), appointment: z.string().max(120).optional(),
  message: z.string().trim().min(10).max(3000), consent: z.literal('yes'),
  website: z.string().max(0).optional(),
});

// Log diagnostic codes only, never submitted details, credentials or provider error bodies.
function logFailure(stage: string, requestId: string, error: unknown) {
  const detail = error as { code?: string; name?: string; statusCode?: number; message?: string } | null;
  const message = detail?.message || '';
  const configurationCode = /Invalid supabaseUrl/i.test(message) ? 'INVALID_SUPABASE_URL' :
    /supabaseKey.*required/i.test(message) ? 'INVALID_SUPABASE_KEY' :
    /API key is invalid|invalid.*API key|invalid_api_key/i.test(message) ? 'INVALID_EMAIL_API_KEY' :
    /domain.*not verified|not verified.*domain/i.test(message) ? 'SENDER_DOMAIN_NOT_VERIFIED' :
    /invalid.*from|from.*invalid/i.test(message) ? 'INVALID_EMAIL_FROM' :
    /invalid.*to.*field|to.*field.*invalid/i.test(message) ? 'INVALID_EMAIL_RECIPIENTS' :
    /only send.*own email|testing emails/i.test(message) ? 'EMAIL_TESTING_RESTRICTION' : undefined;
  console.error('itinpro_enquiry_failure', JSON.stringify({ stage, requestId,
    code: detail?.code?.slice(0,40) || configurationCode, name: detail?.name?.slice(0,60), status: detail?.statusCode }));
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Please submit a valid form.', requestId }, { status: 400 }); }
  const isSimple = Boolean(body && typeof body === 'object' && 'flowVersion' in body);
  const isEligibility = !!body && typeof body==='object' && 'flowVersion' in body && body.flowVersion==='eligibility-v2';
  const eligibility=isEligibility?eligibilityIntakeSchema.safeParse(body):undefined;
  const simple = isSimple&&!isEligibility ? simpleIntakeSchema.safeParse(body) : undefined;
  const parsed = eligibility ? (eligibility.success?{success:true as const,data:normalizeEligibilityIntake(eligibility.data)}:eligibility) : simple ? (simple.success ? { success: true as const, data: normalizeSimpleIntake(simple.data) } : simple) : schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form details.',
    fields: [...new Set(parsed.error.issues.map(issue => String(issue.path[0])))], requestId }, { status: 400 });
  const input = parsed.data;
  const category = getItinCategory(input.serviceCategory)!;
  if (!isSimple && category.id === 'llc-bank-account' && input.llcAndEinConfirmed !== 'yes')
    return NextResponse.json({ error: 'An LLC and EIN are required for this category', requestId }, { status: 400 });
  const reason = `${isSimple ? input.reason : category.label} — ${isEligibility?`indicative ${formatItinFee(category.amount)} — engagement before payment`:formatItinFee(category.amount)}`;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!url || !key) {
    logFailure('configuration', requestId, { code: !url ? 'SUPABASE_URL_MISSING' : 'SUPABASE_KEY_MISSING' });
    return NextResponse.json({ error: 'The enquiry service is temporarily unavailable. Please email us.', requestId }, { status: 503 });
  }
  let enquiryId: string;
  let databaseStage = 'database_client';
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    databaseStage = 'database_write';
    const { data, error } = await supabase.from('enquiries').insert({ name: input.name,
      email: input.email, phone: input.phone || null, reason, location: input.location,
      appointment: input.appointment || null, message: input.message,
      consented_at: new Date().toISOString(),...('intake' in input?{intake:input.intake}:{}) }).select('id').single();
    if (error) throw error;
    enquiryId = data.id;
  } catch (error) {
    logFailure(databaseStage, requestId, error);
    return NextResponse.json({ error: 'Your enquiry could not be saved. Please try again or email us.', requestId }, { status: 503 });
  }
  let notification: 'sent' | 'pending' = 'pending';
  try {
    if (!resendKey) throw { code: 'RESEND_KEY_MISSING' };
    const resend = new Resend(resendKey);
    const to = (process.env.ENQUIRY_RECIPIENTS || 'Shan@itinpro.uk,Taz@itinpro.uk').split(',').map(x => x.trim()).filter(Boolean);
    const testPrefix = input.message.startsWith('AUTOMATED TEST ONLY') ? '[AUTOMATED TEST ONLY] ' : '';
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL?.trim() || 'enquiries@itinpro.uk', to, replyTo: input.email,
      subject: `${testPrefix}New ITIN Pro enquiry — ${reason}`,
      ...reviewerEmail('New ITIN PRO submission', [
        {question:'Reference',answer:enquiryId},
        {question:'Client name',answer:input.name},
        {question:'Email address',answer:input.email},
        {question:'Phone number',answer:input.phone || 'Not provided'},
        {question:'Location',answer:input.location},
        {question:'Appointment preference',answer:input.appointment || 'Not specified'},
        {question:'Service and indicative fee',answer:reason},
        ...submissionFields(input.message,isSimple),
        {question:'Service scope',answer:serviceFeeScope(category.id)},
        {question:'Additional charges',answer:additionalChargesNotice},
        ...(category.id==='other'?[{question:'Adviser assessment required',answer:otherCategoryNotice,attention:true}]:[]),
      ]),
    }, { idempotencyKey: `enquiry/${enquiryId}` });
    if (error) throw error;
    notification = 'sent';
    console.info('itinpro_enquiry_notification', JSON.stringify({ requestId, enquiryId, emailId: data?.id }));
  } catch (error) { logFailure('email', requestId, error); }
  // Accept saved enquiries even if staff email fails; do not invite duplicate submissions.
  console.info('itinpro_enquiry_saved', JSON.stringify({ requestId, enquiryId, notification }));
  let journey: 'assisted'|'self-service' = 'assisted';
  let caseId:string|undefined;
  const automaticIntake=eligibility?.success?normalizeEligibilityIntake(eligibility.data).intake:undefined;
  if(automaticIntake?.testOnly&&portalEnabled()&&selfServiceReady(automaticIntake)){
    const onboarding=automaticIntake.onboarding!;
    try{
      const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      const created=await createReviewedCase(db,null,{enquiryId,routeId:automaticIntake.applicationRoute,legalName:input.name,address:onboarding.address,taxYear:onboarding.taxYear,screening:{ssnIneligible:true,federalTaxPurpose:true,evidenceRoute:['prepared-1040nr','spouse','renewal'].includes(automaticIntake.applicationRoute)?'tax-return':'exception',evidenceNotes:'Client declarations passed automated onboarding screening; final CAA review remains required.',originalsExplained:true,feesExplained:true}});
      caseId=created.caseId;
      journey='self-service';
    }catch(error){logFailure('automatic_engagement',requestId,error);}
  }
  const checkoutToken = !isSimple && category.amount !== null && paymentConfigurationReady()
    ? createCheckoutToken(enquiryId, category.id, process.env.PAYMENT_TOKEN_SECRET!) : undefined;
  return NextResponse.json({ ok: true, enquiryId, notification, requestId, checkoutToken, journey, caseId }, { status: 201 });
}

