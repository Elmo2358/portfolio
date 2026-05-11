// AtCoderから提出ソースコードを取得するユーティリティ

import * as cheerio from "cheerio"

const ATCODER_BASE_URL = "https://atcoder.jp"
const REQUEST_DELAY = 2000 // 2秒間隔（AtCoderに負荷をかけないため）

// 最後のリクエスト時刻
let lastRequestTime = 0

async function rateLimitDelay() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

export interface ScrapedSubmission {
  submissionId: string
  sourceCode: string
  language: string
  problemId: string
  contestId: string
  result: string
  problemTitle?: string
}

/**
 * AtCoderの提出詳細ページからソースコードを取得
 */
export async function fetchSubmissionSourceCode(
  submissionId: string
): Promise<ScrapedSubmission | null> {
  try {
    await rateLimitDelay()

    // 提出IDからコンテストIDを抽出できないので、まず検索ページを使う
    // AtCoderの提出詳細ページのURLを推測
    // 提出IDは連番なので、コンテストIDを取得するには別のアプローチが必要
    // Kenkoooo APIを使ってコンテストIDを取得する

    const response = await fetch(`${ATCODER_BASE_URL}/contests/../submissions/${submissionId}`)

    if (!response.ok) {
      console.error(`Failed to fetch submission ${submissionId}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // ソースコードの取得
    const sourceCode = $("#submission-code").text() || $("pre").text()

    if (!sourceCode) {
      console.error(`No source code found for submission ${submissionId}`)
      return null
    }

    // 言語の取得
    const language = $("tbody tr:contains(Language) td, .language").text().trim()

    // 問題タイトルの取得
    const problemTitle = $("tbody tr:contains(Problem) td a, .problem-title").text().trim()

    // 結果の取得
    const result = $("tbody tr:contains(Result) td, .submission-status span").text().trim()

    // コンテストIDと問題IDはURLから抽出
    const problemLink = $("tbody tr:contains(Problem) td a").attr("href") || ""
    const problemMatch = problemLink.match(/\/contests\/([^/]+)\/tasks\/([^/]+)/)

    let contestId = ""
    let problemId = ""

    if (problemMatch) {
      contestId = problemMatch[1]
      problemId = problemMatch[2]
    }

    return {
      submissionId,
      sourceCode,
      language,
      problemId,
      contestId,
      result,
      problemTitle,
    }
  } catch (error) {
    console.error(`Error fetching submission ${submissionId}:`, error)
    return null
  }
}

/**
 * Kenkoooo APIを使って提出情報を取得し、その後にソースコードを取得
 */
export async function fetchSubmissionWithCode(
  submissionId: string,
  contestId?: string
): Promise<ScrapedSubmission | null> {
  try {
    // まずKenkoooo APIから提出メタデータを取得
    const kenkooooResponse = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submission?submission_id=${submissionId}`)

    if (kenkooooResponse.ok) {
      const submissions = await kenkooooResponse.json()
      if (Array.isArray(submissions) && submissions.length > 0) {
        const submission = submissions[0]
        contestId = submission.contest_id || contestId
      }
    }

    if (!contestId) {
      // コンテストIDが不明な場合は、提出詳細ページから取得
      return await fetchSubmissionSourceCode(submissionId)
    }

    // コンテストIDが分かっている場合、詳細ページのURLを構築
    await rateLimitDelay()

    const url = `${ATCODER_BASE_URL}/contests/${contestId}/submissions/${submissionId}`
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Failed to fetch submission ${submissionId}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // ソースコードの取得
    const sourceCode = $("#submission-code").text()

    if (!sourceCode) {
      console.error(`No source code found for submission ${submissionId}`)
      return null
    }

    // 言語の取得
    const language = $("table tbody tr:contains(Language) td").text().trim()

    // 問題IDの取得
    const problemLink = $("table tbody tr:contains(Problem) td a").attr("href")
    let problemId = ""
    if (problemLink) {
      const match = problemLink.match(/tasks\/([a-zA-Z0-9_]+)$/)
      if (match) problemId = match[1]
    }

    // 問題タイトルの取得
    const problemTitle = $("table tbody tr:contains(Problem) td a").text().trim()

    // 結果の取得
    const resultClass = $("table tbody tr:contains(Result) td span").attr("class") || ""
    const result = resultClass.replace("label-", "").toUpperCase() || "UNKNOWN"

    return {
      submissionId,
      sourceCode,
      language,
      problemId,
      contestId,
      result,
      problemTitle,
    }
  } catch (error) {
    console.error(`Error fetching submission with code ${submissionId}:`, error)
    return null
  }
}

/**
 * 複数の提出のソースコードを取得（バッチ処理）
 */
export async function fetchMultipleSubmissions(
  submissionIds: string[]
): Promise<Map<string, ScrapedSubmission>> {
  const results = new Map<string, ScrapedSubmission>()

  for (const submissionId of submissionIds) {
    const data = await fetchSubmissionWithCode(submissionId)
    if (data) {
      results.set(submissionId, data)
    }
  }

  return results
}
