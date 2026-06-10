import { Suspense } from "react"
import Link from "next/link"

import { OverviewActivityChart } from "@/components/admin/overview-activity-chart"
import {
  OverviewGa4ContentSection,
  OverviewGa4ContentSkeleton,
  OverviewSeoSignalsSection,
  OverviewSeoSignalsSkeleton,
} from "@/components/admin/overview-signals-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type OverviewStat = {
  key: string
  label: string
  value: number
  note: string
  icon: LucideIcon
  tone: string
}

type OverviewAnalytics = {
  daily: Array<{
    label: string
    views: number
    comments: number
    posts: number
  }>
  range: "30d"
}

type OverviewTabProps = {
  overviewStats: OverviewStat[]
  overviewAnalytics: OverviewAnalytics
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN")
}

export function OverviewTab({
  overviewStats,
  overviewAnalytics,
}: OverviewTabProps) {
  const rangeLabel = "30 ngày"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <h2 className="text-2xl font-black text-zinc-950">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {overviewStats.map((item) => {
          const ItemIcon = item.icon
          return (
            <div key={item.key} className="bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <ItemIcon className={cn("size-4 shrink-0", item.tone)} />
              </div>
              <p className={cn("mt-2 text-3xl font-black", item.tone)}>
                {formatNumber(item.value)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Traffic chart + GA4 Content card (GA4 streams in via Suspense) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
            <CardTitle>Traffic</CardTitle>
            <span className="text-xs text-muted-foreground">
              view · comment · bài
            </span>
          </CardHeader>
          <CardContent>
            <OverviewActivityChart data={overviewAnalytics.daily} />
          </CardContent>
        </Card>

        <Suspense fallback={<OverviewGa4ContentSkeleton />}>
          <OverviewGa4ContentSection />
        </Suspense>
      </div>

      {/* SEO signals: Trends VN, Search Console, Organic — stream in via Suspense */}
      <Suspense fallback={<OverviewSeoSignalsSkeleton />}>
        <OverviewSeoSignalsSection />
      </Suspense>
    </div>
  )
}
