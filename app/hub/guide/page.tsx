"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, CheckCircle2, DollarSign, Briefcase, Gamepad2, Sparkles, Code2, GraduationCap, ArrowRight, Clock, Target } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface GuideSection {
  id: string
  title: string
  icon: React.ElementType
  frequency: "daily" | "weekly" | "as-needed"
  description: string
  goals: string[]
  tips: string[]
}

const guideSections: GuideSection[] = [
  {
    id: "tasks",
    title: "タスク管理",
    icon: CheckCircle2,
    frequency: "daily",
    description: "日々のタスクを管理し、進捗を確認します",
    goals: [
      "毎日朝にその日のタスクを確認",
      "完了したタスクをチェック",
      "翌日のタスクを予定",
      "週末に今週の振り返り"
    ],
    tips: [
      "タスクは小さく分けて管理すると達成感があります",
      "期限を設定すると優先順位がつけやすくなります",
      "Google Tasksと同期することで外出先でも確認できます"
    ]
  },
  {
    id: "atcoder",
    title: "AtCoder学習",
    icon: Code2,
    frequency: "daily",
    description: "競技プログラミングの学習進捗を管理し、茶色コーダーを目指します",
    goals: [
      "毎日1問以上の問題を解く",
      "ヒートマップで学習習慣を維持",
      "AI機能でヒントや解説を確認",
      "問題推薦で適正な難易度の問題に挑戦"
    ],
    tips: [
      "初心者向け：A問題 → B問題 → C問題の順に進みましょう",
      "わからない問題はAI Q&Aでヒントをもらえます",
      "コード分析で提出コードのレビューを受けられます",
      "学習プランで目標達成までの道のりを可視化できます"
    ]
  },
  {
    id: "finance",
    title: "家計簿",
    icon: DollarSign,
    frequency: "daily",
    description: "収入と支出を記録し、貯金状況を把握します",
    goals: [
      "毎日の支出を記録",
      "現状の貯金額を把握",
      "先月までのクレジットカード引き落としを記録",
      "今月以降は詳細な収支明細をつける"
    ],
    tips: [
      "クレジットカードの利用明細をそのまま記録するのが簡単です",
      "固定費（家賃、通信費など）と変動費を分けて管理すると見やすくなります",
      "月ごとの集計で傾向を把握できます"
    ]
  },
  {
    id: "jobhunt",
    title: "就活管理",
    icon: Briefcase,
    frequency: "daily",
    description: "サマーインターンの応募管理と選考状況を追跡します",
    goals: [
      "サマーインターンの企業をリストアップ",
      "応募状況と選考進捗を管理",
      "ES提出日、面接日を記録",
      "結果を記録して次回に活かす"
    ],
    tips: [
      "企業ごとにカードを作成して管理すると見やすくなります",
      "選考ステータスを更新して漏れを防ぎましょう",
      "メモ機能で面接の感想や次回の対策を残せます"
    ]
  },
  {
    id: "wiki",
    title: "Wiki",
    icon: BookOpen,
    frequency: "weekly",
    description: "Notionで作成したWiki・ドキュメントを管理します",
    goals: [
      "学習メモを残す",
      "プロジェクトの情報を整理",
      "技術記事をアーカイブ"
    ],
    tips: [
      "Notionと連携することで外出先でも確認できます",
      "検索機能で過去のメモを素早く見つけられます"
    ]
  },
  {
    id: "media",
    title: "メディア管理",
    icon: Gamepad2,
    frequency: "as-needed",
    description: "ゲームと読書の履歴を記録します",
    goals: [
      "遊んだゲームを記録",
      "読んだ本を記録",
      "評価と感想を残す"
    ],
    tips: [
      "プレイ時間/読了日を記録すると後で振り返りやすいです",
      "評価をつけるとおすすめ作品を見つけやすくなります"
    ]
  },
  {
    id: "bucket",
    title: "やりたいことリスト",
    icon: Sparkles,
    frequency: "as-needed",
    description: "旅行ややりたいことを計画・管理します",
    goals: [
      "やりたいことをリストアップ",
      "進捗を管理",
      "達成したことを記録"
    ],
    tips: [
      "大きな目標は小さなタスクに分けて管理しましょう",
      "期限を設定ると達成のモチベーションになります"
    ]
  },
  {
    id: "uec",
    title: "UECポータル",
    icon: GraduationCap,
    frequency: "weekly",
    description: "大学からのお知らせ・予定・時間割を確認します",
    goals: [
      "重要なお知らせを見逃さない",
      "課題提出期限を確認",
      "時間割を確認"
    ],
    tips: [
      "未読フィルターで重要なお知らせを素早く確認できます",
      "数日に1回の同期で最新情報を取得できます",
      "CLIでのログインが必要です（npm run uec:sync）"
    ]
  }
]

const frequencyLabels = {
  daily: { text: "毎日", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  weekly: { text: "毎週", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  "as-needed": { text: "随時", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" }
}

export default function GuidePage() {
  const [loading, setLoading] = useState(false)

  const exportToNotion = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notion/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "2026年夏季最新版 アプリケーション使い方ガイド"
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Notion Wikiにガイドページを追加しました！")
        if (data.url) {
          window.open(data.url, "_blank")
        }
      } else {
        toast.error(data.error || "追加に失敗しました")
      }
    } catch (error) {
      console.error("Error exporting to Notion:", error)
      toast.error("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                アプリケーション使い方ガイド
              </h1>
              <p className="text-muted-foreground">2026年夏季最新版</p>
            </div>
          </div>
          <Button
            onClick={exportToNotion}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? "追加中..." : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Notion Wikiに追加
              </>
            )}
          </Button>
        </div>

        {/* 目標セクション */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Target className="h-5 w-5" />
              2026年夏季の目標
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">サマーインターン内定</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">就活管理で応募・選考状況を追跡</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Code2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">茶色コーダー（Rating 800-）</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">AtCoder学習で毎日問題を解く</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">家計管理の習慣化</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">毎日の収支を記録して貯金を把握</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 毎日のルーチン */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              毎日のルーチン
            </CardTitle>
            <CardDescription>毎日開くべきアプリケーション</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">1</span>
                <span><strong>タスク管理</strong>：その日のタスクを確認、完了したものをチェック</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">2</span>
                <span><strong>AtCoder</strong>：1問以上解く、ヒートマップを記録</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">3</span>
                <span><strong>家計簿</strong>：その日の支出を記録</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">4</span>
                <span><strong>就活管理</strong>：応募状況を確認、ES提出日・面接日をチェック</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">5</span>
                <span><strong>タスク管理</strong>：翌日のタスクを予定</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* アプリケーション別ガイド */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">アプリケーション別ガイド</h2>

          {guideSections.map((section) => {
            const Icon = section.icon
            const freq = frequencyLabels[section.frequency]

            return (
              <Card key={section.id} className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-emerald-700 dark:text-emerald-300">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${freq.color}`}>
                      {freq.text}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">📋 やること</h4>
                    <ul className="space-y-1">
                      {section.goals.map((goal, i) => (
                        <li key={i} className="text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">💡 ヒント</h4>
                    <ul className="space-y-1">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                    asChild
                  >
                    <a href={`/hub/${section.id === "tasks" ? "tasks" : section.id === "atcoder" ? "atcoder" : section.id === "finance" ? "finance" : section.id === "jobhunt" ? "jobhunt" : section.id === "wiki" ? "wiki" : section.id === "media" ? "media" : section.id === "bucket" ? "bucket" : "uec"}`}>
                      {section.title}を開く <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
