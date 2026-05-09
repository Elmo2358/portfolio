"use client"

import { useEffect, useState } from "react"
import {
  onCLS,
  onINP,
  onFCP,
  onLCP,
  onTTFB,
} from "web-vitals"

interface Vitals {
  cls: number | null
  inp: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
}

export function WebVitalsMonitor() {
  const [vitals, setVitals] = useState<Vitals>({
    cls: null,
    inp: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  })
  const [showVitals, setShowVitals] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    // Check if web-vitals functions are available
    if (typeof onCLS !== 'function' ||
        typeof onINP !== 'function' ||
        typeof onFCP !== 'function' ||
        typeof onLCP !== 'function' ||
        typeof onTTFB !== 'function') {
      console.warn('Some web-vitals functions are not available')
      return
    }

    const updateVitals = () => {
      try {
        onCLS((metric) => setVitals((prev) => ({ ...prev, cls: metric.value })))
        onINP((metric) => setVitals((prev) => ({ ...prev, inp: metric.value })))
        onFCP((metric) => setVitals((prev) => ({ ...prev, fcp: metric.value })))
        onLCP((metric) => setVitals((prev) => ({ ...prev, lcp: metric.value })))
        onTTFB((metric) => setVitals((prev) => ({ ...prev, ttfb: metric.value })))
      } catch (error) {
        console.warn('Error measuring web vitals:', error)
      }
    }

    updateVitals()
  }, [])

  if (process.env.NODE_ENV !== "development") return null

  return (
    <>
      <button
        onClick={() => setShowVitals(!showVitals)}
        className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-emerald-700 transition-colors shadow-lg"
      >
        {showVitals ? "Hide" : "Show"} Vitals
      </button>

      {showVitals && (
        <div className="fixed bottom-16 right-4 z-50 bg-background border-2 border-emerald-500 rounded-lg p-4 shadow-xl w-72">
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3">
            Core Web Vitals
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CLS:</span>
              <span className={vitals.cls && vitals.cls < 0.1 ? "text-green-600" : "text-red-600"}>
                {vitals.cls?.toFixed(3) || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">INP:</span>
              <span className={vitals.inp && vitals.inp < 200 ? "text-green-600" : "text-red-600"}>
                {vitals.inp?.toFixed(0) || "-"} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FCP:</span>
              <span className={vitals.fcp && vitals.fcp < 1800 ? "text-green-600" : "text-red-600"}>
                {vitals.fcp?.toFixed(0) || "-"} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LCP:</span>
              <span className={vitals.lcp && vitals.lcp < 2500 ? "text-green-600" : "text-red-600"}>
                {vitals.lcp?.toFixed(0) || "-"} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TTFB:</span>
              <span className={vitals.ttfb && vitals.ttfb < 800 ? "text-green-600" : "text-red-600"}>
                {vitals.ttfb?.toFixed(0) || "-"} ms
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground">
            <div>CLS: &lt;0.1 ✅ | INP: &lt;200ms ✅</div>
            <div>FCP: &lt;1.8s ✅ | LCP: &lt;2.5s ✅</div>
            <div>TTFB: &lt;800ms ✅</div>
          </div>
        </div>
      )}
    </>
  )
}
