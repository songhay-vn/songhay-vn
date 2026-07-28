"use client"

import Link from "next/link"
import { Gift, X } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"

export function FloatingGiftButton() {
  return null;

  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)

  const hiddenPrefixes = ["/admin", "/login"]
  const shouldHideOnRoute = hiddenPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (!isVisible || shouldHideOnRoute) {
    return null
  }

  return (
    <div className="fixed right-2 bottom-20 z-[70] md:top-1/2 md:-translate-y-1/2 md:right-5">
      <button
        type="button"
        aria-label="Tắt nút nhận voucher"
        onClick={() => setIsVisible(false)}
        className="absolute -right-1 -top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <Link
        href="https://s.shopee.vn/1Lb1mLK7V1"
        target="_blank"
        rel="noreferrer nofollow sponsored"
        aria-label="Nhận voucher ưu đãi"
        className="group relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-200 bg-[radial-gradient(circle_at_30%_20%,#fef08a_0%,#f59e0b_48%,#dc2626_100%)] text-center shadow-[0_12px_30px_rgba(217,70,70,0.42)] md:h-24 md:w-24"
      >
        <span className="pointer-events-none absolute inset-[-6px] rounded-full border border-amber-300/70 md:inset-[-8px]" />
        <span className="pointer-events-none absolute inset-[-10px] animate-pulse rounded-full border border-rose-300/40 md:inset-[-12px]" />

        <span className="absolute -top-1 left-1/2 h-2.5 w-8 -translate-x-1/2 rounded-full bg-amber-200/90 md:-top-1.5 md:w-12" />
        <span className="absolute left-1/2 top-1 h-9 w-1 -translate-x-1/2 rounded-full bg-amber-100/80 md:h-14 md:w-1.5" />

        <span className="relative flex flex-col items-center gap-0 text-white drop-shadow-sm md:gap-0.5">
          <Gift className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-[8px] font-black uppercase tracking-wide md:text-[10px]">Nhận</span>
          <span className="text-[7.5px] font-bold md:text-[9px]">Voucher</span>
        </span>
      </Link>
    </div>
  )
}
