const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Modularize imports to reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Transpile specific packages for better tree-shaking
  transpilePackages: ['chart.js', 'react-chartjs-2'],
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Server-side only packages (exclude from client bundle)
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        // AWS SDK is server-only (S3 operations)
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
        // Bcrypt is server-only (authentication)
        'bcryptjs': 'commonjs bcryptjs',
        // CSV parsing is server-only
        'csv-parse': 'commonjs csv-parse',
        'csv-stringify': 'commonjs csv-stringify',
      })
    }
    
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)
