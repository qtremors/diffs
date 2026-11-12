import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Repeated production builds must use current CSS, not stale persisted transforms.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
