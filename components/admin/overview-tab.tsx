import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { OverviewActivityChart } from "@/components/admin/overview-activity-chart"
import { OverviewDwellChart } from "@/components/admin/overview-dwell-chart"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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
    avgDwellSeconds: number
  }>
  range: "30d"
  hotSeoKeywords: Array<{
    id: string
    keyword: string
    trafficLabel: string
    trafficScore: number
    startedAt: string | null
    newsTitle: string | null
    newsSource: string | null
    newsUrl: string | null
    trendUrl: string
  }>
  hotSeoKeywordGeo: string
  hotSeoKeywordSourceUrl: string | null
  hotSeoKeywordError: string | null
  googleSeoSignals: {
    searchConsole: {
      sourceUrl: string | null
      startDate: string | null
      endDate: string | null
      error: string | null
      queries: Array<{
        id: string
        query: string
        clicks: number
        impressions: number
        ctr: number
        position: number
      }>
    }
    analytics: {
      propertyId: string | null
      error: string | null
      landingPages: Array<{
        id: string
        path: string
        title: string
        sessions: number
        activeUsers: number
        screenPageViews: number
        engagementRate: number
      }>
    }
  }
  avgDwellSecondsPerPost: number
  dwellTopPosts: Array<{
    postId: string
    title: string
    slug: string
    category: { slug: string }
    avgDwellSeconds: number
    eventCount: number
  }>
}

type OverviewTabProps = {
  overviewStats: OverviewStat[]
  overviewAnalytics: OverviewAnalytics
}

function formatTrendStartedAt(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  })
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`
}

function formatPosition(value: number) {
  if (value <= 0) {
    return "-"
  }

  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) {
    return null
  }

  return `${startDate} - ${endDate}`
}

export function OverviewTab({
  overviewStats,
  overviewAnalytics,
}: OverviewTabProps) {
  const rangeLabel = "30 ngày"
  const searchConsoleRangeLabel = formatDateRange(
    overviewAnalytics.googleSeoSignals.searchConsole.startDate,
    overviewAnalytics.googleSeoSignals.searchConsole.endDate
  )

  function formatDwell(seconds: number) {
    if (seconds <= 0) {
      return "0s"
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) {
      return `${remainingSeconds}s`
    }

    return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div>
            <p className="text-sm font-semibold">Phạm vi tổng quan</p>
            <p className="text-xs text-muted-foreground">
              Đang xem dữ liệu {rangeLabel} gần nhất.
            </p>
          </div>
          <span className="rounded-md border bg-zinc-900 px-3 py-1.5 text-sm text-white">
            30 ngày
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => {
          const ItemIcon = item.icon
          return (
            <Card key={item.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className={cn("text-3xl font-black", item.tone)}>
                      {item.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="rounded-md border bg-zinc-50 p-2">
                    <ItemIcon className={cn("size-5", item.tone)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ {rangeLabel} gần nhất</CardTitle>
          <CardDescription>
            So sánh tổng view bài xuất bản theo ngày và số comment phát sinh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <OverviewActivityChart data={overviewAnalytics.daily} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Từ khóa SEO hot (Google Trends{" "}
              {overviewAnalytics.hotSeoKeywordGeo})
            </CardTitle>
            <CardDescription>
              Nguồn xu hướng tìm kiếm độc lập với bài đã publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-zinc-50 px-3 py-2 text-xs">
              <span className="font-medium text-zinc-700">
                Trending Now RSS
              </span>
              {overviewAnalytics.hotSeoKeywordSourceUrl ? (
                <Link
                  href={overviewAnalytics.hotSeoKeywordSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-zinc-900"
                >
                  Nguồn Google Trends
                </Link>
              ) : null}
            </div>
            {overviewAnalytics.hotSeoKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Google Trends tạm thời chưa trả dữ liệu, dashboard vẫn giữ tín
                hiệu Google bên dưới.
              </p>
            ) : (
              overviewAnalytics.hotSeoKeywords.map((item, index) => {
                const startedAtLabel = formatTrendStartedAt(item.startedAt)

                return (
                  <div
                    key={item.id}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={item.trendUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-1 font-medium hover:text-rose-600"
                        >
                          #{index + 1} {item.keyword}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.trafficLabel ||
                            `${item.trafficScore.toLocaleString("vi-VN")}+`}{" "}
                          lượt tìm kiếm
                          {startedAtLabel ? ` · ${startedAtLabel}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        Xu hướng
                      </Badge>
                    </div>
                    {item.newsTitle ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {item.newsUrl ? (
                          <Link
                            href={item.newsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-zinc-900"
                          >
                            {item.newsTitle}
                          </Link>
                        ) : (
                          item.newsTitle
                        )}
                        {item.newsSource ? ` · ${item.newsSource}` : ""}
                      </p>
                    ) : null}
                  </div>
                )
              })
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Tín hiệu Google
                </p>
                <Badge variant="secondary">API</Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-md border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Search Console</p>
                      <p className="text-xs text-muted-foreground">
                        {searchConsoleRangeLabel || rangeLabel}
                      </p>
                    </div>
                    {overviewAnalytics.googleSeoSignals.searchConsole
                      .sourceUrl ? (
                      <Link
                        href={
                          overviewAnalytics.googleSeoSignals.searchConsole
                            .sourceUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-zinc-900"
                      >
                        API
                      </Link>
                    ) : null}
                  </div>
                  {overviewAnalytics.googleSeoSignals.searchConsole.queries
                    .length === 0 ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {overviewAnalytics.googleSeoSignals.searchConsole.error ||
                        "Chưa có query search trong khoảng thời gian này."}
                    </p>
                  ) : (
                    overviewAnalytics.googleSeoSignals.searchConsole.queries.map(
                      (item, index) => (
                        <div
                          key={item.id}
                          className="rounded-md bg-zinc-50 px-2.5 py-2"
                        >
                          <p className="line-clamp-1 text-sm font-medium">
                            #{index + 1} {item.query}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.clicks.toLocaleString("vi-VN")} click ·{" "}
                            {item.impressions.toLocaleString("vi-VN")}{" "}
                            impression
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CTR {formatPercent(item.ctr)} · vị trí{" "}
                            {formatPosition(item.position)}
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="space-y-2 rounded-md border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        GA4 Organic Search
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {overviewAnalytics.googleSeoSignals.analytics.propertyId
                          ? `Property ${overviewAnalytics.googleSeoSignals.analytics.propertyId}`
                          : "GA_PROPERTY_ID"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {rangeLabel}
                    </Badge>
                  </div>
                  {overviewAnalytics.googleSeoSignals.analytics.landingPages
                    .length === 0 ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {overviewAnalytics.googleSeoSignals.analytics.error ||
                        "Chưa có organic landing page trong GA4."}
                    </p>
                  ) : (
                    overviewAnalytics.googleSeoSignals.analytics.landingPages.map(
                      (item, index) => (
                        <div
                          key={item.id}
                          className="rounded-md bg-zinc-50 px-2.5 py-2"
                        >
                          <p className="line-clamp-1 text-sm font-medium">
                            #{index + 1} {item.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {item.path}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sessions.toLocaleString("vi-VN")} session ·{" "}
                            {item.screenPageViews.toLocaleString("vi-VN")} view
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Engagement {formatPercent(item.engagementRate)}
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Thời gian ở lại trung bình</CardTitle>
            <CardDescription>
              Biểu đồ xu hướng dwell-time {rangeLabel} gần nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-2">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Trung bình tất cả
              </p>
              <p className="text-3xl font-black text-emerald-600">
                {formatDwell(overviewAnalytics.avgDwellSecondsPerPost)}
              </p>
            </div>

            <div className="mt-2 h-[200px] w-full">
              <OverviewDwellChart data={overviewAnalytics.daily} />
            </div>

            <div className="space-y-3 p-6 pt-2">
              <Separator className="mb-4" />
              <p className="text-sm font-bold text-zinc-800">
                Top bài có dwell-time cao nhất
              </p>
              {overviewAnalytics.dwellTopPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu dwell-time hợp lệ.
                </p>
              ) : (
                <div className="space-y-2">
                  {overviewAnalytics.dwellTopPosts.map((post) => (
                    <div
                      key={post.postId}
                      className="group flex items-center justify-between rounded-lg border bg-zinc-50/50 px-3 py-2.5 transition-colors hover:bg-white hover:shadow-sm"
                    >
                      <Link
                        href={`/${post.category.slug}/${post.slug}`}
                        className="line-clamp-1 pr-3 text-sm font-medium transition-colors group-hover:text-rose-600"
                      >
                        {post.title}
                      </Link>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      >
                        {formatDwell(post.avgDwellSeconds)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
