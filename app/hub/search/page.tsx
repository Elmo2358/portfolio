"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, X, Filter } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { SearchSkeleton } from "@/components/loading/search-skeleton"

interface SearchResult {
  type: string
  item: {
    id: string
    title: string
    description: string
    url: string
    [key: string]: any
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string>("all")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // デバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // キーボードショートカット: /キーで検索ボックスにフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input要素、Textarea要素、編集可能な要素内では無効化
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 検索実行
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/hub/search?q=${encodeURIComponent(debouncedQuery)}&app=${selectedApp}`)
        const data = await res.json()

        console.log("[DEBUG] Search response:", data)

        if (data.success) {
          console.log(`[DEBUG] Found ${data.results.length} results`)
          setResults(data.results)
        } else {
          console.error("[DEBUG] Search failed:", data.error)
        }
      } catch (error) {
        console.error("[DEBUG] Error searching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery, selectedApp])

  const getTypeLabel = (type: string) => {
    const labels = {
      task: "タスク",
      job_application: "就活",
      bucket_list_item: "バケツリスト",
      atcoder_problem: "AtCoder",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
      job_application: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
      bucket_list_item: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
      atcoder_problem: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
      }
      return <span key={index}>{part}</span>
    })
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
  }

  return (
    <div className="container py-4 sm:py-8 animate-fadeIn">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            全アプリ横断検索
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            タスク、就活、バケツリスト、AtCoderから検索
          </p>
        </div>

        {/* 検索バー */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 mb-4 sm:mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="検索キーワードを入力..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-11"
                  autoFocus
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
                  /
                </kbd>
              </div>
              {query && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearSearch}
                  className="h-11 w-11 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* アプリフィルター */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground self-center">アプリ:</Label>
              {["all", "tasks", "jobhunt", "bucket", "atcoder"].map((app) => (
                <Button
                  key={app}
                  variant={selectedApp === app ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedApp(app)}
                  className={
                    selectedApp === app
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
                  }
                >
                  {app === "all" ? "全て" : app === "tasks" ? "タスク" : app === "jobhunt" ? "就活" : app === "bucket" ? "バケツリスト" : "AtCoder"}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 検索結果 */}
        {loading ? (
          <SearchSkeleton />
        ) : debouncedQuery && results.length === 0 ? (
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-2">検索結果がありません</p>
              <p className="text-sm text-muted-foreground">
                別のキーワードで試してみてください
              </p>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {results.length}件の結果
            </p>
            {results.map((result, index) => (
              <Link
                key={`${result.type}-${result.item.id}-${index}`}
                href={result.item.url}
                className="block active:scale-[0.98] transition-transform"
              >
                <Card className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900 touch-manipulation">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(result.type)}`}>
                            {getTypeLabel(result.type)}
                          </span>
                          <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                            {highlightMatch(result.item.title, debouncedQuery)}
                          </h3>
                        </div>
                        {result.item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {highlightMatch(result.item.description, debouncedQuery)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                検索してみましょう
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                タスク、就活、バケツリスト、AtCoderから検索できます
              </p>
              <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                <span>💡 ヒント:</span>
                <span>具体的なキーワードで検索してみてください</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
