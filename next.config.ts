import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @netlify/plugin-nextjs to handle SSR correctly
  output: "standalone",

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

  // ESLint: don't block builds on lint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Tree-shake heavy icon/animation libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
