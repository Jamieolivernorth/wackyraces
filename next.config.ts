import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/demo',
        destination: '/dashboard',
      },
    ];
  },
};

export default nextConfig;
