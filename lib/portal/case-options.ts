import { z } from 'zod';
import { applicationRoutes, routeFee } from './checklists';
export type TestOrder = { id: string; category: string; amount: number };
export function compatibleApplicationRoutes(order: Pick<TestOrder,'category'|'amount'>) {
  return applicationRoutes.filter(route => route.priceCategory === order.category && routeFee(route.id) === order.amount);
}
export function sandboxRecipient(order: {email:string;message:string}, nominated?:string) {
  const original = order.email.trim().toLowerCase();
  if (!original.endsWith('@example.com') || !order.message.startsWith('AUTOMATED TEST ONLY')) throw new Error('SANDBOX_ONLY');
  // The nominee comes from server configuration, never a browser-supplied address.
  return nominated?.trim() ? z.email().parse(nominated.trim().toLowerCase()) : original;
}
