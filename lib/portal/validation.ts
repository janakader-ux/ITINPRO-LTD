import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getApplicationRoute } from './checklists';
export const caseInput = z.object({ orderId: z.uuid(), routeId: z.string().refine(x => !!getApplicationRoute(x)), legalName: z.string().trim().min(2).max(100), address: z.string().trim().min(10).max(500), taxYear: z.number().int().min(2000).max(new Date().getUTCFullYear() + 1) });
import { basicFields } from './fields';
import { foreignCountryOptions } from './questionnaire';
export { basicFields } from './fields';
export const foreignAddressInput = z.object({foreignAddress:z.string().trim().min(10,'Provide a complete foreign address.').max(1500),foreignCountry:z.string().refine(value=>foreignCountryOptions.includes(value),'Select a country outside the United States.')});
export const answersInput = z.object(Object.fromEntries(basicFields.map(x => [x, z.string().trim().max(x.endsWith('Address') || x === 'notes' ? 1500 : 200).optional()]))).extend({foreignAddress:foreignAddressInput.shape.foreignAddress,foreignCountry:foreignAddressInput.shape.foreignCountry,contactEmail:z.union([z.email(),z.literal('')]).optional()}).strict().superRefine((value,ctx)=>{if(value.contactEmailChoice==='Use another contact email'&&!z.email().safeParse(value.contactEmail).success)ctx.addIssue({code:'custom',path:['contactEmail'],message:'Enter a valid contact email.'});});
export function documentHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
export function validateFile(bytes: Uint8Array, name: string, mime: string) {
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('FILE_SIZE');
  const ext = name.split('.').at(-1)?.toLowerCase();
  const expected = mime === 'application/pdf' && ext === 'pdf' && Buffer.from(bytes.subarray(0,5)).toString() === '%PDF-' ? 'pdf' :
    mime === 'image/png' && ext === 'png' && Buffer.from(bytes.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' :
    mime === 'image/jpeg' && (ext === 'jpg' || ext === 'jpeg') && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : null;
  if (!expected) throw new Error('FILE_TYPE');
  // Header validation is not virus scanning. Production collection remains disabled.
  return expected;
}
export function portalOrigin(fallback = 'https://itinpro-uk.onrender.com') {
  return new URL(process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || fallback).origin;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Render terminates TLS before forwarding to Next.js. Use server-owned configuration,
  // never caller-supplied Host or X-Forwarded-* headers, to identify the public origin.
  const expected = process.env.NODE_ENV === 'production' ? portalOrigin(request.url) : new URL(request.url).origin;
  return !!origin && origin === expected;
}
