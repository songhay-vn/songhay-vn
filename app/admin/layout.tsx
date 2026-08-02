import type { Metadata } from "next"
import { connection } from "next/server"
import { ShieldCheck, LogOut } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import "ckeditor5/ckeditor5-content.css"
import { getAdminSnapshot } from "@/app/admin/data-loaders/index"
import {
  getVisibleTabs,
  type NavCountKey,
} from "@/app/admin/page-helpers"
import { AdminActionToast } from "@/components/admin/action-toast"
import { Badge } from "@/components/ui/badge"
import { requireCmsUser, clearSessionCookie } from "@/lib/auth"
import { can, canEditPenNames, ROLE_LABELS_VI } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { AdminNotifications } from "@/components/admin/admin-notifications"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "CMS Admin",
  robots: {
    index: false,
    follow: false,
  },
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  async function logoutAction() {
    "use server"
    await clearSessionCookie()
    redirect("/login?admin=1")
  }

  await connection()
  const currentUser = await requireCmsUser()
  const adminSnapshotPromise = getAdminSnapshot()
  const notificationsPromise = prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  const canManageSettings = can(currentUser.role, "create-category")
  const canManageProducts = can(currentUser.role, "manage-products")

  const { contentTabs, settingsTabs } = getVisibleTabs({
    canManageSettings,
    canEditPenNames: canEditPenNames(currentUser.role),
    canManageProducts,
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
    <TooltipProvider>
        <SidebarProvider>
          <AdminSidebar
            contentTabs={contentTabs}
            settingsTabs={settingsTabs}
            navCountByKey={navCountByKey}
          />
          <SidebarInset>
            <main className="min-h-screen bg-zinc-100 flex-1">
              <AdminActionToast />
              <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-8">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <div>
                      <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                        Songhay CMS
                      </p>
                      <h1 className="mt-1 text-xl font-black text-zinc-900 md:text-2xl">
                        Bảng điều khiển quản trị
                      </h1>
                    </div>
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
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                      >
                        <LogOut className="size-3.5" />
                        Đăng xuất
                      </button>
                    </form>
                  </div>
                </div>
              </header>
              <section className="min-w-0 p-4 md:p-6 xl:p-8">
                {children}
              </section>
            </main>
          </SidebarInset>
        </SidebarProvider>
    </TooltipProvider>
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
