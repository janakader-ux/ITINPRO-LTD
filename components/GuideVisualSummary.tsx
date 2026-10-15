import { ArrowRight, FileCheck2 } from 'lucide-react';

type FactSet = { label:string; items:[string,string,string] };

const facts:Record<string,FactSet> = {
  'itin-for-sale-of-us-property': {label:'FIRPTA route at a glance',items:['Exception 4','Sale contract + 8288-series evidence','Passport or permitted ID route']},
  'itin-for-partnership-interest': {label:'Partnership route at a glance',items:['Exception 1(a)','Schedule K-1 or Form 8805','Partnership evidence + identity']},
  'itin-for-llc-owner': {label:'LLC route at a glance',items:['Tax purpose first','K-1 / 8805 / return evidence','Operating agreement may support facts']},
  'itin-for-401k-pension-annuity': {label:'Distribution route at a glance',items:['Exception 1(d) may apply','1099-R / 1042-S or payer letter','Current-year tax purpose required']},
  'itin-for-spouse-of-us-citizen': {label:'Spouse route at a glance',items:['Box e','Valid joint-return tax purpose','Marriage and identity evidence']},
  'itin-for-dependents': {label:'Dependent route at a glance',items:['Allowable tax benefit required','Passport rules may be limited','Residency evidence can apply']},
  'itin-for-children-documents': {label:'Child documents at a glance',items:['Identity + foreign status','Age-limited school/medical records','Residency evidence can apply']},
  'itin-for-us-bank-account': {label:'Banking route at a glance',items:['Exception 1(b) or 1(c) may apply','US reporting need must be documented','Bank letter can be central evidence']},
  'itin-for-us-gambling-winnings-refund': {label:'Refund route at a glance',items:['Form 1042-S evidence','Form 1040-NR review','Treaty position depends on facts']},
  'itin-for-amazon-kdp-authors-uk': {label:'Royalty route at a glance',items:['US royalty reporting','Payer statement or contract','W-8BEN and ITIN roles differ']},
  'itin-for-royalty-rental-income-uk-treaty': {label:'Income route at a glance',items:['Exception 1(d) may apply','Payer or withholding evidence','Treaty analysis is fact-specific']},
  'itin-for-us-inheritance-estate-distribution': {label:'Estate route at a glance',items:['Tax purpose must be established','Estate or payer letter','Distribution / withholding evidence']},
  'itin-acceptable-documents-passport': {label:'Document rules at a glance',items:['13 IRS document types','Passport can stand alone','Original or issuing-agency certified copy']},
  'itin-for-form-1040nr': {label:'1040-NR route at a glance',items:['US-source income or filing need','Attach W-7 where required','Withholding forms support the return']}
};

export function GuideVisualSummary({slug}:{slug:string}) {
  const data=facts[slug]??{label:'ITIN route at a glance',items:['Correct Form W-7 reason','Current federal tax purpose','Permitted identity documents']} as FactSet;
  return <section aria-label={data.label} className="mx-auto -mt-7 max-w-5xl px-4 relative z-20">
    <div className="visual-summary grid overflow-hidden rounded-3xl lg:grid-cols-[1.15fr_2fr]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-gold/10 p-6 lg:border-b-0 lg:border-r">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-midnight"><FileCheck2 aria-hidden="true"/></span>
        <p className="font-display text-xl text-white">{data.label}</p>
      </div>
      <ol className="grid gap-0 sm:grid-cols-3">{data.items.map((item,index)=><li key={item} className="flex min-h-24 items-center gap-3 border-b border-white/10 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="text-xs font-black text-gold">0{index+1}</span><span className="text-sm font-semibold leading-6 text-slate-100">{item}</span>{index<2&&<ArrowRight className="ml-auto hidden text-gold/50 sm:block" size={16} aria-hidden="true"/>}</li>)}</ol>
    </div>
  </section>;
}
