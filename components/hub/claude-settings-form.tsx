"use client"

import { useState } from "react"
import { Key, Eye, EyeOff, Check, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { saveClaudeSettings, clearClaudeSettings } from "@/app/hub/settings/claude-actions"
import { toast } from "sonner"

interface ClaudeSettingsFormProps {
  initialApiKey?: string | null
  initialEnabled?: boolean
}

export function ClaudeSettingsForm({
  initialApiKey,
  initialEnabled = false,
}: ClaudeSettingsFormProps) {
  const [apiKey, setApiKey] = useState("")
  const [enabled, setEnabled] = useState(initialEnabled)
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasKey, setHasKey] = useState(!!initialApiKey)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)

    // APIキーが入力されている場合はその値を、空の場合は既存のキーを保持
    if (apiKey.trim()) {
      formData.set("apiKey", apiKey.trim())
    } else if (hasKey && !formData.get("apiKey")) {
      // 既存のキーがある場合は保持
      formData.set("apiKey", initialApiKey || "")
    }

    const result = await saveClaudeSettings(formData)

    setIsLoading(false)

    if (result.success) {
      toast.success("z.ai API設定を保存しました")
      if (apiKey.trim()) {
        setHasKey(true)
        setApiKey("")
      }
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  const handleClear = async () => {
    if (!confirm("z.ai APIキーを削除します。よろしいですか？")) {
      return
    }

    setIsLoading(true)
    const result = await clearClaudeSettings()

    setIsLoading(false)

    if (result.success) {
      toast.success("z.ai APIキーを削除しました")
      setHasKey(false)
      setEnabled(false)
      setApiKey("")
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
          <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            z.ai API 連携
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AtCoder学習サポートAI機能（GLM-4.7）
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
                AI機能が有効です
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
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

          {showKey && initialApiKey && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {initialApiKey.slice(0, 8)}...{initialApiKey.slice(-4)}
              </code>
            </div>
          )}

          <div className="pt-2">
            <form action={handleSubmit}>
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? "保存中..." : enabled ? "有効" : "無効"}にする
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="enabled" value="true" />

          <div className="space-y-2">
            <Label htmlFor="apiKey">z.ai API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                name="apiKey"
                type={showKey ? "text" : "password"}
                placeholder="z.ai APIキーを入力..."
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
                href="https://z.ai/manage-apikey/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline mx-1"
              >
                z.ai管理画面
              </a>
              から取得できます
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              APIキーは暗号化して保存されます。ご自身のAPIキーを使用するため、利用量は自分のz.aiアカウントで管理できます。
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "保存中..." : "保存して有効化"}
          </Button>
        </form>
      )}
    </Card>
  )
}
