import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function createCheckoutToken(enquiryId: string, category: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ enquiryId, category, exp: now + 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}

export function readCheckoutToken(token: string, secret: string, now = Date.now()) {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || token.length > 1000) throw new Error('INVALID_TOKEN');
  const expected = createHmac('sha256', secret).update(payload).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error('INVALID_TOKEN');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { enquiryId: string; category: string; exp: number };
  if (!/^[0-9a-f-]{36}$/i.test(data.enquiryId) || typeof data.category !== 'string' || !Number.isFinite(data.exp) || data.exp <= now)
    throw new Error('INVALID_TOKEN');
  return data;
}

export function safeSecretEqual(actual: string, expected: string) {
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The order UUID is random; derive a stable eight-letter suffix so retry parameters are identical.
export function integrationIdentifier(orderId: string) {
  const letters = [...createHash('sha256').update(orderId).digest().subarray(0,8)].map(n => String.fromCharCode(97+n%26)).join('');
  return `itinpro_checkout_${letters}`;
}
