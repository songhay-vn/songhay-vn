"use client"

import { CalendarDays } from "lucide-react"
import Link from "next/link"
import { GoodDayByAgeTool } from "@/components/news/good-day-by-age-tool"

const TOOLS = [
  { href: "/tinh-bmi", label: "Tính BMI" },
  { href: "/ngay-tot-xau", label: "Xem ngày tốt xấu đầy đủ" },
  { href: "/dat-ten-cho-con", label: "Đặt tên cho con" },
]

export function DontMissWidget() {
  return (
    <div className="grid gap-3 border-t border-zinc-200 bg-white p-3 md:grid-cols-[1.2fr_1fr] md:p-4">
      <div className="space-y-3 md:border-r md:border-zinc-200 md:pr-4">
        <p className="text-lg font-semibold text-zinc-800">
          Xem ngày tốt xấu theo tuổi?
        </p>
        <GoodDayByAgeTool />
      </div>

      <div className="space-y-2.5 md:pl-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-rose-600"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="font-semibold">{tool.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
