'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const links=[['Home','/'],['Services','/#services'],['ITIN Guides / FAQs','/guides'],['Blog','/blog'],['Client portal','/portal'],['Locations','/#locations']];
export function SiteHeader() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const wide=window.matchMedia('(min-width: 1440px)');
    const close=()=>{if(wide.matches)setOpen(false);};
    wide.addEventListener('change',close);
    return ()=>wide.removeEventListener('change',close);
  },[]);
  return <header className="site-header sticky top-0 z-50 border-b border-white/10 bg-midnight/95 backdrop-blur-xl" onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);document.getElementById('navigation-toggle')?.focus();}}}>
    <div className="container-premium header-row">
      <Link href="/" aria-label="ITIN Pro home" className="header-brand"><Image src="/itinpro-header-logo.svg" alt="ITIN PRO — Certified Acceptance Agents" width={960} height={360} className="h-auto w-full rounded-lg" priority /></Link>
      <nav aria-label="Main navigation" className="desktop-navigation">{links.map(([label,href])=><Link key={label} href={href}>{label}</Link>)}</nav>
      <div className="header-actions"><Link className="gold-button" href="/#enquiry" onClick={()=>setOpen(false)}>Start your enquiry</Link><Link className="application-button" href="/apply" onClick={()=>setOpen(false)}>Start application</Link></div>
      <button id="navigation-toggle" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?'Close navigation':'Open navigation'} className="navigation-toggle" onClick={()=>setOpen(!open)}>{open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button>
    </div>
    {open&&<nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navigation container-premium">{links.map(([label,href])=><Link key={label} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</nav>}
  </header>;
}
