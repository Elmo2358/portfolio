"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("ユーザー名またはパスワードが間違っています")
      } else {
        router.push("/hub")
        router.refresh()
      }
    } catch (error) {
      setError("ログイン中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            アプリケーションハブ
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300">認証が必要です</p>
        </div>

        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-300">ログイン</CardTitle>
            <CardDescription>
              アプリケーションハブにアクセスするための認証情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium">
                  ユーザー名
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400"
                disabled={loading}
              >
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>デフォルト認証情報:</p>
              <p className="mt-1 font-mono text-xs">
                ユーザー名: admin / パスワード: admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
