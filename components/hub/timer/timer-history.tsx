"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Clock, Coffee, CheckCircle2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

interface TimerSession {
  id: string
  title: string | null
  durationMinutes: number
  actualDurationSeconds: number | null
  category: string
  completed: boolean
  completedAt: Date | null
  createdAt: Date
}

interface TimerHistoryProps {
  initialSessions: TimerSession[]
}

export function TimerHistory({ initialSessions }: TimerHistoryProps) {
  const [sessions, setSessions] = useState<TimerSession[]>(initialSessions)
  const [isLoading, setIsLoading] = useState(false)

  // タイマーセッション作成イベントをリッスン
  useEffect(() => {
    const handleSessionCreated = () => {
      refreshHistory()
    }

    window.addEventListener("timer-session-created", handleSessionCreated)
    return () => {
      window.removeEventListener("timer-session-created", handleSessionCreated)
    }
  }, [])

  const refreshHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/hub/timer")
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error("Failed to refresh history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "focus": return { label: "集中", icon: Clock, color: "text-emerald-600 dark:text-emerald-400" }
      case "break": return { label: "休憩", icon: Coffee, color: "text-orange-600 dark:text-orange-400" }
      default: return { label: "カスタム", icon: Clock, color: "text-gray-600 dark:text-gray-400" }
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">
                  最近のセッション
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  過去10件の記録
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={refreshHistory}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-emerald-700 dark:text-emerald-300">
            まだ記録がありません。タイマーを開始してください！
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">
                最近のセッション
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                過去10件の記録
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={refreshHistory}
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map((session) => {
            const categoryInfo = getCategoryLabel(session.category)
            const CategoryIcon = categoryInfo.icon

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-700"
              >
                <div className={`p-2 rounded-lg ${categoryInfo.color} bg-opacity-10`}>
                  <CategoryIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300 truncate">
                      {session.title || "タイマーセッション"}
                    </span>
                    {session.completed && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                    <span>{categoryInfo.label}</span>
                    <span>•</span>
                    <span>{session.durationMinutes}分設定</span>
                    {session.actualDurationSeconds && (
                      <>
                        <span>•</span>
                        <span>実測: {formatDuration(session.actualDurationSeconds)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: ja })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
