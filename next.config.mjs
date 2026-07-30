import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: true,
  experimental: {
    cpus: 4,
    serverActions: {
      // Media uploads are handled by a Server Action in /admin, so raise the default 1MB limit.
      bodySizeLimit: "250mb",
    },
    // Limit parallel static-generation workers to prevent DB connection pool exhaustion.
    // Without this, Next.js spawns 15 workers × N concurrent queries, saturating serverless DB limits.
    staticGenerationMaxConcurrency: 4,
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/tuoi-sinh-hoc",
        destination: "/tinh-tuoi-sinh-hoc",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/tinh-tuoi-sinh-hoc-:age(\\d{1,3})",
          destination: "/tinh-tuoi-sinh-hoc?age=:age",
        },
      ],
    }
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
