import { z } from 'zod';
import { getItinCategory } from './itin-pricing';
import { getApplicationRoute } from './portal/checklists';

export const taxReturnReasons = [
  'US non-resident return (Form 1040-NR)',
  'US resident / joint return (Form 1040)',
  'US rental income', 'Sale of US property', 'Partnership income',
  'Pension / 401(k) distribution', 'Royalties / investment income',
  'Employment / scholarship income', 'Withholding refund',
  'Amended or overdue return', 'Other / please advise',
] as const;

export const simpleIntakeSchema = z.object({
  flowVersion: z.literal('simple-v1'),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.email(), phone: z.string().trim().min(5).max(40),
  service: z.enum(['itin', 'ein', 'tax']),
  applicationRoute: z.string().max(80).optional(),
  taxReason: z.enum(taxReturnReasons).optional(),
  preference: z.enum(['online', 'contact']),
  readiness: z.enum(['yes', 'no']).optional(),
  consent: z.literal('yes'), website: z.string().max(0).optional(),
}).superRefine((v, ctx) => {
  if (v.service === 'itin' && !getApplicationRoute(v.applicationRoute || ''))
    ctx.addIssue({code:'custom',path:['applicationRoute'],message:'Choose an application category.'});
  if (v.service === 'tax' && !v.taxReason)
    ctx.addIssue({code:'custom',path:['taxReason'],message:'Choose a reason for filing.'});
  if (v.service !== 'tax' && v.preference === 'online' && !v.readiness)
    ctx.addIssue({code:'custom',path:['readiness'],message:'Please tell us whether you are ready.'});
});

// Translate the short intake into the existing enquiry storage without a database migration.
export function normalizeSimpleIntake(v: z.infer<typeof simpleIntakeSchema>) {
  const route = v.service === 'itin' ? getApplicationRoute(v.applicationRoute!) : undefined;
  const category = getItinCategory(route?.priceCategory || (v.service === 'ein' ? 'ein' : 'tax-return-quote'))!;
  const next = v.service === 'tax' ? 'Staff to contact client about tax-return preparation.' :
    v.preference === 'contact' || v.readiness === 'no' ? 'Staff to contact client; do not request checkout.' :
    'Staff to confirm the route, send the service-specific engagement, then arrange payment and secure application access.';
  return {
    name: `${v.firstName} ${v.lastName}`, email:v.email, phone:v.phone,
    reason:route?.title || v.taxReason || category.label, serviceCategory:category.id,
    location:'To be confirmed privately', appointment:'To be arranged',
    llcAndEinConfirmed:undefined,
    message:[`Short service intake: ${v.service.toUpperCase()}`,`First name: ${v.firstName}`,`Last name: ${v.lastName}`,
      `Application / filing reason: ${route?.title || v.taxReason || category.label}`,
      `Client preference: ${v.preference === 'online' ? 'Complete the application online' : 'Contact me; I will send information by email'}`,
      `Ready to proceed: ${v.readiness || 'Not requested for this enquiry'}`,next].join('\n'),
    consent:v.consent, website:v.website,
  };
}
