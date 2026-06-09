"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewsSearchForm } from "./search"

interface SearchIconPopupProps {
  defaultValue?: string
}

export function SearchIconPopup({ defaultValue }: SearchIconPopupProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Đóng tìm kiếm" : "Tìm kiếm"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full text-white transition hover:bg-white/10 hover:text-white focus-visible:ring-0 focus-visible:ring-offset-0 md:text-zinc-600 md:hover:bg-zinc-100 md:hover:text-red-700"
      >
        {open ? <X className="size-5" /> : <Search className="size-5" />}
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[340px] origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl ring-1 ring-black/5 duration-150"
          role="dialog"
          aria-label="Tìm kiếm nội dung"
        >
          <NewsSearchForm
            className="w-full"
            defaultValue={defaultValue}
            placeholder="Tìm bài viết..."
            submitAriaLabel="Tìm bài viết"
            enableSuggestions
            suggestionsLimit={6}
            inputClassName="h-10 border-zinc-300 bg-white pl-3 pr-11 text-sm focus-visible:border-red-500 focus-visible:ring-red-500/20"
            buttonClassName="border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            onSubmit={() => setOpen(false)}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
