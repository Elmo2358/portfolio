"use client"

import { useNotifications } from "@/hooks/use-notifications"

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  useNotifications()
  return <>{children}</>
}
