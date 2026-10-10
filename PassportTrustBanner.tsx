import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

export function PassportTrustBanner() {
  return <section className="py-20"><div className="container-premium grid items-center gap-10 lg:grid-cols-2">
    <div className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-gold/20 shadow-gold"><Image src="/images/passport-verification.webp" alt="Careful passport verification at a private appointment" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover"/></div>
    <div><p className="eyebrow">Document safety</p><h2 className="section-title mt-4">Keep your passport safe—without overstating the rules.</h2><p className="mt-5 text-lg leading-8 text-silver">For eligible applicants, a CAA can inspect the original passport or an issuing-agency certified copy and prepare Form W-7 (COA), so the verified document does not need to be sent to the IRS.</p>
      <ul className="mt-6 space-y-3 text-slate-200">{['Bedford appointments by arrangement','UK home or office visits subject to availability and travel fee','Video may support the interview, but the CAA must possess the required document','Applicant type and dependent rules checked before confirmation'].map(x=><li key={x} className="flex gap-3"><CheckCircle2 className="mt-1 size-5 shrink-0 text-emerald"/><span>{x}</span></li>)}</ul>
    </div>
  </div></section>;
}
