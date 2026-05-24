"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Clock, Coffee } from "lucide-react"
import { toast } from "sonner"

type TimerState = "idle" | "running" | "paused" | "completed"

interface TimerSessionData {
  title: string
  durationMinutes: number
  actualDurationSeconds: number
  category: string
}

const PRESETS = [
  { label: "25分", minutes: 25, category: "focus", description: "集中タイマー" },
  { label: "5分", minutes: 5, category: "break", description: "休憩タイマー" },
  { label: "1時間", minutes: 60, category: "focus", description: "長時間学習" },
  { label: "45分", minutes: 45, category: "focus", description: "講義時間" },
  { label: "90分", minutes: 90, category: "focus", description: "授業・試験勉強" },
]

export function TimerComponent() {
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [state, setState] = useState<TimerState>("idle")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<"focus" | "break" | "custom">("focus")

  // タイマーの進行
  useEffect(() => {
    if (state !== "running") return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState("completed")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state])

  // 完了時の処理
  useEffect(() => {
    if (state === "completed") {
      handleComplete()
    }
  }, [state])

  const handleComplete = async () => {
    // 通知許可をリクエスト
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("タイマー完了", {
        body: title ? `${title}が完了しました！` : "タイマーが完了しました！",
        icon: "/favicon.ico"
      })
    }

    // セッションを保存（実際の経過時間を記録）
    const actualDurationSeconds = durationMinutes * 60 - timeLeft
    await saveSession({
      title: title || "タイマーセッション",
      durationMinutes,
      actualDurationSeconds,
      category
    })

    // 親コンポーネントに通知して履歴を更新
    window.dispatchEvent(new CustomEvent("timer-session-created"))

    toast.success("タイマーが完了しました！")

    // リセット
    setState("idle")
    setTimeLeft(durationMinutes * 60)
  }

  const saveSession = async (data: TimerSessionData) => {
    try {
      const response = await fetch("/api/hub/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error("保存に失敗しました")
    } catch (error) {
      console.error("Failed to save session:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = async () => {
    if (state === "idle" || state === "paused") {
      // 通知許可をリクエスト
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission()
      }
      setState("running")
    }
  }

  const handlePause = () => {
    setState("paused")
  }

  const handleReset = () => {
    setState("idle")
    setTimeLeft(durationMinutes * 60)
  }

  const handlePresetClick = (minutes: number, newCategory: "focus" | "break" | "custom") => {
    setDurationMinutes(minutes)
    setTimeLeft(minutes * 60)
    setCategory(newCategory)
    setState("idle")

    if (newCategory === "break") {
      setTitle("休憩")
    } else {
      setTitle("")
    }
  }

  const handleCustomMinutesChange = (value: string) => {
    const mins = parseInt(value) || 0
    if (mins >= 0 && mins <= 999) {
      setDurationMinutes(mins)
      if (state === "idle") {
        setTimeLeft(mins * 60)
      }
    }
  }

  const progress = durationMinutes > 0 ? ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100 : 0

  return (
    <div className="space-y-6">
      {/* メインタイマーカード */}
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">
                タイマー
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                {state === "running" ? "計測中..." : state === "paused" ? "一時停止中" : "準備完了"}
              </CardDescription>
            </div>
            <div className={`p-3 rounded-lg ${category === "break" ? "bg-orange-500" : "bg-emerald-600"}`}>
              {category === "break" ? (
                <Coffee className="h-6 w-6 text-white" />
              ) : (
                <Clock className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* タイマー表示 */}
          <div className="mb-8">
            <div className="relative mb-4">
              <div className="h-4 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="text-7xl font-bold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                {durationMinutes}分設定
              </div>
            </div>
          </div>

          {/* タイトル入力（実行中は非表示） */}
          {state === "idle" && (
            <div className="mb-6">
              <Label htmlFor="title" className="text-emerald-700 dark:text-emerald-300">
                セッション名（任意）
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: AtCoder、資格勉強、論文読解..."
                className="mt-2 border-emerald-500 bg-white dark:bg-emerald-900 dark:border-emerald-600"
              />
            </div>
          )}

          {/* 制御ボタン */}
          <div className="flex justify-center gap-4">
            {state === "running" ? (
              <Button
                onClick={handlePause}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8"
              >
                <Pause className="mr-2 h-5 w-5" />
                一時停止
              </Button>
            ) : state === "paused" ? (
              <>
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                >
                  <Play className="mr-2 h-5 w-5" />
                  再開
                </Button>
                <Button
                  onClick={handleReset}
                  size="lg"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  リセット
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                  disabled={timeLeft === 0}
                >
                  <Play className="mr-2 h-5 w-5" />
                  スタート
                </Button>
                <Button
                  onClick={handleReset}
                  size="lg"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  リセット
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* プリセット・カスタム設定 */}
      <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            時間設定
          </CardTitle>
          <CardDescription className="text-emerald-600 dark:text-emerald-400">
            プリセットを選択するか、カスタム時間を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* プリセットボタン */}
          <div className="mb-6">
            <Label className="text-emerald-700 dark:text-emerald-300 mb-3 block">プリセット</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.minutes, preset.category as "focus" | "break" | "custom")}
                  variant={durationMinutes === preset.minutes && category === preset.category ? "default" : "outline"}
                  className={`
                    ${durationMinutes === preset.minutes && category === preset.category
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                    }
                    ${state !== "idle" ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  disabled={state !== "idle"}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              {PRESETS.find(p => p.minutes === durationMinutes && p.category === category)?.description}
            </p>
          </div>

          {/* カスタム時間入力 */}
          <div>
            <Label htmlFor="custom-minutes" className="text-emerald-700 dark:text-emerald-300">
              カスタム時間（分）
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="custom-minutes"
                type="number"
                min="1"
                max="999"
                value={durationMinutes}
                onChange={(e) => handleCustomMinutesChange(e.target.value)}
                disabled={state !== "idle"}
                className="flex-1 border-emerald-500 bg-white dark:bg-emerald-900 dark:border-emerald-600"
              />
              <Button
                onClick={() => {
                  handlePresetClick(durationMinutes, "custom")
                  setTitle("")
                }}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                disabled={state !== "idle"}
              >
                設定
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
