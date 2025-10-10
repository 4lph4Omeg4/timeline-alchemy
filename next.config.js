/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'auth.timeline-alchemy.nl'],
  },
  // Optimize build performance
  experimental: {
    optimizeCss: true,
  },
  // Reduce build time by skipping type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
  // Skip debug routes in production builds
  async rewrites() {
    return {
      beforeFiles: [
        // Skip debug routes in production
        ...(process.env.NODE_ENV === 'production' ? [
          {
            source: '/api/debug/:path*',
            destination: '/404'
          }
        ] : [])
      ]
    }
  },
}

module.exports = nextConfig
