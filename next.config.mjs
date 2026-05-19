import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Media uploads are handled by a Server Action in /admin, so raise the default 1MB limit.
      bodySizeLimit: "250mb",
    },
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return []
  },
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig
