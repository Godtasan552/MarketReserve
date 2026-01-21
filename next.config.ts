import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    silenceDeprecations: ['legacy-js-api', 'import', 'if-function', 'global-builtin', 'color-functions'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  serverExternalPackages: ['tesseract.js'],
  async redirects() {
    return [
      {
        source: '/bookings/:id',
        destination: '/my-bookings/:id',
        permanent: true,
      },
      {
        source: '/bookings',
        destination: '/my-bookings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
