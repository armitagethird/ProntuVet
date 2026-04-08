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
    ],
  },
};

export default nextConfig;
