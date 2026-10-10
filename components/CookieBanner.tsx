'use client';
import { useEffect, useState } from 'react';

export function CookieBanner(){
  const [show,setShow]=useState(false); const [settings,setSettings]=useState(false);
  useEffect(()=>setShow(!localStorage.getItem('itinpro-cookie-choice')),[]);
  const save=(analytics:boolean)=>{localStorage.setItem('itinpro-cookie-choice',JSON.stringify({necessary:true,analytics,date:new Date().toISOString()}));window.dispatchEvent(new Event('itinpro-consent-change'));setShow(false)};
  if(!show)return null;
  return <aside aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-gold/25 bg-card/95 p-5 shadow-glass backdrop-blur-xl"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex-1"><h2 className="font-bold">Your privacy choices</h2><p className="mt-1 text-sm leading-6 text-silver">Necessary storage keeps this preference. Optional analytics will only run if enabled.</p>{settings&&<label className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" disabled checked readOnly/>Necessary (always on)</label>}</div><div className="flex flex-wrap gap-2"><button className="outline-button" onClick={()=>setSettings(!settings)}>Manage</button><button className="outline-button" onClick={()=>save(false)}>Necessary only</button><button className="gold-button" onClick={()=>save(true)}>Allow analytics</button></div></div></aside>;
}
