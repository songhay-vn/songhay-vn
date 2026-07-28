"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

const ZALO_URL = "http://zalo.me/1461723500320922510?src=qr&f=1"
const POPUP_TEXT = "Bạn cần hỗ trợ hay tư vấn gì về sản phẩm từ Viện Hàn Lâm KH&CN Việt Nam không?"
const DISMISSED_KEY = "zalo_popup_dismissed"

export function ZaloChatButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 0)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, "1")
  }

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2">
      {/* Speech-bubble — dismissible */}
      {visible && (
        <div className="relative block max-w-[220px] rounded-2xl rounded-br-sm bg-white px-4 py-3 shadow-lg ring-1 ring-zinc-200">
          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Đóng thông báo"
            className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500 text-white shadow hover:bg-zinc-700 transition-colors"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>

          <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="block">
            <p className="text-sm leading-snug text-zinc-800">{POPUP_TEXT}</p>
            <span className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
              Nhắn ngay qua Zalo →
            </span>
          </a>

          {/* Tail pointing down to the button */}
          <span className="absolute -bottom-2 right-4 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-white drop-shadow-sm" />
        </div>
      )}

      {/* Floating chat button */}
      <a
        id="zalo-chat-fab"
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo hỗ trợ"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110 active:scale-95"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="relative h-7 w-7">
          <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
          <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
        </svg>
      </a>
    </div>
  )
}

