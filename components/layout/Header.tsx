"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationIcon } from "@/components/layout/notification-icon"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-200/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-emerald-900/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-all">
              Portfolio
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/about"
              className="transition-colors hover:text-emerald-600 text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              自己紹介
            </Link>
            <Link
              href="/qualifications"
              className="transition-colors hover:text-emerald-600 text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              資格
            </Link>
            <Link
              href="/skills"
              className="transition-colors hover:text-emerald-600 text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              スキル
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-emerald-600 text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              プロジェクト
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-emerald-600 text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              連絡先
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session && <NotificationIcon />}
          <ThemeToggle />
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            asChild
          >
            <Link href={session ? "/hub" : "/login"}>
              {status === "loading" ? "..." : session ? "Hub" : "ログイン"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
