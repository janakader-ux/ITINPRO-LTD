import type { AppProps } from 'next/app';
import '@/app/globals.css';
import { inter, playfair } from '@/lib/site-fonts';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { ConsentAnalytics } from '@/components/ConsentAnalytics';
export default function App({ Component, pageProps }: AppProps) {
  return <div className={`${inter.variable} ${playfair.variable} page-shell`} style={{fontFamily:"var(--font-inter), Inter, sans-serif"}}><SiteHeader/><main><Component {...pageProps}/></main><Footer/><CookieBanner/><ConsentAnalytics/></div>;
}
