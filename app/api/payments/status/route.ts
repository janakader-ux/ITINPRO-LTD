import { NextResponse } from 'next/server';
import { stripeClient, verifySandboxCatalog } from '@/lib/payments';

export const dynamic = 'force-dynamic';
type CatalogCheck = { checkedAt: number; ready: boolean; diagnostic?: string };
let cached: CatalogCheck | undefined;
let checking: Promise<CatalogCheck> | undefined;
const safeCodes = new Set(['SANDBOX_KEY_REQUIRED', 'SANDBOX_CATALOG_UNAVAILABLE',
  'SANDBOX_CATALOG_MISMATCH', 'permission_error', 'invalid_api_key', 'api_key_expired']);

async function checkCatalog(): Promise<CatalogCheck> {
  try {
    await verifySandboxCatalog(stripeClient());
    return { checkedAt: Date.now(), ready: true };
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    const code = detail.code || detail.message || '';
    return { checkedAt: Date.now(), ready: false,
      diagnostic: safeCodes.has(code) ? code : 'SANDBOX_CATALOG_CHECK_FAILED' };
  }
}

// Constant, read-only price lookup. No enquiry, customer, payment or invoice writes.
// Cache and share concurrent checks to avoid one Stripe request per visitor.
export async function GET() {
  if (!cached || Date.now() - cached.checkedAt >= 30000) {
    checking ||= checkCatalog();
    try { cached = await checking; } finally { checking = undefined; }
  }
  return NextResponse.json({ mode: 'sandbox', paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
    catalog: cached.ready ? 'ready' : 'unavailable', diagnostic: cached.diagnostic,
    checkedAt: new Date(cached.checkedAt).toISOString() },
  { status: cached.ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
