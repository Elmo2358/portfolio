// AtCoder Problems API (Kenkoooo API) クライアント

const ATCODER_API_BASE = "https://kenkoooo.com/atcoder/atcoder-api/v3"
const ATCODER_RESOURCES_BASE = "https://kenkoooo.com/atcoder/resources"

export interface AtCoderSubmission {
  id: string
  epoch_second: number
  problem_id: string
  contest_id: string
  result: string
  language: string
  point: number
  length: number
}

export interface AtCoderProblemInfo {
  id: string
  title: string
  contest_id: string
  difficulty?: number
}

// ユーザーの存在を確認（提出履歴があれば存在するとみなす）
export async function getAtCoderUser(atCoderId: string): Promise<boolean> {
  try {
    // from_second=0 で最初の提出から取得
    const response = await fetch(
      `${ATCODER_API_BASE}/user/submissions?user=${atCoderId}&from_second=0`
    )
    if (!response.ok) {
      return false
    }
    const data = await response.json()
    // 配列で返ってくればユーザーが存在する
    return Array.isArray(data)
  } catch (error) {
    console.error("Error checking AtCoder user:", error)
    return false
  }
}

// ユーザーの提出履歴を取得（最新limit件）
export async function getAtCoderSubmissions(
  atCoderId: string,
  limit?: number
): Promise<AtCoderSubmission[]> {
  try {
    // from_second=0 で全提出履歴を取得
    const response = await fetch(
      `${ATCODER_API_BASE}/user/submissions?user=${atCoderId}&from_second=0`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch submissions")
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format")
    }

    // 新しい順にソートしてlimit件を返す
    const sorted = data.sort((a, b) => b.epoch_second - a.epoch_second)
    return limit ? sorted.slice(0, limit) : sorted
  } catch (error) {
    console.error("Error fetching submissions:", error)
    throw error
  }
}

// 全問題情報を取得（キャッシュして使い回す）
let allProblemsCache: AtCoderProblemInfo[] | null = null

export async function getAllProblems(): Promise<AtCoderProblemInfo[]> {
  if (allProblemsCache) {
    return allProblemsCache
  }

  try {
    const response = await fetch(`${ATCODER_RESOURCES_BASE}/problems.json`)
    if (!response.ok) {
      throw new Error("Failed to fetch problems")
    }

    const data = await response.json()
    allProblemsCache = data
    return data
  } catch (error) {
    console.error("Error fetching problems:", error)
    throw error
  }
}

// 問題情報を取得（全問題から検索）
export async function getAtCoderProblem(problemId: string): Promise<AtCoderProblemInfo | null> {
  try {
    const problems = await getAllProblems()
    return problems.find((p) => p.id === problemId) || null
  } catch (error) {
    console.error("Error fetching problem info:", error)
    return null
  }
}

// コンテスト情報を取得
export async function getAtCoderContest(contestId: string) {
  try {
    const response = await fetch(`${ATCODER_API_BASE}/contest/${contestId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch contest info")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching contest info:", error)
    throw error
  }
}

// リクエスト間にスリープ（レートリミット回避）
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
