"use client"

import { useState } from "react"
import { Calendar, Eye, EyeOff, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface ClistSettingsFormProps {
  initialApiKey?: string | null
  initialUsername?: string | null
  initialEnabled?: boolean
}

export function ClistSettingsForm({
  initialApiKey,
  initialUsername,
  initialEnabled = false,
}: ClistSettingsFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [username, setUsername] = useState("")
  const [enabled, setEnabled] = useState(initialEnabled)
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasKey, setHasKey] = useState(!!initialApiKey)
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(initialApiKey || null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(initialUsername || null)

  // スイッチ変更時に即座に設定を保存
  const handleToggleEnabled = async (newEnabled: boolean) => {
    const keyToUse = currentApiKey || apiKey.trim()
    const usernameToUse = currentUsername || username.trim()

    if (!keyToUse || !usernameToUse) {
      toast.error("APIキーとユーザー名が設定されていません")
      return
    }

    setEnabled(newEnabled)
    setIsLoading(true)

    try {
      const res = await fetch("/api/hub/settings/clist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: keyToUse,
          username: usernameToUse,
          enabled: newEnabled,
        }),
      })

      if (res.ok) {
        toast.success(newEnabled ? "CLIST APIを有効にしました" : "CLIST APIを無効にしました")
      } else {
        const data = await res.json()
        toast.error(data.error || "設定の更新に失敗しました")
        setEnabled(!newEnabled) // 失敗時に元に戻す
      }
    } catch (error) {
      toast.error("設定の更新に失敗しました")
      setEnabled(!newEnabled) // 失敗時に元に戻す
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const newApiKey = apiKey.trim() || currentApiKey || ""
      const newUsername = username.trim() || currentUsername || ""

      if (!newApiKey) {
        toast.error("APIキーを入力してください")
        setIsLoading(false)
        return
      }

      if (!newUsername) {
        toast.error("ユーザー名を入力してください")
        setIsLoading(false)
        return
      }

      const res = await fetch("/api/hub/settings/clist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: newApiKey,
          username: newUsername,
          enabled: enabled,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("CLIST API設定を保存しました")
        if (apiKey.trim() && newApiKey) {
          setHasKey(true)
          setApiKey("")
          setUsername("")
          setCurrentApiKey(newApiKey)
          setCurrentUsername(newUsername)
        }
      } else {
        toast.error(data.error || "設定の保存に失敗しました")
      }
    } catch (error) {
      toast.error("設定の保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("CLIST APIキーを削除します。よろしいですか？")) {
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/hub/settings/clist", {
        method: "DELETE",
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("CLIST APIキーを削除しました")
        setHasKey(false)
        setEnabled(false)
        setApiKey("")
        setCurrentApiKey(null)
      } else {
        toast.error(data.error || "削除に失敗しました")
      }
    } catch (error) {
      toast.error("削除に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            CLIST API 連携
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AtCoderコンテスト情報の取得
          </p>
        </div>
      </div>

      {hasKey ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                APIキーが設定されています
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                コンテスト情報の取得が有効です
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggleEnabled} disabled={isLoading} />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="text-gray-600"
            >
              {showKey ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showKey ? "非表示" : "表示"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </div>

          {showKey && currentApiKey && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {currentApiKey.slice(0, 8)}...{currentApiKey.slice(-4)}
              </code>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clistUsername">CLIST ユーザー名</Label>
            <Input
              id="clistUsername"
              name="username"
              type="text"
              placeholder="CLISTのユーザー名を入力..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500">
              CLISTサイトに登録しているユーザー名を入力してください
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clistApiKey">CLIST API Key</Label>
            <div className="flex gap-2">
              <Input
                id="clistApiKey"
                name="apiKey"
                type={showKey ? "text" : "password"}
                placeholder="CLIST APIキーを入力..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 font-mono text-sm"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
                className="px-3"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              APIキーは
              <a
                href="https://clist.by/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mx-1"
              >
                CLIST
              </a>
              から取得できます（アカウント登録が必要）
            </p>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              APIキーは暗号化して保存されます。AtCoderの今後のコンテスト情報を取得して、学習プランに反映できます。
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "保存中..." : "保存して有効化"}
          </Button>
        </form>
      )}
    </Card>
  )
}
