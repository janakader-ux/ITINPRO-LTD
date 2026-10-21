import { firptaRequirements,firptaTiming,firptaPath,separateReturnFee,type FirptaSelection } from './firpta';
import wordHashes from './word-download-hashes.json';
import bank from './instruction-bank.json';
import { commonDocuments,getApplicationRoute,routeChecklist,signatureInstructions,type Requirement } from './checklists';
export const instructionVersion='2026-10-14.2';
export type InstructionGuide=typeof bank[number];
export type DocumentDisposition={status:import('./answer-support').DocumentStatus;note:string};
export type InstructionScreening={instructionCategory?:string;documentResponses?:Record<string,DocumentDisposition>;firpta?:FirptaSelection};
export type ApplicabilityDecision={required:boolean;note:string};
export type InstructionSnapshot={version:string;routeId:string;routeTitle:string;category:string|null;guide:InstructionGuide|null;requirements:Requirement[];text:string;signatureInstructions:string;firpta:FirptaSelection|null;firptaPath:string|null;timing:string;returnFee:string;instructionFile:string|null;letterFile:string|null;instructionFileHash:string|null;letterFileHash:string|null};
export type DocumentIntake={revision:number;category:string|null;firpta:FirptaSelection|null;responses:Record<string,DocumentDisposition>;applicability:Record<string,ApplicabilityDecision>;snapshot:InstructionSnapshot};
export const instructionGuides=bank;
export function guidesForRoute(routeId:string){return bank.filter(g=>g.routes.includes(routeId));}
export function caseGuide(routeId:string,screening?:InstructionScreening|null){
  const available=guidesForRoute(routeId);
  return available.find(g=>g.code===screening?.instructionCategory)||(available.length===1?available[0]:undefined);
}
export function guideRequirement(guide:InstructionGuide,item:InstructionGuide['items'][number]):Requirement{
  const conditional=item.level==='IF APPLICABLE'?'If this applies to your case':item.level==='OPTIONAL'?'Optional supporting evidence':item.context||undefined;
  return {id:item.id,title:item.title,instructions:item.instructions+(item.context?` ${item.context}. Provide only the evidence for the route confirmed by your adviser.`:''),basis:'ITIN PRO',conditional,original:item.requiresOriginal,templateType:item.templateType as 'letter'|'evidence',level:item.level==='MANDATORY'&&!conditional?'mandatory':item.level==='OPTIONAL'?'optional':'conditional'};
}
export function instructionChecklist(routeId:string,screening?:InstructionScreening|null,workflow?:string,now=new Date()):Requirement[]{
  if(workflow&&workflow!=='payment-last')return routeChecklist(routeId);
  if(routeId==='firpta')return [...commonDocuments,...(screening?.firpta?firptaRequirements(screening.firpta,now):[])].map(normalizeRequirement);
  const guide=caseGuide(routeId,screening);
  if(!guide)return routeChecklist(routeId);
  const evidence=guide.items.map(item=>guideRequirement(guide,item));
  // Retain current IRS-specific controls where the uploaded summary is narrower.
  const safetyIds=routeId==='dependent'?['dependent-details','dependent-residency','child-medical-school']:routeId==='gambling'?['tax-return','gambling-evidence']:routeId==='firpta'?['firpta-forms']:[];
  const safety=routeChecklist(routeId).filter(r=>safetyIds.includes(r.id)).map(r=>r.id==='dependent-residency'?{...r,level:'conditional' as const,conditional:'When US residency must be proved for this dependent'}:r);
  if(routeId==='dependent'){
    const residency=evidence.find(r=>r.instructions.startsWith("Dependent's passport"));
    if(residency)residency.conditional='Passport is uploaded under Standard documents; provide residency evidence under the age-appropriate residency item when required';
  }
  if(routeId==='gambling')safety.unshift({id:'tax-return',title:'Prepared Form 1040-NR for the refund route',instructions:'Provide the signed tax return with Form 1042-S for the return-based route. A casino letter alone does not establish Exception 2(d); that exception needs a qualifying gaming official acting as an IRS acceptance agent.',basis:'IRS',original:true,conditional:'For the return-based refund route; adviser confirms the route'});
  return [...commonDocuments,...evidence,...safety].map(normalizeRequirement);
}
export function instructionText(guide:InstructionGuide,routeId:string){
  const route=getApplicationRoute(routeId)!;
  return `ITIN PRO — CLIENT INSTRUCTIONS\nCategory ${guide.code}: ${guide.title}\nPortal guidance version ${instructionVersion}\n\n${guide.fullText}\n\nCURRENT PORTAL PREPARATION NOTES\n${signatureInstructions}\nA sample letter does not establish eligibility. The CAA confirms the federal tax purpose and actual exception.\n${route.review.join('\n')}\n${route.documents.map(r=>`${r.title}: ${r.instructions}`).join('\n')}\nOriginal-document inspection and final handwritten Form W-7 signatures remain separate from uploads, payment and engagement acceptance.\n`;
}

export function normalizeRequirement(r:Requirement):Requirement{return {...r,original:r.original===true,level:r.level||(r.conditional?(r.conditional.startsWith('Optional')?'optional':'conditional'):'mandatory'),templateType:r.templateType||'evidence'};}
export const reviewInstructions='All uploads will be reviewed by our CAA and team. We may request further documents or clarification. Uploading, paying or approving a draft does not submit the application. We will not submit anything without the required signed application, reviewed evidence and original-document checks.';
export const versionInstructions='These instructions and samples are guidance, not a final signed application. We keep the version issued to your case. If IRS requirements change or a provider’s wording is unsuitable, we will request an updated version and explain what to replace; the earlier version remains in the case history.';
export function makeInstructionSnapshot(routeId:string,category?:string|null,firpta?:FirptaSelection|null,workflow='payment-last',now=new Date()):InstructionSnapshot{
  const guide=caseGuide(routeId,{instructionCategory:category||undefined}),route=getApplicationRoute(routeId)!;
  const requirements=instructionChecklist(routeId,{instructionCategory:category||undefined,firpta:firpta||undefined},workflow,now).map(normalizeRequirement);
  const timing=firpta?firptaTiming(firpta,now):'';
  const text=routeId==='firpta'?['ITIN PRO FIRPTA document instructions',timing,separateReturnFee,...requirements.map(r=>`${r.level?.toUpperCase()}: ${r.title}\n${r.instructions}`),reviewInstructions,signatureInstructions,versionInstructions].join('\n\n'):guide?instructionText(guide,routeId):[route.title,...requirements.map(r=>`${r.title}: ${r.instructions}`)].join('\n\n');
  return {version:instructionVersion,routeId,routeTitle:route.title,category:guide?.code||null,guide:guide||null,requirements,text,signatureInstructions,firpta:firpta||null,firptaPath:firpta?firptaPath(firpta,now):null,timing,returnFee:firpta?separateReturnFee:'',instructionFile:guide?`${instructionVersion}/${guide.code}-instructions.docx`:null,letterFile:guide?.sample?`${instructionVersion}/${guide.code}-letter.docx`:null,instructionFileHash:guide?(wordHashes as Record<string,string>)[`${instructionVersion}/${guide.code}-instructions.docx`]||null:null,letterFileHash:guide?.sample?(wordHashes as Record<string,string>)[`${instructionVersion}/${guide.code}-letter.docx`]||null:null};
}
export function submissionDocumentBlockers(requirements:Requirement[],documents:{item_id:string;kind:string;state:string;original_checked?:boolean}[],applicability:Record<string,ApplicabilityDecision>={}):string[]{
  const missing:string[]=[];
  for(const r of requirements){
    const level=normalizeRequirement(r).level,decision=applicability[r.id];
    if(level==='conditional'&&!decision){missing.push(`applicability:${r.id}`);continue;}
    const needed=level==='mandatory'||decision?.required===true;
    if(!needed)continue;
    const accepted=documents.filter(d=>d.item_id===r.id&&d.kind==='upload'&&d.state==='accepted');
    if(!accepted.length)missing.push(`review:${r.id}`);
    else if(r.original&&!accepted.some(d=>d.original_checked))missing.push(`original:${r.id}`);
  }
  return missing;
}
