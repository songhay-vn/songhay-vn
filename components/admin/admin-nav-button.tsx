"use client"

import { Suspense, useTransition } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  FileEdit,
  FileSearch,
  FileWarning,
  FolderKanban,
  Globe,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  Loader2,
  MessageSquareMore,
  Newspaper,
  Package,
  PenSquare,
  ShieldCheck,
  Signature,
  Timer,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react"

import type { NavIconName, NavLeaf } from "@/app/admin/page-helpers"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const navIcons: Record<NavIconName, typeof LayoutDashboard> = {
  layoutDashboard: LayoutDashboard,
  penSquare: PenSquare,
  libraryBig: LibraryBig,
  userSquare2: UserSquare2,
  newspaper: Newspaper,
  trash2: Trash2,
  keyRound: KeyRound,
  messageSquareMore: MessageSquareMore,
  folderKanban: FolderKanban,
  shieldCheck: ShieldCheck,
  users: Users,
  fileEdit: FileEdit,
  fileWarning: FileWarning,
  fileSearch: FileSearch,
  timer: Timer,
  globe: Globe,
  signature: Signature,
  arrowRightLeft: ArrowRightLeft,
  package: Package,
}

type AdminNavButtonProps = {
  tab: NavLeaf
  count?: number
}

export function AdminNavButtonInner({ tab, count }: AdminNavButtonProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const activeTab = searchParams.get("tab") || "overview"
  const activePostsStatus = searchParams.get("postsStatus")
  const TabIcon = navIcons[tab.iconName]
  const isActive = tab.activeWhen
    ? activeTab === tab.activeWhen.tab &&
      (typeof tab.activeWhen.postsStatus === "undefined" ||
        activePostsStatus === tab.activeWhen.postsStatus)
    : activeTab === tab.tabKey

  const href = tab.href || `/admin?tab=${tab.tabKey}`

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      startTransition(() => {
        router.push(href)
      })
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={tab.label}
      >
        <Link href={href} onClick={handleClick}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <TabIcon />
          )}
          <span>{tab.label}</span>
          {typeof count === "number" ? (
            <Badge
              variant="secondary"
              className={`ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums ${
                isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {isPending ? "..." : count.toLocaleString("vi-VN")}
            </Badge>
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AdminNavButton({ tab, count }: AdminNavButtonProps) {
  return (
    <Suspense
      fallback={<div className="h-8 w-full rounded-md bg-zinc-100 animate-pulse my-0.5" />}
    >
      <AdminNavButtonInner tab={tab} count={count} />
    </Suspense>
  )
}

import { SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar"

export function AdminNavSubButtonInner({ tab, count }: AdminNavButtonProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const activeTab = searchParams.get("tab") || "overview"
  const activePostsStatus = searchParams.get("postsStatus")
  const TabIcon = navIcons[tab.iconName]
  const isActive = tab.activeWhen
    ? activeTab === tab.activeWhen.tab &&
      (typeof tab.activeWhen.postsStatus === "undefined" ||
        activePostsStatus === tab.activeWhen.postsStatus)
    : activeTab === tab.tabKey

  const href = tab.href || `/admin?tab=${tab.tabKey}`

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      startTransition(() => {
        router.push(href)
      })
    }
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
      >
        <Link href={href} onClick={handleClick}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <TabIcon />
          )}
          <span>{tab.label}</span>
          {typeof count === "number" ? (
            <Badge
              variant="secondary"
              className={`ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums ${
                isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {isPending ? "..." : count.toLocaleString("vi-VN")}
            </Badge>
          ) : null}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

export function AdminNavSubButton({ tab, count }: AdminNavButtonProps) {
  return (
    <Suspense
      fallback={<div className="h-7 w-full rounded-md bg-zinc-100 animate-pulse my-0.5" />}
    >
      <AdminNavSubButtonInner tab={tab} count={count} />
    </Suspense>
  )
}

