import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appOrigin, fixedServicePrice, logPaymentFailure, paymentConfigurationReady, paymentDatabase, stripeClient } from '@/lib/payments';
import { integrationIdentifier, readCheckoutToken } from '@/lib/payment-security';

export async function POST(request: Request) {
  if (!paymentConfigurationReady()) return NextResponse.json({ error: 'Online payment is not available yet. We will arrange payment with you.' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== appOrigin()) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  let token: ReturnType<typeof readCheckoutToken>;
  try {
    const body = z.object({ token: z.string().max(1000) }).parse(await request.json());
    token = readCheckoutToken(body.token, process.env.PAYMENT_TOKEN_SECRET!);
  } catch { return NextResponse.json({ error: 'This payment link has expired. Please contact us.' }, { status: 400 }); }
  let stage = 'price';
  try {
    const { category, price } = fixedServicePrice(token.category);
    const db = paymentDatabase(); const stripe = stripeClient();
    stage = 'enquiry';
    const enquiry = await db.from('enquiries').select('id,email').eq('id', token.enquiryId).single();
    if (enquiry.error) throw enquiry.error;
    stage = 'order';
    const inserted = await db.from('payment_orders').upsert({ enquiry_id: token.enquiryId, kind: 'checkout',
      service_category: category.id, amount: category.amount, currency: 'gbp' }, { onConflict: 'enquiry_id', ignoreDuplicates: true });
    if (inserted.error) throw inserted.error;
    const selected = await db.from('payment_orders').select('*').eq('enquiry_id', token.enquiryId).single();
    if (selected.error) throw selected.error;
    const order = selected.data;
    if (order.status === 'paid') return NextResponse.json({ error: 'Payment has already been received.' }, { status: 409 });
    if (order.amount !== category.amount || order.service_category !== category.id) throw new Error('ORDER_MISMATCH');
    if (order.stripe_checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if (existing.livemode) throw new Error('LIVE_SESSION_REJECTED');
      if (existing.status === 'open' && existing.url) return NextResponse.json({ url: existing.url });
      return NextResponse.json({ error: 'This payment session has ended. Please contact us before starting another payment.' }, { status: 409 });
    }
    stage = 'stripe_price';
    const remotePrice = await stripe.prices.retrieve(price.priceId);
    if (remotePrice.livemode || !remotePrice.active || remotePrice.currency !== 'gbp' || remotePrice.unit_amount !== category.amount)
      throw new Error('STRIPE_PRICE_MISMATCH');
    stage = 'stripe_session';
    const session = await stripe.checkout.sessions.create({ mode: 'payment', customer_email: enquiry.data.email,
      line_items: [{ price: price.priceId, quantity: 1 }], client_reference_id: order.id,
      metadata: { app: 'itinpro', order_id: order.id, service_category: category.id },
      integration_identifier: integrationIdentifier(order.id),
      success_url: `${appOrigin()}/payment/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin()}/?service=${category.id}#enquiry`,
    }, { idempotencyKey: `itinpro/checkout/${order.id}` });
    if (session.livemode || !session.url) throw new Error('SANDBOX_SESSION_REQUIRED');
    stage = 'save_session';
    const saved = await db.from('payment_orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id);
    if (saved.error) throw saved.error;
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logPaymentFailure(stage, error);
    return NextResponse.json({ error: 'Payment could not be started. Your enquiry is saved; please contact us.' }, { status: 503 });
  }
}
