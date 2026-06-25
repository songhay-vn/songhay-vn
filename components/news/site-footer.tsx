import Link from "next/link"
import { Facebook } from "lucide-react"
import { getNavCategories } from "@/lib/queries"
import { Button } from "@/components/ui/button"

type SiteFooterProps = {
  navCategories?: Awaited<ReturnType<typeof getNavCategories>>
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.17V2h-3.36v13.48a2.88 2.88 0 1 1-2.88-2.88 2.8 2.8 0 0 1 .86.14V9.33a6.2 6.2 0 0 0-.86-.06A6.24 6.24 0 1 0 15.82 15V8.16a8.17 8.17 0 0 0 4.77 1.54V6.69h-1Z" />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <span aria-hidden="true" className="text-base font-black">
      @
    </span>
  )
}

const socials = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61575740829845",
    icon: Facebook,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@songhayvn24h?lang=vi-VN",
    icon: TikTokIcon,
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@songhayvn24h",
    icon: ThreadsIcon,
  },
]

export async function SiteFooter({
  navCategories: propNavCategories,
}: SiteFooterProps = {}) {
  const navCategories = propNavCategories ?? (await getNavCategories())
  return (
    <footer className="border-t border-zinc-200 bg-zinc-100">
      {navCategories && navCategories.length > 0 && (
        <nav className="border-b border-zinc-200 bg-red-700">
          <ul className="mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-x-3 gap-y-2 px-4 py-4 text-sm font-bold text-white sm:text-base md:flex md:flex-wrap md:items-center md:gap-6 md:px-6 md:py-3">
            {navCategories.map((item) => (
              <li key={`footer-nav-${item.slug}`}>
                <Link
                  href={`/${item.slug}`}
                  prefetch={false}
                  className="border-b-2 border-transparent pb-1 leading-none transition hover:border-white/90 hover:text-white/90"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-8 md:grid-cols-[1.3fr_1fr] md:px-6">
        <div className="space-y-3 text-zinc-700">
          <p className="text-2xl font-black text-zinc-900">Songhay.vn</p>
          <p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">
            Liên hệ quảng cáo
          </p>
          <p className="text-zinc-600">
            Đặt banner, booking bài PR, tài trợ chuyên mục và hợp tác nội dung
            thương hiệu.
          </p>
          <div className="space-y-1.5 border border-zinc-200 bg-white p-4">
            <p>
              Email:{" "}
              <a
                href="mailto:lienhesonghay@gmail.com"
                className="font-semibold text-rose-700"
              >
                lienhesonghay@gmail.com
              </a>
            </p>
            <p>
              Hotline / Zalo:{" "}
              <a href="tel:0967402295" className="font-semibold text-rose-700">
                0967 402 295
              </a>
            </p>
            <p>Địa chỉ: Tổ 11, Thư Lâm, Hà Nội</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href="/ve-chung-toi"
              prefetch={false}
              className="inline-flex text-sm font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/chinh-sach-bao-mat"
              prefetch={false}
              className="inline-flex text-sm font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/dieu-khoan-su-dung"
              prefetch={false}
              className="inline-flex text-sm font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href="/mien-tru-trach-nhiem"
              prefetch={false}
              className="inline-flex text-sm font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              Miễn trừ trách nhiệm
            </Link>
          </div>
          <p className="pt-1 text-sm text-zinc-500">
            Copyright © 2026 songhay.vn
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-zinc-700 uppercase">
            Kết nối với Songhay
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {socials.map((social) => (
              <Button
                key={social.name}
                variant="outline"
                size="icon"
                asChild
                className="rounded-full bg-white text-zinc-700 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <Link
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                >
                  <social.icon />
                </Link>
              </Button>
            ))}
          </div>
          <p className="text-sm text-zinc-600">
            Theo dõi để nhận tin nổi bật, video mới và chương trình hợp tác
            truyền thông.
          </p>
        </div>
      </div>
    </footer>
  )
}
