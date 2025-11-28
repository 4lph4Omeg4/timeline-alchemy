/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'auth.timeline-alchemy.nl'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Optimize build performance
  // Note: optimizeCss requires 'critters' package, disabled for now
  // experimental: {
  //   optimizeCss: true,
  // },
  // Reduce build time by skipping type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  // Disable rewrites temporarily to diagnose routing issues
  // async rewrites() {
  //   return {
  //     beforeFiles: []
  //   }
  // },
}

module.exports = nextConfig
