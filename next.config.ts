import type { NextConfig } from 'next';
import guides from './lib/guides.json';

const nextConfig: NextConfig = {
  // Public images already ship as compressed WebP/SVG. Avoid native image
  // transcoding at request time on the 512 MB Render instance.
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/itin-guides.html', destination: '/guides', permanent: true },
      { source: '/smart-itin-form.html', destination: '/#enquiry', permanent: true },
      { source: '/itin-document-rules.html', destination: '/guides/itin-acceptable-documents-passport', permanent: true },
      ...guides.map((guide) => ({ source: guide.legacyPath, destination: `/guides/${guide.slug}`, permanent: true }))
    ];
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
      ]
    }];
  }
};

export default nextConfig;
