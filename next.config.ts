import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @netlify/plugin-nextjs to package the Node.js proxy function.
  // In Next.js 16 the NEXT_PRIVATE_STANDALONE env var no longer triggers
  // standalone mode — only this config key does.
  output: 'standalone',

  // Enable gzip/brotli compression
  compress: true,

  // Image optimization — allow Supabase storage URLs
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Skip type-check during build (types checked separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Tree-shake heavy icon/animation libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Security and Cache Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
