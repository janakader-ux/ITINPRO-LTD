import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return { rules: ['*','Googlebot','Bingbot','GPTBot','ClaudeBot','PerplexityBot','Google-Extended'].map(userAgent => ({ userAgent, allow: '/', disallow: ['/api/','/portal/','/portal'] })), sitemap: 'https://itinpro.uk/sitemap.xml' }; }
