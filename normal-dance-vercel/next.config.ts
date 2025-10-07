import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove webpack modifications that interfere with development
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
