import Image from 'next/image';
import Link from 'next/link';
import { HeroSection } from '@/components/HeroSection';
import { PassportTrustBanner } from '@/components/PassportTrustBanner';
import { ServicesGrid } from '@/components/ServicesGrid';
import { GeoFAQAccordion } from '@/components/GeoFAQAccordion';
import { LeadForm } from '@/components/LeadForm';
import { TrustCredentials } from '@/components/TrustCredentials';
import { ApplicationJourneys } from '@/components/ApplicationJourneys';
import { FullApplicationService } from '@/components/FullApplicationService';
import guides from '@/lib/guides.json';
import { company, contact, guideImage } from '@/lib/site';

export default function Home(){
  const schema={
    '@context':'https://schema.org','@type':['ProfessionalService','LocalBusiness'],name:'ITIN Pro UK',legalName:company.legalName,url:'https://itinpro.uk',email:[contact.taz.email,contact.shan.email],telephone:contact.taz.phone,
    identifier:{'@type':'PropertyValue',propertyID:'UK Companies House',value:company.companyNumber},
    address:{'@type':'PostalAddress',streetAddress:'18 Sundew Close',addressLocality:'Bedford',addressRegion:'Bedfordshire',postalCode:'MK42 0SR',addressCountry:'GB'},
    areaServed:[{'@type':'Country',name:'United Kingdom'},{'@type':'AdministrativeArea',name:'Europe'}],
    knowsAbout:['Form W-7','Individual Taxpayer Identification Number','Form 1040-NR','FIRPTA','US non-resident taxation'],
    openingHoursSpecification:[{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday'],opens:'09:00',closes:'17:30'}]
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><HeroSection/><TrustCredentials/><PassportTrustBanner/><FullApplicationService/><LeadForm/><ServicesGrid/><ApplicationJourneys/>
    <section id="locations" className="py-24"><div className="container-premium grid items-center gap-10 lg:grid-cols-2"><div><p className="eyebrow">Appointments that fit real life</p><h2 className="section-title mt-4">Bedford-based. UK-wide by arrangement.</h2><p className="mt-5 leading-8 text-silver">Meet at our Bedford base, request an agreed home or office visit, or ask about selected St Pancras, Heathrow and Luton appointments. Travel costs are quoted before confirmation.</p></div><div className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-gold/20"><Image src="/images/mobile-visit.webp" alt="ITIN Pro adviser arriving for a UK home appointment" fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/></div></div></section>
    <section className="bg-navy py-24"><div className="container-premium"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Knowledge centre</p><h2 className="section-title mt-4">ITIN Guides &amp; FAQs</h2></div><Link href="/guides" className="outline-button">View all {guides.length} guides</Link></div><div className="mt-10 grid gap-6 md:grid-cols-3">{guides.slice(0,3).map(g=><Link key={g.slug} href={`/guides/${g.slug}`} className="glass group overflow-hidden rounded-3xl"><div className="relative aspect-[16/9]"><Image src={guideImage(g.category,g.slug)} alt={`${g.title} editorial guide image`} fill sizes="(max-width:768px) 100vw,33vw" className="object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-6"><span className="eyebrow">{g.category}</span><h3 className="mt-3 font-display text-2xl">{g.title}</h3></div></Link>)}</div></div></section>
    <GeoFAQAccordion/>
    <div className="border-t border-gold/30 py-6"><p className="container-premium text-center font-semibold text-gold">ITIN Pro provides the full ITIN application service only. No passport-only certification or standalone Form W-7 (COA).</p></div>
  </>;
}
