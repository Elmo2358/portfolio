"use client"

import { useState } from "react"
import { BookOpen, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LearningPlanCard } from "@/components/hub/atcoder/learning-plan-card"
import { RecommendationCard } from "@/components/hub/atcoder/recommendation-card"
import { ContestSchedule } from "@/components/hub/atcoder/contest-schedule"
import { ChatInterface } from "@/components/hub/atcoder/ai/qa/chat-interface"

export function AtCoderLearningClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container py-8 space-y-6">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-blue-600 dark:bg-blue-500">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              学習・推薦
            </h1>
            <p className="text-muted-foreground">
              AIによる学習プランと問題推薦
            </p>
          </div>
        </div>
      </div>

      {/* コンテストスケジュール */}
      <ContestSchedule limit={10} sites={["atcoder.jp"]} />

      {/* AI問題推薦 */}
      <RecommendationCard onAddProblem={handleRefresh} key={`rec-${refreshKey}`} />

      {/* AI学習プラン */}
      <LearningPlanCard onTaskComplete={handleRefresh} key={`plan-${refreshKey}`} />

      {/* AI学習アシスタント */}
      <Card className="border-2 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI 学習アシスタント
          </CardTitle>
          <CardDescription>
            AtCoderや競技プログラミングについて質問してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface className="h-[500px]" />
        </CardContent>
      </Card>
    </div>
  )
}
