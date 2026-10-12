import type { Metadata } from 'next';
import './portal.css';
export const metadata:Metadata={title:'Secure client portal',robots:{index:false,follow:false},alternates:{canonical:'/portal'}};
export default function PortalLayout({children}:{children:React.ReactNode}) { return <div className="client-portal">{children}</div>; }
