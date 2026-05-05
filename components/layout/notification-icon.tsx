"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface NotificationLog {
  id: string
  type: string
  title: string
  message: string
  sentAt: Date
  status: string
  read: boolean
}

export function NotificationIcon() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 通知を取得
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/hub/notifications?limit=10")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // 30秒ごとにポーリング
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // 通知を既読にする
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/hub/notifications/${id}/read`, { method: "PUT" })
      fetchNotifications()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  // 全て既読にする
  const markAllAsRead = async () => {
    try {
      await fetch("/api/hub/notifications/read-all", { method: "PUT" })
      fetchNotifications()
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              全て既読
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            読み込み中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            通知はありません
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full justify-between items-start mb-1">
                  <span className="font-semibold text-sm">{notification.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(notification.sentAt), "HH:mm", { locale: ja })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                {!notification.read && (
                  <div className="mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/hub/notifications" className="cursor-pointer w-full text-center text-sm">
            すべての通知を見る
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
