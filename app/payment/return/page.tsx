import Link from 'next/link';
import { paymentDatabase, stripeClient } from '@/lib/payments';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment status | ITIN PRO', robots: { index: false, follow: false } };

export default async function PaymentReturn({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  let confirmed = false;
  try {
    const { session_id } = await searchParams;
    if (session_id && /^cs_test_[A-Za-z0-9]+$/.test(session_id)) {
      const session = await stripeClient().checkout.sessions.retrieve(session_id);
      if (!session.livemode && session.metadata?.app === 'itinpro' && session.metadata.order_id) {
        const { data, error } = await paymentDatabase().from('payment_orders').select('status')
          .eq('id', session.metadata.order_id).eq('stripe_checkout_session_id', session.id).single();
        confirmed = !error && data?.status === 'paid';
      }
    }
  } catch { /* Show pending until the verified webhook has saved payment status. */ }
  return <main className="container-premium py-24"><p className="eyebrow">ITIN PRO payment</p>
    <h1 className="section-title mt-4">{confirmed ? 'Sandbox payment confirmed' : 'Payment confirmation pending'}</h1>
    <p className="mt-6 max-w-2xl leading-8">{confirmed ? 'This was a test payment. No real funds were charged and no client work has been booked.' : 'We are waiting for the payment confirmation to be recorded. Please refresh this page shortly. Do not submit another payment while confirmation is pending.'}</p>
    <Link className="gold-button mt-8" href="/">Return to ITIN PRO</Link></main>;
}
