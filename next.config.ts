import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/phase-shift-rgb',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
