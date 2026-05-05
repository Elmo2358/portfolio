// CLIST API クライアント
// コンテストスケジュールを取得

const CLIST_API_BASE = "https://clist.by/api/v4"

export interface Contest {
  id: string
  event: string
  resource: string
  start: string // ISO 8601形式
  end: string // ISO 8601形式
  duration: string // 例: "02:00:00"
  href: string // コンテストページURL
  icons: Array<{
    source: string
    url: string
  }>
}

/**
 * 今後のコンテストを取得
 * @param username - CLISTのユーザー名（APIキー認証用）
 * @param apiKey - CLIST APIキー
 * @param resources - フィルタするコンテストサイト（例: ["atcoder.jp", "codeforces.com"]）
 * @param limit - 取得件数（デフォルト: 20）
 */
export async function getUpcomingContests(
  username?: string,
  apiKey?: string,
  resources?: string[],
  limit: number = 20
): Promise<Contest[]> {
  try {
    const params = new URLSearchParams()

    if (resources && resources.length > 0) {
      // resource__idではなくresource__nameでフィルタ
      resources.forEach(resource => {
        params.append("resource__name", resource)
      })
    }

    params.append("upcoming", "true")
    params.append("limit", limit.toString())
    params.append("order_by", "start")

    const url = `${CLIST_API_BASE}/contest/?${params.toString()}`

    const headers: HeadersInit = {}

    if (username && apiKey) {
      // CLIST APIの認証形式
      headers["Authorization"] = `Bearer ${username}:${apiKey}`
    }

    console.log(`Fetching contests from: ${url}`)

    const response = await fetch(url, {
      headers,
      // キャッシュを5分間有効に
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CLIST API error ${response.status}:`, errorText)
      throw new Error(`CLIST API error: ${response.status}`)
    }

    const data = await response.json()
    return data.objects || []
  } catch (error) {
    console.error("Error fetching contests:", error)
    throw error
  }
}

/**
 * 特定のサイトのコンテストのみを取得
 * @param site - コンテストサイト名（例: "atcoder.jp"）
 */
export async function getContestsBySite(
  site: string,
  username?: string,
  apiKey?: string
): Promise<Contest[]> {
  return getUpcomingContests(username, apiKey, [site], 10)
}
