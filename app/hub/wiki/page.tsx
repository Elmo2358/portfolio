"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, Search, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface WikiPage {
  id: string
  title: string
  url: string
  lastEdited: string
  icon?: any
  cover?: any
}

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([])
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [wikiEnabled, setWikiEnabled] = useState(false)

  useEffect(() => {
    fetchWikiPages()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredPages(pages.filter((page) =>
        page.title.toLowerCase().includes(query)
      ))
    } else {
      setFilteredPages(pages)
    }
  }, [searchQuery, pages])

  const fetchWikiPages = async () => {
    try {
      const res = await fetch("/api/notion")
      if (!res.ok) {
        console.error("Notion API error:", res.status)
        setIsConnected(false)
        setWikiEnabled(false)
        return
      }
      const data = await res.json()

      setIsConnected(data.isConnected)
      setWikiEnabled(data.wikiEnabled)
      setPages(data.pages || [])
      setFilteredPages(data.pages || [])
    } catch (error) {
      console.error("Error fetching wiki pages:", error)
      setIsConnected(false)
      setWikiEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                Wiki
              </h1>
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected || !wikiEnabled) {
    return (
      <div className="container py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                Wiki
              </h1>
              <p className="text-muted-foreground">Notionデータベース</p>
            </div>
          </div>

          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Notion Wiki連携が必要です</CardTitle>
              <CardDescription>
                {!isConnected
                  ? "設定ページでNotion APIトークンとデータベースIDを設定してください"
                  : "Wiki機能を有効にしてください"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => (window.location.href = "/hub/settings")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                設定ページを開く
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              Wiki
            </h1>
            <p className="text-muted-foreground">Notionデータベース</p>
          </div>
        </div>

        {/* 検索バー */}
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Wikiページを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filteredPages.length}件のページ
            </p>
          </CardContent>
        </Card>

        {/* Wikiページ一覧 */}
        {filteredPages.length === 0 ? (
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "一致するページが見つかりませんでした" : "Wikiページがありません"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredPages.map((page) => (
              <a
                key={page.id}
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {page.icon && (
                            <span className="text-xl">{page.icon?.emoji || "📄"}</span>
                          )}
                          <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                            {page.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          最終更新: {formatDate(page.lastEdited)}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
