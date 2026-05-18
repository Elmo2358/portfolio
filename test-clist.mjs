// CLIST APIテストスクリプト
import { getUpcomingContests } from './lib/clist.ts'

async function test() {
  console.log('Testing CLIST API...')

  // 環境変数からAPIキーを取得
  const apiKey = process.env.CLIST_API_KEY

  if (!apiKey) {
    console.error('CLIST_API_KEY is not set in environment variables')
    console.log('Please set it with: export CLIST_API_KEY=your_key_here')
    process.exit(1)
  }

  console.log(`Using API key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`)

  try {
    const contests = await getUpcomingContests(apiKey, ['atcoder.jp'], 5)

    console.log(`\nFound ${contests.length} contests:`)
    contests.forEach(c => {
      const startDate = new Date(c.start)
      console.log(`- ${c.event}`)
      console.log(`  Start: ${startDate.toLocaleString('ja-JP')}`)
      console.log(`  Duration: ${c.duration}`)
      console.log(`  URL: ${c.href}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

test()
