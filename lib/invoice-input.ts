import { z } from 'zod';

export const invoiceSchema = z.object({
  requestId: z.uuid(), email: z.email(), name: z.string().trim().min(2).max(100),
  lines: z.array(z.object({ kind: z.enum(['travel','courier','category_difference']),
    description: z.string().trim().min(3).max(200), amount: z.number().int().positive().max(200000) })).min(1).max(10),
}).strict();

export function invoiceAmount(input: z.infer<typeof invoiceSchema>) {
  return input.lines.reduce((sum, line) => sum + line.amount, 0);
}
