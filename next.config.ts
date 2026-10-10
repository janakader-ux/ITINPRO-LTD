import type { NextConfig } from 'next';
import guides from './lib/guides.json';

const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  async redirects() {
    return [
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
