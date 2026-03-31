/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/audio/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/audio/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
