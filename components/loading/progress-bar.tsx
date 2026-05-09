"use client"

import { useEffect } from "react"

export function ProgressBar() {
  useEffect(() => {
    // NProgressのCSSをインポート
    if (typeof window !== "undefined") {
      require("nprogress/nprogress.css")

      // NProgressの設定をカスタマイズ
      const nprogress = require("nprogress")
      nprogress.configure({
        minimum: 0.3,
        easing: "ease",
        speed: 500,
        showSpinner: false,
        template: `
          <div class="bar" role="bar">
            <div class="peg"></div>
          </div>
        `,
      })
    }
  }, [])

  return null
}

// ルート変更時にプログレスバーを表示するフック
export function useProgressBar() {
  useEffect(() => {
    let nprogress: any

    const startProgress = () => {
      if (typeof window !== "undefined") {
        nprogress = require("nprogress")
        nprogress.start()
      }
    }

    const stopProgress = () => {
      if (nprogress) {
        nprogress.done()
        nprogress = null
      }
    }

    // ページの読み込み開始時にプログレスバーを表示
    startProgress()

    // ページの読み込み完了時にプログレスバーを非表示
    window.addEventListener("load", stopProgress)

    return () => {
      stopProgress()
      window.removeEventListener("load", stopProgress)
    }
  }, [])
}
