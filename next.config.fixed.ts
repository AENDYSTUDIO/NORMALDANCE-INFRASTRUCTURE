import type { NextConfig } from "next";

// Add bundle analyzer if enabled
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Оптимизация производительности
  reactStrictMode: true,

  // Оптимизация изображений
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 год
    domains: [
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
      "localhost",
      "normaldance.com",
      "www.normaldance.com",
    ],
  },

  // Оптимизация шрифтов
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    serverActions: {
      bodySizeLimit: "1mb",
    },
    typedRoutes: true,
  },

  // Вне experimental начиная с Next 15
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "argon2",
    "sharp",
    "zod",
    "@solana/web3.js",
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-phantom",
    "@ton/core",
    "@ton/ton",
    "@tonconnect/sdk",
    "helia",
    "multiformats",
    "@helia/unixfs",
  ],

  // Конфигурация ESLint (включен для качества кода)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Конфигурация TypeScript (включен для качества кода)
  typescript: {
    ignoreBuildErrors: false,
  },

  // 🔐 SECURITY: Enhanced headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'wasm-unsafe-eval' https://telegram.org https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.ipfs.io https://*.ipfs.dweb.link https://ipfs.io https://gateway.pinata.cloud https://cloudflare-ipfs.com",
              "connect-src 'self' https://api.mainnet-beta.solana.com https://ton.org https://tonapi.io wss://api.mainnet-beta.solana.com https://*.sentry.io",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=(self)",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3153600, immutable",
          },
        ],
      },
      {
        source: "/(assets|images|icons)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3153600, immutable",
          },
        ],
      },
    ];
  },

  // Оптимизация перенаправлений
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true,
      },
    ];
  },

  // Оптимизация перезаписи URL
  async rewrites() {
    return [
      {
        source: "/socket.io",
        destination: "/api/socketio",
      },
      {
        source: "/api/health",
        destination: "/api/health",
      },
    ];
  },

  // Оптимизация для Vercel
  trailingSlash: false,
  compress: true,

  // Оптимизация для разработки
  devIndicators: {
    position: "bottom-right",
  },

  // Конфигурация webpack
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }

    return config;
  },

  // Настройка корня трассировки
  outputFileTracingRoot: process.cwd(),

  // Разрешённые origin'ы для dev
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Конфигурация окружения
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Конфигурация basePath
  basePath: process.env.BASE_PATH || "",
  assetPrefix: process.env.ASSET_PREFIX || "",
};

// Export with bundle analyzer
export default withBundleAnalyzer(nextConfig);