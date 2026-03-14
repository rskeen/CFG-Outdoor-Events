/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Allow server actions from any origin in production (Vercel domains vary)
      // and localhost in dev. Falls back to allowing all if APP_URL not set.
      allowedOrigins: process.env.NEXT_PUBLIC_APP_URL
        ? [
            process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, ""),
            "localhost:3000",
          ]
        : ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
