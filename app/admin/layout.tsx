import type { Metadata } from "next"
import { connection } from "next/server"
import { ShieldCheck } from "lucide-react"
import { Suspense } from "react"

import "ckeditor5/ckeditor5-content.css"
import { getAdminSnapshot } from "@/app/admin/data-loaders/index"
import {
  getVisibleTabs,
  OVERVIEW_TAB,
  POSTS_SUBMENU_TABS,
  type NavCountKey,
} from "@/app/admin/page-helpers"
import { AdminActionToast } from "@/components/admin/action-toast"
import { AdminNavButton } from "@/components/admin/admin-nav-button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { requireCmsUser } from "@/lib/auth"
import { can, ROLE_LABELS_VI } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { AdminNotifications } from "@/components/admin/admin-notifications"

export const metadata: Metadata = {
  title: "CMS Admin",
  robots: {
    index: false,
    follow: false,
  },
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  await connection()
  const currentUser = await requireCmsUser()
  const adminSnapshotPromise = getAdminSnapshot()
  const notificationsPromise = prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  const canManageSettings = can(currentUser.role, "create-category")

  const { contentTabs, settingsTabs } = getVisibleTabs({
    canManageSettings,
  })

  const [
    {
      postCount,
      categoryCount,
      pendingCommentCount,
      trashedPostCount,
      draftPostCount,
      pendingReviewPostCount,
      pendingPublishPostCount,
      publishedPostCount,
      rejectedPostCount,
    },
    notifications,
  ] = await Promise.all([adminSnapshotPromise, notificationsPromise])

  const navCountByKey: Record<NavCountKey, number> = {
    postCount,
    categoryCount,
    pendingCommentCount,
    trashedPostCount,
    draftPostCount,
    pendingReviewPostCount,
    pendingPublishPostCount,
    publishedPostCount,
    rejectedPostCount,
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <AdminActionToast />
      <header className="border-b border-zinc-200 bg-white">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Songhay CMS
            </p>
            <h1 className="mt-1 text-xl font-black text-zinc-900 md:text-2xl">
              Bảng điều khiển quản trị
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <AdminNotifications notifications={notifications} />
            <Badge
              variant="secondary"
              className="hidden h-8 items-center gap-1.5 px-3 md:inline-flex"
            >
              <ShieldCheck className="size-3.5" />
              {ROLE_LABELS_VI[currentUser.role]}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-5rem)] w-full md:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200 bg-white md:border-r md:border-b-0">
          <div className="flex h-full flex-col px-4 py-5 md:min-h-[calc(100dvh-5rem)]">
            <ScrollArea className="mt-4 flex-1 pr-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                    Tổng quan
                  </p>
                  <AdminNavButton tab={OVERVIEW_TAB} />
                </div>

                <Separator className="bg-zinc-200" />

                <div className="space-y-1.5">
                  <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                    Quản lý tin
                  </p>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                    <div className="px-2 pb-1 text-[12px] font-semibold text-zinc-900">
                      Bài viết
                    </div>
                    <div className="space-y-1 border-l border-zinc-200 pl-2">
                      {POSTS_SUBMENU_TABS.map((tab) => (
                        <AdminNavButton
                          key={tab.key}
                          tab={tab}
                          count={
                            tab.countKey
                              ? navCountByKey[tab.countKey]
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {contentTabs.map((tab) => (
                    <AdminNavButton
                      key={tab.key}
                      tab={tab}
                      count={
                        tab.countKey ? navCountByKey[tab.countKey] : undefined
                      }
                    />
                  ))}
                </div>

                <Separator className="bg-zinc-200" />

                <div className="space-y-1.5">
                  <p className="px-2 text-[11px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">
                    Cài đặt
                  </p>
                  {settingsTabs.map((tab) => (
                    <AdminNavButton
                      key={tab.key}
                      tab={tab}
                      count={
                        tab.countKey ? navCountByKey[tab.countKey] : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </aside>

        <section className="space-y-4 p-4 md:p-6 xl:p-8">{children}</section>
      </div>
    </main>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
        <p className="text-sm font-medium text-zinc-600">
          Đang tải bảng điều khiển...
        </p>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
