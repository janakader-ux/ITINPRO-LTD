export type ReviewField = { question: string; answer: string; attention?: boolean };
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function requiresReview(question: string, answer: string) {
  return /not sure|unsure|provide later|send.*later|staff review|help me choose|expired|renewal in progress|check.*eligibility/i.test(answer)
    || (/social security/i.test(question) && /^yes$/i.test(answer))
    || (/passport|prepared.*tax return|ready to proceed/i.test(question) && /^no$/i.test(answer));
}
export function submissionFields(message: string, generated: boolean): ReviewField[] {
  if (!generated) return [{question:'Client message',answer:message}];
  const fields: ReviewField[]=[];
  for (const line of message.split(/\r?\n/).filter(s=>s.trim())) {
    const split=line.indexOf(': ');
    if(split>0) fields.push({question:line.slice(0,split),answer:line.slice(split+2)});
    else fields.push({question:'Additional information',answer:line});
  }
  return fields;
}
export function reviewerEmail(title: string, fields: ReviewField[]) {
  const flagged=fields.map(f=>({...f,attention:f.attention??requiresReview(f.question,f.answer)}));
  const count=flagged.filter(f=>f.attention).length;
  const text=[title,count?`REVIEW REQUIRED: ${count} item(s) highlighted below.`:'Review the submission below.',...flagged.map(f=>`${f.attention?'[REVIEW REQUIRED] ':''}${f.question}\n${f.answer}`)].join('\n\n');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;background:#f3f5f7;color:#182737;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:auto;background:white"><tr><td style="padding:24px;background:#123329;color:white"><h1 style="margin:0;font-size:24px">${escape(title)}</h1></td></tr><tr><td style="padding:24px"><p style="margin:0 0 24px;line-height:1.6;color:${count?'#b42318':'#344054'}">${count?`<strong>Review required — ${count} item(s)</strong><br>Check the labelled items below.`:'Review the submission below.'}</p>${flagged.map(f=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-bottom:1px solid #d0d5dd"><tr><td style="padding:0 0 8px;font-size:15px;line-height:1.6"><strong>${escape(f.question)}</strong>${f.attention?'<br><strong style="color:#b42318">REVIEW REQUIRED</strong>':''}</td></tr><tr><td style="padding:0 0 20px;font-size:16px;font-weight:400;line-height:1.7;overflow-wrap:anywhere;color:${f.attention?'#b42318':'#182737'}">${escape(f.answer).replace(/\r?\n/g,'<br>')}</td></tr></table>`).join('')}</td></tr></table></td></tr></table></body></html>`;
  return {html,text};
}
