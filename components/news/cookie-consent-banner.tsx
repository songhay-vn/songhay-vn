"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { getCookie, setCookie } from "@/lib/cookie-consent"

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false)

  // Use useSyncExternalStore or simple useEffect to read client cookie after mount
  useEffect(() => {
    // Only check on client side
    const consent = getCookie("cookie_consent")
    if (!consent) {
      setIsOpen(true)
    }
  }, [])

  const handleAccept = () => {
    setCookie("cookie_consent", "accepted", 365) // 365 days
    setIsOpen(false)
  }

  const handleDismiss = () => {
    setCookie("cookie_consent", "dismissed", 7) // 7 days (Do not show again for a week)
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-32px)] w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-xl md:bottom-8 md:left-8">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-extrabold text-black">Thông báo về Cookie 🍪</p>
          <button
            onClick={handleDismiss}
            aria-label="Đóng và không hiển thị lại trong 7 ngày"
            className="text-zinc-500 hover:text-black focus:outline-none"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs leading-normal font-medium text-black">
          Chúng tôi sử dụng cookie (bao gồm của Google Analytics và AdSense) để nâng cao trải nghiệm và phân tích lượt truy cập của bạn trên website.
        </p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between sm:items-center">
          <button
            onClick={handleDismiss}
            className="rounded px-2.5 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100 text-left sm:text-center hover:text-black"
          >
            Không hiển thị lại
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  )
}
