import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { POST } from '../app/api/admin/invoices/route';

test('invoice retries reuse persisted customers beyond Stripe idempotency retention and block stale unfinished requests', async () => {
  const keys = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
    'PAYMENT_TOKEN_SECRET','PAYMENT_ADMIN_TOKEN','PAYMENTS_ENABLED'];
  const before = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  const originalFetch = globalThis.fetch; const originalError = console.error; console.error = () => {};
  const body = { requestId: '11111111-1111-4111-8111-111111111111', email: 'test@example.com',
    name: 'AUTOMATED TEST ONLY', lines: [{ kind: 'travel', description: 'Synthetic test travel charge', amount: 9000 }] };
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  let stripeWrites = 0;
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  try {
    Object.assign(process.env, { SUPABASE_URL: 'https://test-only.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'TEST_ONLY',
      STRIPE_SECRET_KEY: 'rk_test_TEST_ONLY', STRIPE_WEBHOOK_SECRET: 'whsec_TEST_ONLY', PAYMENT_TOKEN_SECRET: 'TEST_ONLY',
      PAYMENT_ADMIN_TOKEN: 'TEST_ONLY_ADMIN_AUTHORIZATION_12345678', PAYMENTS_ENABLED: 'true' });
    for (const phase of ['paid', 'unfinished', 'draft']) {
      globalThis.fetch = async (input, options) => {
        const url = String(input); const method = options?.method || 'GET';
        if (url.includes('/rest/v1/payment_orders')) {
          if (method === 'GET') return json({ id: body.requestId, kind: 'invoice', request_hash: hash, amount: 9000,
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            stripe_customer_id: 'cus_test_existing', stripe_invoice_id: phase === 'unfinished' ? null : 'in_test_existing' });
          if (method === 'PATCH') assert.equal(JSON.parse(String(options?.body)).stripe_customer_id, 'cus_test_existing');
          return new Response(null, { status: method === 'POST' ? 201 : 204 });
        }
        if (url.includes('api.stripe.com') && method !== 'GET') { stripeWrites++; throw new Error('Unexpected Stripe write'); }
        if (url.includes('/v1/prices/')) return json({ id: 'price_1UPQJ0050EnIRMqj4aodcTOK', active: true,
          currency: 'gbp', unit_amount: 39500, livemode: false });
        if (url.includes('/v1/customers/cus_test_existing')) return json({ id: 'cus_test_existing', livemode: false });
        if (url.includes('/v1/invoices/in_test_existing')) return json({ id: 'in_test_existing', customer: 'cus_test_existing',
          livemode: false, metadata: { order_id: body.requestId }, status: phase === 'draft' ? 'draft' : 'paid',
          total: 9000, currency: 'gbp', hosted_invoice_url: 'https://invoice.stripe.com/test-only' });
        throw new Error('Unexpected test network call');
      };
      const response = await POST(new Request('https://itinpro-uk.onrender.com/api/admin/invoices', { method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PAYMENT_ADMIN_TOKEN}` },
        body: JSON.stringify(body) }));
      assert.equal(response.status, phase === 'paid' ? 200 : 409);
      if (phase === 'paid') assert.equal((await response.json()).invoiceId, 'in_test_existing');
    }
    assert.equal(stripeWrites, 0);
  } finally {
    globalThis.fetch = originalFetch; console.error = originalError;
    for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
});
