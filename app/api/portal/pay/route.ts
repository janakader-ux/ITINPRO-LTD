import { NextResponse } from 'next/server';
import { z } from 'zod';
import { portalEnabled,portalSession,safePortalError } from '@/lib/portal/server';
import { sameOrigin } from '@/lib/portal/validation';
import { paymentConfigurationReady,paymentDatabase,stripeClient } from '@/lib/payments';
import { issueCaseInvoice } from '@/lib/portal/invoice';
import { startCaseCheckout } from '@/lib/portal/checkout';
export async function POST(request:Request){
  if(!portalEnabled()||!paymentConfigurationReady())return NextResponse.json({error:'Sandbox payment is not enabled yet. Your signed engagement is saved.'},{status:503});
  if(!sameOrigin(request))return NextResponse.json({error:'Use the portal form.'},{status:403});
  try{
    const input=z.object({caseId:z.uuid()}).parse(await request.json()),s=await portalSession();
    if(s.account.role!=='client')throw new Error('CASE_ACCESS_DENIED');
    const {data:c,error}=await s.db.from('portal_cases').select('*').eq('id',input.caseId).single();
    if(error||!c)throw new Error('CASE_NOT_FOUND');
    const order=await paymentDatabase().from('payment_orders').select('kind').eq('id',c.payment_order_id).single();if(order.error)throw order.error;
    const url=order.data.kind==='invoice'?(await issueCaseInvoice(paymentDatabase(),stripeClient(),c.id)).url:await startCaseCheckout(paymentDatabase(),stripeClient(),c,s.user.id,s.user.email!);
    return NextResponse.json({url},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    const code=(error as Error).message;
    const message=code==='PAYMENT_SESSION_ENDED'?'This payment session has ended. Contact your adviser to arrange the next step.':code==='ALREADY_PAID'?'Payment is already confirmed. Refresh your case.':safePortalError(error);
    return NextResponse.json({error:message},{status:code==='ALREADY_PAID'?409:400,headers:{'Cache-Control':'no-store'}});
  }
}
