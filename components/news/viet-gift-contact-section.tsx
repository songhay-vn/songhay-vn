"use client"

import { useEffect, useRef } from "react"

const DEFAULT_FALLBACK_ZALO_URL = "https://zalo.me"

type VietGiftContactSectionProps = {
  productId: string
  productName: string
  productSlug: string
  zaloUrl?: string | null
}

export function VietGiftContactSection({
  productId,
  productName,
  productSlug,
  zaloUrl,
}: VietGiftContactSectionProps) {
  const hasTrackedView = useRef(false)
  const finalZaloUrl = (zaloUrl && zaloUrl.trim()) ? zaloUrl.trim() : DEFAULT_FALLBACK_ZALO_URL

  // Track page view once per page load
  useEffect(() => {
    if (hasTrackedView.current) return
    hasTrackedView.current = true

    try {
      fetch("/api/products/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          eventType: "view",
        }),
      }).catch((err) => {
        console.error("Failed to track view:", err)
      })
    } catch {
      // Non-blocking
    }
  }, [productId])

  const handleClickZalo = () => {
    // 1. Send Internal DB Click Event via sendBeacon or fetch keepalive
    const payload = JSON.stringify({
      productId,
      eventType: "zalo_click",
    })

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/products/track", payload)
      } else {
        fetch("/api/products/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Non-blocking
    }

    // 2. Send Google Analytics 4 Custom Event if available
    try {
      if (typeof window !== "undefined" && "gtag" in window && typeof (window as unknown as { gtag: Function }).gtag === "function") {
        (window as unknown as { gtag: Function }).gtag("event", "contact_zalo_nsx", {
          event_category: "PR_Engagement",
          product_id: productId,
          product_slug: productSlug,
          product_name: productName,
        })
      }
    } catch {
      // Non-blocking
    }
  }

  return (
    <div className="py-2">
      <a
        href={finalZaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClickZalo}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold transition rounded-sm shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
          <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
        </svg>
        Liên hệ với NSX qua Zalo
      </a>
    </div>
  )
}
