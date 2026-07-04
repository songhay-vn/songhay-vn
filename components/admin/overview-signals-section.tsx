/**
 * overview-signals-section.tsx
 *
 * Async Server Components for the "slow" parts of the overview dashboard:
 *  - GA4 Content card (summary + top pages)
 *  - SEO card (Google Trends VN, Search Console queries, Organic landing pages)
 *
 * These are fetched via getOverviewSignals() which is cached for 5 minutes.
 * Each section is wrapped in <Suspense> by the parent (overview-tab.tsx) so the
 * rest of the page renders immediately while these stream in.
 */

import Link from "next/link"

import { getOverviewSignals } from "@/app/admin/data-loaders/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN")
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`
}

function formatPosition(value: number) {
  if (value <= 0) return "-"
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
}

function formatDurationSeconds(value: number) {
  const seconds = Math.max(0, Math.round(value))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`
}

function formatTrendStartedAt(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const time = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const day = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
  return `${time} ${day}`
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return null
  return `${startDate} - ${endDate}`
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

export function OverviewGa4ContentSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-3 space-y-0 pb-2">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded bg-zinc-100" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border bg-zinc-200">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 bg-white p-3">
              <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
              <div className="h-5 w-10 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
        <div className="space-y-2.5 pt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b pb-2.5">
              <div className="flex-1 space-y-1">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
              </div>
              <div className="h-3.5 w-8 animate-pulse rounded bg-zinc-100" />
              <div className="h-3.5 w-10 animate-pulse rounded bg-zinc-100" />
              <div className="h-3.5 w-8 animate-pulse rounded bg-zinc-100" />
              <div className="h-3.5 w-10 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SignalsColumnSkeleton() {
  return (
    <section>
      <div className="mb-2 h-4 w-28 animate-pulse rounded bg-zinc-100 border-b pb-2" />
      <div className="space-y-2.5 pt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b pb-2.5">
            <div className="h-3.5 w-5 animate-pulse rounded bg-zinc-100" />
            <div className="h-3.5 flex-1 animate-pulse rounded bg-zinc-100" />
            <div className="h-3.5 w-14 animate-pulse rounded bg-zinc-100" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function OverviewSeoSignalsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <div className="h-4 w-8 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-3">
        <SignalsColumnSkeleton />
        <SignalsColumnSkeleton />
        <SignalsColumnSkeleton />
      </CardContent>
    </Card>
  )
}

// ─── Async Server Components ─────────────────────────────────────────────────

export async function OverviewGa4ContentSection() {
  const signals = await getOverviewSignals()
  const ga4Content = signals.googleSeoSignals.content

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle>Dữ liệu từ Google</CardTitle>
        </div>
        <span className="text-3xl font-black text-emerald-700">
          {formatDurationSeconds(ga4Content.summary.averageSessionDuration)}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border bg-zinc-200">
          <div className="bg-white p-3">
            <p className="text-xs text-muted-foreground">Lượt xem</p>
            <p className="mt-1 text-lg font-black">
              {formatNumber(ga4Content.summary.screenPageViews)}
            </p>
          </div>
          <div className="bg-white p-3">
            <p className="text-xs text-muted-foreground">Phiên xem</p>
            <p className="mt-1 text-lg font-black">
              {formatNumber(ga4Content.summary.sessions)}
            </p>
          </div>
          <div className="bg-white p-3">
            <p className="text-xs text-muted-foreground">Người dùng</p>
            <p className="mt-1 text-lg font-black">
              {formatNumber(ga4Content.summary.activeUsers)}
            </p>
          </div>
          <div className="bg-white p-3">
            <p className="text-xs text-muted-foreground">Tỷ lệ giữ chân</p>
            <p className="mt-1 text-lg font-black">
              {formatPercent(ga4Content.summary.engagementRate)}
            </p>
          </div>
        </div>

        <div>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-[minmax(0,1fr)_58px_66px_62px_68px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>Trang</span>
                <span className="text-right">Lượt xem</span>
                <span className="text-right">Phiên xem</span>
                <span className="text-right">Trung bình</span>
                <span className="text-right">Tỷ lệ giữ chân</span>
              </div>
              {ga4Content.pages.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  {ga4Content.error ||
                    "Chưa có GA4 content page trong khoảng ngày này."}
                </p>
              ) : (
                ga4Content.pages.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_58px_66px_62px_68px] gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">
                        {index + 1}. {item.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {item.path}
                      </p>
                    </div>
                    <span className="text-right text-sm text-zinc-700">
                      {formatNumber(item.screenPageViews)}
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {formatNumber(item.sessions)}
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {formatDurationSeconds(item.averageSessionDuration)}
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {formatPercent(item.engagementRate)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export async function OverviewSeoSignalsSection() {
  const signals = await getOverviewSignals()
  const searchQueries = signals.googleSeoSignals.searchConsole.queries
  const organicLandingPages = signals.googleSeoSignals.analytics.landingPages
  const searchConsoleRangeLabel = formatDateRange(
    signals.googleSeoSignals.searchConsole.startDate,
    signals.googleSeoSignals.searchConsole.endDate
  )
  const rangeLabel = "30 ngày"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle>SEO</CardTitle>
        <span className="text-xs text-muted-foreground">
          {searchConsoleRangeLabel || rangeLabel}
        </span>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-3">
        {/* Trends VN */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3 border-b pb-2">
            <h3 className="text-sm font-semibold">
              Xu hướng {signals.hotSeoKeywordGeo}
            </h3>
            {signals.hotSeoKeywordSourceUrl ? (
              <Link
                href={signals.hotSeoKeywordSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-zinc-900"
              >
                RSS
              </Link>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[430px]">
              <div className="grid grid-cols-[36px_minmax(0,1fr)_84px_104px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>Từ khóa</span>
                <span className="text-right">Traffic</span>
                <span className="text-right">Time</span>
              </div>
              {signals.hotSeoKeywords.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Google Trends tạm thời chưa trả dữ liệu.
                </p>
              ) : (
                signals.hotSeoKeywords.map((item, index) => {
                  const startedAtLabel = formatTrendStartedAt(item.startedAt)
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[36px_minmax(0,1fr)_84px_104px] gap-3 border-b py-2.5 last:border-b-0"
                    >
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <Link
                        href={item.trendUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 text-sm font-medium hover:text-rose-600"
                      >
                        {item.keyword}
                      </Link>
                      <span className="text-right text-sm whitespace-nowrap text-zinc-700">
                        {item.trafficLabel ||
                          `${formatNumber(item.trafficScore)}+`}
                      </span>
                      <span className="text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                        {startedAtLabel || "-"}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        {/* Search Console */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3 border-b pb-2">
            <h3 className="text-sm font-semibold">Search Console</h3>
            {signals.googleSeoSignals.searchConsole.sourceUrl ? (
              <Link
                href={signals.googleSeoSignals.searchConsole.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-zinc-900"
              >
                API
              </Link>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[430px]">
              <div className="grid grid-cols-[36px_minmax(0,1fr)_58px_58px_54px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                <span>#</span>
                <span>Query</span>
                <span className="text-right">Clicks</span>
                <span className="text-right">CTR</span>
                <span className="text-right">Pos</span>
              </div>
              {searchQueries.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  {signals.googleSeoSignals.searchConsole.error ||
                    "Chưa có query Search Console trong khoảng ngày này."}
                </p>
              ) : (
                searchQueries.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[36px_minmax(0,1fr)_58px_58px_54px] gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1 text-sm font-medium">
                      {item.query}
                    </span>
                    <span className="text-right text-sm text-zinc-700">
                      {formatNumber(item.clicks)}
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {formatPercent(item.ctr)}
                    </span>
                    <span className="text-right text-sm text-muted-foreground">
                      {formatPosition(item.position)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
