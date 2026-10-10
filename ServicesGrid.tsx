import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { services } from '@/lib/site';

export function ServicesGrid() {
  return <section id="services" className="bg-navy py-24"><div className="container-premium">
    <p className="eyebrow">Focused cross-border support</p><h2 className="section-title mt-4 max-w-3xl">Complex US tax journeys, made clear.</h2>
    <div className="mt-12 grid gap-6 md:grid-cols-2">{services.map(service=><Link key={service.slug} href={`/services/${service.slug}`} className="group glass overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:border-gold/40">
      <div className="relative aspect-[16/8] overflow-hidden"><Image src={service.image} alt={`${service.title} advisory consultation`} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"/></div>
      <div className="p-7"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-2xl text-white">{service.title}</h3><p className="mt-3 leading-7 text-silver">{service.short}</p></div><ArrowUpRight className="size-6 shrink-0 text-gold"/></div></div>
    </Link>)}</div>
  </div></section>;
}
