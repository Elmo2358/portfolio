"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings, Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface NotificationLog {
  id: string
  type: string
  title: string
  message: string
  method: string
  sentAt: Date
  status: string
}

export default function SettingsPage() {
  const [atCoderId, setAtCoderId] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState("")
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // 通知権限を確認
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // 通知ログを取得
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/cron/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.logs || [])
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoadingNotifications(false)
      }
    }
    fetchNotifications()
  }, [])

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("このブラウザは通知をサポートしていません")
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === "granted") {
      toast.success("通知を有効にしました！")
      // テスト通知を送信
      new Notification("テスト通知", {
        body: "通知が正しく動作しています",
      })
    } else {
      toast.error("通知が拒否されました")
    }
  }

  const triggerTestNotifications = async () => {
    try {
      const res = await fetch("/api/debug/trigger-notifications", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || "テスト通知を送信しました")
      } else {
        toast.error(data.error || "通知の送信に失敗しました")
      }
    } catch (error) {
      console.error("Error triggering notifications:", error)
      toast.error("エラーが発生しました")
    }
  }

  const handleSave = async () => {
    if (!atCoderId.trim()) {
      setMessage("AtCoder IDを入力してください")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // AtCoder IDを保存して同期
      const res = await fetch("/api/hub/atcoder/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atCoderId: atCoderId.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✓ AtCoder連携が完了しました！（${data.stats.submissionsCount}件の提出履歴を取得）`)
      } else {
        setMessage(data.error || "連携に失敗しました")
      }
    } catch (error) {
      console.error("Error saving AtCoder ID:", error)
      setMessage("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage("")

    try {
      // 定期同期と同じ処理を実行
      const res = await fetch("/api/debug/cron", {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        const stats = data.cronResult.stats
        setMessage(`✓ 同期が完了しました！（${stats.submissionsProcessed}件の新しい提出、${stats.problemsUpdated}件の問題を更新）`)
      } else {
        setMessage(data.error || "同期に失敗しました")
      }
    } catch (error) {
      console.error("Error syncing:", error)
      setMessage("エラーが発生しました")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              設定
            </h1>
            <p className="text-muted-foreground">Settings</p>
          </div>
        </div>

        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg">AtCoder連携</CardTitle>
            <CardDescription className="text-sm">
              提出履歴を自動取得して問題管理に反映します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="atcoderId" className="text-sm">AtCoderユーザーID</Label>
              <Input
                id="atcoderId"
                placeholder="例: elmo2358"
                value={atCoderId}
                onChange={(e) => setAtCoderId(e.target.value)}
                disabled={loading}
                className="mt-1.5 h-9"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                プロフィールURL:
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">
                  atcoder.jp/users/&lt;ID&gt;
                </code>
              </p>
            </div>
            {message && (
              <div className={`p-2 rounded text-sm ${
                message.startsWith("✓")
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {message}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm flex-1"
              >
                {loading ? "連携中..." : "AtCoderと連携"}
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500 h-9 text-sm flex-1"
              >
                {syncing ? "同期中..." : "今すぐ同期"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ブラウザ通知設定 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              ブラウザ通知
            </CardTitle>
            <CardDescription className="text-sm">
              リマインダーをブラウザ通知で受け取ります
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">通知の状態</p>
                <p className="text-xs text-muted-foreground">
                  {notificationPermission === "granted"
                    ? "通知が有効です"
                    : notificationPermission === "denied"
                    ? "通知が拒否されています"
                    : "通知が許可されていません"}
                </p>
              </div>
              <div className={`h-2 w-2 rounded-full ${
                notificationPermission === "granted"
                  ? "bg-emerald-500"
                  : notificationPermission === "denied"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`} />
            </div>
            {notificationPermission !== "granted" && (
              <Button
                onClick={requestNotificationPermission}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                通知を有効にする
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                onClick={triggerTestNotifications}
                variant="outline"
                className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
              >
                通知テスト
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 ヒント: iPhoneでホーム画面に追加すると、アプリのように通知を受け取れます
            </p>
          </CardContent>
        </Card>

        {/* 通知ログ */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知履歴
            </CardTitle>
            <CardDescription className="text-sm">
              最近の通知履歴
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingNotifications ? (
              <p className="text-sm text-muted-foreground py-4 text-center">読み込み中...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">通知履歴がありません</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded text-xs ${
                      log.status === "sent"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{log.title}</span>
                      <span className="text-[10px] opacity-75">
                        {new Date(log.sentAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap line-clamp-2">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] opacity-75">
                        方法: {log.method === "app" ? "アプリ内" : log.method === "email" ? "メール" : "両方"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5 text-sm">第3フェーズ実装中</h3>
          <div className="mb-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">第2フェーズ完了！🎉</p>
            <ul className="list-disc list-inside text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5 ml-1 mb-2">
              <li>✓ AtCoder IDの保存</li>
              <li>✓ 提出履歴の自動取得</li>
              <li>✓ AC問題の自動反映</li>
              <li>✓ 定期同期（1時間ごと）</li>
              <li>✓ ヒートマップによる学習履歴の可視化</li>
              <li>✓ ストリーク管理の強化（週1回の寛容措置）</li>
            </ul>
          </div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">第3フェーズ完了！🎉</p>
          <ul className="list-disc list-inside text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5 ml-1 mb-2">
            <li>✓ CLIST API連携（コンテストスケジュール表示）</li>
            <li>✓ リマインダー設定（通知オン・オフ）</li>
            <li>✓ Google Calendar連携（カレンダー追加ボタン）</li>
            <li>✓ 汎用リマインダー機能（タスク・就活・バケツリスト）</li>
            <li>✓ 通知送信システム（Cronジョブ + Web Push）</li>
            <li>✓ 通知タイミングのカスタマイズ（24時間前、1時間前）</li>
            <li>✓ PWA対応（ホーム画面に追加）</li>
          </ul>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">第4フェーズ（今後の実装予定）</p>
          <ul className="list-disc list-inside text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5 ml-1">
            <li>• Chrome拡張機能（サイト外通知）</li>
            <li>• メール通知</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
