"use client"

import { useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/admin/actions/notifications"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

type Notification = {
  id: string
  message: string
  isRead: boolean
  createdAt: Date
  postId: string | null
}

export function AdminNotifications({ notifications }: { notifications: Notification[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="font-semibold">Thông báo</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
              onClick={async () => {
                await markAllNotificationsAsRead()
              }}
            >
              <CheckCheck className="mr-1 size-3" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-zinc-500">
              Không có thông báo nào.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col gap-1 border-b p-4 text-sm ${
                    !n.isRead ? "bg-blue-50/50" : "bg-white"
                  }`}
                  onClick={async () => {
                    if (!n.isRead) {
                      await markNotificationAsRead(n.id)
                    }
                    if (n.postId) {
                      // Navigate to post (could be handled with a link, but for now just mark read)
                    }
                  }}
                >
                  <p className={`${!n.isRead ? "font-medium text-zinc-900" : "text-zinc-600"}`}>
                    {n.message}
                  </p>
                  <span className="text-xs text-zinc-400">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
