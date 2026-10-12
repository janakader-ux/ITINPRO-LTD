import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/payments/status/route';

test('sandbox key access can be checked without enabling payments, writes or exposing provider details', async () => {
  const before = { key: process.env.STRIPE_SECRET_KEY, enabled: process.env.PAYMENTS_ENABLED };
  const originalFetch = globalThis.fetch; const originalNow = Date.now;
  let now = originalNow(); Date.now = () => now;
  let calls = 0; let missing = false;
  try {
    process.env.PAYMENTS_ENABLED = 'false';
    process.env.STRIPE_SECRET_KEY = 'rk_live_TEST_ONLY';
    globalThis.fetch = async (input, options) => {
      calls++;
      assert.equal(options?.method || 'GET', 'GET');
      assert.ok(String(input).endsWith('/v1/prices/price_1UPQJ0050EnIRMqj4aodcTOK'));
      const body = missing
        ? { error: { type: 'invalid_request_error', code: 'resource_missing', message: 'PRIVATE_PROVIDER_DETAIL' } }
        : { id: 'price_1UPQJ0050EnIRMqj4aodcTOK', object: 'price', active: true,
          currency: 'gbp', unit_amount: 39500, livemode: false };
      return new Response(JSON.stringify(body), { status: missing ? 404 : 200,
        headers: { 'Content-Type': 'application/json' } });
    };
    let response = await GET();
    assert.equal(response.status, 503); assert.equal(calls, 0);
    assert.equal((await response.json()).diagnostic, 'SANDBOX_KEY_REQUIRED');
    now += 31000; process.env.STRIPE_SECRET_KEY = 'rk_test_TEST_ONLY';
    response = await GET();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { mode: 'sandbox', paymentsEnabled: false,
      catalog: 'ready', checkedAt: new Date(now).toISOString() });
    await GET(); assert.equal(calls, 1, 'repeat health checks must reuse the read-only result');
    now += 31000; missing = true;
    response = await GET(); assert.equal(response.status, 503);
    const body = await response.text();
    assert.ok(body.includes('SANDBOX_CATALOG_UNAVAILABLE'));
    assert.ok(!body.includes('PRIVATE_PROVIDER_DETAIL'));
    assert.ok(!body.includes('rk_test_TEST_ONLY'));
    assert.equal(process.env.PAYMENTS_ENABLED, 'false');
  } finally {
    globalThis.fetch = originalFetch; Date.now = originalNow;
    if (before.key === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = before.key;
    if (before.enabled === undefined) delete process.env.PAYMENTS_ENABLED; else process.env.PAYMENTS_ENABLED = before.enabled;
  }
});
