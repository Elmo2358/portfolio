"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle2, Clock, AlertCircle, Trash2, Edit2, Calendar, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ReminderButton } from "@/components/hub/reminder-button"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "completed" | string
  priority: "low" | "medium" | "high" | string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  notionUrl: string | null
}

type StatusFilter = "all" | "todo" | "in_progress" | "completed"
type PriorityFilter = "all" | "low" | "medium" | "high"

interface TasksClientProps {
  initialTasks: Task[]
}

export function TasksClient({ initialTasks }: TasksClientProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [error, setError] = useState<string | null>(null)

  // フィルタリング
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false
    return true
  })

  // 完了タスクを最後にソート
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1
    if (a.status !== "completed" && b.status === "completed") return -1
    return 0
  })

  // データを再取得
  const refreshTasks = async () => {
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.append("status", statusFilter)
    if (priorityFilter !== "all") params.append("priority", priorityFilter)

    const res = await fetch(`/api/hub/tasks?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setTasks(data)
    }
  }

  // タスク作成・更新
  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      setError(null)

      const url = editingTask
        ? `/api/hub/tasks/${editingTask.id}`
        : "/api/hub/tasks"

      const method = editingTask ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      })

      const responseData = await res.json()

      if (!res.ok) {
        setError(responseData.error || "Failed to save task")
        return
      }

      setShowForm(false)
      setEditingTask(null)
      await refreshTasks()
    } catch (error) {
      console.error("Error saving task:", error)
      setError(error instanceof Error ? error.message : "Failed to save task")
    }
  }

  // タスク削除
  const handleDeleteTask = async (id: string) => {
    if (!confirm("このタスクを削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/tasks/${id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete task")

      await refreshTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  // ステータス変更
  const handleStatusChange = async (task: Task, newStatus: Task["status"]) => {
    try {
      const completedAt = newStatus === "completed" ? new Date() : null

      const res = await fetch(`/api/hub/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, completedAt })
      })

      if (!res.ok) throw new Error("Failed to update task status")

      await refreshTasks()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  // ステータス表示
  const getStatusBadge = (status: Task["status"]) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      todo: { label: "未着手", color: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200" },
      in_progress: { label: "進行中", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200" },
      completed: { label: "完了", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200" }
    }
    const config = statusConfig[status] || statusConfig.todo
    return <Badge className={config.color}>{config.label}</Badge>
  }

  // 優先度表示
  const getPriorityBadge = (priority: Task["priority"]) => {
    const priorityConfig: Record<string, { label: string; color: string }> = {
      low: { label: "低", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" },
      medium: { label: "中", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200" },
      high: { label: "高", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" }
    }
    const config = priorityConfig[priority] || priorityConfig.medium
    return <Badge className={config.color}>{config.label}</Badge>
  }

  // 期限日の表示
  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === "completed") return false
    const dueDateTime = new Date(task.dueDate)
    // 時間が00:00:00の場合、日付のみとみなして終了日の23:59までとする
    const hours = dueDateTime.getHours()
    const minutes = dueDateTime.getMinutes()
    const seconds = dueDateTime.getSeconds()
    if (hours === 0 && minutes === 0 && seconds === 0) {
      dueDateTime.setHours(23, 59, 59, 999)
    }
    return dueDateTime < new Date()
  }

  // 日時のフォーマット（時間がある場合は日時を表示）
  const formatDateTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    // 時間が00:00:00の場合は日付のみ表示
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return format(date, "yyyy/MM/dd", { locale: ja })
    }
    return format(date, "yyyy/MM/dd HH:mm", { locale: ja })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーとフィルター */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">タスク管理</h2>
          <p className="text-sm text-muted-foreground">
            全{tasks.length}件のタスク
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null)
            setShowForm(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 h-10 px-4 sm:px-6"
        >
          <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
          <span className="text-sm sm:text-base">新規タスク</span>
        </Button>
      </div>

      {/* フィルター */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-sm underline"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <div className="flex gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 p-1.5 dark:bg-emerald-950 dark:border-emerald-600 overflow-x-auto">
          {(["all", "todo", "in_progress", "completed"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center justify-center ${
                statusFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : filter === "todo" ? "未着手" : filter === "in_progress" ? "進行中" : "完了"}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 p-1.5 dark:bg-emerald-950 dark:border-emerald-600 overflow-x-auto">
          {(["all", "high", "medium", "low"] as PriorityFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setPriorityFilter(filter)}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center justify-center ${
                priorityFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : filter === "high" ? "高" : filter === "medium" ? "中" : "低"}
            </button>
          ))}
        </div>
      </div>

      {/* タスク一覧 */}
      {sortedTasks.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">タスクがありません</p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mt-4 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
            >
              最初のタスクを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTasks.map((task) => (
            <Card
              key={task.id}
              className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 ${
                task.status === "completed"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 opacity-60"
                  : isOverdue(task)
                  ? "border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600"
                  : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  {/* ステータス変更ボタン */}
                  <div className="flex gap-1.5 sm:gap-1 shrink-0">
                    <button
                      onClick={() => handleStatusChange(task, "todo")}
                      className={`p-2 sm:p-2 rounded-lg transition-colors flex items-center justify-center ${
                        task.status === "todo"
                          ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="未着手"
                      aria-label="未着手"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(task, "in_progress")}
                      className={`p-2 sm:p-2 rounded-lg transition-colors flex items-center justify-center ${
                        task.status === "in_progress"
                          ? "bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="進行中"
                      aria-label="進行中"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(task, "completed")}
                      className={`p-2 sm:p-2 rounded-lg transition-colors flex items-center justify-center ${
                        task.status === "completed"
                          ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="完了"
                      aria-label="完了"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* タスク内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                      <h3 className={`font-semibold text-sm sm:text-base leading-tight ${task.status === "completed" ? "line-through" : ""}`}>
                        <span className="line-clamp-2">{task.title}</span>
                      </h3>
                      <div className="flex gap-1 sm:shrink-0">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue(task) ? "text-red-600 dark:text-red-400" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(new Date(task.dueDate))}
                          {isOverdue(task) && " (期限超過)"}
                        </div>
                      )}
                      {task.notionUrl && (
                        <a
                          href={task.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Notion
                        </a>
                      )}
                      <div>
                        作成: {format(new Date(task.createdAt), "yyyy/MM/dd", { locale: ja })}
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2 sm:flex-col sm:gap-1.5 shrink-0">
                    <ReminderButton
                      entityType="task"
                      entityId={task.id}
                      title={task.title}
                      description={task.description || undefined}
                      defaultRemindAt={task.dueDate ? new Date(task.dueDate) : undefined}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTask(task)
                        setShowForm(true)
                      }}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500 h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500 h-9 w-9 sm:w-auto sm:px-3 flex items-center justify-center p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* タスクフォームモーダル */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setShowForm(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}

// タスクフォームコンポーネント
function TaskForm({
  task,
  onSave,
  onClose
}: {
  task: Task | null
  onSave: (data: Partial<Task>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [status, setStatus] = useState<"todo" | "in_progress" | "completed">(
    (task?.status === "todo" || task?.status === "in_progress" || task?.status === "completed")
      ? task.status
      : "todo"
  )
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    (task?.priority === "low" || task?.priority === "medium" || task?.priority === "high")
      ? task.priority
      : "medium"
  )
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""
  )
  const [dueTime, setDueTime] = useState(
    task?.dueDate ? format(new Date(task.dueDate), "HH:mm") : ""
  )
  const [notionUrl, setNotionUrl] = useState(task?.notionUrl || "")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartTime, setDragStartTime] = useState("")

  // 時間を増減する関数（分単位で調整）
  const adjustTime = (current: string, deltaMinutes: number) => {
    if (!current) return current
    const [hours, minutes] = current.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes + deltaMinutes, 0, 0)
    return format(date, "HH:mm")
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragStartTime(dueTime)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!isDragging) return

    const deltaY = dragStartY - e.clientY // 上に動かすとプラス（時間増）、下に動かすとマイナス
    const minutesPerPx = 0.5 // 1pxあたり0.5分（感度調整）
    const deltaMinutes = Math.round(deltaY * minutesPerPx)

    if (deltaMinutes !== 0) {
      setDueTime((prev) => adjustTime(dragStartTime, deltaMinutes))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 日付と時間を結合
    const combinedDueDate = dueDate && dueTime
      ? new Date(`${dueDate}T${dueTime}`).toISOString()
      : dueDate
        ? new Date(dueDate).toISOString()
        : null

    onSave({
      title,
      description,
      status,
      priority,
      dueDate: combinedDueDate,
      notionUrl: notionUrl || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 sm:max-h-auto">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {task ? "タスク編集" : "新規タスク"}
          </h3>
          <p className="text-sm text-muted-foreground">タスクの情報を入力してください</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm resize-y"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "todo" | "in_progress" | "completed")}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="todo">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">期限日</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
              />
            </div>

            {dueDate && (
              <div>
                <label className="mb-2 block text-sm font-medium">期限時刻（任意）</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm cursor-ns-resize ${
                    isDragging ? "cursor-grabbing" : ""
                  }`}
                  style={{ cursor: isDragging ? "ns-resize" : "ns-resize" }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  左クリックドラッグで時間調整（上下に動かす）
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">Notion URL（任意）</label>
              <input
                type="url"
                placeholder="https://www.notion.so/..."
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                関連するNotionページのURLを入力してください
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 h-10"
              >
                {task ? "更新" : "作成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500 h-10 px-6"
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
