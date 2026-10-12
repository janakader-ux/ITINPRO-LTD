import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import prices from './stripe-sandbox-prices.json';
import { getItinCategory } from './itin-pricing';

export function paymentConfigurationReady() {
  return process.env.PAYMENTS_ENABLED === 'true' && /^(rk|sk)_test_/.test(process.env.STRIPE_SECRET_KEY?.trim() || '') &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET && process.env.PAYMENT_TOKEN_SECRET && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^(rk|sk)_test_/.test(key)) throw new Error('SANDBOX_KEY_REQUIRED');
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia', maxNetworkRetries: 2, httpClient: Stripe.createFetchHttpClient() });
}

// Prices are scoped to a Stripe account and sandbox. Verify an existing ITIN PRO
// price before invoice creation so a key for another sandbox cannot create objects.
export async function verifySandboxCatalog(stripe: Stripe) {
  const anchor = prices.prices[0];
  let remote: Stripe.Price;
  try { remote = await stripe.prices.retrieve(anchor.priceId); }
  catch (error) {
    if ((error as { code?: string }).code === 'resource_missing')
      throw Object.assign(new Error('SANDBOX_CATALOG_UNAVAILABLE'), { code: 'SANDBOX_CATALOG_UNAVAILABLE' });
    throw error;
  }
  if (remote.id !== anchor.priceId || remote.livemode || !remote.active ||
    remote.currency !== prices.currency || remote.unit_amount !== anchor.unitAmount)
    throw Object.assign(new Error('SANDBOX_CATALOG_MISMATCH'), { code: 'SANDBOX_CATALOG_MISMATCH' });
}

export function paymentDatabase() {
  const url = process.env.SUPABASE_URL?.trim(); const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error('DATABASE_NOT_CONFIGURED');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function fixedServicePrice(id: string) {
  const category = getItinCategory(id);
  const price = prices.prices.find(x => x.category === id);
  if (!category || category.amount === null || !price || price.unitAmount !== category.amount) throw new Error('UNKNOWN_FIXED_PRICE');
  return { category, price };
}

export function appOrigin() {
  const url = new URL(process.env.APP_URL || 'https://itinpro-uk.onrender.com');
  if (url.protocol !== 'https:') throw new Error('HTTPS_REQUIRED');
  return url.origin;
}

export function logPaymentFailure(stage: string, error: unknown) {
  const detail = error as { code?: string; type?: string; name?: string };
  console.error('itinpro_payment_failure', JSON.stringify({ stage, code: detail?.code, type: detail?.type, name: detail?.name }));
}
