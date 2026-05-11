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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Target, Loader2, Sparkles, Plus, CheckCircle, Clock, Info, BookOpen, Code, Trophy } from "lucide-react"

interface LearningPlan {
  id: string
  targetRating?: number
  targetDate: string
  currentRating?: number
  progress: number
  studyAdvice?: string
  weeklyMilestones: Array<{
    week: number
    title: string
    goals: string[]
    problemCount: number
    focusArea: string
    difficultyMin: number
    difficultyMax: number
  }>
  taskCount: number
  completedTaskCount: number
}

interface LearningPlanCardProps {
  onTaskComplete?: () => void
  className?: string
}

const focusAreas = [
  { value: "dp", label: "DP（動的計画法）" },
  { value: "graph", label: "グラフ理論" },
  { value: "string", label: "文字列" },
  { value: "math", label: "数学" },
  { value: "data-structure", label: "データ構造" },
  { value: "greedy", label: "貪欲法" },
]

export function LearningPlanCard({ onTaskComplete, className }: LearningPlanCardProps) {
  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 新規プラン作成用ステート
  const [targetRating, setTargetRating] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
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
      setPlans(data.plans || [])
    } catch (err) {
      console.error("Error fetching plans:", err)
      setError("学習プランの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    if (!targetDate) {
      setError("目標日を入力してください")
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/learning-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRating: targetRating ? parseInt(targetRating) : undefined,
          targetDate,
          focusAreas: selectedFocusAreas,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.setupRequired) {
          setError("z.ai APIキーが必要です。設定画面から入力してください。")
        } else {
          setError(data.error || "プランの生成に失敗しました")
        }
        return
      }

      // プラン一覧を更新
      await fetchPlans()

      // ダイアログを閉じる
      setDialogOpen(false)

      // 入力をリセット
      setTargetRating("")
      setTargetDate("")
      setSelectedFocusAreas([])

      if (onTaskComplete) {
        onTaskComplete()
      }
    } catch (err) {
      console.error("Error generating plan:", err)
      setError("プランの生成に失敗しました")
    } finally {
      setGenerating(false)
    }
  }

  const toggleFocusArea = (value: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const deletePlan = async (planId: string) => {
    if (!confirm("この学習プランを削除しますか？")) return

    try {
      const res = await fetch(`/api/ai/learning-plans/${planId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchPlans()
      }
    } catch (err) {
      console.error("Error deleting plan:", err)
    }
  }

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diff = target.getTime() - now.getTime()
    return Math.ceil(diff / (24 * 60 * 60 * 1000))
  }

  return (
    <>
      <Card className={`border-2 border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 ${className || ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                AI 学習プラン
              </CardTitle>
              <CardDescription>
                目標から最適な学習計画をAIが生成
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  新規作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>学習プランを作成</DialogTitle>
                  <DialogDescription>
                    目標を入力すると、AIが最適な学習プランを生成します
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="targetRating">目標レート（任意）</Label>
                    <Input
                      id="targetRating"
                      type="number"
                      placeholder="例: 1200"
                      value={targetRating}
                      onChange={(e) => setTargetRating(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetDate">目標日</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label>重点分野（任意）</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {focusAreas.map((area) => (
                        <Badge
                          key={area.value}
                          variant={selectedFocusAreas.includes(area.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFocusArea(area.value)}
                        >
                          {area.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button
                    onClick={generatePlan}
                    disabled={generating || !targetDate}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      "プランを生成"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
          ) : plans.length === 0 ? (
            <Card className="bg-white dark:bg-gray-900">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="mb-4">まだ学習プランがありません</p>
                <p className="text-sm">
                  目標を入力すると、AIが最適な学習プランを生成します
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={() => deletePlan(plan.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
}

// タスクの詳細説明を取得する関数
const getTaskDetails = (title: string): { title: string; steps: string[]; resources?: string[] } => {
  const taskDetails: Record<string, { title: string; steps: string[]; resources?: string[] }> = {
    "DPの基本概念を理解する": {
      title: "DP（動的計画法）の基本概念",
      steps: [
        "DPとは「同じ計算を何度もしないように、結果をメモしながら計算する手法」です",
        "まずは「フィボナッチ数列」のメモ化再帰から始めましょう",
        "典型的なDP問題を解いてみよう：ナップサック問題、部分和問題",
        "AtCoderの問題：ABC 146 C - Buy an Integer、ABC 172 C - Tsundoku"
      ],
      resources: ["AtCoder DP Contest", "競プロにおけるDP入門"]
    },
    "ナップサック問題を解く": {
      title: "ナップサック問題に挑戦",
      steps: [
        "基本のナップサック問題：価値と重さがある品物を容量Wのナップサックに詰める",
        "DPテーブルの作り方：dp[i][w] = i番目までの品物で重さw以下の時の最大価値",
        "漸化式：dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])",
        "練習問題：ABC 032 D - ナップサック問題、Educational DP Contest A問題"
      ],
      resources: ["ナップサック問題の解説記事", "DP典型問題まとめ"]
    },
    "区間DPの基礎を学ぶ": {
      title: "区間DPの基礎",
      steps: [
        "区間DPは「区間[l, r]を最適に分割する」手法です",
        "典型例：エックスアンサーズ、最適な括弧付け",
        "dp[l][r] = 区間[l, r]の最適値、小さい区間から大きな区間へ計算",
        "練習問題：ABC 179 F、典型的な区間DP問題"
      ],
      resources: ["区間DP解説", "DP演習問題集"]
    },
    "DFS/BFSをマスターする": {
      title: "深さ優先探索（DFS）と幅優先探索（BFS）",
      steps: [
        "DFSはスタック（または再帰）で実装、深さ方向に探索",
        "BFSはキューで実装、幅方向に探索",
        "迷路問題、最短経路問題で練習",
        "練習問題：ABC 168 D、ABC 176 D、Typical Contest"
      ],
      resources: ["グラフアルゴリズム入門", "AtCoderのDFS/BFS問題"]
    },
    "最短経路問題を解く": {
      title: "最短経路問題",
      steps: [
        "単一始点最短経路：ダイクストラ法（非負の辺）",
        "ベルマンフォード法（負の辺があってもOK）",
        "ワーシャルフロイド法（全点対最短経路）",
        "練習問題：ABC 012 D、ABC 035 D、Typical Contestの最短経路"
      ],
      resources: ["ダイクストラ法の解説", "最短経路問題まとめ"]
    },
    "Union-Findを理解する": {
      title: "Union-Find（素集合データ構造）",
      steps: [
        "要素のグループ分けを管理するデータ構造",
        "find(x): xが属するグループの代表を返す",
        "union(x, y): xとyのグループを併合する",
        "経路圧縮とランクによる併合で高速化",
        "練習問題：ABC 177 D、典型 Union-Find 問題"
      ],
      resources: ["Union-Find解説", "グループ分け問題"]
    },
    "文字列探索を学ぶ": {
      title: "文字列探索アルゴリズム",
      steps: [
        "単純な文字列探索（O(nm））からKMP法（O(n+m)）へ",
        "ローリングハッシュ（ハッシュ値を使った探索）",
        "Z-algorithm、接尾辞配列",
        "練習問題：ABC 122 B、文字列検索典型問題"
      ],
      resources: ["文字列アルゴリズム入門", "文字列問題まとめ"]
    },
    "動的計画法 in 文字列": {
      title: "文字列を使ったDP",
      steps: [
        "LCS（最長共通部分列）問題",
        "編集距離（レーベンシュタイン距離）",
        "文字列の比較や一致判定に応用",
        "練習問題：ABC 129 C、典型 LCS 問題"
      ],
      resources: ["LCS解説", "文字列DPまとめ"]
    },
    "文字列の前処理テクニック": {
      title: "文字列の効率的な前処理",
      steps: [
        "接頭辞関数（prefix function）",
        "Z関数（z-array）",
        "SA（接尾辞配列）とその応用",
        "実装を通じて理解を深める"
      ],
      resources: ["前処理テクニック", "高度な文字列アルゴリズム"]
    },
    "苦手分野の復習": {
      title: "苦手分野の復習方法",
      steps: [
        "まずは自分の弱点を分析：ACできなかった問題の傾向を見る",
        "典型問題を繰り返し解いてパターンを覚える",
        "解説を読んで理解し、自分で実装しなおす",
        "1週間後に同じ問題を解いて定着度を確認"
      ],
      resources: ["復習のコツ", "AtCoderの復習機能"]
    },
    "バーチャルコンテスト参加": {
      title: "バーチャルコンテストに参加しよう",
      steps: [
        "AtCoderのバーチャルコンテスト機能を使う",
        "過去のABC/ARCコンテストを時間制限付きで解く",
        "本番の雰囲気を体験、時間配分の練習",
        "目標：週1回以上、A-C問題を完答できるように"
      ],
      resources: ["バーチャルコンテストの使い方", "コンテスト戦略"]
    },
    "過去問の復習": {
      title: "過去問の復習",
      steps: [
        "一度解いた問題を再度解く",
        "解法を思い出せるか、スムーズに実装できるか確認",
        "より良い解法がないか考える",
        "苦手なタイプの問題を特定して追加練習"
      ],
      resources: ["復習の重要性", "問題集の活用法"]
    }
  }

  // タイトルに部分一致する説明を返す
  for (const [key, value] of Object.entries(taskDetails)) {
    if (title.includes(key) || key.includes(title)) {
      return value
    }
  }

  // デフォルトの説明
  return {
    title: title,
    steps: [
      "まずは基本的な概念を理解しましょう",
      "典型問題を解いて実践経験を積みます",
      "解説を読んで、自分の解法と比較しましょう",
      "似た問題を探して応用力を高めましょう"
    ],
    resources: ["AtCoderの解説", "競プロ典型問題集"]
  }
}

interface PlanCardProps {
  plan: LearningPlan
  onDelete: () => void
}

function PlanCard({ plan, onDelete }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<ReturnType<typeof getTaskDetails> | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const daysUntilTarget = getDaysUntilTarget(plan.targetDate)

  // タスクを取得
  useEffect(() => {
    if (expanded) {
      fetchTasks()
    }
  }, [expanded, plan.id])

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const res = await fetch(`/api/ai/learning-plans/${plan.id}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (err) {
      console.error("Error fetching tasks:", err)
    } finally {
      setLoadingTasks(false)
    }
  }

  // タスクを完了にする
  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    try {
      const res = await fetch(`/api/ai/learning-plans/${plan.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // タスクリストを更新
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
        // 親コンポーネントに通知して進捗を更新
        window.location.reload()
      }
    } catch (err) {
      console.error("Error updating task:", err)
    }
  }

  return (
    <>
    <Card className="bg-white dark:bg-gray-900">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {plan.targetRating && (
                <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                  目標: {plan.targetRating}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                あと{daysUntilTarget}日
              </Badge>
            </div>
            <h3 className="font-semibold mb-1">
              {plan.targetRating ? `レート${plan.targetRating}を目指す` : "スキルアップのための学習プラン"}
            </h3>
            {plan.studyAdvice && (
              <p className="text-sm text-muted-foreground">{plan.studyAdvice}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            削除
          </Button>
        </div>

        {/* 進捗バー */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-medium">{Math.round(plan.progress)}%</span>
          </div>
          <Progress value={plan.progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {plan.completedTaskCount} / {plan.taskCount} タスク完了
          </div>
        </div>

        {/* 週次マイルストーン */}
        {plan.weeklyMilestones && plan.weeklyMilestones.length > 0 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full mb-2"
            >
              {expanded ? "詳細を隠す" : "詳細を表示"}
            </Button>

            {expanded && (
              <div className="space-y-2 mt-3">
                {loadingTasks ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    タスクを読み込み中...
                  </div>
                ) : tasks.length > 0 ? (
                  // 実際のタスクを表示
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        task.status === "completed"
                          ? "bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTask(task.id, task.status)}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            task.status === "completed"
                              ? "bg-teal-500 border-teal-500 text-white"
                              : "border-gray-300 hover:border-teal-400"
                          }`}
                        >
                          {task.status === "completed" && (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTaskDetails(getTaskDetails(task.title))
                            setDetailsDialogOpen(true)
                          }}
                          className="h-7 w-7 p-0 flex-shrink-0"
                          title="詳細を表示"
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  // マイルストーン表示（タスクがない場合）
                  plan.weeklyMilestones.slice(0, 4).map((milestone) => (
                    <div
                      key={milestone.week}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          第{milestone.week}週: {milestone.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {milestone.focusArea}
                        </Badge>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {milestone.goals.map((goal, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-xs text-muted-foreground mt-2">
                        問題数: {milestone.problemCount}問 |
                        難易度: {milestone.difficultyMin} - {milestone.difficultyMax}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* タスク詳細説明ダイアログ */}
    <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-600" />
            {selectedTaskDetails?.title}
          </DialogTitle>
          <DialogDescription>
            このタスクの具体的な学習内容とステップ
          </DialogDescription>
        </DialogHeader>

        {selectedTaskDetails && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Code className="h-4 w-4 text-teal-600" />
                学習ステップ
              </h4>
              <ol className="list-decimal list-inside space-y-2">
                {selectedTaskDetails.steps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground pl-2">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {selectedTaskDetails.resources && selectedTaskDetails.resources.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-teal-600" />
                  参考リソース
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTaskDetails.resources.map((resource, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {resource}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-teal-50 dark:bg-teal-950 p-3 rounded-lg">
              <p className="text-sm text-teal-800 dark:text-teal-200">
                <strong>ヒント:</strong> 各ステップを完了したら、チェックボックスをクリックして進捗を更新しましょう。
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

function getDaysUntilTarget(targetDate: string) {
  const target = new Date(targetDate)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}
