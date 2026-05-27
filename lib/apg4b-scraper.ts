// APG4b (AtCoder Programming Guide for beginners) のスクレイパー

import * as cheerio from "cheerio"

const APG4B_BASE_URL = "https://atcoder.jp"
const APG4B_CONTEST_ID = "APG4b"
const REQUEST_DELAY = 2000

let lastRequestTime = 0

async function rateLimitDelay() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

export interface Apg4bChapter {
  chapterId: string
  title: string
  section: string
  order: number
  problemId: string
  description?: string
  url: string
}

export interface Apg4bPracticeProblem {
  lessonId: string
  title: string
  problemId: string
  chapterId: string
  order: number
  url: string
}

/**
 * APG4bのtasksページから問題一覧を取得
 */
export async function scrapeApg4bTasks(): Promise<{
  chapters: Apg4bChapter[]
  practiceProblems: Apg4bPracticeProblem[]
}> {
  try {
    await rateLimitDelay()

    const response = await fetch(`${APG4B_BASE_URL}/contests/${APG4B_CONTEST_ID}/tasks`)

    if (!response.ok) {
      throw new Error(`Failed to fetch APG4b tasks: ${response.status}`)
    }

    const html = await response.text()
    console.log("[APG4b Scraper] HTML length:", html.length)
    const $ = cheerio.load(html)

    const chapters: Apg4bChapter[] = []
    const practiceProblems: Apg4bPracticeProblem[] = []

    console.log("[APG4b Scraper] Processing table rows...")
    $("table tbody tr").each((index, element) => {
      const $tr = $(element)
      const $tds = $tr.find("td")
      if ($tds.length < 2) return

      const taskLabel = $tds.eq(0).text().trim()
      const taskName = $tds.eq(1).text().trim()
      const taskLink = $tds.eq(1).find("a").attr("href")
      const problemId = taskLink?.split("/").pop() || ""

      console.log(`[APG4b Scraper] Row ${index}: label="${taskLabel}", name="${taskName}", problemId="${problemId}"`)

      // 説明課題（A〜AP4）
      const chapterMatch = taskName.match(/^(\d+\.\d+)\s+(.+)$/)
      if (chapterMatch && /^[A-Z]+$/.test(taskLabel) && !taskLabel.startsWith("EX")) {
        const [, chapterId, title] = chapterMatch
        const section = chapterId.split(".")[0]

        console.log(`[APG4b Scraper] Chapter: ${chapterId} - ${title}`)
        chapters.push({
          chapterId,
          title,
          section,
          order: index,
          problemId,
          url: `${APG4B_BASE_URL}${taskLink}`,
        })
      }

      // 練習問題（EX1〜EX26）
      const practiceMatch = taskName.match(/^(\d+\.\d+)\s+(.+)$/)
      if (practiceMatch && /^EX\d+$/.test(taskLabel)) {
        const [, chapterId, title] = practiceMatch

        console.log(`[APG4b Scraper] Practice: ${taskLabel} - ${title}`)
        practiceProblems.push({
          lessonId: taskLabel,
          title,
          problemId,
          chapterId,
          order: index,
          url: `${APG4B_BASE_URL}${taskLink}`,
        })
      }
    })

    console.log(`[APG4b Scraper] Found ${chapters.length} chapters and ${practiceProblems.length} practice problems`)

    return { chapters, practiceProblems }
  } catch (error) {
    console.error("Error scraping APG4b tasks:", error)
    return { chapters: [], practiceProblems: [] }
  }
}

/**
 * APG4bの特定の問題ページから詳細を取得
 */
export async function scrapeApg4bProblemDetail(
  problemId: string
): Promise<{
  title: string
  difficulty?: number
  constraints?: string
  description?: string
} | null> {
  try {
    await rateLimitDelay()

    const response = await fetch(`${APG4B_BASE_URL}/contests/${APG4B_CONTEST_ID}/tasks/${problemId}`)

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const title = $(".h2").text().trim() || $("span.h2").text().trim()
    const description = $("#task-statement").text().trim()

    return {
      title,
      description,
    }
  } catch (error) {
    console.error(`Error scraping APG4b problem ${problemId}:`, error)
    return null
  }
}

/**
 * APG4bの全データを取得（章と練習問題）
 */
export async function fetchAllApg4bData(): Promise<{
  chapters: Apg4bChapter[]
  practiceProblems: Apg4bPracticeProblem[]
}> {
  return await scrapeApg4bTasks()
}
