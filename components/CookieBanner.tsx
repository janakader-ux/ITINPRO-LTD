'use client';
import { useEffect, useState } from 'react';
import { readCookieChoice, saveCookieChoice } from '@/lib/cookie-consent';

export function CookieSettingsButton(){
  return <button type="button" className="text-left underline underline-offset-4" onClick={()=>window.dispatchEvent(new Event('itinpro-open-cookie-settings'))}>Cookie settings</button>;
}
export function CookieBanner(){
  const [show,setShow]=useState(false),[settings,setSettings]=useState(false);
  const [analytics,setAnalytics]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    setShow(!readCookieChoice(localStorage));
    const open=()=>{setAnalytics(readCookieChoice(localStorage)?.analytics===true);setSettings(true);setShow(true);setError('');};
    window.addEventListener('itinpro-open-cookie-settings',open);
    return ()=>window.removeEventListener('itinpro-open-cookie-settings',open);
  },[]);
  const save=(accepted:boolean)=>{
    if(!saveCookieChoice(localStorage,accepted)){setError('Your browser could not save this choice. Please check its storage settings and try again.');window.dispatchEvent(new Event('itinpro-consent-change'));return;}
    window.dispatchEvent(new Event('itinpro-consent-change'));setShow(false);setSettings(false);
  };
  if(!show)return null;
  const choiceButton='outline-button flex-1 justify-center whitespace-nowrap';
  return <aside aria-label="Cookie preferences" className="cookie-preferences fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[85dvh] max-w-3xl overflow-y-auto rounded-2xl border border-gold/25 bg-card/95 p-5 shadow-glass backdrop-blur-xl">
    <h2 className="font-bold">Your privacy choices</h2>
    <p className="mt-1 text-sm leading-6 text-silver">We use necessary storage to remember your choice and keep the secure portal working. With your permission, optional Google Analytics cookies help us understand website use. <a className="underline" href="/privacy">Privacy &amp; cookie notice</a>.</p>
    {settings&&<div id="cookie-options" className="mt-4 grid gap-3 text-sm">
      <p>Necessary storage is always on. Optional analytics is off unless you choose to enable it.</p>
      <label className="flex items-center gap-3"><input type="checkbox" disabled checked readOnly/>Necessary (always on)</label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)}/>Optional analytics (Google Analytics)</label>
      <button type="button" className="outline-button justify-self-start" onClick={()=>save(analytics)}>Save preferences</button>
    </div>}
    <div className="cookie-actions mt-4 flex flex-wrap gap-2">
      <button type="button" className={choiceButton} onClick={()=>save(true)}>Accept all</button>
      <button type="button" className={choiceButton} onClick={()=>save(false)}>Reject optional cookies</button>
      <button type="button" className="outline-button justify-center" aria-expanded={settings} aria-controls="cookie-options" onClick={()=>{setAnalytics(readCookieChoice(localStorage)?.analytics===true);setSettings(!settings);}}>Manage preferences</button>
    </div>
    {error&&<p role="alert" className="mt-3 text-sm">{error}</p>}
  </aside>;
}
