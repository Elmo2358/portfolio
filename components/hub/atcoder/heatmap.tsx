"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HeatmapData {
  date: string
  total: number
  ac: number
  level: number
}

interface HeatmapStats {
  totalDays: number
  totalSubmissions: number
  totalAC: number
  period: number
}

interface HeatmapProps {
  days?: number
}

// キャッシュキーを生成
const getCacheKey = (days: number) => `heatmap_cache_${days}`

// キャッシュからデータを取得
function getCachedData(days: number) {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(getCacheKey(days))
    if (cached) {
      const { data, stats, timestamp } = JSON.parse(cached)
      // 1時間は有効とする
      const now = Date.now()
      if (now - timestamp < 60 * 60 * 1000) {
        return { data, stats }
      }
    }
  } catch {
    return null
  }
  return null
}

// データをキャッシュに保存
function setCachedData(days: number, data: HeatmapData[], stats: HeatmapStats) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(getCacheKey(days), JSON.stringify({
      data,
      stats,
      timestamp: Date.now()
    }))
  } catch {
    // localStorageが無効な場合は無視
  }
}

export function ActivityHeatmap({ days = 365 }: HeatmapProps) {
  const [data, setData] = useState<HeatmapData[]>([])
  const [stats, setStats] = useState<HeatmapStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // まずキャッシュをチェック
      const cached = getCachedData(days)
      if (cached) {
        setData(cached.data)
        setStats(cached.stats)
        setLoading(false)
      }

      // バックグラウンドで最新データを取得
      try {
        const res = await fetch(`/api/hub/atcoder/heatmap?days=${days}`, {
          cache: "no-store"
        })
        const json = await res.json()

        if (json.success) {
          setData(json.data)
          setStats(json.stats)
          // キャッシュを更新
          setCachedData(days, json.data, json.stats)
        }
      } catch (error) {
        console.error("Error fetching heatmap data:", error)
        // キャッシュがあればそれを使い続ける
        if (!cached) {
          setLoading(false)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [days])

  if (loading) {
    return (
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">学習履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-emerald-600 dark:text-emerald-400">
            読み込み中...
          </div>
        </CardContent>
      </Card>
    )
  }

  // 過去{days}日分の日付リストを作成
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)

  // 週ごとのデータをグループ化（日曜始まり）
  const weeks: HeatmapData[][] = []
  let currentWeek: HeatmapData[] = []

  const dataMap = new Map(data.map((d) => [d.date, d]))

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split("T")[0]

    const dayData = dataMap.get(dateKey) || {
      date: dateKey,
      total: 0,
      ac: 0,
      level: 0,
    }

    currentWeek.push(dayData)

    // 土曜日で週が終わる
    if (date.getDay() === 6) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // 最後の週を追加
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  // 月ラベル用
  const monthLabels: string[] = []
  let currentMonth = ""

  for (let i = 0; i < days; i += 7) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const month = date.toLocaleString("ja-JP", { month: "short" })

    if (month !== currentMonth) {
      currentMonth = month
      monthLabels.push(month)
    } else {
      monthLabels.push("")
    }
  }

  const getCellColor = (level: number) => {
    if (level === 0) return "bg-gray-100 dark:bg-gray-800"
    if (level === 1) return "bg-emerald-200 dark:bg-emerald-900"
    if (level === 2) return "bg-emerald-300 dark:bg-emerald-700"
    if (level === 3) return "bg-emerald-400 dark:bg-emerald-600"
    return "bg-emerald-500 dark:bg-emerald-500"
  }

  return (
    <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-700 dark:text-emerald-300">学習履歴</CardTitle>
          {stats && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400">
              <span className="font-semibold">{stats.totalAC}</span> AC /
              <span className="font-semibold">{stats.totalSubmissions}</span> 提出
              （<span className="font-semibold">{stats.totalDays}</span> 日）
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* 月ラベル */}
            <div className="flex mb-2 ml-8">
              {monthLabels.map((month, i) => (
                <div
                  key={i}
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                  style={{ width: "12px", marginRight: "3px" }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* ヒートマップグリッド */}
            <div className="flex">
              {/* 曜日ラベル */}
              <div className="flex flex-col mr-2 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="h-3" />
                <div className="h-3">月</div>
                <div className="h-3" />
                <div className="h-3">水</div>
                <div className="h-3" />
                <div className="h-3">金</div>
                <div className="h-3" />
              </div>

              {/* 週ごとのグリッド */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((dayData) => (
                      <div
                        key={dayData.date}
                        className={`w-3 h-3 rounded-sm ${getCellColor(
                          dayData.level
                        )} cursor-pointer hover:ring-2 hover:ring-emerald-600 dark:hover:ring-emerald-400 transition-all`}
                        onMouseEnter={() => setHoveredCell(dayData)}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${dayData.date}: ${dayData.total}提出 (${dayData.ac}AC)`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* レジェンド */}
            <div className="flex items-center justify-end mt-3 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="mr-2">少</span>
              <div className="flex gap-[3px]">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
              </div>
              <span className="ml-2">多</span>
            </div>

            {/* ホバー時の詳細表示 */}
            {hoveredCell && (
              <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-emerald-500 dark:border-emerald-600 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {new Date(hoveredCell.date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400">
                  {hoveredCell.total}件の提出（{hoveredCell.ac}件AC）
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
