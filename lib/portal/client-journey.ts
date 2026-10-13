export const clientSteps=['Engagement','Payment','Your details','Documents'] as const;
export function resumeClientStep(signed:boolean,paid:boolean,status:string,hasUploads:boolean,requested?:number){
  const limit=!signed?0:!paid?1:3;
  if(Number.isInteger(requested)&&requested!>=0&&requested!<=limit)return requested!;
  if(!signed)return 0;
  if(!paid)return 1;
  return hasUploads||!['collecting','awaiting_payment'].includes(status)?3:2;
}
export function missingRequiredUploads(requirements:{id:string;conditional?:string}[],documents:{item_id:string;kind:string;state:string}[]){
  return requirements.filter(r=>!r.conditional&&!documents.some(d=>d.item_id===r.id&&d.kind==='upload'&&d.state!=='replace_requested')).map(r=>r.id);
}
