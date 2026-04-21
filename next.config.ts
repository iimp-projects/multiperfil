import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'multiperfil-qa-files.s3.sa-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'multiperfil-prod-files.s3.sa-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/eventlist",
        // Specific proxy for the dynamic event list (Always using the prod-like path as shared resource)
        destination: "https://secure2.iimp.org:8443/KBServiciosIIMPJavaEnvironment/rest/eventlist",
      },
      {
        source: "/api/proxy/:path*",
        // Generic proxy to External API based on environment variables
        destination: `${process.env.NEXT_PUBLIC_API_DOMAIN || "https://secure2.iimp.org:8443"}${process.env.NEXT_PUBLIC_API_BASE_PATH || "/rest"}/:path*`,
      },
    ];
  },
};

export default nextConfig;

