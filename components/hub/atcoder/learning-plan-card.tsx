"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, CheckCircle, Clock, Info, BookOpen, Code, Trophy, RefreshCw, ArrowUp } from "lucide-react"

interface WeeklyMilestone {
  order: number
  title: string
  description?: string
  goals: string[]
  problemCount: number
  focusArea: string
  difficultyMin: number
  difficultyMax: number
}

interface RecommendationCriteria {
  focusAreas: string[]
  difficultyMin: number
  difficultyMax: number
  excludeSolved: boolean
  preferContest?: string
}

interface LearningPlan {
  id: string
  currentRating?: number
  currentZone?: string
  currentZoneName?: string
  targetRating: number
  targetZone: string
  targetZoneName?: string
  progress: number
  studyAdvice?: string
  weeklyMilestones: WeeklyMilestone[]
  recommendationCriteria?: RecommendationCriteria
  lastUpdatedFromReview?: string
  reviewCount?: number
  taskCount: number
  completedTaskCount: number
  createdAt: string
  updatedAt: string
}

interface LearningPlanCardProps {
  onTaskComplete?: () => void
  className?: string
}

export function LearningPlanCard({ onTaskComplete, className }: LearningPlanCardProps) {
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/learning-plans")

      if (!res.ok) {
        const data = await res.json()
        if (data.setupRequired) {
          setError("z.ai APIキーが必要です。設定画面から入力してください。")
        } else {
          setError(data.error || "学習プランの取得に失敗しました")
        }
        return
      }

      const data = await res.json()
      setPlan(data.plan)
    } catch (err) {
      console.error("Error fetching plan:", err)
      setError("学習プランの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const regeneratePlan = async () => {
    setRegenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/learning-plans", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.setupRequired) {
          setError("z.ai APIキーが必要です。設定画面から入力してください。")
        } else {
          setError(data.error || "プランの再生成に失敗しました")
        }
        return
      }

      const data = await res.json()
      setPlan(data)

      if (onTaskComplete) {
        onTaskComplete()
      }
    } catch (err) {
      console.error("Error regenerating plan:", err)
      setError("プランの再生成に失敗しました")
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Card className={`border-2 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 ${className || ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              AI 学習プラン
            </CardTitle>
            <CardDescription>
              コードレビュー時に自動更新されます
            </CardDescription>
          </div>
          {plan && (
            <Button
              size="sm"
              variant="outline"
              onClick={regeneratePlan}
              disabled={regenerating}
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  手動更新
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600 mb-4">
            <CardContent className="py-3 text-center text-sm text-yellow-800 dark:text-yellow-200">
              {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !plan ? (
          <Card className="bg-white dark:bg-gray-900">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-4">まだ学習プランがありません</p>
              <p className="text-sm">
                コードレビューを行うと、現在の実力に合わせた学習プランが自動生成されます
              </p>
            </CardContent>
          </Card>
        ) : (
          <PlanDisplay plan={plan} />
        )}
      </CardContent>
    </Card>
  )
}

interface PlanDisplayProps {
  plan: LearningPlan
}

function PlanDisplay({ plan }: PlanDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<WeeklyMilestone | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        {/* レートゾーン表示 */}
        <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 border-teal-200 dark:border-teal-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">現在</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                      {plan.currentRating ?? 0}
                    </span>
                    <Badge variant="outline" className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                      {plan.currentZoneName || plan.currentZone}
                    </Badge>
                  </div>
                </div>
                <ArrowUp className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">目標</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {plan.targetRating}
                    </span>
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      {plan.targetZoneName || plan.targetZone}
                    </Badge>
                  </div>
                </div>
              </div>
              {plan.lastUpdatedFromReview && (
                <div className="text-xs text-muted-foreground">
                  更新: {new Date(plan.lastUpdatedFromReview).toLocaleDateString()}
                  <br />
                  レビュー数: {plan.reviewCount || 0}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 学習アドバイス */}
        {plan.studyAdvice && !plan.studyAdvice.startsWith('```') && !plan.studyAdvice.includes('"weeklyMilestones"') && (
          <Card className="bg-white dark:bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm">{plan.studyAdvice}</p>
            </CardContent>
          </Card>
        )}

        {/* 進捗バー */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-medium">{Math.round(plan.progress)}%</span>
          </div>
          <Progress value={plan.progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {plan.completedTaskCount} / {plan.taskCount} タスク完了
          </div>
        </div>

        {/* フェーズ別マイルストーン */}
        {plan.weeklyMilestones && plan.weeklyMilestones.length > 0 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full mb-2"
            >
              {expanded ? "詳細を隠す" : `学習フェーズを表示 (${plan.weeklyMilestones.length}フェーズ)`}
            </Button>

            {expanded && (
              <div className="space-y-3 mt-3">
                {plan.weeklyMilestones.map((milestone, index) => (
                  <div
                    key={milestone.order}
                    className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedMilestone(milestone)
                      setDetailsDialogOpen(true)
                    }}
                  >
                    {/* フェーズヘッダー */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold">
                          {milestone.order}
                        </div>
                        <h4 className="font-medium text-sm">{milestone.title}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800">
                        {milestone.focusArea}
                      </Badge>
                    </div>

                    {/* フェーズ詳細 */}
                    <div className="p-3 space-y-2">
                      {milestone.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{milestone.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {milestone.problemCount}問
                        </span>
                        <span className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          難易度 {milestone.difficultyMin} - {milestone.difficultyMax}
                        </span>
                      </div>

                      {/* 目標のプレビュー */}
                      {milestone.goals && milestone.goals.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex flex-wrap gap-1">
                            {milestone.goals.slice(0, 3).map((goal, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                              >
                                <CheckCircle className="h-3 w-3 text-teal-600" />
                                {goal}
                              </span>
                            ))}
                            {milestone.goals.length > 3 && (
                              <span className="text-xs text-muted-foreground px-2 py-1">
                                +{milestone.goals.length - 3}件
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 推薦基準 */}
        {plan.recommendationCriteria && (
          <Card className="bg-white dark:bg-gray-900">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Code className="h-4 w-4 text-teal-600" />
                問題推薦基準
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">重点分野</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plan.recommendationCriteria.focusAreas?.map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">難易度範囲</p>
                  <p className="font-medium">
                    {plan.recommendationCriteria.difficultyMin} - {plan.recommendationCriteria.difficultyMax}
                  </p>
                </div>
                {plan.recommendationCriteria.preferContest && (
                  <div>
                    <p className="text-xs text-muted-foreground">推奨コンテスト</p>
                    <p className="font-medium">{plan.recommendationCriteria.preferContest}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* マイルストーン詳細ダイアログ */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-600" />
              {selectedMilestone?.title}
            </DialogTitle>
            <DialogDescription>
              このフェーズの具体的な学習内容
            </DialogDescription>
          </DialogHeader>

          {selectedMilestone && (
            <div className="space-y-4">
              {selectedMilestone.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{selectedMilestone.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4 text-teal-600" />
                  学習目標
                </h4>
                <ul className="space-y-1">
                  {selectedMilestone.goals.map((goal, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-600" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">問題数</p>
                  <p className="font-medium">{selectedMilestone.problemCount}問</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">難易度</p>
                  <p className="font-medium">
                    {selectedMilestone.difficultyMin} - {selectedMilestone.difficultyMax}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">重点分野</p>
                  <p className="font-medium">{selectedMilestone.focusArea}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">フェーズ</p>
                  <p className="font-medium">第{selectedMilestone.order}フェーズ</p>
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-950 p-3 rounded-lg">
                <p className="text-sm text-teal-800 dark:text-teal-200">
                  <strong>ヒント:</strong> 各目標を完了したら、次のフェーズに進みましょう。
                  理解が不十分な場合は、同じレベルの問題を追加して練習してください。
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Target icon for CardTitle
function Target({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
