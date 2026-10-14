import Head from 'next/head';
import Link from 'next/link';
import posts from '@/lib/blog-posts.json';
export default function Blog() { return <>
  <Head><title>ITIN Blog: Real Answers from a UK Acceptance Agent | ITIN Pro UK</title><meta name="description" content="Plain-English ITIN answers for UK and international applicants: Form W-7, renewals, FIRPTA, 1040-NR refunds, spouses, dependants and Certifying Acceptance Agent appointments."/><link rel="canonical" href="https://itinpro.uk/blog"/><meta property="og:title" content="ITIN Blog: Real Answers from a UK Acceptance Agent | ITIN Pro UK"/><meta property="og:url" content="https://itinpro.uk/blog"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/></Head>
  <section className="container-premium py-14 sm:py-20"><p className="eyebrow">ITIN Pro UK</p><h1 className="section-title mt-4">ITIN News &amp; Answers</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-silver">Straight answers from a UK-based Certifying Acceptance Agent service. Find your situation, then start your application.</p>
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map(p=><Link href={`/blog/${p.slug}`} key={p.slug} className="glass overflow-hidden rounded-3xl transition hover:border-gold/50"><img src={`/images/blog/${p.slug}-scenario.webp`} alt={p.image_scenario.alt} width={1600} height={900} loading="lazy" className="aspect-video w-full object-cover"/><div className="p-6"><span className="eyebrow">{p.category}</span><h2 className="mt-3 font-display text-2xl leading-snug">{p.title}</h2><p className="mt-4 text-sm leading-7 text-silver">{p.meta_description}</p></div></Link>)}</div>
  </section>
</>; }
