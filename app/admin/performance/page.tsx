"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Zap, Clock, TrendingUp } from "lucide-react"

interface PerformanceData {
  fps: number
  memory: number
  timing: {
    domContentLoaded: number
    loadComplete: number
  }
}

export default function PerformanceDashboard() {
  const [performance, setPerformance] = useState<PerformanceData>({
    fps: 60,
    memory: 0,
    timing: {
      domContentLoaded: 0,
      loadComplete: 0,
    },
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const measurePerformance = () => {
      // Check if Performance API is available
      const hasPerformanceAPI = typeof performance !== 'undefined' &&
                                performance.getEntriesByType &&
                                typeof performance.getEntriesByType === 'function'

      let domContentLoadedTime = 0
      let loadCompleteTime = 0

      if (hasPerformanceAPI) {
        try {
          const navigationEntries = performance.getEntriesByType("navigation")
          if (navigationEntries && navigationEntries.length > 0) {
            const navigation = navigationEntries[0] as PerformanceNavigationTiming
            domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.startTime
            loadCompleteTime = navigation.loadEventEnd - navigation.startTime
          }
        } catch (error) {
          console.warn('Performance Navigation Timing API not available:', error)
        }
      }

      setPerformance({
        fps: 60, // 簡略化
        memory: (performance as any).memory?.usedJSHeapSize / 1048576 || 0,
        timing: {
          domContentLoaded: domContentLoadedTime,
          loadComplete: loadCompleteTime,
        },
      })
    }

    measurePerformance()

    // 1秒ごとに更新
    const interval = setInterval(measurePerformance, 1000)

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container py-8">
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400">
              This page is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          パフォーマンスダッシュボード
        </h1>
        <p className="text-muted-foreground">
          アプリケーションのパフォーマンスをリアルタイムで監視
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* FPS */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                FPS
              </CardTitle>
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {performance.fps}
            </div>
            <p className="text-xs text-muted-foreground mt-1">フレーム/秒</p>
          </CardContent>
        </Card>

        {/* メモリ使用量 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                メモリ
              </CardTitle>
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {performance.memory.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">MB</p>
          </CardContent>
        </Card>

        {/* DOM Content Loaded */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                DOM Ready
              </CardTitle>
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {(performance.timing.domContentLoaded / 1000).toFixed(2)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">DOMコンテンツ読み込み</p>
          </CardContent>
        </Card>

        {/* Load Complete */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Page Load
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {(performance.timing.loadComplete / 1000).toFixed(2)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">ページ読み込み完了</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            パフォーマンスのヒント
          </CardTitle>
          <CardDescription>
            パフォーマンスを改善するためのヒント
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-1">✓</span>
              <span>画像はNext.jsのImageコンポーネントを使用して最適化</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-1">✓</span>
              <span>コンポーネントは必要な時だけレンダリング</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-1">✓</span>
              <span>APIレスポンスはキャッシュして再利用</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-1">✓</span>
              <span>静的コンテンツは可能な限り事前レンダリング</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-1">✓</span>
              <span>大きなコンポーネントは遅延読み込み（lazy loading）</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
