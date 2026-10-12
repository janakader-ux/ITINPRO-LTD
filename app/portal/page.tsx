import { PortalApp } from '@/components/portal/PortalApp';
import { portalEnabled } from '@/lib/portal/server';
export const dynamic='force-dynamic';
export default function PortalPage(){return <PortalApp enabled={portalEnabled()}/>;}
