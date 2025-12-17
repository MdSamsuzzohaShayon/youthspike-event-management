import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",   // ← REQUIRED for Docker

  // you can keep your options:
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
