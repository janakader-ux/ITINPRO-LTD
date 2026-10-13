import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { logPaymentFailure, paymentDatabase, stripeClient } from '@/lib/payments';
import { sendPendingNotices } from '@/lib/portal/notifications';
import { paymentChange } from '@/lib/payment-events';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !/^(rk|sk)_test_/.test(process.env.STRIPE_SECRET_KEY?.trim() || ''))
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') || '', secret);
  } catch { return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 }); }
  try {
    const change = paymentChange(event);
    if (!change) return NextResponse.json({ received: true });
    const db = paymentDatabase();
    const { data, error } = await db.rpc('apply_payment_event', { p_event_id: change.eventId, p_order_id: change.orderId,
      p_reference: change.reference, p_amount: change.amount, p_currency: change.currency,
      p_kind: change.kind, p_status: change.status });
    if (error) throw error;
    if(change.status==='paid'){
      const cases=await db.from('portal_cases').select('id').eq('payment_order_id',change.orderId).eq('workflow','payment-last');
      if(cases.error)throw cases.error;
      for(const c of cases.data||[])await sendPendingNotices(c.id).catch(()=>{});
    }
    console.info('itinpro_payment_event', JSON.stringify({ eventId: event.id, orderId: change.orderId, result: data }));
    return NextResponse.json({ received: true });
  } catch (error) {
    logPaymentFailure('webhook_reconciliation', error);
    // A non-success response makes Stripe retry; never acknowledge a failed database write.
    return NextResponse.json({ error: 'Payment reconciliation temporarily unavailable.' }, { status: 503 });
  }
}
