import type { Metadata } from 'next';
import { LeadForm } from '@/components/LeadForm';

export const metadata:Metadata={
  title:'ITIN application from the UK | Form W-7 | ITIN PRO',
  description:'Apply for a U.S. ITIN from the UK with Form W-7 support from an IRS Certified Acceptance Agent. Check eligibility, documents and renewal steps.',
  keywords:['ITIN application UK','Form W-7 UK','apply for ITIN from UK','ITIN renewal UK','US tax identification number UK','IRS Certified Acceptance Agent UK','ITIN for non-residents'],
  alternates:{canonical:'/apply'},
};

export default function ApplyPage(){
  return <><section className="pt-16"><div className="container-premium max-w-4xl"><h1 className="section-title">Start your ITIN application</h1><p className="mt-5 text-lg text-silver">Applying for a U.S. Individual Taxpayer Identification Number (ITIN) from the UK? Start here for a new ITIN or renewal. We’ll guide you through Form W-7, the information and documents needed, and your next steps.</p></div></section><LeadForm startApplication/></>;
}
