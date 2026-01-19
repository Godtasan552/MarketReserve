import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    silenceDeprecations: ['legacy-js-api', 'import'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
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
