import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { invoiceAmount, invoiceSchema } from '@/lib/invoice-input';
import { safeSecretEqual } from '@/lib/payment-security';
import { logPaymentFailure, paymentConfigurationReady, paymentDatabase, stripeClient, verifySandboxCatalog } from '@/lib/payments';

// Staff-only, sandbox-only. The customer form cannot choose extra fees or create invoices.
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_ADMIN_TOKEN;
  if (!paymentConfigurationReady() || !secret || secret.length < 32) return NextResponse.json({ error: 'Invoice service not configured.' }, { status: 503 });
  if (!safeSecretEqual(request.headers.get('authorization') || '', `Bearer ${secret}`))
    return NextResponse.json({ error: 'Staff authorisation required.' }, { status: 401 });
  const input = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Invalid invoice details. Amounts must be positive whole GBP pence.' }, { status: 400 });
  let stage = 'invoice_order';
  try {
    const body = input.data; const amount = invoiceAmount(body);
    const requestHash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const stripe = stripeClient();
    stage = 'sandbox_catalog';
    await verifySandboxCatalog(stripe);
    stage = 'invoice_order';
    const db = paymentDatabase();
    const inserted = await db.from('payment_orders').upsert({ id: body.requestId, kind: 'invoice', amount,
      currency: 'gbp', request_hash: requestHash }, { onConflict: 'id', ignoreDuplicates: true });
    if (inserted.error) throw inserted.error;
    const order = await db.from('payment_orders').select('*').eq('id', body.requestId).single();
    if (order.error) throw order.error;
    if (order.data.kind !== 'invoice' || order.data.request_hash !== requestHash)
      return NextResponse.json({ error: 'This request ID belongs to different invoice details.' }, { status: 409 });
    stage = 'invoice_customer';
    const customer = await stripe.customers.create({ name: body.name, email: body.email, metadata: { app: 'itinpro' } },
      { idempotencyKey: `itinpro/invoice/customer/${body.requestId}` });
    if (customer.livemode) throw new Error('LIVE_CUSTOMER_REJECTED');
    stage = 'invoice_create';
    const invoice = order.data.stripe_invoice_id ? await stripe.invoices.retrieve(order.data.stripe_invoice_id) :
      await stripe.invoices.create({ customer: customer.id, collection_method: 'send_invoice', days_until_due: 7,
        auto_advance: false, pending_invoice_items_behavior: 'exclude', default_tax_rates: [],
        description: 'ITIN PRO agreed additional charges — no VAT',
        metadata: { app: 'itinpro', order_id: body.requestId },
      }, { idempotencyKey: `itinpro/invoice/${body.requestId}` });
    if (invoice.livemode || !invoice.id) throw new Error('SANDBOX_INVOICE_REQUIRED');
    const saved = await db.from('payment_orders').update({ stripe_invoice_id: invoice.id, stripe_customer_id: customer.id }).eq('id', body.requestId);
    if (saved.error) throw saved.error;
    if (invoice.status === 'draft') {
      stage = 'invoice_lines';
      for (const [i, line] of body.lines.entries()) {
        await stripe.invoiceItems.create({ customer: customer.id, invoice: invoice.id, currency: 'gbp', amount: line.amount,
          description: line.description, tax_rates: [], metadata: { charge_kind: line.kind } },
          { idempotencyKey: `itinpro/invoice/${body.requestId}/line/${i}` });
      }
      stage = 'invoice_finalize';
      const ready = await stripe.invoices.retrieve(invoice.id);
      if (ready.total !== amount || ready.currency !== 'gbp') throw new Error('INVOICE_AMOUNT_MISMATCH');
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false },
        { idempotencyKey: `itinpro/invoice/${body.requestId}/finalize` });
      return NextResponse.json({ invoiceId: finalized.id, url: finalized.hosted_invoice_url, sandbox: true, sent: false });
    }
    return NextResponse.json({ invoiceId: invoice.id, url: invoice.hosted_invoice_url, sandbox: true, sent: false });
  } catch (error) {
    logPaymentFailure(stage, error);
    return NextResponse.json({ error: 'Invoice creation failed. Retry with the same request ID to avoid duplication.' }, { status: 503 });
  }
}
