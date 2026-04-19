/** @type {import('next').NextConfig} */
const nextConfig = {
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
    serverComponentsExternalPackages: ['@supabase/ssr'],
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
      'sonner', 
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      'clsx',
      'tailwind-merge'
    ],
  },
};

export default nextConfig;
