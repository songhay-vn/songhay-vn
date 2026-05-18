"use client"

import { Suspense, useTransition } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
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
  PenSquare,
  ShieldCheck,
  Timer,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react"

import type { NavIconName, NavLeaf } from "@/app/admin/page-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    // Only intercept normal left clicks without modifier keys
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      startTransition(() => {
        router.push(href)
      })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          className={`h-10 w-full justify-start rounded-xl border px-3.5 ${isActive
              ? "border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900"
              : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
        >
          <Link
            href={href}
            onClick={handleClick}
            className="flex w-full items-center gap-2"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              {isPending ? (
                <Loader2 className={`size-4 animate-spin ${isActive ? "text-zinc-900" : "text-zinc-500"}`} />
              ) : (
                <TabIcon
                  className={`size-4 ${isActive ? "text-zinc-900" : "text-zinc-500"}`}
                />
              )}
              <span className="truncate">{tab.label}</span>
            </span>
            {typeof count === "number" ? (
              <Badge
                variant="secondary"
                className={`ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums ${isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                  }`}
              >
                {isPending ? "..." : count.toLocaleString("vi-VN")}
              </Badge>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-72">
        {tab.description}
      </TooltipContent>
    </Tooltip>
  )
}

export function AdminNavButton({ tab, count }: AdminNavButtonProps) {
  return (
    <Suspense fallback={
      <div className="h-10 w-full rounded-xl bg-zinc-100 animate-pulse" />
    }>
      <AdminNavButtonInner tab={tab} count={count} />
    </Suspense>
  )
}
