"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { signIn, useSession } from "next-auth/react"

interface NotificationLog {
  id: string
  type: string
  title: string
  message: string
  method: string
  sentAt: Date
  status: string
}

export function SettingsClient() {
  const { data: session, status } = useSession()

  const [atCoderId, setAtCoderId] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState("")
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // Google Tasks同期の状態
  const [googleTasksEnabled, setGoogleTasksEnabled] = useState(false)
  const [googleTasklists, setGoogleTasklists] = useState<Array<{ id: string; title: string }>>([])
  const [selectedTasklist, setSelectedTasklist] = useState("")
  const [loadingGoogleTasks, setLoadingGoogleTasks] = useState(false)
  const [googleTasksSetupRequired, setGoogleTasksSetupRequired] = useState(false)

  // Google OAuth連携の状態
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleAccountId, setGoogleAccountId] = useState("")
  const [googleAuthConfigured, setGoogleAuthConfigured] = useState(false)
  const [loadingGoogleAuth, setLoadingGoogleAuth] = useState(false)

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

  // Google Tasks設定を取得
  useEffect(() => {
    const fetchGoogleTasksSettings = async () => {
      try {
        const res = await fetch("/api/hub/tasks/google-sync")
        if (!res.ok) {
          const data = await res.json()
          if (data.setupRequired) {
            setGoogleTasksSetupRequired(true)
          }
          return
        }
        const data = await res.json()

        setGoogleTasksEnabled(data.syncEnabled)
        setGoogleTasklists(data.taskLists || [])
        setSelectedTasklist(data.selectedTasklistId || "")
      } catch (error) {
        console.error("Error fetching Google Tasks settings:", error)
      }
    }
    fetchGoogleTasksSettings()
  }, [])

  // Google OAuth連携の状態を取得
  const fetchGoogleAuthStatus = async () => {
    try {
      console.log("🔵 Fetching Google auth status...")
      const res = await fetch("/api/hub/settings/google-auth")
      const data = await res.json()

      console.log("🔵 Google auth status response:", data)

      if (res.ok) {
        setGoogleConnected(data.isConnected)
        setGoogleAccountId(data.googleAccountId || "")
        setGoogleAuthConfigured(data.isConfigured)

        if (data.isConnected && !googleConnected) {
          toast.success("Google連携が完了しました！")
        }
      }
    } catch (error) {
      console.error("Error fetching Google auth status:", error)
    }
  }

  useEffect(() => {
    fetchGoogleAuthStatus()
  }, [])

  // セッションが更新されたときもステータスを再取得
  useEffect(() => {
    if (status === "authenticated") {
      console.log("🔵 Session authenticated, fetching Google auth status...")
      fetchGoogleAuthStatus()
    }
  }, [status])

  // Google連携が確立されたらタスクリストを取得
  useEffect(() => {
    const fetchTaskLists = async () => {
      if (googleConnected && !googleTasksSetupRequired) {
        try {
          const res = await fetch("/api/hub/tasks/google-sync")
          const data = await res.json()

          if (res.ok && data.taskLists) {
            setGoogleTasklists(data.taskLists)
            // タスクリストが選択されていない場合は最初のタスクリストを選択
            if (!selectedTasklist && data.taskLists.length > 0) {
              setSelectedTasklist(data.taskLists[0].id)
            }
          }
        } catch (error) {
          console.error("Error fetching task lists:", error)
        }
      }
    }
    fetchTaskLists()
  }, [googleConnected, googleTasksSetupRequired])

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

  const handleExport = async (app: string, format: string) => {
    try {
      const res = await fetch(`/api/hub/export?app=${app}&format=${format}`)

      if (!res.ok) {
        toast.error("エクスポートに失敗しました")
        return
      }

      // ファイルとしてダウンロード
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${app}_export_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`${app}のデータをエクスポートしました`)
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("エクスポートに失敗しました")
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

  const handleGoogleTasksToggle = async (enabled: boolean) => {
    setLoadingGoogleTasks(true)
    try {
      // タスクリストが選択されていない場合は、最初のタスクリストを自動選択
      let tasklistId = selectedTasklist
      if (enabled && !tasklistId && googleTasklists.length > 0) {
        tasklistId = googleTasklists[0].id
        setSelectedTasklist(tasklistId)
      }

      // タスクリストが必要な場合はエラー
      if (enabled && !tasklistId) {
        toast.error("タスクリストを選択してください")
        setLoadingGoogleTasks(false)
        return
      }

      const res = await fetch("/api/hub/tasks/google-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, tasklistId }),
      })

      const data = await res.json()

      if (res.ok) {
        setGoogleTasksEnabled(enabled)
        toast.success(data.message)
      } else {
        toast.error(data.error || "設定の保存に失敗しました")
      }
    } catch (error) {
      console.error("Error toggling Google Tasks:", error)
      toast.error("エラーが発生しました")
    } finally {
      setLoadingGoogleTasks(false)
    }
  }

  const handleSyncGoogleTasks = async () => {
    setLoadingGoogleTasks(true)
    try {
      const res = await fetch("/api/hub/tasks/google-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`同期完了！${data.created}件作成、${data.updated}件更新`)
      } else {
        toast.error(data.error || "同期に失敗しました")
      }
    } catch (error) {
      console.error("Error syncing Google Tasks:", error)
      toast.error("エラーが発生しました")
    } finally {
      setLoadingGoogleTasks(false)
    }
  }

  // Google OAuth連携のハンドラー
  const handleGoogleAuth = async () => {
    setLoadingGoogleAuth(true)
    try {
      // NextAuthのGoogleサインインを開始（設定ページに戻る）
      await signIn("google", { callbackUrl: "/hub/settings" })
    } catch (error) {
      console.error("Error initiating Google auth:", error)
      toast.error("Google連携の開始に失敗しました")
      setLoadingGoogleAuth(false)
    }
  }

  // Google OAuth連携解除のハンドラー
  const handleGoogleDisconnect = async () => {
    setLoadingGoogleAuth(true)
    try {
      const res = await fetch("/api/hub/settings/google-auth", {
        method: "DELETE",
      })

      const data = await res.json()

      if (res.ok) {
        setGoogleConnected(false)
        setGoogleAccountId("")
        setGoogleTasksEnabled(false)
        toast.success(data.message || "Google連携を解除しました")
      } else {
        toast.error(data.error || "連携解除に失敗しました")
      }
    } catch (error) {
      console.error("Error disconnecting Google auth:", error)
      toast.error("エラーが発生しました")
    } finally {
      setLoadingGoogleAuth(false)
    }
  }

  return (
    <>
      {/* AtCoder連携 */}
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

      {/* Google OAuth連携 */}
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Googleアカウント連携
          </CardTitle>
          <CardDescription className="text-sm">
            Google TasksやGoogleカレンダーと連携します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!googleAuthConfigured ? (
            <div className="p-3 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm space-y-2">
              <p>⚠️ Google OAuth設定が完了していません</p>
              <p className="text-xs">.env.localにGOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定してください</p>
              <p className="text-xs">詳しくは <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">GOOGLE_OAUTH_SETUP.md</code> を参照してください</p>
            </div>
          ) : googleConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">✓ 連携済み</p>
                  <p className="text-xs text-muted-foreground">
                    {googleAccountId ? `アカウント: ${googleAccountId}` : "Googleアカウントと連携中"}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <Button
                onClick={handleGoogleDisconnect}
                disabled={loadingGoogleAuth}
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 text-sm"
              >
                {loadingGoogleAuth ? "処理中..." : "連携を解除"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Googleアカウントと連携すると、以下の機能が使えるようになります：
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Google Tasksとのタスク同期</li>
                <li>Googleカレンダーへのイベント追加</li>
              </ul>
              <Button
                onClick={handleGoogleAuth}
                disabled={loadingGoogleAuth}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loadingGoogleAuth ? "連携中..." : "Googleアカウントで連携"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Tasks同期 */}
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Google Tasks同期
          </CardTitle>
          <CardDescription className="text-sm">
            タスクをGoogle Tasksと双方向同期します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {googleTasksSetupRequired ? (
            <div className="p-3 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm">
              Google Tasksを使用するには、Googleアカウントとの連携が必要です。
              <Button
                variant="link"
                className="p-0 h-auto text-yellow-900 dark:text-yellow-100 underline"
                asChild
              >
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                  Googleアカウント設定を開く
                </a>
              </Button>
            </div>
          ) : (
            <>
              {/* タスクリスト選択（常に表示） */}
              {googleTasklists.length > 0 && (
                <div>
                  <Label htmlFor="tasklist" className="text-sm">タスクリストを選択</Label>
                  <select
                    id="tasklist"
                    value={selectedTasklist}
                    onChange={(e) => setSelectedTasklist(e.target.value)}
                    disabled={loadingGoogleTasks}
                    className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">選択してください</option>
                    {googleTasklists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">同期を有効にする</p>
                  <p className="text-xs text-muted-foreground">
                    {googleTasksEnabled ? "Google Tasksと同期中" : "同期は無効になっています"}
                  </p>
                </div>
                <Switch
                  checked={googleTasksEnabled}
                  onCheckedChange={handleGoogleTasksToggle}
                  disabled={loadingGoogleTasks || !selectedTasklist}
                />
              </div>

              {googleTasksEnabled && (
                <Button
                  onClick={handleSyncGoogleTasks}
                  disabled={loadingGoogleTasks}
                  variant="outline"
                  className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-sm"
                >
                  {loadingGoogleTasks ? "同期中..." : "🔄 今すぐGoogle Tasksと同期"}
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                💡 同期を有効にすると、サイトのタスクがGoogle Tasksに追加され、Google Tasksの変更もサイトに反映されます。
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* データエクスポート */}
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg">データエクスポート</CardTitle>
          <CardDescription className="text-sm">
            すべてのデータをJSON/CSV形式でダウンロードできます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleExport("all", "json")}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-sm"
            >
              📦 全データ（JSON）
            </Button>
            <Button
              onClick={() => handleExport("all", "csv")}
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-sm"
            >
              📄 全データ（CSV）
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => handleExport("tasks", "json")}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-xs"
            >
              タスク
            </Button>
            <Button
              onClick={() => handleExport("jobhunt", "json")}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-xs"
            >
              就活
            </Button>
            <Button
              onClick={() => handleExport("bucket", "json")}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-xs"
            >
              バケツリスト
            </Button>
            <Button
              onClick={() => handleExport("atcoder", "json")}
              variant="outline"
              size="sm"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 text-xs"
            >
              AtCoder
            </Button>
          </div>
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
    </>
  )
}
