import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hfgnzkglmijlgwrbnaar.supabase.co',
      },
    ],
  },
};

export default nextConfig;
