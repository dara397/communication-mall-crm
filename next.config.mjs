/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't fail the Vercel production build on lint warnings.
  eslint: { ignoreDuringBuilds: true },
  // @react-pdf/renderer ships browser + node builds; keep it external on the server
  // so Next doesn't try to bundle its native-ish deps.
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
