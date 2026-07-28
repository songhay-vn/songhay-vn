"use client"

import { useEffect, useState } from "react"
import { Cookie, ShieldCheck, X } from "lucide-react"
import { getCookie, setCookie } from "@/lib/cookie-consent"

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const consent = getCookie("cookie_consent")
    if (!consent) {
      const timer = setTimeout(() => setIsOpen(true), 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setCookie("cookie_consent", "accepted", 365) // 365 days
    setIsOpen(false)
  }

  const handleDismiss = () => {
    setCookie("cookie_consent", "dismissed", 7) // 7 days
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] w-[380px] rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-2xl shadow-zinc-950/15 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:left-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 tracking-tight">
                Cookie &amp; Quyền riêng tư
              </h3>
              <p className="text-[11px] font-semibold text-zinc-900">
                Songhay.vn
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Đóng và không hiển thị lại trong 7 ngày"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-zinc-950 font-normal">
          Chúng tôi sử dụng cookie (Google Analytics &amp; AdSense) nhằm tối ưu hóa trải nghiệm bài viết và phân tích lưu lượng truy cập trên website.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] transition-all"
          >
            Tùy chọn
          </button>
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>Đồng ý tất cả</span>
          </button>
        </div>
      </div>
    </div>
  )
}

