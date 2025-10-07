import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,

  // TypeScript and ESLint configuration for production
  typescript: {
    ignoreBuildErrors: false, // В продакшене не игнорируем ошибки
  },
  eslint: {
    ignoreDuringBuilds: false, // В продакшене не игнорируем ESLint ошибки
  },

  // React Strict Mode для продакшена
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ['gateway.pinata.cloud', 'ipfs.io', 'arweave.net'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer для продакшена
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\/]node_modules[\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    // Tree shaking для блокчейн библиотек
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@solana/web3.js': '@solana/web3.js/lib/index.browser.esm.js',
      };
    }

    return config;
  },

  // Headers for security
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects for SPA routing
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },

  // Environment variables that should be exposed to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Output configuration
  output: 'standalone',
};

export default nextConfig;
