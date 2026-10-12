import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/admin/invoices/route';

test('invoice API refuses a different sandbox catalog before any database or Stripe write', async () => {
  const keys = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET','PAYMENT_TOKEN_SECRET','PAYMENT_ADMIN_TOKEN','PAYMENTS_ENABLED'];
  const before = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  const fetchBefore = globalThis.fetch; const errorBefore = console.error;
  const logs: string[] = []; console.error = (...args) => { logs.push(args.join(' ')); };
  let writes = 0;
  try {
    process.env.SUPABASE_URL = 'https://test-only.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'TEST_ONLY';
    process.env.STRIPE_SECRET_KEY = 'rk_test_TEST_ONLY';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_TEST_ONLY';
    process.env.PAYMENT_TOKEN_SECRET = 'TEST_ONLY';
    process.env.PAYMENT_ADMIN_TOKEN = 'TEST_ONLY_ADMIN_AUTHORIZATION_12345678';
    process.env.PAYMENTS_ENABLED = 'true';
    for (const mismatch of ['missing', 'live']) {
      globalThis.fetch = async (input, options) => {
        assert.equal(options?.method || 'GET', 'GET');
        if (String(input).includes('/v1/prices/')) {
          const body = mismatch === 'missing'
            ? { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'No such price' } }
            : { id: 'price_1UPQJ0050EnIRMqj4aodcTOK', object: 'price', active: true,
              currency: 'gbp', unit_amount: 39500, livemode: true };
          return new Response(JSON.stringify(body), { status: mismatch === 'missing' ? 404 : 200,
            headers: { 'Content-Type': 'application/json' } });
        }
        writes++; throw new Error('No database or Stripe write should occur');
      };
      const response = await POST(new Request('https://itinpro-uk.onrender.com/api/admin/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYMENT_ADMIN_TOKEN}` },
        body: JSON.stringify({ requestId: '11111111-1111-4111-8111-111111111111',
          name: 'AUTOMATED TEST ONLY', email: 'test@example.com',
          lines: [{ kind: 'courier', description: 'Synthetic courier test only', amount: 1500 }] }),
      }));
      assert.equal(response.status, 503);
    }
    assert.equal(writes, 0);
    assert.ok(logs.some(x => x.includes('SANDBOX_CATALOG_UNAVAILABLE')));
    assert.ok(logs.some(x => x.includes('SANDBOX_CATALOG_MISMATCH')));
    assert.ok(logs.every(x => !x.includes('rk_test_TEST_ONLY')));
  } finally {
    globalThis.fetch = fetchBefore; console.error = errorBefore;
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];
    }
  }
});
