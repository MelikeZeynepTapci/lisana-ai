/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/audio/:path*",
        destination: `${apiUrl}/audio/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
