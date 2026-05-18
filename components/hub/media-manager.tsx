"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Gamepad2, Book, Star, Trash2, Edit2, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface Game {
  id: string
  title: string
  genre: string | null
  platform: string | null
  completed: boolean
  completedAt: Date | string | null
  rating: number | null
  notes: string | null
}

interface Book {
  id: string
  title: string
  author: string | null
  genre: string | null
  completed: boolean
  completedAt: Date | string | null
  rating: number | null
  notes: string | null
}

interface MediaStats {
  games: {
    total: number
    completed: number
    playing: number
    averageRating: number
  }
  books: {
    total: number
    completed: number
    reading: number
    averageRating: number
  }
  recentActivity: {
    games: Game[]
    books: Book[]
  }
}

type TabType = "dashboard" | "games" | "books"
type CompletedFilter = "all" | "true" | "false"

interface MediaManagerProps {
  initialGames?: Game[]
  initialBooks?: Book[]
  initialStats?: MediaStats | null
}

export function MediaManager({ initialGames = [], initialBooks = [], initialStats = null }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [stats, setStats] = useState<MediaStats | null>(initialStats)
  const [games, setGames] = useState<Game[]>(initialGames)
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Game | Book | null>(null)
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>("all")

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true)

      // 統計取得
      const statsRes = await fetch("/api/hub/media/stats")
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }

      // ゲーム取得
      const gamesRes = await fetch(`/api/hub/media/games?completed=${completedFilter}`)
      if (gamesRes.ok) setGames(await gamesRes.json())

      // 本取得
      const booksRes = await fetch(`/api/hub/media/books?completed=${completedFilter}`)
      if (booksRes.ok) setBooks(await booksRes.json())
    } catch (error) {
      console.error("Error fetching media data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [completedFilter])

  // アイテム削除
  const handleDelete = async (type: "game" | "book", id: string) => {
    if (!confirm("削除しますか？")) return

    try {
      const res = await fetch(`/api/hub/media/${type}s/${id}`, {
        method: "DELETE"
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  // 完了ステータス切り替え
  const toggleCompleted = async (type: "game" | "book", item: Game | Book) => {
    try {
      const res = await fetch(`/api/hub/media/${type}s/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !item.completed })
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error("Error updating item:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">メディア管理</h2>
          <p className="text-sm text-muted-foreground">
            ゲームと本のライブラリ
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          追加
        </Button>
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
          onClick={() => setActiveTab("games")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "games"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          }`}
        >
          ゲーム
        </button>
        <button
          onClick={() => setActiveTab("books")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "books"
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          }`}
        >
          本
        </button>
      </div>

      {/* ダッシュボード */}
      {activeTab === "dashboard" && (
        <DashboardView stats={stats} loading={loading} />
      )}

      {/* ゲームタブ */}
      {activeTab === "games" && (
        <GamesView
          games={games}
          loading={loading}
          completedFilter={completedFilter}
          setCompletedFilter={setCompletedFilter}
          onDelete={(id) => handleDelete("game", id)}
          onToggleCompleted={(game) => toggleCompleted("game", game)}
          onEdit={(game) => {
            setEditingItem(game)
            setShowForm(true)
          }}
        />
      )}

      {/* 本タブ */}
      {activeTab === "books" && (
        <BooksView
          books={books}
          loading={loading}
          completedFilter={completedFilter}
          setCompletedFilter={setCompletedFilter}
          onDelete={(id) => handleDelete("book", id)}
          onToggleCompleted={(book) => toggleCompleted("book", book)}
          onEdit={(book) => {
            setEditingItem(book)
            setShowForm(true)
          }}
        />
      )}

      {/* フォームモーダル */}
      {showForm && (
        <MediaForm
          type={activeTab === "dashboard" ? "game" : activeTab === "games" ? "game" : "book"}
          item={editingItem}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// ダッシュボードビュー
function DashboardView({ stats, loading }: { stats: MediaStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ゲーム統計 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">ゲーム</CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">ライブラリ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.games.total}</p>
                <p className="text-xs text-muted-foreground">総数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.games.completed}</p>
                <p className="text-xs text-muted-foreground">クリア済み</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.games.playing}</p>
                <p className="text-xs text-muted-foreground">プレイ中</p>
              </div>
            </div>
            {stats.games.averageRating > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    平均評価: {stats.games.averageRating}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 本統計 */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">本</CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">ライブラリ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.books.total}</p>
                <p className="text-xs text-muted-foreground">総数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.books.completed}</p>
                <p className="text-xs text-muted-foreground">読了</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.books.reading}</p>
                <p className="text-xs text-muted-foreground">読書中</p>
              </div>
            </div>
            {stats.books.averageRating > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    平均評価: {stats.books.averageRating}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ゲームビュー
function GamesView({
  games,
  loading,
  completedFilter,
  setCompletedFilter,
  onDelete,
  onToggleCompleted,
  onEdit
}: {
  games: Game[]
  loading: boolean
  completedFilter: CompletedFilter
  setCompletedFilter: (filter: CompletedFilter) => void
  onDelete: (id: string) => void
  onToggleCompleted: (game: Game) => void
  onEdit: (game: Game) => void
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
      {/* フィルター */}
      <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
        {(["all", "true", "false"] as CompletedFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setCompletedFilter(filter)}
            className={`flex-1 rounded-md px-3 py-1 text-sm transition-colors ${
              completedFilter === filter
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
            }`}
          >
            {filter === "all" ? "すべて" : filter === "true" ? "クリア済み" : "プレイ中"}
          </button>
        ))}
      </div>

      {games.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">ゲームがありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <Card
              key={game.id}
              className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 ${
                game.completed
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
                  : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Gamepad2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-lg font-semibold">{game.title}</h3>
                      {game.completed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          クリア済み
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          プレイ中
                        </Badge>
                      )}
                    </div>

                    {(game.genre || game.platform) && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {game.genre && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                            {game.genre}
                          </Badge>
                        )}
                        {game.platform && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                            {game.platform}
                          </Badge>
                        )}
                      </div>
                    )}

                    {game.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < game.rating!
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {game.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {game.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleCompleted(game)}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                    >
                      {game.completed ? "未完了" : "完了"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(game)}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(game.id)}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// 本ビュー
function BooksView({
  books,
  loading,
  completedFilter,
  setCompletedFilter,
  onDelete,
  onToggleCompleted,
  onEdit
}: {
  books: Book[]
  loading: boolean
  completedFilter: CompletedFilter
  setCompletedFilter: (filter: CompletedFilter) => void
  onDelete: (id: string) => void
  onToggleCompleted: (book: Book) => void
  onEdit: (book: Book) => void
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
      {/* フィルター */}
      <div className="flex gap-1 rounded-lg border border-emerald-500 bg-emerald-50 p-1 dark:bg-emerald-950 dark:border-emerald-600">
        {(["all", "true", "false"] as CompletedFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setCompletedFilter(filter)}
            className={`flex-1 rounded-md px-3 py-1 text-sm transition-colors ${
              completedFilter === filter
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
            }`}
          >
            {filter === "all" ? "すべて" : filter === "true" ? "読了" : "読書中"}
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">本がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <Card
              key={book.id}
              className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 ${
                book.completed
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
                  : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Book className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-lg font-semibold">{book.title}</h3>
                      {book.completed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          読了
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          読書中
                        </Badge>
                      )}
                    </div>

                    {book.author && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                        {book.author}
                      </p>
                    )}

                    {book.genre && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 mb-2">
                        {book.genre}
                      </Badge>
                    )}

                    {book.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < book.rating!
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {book.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {book.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleCompleted(book)}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                    >
                      {book.completed ? "未読" : "完了"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(book)}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(book.id)}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// メディアフォーム
function MediaForm({
  type,
  item,
  onClose
}: {
  type: "game" | "book"
  item: Game | Book | null
  onClose: () => void
}) {
  const isGame = type === "game"
  const [formData, setFormData] = useState({
    title: item?.title || "",
    author: item && "author" in item ? (item as Book).author || "" : "",
    genre: item?.genre || "",
    platform: item && "platform" in item ? (item as Game).platform || "" : "",
    rating: item?.rating?.toString() || "",
    notes: item?.notes || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = isGame ? "/api/hub/media/games" : "/api/hub/media/books"
    const method = item ? "PUT" : "POST"
    const url = item ? `${endpoint}/${item.id}` : endpoint

    const payload = isGame
      ? {
          title: formData.title,
          genre: formData.genre || null,
          platform: formData.platform || null,
          rating: formData.rating ? parseInt(formData.rating) : null,
          notes: formData.notes || null
        }
      : {
          title: formData.title,
          author: formData.author || null,
          genre: formData.genre || null,
          rating: formData.rating ? parseInt(formData.rating) : null,
          notes: formData.notes || null
        }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onClose()
      } else {
        const error = await res.json()
        alert(error.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("Error saving item:", error)
      alert("保存に失敗しました")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
        <CardHeader>
          <CardTitle className="text-emerald-700 dark:text-emerald-300">
            {item ? "編集" : `${isGame ? "ゲーム" : "本"}を追加`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {isGame ? "ゲームタイトル" : "タイトル"} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            {!isGame && (
              <div>
                <label className="mb-2 block text-sm font-medium">著者</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">ジャンル</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {isGame && (
              <div>
                <label className="mb-2 block text-sm font-medium">プラットフォーム</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="例: PS5, Switch, PC"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">評価（1-5）</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">なし</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">メモ</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="感想やメモなど"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {item ? "更新" : "追加"}
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
