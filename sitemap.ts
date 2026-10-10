import type { MetadataRoute } from 'next';
import guides from '@/lib/guides.json';
import { services } from '@/lib/site';
export default function sitemap():MetadataRoute.Sitemap{const base='https://itinpro.uk';return [{url:base,lastModified:new Date(),changeFrequency:'weekly',priority:1},{url:`${base}/guides`,lastModified:new Date(),changeFrequency:'weekly',priority:.9},{url:`${base}/privacy`,lastModified:new Date(),changeFrequency:'yearly',priority:.4},...services.map(s=>({url:`${base}/services/${s.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.8})),...guides.map(g=>({url:`${base}/guides/${g.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.7}))];}
