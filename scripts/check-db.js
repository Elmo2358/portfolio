const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== データベースチェック ===\n')

  // ユーザー確認
  const users = await prisma.user.findMany()
  console.log(`ユーザー数: ${users.length}`)
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}`)
  })

  console.log('\n=== 就活データ ===')

  // 就活データ確認
  const jobApps = await prisma.jobApplication.findMany()
  console.log(`就活応募数: ${jobApps.length}`)
  jobApps.forEach(app => {
    console.log(`- ID: ${app.id}, 企業: ${app.company}, 職種: ${app.position}, ユーザーID: ${app.userId}`)
  })

  console.log('\n=== 検索テスト（アプリケーション側フィルタリング）===')

  // 検索テスト（アプリケーション側でフィルタリング）
  const firstUser = users[0]
  if (firstUser) {
    const allJobApps = await prisma.jobApplication.findMany({
      where: { userId: firstUser.id },
    })

    const query = 'test'
    const searchResults = allJobApps.filter(app =>
      app.company.toLowerCase().includes(query.toLowerCase()) ||
      (app.position && app.position.toLowerCase().includes(query.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(query.toLowerCase()))
    )

    console.log(`クエリ: "${query}"`)
    console.log(`検索結果数: ${searchResults.length}`)
    searchResults.forEach(app => {
      console.log(`- 企業: ${app.company}, 職種: ${app.position}, メモ: ${app.notes}`)
    })

    // 他のユーザーのデータも確認
    const secondUser = users[1]
    if (secondUser) {
      const secondUserJobApps = await prisma.jobApplication.findMany({
        where: { userId: secondUser.id },
      })

      const secondUserSearchResults = secondUserJobApps.filter(app =>
        app.company.toLowerCase().includes(query.toLowerCase()) ||
        (app.position && app.position.toLowerCase().includes(query.toLowerCase())) ||
        (app.notes && app.notes.toLowerCase().includes(query.toLowerCase()))
      )

      console.log(`\n--- 第二ユーザー (${secondUser.email}) ---`)
      console.log(`検索結果数: ${secondUserSearchResults.length}`)
      secondUserSearchResults.forEach(app => {
        console.log(`- 企業: ${app.company}, 職種: ${app.position}, メモ: ${app.notes}`)
      })
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
