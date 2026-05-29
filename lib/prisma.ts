import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// データベースURLに接続プールパラメータを追加
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) return url

  // すでにパラメータがある場合はそのまま返す
  if (url.includes('?')) return url

  // サーバーレス環境向けの接続プール設定
  const params = new URLSearchParams({
    connection_limit: '1', // 接続数を1に制限
    pool_timeout: '10', // 接続タイムアウト
  })

  return `${url}?${params.toString()}`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

// 開発環境でのみグローバルにキャッシュ
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 本番環境での接続解放ハンドラー
if (process.env.NODE_ENV === 'production') {
  // サーバーレス環境での接続リーク防止
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
