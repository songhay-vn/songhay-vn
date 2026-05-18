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
      // Published duplicates trashed by prisma/cleanup-duplicates.ts (2026-05-19)
      { source: "/bi-quyet-song-khoe/toi-mau-xanh-an-co-hai-da-day-khong-cach-ngam-toi-giam-khong-bi-xanh-1", destination: "/bi-quyet-song-khoe/toi-mau-xanh-an-co-hai-da-day-khong-cach-ngam-toi-giam-khong-bi-xanh", permanent: true },
      { source: "/ve-huu/toi-tha-song-trong-vien-duong-lao-con-hon-den-o-nha-con-day-la-ly-do-1", destination: "/ve-huu/toi-tha-song-trong-vien-duong-lao-con-hon-den-o-nha-con-day-la-ly-do", permanent: true },
      { source: "/ve-huu/top-10-vien-duong-lao-gia-binh-dan-o-ha-noi-chi-phi-1-thang-o-vien-duong-lao-bao-nhieu-1", destination: "/ve-huu/top-10-vien-duong-lao-gia-binh-dan-o-ha-noi-chi-phi-1-thang-o-vien-duong-lao-bao-nhieu", permanent: true },
      { source: "/duong-sinh/cach-nau-chao-bo-cau-ngon-khong-tanh-nguoi-gia-bi-benh-xuong-khop-can-luu-y-gi-khi-an-chao-chim-bo-cau-3", destination: "/duong-sinh/cach-nau-chao-bo-cau-ngon-khong-tanh-nguoi-gia-bi-benh-xuong-khop-can-luu-y-gi-khi-an-chao-chim-bo-cau", permanent: true },
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
