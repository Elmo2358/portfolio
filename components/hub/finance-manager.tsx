"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Calendar, Zap, CreditCard, Droplets, Smartphone } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface Income {
  id: string
  source: string
  amount: number
  date: Date
  description: string | null
  category: string
}

interface Expense {
  id: string
  item: string
  amount: number
  date: Date
  category: string
  description: string | null
}

interface FinanceSummary {
  period: { year: number; month: number }
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
  }
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
  incomeCount: number
  expenseCount: number
}

type TabType = "dashboard" | "income" | "expense"

// よく使う項目の定義
const frequentItems = {
  income: [
    { id: "allowance", source: "仕送り", category: "その他", defaultAmount: 50000 },
    { id: "parttime", source: "バイト代", category: "バイト", defaultAmount: 30000 }
  ],
  expense: [
    { id: "creditcard", item: "クレジットカード", category: "その他", defaultAmount: 20000, icon: CreditCard },
    { id: "water", item: "水道代", category: "その他", defaultAmount: 3000, icon: Droplets },
    { id: "electricity", item: "電気代", category: "その他", defaultAmount: 5000, icon: Zap },
    { id: "paypay", item: "PayPayチャージ", category: "その他", defaultAmount: 10000, icon: Smartphone },
    { id: "googleplay", item: "Google Play", category: "趣味", defaultAmount: 1500, icon: Smartphone }
  ]
}

export function FinanceManager({ initialTab = "dashboard" }: { initialTab?: TabType }) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [initialFormData, setInitialFormData] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true)

      // サマリー取得
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const summaryRes = await fetch(`/api/hub/finance/summary?year=${year}&month=${month}`)
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      // 収入・支出取得
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [incomeRes, expenseRes] = await Promise.all([
        fetch(`/api/hub/finance/income?startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/hub/finance/expense?startDate=${startDate}&endDate=${endDate}`)
      ])

      if (incomeRes.ok) setIncomes(await incomeRes.json())
      if (expenseRes.ok) setExpenses(await expenseRes.json())
    } catch (error) {
      console.error("Error fetching finance data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  // 収入削除
  const handleDeleteIncome = async (id: string) => {
    if (!confirm("この収入記録を削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/finance/income/${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error deleting income:", error)
    }
  }

  // 支出削除
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("この支出記録を削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/finance/expense/${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  // 月移動
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentMonth(newDate)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">家計簿</h2>
          <p className="text-sm text-muted-foreground">
            収入と支出を管理
          </p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "dashboard"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          }`}
        >
          ダッシュボード
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "income"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          }`}
        >
          収入
        </button>
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "expense"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          }`}
        >
          支出
        </button>
      </div>

      {/* 月選択 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => changeMonth(-1)}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
        >
          前月
        </Button>
        <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => changeMonth(1)}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
        >
          次月
        </Button>
      </div>

      {/* ダッシュボード */}
      {activeTab === "dashboard" && (
        <DashboardView
          summary={summary}
          loading={loading}
        />
      )}

      {/* 収入タブ */}
      {activeTab === "income" && (
        <IncomeView
          incomes={incomes}
          loading={loading}
          onDelete={handleDeleteIncome}
          onAdd={() => {
            setInitialFormData(null)
            setShowForm(true)
          }}
          onQuickAdd={(item) => {
            setInitialFormData({
              type: "income",
              source: item.source,
              category: item.category,
              amount: item.defaultAmount.toString()
            })
            setShowForm(true)
          }}
        />
      )}

      {/* 支出タブ */}
      {activeTab === "expense" && (
        <ExpenseView
          expenses={expenses}
          loading={loading}
          onDelete={handleDeleteExpense}
          onAdd={() => {
            setInitialFormData(null)
            setShowForm(true)
          }}
          onQuickAdd={(item) => {
            setInitialFormData({
              type: "expense",
              item: item.item,
              category: item.category,
              amount: item.defaultAmount.toString()
            })
            setShowForm(true)
          }}
        />
      )}

      {/* 収支追加フォームモーダル */}
      {showForm && (
        <FinanceForm
          type={initialFormData?.type || (activeTab === "dashboard" ? "income" : activeTab)}
          initialData={initialFormData}
          onClose={() => {
            setShowForm(false)
            setInitialFormData(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// ダッシュボードビュー
function DashboardView({ summary, loading }: { summary: FinanceSummary | null; loading: boolean }) {
  if (loading || !summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  const expenseCategories = Object.entries(summary.expenseByCategory)
    .sort(([, a], [, b]) => b - a)

  const incomeCategories = Object.entries(summary.incomeByCategory)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                総収入
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              ¥{summary.summary.totalIncome.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.incomeCount}件
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                総支出
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              ¥{summary.summary.totalExpense.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.expenseCount}件
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${
          summary.summary.balance >= 0
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
            : "border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-600"
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${
                summary.summary.balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`} />
              <CardTitle className={`text-sm font-medium ${
                summary.summary.balance >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}>
                収支
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              summary.summary.balance >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              ¥{summary.summary.balance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.summary.balance >= 0 ? "黒字" : "赤字"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 支出カテゴリ別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">支出カテゴリ別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories.map(([category, amount]) => {
                const percentage = (amount / summary.summary.totalExpense) * 100
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700 dark:text-emerald-300">{category}</span>
                      <span className="font-semibold text-emerald-600">¥{amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 収入カテゴリ別 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">収入カテゴリ別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomeCategories.map(([category, amount]) => {
                const percentage = (amount / summary.summary.totalIncome) * 100
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700 dark:text-emerald-300">{category}</span>
                      <span className="font-semibold text-emerald-600">¥{amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 収入ビュー
function IncomeView({
  incomes,
  loading,
  onDelete,
  onAdd,
  onQuickAdd
}: {
  incomes: Income[]
  loading: boolean
  onDelete: (id: string) => void
  onAdd: () => void
  onQuickAdd?: (item: typeof frequentItems.income[0]) => void
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* よく使う項目 */}
      {onQuickAdd && frequentItems.income.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">よく使う項目</p>
          <div className="flex flex-wrap gap-2">
            {frequentItems.income.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant="outline"
                onClick={() => onQuickAdd(item)}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
              >
                <Plus className="h-3 w-3 mr-1" />
                {item.source}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          収入を追加
        </Button>
      </div>

      {incomes.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">収入記録がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incomes.map((income) => (
            <Card
              key={income.id}
              className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{income.source}</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                        {income.category}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      ¥{income.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(income.date), "yyyy/MM/dd", { locale: ja })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(income.id)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// 支出ビュー
function ExpenseView({
  expenses,
  loading,
  onDelete,
  onAdd,
  onQuickAdd
}: {
  expenses: Expense[]
  loading: boolean
  onDelete: (id: string) => void
  onAdd: () => void
  onQuickAdd?: (item: typeof frequentItems.expense[0]) => void
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* よく使う項目 */}
      {onQuickAdd && frequentItems.expense.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">よく使う項目</p>
          <div className="flex flex-wrap gap-2">
            {frequentItems.expense.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickAdd(item)}
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {item.item}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          支出を追加
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">支出記録がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{expense.item}</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                        {expense.category}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      -¥{expense.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(expense.date), "yyyy/MM/dd", { locale: ja })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(expense.id)}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// 収支フォーム
function FinanceForm({
  type,
  initialData,
  onClose
}: {
  type: "income" | "expense"
  initialData?: any
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    source: initialData?.source || "", // 収入の場合
    item: initialData?.item || "", // 支出の場合
    amount: initialData?.amount || "",
    date: new Date().toISOString().split('T')[0],
    category: initialData?.category || (type === "income" ? "バイト" : "食費"),
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = type === "income" ? "/api/hub/finance/income" : "/api/hub/finance/expense"
    const payload = type === "income"
      ? {
          source: formData.source,
          amount: formData.amount,
          date: formData.date,
          category: formData.category,
          description: formData.description || null
        }
      : {
          item: formData.item,
          amount: formData.amount,
          date: formData.date,
          category: formData.category,
          description: formData.description || null
        }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || "作成に失敗しました")
      }
    } catch (error) {
      console.error("Error creating record:", error)
      alert("作成に失敗しました")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            {type === "income" ? "収入を追加" : "支出を追加"}
          </CardTitle>
          <CardDescription>情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "income" ? (
              <div>
                <label className="mb-2 block text-sm font-medium">収入源 *</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium">項目 *</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">金額 *</label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">カテゴリ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {type === "income" ? (
                  <>
                    <option value="バイト">バイト</option>
                    <option value="奨学金">奨学金</option>
                    <option value="その他">その他</option>
                  </>
                ) : (
                  <>
                    <option value="食費">食費</option>
                    <option value="交通費">交通費</option>
                    <option value="趣味">趣味</option>
                    <option value="書籍">書籍</option>
                    <option value="その他">その他</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">日付</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                追加
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
