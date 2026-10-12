import type Stripe from 'stripe';

export type PaymentChange = { eventId: string; orderId: string; reference: string; amount: number; currency: string;
  kind: 'checkout' | 'invoice'; status: 'paid' | 'failed' | 'expired' | 'void' };

export function paymentChange(event: Stripe.Event): PaymentChange | null {
  if (event.livemode) throw new Error('LIVE_EVENT_REJECTED');
  if (event.type.startsWith('checkout.session.')) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.app !== 'itinpro') return null;
    let status: PaymentChange['status'];
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      if (session.payment_status !== 'paid') return null;
      status = 'paid';
    } else if (event.type === 'checkout.session.async_payment_failed') status = 'failed';
    else if (event.type === 'checkout.session.expired') status = 'expired';
    else return null;
    if (!session.metadata.order_id || session.amount_total === null || !session.currency) throw new Error('INVALID_SESSION_EVENT');
    return { eventId: event.id, orderId: session.metadata.order_id, reference: session.id,
      amount: session.amount_total, currency: session.currency, kind: 'checkout', status };
  }
  if (['invoice.paid', 'invoice.payment_failed', 'invoice.voided'].includes(event.type)) {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.metadata?.app !== 'itinpro') return null;
    if (!invoice.metadata.order_id || !invoice.id || !invoice.currency) throw new Error('INVALID_INVOICE_EVENT');
    const status = event.type === 'invoice.paid' ? 'paid' : event.type === 'invoice.voided' ? 'void' : 'failed';
    return { eventId: event.id, orderId: invoice.metadata.order_id, reference: invoice.id,
      amount: status === 'paid' ? invoice.amount_paid : invoice.total, currency: invoice.currency, kind: 'invoice', status };
  }
  return null;
}
