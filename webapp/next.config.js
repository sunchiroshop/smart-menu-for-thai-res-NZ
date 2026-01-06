/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Added for Google profile pics
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // For avatar generation
      },
    ],
  },
  // Suppress Fast Refresh warnings for development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Ignore 404s for webpack hot-update and devtools
  async rewrites() {
    return [
      {
        source: '/_next/static/webpack/:path*',
        destination: '/404',
      },
      {
        source: '/.well-known/:path*',
        destination: '/404',
      },
    ];
  },
};

module.exports = nextConfig;

