import { z } from 'zod';
import { getApplicationRoute } from './checklists';
export const reviewCaseInput=z.object({enquiryId:z.uuid(),routeId:z.string().refine(v=>!!getApplicationRoute(v)),
  legalName:z.string().trim().min(2).max(100),address:z.string().trim().min(10).max(500),
  taxYear:z.number().int().min(2000).max(new Date().getUTCFullYear()+1),
  screening:z.object({ssnIneligible:z.literal(true),federalTaxPurpose:z.literal(true),
    evidenceRoute:z.enum(['tax-return','exception']),evidenceNotes:z.string().trim().min(10).max(1000),
    originalsExplained:z.literal(true),feesExplained:z.literal(true)})});
export function casePaymentMatches(c:{fee:number;price_category:string;payment_order_id:string},p:{id:string;status:string;amount:number;currency:string;service_category?:string;kind?:string}|null){
  return !!p&&p.id===c.payment_order_id&&p.status==='paid'&&p.amount===c.fee&&p.currency==='gbp'&&p.service_category===c.price_category&&['checkout','invoice'].includes(p.kind||'');
}
export function clientNextAction(status:string,signed:boolean,paid:boolean){
  if(status==='cancelled')return {tab:'progress',label:'View case status',detail:'This case has been cancelled. Contact your adviser before proceeding.'};
  if(!signed)return {tab:'engagement',label:'Review and sign your engagement',detail:'Read your confirmed service, fee and document requirements before signing.'};
  if(!paid)return {tab:'payment',label:'Pay your agreed fee',detail:'Your engagement is signed. Information and uploads unlock after payment is confirmed.'};
  if(status==='missing_information')return {tab:'requests',label:'Respond to your adviser',detail:'Your adviser has requested some additional information.'};
  if(status==='draft_shared')return {tab:'drafts',label:'Review your prepared application',detail:'Check the details and approve the draft or ask for changes.'};
  if(['draft_approved','verification','submitted','complete'].includes(status))return {tab:'progress',label:'View verification and submission progress',detail:'Original-document checks and wet signatures remain separate from online approval.'};
  if(status==='review')return {tab:'progress',label:'View review status',detail:'Your information is with your adviser for review.'};
  return {tab:'information',label:'Complete your information',detail:'Work through the short sections, then upload your personalised document checklist.'};
}
