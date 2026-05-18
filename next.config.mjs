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
    return [
      // Slug-collision suffixes stripped by prisma/fix-slug-suffixes.ts (2026-05-19)
      { source: "/dau-nhuc-xuong-khop-1/lam-viec-tai-nha-khong-met-moi-voi-quy-tac-50-10", destination: "/dau-nhuc-xuong-khop-1/lam-viec-tai-nha-khong-met-moi-voi-quy-tac-50", permanent: true },
      { source: "/duong-sinh/tai-chinh-ca-nhan-cho-nguoi-moi-di-lam-quy-tac-50-30-20", destination: "/duong-sinh/tai-chinh-ca-nhan-cho-nguoi-moi-di-lam-quy-tac-50-30", permanent: true },
      { source: "/ho-hap-va-viem-xoang/xu-huong-song-cham-cua-gioi-tre-do-thi-nam-2026", destination: "/ho-hap-va-viem-xoang/xu-huong-song-cham-cua-gioi-tre-do-thi-nam", permanent: true },
      { source: "/thao-moc-giac-ngu/btv-khoa-7-ung-dung-productivity-mien-phi-tot-nhat-2026", destination: "/thao-moc-giac-ngu/btv-khoa-7-ung-dung-productivity-mien-phi-tot-nhat", permanent: true },
    ]
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
