import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Providers } from "./providers"
import { Toaster } from "sonner"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { WebVitalsMonitor } from "@/components/performance/web-vitals"
import { ProgressBar } from "@/components/loading/progress-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Portfolio | 電気通信大学 情報理工学域2類",
  description: "電気通信大学情報理工学域2類情報通信工学プログラム所属の学生ポートフォリオ",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Portfolio",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Portfolio" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ProgressBar />
          <WebVitalsMonitor />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
          <CommandPalette />
          <KeyboardShortcutsHelp />
        </Providers>
      </body>
    </html>
  )
}
