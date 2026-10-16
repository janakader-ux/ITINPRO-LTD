'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { analyticsAllowed } from '@/lib/cookie-consent';

export function ConsentAnalytics() {
  const pathname=usePathname();
  const privatePortal=pathname?.startsWith('/portal') ?? false;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const refresh = () => {
      const allowed=analyticsAllowed(localStorage,privatePortal);
      if(measurementId)(window as unknown as Record<string,unknown>)[`ga-disable-${measurementId}`]=!allowed;
      setEnabled(allowed);
      if(!allowed){
        // Remove first-party GA cookies on withdrawal; never touch portal cookies.
        const domains=[window.location.hostname,window.location.hostname.replace(/^www\./,'')];
        for(const cookie of document.cookie.split(';')){
          const name=cookie.trim().split('=')[0];
          if(!/^_ga(?:_|$)/.test(name))continue;
          document.cookie=`${name}=; Max-Age=0; Path=/`;
          for(const domain of domains)document.cookie=`${name}=; Max-Age=0; Path=/; Domain=${domain}`;
        }
      }
    };
    refresh();
    window.addEventListener('itinpro-consent-change', refresh);
    return () => window.removeEventListener('itinpro-consent-change', refresh);
  }, [measurementId,privatePortal]);
  if (!measurementId || !enabled || privatePortal) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    <Script id="itinpro-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}</Script>
  </>;
}

