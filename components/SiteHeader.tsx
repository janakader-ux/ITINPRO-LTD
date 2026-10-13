'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function SiteHeader() {
  const [open,setOpen]=useState(false);
  return <header className="sticky top-0 z-50 border-b border-white/10 bg-midnight/85 backdrop-blur-xl">
    <div className="container-premium flex min-h-20 items-center justify-between gap-6">
      <Link href="/" aria-label="ITIN Pro home" className="flex shrink-0 flex-col gap-1 py-3"><Image src="/itinpro-header-logo.svg" alt="ITIN PRO — ITIN application and CAA support" width={200} height={46} priority /><span className="text-xs leading-4 text-slate-200">Full ITIN application service</span></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-semibold text-slate-200 lg:flex">
        <Link href="/">Home</Link><Link href="/#services">Services</Link><Link href="/guides">ITIN Guides / FAQs</Link><Link href="/portal">Client portal</Link><Link href="/#locations">Locations</Link><Link className="gold-button" href="/#enquiry">Start your enquiry</Link>
      </nav>
      <button type="button" aria-expanded={open} aria-label="Open navigation" className="grid size-12 place-items-center rounded-full border border-white/15 lg:hidden" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
    {open&&<nav aria-label="Mobile navigation" className="container-premium grid gap-1 border-t border-white/10 py-4 text-base font-semibold lg:hidden">{[['Home','/'],['Services','/#services'],['ITIN Guides / FAQs','/guides'],['Client portal','/portal'],['Locations','/#locations'],['Start your enquiry','/#enquiry']].map(([label,href])=><Link key={label} href={href} onClick={()=>setOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 hover:bg-white/5">{label}</Link>)}</nav>}
  </header>;
}
