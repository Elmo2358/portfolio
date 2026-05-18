"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationIcon } from "@/components/layout/notification-icon"
import { MobileNavigation } from "@/components/layout/mobile-navigation"
import { Command } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <MobileNavigation />
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-semibold text-mongo-green-dark group-hover:text-mongo-green transition-all">
              Portfolio
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-body-sm-medium ml-4">
            <Link
              href="/about"
              className="transition-colors hover:text-mongo-green-dark text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              自己紹介
            </Link>
            <Link
              href="/qualifications"
              className="transition-colors hover:text-mongo-green-dark text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              資格
            </Link>
            <Link
              href="/skills"
              className="transition-colors hover:text-mongo-green-dark text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              スキル
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-mongo-green-dark text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              プロジェクト
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-mongo-green-dark text-foreground/60 hover:underline decoration-2 underline-offset-4"
            >
              連絡先
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {session && <NotificationIcon />}
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex border-border hover:bg-accent touch-manipulation"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                metaKey: true,
              })
              window.dispatchEvent(event)
            }}
            aria-label="コマンドパレットを開く"
          >
            <Command className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button
            size="sm"
            className="bg-mongo-green text-mongo-teal-deep hover:bg-mongo-green-mid border-0 touch-manipulation text-sm sm:text-base"
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
