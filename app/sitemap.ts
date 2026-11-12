import type { MetadataRoute } from 'next';
import posts from '@/lib/blog-posts.json';
import guides from '@/lib/guides.json';
import { services } from '@/lib/site';
import { isBlogPublished } from '@/lib/blog-publication';
export const revalidate = 3600;
export default function sitemap():MetadataRoute.Sitemap{const base='https://itinpro.uk';const publishedPosts=posts.filter(p=>isBlogPublished(p));return [{url:base,lastModified:new Date(),changeFrequency:'weekly',priority:1},{url:`${base}/guides`,lastModified:new Date(),changeFrequency:'weekly',priority:.9},{url:`${base}/privacy`,lastModified:new Date(),changeFrequency:'yearly',priority:.4},{url:`${base}/blog`,changeFrequency:'weekly',priority:.9},...publishedPosts.map(p=>({url:`${base}/blog/${p.slug}`,lastModified:p.date_published,changeFrequency:'monthly' as const,priority:.7,images:[`${base}/images/blog/${p.slug}-scenario.webp`,`${base}/images/blog/${p.slug}-infographic.webp`]})),...services.map(s=>({url:`${base}/services/${s.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.8})),...guides.map(g=>({url:`${base}/guides/${g.slug}`,lastModified:new Date(),changeFrequency:'monthly' as const,priority:.7}))];}
