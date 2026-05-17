"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink, Loader2, Bell, BellOff } from "lucide-react"

interface Contest {
  id: string
  event: string
  resource: string
  start: string
  end: string
  duration: string
  href: string
}

interface ContestScheduleProps {
  limit?: number
  sites?: string[]
}

export function ContestSchedule({ limit = 10, sites }: ContestScheduleProps) {
  const [contests, setContests] = useState<Contest[]>([])
  const [reminders, setReminders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [calendarAdded, setCalendarAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          limit: limit.toString(),
        })

        if (sites && sites.length > 0) {
          params.append("sites", sites.join(","))
        }

        const res = await fetch(`/api/hub/atcoder/contests?${params.toString()}`)
        const data = await res.json()

        if (data.success) {
          setContests(data.contests)
          setIsMock(data.mock || false)
        }
      } catch (error) {
        console.error("Error fetching contests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
  }, [limit, sites])

  // 設定済みリマインダーを取得
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch("/api/hub/atcoder/reminders")
        const data = await res.json()

        if (data.success) {
          const reminderSet = new Set<string>(data.reminders.map((r: { contestId: string }) => r.contestId))
          setReminders(reminderSet)
        }
      } catch (error) {
        console.error("Error fetching reminders:", error)
      }
    }

    fetchReminders()
  }, [])

  const toggleReminder = async (contest: Contest) => {
    const isReminding = reminders.has(contest.id)

    try {
      if (isReminding) {
        // 削除（DELETEリクエスト）
        await fetch(`/api/hub/atcoder/reminders?contestId=${encodeURIComponent(contest.id)}`, {
          method: "DELETE",
        })

        setReminders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(contest.id)
          return newSet
        })
      } else {
        // 追加（POSTリクエスト）
        const res = await fetch("/api/hub/atcoder/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contestId: contest.id,
            event: contest.event,
            resource: contest.resource,
            start: contest.start,
            end: contest.end,
            href: contest.href,
          }),
        })

        if (res.ok) {
          setReminders((prev) => new Set(prev).add(contest.id))

          // 自動的にカレンダーにも追加
          try {
            const calRes = await fetch("/api/hub/atcoder/calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contestId: contest.id,
                event: contest.event,
                resource: contest.resource,
                start: contest.start,
                end: contest.end,
                href: contest.href,
              }),
            })

            if (calRes.ok) {
              setCalendarAdded((prev) => new Set(prev).add(contest.id))
              const data = await calRes.json()

              alert("リマインダーを設定し、Googleカレンダーにも追加しました！")

              // カレンダーを別タブで開く
              if (data.htmlLink) {
                window.open(data.htmlLink, "_blank")
              }
            } else {
              alert("リマインダーを設定しました（カレンダー追加はスキップ）")
            }
          } catch (error) {
            console.error("Error adding to calendar:", error)
            alert("リマインダーを設定しました（カレンダー追加はスキップ）")
          }
        }
      }
    } catch (error) {
      console.error("Error toggling reminder:", error)
      alert("リマインダーの設定に失敗しました")
    }
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000))

    if (diffDays === 0) {
      return `今日 ${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffDays === 1) {
      return `明日 ${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString("ja-JP", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    } else {
      return `${date.toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} (${diffDays}日後)`
    }
  }

  const getResourceColor = (resource: string) => {
    if (resource.includes("atcoder")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
    if (resource.includes("codeforces")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (resource.includes("yukicoder")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  const formatDuration = (duration: string | number) => {
    // 文字列の場合（例: "02:00:00"）はそのまま返す
    if (typeof duration === "string" && duration.includes(":")) {
      return duration
    }

    // 数値または数字のみの文字列の場合（秒単位と仮定）
    const seconds = typeof duration === "number" ? duration : parseInt(duration, 10)
    if (isNaN(seconds)) return duration

    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}日${hours}時間`
    } else if (hours > 0) {
      return `${hours}時間${minutes}分`
    } else {
      return `${minutes}分`
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今後のコンテスト
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今後のコンテスト
          </CardTitle>
          {isMock && (
            <Badge variant="outline" className="text-xs">
              デモデータ
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {contests.length === 0 ? (
          <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 py-4">
            今後のコンテストはありません
          </p>
        ) : (
          <div className="space-y-3">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 truncate">
                        {contest.event}
                      </h4>
                      <Badge className={`text-xs ${getResourceColor(contest.resource)}`}>
                        {contest.resource.replace(".com", "").replace(".jp", "")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(contest.start)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(contest.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={reminders.has(contest.id) ? "default" : "outline"}
                      className={`h-8 px-2 text-xs ${
                        reminders.has(contest.id)
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
                      }`}
                      onClick={() => toggleReminder(contest)}
                      title={
                        reminders.has(contest.id)
                          ? "リマインダー解除（カレンダーからも削除されます）"
                          : "リマインダー設定（カレンダーにも追加）"
                      }
                    >
                      {reminders.has(contest.id) ? (
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          <Calendar className="h-3 w-3" />
                        </div>
                      ) : (
                        <BellOff className="h-3 w-3" />
                      )}
                    </Button>
                    <a
                      href={contest.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isMock && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">CLIST APIキー未設定</p>
            <p className="mb-2">
              コンテスト情報を自動取得するには、CLISTアカウントとAPIキーが必要です：
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <a
                  href="https://clist.by/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  CLIST
                </a>
                {" "}
                にアカウント登録
              </li>
              <li>プロフィールページでAPIキーを取得</li>
              <li>環境変数 `CLIST_USERNAME` と `CLIST_API_KEY` を設定</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
