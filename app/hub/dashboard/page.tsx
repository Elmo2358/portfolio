"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, CheckCircle2, Target, Trophy, Calendar } from "lucide-react"

interface Stats {
  tasks: {
    total: number
    completed: number
    completionRate: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    completedByDay: Array<{ date: string; count: number }>
  }
  jobHunt: {
    total: number
    offers: number
    offerRate: number
    byStatus: Record<string, number>
    byType: Record<string, number>
  }
  bucket: {
    total: number
    completed: number
    completionRate: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
  }
  atcoder: {
    solved: number
    totalProblems: number
    solveRate: number
    submissions: number
    submissionsByDay: Array<{ date: string; count: number }>
  }
}

type Period = "week" | "month" | "all"

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [period, setPeriod] = useState<Period>("week")
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/hub/dashboard/stats?period=${period}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  if (loading || !stats) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">ダッシュボード</h1>
        <p className="text-muted-foreground">学習・タスクの進捗を一目で確認</p>
      </div>

      {/* 期間選択 */}
      <div className="flex gap-2 mb-8">
        {(["week", "month", "all"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
            className={
              period === p
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
            }
          >
            {p === "week" ? "今週" : p === "month" ? "今月" : "全期間"}
          </Button>
        ))}
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* タスク管理 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                タスク完了数
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.tasks.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              完了率 {stats.tasks.completionRate}%
            </p>
          </CardContent>
        </Card>

        {/* 就活管理 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                応募企業数
              </CardTitle>
              <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.jobHunt.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              内定率 {stats.jobHunt.offerRate}%
            </p>
          </CardContent>
        </Card>

        {/* バケツリスト */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                達成項目
              </CardTitle>
              <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.bucket.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              達成率 {stats.bucket.completionRate}%
            </p>
          </CardContent>
        </Card>

        {/* AtCoder */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                AC問題数
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.atcoder.solved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              総問題 {stats.atcoder.totalProblems}問
            </p>
          </CardContent>
        </Card>
      </div>

      {/* グラフセクション */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* タスク完了推移 */}
        {stats.tasks.completedByDay.length > 0 && (
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">タスク完了推移</CardTitle>
              <CardDescription>日次の完了タスク数</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.tasks.completedByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10b981" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#10b981"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  />
                  <YAxis stroke="#10b981" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#10b981", border: "none", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, name) => [`${value}件`, name]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AtCoder提出推移 */}
        {stats.atcoder.submissionsByDay.length > 0 && (
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">AtCoder AC推移</CardTitle>
              <CardDescription>日次のAC提出数</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.atcoder.submissionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10b981" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#10b981"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  />
                  <YAxis stroke="#10b981" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#10b981", border: "none", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value, name) => [`${value}件`, name]}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 円グラフセクション */}
      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        {/* タスクステータス別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">タスクステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.tasks.byStatus).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" name="未着手" />
                  <Cell fill="#3b82f6" name="進行中" />
                  <Cell fill="#22c55e" name="完了" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 就活ステータス別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">選考ステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.jobHunt.byStatus).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#3b82f6" name="ES提出" />
                  <Cell fill="#a855f7" name="テスト面接" />
                  <Cell fill="#f97316" name="最終面接" />
                  <Cell fill="#22c55e" name="内定" />
                  <Cell fill="#6b7280" name="落選" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* バケツリストカテゴリ別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">カテゴリ別</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.bucket.byCategory).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#3b82f6" name="travel" />
                  <Cell fill="#a855f7" name="experience" />
                  <Cell fill="#10b981" name="goal" />
                  <Cell fill="#6b7280" name="other" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 詳細統計 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* タスク優先度別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">タスク優先度別</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(stats.tasks.byPriority).map(([name, value]) => ({
                  name: name === "low" ? "低" : name === "medium" ? "中" : "高",
                  value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" strokeOpacity={0.3} />
                <XAxis stroke="#10b981" fontSize={12} />
                <YAxis stroke="#10b981" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#10b981", border: "none", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value, name) => [`${value}件`, name]}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 就活タイプ別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">インターン/本選考</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(stats.jobHunt.byType).map(([name, value]) => ({
                  name: name === "本選考" ? "本選考" : "インターン",
                  value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981" strokeOpacity={0.3} />
                <XAxis stroke="#10b981" fontSize={12} />
                <YAxis stroke="#10b981" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#10b981", border: "none", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value, name) => [`${value}件`, name]}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
