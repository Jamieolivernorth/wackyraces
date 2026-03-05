import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/demo',
        destination: '/admin',
      },
    ];
  },
};

export default nextConfig;
