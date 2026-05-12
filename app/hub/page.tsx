"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, DollarSign, Briefcase, Gamepad2, Sparkles, Code2, Settings, BarChart3, Search, BookOpen, ArrowRight } from "lucide-react"
import { CardListSkeleton } from "@/components/loading/card-skeleton"
import dynamic from "next/dynamic"

// ダッシュボードカードを遅延読み込み
const DashboardCards = dynamic(() =>
  import("@/components/dashboard/dashboard-cards").then(mod => ({ default: mod.DashboardCards })),
{
  loading: () => <CardListSkeleton count={6} />,
  ssr: false
}
)

export default function HubPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl">
        {/* 検索ボックス */}
        <div className="mb-8 animate-fadeIn">
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardContent className="pt-6">
              <Link
                href="/hub/search"
                className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
              >
                <Search className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-semibold">全アプリ横断検索</div>
                  <div className="text-sm text-muted-foreground">
                    タスク、就活、バケツリスト、AtCoderから検索
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                  asChild
                >
                  検索
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 使い方ガイド */}
        <div className="mb-8 animate-fadeIn">
          <Card className="border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 dark:border-emerald-600">
            <CardContent className="pt-6">
              <Link
                href="/hub/guide"
                className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
              >
                <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">アプリケーション使い方ガイド</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    毎日のルーチンと各アプリの活用方法（2026年夏季版）
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            アプリケーション一覧
          </h2>
          <p className="text-lg text-emerald-800 dark:text-emerald-200">Personal Applications</p>
          <p className="mt-4 text-sm text-emerald-800 dark:text-emerald-200">
            ※ 各アプリケーションは現在開発中です
          </p>
        </div>

        {/* Lazy loadingされたアプリケーションカード */}
        <DashboardCards />

        <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto animate-fadeIn">
          {/* ダッシュボード */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">統計ダッシュボード</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                全アプリの統計情報をグラフで確認できます
              </p>
              <Button
                variant="outline"
                className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white"
                asChild
              >
                <Link href="/hub/dashboard">
                  ダッシュボードを開く
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 設定へのリンク */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">設定</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                AtCoder連携やその他の設定を管理できます
              </p>
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white"
                asChild
              >
                <Link href="/hub/settings">
                  設定を開く
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
