/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'llz1c88so4.ufs.sh',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;


