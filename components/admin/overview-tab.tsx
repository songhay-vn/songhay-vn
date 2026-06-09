import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { OverviewActivityChart } from "@/components/admin/overview-activity-chart"
import { OverviewDwellChart } from "@/components/admin/overview-dwell-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  daily: Array<{ label: string; views: number; comments: number; posts: number; avgDwellSeconds: number }>
  todayViews: number
  todayComments: number
  todayApprovedComments: number
  todayTopPosts: Array<{ id: string; title: string; slug: string; views: number; category: { slug: string } }>
  range: "30d"
  hotSeoKeywords: Array<{ id: string; keyword: string; postCount: number; totalViews: number; score: number }>
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

export function OverviewTab({ overviewStats, overviewAnalytics }: OverviewTabProps) {
  const rangeLabel = "30 ngày"

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
            <p className="text-muted-foreground text-xs">Đang xem dữ liệu {rangeLabel} gần nhất.</p>
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
                    <p className={cn("text-3xl font-black", item.tone)}>{item.value}</p>
                    <p className="text-muted-foreground text-sm">{item.note}</p>
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ {rangeLabel} gần nhất</CardTitle>
            <CardDescription>So sánh tổng view bài xuất bản theo ngày và số comment phát sinh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <OverviewActivityChart data={overviewAnalytics.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan hôm nay</CardTitle>
            <CardDescription>Số liệu realtime cho nội dung mới và tương tác.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">View từ bài đăng hôm nay</p>
                <p className="text-lg font-bold text-emerald-600">{overviewAnalytics.todayViews.toLocaleString("vi-VN")}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">Comment mới hôm nay</p>
                <p className="text-lg font-bold text-sky-600">{overviewAnalytics.todayComments.toLocaleString("vi-VN")}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">Comment đã duyệt hôm nay</p>
                <p className="text-lg font-bold text-violet-600">{overviewAnalytics.todayApprovedComments.toLocaleString("vi-VN")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Top bài xuất bản hôm nay theo view</p>
              {overviewAnalytics.todayTopPosts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Hôm nay chưa có bài xuất bản mới.</p>
              ) : (
                overviewAnalytics.todayTopPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <Link href={`/${post.category.slug}/${post.slug}`} className="line-clamp-1 pr-3 font-medium hover:text-rose-600">
                      {post.title}
                    </Link>
                    <Badge variant="outline">{post.views.toLocaleString("vi-VN")} view</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Từ khóa SEO hot ({rangeLabel})</CardTitle>
            <CardDescription>Xếp hạng theo score kết hợp giữa tổng view và số bài dùng từ khóa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overviewAnalytics.hotSeoKeywords.length === 0 ? (
              <p className="text-muted-foreground text-sm">Chưa có dữ liệu từ khóa trong khoảng thời gian đã chọn.</p>
            ) : (
              overviewAnalytics.hotSeoKeywords.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">#{index + 1} {item.keyword}</p>
                    <p className="text-muted-foreground text-xs">{item.postCount} bài · {item.totalViews.toLocaleString("vi-VN")} view</p>
                  </div>
                  <Badge variant="outline">Score {item.score.toLocaleString("vi-VN")}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Thời gian ở lại trung bình</CardTitle>
            <CardDescription>Biểu đồ xu hướng dwell-time {rangeLabel} gần nhất.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Trung bình tất cả</p>
              <p className="text-3xl font-black text-emerald-600">{formatDwell(overviewAnalytics.avgDwellSecondsPerPost)}</p>
            </div>
            
            <div className="mt-2 h-[200px] w-full">
              <OverviewDwellChart data={overviewAnalytics.daily} />
            </div>

            <div className="space-y-3 p-6 pt-2">
              <Separator className="mb-4" />
              <p className="text-sm font-bold text-zinc-800">Top bài có dwell-time cao nhất</p>
              {overviewAnalytics.dwellTopPosts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Chưa có dữ liệu dwell-time hợp lệ.</p>
              ) : (
                <div className="space-y-2">
                  {overviewAnalytics.dwellTopPosts.map((post) => (
                    <div key={post.postId} className="group flex items-center justify-between rounded-lg border bg-zinc-50/50 px-3 py-2.5 transition-colors hover:bg-white hover:shadow-sm">
                      <Link href={`/${post.category.slug}/${post.slug}`} className="line-clamp-1 pr-3 text-sm font-medium transition-colors group-hover:text-rose-600">
                        {post.title}
                      </Link>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
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
