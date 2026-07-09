"use client"

import { useEffect } from "react"

export function GoogleAdSense() {
  useEffect(() => {
    // Only load AdSense on the client side after hydration is complete.
    // This prevents AdSense auto-ads from mutating the DOM before React
    // finishes hydrating the page, which causes Uncaught HierarchyRequestError.
    const script = document.createElement("script")
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1176898129958487"
    script.async = true
    script.crossOrigin = "anonymous"
    document.head.appendChild(script)
  }, [])

  return null
}
