import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';
import { getItinCategory, formatItinFee, serviceFeeScope, additionalChargesNotice, otherCategoryNotice } from '@/lib/itin-pricing';

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
  const detail = error as { code?: string; name?: string; statusCode?: number } | null;
  console.error('itinpro_enquiry_failure', JSON.stringify({ stage, requestId,
    code: detail?.code?.slice(0,40), name: detail?.name?.slice(0,60), status: detail?.statusCode }));
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Please submit a valid form.', requestId }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form details.',
    fields: [...new Set(parsed.error.issues.map(issue => String(issue.path[0])))], requestId }, { status: 400 });
  const input = parsed.data;
  const category = getItinCategory(input.serviceCategory)!;
  if (category.id === 'llc-bank-account' && input.llcAndEinConfirmed !== 'yes')
    return NextResponse.json({ error: 'An LLC and EIN are required for this category', requestId }, { status: 400 });
  const reason = `${category.label} — ${formatItinFee(category.amount)}`;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!url || !key) {
    logFailure('configuration', requestId, { code: !url ? 'SUPABASE_URL_MISSING' : 'SUPABASE_KEY_MISSING' });
    return NextResponse.json({ error: 'The enquiry service is temporarily unavailable. Please email us.', requestId }, { status: 503 });
  }
  let enquiryId: string;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from('enquiries').insert({ name: input.name,
      email: input.email, phone: input.phone || null, reason, location: input.location,
      appointment: input.appointment || null, message: input.message,
      consented_at: new Date().toISOString() }).select('id').single();
    if (error) throw error;
    enquiryId = data.id;
  } catch (error) {
    logFailure('database', requestId, error);
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
      text: `Reference: ${enquiryId}\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || 'Not provided'}\nLocation: ${input.location}\nAppointment: ${input.appointment || 'Not specified'}\nReason: ${reason}\n${serviceFeeScope(category.id)}\n${additionalChargesNotice}\n${category.id === 'other' ? otherCategoryNotice : ''}\n\n${input.message}`,
    }, { idempotencyKey: `enquiry/${enquiryId}` });
    if (error) throw error;
    notification = 'sent';
    console.info('itinpro_enquiry_notification', JSON.stringify({ requestId, enquiryId, emailId: data?.id }));
  } catch (error) { logFailure('email', requestId, error); }
  // Accept saved enquiries even if staff email fails; do not invite duplicate submissions.
  console.info('itinpro_enquiry_saved', JSON.stringify({ requestId, enquiryId, notification }));
  return NextResponse.json({ ok: true, enquiryId, notification, requestId }, { status: 201 });
}
