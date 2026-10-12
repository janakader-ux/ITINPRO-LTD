import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/portal/','/portal']},sitemap:'https://itinpro.uk/sitemap.xml'};}
