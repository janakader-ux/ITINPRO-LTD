import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import guides from '@/lib/guides.json';
import { guideImage } from '@/lib/site';

export const metadata:Metadata={title:'ITIN Guides & FAQs',description:'Plain-English guidance for UK and European applicants on Form W-7, ITIN categories, documents, renewals, 1040-NR and US tax situations.',alternates:{canonical:'/guides'}};

export default function Guides(){return <section className="py-20"><div className="container-premium"><p className="eyebrow">Knowledge centre</p><h1 className="section-title mt-4">ITIN Guides &amp; FAQs</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-silver">Practical, UK-focused explanations covering documents, Form W-7 categories, tax returns and common cross-border situations.</p><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{guides.map(g=><Link key={g.slug} href={`/guides/${g.slug}`} className="glass group overflow-hidden rounded-3xl"><div className="relative aspect-[16/9]"><Image src={guideImage(g.category,g.slug)} alt={`${g.title} editorial guide image`} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-6"><span className="eyebrow">{g.category}</span><h2 className="mt-3 font-display text-2xl leading-tight">{g.title}</h2><p className="mt-3 text-sm leading-6 text-silver">{g.description}</p></div></Link>)}</div></div></section>}
