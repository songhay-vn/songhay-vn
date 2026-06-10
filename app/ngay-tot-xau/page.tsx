import type { Metadata } from "next"

import { GoodDayFullReport } from "@/components/news/good-day-full-report"
import { GoodDayByAgeTool } from "@/components/news/good-day-by-age-tool"
import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Xem ngày tốt xấu đầy đủ theo lịch âm",
  description:
    "Xem ngày tốt xấu đầy đủ: hoàng đạo, trực, nạp âm, giờ tốt, tuổi xung khắc, sao tốt xấu và đánh giá theo ngày.",
  alternates: {
    canonical: "/ngay-tot-xau",
  },
}

export default async function GoodDayPage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-black text-zinc-900">Xem ngày tốt xấu theo tuổi</h1>
          <p className="text-zinc-600">Nhập ngày sinh và ngày cần xem để nhận gợi ý nhanh.</p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <GoodDayByAgeTool showUtilityLinks />
        </section>

        <GoodDayFullReport />
      </div>
    </NewsLayout>
  )
}
