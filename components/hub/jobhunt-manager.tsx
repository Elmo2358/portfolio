"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Briefcase, Trophy, XCircle, Calendar, Trash2, Edit2, TrendingUp, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ReminderButton } from "@/components/hub/reminder-button"

interface JobApplication {
  id: string
  type: "本選考" | "インターン"
  company: string
  position: string | null
  status: "ES提出" | "テスト面接" | "最終面接" | "内定" | "落選"
  appliedDate: Date
  notes: string | null
  notionUrl: string | null
}

interface JobHuntStats {
  total: number
  statusCounts: Record<string, number>
  typeCounts: Record<string, number>
  offerRate: number
  offers: number
  recentActivity: JobApplication[]
}

type StatusFilter = "all" | "ES提出" | "テスト面接" | "最終面接" | "内定" | "落選"
type TypeFilter = "all" | "本選考" | "インターン"

export function JobHuntManager() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [stats, setStats] = useState<JobHuntStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true)

      // 統計取得
      const statsRes = await fetch("/api/hub/jobhunt/stats")
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // 企業一覧取得
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)

      const appsRes = await fetch(`/api/hub/jobhunt/applications?${params.toString()}`)
      if (appsRes.ok) {
        setApplications(await appsRes.json())
      }
    } catch (error) {
      console.error("Error fetching job hunt data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, typeFilter])

  // 企業追加・更新
  const handleSaveApplication = async (applicationData: Partial<JobApplication>) => {
    try {
      const url = editingApplication
        ? `/api/hub/jobhunt/applications/${editingApplication.id}`
        : "/api/hub/jobhunt/applications"

      const method = editingApplication ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData)
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "保存に失敗しました")
        return
      }

      setShowForm(false)
      setEditingApplication(null)
      fetchData()
    } catch (error) {
      console.error("Error saving application:", error)
      alert("保存に失敗しました")
    }
  }

  // 企業削除
  const handleDeleteApplication = async (id: string) => {
    if (!confirm("この企業を削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/jobhunt/applications/${id}`, {
        method: "DELETE"
      })

      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error deleting application:", error)
    }
  }

  // ステータスバッジ
  const getStatusBadge = (status: JobApplication["status"]) => {
    const statusConfig = {
      "ES提出": { label: "ES提出", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200", icon: Briefcase },
      "テスト面接": { label: "テスト面接", color: "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200", icon: Briefcase },
      "最終面接": { label: "最終面接", color: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200", icon: Briefcase },
      "内定": { label: "内定", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200", icon: Trophy },
      "落選": { label: "落選", color: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200", icon: XCircle }
    }
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーと統計 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">就活管理</h2>
          <p className="text-sm text-muted-foreground">
            企業と選考状況を管理
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingApplication(null)
            setShowForm(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          企業を追加
        </Button>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  本選考
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.typeCounts?.["本選考"] || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  インターン
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.typeCounts?.["インターン"] || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  内定数
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.offers}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  内定率
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.offerRate}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        {/* タイプフィルター */}
        <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
          {(["all", "本選考", "インターン"] as TypeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                typeFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : filter}
            </button>
          ))}
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
          {(["all", "ES提出", "テスト面接", "最終面接", "内定", "落選"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                statusFilter === filter
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
              }`}
            >
              {filter === "all" ? "すべて" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* 企業一覧 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">応募企業がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <Card
              key={application.id}
              className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 ${
                application.status === "内定"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
                  : application.status === "落選"
                  ? "border-gray-500 bg-gray-50 dark:bg-gray-950 dark:border-gray-600"
                  : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xl font-semibold">{application.company}</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                        {application.type}
                      </Badge>
                      {getStatusBadge(application.status)}
                    </div>

                    {application.position && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                        {application.position}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      申請日: {format(new Date(application.appliedDate), "yyyy/MM/dd", { locale: ja })}
                    </div>

                    {application.notes && (
                      <p className="mt-2 text-sm text-muted-foreground border-l-2 border-emerald-500 pl-2">
                        {application.notes}
                      </p>
                    )}

                    {application.notionUrl && (
                      <a
                        href={application.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Notionページを開く
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <ReminderButton
                      entityType="job_application"
                      entityId={application.id}
                      title={`${application.company} - ${application.type}`}
                      description={application.notes || undefined}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingApplication(application)
                        setShowForm(true)
                      }}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteApplication(application.id)}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
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

      {/* 企業フォームモーダル */}
      {showForm && (
        <ApplicationForm
          application={editingApplication}
          onSave={handleSaveApplication}
          onClose={() => {
            setShowForm(false)
            setEditingApplication(null)
          }}
        />
      )}
    </div>
  )
}

// 企業フォーム
function ApplicationForm({
  application,
  onSave,
  onClose
}: {
  application: JobApplication | null
  onSave: (data: Partial<JobApplication>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    type: application?.type || "本選考",
    company: application?.company || "",
    position: application?.position || "",
    status: application?.status || "ES提出",
    appliedDate: application
      ? new Date(application.appliedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: application?.notes || "",
    notionUrl: application?.notionUrl || ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      appliedDate: new Date(formData.appliedDate)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            {application ? "企業情報を編集" : "企業を追加"}
          </CardTitle>
          <CardDescription>応募した企業の情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">種類</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="本選考">本選考</option>
                <option value="インターン">インターン</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">企業名 *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">職種</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="例: システムエンジニア"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">選考ステータス *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ES提出">ES提出</option>
                <option value="テスト面接">テスト面接</option>
                <option value="最終面接">最終面接</option>
                <option value="内定">内定</option>
                <option value="落選">落選</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">申請日</label>
              <input
                type="date"
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">メモ</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="選考のメモや次のステップなど"
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
                {application ? "更新" : "追加"}
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
