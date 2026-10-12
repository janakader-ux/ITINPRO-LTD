'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

import { itinCategories, getItinCategory, formatItinFee, serviceFeeScope, additionalChargesNotice, otherCategoryNotice, type ItinCategoryId } from '@/lib/itin-pricing';

export function LeadForm(){
  const [categoryId,setCategoryId]=useState<ItinCategoryId | ''>('');
  const category=getItinCategory(categoryId);
  useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('service');if(requested&&getItinCategory(requested))setCategoryId(requested as ItinCategoryId);},[]);
  const formRef=useRef<HTMLFormElement>(null);
  const [step,setStep]=useState(1); const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [errorMessage,setErrorMessage]=useState('');
  const [checkoutToken,setCheckoutToken]=useState<string>();
  const [notificationPending,setNotificationPending]=useState(false);
  const [paying,setPaying]=useState(false);
  function advance(){const group=formRef.current?.querySelector(`[data-step="${step}"]`);const controls=group?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input,select,textarea')||[];for(const control of controls){if(!control.reportValidity())return;}setStep(step+1);}
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setStatus('sending');setErrorMessage('');
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res=await fetch('/api/enquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
      const result=await res.json();
      if(!res.ok){setErrorMessage(`${result.error || 'Unable to submit enquiry.'}${result.requestId ? ` Reference: ${result.requestId}` : ''}`);setStatus('error');return;}
      setCheckoutToken(result.checkoutToken);setNotificationPending(result.notification==='pending');setStatus('sent');
    } catch {setErrorMessage('We could not confirm submission. Please contact us before submitting again.');setStatus('error');}
  }
  async function pay(){
    setPaying(true);setErrorMessage('');
    try {
      const res=await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:checkoutToken})});
      const result=await res.json();
      if(!res.ok)throw new Error(result.error || 'Payment is temporarily unavailable.');
      const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error('Invalid payment destination.');
      window.location.assign(url.toString());
    } catch(error){setErrorMessage(error instanceof Error ? error.message : 'Unable to open payment.');setPaying(false);}
  }
  return <section id="enquiry" className="bg-navy py-24"><div className="container-premium grid gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><p className="eyebrow">Smart ITIN enquiry</p><h2 className="section-title mt-4">Tell us what brought you here.</h2><p className="mt-5 leading-8 text-silver">We use this information to identify the service you need and, for ITIN enquiries, the likely Form W-7 route. Do not upload or enter passport numbers, tax identification numbers or bank details.</p></div>
    <form ref={formRef} onSubmit={submit} className="glass rounded-3xl p-6 sm:p-8"><div className="mb-6 flex gap-2">{[1,2,3].map(n=><span key={n} className={`h-1.5 flex-1 rounded-full ${n<=step?'bg-gold':'bg-white/10'}`}/>)}</div>
      <div data-step="1" hidden={step!==1} className="grid gap-5"><label className="grid gap-2 font-semibold">Full name<input required name="name" autoComplete="name" className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"/></label><label className="grid gap-2 font-semibold">Email<input required type="email" name="email" autoComplete="email" className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"/></label><label className="grid gap-2 font-semibold">Phone<input name="phone" autoComplete="tel" className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"/></label></div>
      <div data-step="2" hidden={step!==2} className="grid gap-5"><label className="grid gap-2 font-semibold">Service category<select required name="serviceCategory" value={categoryId} onChange={e=>setCategoryId(e.target.value as ItinCategoryId)} className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"><option value="" disabled>Choose your service category</option>{itinCategories.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><input type="hidden" name="reason" value={category?.label || ''}/>{category&&<div role="status" aria-live="polite" className="rounded-xl border border-gold/30 bg-gold/10 p-4"><p className="font-semibold text-gold">{formatItinFee(category.amount)}</p><p className="mt-2 text-sm leading-6 text-silver">{serviceFeeScope(category.id)}</p><p className="mt-2 text-sm leading-6 text-silver">{additionalChargesNotice}</p>{category.id==='other'&&<p className="mt-2 text-sm leading-6">{otherCategoryNotice}</p>}{category.id==='llc-bank-account'&&<label className="mt-3 flex gap-3 text-sm leading-6"><input key="llc-bank-confirmation" required type="checkbox" name="llcAndEinConfirmed" value="yes" className="mt-1"/>I confirm I have an LLC and its EIN number. Please do not enter your EIN or bank account details in this public form.</label>}{category.id==='prepared-1040nr'&&<p className="mt-2 text-sm leading-6">The £395 fee applies when your 1040-NR tax return is already prepared. If you need us to prepare it, select US tax return preparation for a separate quote.</p>}</div>}<label className="grid gap-2 font-semibold">Where are you based?<input required name="location" placeholder="Town and country" className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"/></label><label className="grid gap-2 font-semibold">Preferred appointment<select name="appointment" className="min-h-12 rounded-xl border border-white/15 bg-midnight px-4"><option>Bedford office</option><option>UK home / office visit</option><option>Travel hub appointment</option><option>Initial video consultation</option><option>Not sure</option></select></label></div>
      <div data-step="3" hidden={step!==3} className="grid gap-5">{category&&<div className="rounded-xl border border-white/15 p-4"><p className="font-semibold">{category.label}</p><p className="mt-2 text-gold">{formatItinFee(category.amount)}</p><p className="mt-2 text-sm text-silver">{serviceFeeScope(category.id)}</p><p className="mt-2 text-sm text-silver">{additionalChargesNotice}</p>{category.id==='other'&&<p className="mt-2 text-sm text-silver">{otherCategoryNotice}</p>}</div>}<label className="grid gap-2 font-semibold">{category?.id==='other'?'Describe your unlisted ITIN category':'Brief case summary'}<textarea required name="message" rows={6} className="rounded-xl border border-white/15 bg-midnight p-4" placeholder="Please exclude passport numbers, tax IDs and bank details."/></label><label className="flex gap-3 text-sm leading-6 text-silver"><input required name="consent" type="checkbox" value="yes" className="mt-1"/>I consent to ITIN Pro using these details to respond to my enquiry and acknowledge the privacy notice.</label><label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      {status!=='sent'&&<div className="mt-7 flex justify-between gap-3">{step>1?<button disabled={status==='sending'} type="button" className="outline-button" onClick={()=>setStep(step-1)}><ArrowLeft className="size-4"/>Back</button>:<span/>}{step<3?<button type="button" className="gold-button" onClick={advance}>Continue<ArrowRight className="size-4"/></button>:<button disabled={status==='sending'} className="gold-button" type="submit">{status==='sending'?'Sending…':'Send secure enquiry'}</button>}</div>}
      {status==='sent'&&<div role="status" className="mt-5"><p className="flex gap-2 text-emerald"><CheckCircle2/>Thank you. Your enquiry has been securely received.</p>{notificationPending&&<p className="mt-3 text-silver">The staff email notification could not be sent. Your enquiry is saved; please email Taz@itinpro.uk or Shan@itinpro.uk quoting your details.</p>}{checkoutToken&&<><p className="mt-4 text-silver">Sandbox payment is available for testing. No real funds will be charged.</p><button type="button" disabled={paying} onClick={pay} className="gold-button mt-4">{paying?'Opening…':'Continue to test payment'}</button></>}</div>}
      {errorMessage&&<p role="alert" className="mt-5 text-red-300">{errorMessage} Please email Taz@itinpro.uk or Shan@itinpro.uk if you need help.</p>}
    </form></div></section>;
}
