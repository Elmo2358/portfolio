"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface NotificationLog {
  id: string
  type: string
  title: string
  message: string
  sentAt: Date
  read: boolean
}

export function useNotifications() {
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // 初回ロード時に最新の通知IDを取得
    const fetchLatestNotification = async () => {
      try {
        const res = await fetch("/api/hub/notifications?limit=1")
        if (res.ok) {
          const data = await res.json()
          if (data.notifications && data.notifications.length > 0) {
            setLastNotificationId(data.notifications[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching latest notification:", error)
      }
    }

    fetchLatestNotification()

    // 30秒ごとに新しい通知をチェック
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/hub/notifications?limit=5")
        if (res.ok) {
          const data = await res.json()
          const notifications: NotificationLog[] = data.notifications || []

          // 新しい通知を探す
          const newNotifications = notifications.filter(
            (n: NotificationLog) => !lastNotificationId || n.id !== lastNotificationId
          )

          if (newNotifications.length > 0) {
            // 最新の通知IDを更新
            setLastNotificationId(notifications[0].id)

            // 新しい通知ごとに通知を送信
            for (const notification of newNotifications) {
              // Toastを表示
              toast.info(notification.title, {
                description: notification.message,
                duration: 5000,
              })

              // ブラウザ通知が有効な場合は送信
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: "/icon.png",
                  tag: notification.id,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error("Error polling notifications:", error)
      }
    }, 30000) // 30秒ごとにチェック

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [lastNotificationId])
}
