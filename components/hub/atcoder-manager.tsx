"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityHeatmap } from "@/components/hub/atcoder/heatmap"
import { StreakCard } from "@/components/hub/atcoder/streak-card"
import { ContestSchedule } from "@/components/hub/atcoder/contest-schedule"
import { ChatInterface } from "@/components/hub/atcoder/ai/qa/chat-interface"
import { HintRevealer } from "@/components/hub/atcoder/ai/qa/hint-revealer"
import { RecommendationCard } from "@/components/hub/atcoder/recommendation-card"
import { CodeReviewCard } from "@/components/hub/atcoder/code-review-card"
import { LearningPlanCard } from "@/components/hub/atcoder/learning-plan-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  ExternalLink,
  Flame,
  Trash2,
  Save,
  BookOpen,
  Sparkles,
} from "lucide-react"

interface Problem {
  id: string
  contestId: string
  title: string
  difficulty?: number
  url: string
  userStatus: string
  userMemo?: string | null
  lastAttempted?: string | null
}

interface Stats {
  overview: {
    totalProblems: number
    totalAC: number
    attemptRate: number
    acRate: number
    streak: number
  }
  statusBreakdown: {
    unattempted: number
    in_progress: number
    contest_ac: number
    upsolved_ac: number
    review: number
  }
  contestStats: Array<{ contestId: string; acCount: number }>
  difficultyStats: Array<{
    range: string
    solved: number
    total: number
  }>
  dailyAC: Record<string, number>
}

const statusLabels: Record<string, string> = {
  unattempted: "未着手",
  in_progress: "途中",
  contest_ac: "コンテスト内AC",
  upsolved_ac: "コンテスト後AC",
  review: "復習中",
}

const statusColors: Record<string, string> = {
  unattempted: "bg-gray-500",
  in_progress: "bg-yellow-500",
  contest_ac: "bg-green-600",
  upsolved_ac: "bg-blue-600",
  review: "bg-purple-600",
}

interface AtCoderManagerProps {
  initialProblems?: any[]
}

export function AtCoderManager({ initialProblems }: AtCoderManagerProps) {
  const [problems, setProblems] = useState<Problem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  // 新規問題追加
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProblem, setNewProblem] = useState({
    problemId: "",
    title: "",
    contestId: "",
    url: "",
  })
  const [urlValidation, setUrlValidation] = useState<{
    status: "idle" | "loading" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  // 問題編集
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [editMemo, setEditMemo] = useState("")
  const [editStatus, setEditStatus] = useState("")

  // 初回ロード
  useEffect(() => {
    fetchStats()
    fetchProblemsInternal()
  }, [])

  // 検索・フィルタ変更時のデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProblemsInternal()
    }, 500) // 500ms遅延

    return () => clearTimeout(timer)
  }, [search, statusFilter])

  // ページ変更時
  useEffect(() => {
    fetchProblemsInternal()
  }, [page])

  const fetchProblemsInternal = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      })
      if (search) params.append("search", search)
      if (statusFilter) params.append("status", statusFilter)

      const res = await fetch(`/api/hub/atcoder/problems?${params}`)
      if (!res.ok) {
        if (res.status === 401) {
          setError("ログインが必要です")
        } else {
          console.error("API Error:", res.status, res.statusText)
          setError("問題の取得に失敗しました")
        }
        return
      }
      const data = await res.json()
      setProblems(data.problems || [])
      setError(null)
    } catch (error) {
      console.error("Error fetching problems:", error)
      setError("問題の取得に失敗しました")
    }
  }

  const fetchProblems = async () => {
    await fetchProblemsInternal()
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/hub/atcoder/stats")
      if (!res.ok) {
        if (res.status === 401) {
          setError("ログインが必要です")
        } else {
          setError("統計の取得に失敗しました")
        }
        return
      }
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError("統計の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // URLから問題IDを抽出して検証
  const validateProblemUrl = async (url: string) => {
    // URL形式のチェック
    const urlPattern = /^https:\/\/atcoder\.jp\/contests\/([^/]+)\/tasks\/([^/]+)$/
    const match = url.match(urlPattern)

    if (!match) {
      setUrlValidation({
        status: "invalid",
        message: "無効なAtCoder URLです",
      })
      return
    }

    const [, contestId, problemId] = match

    // 問題IDを自動入力
    setNewProblem((prev) => ({ ...prev, problemId, contestId }))

    // APIで問題の存在確認
    setUrlValidation({ status: "loading", message: "問題を確認中..." })

    try {
      const res = await fetch(`/api/hub/atcoder/validate-problem?problemId=${encodeURIComponent(problemId)}`)

      if (res.ok) {
        const data = await res.json()
        if (data.exists) {
          // 問題が存在する場合はタイトルを自動入力
          setNewProblem((prev) => ({
            ...prev,
            problemId: data.problem.id,
            title: data.problem.title,
            contestId: data.problem.contestId,
          }))
          setUrlValidation({
            status: "valid",
            message: `✓ ${data.problem.title}`,
          })
        } else {
          setUrlValidation({
            status: "invalid",
            message: "問題が見つかりません",
          })
        }
      } else {
        setUrlValidation({
          status: "invalid",
          message: "問題の確認に失敗しました",
        })
      }
    } catch (error) {
      console.error("Error validating problem:", error)
      setUrlValidation({
        status: "idle",
        message: "",
      })
    }
  }

  const handleAddProblem = async () => {
    try {
      const res = await fetch("/api/hub/atcoder/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProblem),
      })

      if (res.ok) {
        setNewProblem({ problemId: "", title: "", contestId: "", url: "" })
        setUrlValidation({ status: "idle", message: "" })
        setIsAddDialogOpen(false)
        await fetchProblems()
        await fetchStats()
      } else {
        const data = await res.json()
        alert(data.error || "問題の追加に失敗しました")
      }
    } catch (error) {
      console.error("Error adding problem:", error)
      alert("問題の追加に失敗しました")
    }
  }

  // ダイアログが閉じる時のハンドラ
  const handleCloseDialog = () => {
    setNewProblem({ problemId: "", title: "", contestId: "", url: "" })
    setUrlValidation({ status: "idle", message: "" })
    setIsAddDialogOpen(false)
  }

  // ダイアログが開く時のハンドラ
  const handleOpenDialog = () => {
    setNewProblem({ problemId: "", title: "", contestId: "", url: "" })
    setUrlValidation({ status: "idle", message: "" })
    setIsAddDialogOpen(true)
  }

  const handleUpdateProblem = async () => {
    if (!editingProblem) return

    try {
      const res = await fetch(`/api/hub/atcoder/problems/${editingProblem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          memo: editMemo,
        }),
      })

      if (res.ok) {
        setEditingProblem(null)
        await fetchProblems()
        await fetchStats()
      } else {
        alert("問題の更新に失敗しました")
      }
    } catch (error) {
      console.error("Error updating problem:", error)
      alert("問題の更新に失敗しました")
    }
  }

  const handleDeleteProblem = async (problemId: string) => {
    if (!confirm("この問題を削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/atcoder/problems/${problemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await fetchProblems()
        await fetchStats()
      } else {
        alert("問題の削除に失敗しました")
      }
    } catch (error) {
      console.error("Error deleting problem:", error)
      alert("問題の削除に失敗しました")
    }
  }

  const openEditDialog = (problem: Problem) => {
    setEditingProblem(problem)
    setEditMemo(problem.userMemo || "")
    setEditStatus(problem.userStatus)
  }

  if (loading) {
    return <div className="text-center py-12">読み込み中...</div>
  }

  if (error) {
    return (
      <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            アプリケーションハブを使用するにはログインしてください
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計ダッシュボード */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  総問題数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {stats.overview.totalProblems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  登録済みの問題
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  AC数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.overview.totalAC}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AC率: {stats.overview.acRate}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  挑戦率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.overview.attemptRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  手をつけた問題の割合
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ストリーク詳細カード */}
          <StreakCard
            currentStreak={stats.overview.streak}
            longestStreak={0}
            forgivenessUsed={0}
          />
        </>
      )}

      {/* 学習履歴ヒートマップ */}
      <ActivityHeatmap days={365} />

      {/* コンテストスケジュール */}
      <ContestSchedule limit={10} sites={["atcoder.jp"]} />

      {/* AI問題推薦 */}
      <RecommendationCard onAddProblem={async () => await fetchProblems()} />

      {/* AIコードレビュー */}
      <CodeReviewCard onReviewGenerated={async () => await fetchStats()} />

      {/* AI学習プラン */}
      <LearningPlanCard onTaskComplete={async () => await fetchStats()} />

      {/* 検索・フィルタ・追加 */}
      <Card>
        <CardHeader>
          <CardTitle>問題管理</CardTitle>
          <CardDescription>
            AtCoderの問題を管理・追跡
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="問題名またはIDで検索..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                  }}
                  className="pl-10 h-12 text-base w-full"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="flex h-12 flex-1 sm:flex-none sm:w-[140px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">すべて</option>
                  <option value="unattempted">未着手</option>
                  <option value="in_progress">途中</option>
                  <option value="contest_ac">コンテスト内AC</option>
                  <option value="upsolved_ac">コンテスト後AC</option>
                  <option value="review">復習中</option>
                </select>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 h-12 flex-1 sm:flex-none sm:w-auto px-3 sm:px-4"
                      onClick={handleOpenDialog}
                    >
                      <Plus className="h-4 w-4 mr-1 sm:mr-2 shrink-0" />
                      <span className="text-sm sm:text-base">問題を追加</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>問題を追加</DialogTitle>
                    <DialogDescription>
                      AtCoderの問題を手動で追加
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="problemId">問題ID</Label>
                      <Input
                        id="problemId"
                        placeholder="abc250_a"
                        value={newProblem.problemId}
                        onChange={(e) =>
                          setNewProblem({ ...newProblem, problemId: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">タイトル</Label>
                      <Input
                        id="title"
                        placeholder="問題タイトル"
                        value={newProblem.title}
                        onChange={(e) =>
                          setNewProblem({ ...newProblem, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="contestId">コンテストID</Label>
                      <Input
                        id="contestId"
                        placeholder="abc250"
                        value={newProblem.contestId}
                        onChange={(e) =>
                          setNewProblem({ ...newProblem, contestId: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="https://atcoder.jp/contests/abc250/tasks/abc250_a"
                        value={newProblem.url}
                        onChange={(e) => {
                          setNewProblem({ ...newProblem, url: e.target.value })
                          setUrlValidation({ status: "idle", message: "" })
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            validateProblemUrl(e.target.value)
                          }
                        }}
                      />
                      {urlValidation.message && (
                        <p className={`text-xs mt-1 ${
                          urlValidation.status === "valid"
                            ? "text-emerald-600"
                            : urlValidation.status === "invalid"
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}>
                          {urlValidation.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleAddProblem}
                      disabled={
                        !newProblem.problemId ||
                        !newProblem.title ||
                        !newProblem.url ||
                        urlValidation.status === "invalid" ||
                        urlValidation.status === "loading"
                      }
                    >
                      {urlValidation.status === "loading" ? "確認中..." : "追加"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 問題一覧 */}
      <div className="grid gap-4">
        {problems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search || statusFilter
                ? "条件に一致する問題がありません"
                : "問題がまだ登録されていません"}
            </CardContent>
          </Card>
        ) : (
          problems.map((problem) => (
            <Card
              key={problem.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`text-white ${statusColors[problem.userStatus]}`}
                      >
                        {statusLabels[problem.userStatus]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {problem.id}
                      </span>
                      {problem.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          推定 difficulty: {problem.difficulty}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {problem.contestId}
                    </p>
                    {problem.userMemo && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {problem.userMemo}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(problem)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="問題ページを開く"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href={`https://atcoder.jp/contests/${problem.contestId}/editorial/${problem.id.split('_').pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="解説ページを開く"
                    >
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProblem(problem.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AIアシスタント */}
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

      {/* 問題編集ダイアログ */}
      {editingProblem && (
        <Dialog open={!!editingProblem} onOpenChange={() => setEditingProblem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>問題を編集</DialogTitle>
              <DialogDescription>
                {editingProblem.title}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit">編集</TabsTrigger>
                <TabsTrigger value="hints">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AIヒント
                </TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-4 py-4">
                <div>
                  <Label htmlFor="editStatus">ステータス</Label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="unattempted">未着手</option>
                    <option value="in_progress">途中</option>
                    <option value="contest_ac">コンテスト内AC</option>
                    <option value="upsolved_ac">コンテスト後AC</option>
                    <option value="review">復習中</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="editMemo">メモ</Label>
                  <Textarea
                    id="editMemo"
                    placeholder="解法のメモ、気づいた点、復習すべき点など..."
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>
              <TabsContent value="hints" className="py-4">
                <HintRevealer
                  problemId={editingProblem.id}
                  problemTitle={editingProblem.title}
                />
              </TabsContent>
              <TabsContent value="qa" className="py-4">
                <ChatInterface
                  problemId={editingProblem.id}
                  problemTitle={editingProblem.title}
                  problemUrl={editingProblem.url}
                  className="h-[500px]"
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProblem(null)}>
                キャンセル
              </Button>
              <Button onClick={handleUpdateProblem}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
