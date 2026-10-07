import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const apiOrigin = process.env.API_UPSTREAM_ORIGIN?.replace(/\/$/, "");
    if (!apiOrigin) return [];

    return [{
      source: "/api/:path*",
      destination: `${apiOrigin}/api/:path*`,
    }];
  },
};

export default nextConfig;
