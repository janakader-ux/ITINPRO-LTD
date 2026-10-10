'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';

function hasAnalyticsConsent() {
  try {
    const stored = localStorage.getItem('itinpro-cookie-choice');
    return stored ? Boolean(JSON.parse(stored).analytics) : false;
  } catch {
    return false;
  }
}

export function ConsentAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const refresh = () => setEnabled(hasAnalyticsConsent());
    refresh();
    window.addEventListener('itinpro-consent-change', refresh);
    return () => window.removeEventListener('itinpro-consent-change', refresh);
  }, []);
  if (!measurementId || !enabled) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    <Script id="itinpro-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}</Script>
  </>;
}
