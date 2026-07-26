import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
