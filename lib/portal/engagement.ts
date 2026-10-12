import template from './engagement-template.json';
import { getApplicationRoute, routeChecklist } from './checklists';
import { documentHash } from './validation';
export function engagementSnapshot(c: {id:string;legal_name:string;address:string;route_id:string;fee:number;tax_year:number;created_at:string}) {
  const route=getApplicationRoute(c.route_id)!;
  const fields:Record<string,string>={CASE_ID:c.id,AGREEMENT_VERSION:template.version,PRESENTED_AT:new Date().toISOString(),
    CLIENT_LEGAL_NAME:c.legal_name,CLIENT_ADDRESS:c.address,SERVICE_NAME:route.title,SERVICE_CATEGORY:route.title,
    W7_ROUTE:route.purpose,W7_ROUTE_AND_PURPOSE:route.purpose,APPLICANT_NAMES:c.legal_name,FEE_GBP:String(c.fee/100),VAT_WORDING:'all-inclusive, no VAT',
    ADDITIONAL_CHARGES:'None agreed. Any travel, courier or third-party charge requires separate agreement and invoice.',
    VERIFICATION_ROUTE:'CAA inspection of original passport or issuing-agency-certified copy',VERIFICATION_ROUTE_DETAIL:'To be arranged with the CAA. Uploads support preparation only; original-document inspection is still required.',
    TAX_YEAR_OR_PERIOD:String(c.tax_year),COURIER_DETAIL:'To be agreed separately. In-person verification preferred; any postal originals must use an agreed tracked receipt and return arrangement.',
    CORRESPONDENCE_SCOPE:'Routine status updates under this engagement. Other IRS notices, audits or appeals are outside scope unless separately agreed.',
    REQUIRED_DOCUMENT_LIST:routeChecklist(c.route_id).map(x=>`${x.title}${x.conditional?` (${x.conditional})`:''}`).join('; '),
    CLIENT_SIGNATURE:'Recorded separately in the acceptance certificate',SIGNED_AT:'Recorded separately in the acceptance certificate',SIGNER_EMAIL:'Recorded separately in the acceptance certificate',SIGNATURE_AUDIT_ID:c.id,
    ACCEPT_TERMS_CHECKBOX:'Client must explicitly accept',DOCUMENT_READINESS_CHECKBOX:'Client must explicitly confirm',IDENTITY_ROUTE_CHECKBOX:'Client must explicitly confirm',PRIVACY_ACK_CHECKBOX:'Client must explicitly acknowledge',START_EARLY_CHECKBOX:'Separate optional choice; never preselected'};
  const fill=(s:string)=>s.replace(/\{\{([A-Z0-9_]+)\}\}/g,(_,key)=>fields[key]||'To be confirmed before acceptance');
  const snapshot={version:template.version,paragraphs:template.paragraphs.map(fill),tables:template.tables.map(t=>t.map(r=>r.map(fill)))};
  return {version:template.version,snapshot,sha256:documentHash(snapshot)};
}
