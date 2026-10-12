import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createCheckoutToken, readCheckoutToken, integrationIdentifier } from '../lib/payment-security';
import { fixedServicePrice, stripeClient } from '../lib/payments';
import { paymentChange } from '../lib/payment-events';
import { invoiceSchema, invoiceAmount } from '../lib/invoice-input';

const id = '11111111-1111-4111-8111-111111111111';
test('checkout token rejects tampering, expiry and extra segments', () => {
  const secret = 'test-only-signing-secret';
  const token = createCheckoutToken(id, 'spouse', secret, 1000);
  assert.equal(readCheckoutToken(token, secret, 1001).category, 'spouse');
  assert.throws(() => readCheckoutToken(token.replace('spouse','other') + 'x', secret, 1001));
  assert.throws(() => readCheckoutToken(token, 'wrong-secret', 1001));
  assert.throws(() => readCheckoutToken(token, secret, 1000 + 86400000));
  assert.throws(() => readCheckoutToken(token + '.extra', secret, 1001));
  assert.equal(integrationIdentifier(id),integrationIdentifier(id),'retries must retain identical Stripe parameters');
  assert.match(integrationIdentifier(id),/^itinpro_checkout_[a-z]{8}$/);
});
test('all eleven server prices match the agreed GBP amounts; quotes and unknown IDs cannot pay', () => {
  const expected = { spouse:39500, renewal:39500, 'prepared-1040nr':39500, llc:42500,
    'llc-bank-account':42500, other:42500, partnership:45000, firpta:45000,
    'pension-estate':49500, 'complex-compensation':55000, ein:37500 };
  for (const [category, amount] of Object.entries(expected)) assert.equal(fixedServicePrice(category).price.unitAmount, amount);
  assert.throws(() => fixedServicePrice('tax-return-quote'));
  assert.throws(() => fixedServicePrice('unknown'));
});
test('live Stripe keys are rejected before an API call', () => {
  const before=process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY='rk_live_TEST_ONLY_NOT_A_REAL_KEY';
  assert.throws(() => stripeClient(), /SANDBOX_KEY_REQUIRED/);
  if(before===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=before;
});
function sessionEvent(type: string, payment_status: string): Stripe.Event {
  return { id:'evt_test', type, livemode:false, data:{object:{id:'cs_test', metadata:{app:'itinpro',order_id:id},
    amount_total:39500,currency:'gbp',payment_status}} } as unknown as Stripe.Event;
}
test('unpaid checkout completion is ignored; delayed success records the canonical payment', () => {
  assert.equal(paymentChange(sessionEvent('checkout.session.completed','unpaid')), null);
  const result=paymentChange(sessionEvent('checkout.session.async_payment_succeeded','paid'));
  assert.equal(result?.status,'paid');assert.equal(result?.amount,39500);
  assert.throws(() => paymentChange({...sessionEvent('checkout.session.completed','paid'),livemode:true}));
});
test('invoice line validation prevents negative/fractional charges and sums travel/courier fees in pence', () => {
  const input={requestId:id,email:'test@example.com',name:'AUTOMATED TEST ONLY',lines:[
    {kind:'travel',description:'Agreed travel charge',amount:5000},{kind:'courier',description:'Tracked courier',amount:1500}]};
  assert.equal(invoiceAmount(invoiceSchema.parse(input)),6500);
  assert.equal(invoiceSchema.safeParse({...input,lines:[{...input.lines[0],amount:-1}]}).success,false);
  assert.equal(invoiceSchema.safeParse({...input,lines:[{...input.lines[0],amount:1.5}]}).success,false);
});
