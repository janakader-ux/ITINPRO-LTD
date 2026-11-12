import Image from 'next/image';
import Link from 'next/link';
import { company, contact } from '@/lib/site';
import { CookieSettingsButton } from './CookieBanner';

export function Footer() {
  return <footer className="border-t border-white/10 bg-[#070d20] py-14">
    <div className="container-premium grid gap-10 md:grid-cols-3">
      <div><Link href="/" aria-label="ITIN Pro home"><Image src="/itinpro-logo.svg" alt="ITIN PRO — Certified Acceptance Agents" width={960} height={360} className="h-auto w-full max-w-[320px] rounded-xl"/></Link><p className="mt-3 text-sm leading-7 text-silver">Independent UK service providing Certifying Acceptance Agent support. ITIN Pro is not the IRS and does not issue or guarantee ITINs.</p><p className="mt-4 text-xs leading-6 text-slate-400"><a className="text-gold underline underline-offset-4" href={company.companiesHouseUrl} target="_blank" rel="noreferrer">{company.legalName} · Company {company.companyNumber}</a><br/>{company.registeredOffice}<br/>{company.status} · {company.type}</p></div>
      <div><h3 className="font-bold text-white">Explore</h3><div className="mt-3 grid gap-2 text-sm text-silver"><Link href="/">Home</Link><Link href="/#services">Services</Link><Link href="/guides">ITIN Guides / FAQs</Link><Link href="/portal">Client portal</Link><Link href="/#enquiry">Smart enquiry</Link><Link href="/privacy">Privacy &amp; cookies</Link><CookieSettingsButton/></div></div>
      <div><h3 className="font-bold text-white">Contact</h3><p className="mt-3 text-sm leading-7 text-silver"><a href={`mailto:${contact.taz.email}`}>{contact.taz.email}</a><br/><a href={`tel:${contact.taz.phone.replace(/\s/g,'')}`}>{contact.taz.phone}</a><br/><a href={`mailto:${contact.shan.email}`}>{contact.shan.email}</a><br/><a href={`tel:${contact.shan.phone.replace(/\s/g,'')}`}>{contact.shan.phone}</a></p></div>
    </div>
  </footer>;
}

