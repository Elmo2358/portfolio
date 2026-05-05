"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, TrendingUp, Calendar } from "lucide-react"

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  forgivenessUsed: number
}

export function StreakCard({ currentStreak, longestStreak, forgivenessUsed }: StreakCardProps) {
  return (
    <Card className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
          <Flame className="h-5 w-5" />
          ストリーク記録
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在のストリーク */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              現在のストリーク
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {currentStreak}<span className="text-sm font-normal ml-1">日</span>
          </div>
        </div>

        {/* 最長ストリーク */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              最長ストリーク
            </span>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {longestStreak}<span className="text-sm font-normal ml-1">日</span>
          </div>
        </div>

        {/* 寛容措置の使用状況 */}
        <div className="pt-3 border-t border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                今週の寛容措置
              </span>
            </div>
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {forgivenessUsed > 0 ? (
                <span className="font-semibold">{forgivenessUsed}回使用済み</span>
              ) : (
                <span className="font-semibold">未使用</span>
              )}
            </span>
          </div>
          <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
            ※ 週1回、ACがない日があってもストリークが継続されます
          </p>
        </div>

        {/* モチベーションメッセージ */}
        {currentStreak >= 30 && (
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded text-center">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              🎉 1ヶ月以上継続中！素晴らしい！
            </p>
          </div>
        )}
        {currentStreak >= 7 && currentStreak < 30 && (
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded text-center">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              💪 週1回の寛容措置を活用して、継続しましょう！
            </p>
          </div>
        )}
        {currentStreak < 7 && currentStreak > 0 && (
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded text-center">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              🌟 毎日の積み重ねが大事です！
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
