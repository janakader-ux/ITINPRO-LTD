'use client';
import { useState,useEffect } from 'react';
import { parsePortalLinkFragment } from '@/lib/portal/login-link';
export function ConfirmLink() {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [tokenHash,setTokenHash]=useState(''),[tokenType,setTokenType]=useState('');
  useEffect(()=>{const link=parsePortalLinkFragment(window.location.hash);if(link){setTokenHash(link.tokenHash);setTokenType(link.tokenType);}else{setError('This page is missing a valid sign-in link. Open the latest link from your email, or request another link below.');}window.history.replaceState({},'', '/portal/confirm');},[]);
  async function confirm(){setBusy(true);try{const r=await fetch('/api/portal/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'confirm',tokenHash,tokenType})});const data=await r.json();if(r.ok)window.location.assign('/portal');else{setError(data.error);setBusy(false);}}catch{setError('Unable to sign in. Request a new link or try again.');setBusy(false);}}
  return <section className="portal-panel portal-login"><p className="eyebrow">ITIN PRO secure portal</p><h1>Confirm your sign-in</h1><p>Select Continue to use your single-use sign-in link. Opening this page alone does not sign you in.</p>{error && <p role="alert">{error}</p>}<button disabled={!tokenHash||busy} onClick={confirm}> {busy?'Signing in…':'Continue to sign in'}</button><p><a href="/portal">Request another link</a></p></section>;
}
