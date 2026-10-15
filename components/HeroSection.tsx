'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react';

export function HeroSection() {
  return <section className="relative min-h-[620px] sm:min-h-[760px] overflow-hidden border-b border-white/10">
    <Image src="/images/hero-consultation.webp" alt="Private ITIN consultation with a UK tax adviser" fill priority sizes="100vw" className="object-cover object-center" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,17,40,.99)_0%,rgba(10,17,40,.94)_35%,rgba(10,17,40,.55)_67%,rgba(10,17,40,.28)_100%)]" />
    <div className="container-premium relative z-10 flex min-h-[620px] sm:min-h-[760px] items-center py-16 sm:py-24">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7}} className="max-w-3xl">
        <p className="eyebrow">UK-based IRS Certifying Acceptance Agent support</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">Keep your passport close.<br/><span className="gold-text">Move your ITIN forward.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Form W-7, 1040-NR and cross-border US tax support for UK and European applicants—with compliant document checks and clear next steps.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="#enquiry" className="gold-button">Choose your service</Link><Link href="/guides" className="outline-button">Explore ITIN Guides / FAQs</Link></div>
        <div className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
          {[['IRS CAA support',BadgeCheck],['UK GDPR-conscious process',ShieldCheck],['No passport upload on enquiry',LockKeyhole],['Bedford & UK travel options',MapPin]].map(([label,Icon]) => <div key={String(label)} className="glass flex min-h-14 items-center gap-3 rounded-xl px-4"><Icon className="size-5 text-emerald"/><span>{String(label)}</span></div>)}
        </div>
      </motion.div>
    </div>
  </section>;
}
