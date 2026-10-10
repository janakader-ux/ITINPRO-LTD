import Image from 'next/image';
import Link from 'next/link';

const journeys = [
  {title:'US property sale',detail:'FIRPTA · Exception 4',href:'/guides/itin-for-sale-of-us-property',image:'/images/guide-property-firpta-v3.webp',alt:'UK property owner reviewing a US property sale and FIRPTA documents'},
  {title:'Partnership income',detail:'Schedule K-1 · Form 8805',href:'/guides/itin-for-partnership-interest',image:'/images/guide-partnership-k1-8805-v2.webp',alt:'International business partners reviewing Schedule K-1 and Form 8805'},
  {title:'401(k) or pension',detail:'US distribution · UK resident',href:'/guides/itin-for-401k-pension-annuity',image:'/images/guide-401k-pension-v2.webp',alt:'UK resident reviewing a US 401(k) pension distribution'},
  {title:'Spouse or dependent',detail:'Family tax filing',href:'/guides/itin-for-spouse-of-us-citizen',image:'/images/guide-family-spouse-dependent-v2.webp',alt:'Family discussing ITIN requirements for a spouse and dependent child'},
  {title:'US bank account',detail:'Tax identification review',href:'/guides/itin-for-us-bank-account',image:'/images/guide-us-bank-account-v2.webp',alt:'International applicant reviewing US bank tax identification requirements'},
  {title:'Royalties and KDP',detail:'Publisher income · withholding',href:'/guides/itin-for-amazon-kdp-authors-uk',image:'/images/guide-royalty-1099-v2.webp',alt:'UK author reviewing US royalty and withholding records'},
  {title:'US inheritance',detail:'Estate distribution',href:'/guides/itin-for-us-inheritance-estate-distribution',image:'/images/guide-inheritance-estate-v2.webp',alt:'UK beneficiary reviewing a US estate distribution'},
  {title:'Withholding refund',detail:'1042-S · 1040-NR review',href:'/guides/itin-for-us-gambling-winnings-refund',image:'/images/guide-withholding-refund-v2.webp',alt:'Adviser reviewing US withholding and refund claim documents'}
];

function JourneyCard({item,duplicate=false}:{item:(typeof journeys)[number],duplicate?:boolean}) {
  return <Link href={item.href} tabIndex={duplicate?-1:undefined} className="journey-card group" aria-hidden={duplicate||undefined}>
    <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl">
      <Image src={item.image} alt={duplicate?'':item.alt} fill sizes="(max-width: 640px) 82vw, 360px" className="object-cover transition duration-700 group-hover:scale-105"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#081027] via-transparent to-transparent"/>
    </div>
    <div className="p-5"><p className="text-lg font-bold text-white">{item.title}</p><p className="mt-1 text-sm text-gold">{item.detail}</p></div>
  </Link>;
}

export function ApplicationJourneys() {
  return <section aria-labelledby="journeys-title" className="overflow-hidden py-24">
    <div className="container-premium">
      <p className="eyebrow">See your situation</p>
      <h2 id="journeys-title" className="section-title mt-4 max-w-4xl">Recognisable routes—not generic tax imagery.</h2>
      <p className="mt-5 max-w-3xl leading-8 text-silver">Choose the US event that brought you here. Each guide explains the likely W-7 route, evidence and next practical step.</p>
    </div>
    <div className="journey-window mt-12" aria-label="Common ITIN application situations">
      <div className="journey-track">
        <div className="journey-set">{journeys.map(item=><JourneyCard key={item.title} item={item}/>)}</div>
        <div className="journey-set" aria-hidden="true">{journeys.map(item=><JourneyCard key={`copy-${item.title}`} item={item} duplicate/>)}</div>
      </div>
    </div>
  </section>;
}
