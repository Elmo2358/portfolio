"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
} from "lucide-react"

interface Lesson {
  id: string
  lessonId: string
  title: string
  problemId: string
  order: number
  difficulty?: number
  url: string
  userProgress: {
    id: string
    status: string
    memo?: string
  } | null
}

interface Chapter {
  id: string
  chapterId: string
  title: string
  section: string
  order: number
  problemId: string
  description?: string
  url: string
  userProgress: {
    id: string
    status: string
    memo?: string
  } | null
  lessons: Lesson[]
  completedLessons: number
  totalLessons: number
}

interface Apg4bData {
  chapters: Chapter[]
  stats: {
    totalLessons: number
    completedLessons: number
    inProgressLessons: number
    notStartedLessons: number
    progressPercent: number
  }
}

const statusLabels: Record<string, string> = {
  not_started: "未着手",
  in_progress: "学習中",
  completed: "完了",
}

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Circle className="h-4 w-4 text-gray-400" />,
  in_progress: <PlayCircle className="h-4 w-4 text-yellow-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const sectionNames: Record<string, string> = {
  "1": "第1章",
  "2": "第2章",
  "3": "第3章",
  "4": "第4章",
  "appendix": "付録",
}

export function Apg4bLearningCard() {
  const [data, setData] = useState<Apg4bData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<{
    synced: boolean
    chapterCount: number
    lessonCount: number
  } | null>(null)

  // レッスン編集ダイアログ
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editMemo, setEditMemo] = useState("")
  const [editStatus, setEditStatus] = useState("")

  useEffect(() => {
    fetchData()
    checkSyncStatus()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/hub/atcoder/apg4b/progress")
      if (!res.ok) {
        throw new Error("Failed to fetch progress")
      }
      const result = await res.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error("Error fetching APG4b data:", err)
      setError("データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const checkSyncStatus = async () => {
    try {
      const res = await fetch("/api/hub/atcoder/apg4b/sync")
      if (res.ok) {
        const status = await res.json()
        setSyncStatus(status)
      }
    } catch (err) {
      console.error("Error checking sync status:", err)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/hub/atcoder/apg4b/sync", {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("Sync failed")
      }
      const result = await res.json()
      setSyncStatus({
        synced: true,
        chapterCount: result.totalChapters,
        lessonCount: result.totalPracticeProblems,
      })
      await fetchData()
    } catch (err) {
      console.error("Error syncing APG4b:", err)
      setError("同期に失敗しました")
    } finally {
      setSyncing(false)
    }
  }

  const updateProgress = async (id: string, status: string, memo?: string, type: "lesson" | "chapter" = "lesson") => {
    try {
      await fetch(`/api/hub/atcoder/apg4b/progress/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, memo, type }),
      })
      await fetchData()
    } catch (err) {
      console.error("Error updating progress:", err)
    }
  }

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setEditMemo(lesson.userProgress?.memo || "")
    setEditStatus(lesson.userProgress?.status || "not_started")
  }

  const handleSaveProgress = async () => {
    if (!editingLesson) return
    await updateProgress(editingLesson.id, editStatus, editMemo, "lesson")
    setEditingLesson(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダーと同期ボタン */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                APG4b 学習プラン
              </CardTitle>
              <CardDescription>
                C++入門 AtCoder Programming Guide for beginners
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  同期中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  データ同期
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 同期状態 */}
          {syncStatus && !syncStatus.synced && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                APG4bのデータが同期されていません。「データ同期」ボタンを押してください。
              </p>
            </div>
          )}

          {/* 進捗サマリー */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">全体の進捗</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {data.stats.progressPercent}%
              </span>
            </div>
            <Progress value={data.stats.progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.completedLessons} / {data.stats.totalLessons} レッスン完了
              （{data.stats.inProgressLessons} レッスン学習中）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 章ごとの表示 */}
      <div className="space-y-3">
        {data.chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            isExpanded={expandedChapter === chapter.id}
            onToggle={() =>
              setExpandedChapter(
                expandedChapter === chapter.id ? null : chapter.id
              )
            }
            onLessonClick={(lesson) => openEditDialog(lesson)}
            onStatusChange={(lessonId, status) =>
              updateProgress(lessonId, status)
            }
          />
        ))}
      </div>

      {/* レッスン編集ダイアログ */}
      {editingLesson && (
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLesson.title}</DialogTitle>
              <DialogDescription>
                {editingLesson.lessonId} - {editingLesson.url}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editStatus">ステータス</Label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="not_started">未着手</option>
                  <option value="in_progress">学習中</option>
                  <option value="completed">完了</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editMemo">メモ</Label>
                <Textarea
                  id="editMemo"
                  placeholder="学習メモ..."
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLesson(null)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveProgress}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface ChapterCardProps {
  chapter: Chapter
  isExpanded: boolean
  onToggle: () => void
  onLessonClick: (lesson: Lesson) => void
  onStatusChange: (lessonId: string, status: string) => void
}

function ChapterCard({
  chapter,
  isExpanded,
  onToggle,
  onLessonClick,
  onStatusChange,
}: ChapterCardProps) {
  return (
    <Card className={isExpanded ? "border-indigo-300 dark:border-indigo-700" : ""}>
      <CardHeader
        className="cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {sectionNames[chapter.section] || chapter.section}
            </Badge>
            <h3 className="font-semibold">{chapter.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {chapter.completedLessons}/{chapter.totalLessons}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* 説明課題へのリンク */}
          <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">説明課題</p>
                <p className="text-xs text-muted-foreground">{chapter.problemId}</p>
              </div>
              <a
                href={chapter.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  開く
                </Button>
              </a>
            </div>
          </div>

          {/* 練習問題 */}
          {chapter.lessons.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">練習問題</p>
              {chapter.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => onLessonClick(lesson)}
                  onStatusChange={(status) => onStatusChange(lesson.id, status)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">練習問題はありません</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

interface LessonRowProps {
  lesson: Lesson
  onClick: () => void
  onStatusChange: (status: string) => void
}

function LessonRow({ lesson, onClick, onStatusChange }: LessonRowProps) {
  const status = lesson.userProgress?.status || "not_started"

  return (
    <div
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {statusIcons[status]}
        <div>
          <p className="text-sm font-medium">{lesson.title}</p>
          <p className="text-xs text-muted-foreground">{lesson.lessonId}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {statusLabels[status]}
        </Badge>
        <a
          href={lesson.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  )
}
