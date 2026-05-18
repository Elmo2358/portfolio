"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Sparkles, MapPin, Calendar, Trash2, Edit2, CheckCircle2, Clock, Target, Flame, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ReminderButton } from "@/components/hub/reminder-button"

interface BucketListItem {
  id: string
  title: string
  category: "travel" | "experience" | "goal" | "other" | string
  description: string | null
  status: "planning" | "in_progress" | "completed" | string
  targetDate: string | null
  completedAt: string | null
  priority: number
  createdAt: string
  notionUrl: string | null
}

interface BucketStats {
  total: number
  completed: number
  inProgress: number
  planning: number
  categoryCounts: Record<string, number>
  completionRate: number
  priorityCounts: Record<number, number>
  recentCompleted: BucketListItem[]
}

type StatusFilter = "all" | "planning" | "in_progress" | "completed"
type CategoryFilter = "all" | "travel" | "experience" | "goal" | "other"

interface BucketClientProps {
  initialItems: BucketListItem[]
  initialStats: BucketStats
}

export function BucketClient({ initialItems, initialStats }: BucketClientProps) {
  const [items, setItems] = useState<BucketListItem[]>(initialItems)
  const [stats, setStats] = useState<BucketStats>(initialStats)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

  // データ再取得
  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const itemsRes = await fetch(`/api/hub/bucket/items?${params.toString()}`)
      if (itemsRes.ok) setItems(await itemsRes.json())

      const statsRes = await fetch("/api/hub/bucket/stats")
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (error) {
      console.error("Error fetching bucket list data:", error)
    }
  }

  // フィルタリング
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false
    return true
  })

  // アイテム削除
  const handleDelete = async (id: string) => {
    if (!confirm("この項目を削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/bucket/items/${id}`, {
        method: "DELETE"
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  // ステータス変更
  const handleStatusChange = async (item: BucketListItem, newStatus: string) => {
    try {
      const res = await fetch(`/api/hub/bucket/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error updating item status:", error)
    }
  }

  // カテゴリ情報
  const categoryInfo = {
    travel: { label: "旅行", icon: MapPin, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
    experience: { label: "体験", icon: Sparkles, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" },
    goal: { label: "目標", icon: Target, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200" },
    other: { label: "その他", icon: Sparkles, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" }
  }

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      planning: { label: "計画中", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200", icon: Clock },
      in_progress: { label: "進行中", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200", icon: Flame },
      completed: { label: "達成", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200", icon: CheckCircle2 }
    }
    const config = statusConfig[status] || statusConfig.planning
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // 優先度表示
  const getPriorityStars = (priority: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Flame
            key={i}
            className={`h-4 w-4 ${
              i < priority
                ? "text-orange-500 fill-orange-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘーダーと統計 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">やりたいことリスト</h2>
          <p className="text-sm text-muted-foreground">
            夢中や実現したいことを管理
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          追加
        </Button>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  総数
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.total}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  達成
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.completed}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                達成率: {stats.completionRate}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  進行中
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.inProgress}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  達成ギャラリー
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.recentCompleted.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                最近の達成
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <div className="flex flex-wrap gap-4">
        {/* ステータスフィルター */}
        <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
          {(["all", "planning", "in_progress", "completed"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                statusFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : filter === "planning" ? "計画中" : filter === "in_progress" ? "進行中" : "達成"}
            </button>
          ))}
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
          {(["all", "travel", "experience", "goal", "other"] as CategoryFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                categoryFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : categoryInfo[filter].label}
            </button>
          ))}
        </div>
      </div>

      {/* 項目一覧 */}
      {filteredItems.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">項目がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const catInfo = categoryInfo[item.category as keyof typeof categoryInfo] || categoryInfo.other
            const Icon = catInfo.icon
            return (
              <Card
                key={item.id}
                className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 ${
                  item.status === "completed"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 opacity-75"
                    : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${catInfo.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold flex-1">{item.title}</h3>
                        {getStatusBadge(item.status)}
                      </div>

                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {item.targetDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            目標: {format(new Date(item.targetDate), "yyyy/MM/dd", { locale: ja })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          {getPriorityStars(item.priority)}
                        </div>
                      </div>

                      {item.completedAt && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                          達成日: {format(new Date(item.completedAt), "yyyy/MM/dd", { locale: ja })}
                        </p>
                      )}

                      {item.notionUrl && (
                        <a
                          href={item.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Notionページを開く
                        </a>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <ReminderButton
                        entityType="bucket_list_item"
                        entityId={item.id}
                        title={item.title}
                        description={item.description || undefined}
                        defaultRemindAt={item.targetDate ? new Date(item.targetDate) : undefined}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // ステータス変更：達成以外→達成、達成→進行中→計画中
                          const statusCycle: Record<string, string> = {
                            planning: "in_progress",
                            in_progress: "completed",
                            completed: "planning"
                          }
                          handleStatusChange(item, statusCycle[item.status] || "in_progress")
                        }}
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                      >
                        {item.status === "completed" ? "未完了" : "進める"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingItem(item)
                          setShowForm(true)
                        }}
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 達成ギャラリー */}
      {stats && stats.recentCompleted.length > 0 && (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">達成ギャラリー</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              最近達成した項目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {stats.recentCompleted.map((item) => {
                const catInfo = categoryInfo[item.category as keyof typeof categoryInfo] || categoryInfo.other
                const Icon = catInfo.icon
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800"
                  >
                    <div className={`p-2 rounded-lg ${catInfo.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                        {item.title}
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {item.completedAt && format(new Date(item.completedAt), "yyyy/MM/dd", { locale: ja })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* フォームモーダル */}
      {showForm && (
        <BucketListForm
          item={editingItem}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// バケツリストフォーム
function BucketListForm({
  item,
  onClose
}: {
  item: BucketListItem | null
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    title: item?.title || "",
    category: item?.category || "goal",
    description: item?.description || "",
    status: item?.status || "planning",
    targetDate: item?.targetDate ? new Date(item.targetDate).toISOString().split('T')[0] : "",
    priority: item?.priority?.toString() || "3",
    notionUrl: item?.notionUrl || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = item ? `/api/hub/bucket/items/${item.id}` : "/api/hub/bucket/items"
    const method = item ? "PUT" : "POST"

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority)
        })
      })

      if (res.ok) {
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("Error saving item:", error)
      alert("保存に失敗しました")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            {item ? "項目を編集" : "項目を追加"}
          </CardTitle>
          <CardDescription>やりたいことを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">タイトル *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">カテゴリ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="travel">旅行</option>
                <option value="experience">体験</option>
                <option value="goal">目標</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">ステータス</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="planning">計画中</option>
                <option value="in_progress">進行中</option>
                <option value="completed">達成</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">優先度（1-5）</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="5">5 - 最高</option>
                <option value="4">4 - 高</option>
                <option value="3">3 - 中</option>
                <option value="2">2 - 低</option>
                <option value="1">1 - 最低</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">目標期限</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="詳細やメモなど"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Notion URL</label>
              <input
                type="url"
                value={formData.notionUrl}
                onChange={(e) => setFormData({ ...formData, notionUrl: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://www.notion.so/..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {item ? "更新" : "追加"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
