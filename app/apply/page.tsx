import type { Metadata } from 'next';
import { LeadForm } from '@/components/LeadForm';

export const metadata:Metadata={
  title:'Start your ITIN application',
  description:'Start your ITIN application with ITIN PRO. Select your situation, check the required documents and complete your details.',
  alternates:{canonical:'/apply'},
};

export default function ApplyPage(){
  return <><section className="pt-16"><div className="container-premium max-w-4xl"><h1 className="section-title">Start your ITIN application</h1><p className="mt-5 text-lg text-silver">Select your application category below to begin. We’ll guide you through your details, eligibility and the next steps.</p></div></section><LeadForm startApplication/></>;
}
