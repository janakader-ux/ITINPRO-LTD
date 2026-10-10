import Link from 'next/link';
import { Building2, FileCheck2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { company } from '@/lib/site';

const credentials = [
  {
    icon: Building2,
    eyebrow: 'UK company record',
    title: `${company.legalName} · ${company.companyNumber}`,
    text: 'Active private limited company with a registered office in Bedford.',
    href: company.companiesHouseUrl,
    link: 'View Companies House record'
  },
  {
    icon: FileCheck2,
    eyebrow: 'Form W-7 support',
    title: 'CAA document route',
    text: 'Eligibility, reason code and evidence are reviewed before a submission route is agreed.'
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Original-document care',
    title: 'Avoid US passport mail where eligible',
    text: 'A compliant CAA route can keep an eligible verified original document out of the post to the IRS.'
  },
  {
    icon: LockKeyhole,
    eyebrow: 'Privacy by design',
    title: 'UK GDPR-conscious workflow',
    text: 'Do not upload passports or tax identifiers through the general enquiry form; secure instructions follow engagement.'
  }
];

export function TrustCredentials() {
  return <section aria-labelledby="credentials-title" className="relative border-y border-white/10 bg-[#080f24] py-16">
    <div className="container-premium">
      <div className="max-w-3xl">
        <p className="eyebrow">Trust, without borrowed authority</p>
        <h2 id="credentials-title" className="section-title mt-4">Verifiable details. Clear boundaries.</h2>
        <p className="mt-5 leading-8 text-silver">Our trust marks describe the service and public company record. They are not government seals and do not imply IRS endorsement.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {credentials.map(({icon:Icon,...item})=><article key={item.title} className="trust-tile rounded-3xl p-6">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold"><Icon aria-hidden="true" size={24}/></span>
          <p className="eyebrow mt-6">{item.eyebrow}</p>
          <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-silver">{item.text}</p>
          {item.href&&<Link className="mt-4 inline-flex text-sm font-bold text-gold underline underline-offset-4" href={item.href} target="_blank" rel="noreferrer">{item.link}</Link>}
        </article>)}
      </div>
      <p className="mt-7 text-xs leading-6 text-slate-400">Independent service. ITIN Pro is not part of the IRS, does not issue ITINs, and does not claim government endorsement. The IRS decides every application.</p>
    </div>
  </section>;
}
