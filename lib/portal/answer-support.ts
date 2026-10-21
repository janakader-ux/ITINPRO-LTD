// These are client declarations for follow-up, never waivers of required evidence.
export const answerSupportOptions = [
  {value:'not-applicable',label:'Not applicable',answer:'Not applicable — staff review requested'},
  {value:'not-sure',label:'Not sure',answer:'Not sure — staff review requested'},
  {value:'staff-review',label:'Leave to staff review',answer:'Please review this with me — staff review requested'},
] as const;
export function answerSupportStatus(answer:string){return answerSupportOptions.find(x=>x.answer===answer)?.value||'';}
export function answersNeedingReview(answers:Record<string,unknown>={}){return Object.entries(answers).filter(([,v])=>typeof v==='string'&&!!answerSupportStatus(v)).map(([key])=>key);}
export const documentStatusOptions=[{value:'later',label:'I will provide it later'},...answerSupportOptions.map(({value,label})=>({value,label}))] as const;
export type DocumentStatus=typeof documentStatusOptions[number]['value'];
export function documentStatusLabel(status:string){return documentStatusOptions.find(x=>x.value===status)?.label||status;}
export function documentResponse(status:DocumentStatus,note=''){return {status,note:note.trim()||`${documentStatusLabel(status)}. Please follow up with me if needed.`};}
