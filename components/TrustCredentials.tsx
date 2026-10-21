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
    eyebrow: 'IRS acceptance agent directory',
    title: 'ITIN Pro Ltd is IRS-listed',
    text: 'Verify our Bedford address and telephone number against our official IRS directory entry.',
    href: '#irs-verification',
    link: 'View our IRS listing details'
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
        <p className="eyebrow">Our credentials</p>
        <h2 id="credentials-title" className="section-title mt-4">IRS-listed. Independently verifiable.</h2>
        <p className="mt-5 leading-8 text-silver">ITIN Pro Ltd appears in the IRS United Kingdom acceptance agent directory. View our listing details below and verify them at the official source.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {credentials.map(({icon:Icon,...item})=><article key={item.title} className="trust-tile rounded-3xl p-6">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold"><Icon aria-hidden="true" size={24}/></span>
          <p className="eyebrow mt-6">{item.eyebrow}</p>
          <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-silver">{item.text}</p>
          {item.href&&<Link className="mt-4 inline-flex text-sm font-bold text-gold underline underline-offset-4" href={item.href} target={item.href.startsWith('#')?undefined:'_blank'} rel={item.href.startsWith('#')?undefined:'noreferrer'}>{item.link}</Link>}
        </article>)}
      </div>
      <div id="irs-verification" tabIndex={-1} className="mt-8 rounded-3xl border border-emerald/40 bg-emerald/10 p-6 sm:p-8" aria-labelledby="irs-listing-title">
        <p className="eyebrow">Our entry in the official IRS directory</p>
        <h3 id="irs-listing-title" className="mt-3 text-2xl font-bold">ITIN Pro Ltd</h3>
        <address className="mt-4 not-italic leading-8 text-slate-200">18 Sundew Close<br/>Bedford, Bedfordshire MK42 0SR<br/>United Kingdom<br/><a className="font-bold text-white underline" href="tel:+447864113967">+44 7864 113967</a></address>
        <p className="mt-4 text-sm leading-7 text-silver">Listing details checked on 21 October 2026. This summary shows only ITIN Pro Ltd. The IRS lists the telephone as 044 7864113967.</p>
        <a className="outline-button mt-5" href="https://www.irs.gov/individuals/international-taxpayers/acceptance-agents-united-kingdom#:~:text=ITIN%20Pro%20Ltd" target="_blank" rel="noopener noreferrer">Verify on IRS.gov ↗</a>
        <p className="mt-3 text-xs leading-6 text-slate-400">Opens the official IRS UK directory, which includes other agents. Search for “ITIN Pro Ltd” if your browser does not highlight our entry.</p>
      </div>
      <p className="mt-7 text-xs leading-6 text-slate-400">Independent service. ITIN Pro is not part of the IRS, does not issue ITINs, and does not claim government endorsement. The IRS decides every application.</p>
    </div>
  </section>;
}
