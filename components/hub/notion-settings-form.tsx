"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BookOpen } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  saveNotionSettings,
  toggleNotionWiki,
  disconnectNotion,
  type NotionSettings,
} from "@/app/hub/settings/notion-actions"

export function NotionSettingsForm({ initialSettings }: { initialSettings: NotionSettings | { error: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [accessToken, setAccessToken] = useState("")
  const [databaseId, setDatabaseId] = useState("")

  // エラーがある場合はデフォルト値を使用
  const settings = "error" in initialSettings
    ? { isConnected: false, wikiEnabled: false, wikiDatabaseId: "" }
    : initialSettings

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("🔵 Form submitted - accessToken:", accessToken?.substring(0, 10) + "...", "databaseId:", databaseId)

    startTransition(async () => {
      const formData = new FormData()
      formData.set("accessToken", accessToken)
      formData.set("databaseId", databaseId)

      console.log("🔵 Calling saveNotionSettings...")
      const result = await saveNotionSettings(formData)
      console.log("🔵 Result:", result)

      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(result.message || "Notion Wiki連携が完了しました！")
        setAccessToken("")
        setDatabaseId("")
        // ページをリロードして設定を再取得
        router.refresh()
      }
    })
  }

  const handleToggle = (enabled: boolean) => {
    startTransition(async () => {
      const result = await toggleNotionWiki(enabled)

      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(result.message || "Wiki設定を更新しました")
        router.refresh()
      }
    })
  }

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectNotion()

      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(result.message || "Notion連携を解除しました")
        router.refresh()
      }
    })
  }

  if (!settings.isConnected) {
    return (
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Notion Wiki連携
          </CardTitle>
          <CardDescription className="text-sm">
            Wiki/Docs用のNotionデータベースと連携します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="notionWikiToken" className="text-sm">Notion APIトークン</Label>
              <Input
                id="notionWikiToken"
                type="password"
                placeholder="ntn_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isPending}
                className="mt-1.5 h-9 font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Notionのインテグレーション設定
                </a>
                からトークンを取得できます
              </p>
            </div>
            <div>
              <Label htmlFor="notionWikiDatabaseId" className="text-sm">WikiデータベースID</Label>
              <Input
                id="notionWikiDatabaseId"
                type="text"
                placeholder="35bc997c0c6080dabb4ee6b04226498e"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                disabled={isPending}
                className="mt-1.5 h-9 font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                データベースURLの一部を入力してください（ハイフンを含む32文字のID）
              </p>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
            >
              {isPending ? "連携中..." : "Notion Wikiと連携"}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-700 dark:text-emerald-300 text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Notion Wiki連携
        </CardTitle>
        <CardDescription className="text-sm">
          Wiki/Docs用のNotionデータベースと連携します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">✓ 連携済み</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">Wikiを有効にする</p>
            <p className="text-xs text-muted-foreground">
              {settings.wikiEnabled ? "/wikiでNotionページを表示" : "Wikiは無効になっています"}
            </p>
          </div>
          <Switch
            checked={settings.wikiEnabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>

        <Button
          onClick={handleDisconnect}
          disabled={isPending}
          variant="outline"
          className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 text-sm"
        >
          {isPending ? "処理中..." : "連携を解除"}
        </Button>

        <p className="text-xs text-muted-foreground">
          💡 /wikiページでNotionデータベースのページ一覧を表示できます
        </p>
      </CardContent>
    </Card>
  )
}
