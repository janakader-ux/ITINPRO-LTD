import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { ConsentAnalytics } from '@/components/ConsentAnalytics';

const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});
const playfair=Playfair_Display({subsets:['latin'],variable:'--font-playfair',display:'swap'});

export const metadata:Metadata={
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://itinpro.uk'),
  title:{default:'ITIN Pro UK | IRS Certifying Acceptance Agent Support',template:'%s | ITIN Pro UK'},
  description:'UK Certifying Acceptance Agent support for Form W-7, ITIN applications and 1040-NR returns, with compliant passport verification so eligible originals are not mailed to the IRS.',
  alternates:{canonical:'/'},
  openGraph:{title:'ITIN Pro UK',description:'UK ITIN, Form W-7 and 1040-NR support with compliant CAA passport verification.',url:'/',siteName:'ITIN Pro UK',locale:'en_GB',type:'website'},
  robots:{index:true,follow:true}
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en-GB" className={`${inter.variable} ${playfair.variable}`}><body><div className="page-shell"><SiteHeader/><main>{children}</main><Footer/><CookieBanner/><ConsentAnalytics/></div></body></html>;
}
