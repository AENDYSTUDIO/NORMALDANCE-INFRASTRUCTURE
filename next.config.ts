import type { NextConfig } from "next";

// Add bundle analyzer if enabled
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

const nextConfig: NextConfig = {
  // Оптимизация производительности
  reactStrictMode: true,
  
  // Оптимизация сборки (swcMinify устарел и включен по умолчанию в Next 15)
  
  // Оптимизация изображений
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 год
  },
  
  // Оптимизация шрифтов
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // serverComponentsExternalPackages перенесён в serverExternalPackages
    serverActions: {},
  },

  // Вне experimental начиная с Next 15
  serverExternalPackages: [],
  
  // Конфигурация ESLint (выключен для ускорения сборки)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Конфигурация TypeScript (выключен для ускорения сборки)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Оптимизация кэширования
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Оптимизация перенаправлений
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },
  
  // Оптимизация перезаписи URL
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: '/api/socketio',
      },
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
  
  // Конфигурация сборки
  output: 'standalone',
  
  // Оптимизация для Vercel
  trailingSlash: false,
  
  // Оптимизация для продакшена
  compress: true,
  
  // Оптимизация для разработки
  devIndicators: {
    // Переименовано: используем новый ключ position
    position: 'bottom-right',
  },
  
  // Конфигурация webpack
  webpack: (config, { dev, isServer }) => {
    // Оптимизация для продакшена
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
          // Добавление оптимизатора для CSS
          new (require('css-minimizer-webpack-plugin'))(),
        ],
      };
    }
    
    // Оптимизация для изображений
    config.module.rules.push({
      test: /\.(jpe?g|png|webp|gif|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'images/[hash][ext][query]',
      },
    });
    
    // Оптимизация для шрифтов
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'fonts/[hash][ext][query]',
      },
    });
    
    return config;
  },
  
  // Настройка корня трассировки для корректного определения монорепо/lockfile
  outputFileTracingRoot: process.cwd(),

  // Разрешённые origin'ы для dev (устранение предупреждения про cross-origin)
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // Конфигурация окружения
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Конфигурация basePath
  basePath: process.env.BASE_PATH || '',
  
  // Конфигурация assetPrefix
  assetPrefix: process.env.ASSET_PREFIX || '',

  // Конфигурация Sentry через @sentry/nextjs выполняется в плагине, не через next.config
};

export default withBundleAnalyzer(nextConfig);
