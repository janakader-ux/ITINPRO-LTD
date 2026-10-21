export const clientSteps=['Engagement','Your details','Documents','Payment'] as const;
export function resumeClientStep(signed:boolean,paid:boolean,status:string,hasUploads:boolean,requested?:number){
  const limit=!signed?0:3;
  if(Number.isInteger(requested)&&requested!>=0&&requested!<=limit)return requested!;
  if(!signed)return 0;
  if(status==='awaiting_payment'&&!paid)return 3;
  return hasUploads||!['collecting','awaiting_payment'].includes(status)?2:1;
}
export function missingRequiredUploads(requirements:{id:string;conditional?:string}[],documents:{item_id:string;kind:string;state:string}[],responses:Record<string,{status:string;note:string}>={}){
  return requirements.filter(r=>(!r.conditional||(!!responses[r.id]&&responses[r.id].status!=='not-applicable'))&&!documents.some(d=>d.item_id===r.id&&d.kind==='upload'&&d.state!=='replace_requested')).map(r=>r.id);
}
