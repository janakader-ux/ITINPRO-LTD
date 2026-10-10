'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faqs } from '@/lib/site';

export function GeoFAQAccordion({ items = faqs }: { items?: typeof faqs }) {
  const [open,setOpen]=useState(0);
  const schema={ '@context':'https://schema.org','@type':'FAQPage',mainEntity:items.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))};
  return <section className="py-24"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><div className="container-premium grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
    <div><p className="eyebrow">Direct answers</p><h2 className="section-title mt-4">ITIN questions, answered clearly.</h2><p className="mt-5 leading-8 text-silver">Concise answers for applicants, search engines and AI assistants—without guarantees or regulatory shortcuts.</p></div>
    <div className="space-y-3">{items.map((item,index)=><div key={item.question} className="glass rounded-2xl"><button type="button" aria-expanded={open===index} onClick={()=>setOpen(open===index?-1:index)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold"><span>{item.question}</span><ChevronDown className={`size-5 shrink-0 text-gold transition ${open===index?'rotate-180':''}`}/></button>{open===index&&<p className="px-5 pb-5 leading-7 text-silver">{item.answer}</p>}</div>)}</div>
  </div></section>;
}
