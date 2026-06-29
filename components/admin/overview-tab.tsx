import { Suspense } from "react"

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
  }>
  range: "30d"
  error: string | null
}

type BioAgeInsights = {
  totalCount: number
  averageAge: number | null
  ageGroups: Array<{ label: string; count: number }>
  genders: Array<{ key: string; label: string; count: number }>
  results: Array<{ key: string; label: string; count: number }>
  latest: Array<{
    id: string
    age: number
    gender: string
    score: number
    resultKey: string
    estimatedMinAge: number
    estimatedMaxAge: number | null
    updatedAt: Date
  }>
}

type OverviewTabProps = {
  overviewStats: OverviewStat[]
  overviewAnalytics: OverviewAnalytics
  bioAgeInsights: BioAgeInsights
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN")
}

function formatCompactNumber(value: number | null) {
  if (value === null) {
    return "-"
  }

  return value.toLocaleString("vi-VN")
}

function formatEstimatedAge(minAge: number, maxAge: number | null) {
  if (maxAge === null) {
    return `từ ${minAge} tuổi`
  }

  if (minAge === maxAge) {
    return `${minAge} tuổi`
  }

  return `${minAge}-${maxAge} tuổi`
}

function formatUpdatedAt(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function OverviewTab({
  overviewStats,
  overviewAnalytics,
  bioAgeInsights,
}: OverviewTabProps) {
  const rangeLabel = "30 ngày"
  const resultLabelByKey = new Map(
    bioAgeInsights.results.map((item) => [item.key, item.label])
  )

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
              GA4 screenPageViews
            </span>
          </CardHeader>
          <CardContent>
            {overviewAnalytics.error ? (
              <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                GA4: {overviewAnalytics.error}
              </p>
            ) : null}
            <OverviewActivityChart data={overviewAnalytics.daily} />
          </CardContent>
        </Card>

        <Suspense fallback={<OverviewGa4ContentSkeleton />}>
          <OverviewGa4ContentSection />
        </Suspense>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
          <CardTitle>Độc giả tuổi sinh học</CardTitle>
          <span className="text-xs text-muted-foreground">
            dữ liệu bài test
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-px overflow-hidden rounded-md border bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Lượt làm bài
              </p>
              <p className="mt-2 text-3xl font-black text-zinc-950">
                {formatNumber(bioAgeInsights.totalCount)}
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Tuổi trung bình
              </p>
              <p className="mt-2 text-3xl font-black text-rose-600">
                {formatCompactNumber(bioAgeInsights.averageAge)}
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground">Nam</p>
              <p className="mt-2 text-3xl font-black text-sky-600">
                {formatNumber(
                  bioAgeInsights.genders.find((item) => item.key === "MALE")
                    ?.count || 0
                )}
              </p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-medium text-muted-foreground">Nữ</p>
              <p className="mt-2 text-3xl font-black text-fuchsia-600">
                {formatNumber(
                  bioAgeInsights.genders.find((item) => item.key === "FEMALE")
                    ?.count || 0
                )}
              </p>
            </div>
          </div>

          {bioAgeInsights.totalCount === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
              Chưa có dữ liệu từ bài test tuổi sinh học.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "Nhóm tuổi", items: bioAgeInsights.ageGroups },
                  { title: "Giới tính", items: bioAgeInsights.genders },
                  { title: "Kết quả", items: bioAgeInsights.results },
                ].map((section) => (
                  <div
                    key={section.title}
                    className="rounded-md border border-zinc-200 bg-white p-4"
                  >
                    <h3 className="text-sm font-bold text-zinc-950">
                      {section.title}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {section.items.map((item) => {
                        const percent =
                          bioAgeInsights.totalCount > 0
                            ? Math.round(
                                (item.count / bioAgeInsights.totalCount) * 100
                              )
                            : 0

                        return (
                          <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="font-semibold text-zinc-700">
                                {item.label}
                              </span>
                              <span className="text-muted-foreground">
                                {formatNumber(item.count)} · {percent}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full rounded-full bg-rose-600"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-zinc-200 bg-white p-4">
                <h3 className="text-sm font-bold text-zinc-950">
                  Lượt mới nhất
                </h3>
                <div className="mt-3 divide-y divide-zinc-100">
                  {bioAgeInsights.latest.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-1 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-zinc-950">
                          {item.gender === "MALE" ? "Nam" : "Nữ"} · {item.age}{" "}
                          tuổi
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatUpdatedAt(item.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs leading-5 text-zinc-600">
                        {resultLabelByKey.get(item.resultKey) || item.resultKey}{" "}
                        · score {item.score} · sinh học{" "}
                        {formatEstimatedAge(
                          item.estimatedMinAge,
                          item.estimatedMaxAge
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO signals: Trends VN, Search Console, Organic — stream in via Suspense */}
      <Suspense fallback={<OverviewSeoSignalsSkeleton />}>
        <OverviewSeoSignalsSection />
      </Suspense>
    </div>
  )
}
