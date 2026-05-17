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

export interface ClistCredentials {
  username: string
  apiKey: string
}

/**
 * ユーザーのCLIST API認証情報を取得
 */
export async function getClistCredentials(email: string): Promise<ClistCredentials | null> {
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { email },
    select: { clistApiKey: true, clistUsername: true, clistApiEnabled: true },
  })

  console.log("[getClistCredentials] email:", email)
  console.log("[getClistCredentials] user:", user)

  if (!user?.clistApiEnabled || !user?.clistApiKey) {
    console.log("[getClistCredentials] Returning null - enabled:", user?.clistApiEnabled, "apiKey:", !!user?.clistApiKey)
    return null
  }

  // clistUsernameがあれば使用、なければ環境変数から取得
  const username = user.clistUsername || process.env.CLIST_USERNAME || ""

  if (!username) {
    console.error("[getClistCredentials] CLIST username is not set")
    return null
  }

  console.log("[getClistCredentials] Returning credentials:", { username, apiKey: user.clistApiKey?.slice(0, 8) + "..." })
  return { username, apiKey: user.clistApiKey }
}

/**
 * デフォルトのCLIST API認証情報（環境変数）
 */
export function getDefaultClistCredentials(): ClistCredentials | null {
  const username = process.env.CLIST_USERNAME || ""
  const apiKey = process.env.CLIST_API_KEY || ""

  if (!username || !apiKey) {
    return null
  }

  return { username, apiKey }
}

/**
 * 今後のコンテストを取得
 * @param credentials - CLIST API認証情報
 * @param resources - フィルタするコンテストサイト（例: ["atcoder.jp", "codeforces.com"]）
 * @param limit - 取得件数（デフォルト: 20）
 */
export async function getUpcomingContests(
  credentials?: ClistCredentials | null,
  resources?: string[],
  limit: number = 20
): Promise<Contest[]> {
  if (!credentials) {
    console.warn("CLIST credentials not provided")
    return []
  }

  try {
    const params = new URLSearchParams()

    // CLIST APIがresourceフィルタを許可しないため、
    // まずは全コンテストを取得してからクライアント側でフィルタする

    // upcoming=trueの代わりにstart__gtを使用（より正確）
    const now = new Date().toISOString()
    params.append("start__gt", now)
    // より多くのコンテストを取得（フィルタ用）
    params.append("limit", (limit * 5).toString())
    params.append("order_by", "start")

    const url = `${CLIST_API_BASE}/contest/?${params.toString()}`

    const headers: HeadersInit = {
      // Django Tastypieの認証形式: ApiKey username:apikey
      "Authorization": `ApiKey ${credentials.username}:${credentials.apiKey}`,
      "Content-Type": "application/json"
    }

    console.log(`Fetching contests from: ${url}`)

    const response = await fetch(url, {
      headers,
      // キャッシュを30分間有効に（秒単位）- レートリミット対策
      next: { revalidate: 1800 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CLIST API error ${response.status}:`, errorText)
      console.error(`Request URL was: ${url}`)

      // レート制限エラー（429）の場合は空の配列を返す
      if (response.status === 429) {
        console.warn("CLIST API rate limit exceeded, returning empty contests array")
        return []
      }

      throw new Error(`CLIST API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("CLIST API response keys:", Object.keys(data))

    // Django Tastypieは meta と objects を返す
    if (!data.objects) {
      console.error("CLIST API response missing 'objects' key")
      return []
    }

    let contests = data.objects

    // デバッグ: 最初の数件のresource値をログ出力
    if (contests.length > 0) {
      console.log("Sample contest resources:", contests.slice(0, 5).map((c: Contest) => ({
        event: c.event,
        resource: c.resource,
        duration: c.duration
      })))
    }

    // リソースでフィルタ（クライアント側） - 部分一致に変更
    if (resources && resources.length > 0) {
      const beforeCount = contests.length
      contests = contests.filter((c: Contest) =>
        resources.some(r => c.resource.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(c.resource.toLowerCase()))
      )
      console.log(`Filtered ${beforeCount} → ${contests.length} contests for resources:`, resources)
      // フィルタ後の最初の数件をログ出力
      console.log("Filtered contests:", contests.slice(0, 5).map((c: Contest) => ({
        event: c.event,
        resource: c.resource
      })))
    }

    // 指定件数に制限
    contests = contests.slice(0, limit)

    console.log(`CLIST API returned ${contests.length} contests`)
    return contests
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
  credentials?: ClistCredentials | null
): Promise<Contest[]> {
  return getUpcomingContests(credentials, [site], 10)
}

/**
 * コンテスト情報をAIプロンプト用に整形
 */
export function formatContestsForAI(contests: Contest[]): string {
  if (contests.length === 0) {
    return "近日中の予定されたコンテストはありません。"
  }

  const now = new Date()
  const upcoming = contests
    .filter(c => new Date(c.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5) // 最大5件

  if (upcoming.length === 0) {
    return "近日中の予定されたコンテストはありません。"
  }

  return upcoming.map(c => {
    const startDate = new Date(c.start)
    const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const dateStr = startDate.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
    return `- ${c.event}（${dateStr}開催、あと${daysUntil}日）`
  }).join("\n")
}
