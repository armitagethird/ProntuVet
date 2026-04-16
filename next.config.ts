import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hfgnzkglmijlgwrbnaar.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'wfiolpylleatfxiznxmc.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'sonner'],
    // ppr: 'incremental' isdeprecated in your version, let's use the new architecture
    // for high speed shells or disable if environment is unstable.
  },
};

export default nextConfig;
