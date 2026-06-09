"use client"

import { useSyncExternalStore } from "react"
import { SearchIconPopup } from "./search-icon-popup"
import { MobileNav } from "./mobile-nav"
import { getNavCategories } from "@/lib/queries"

type HeaderUserStatusProps = {
  navCategories: Awaited<ReturnType<typeof getNavCategories>>
  defaultSearchQuery?: string
}

export function HeaderUserStatus({ navCategories, defaultSearchQuery }: HeaderUserStatusProps) {
  return (
    <div className="mt-1 flex items-center gap-3">
      <div className="hidden text-sm text-zinc-600 md:block">
        <ClientDate />
      </div>
      
      <SearchIconPopup defaultValue={defaultSearchQuery} />
      <MobileNav navCategories={navCategories} />
    </div>
  )
}

function ClientDate() {
  const dateStr = useSyncExternalStore(
    subscribeToDateSnapshot,
    getClientDateSnapshot,
    getServerDateSnapshot
  )

  if (!dateStr) return null

  return dateStr
}

function subscribeToDateSnapshot() {
  return () => {}
}

function getServerDateSnapshot() {
  return ""
}

function getClientDateSnapshot() {
  const days = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ]
  const now = new Date()
  const dayName = days[now.getDay()]
  const day = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  return `${dayName}, ngày ${day} tháng ${month} năm ${year}`
}
