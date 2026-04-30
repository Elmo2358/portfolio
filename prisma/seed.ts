import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 管理者ユーザーを作成
  const admin = await prisma.user.upsert({
    where: { email: 'admin@portfolio.local' },
    update: {},
    create: {
      email: 'admin@portfolio.local',
      name: 'Elmo',
      role: 'admin',
    },
  })

  console.log('ユーザーを作成しました:', admin.name)

  // 既存のデータを完全に削除
  await prisma.qualification.deleteMany({})
  await prisma.internship.deleteMany({})
  await prisma.teamExperience.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.skill.deleteMany({})

  console.log('既存のデータを完全に削除しました')

  // 資格・試験データ
  const qualifications = [
    {
      name: '応用情報技術者試験',
      score: '今年再受験予定',
      date: new Date('2025-10-01'),
      description: '',
      category: '技術',
      displayOrder: 1,
      userId: admin.id,
    },
    {
      name: 'ITパスポート',
      score: '合格',
      date: new Date('2024-12-01'),
      description: '',
      category: '技術',
      displayOrder: 2,
      userId: admin.id,
    },
    {
      name: 'TOEIC',
      score: '650点',
      date: new Date('2026-03-01'),
      description: '2026年3月時点',
      category: '語学',
      displayOrder: 3,
      userId: admin.id,
    },
    {
      name: '英検準2級',
      score: '合格',
      date: new Date('2022-01-01'),
      description: '高校生時に取得',
      category: '語学',
      displayOrder: 4,
      userId: admin.id,
    },
    {
      name: '陸上無線技術士（1陸特）',
      score: '受験予定',
      date: new Date('2026-06-01'),
      description: '2026年6月受験予定',
      category: '技術',
      displayOrder: 5,
      userId: admin.id,
    },
  ]

  for (const qual of qualifications) {
    await prisma.qualification.create({
      data: qual,
    })
  }

  console.log('資格・試験データを作成しました')

  // サークル活動・チーム開発経験
  const teamExperiences = [
    {
      title: '副代表',
      organization: 'team411',
      period: '2026年4月 - 現在',
      description: '組織運営、全体のマネジメント',
      learned: 'リーダーシップ、組織運営、意思決定',
      role: '副代表',
      displayOrder: 1,
      userId: admin.id,
    },
    {
      title: '経営企画本部長',
      organization: 'team411',
      period: '2025年10月 - 2026年3月',
      description: '経営戦略・企画の立案',
      learned: '戦略的思考、企画立案',
      role: '役員',
      displayOrder: 2,
      userId: admin.id,
    },
    {
      title: 'team411lab部長',
      organization: 'team411',
      period: '2025年4月 - 2025年9月',
      description: '技術部門のリーダー',
      learned: '技術マネジメント、メンター業務',
      role: '役員',
      displayOrder: 3,
      userId: admin.id,
    },
    {
      title: '新入部員研修運営＆記事執筆',
      organization: 'team411',
      period: '2024年4月 - 現在',
      description: 'Python基礎文法、基礎アルゴリズム、チーム開発の進め方、VSCode、Git/GitHubの使い方など全38記事の執筆',
      learned: '教育設計、技術文書執筆、メンタリング',
      role: '講師・執筆者',
      displayOrder: 4,
      userId: admin.id,
    },
    {
      title: 'りさナビ開発',
      organization: '個人プロジェクト',
      period: '2025年1月 - 現在',
      description: 'LLMチャットアプリのフロントエンドとデプロイ（AIの指示を受けながら）',
      learned: 'React/Next.js、Vercel、GCP Job、フロントエンド開発',
      role: 'フロントエンド開発',
      displayOrder: 5,
      userId: admin.id,
    },
    {
      title: 'VRChatワールド制作',
      organization: 'team411',
      period: '2024年10月 - 2025年11月',
      description: 'チームでVRChatのワールドを開発',
      learned: 'チーム開発、Unity',
      role: 'メンバー',
      displayOrder: 6,
      userId: admin.id,
    },
    {
      title: 'Discord Bot開発',
      organization: 'team411',
      period: '2025年',
      description: '合宿でチームでDiscord Botを開発',
      learned: 'discord.py, discord.js、チーム開発',
      role: '開発メンバー',
      displayOrder: 7,
      userId: admin.id,
    },
    {
      title: 'アニメーション作成',
      organization: '大学講義',
      period: '2025年7月',
      description: '大学の講義でアニメーションを作成するチーム開発',
      learned: 'PMとしてのチーム管理、タスク管理',
      role: 'PM（プロジェクトマネージャー）',
      displayOrder: 8,
      userId: admin.id,
    },
  ]

  for (const exp of teamExperiences) {
    await prisma.teamExperience.create({
      data: exp,
    })
  }

  console.log('サークル活動・チーム開発経験データを作成しました')

  // プロジェクトデータ
  const projects = [
    {
      title: 'りさナビ',
      description: '大学のシラバスや学習要覧の内容を答えてくれるLLMチャットボット。React、Next.jsを使用してフロントエンドとデプロイを完了（AIの指示を受けながら）。現在は継続開発中。',
      technologies: JSON.stringify(['React', 'Next.js', 'TypeScript', 'Vercel', 'GCP Job', 'LLM']),
      githubUrl: 'https://github.com/Elmo2358',
      displayOrder: 1,
      userId: admin.id,
    },
    {
      title: 'Discord Bot（会話要約）',
      description: 'チャンネル内の会話内容を要約してくれるボット。Python (discord.py) で開発。',
      technologies: JSON.stringify(['Python', 'discord.py', '自然言語処理']),
      displayOrder: 2,
      userId: admin.id,
    },
    {
      title: 'Discord Bot（丁半）',
      description: 'コマンドで丁半ができるボット。Node.js (discord.js) で開発。',
      technologies: JSON.stringify(['Node.js', 'discord.js', 'JavaScript']),
      displayOrder: 3,
      userId: admin.id,
    },
    {
      title: 'シューティングゲーム（Godot）',
      description: '決められた範囲の敵を自分から出る球を当てて倒すシンプルなシューティングゲーム。Godot Engineで開発。',
      technologies: JSON.stringify(['Godot Engine', 'GDScript']),
      displayOrder: 4,
      userId: admin.id,
    },
    {
      title: 'VRChatギミック実装（Unity）',
      description: 'VRChat用のゲームギミック実装。ワープ処理やドアを開くボタンなどを作成。',
      technologies: JSON.stringify(['Unity', 'C#', 'VRChat SDK', 'UdonSharp']),
      displayOrder: 5,
      userId: admin.id,
    },
    {
      title: 'タイタニック号生存者分析',
      description: '大学の課題で実施。タイタニック号の乗客データを分析し、生存者の傾向を調査。',
      technologies: JSON.stringify(['Python', 'pandas', 'matplotlib', 'データ分析']),
      displayOrder: 6,
      userId: admin.id,
    },
    {
      title: 'Jリーグ観客動員数分析',
      description: '大学の課題で実施。Jリーグの観客動員数に影響する要因を分析。スタジアムの住所、参加チーム、天気などからの多変量解析。',
      technologies: JSON.stringify(['Python', 'pandas', 'データ分析', '統計解析']),
      displayOrder: 7,
      userId: admin.id,
    },
  ]

  for (const proj of projects) {
    await prisma.project.create({
      data: proj,
    })
  }

  console.log('プロジェクトデータを作成しました')

  // スキルデータ
  const skills = [
    {
      name: 'TypeScript',
      category: 'プログラミング言語',
      level: 3,
      description: 'Web開発で使用。型安全なコードを書ける。',
      displayOrder: 1,
      userId: admin.id,
    },
    {
      name: 'JavaScript',
      category: 'プログラミング言語',
      level: 3,
      description: 'Web開発で使用。',
      displayOrder: 2,
      userId: admin.id,
    },
    {
      name: 'Next.js',
      category: 'フレームワーク',
      level: 3,
      description: 'このポートフォリオサイトやりさナビで使用。Reactベースのフルスタックフレームワーク。',
      displayOrder: 3,
      userId: admin.id,
    },
    {
      name: 'React',
      category: 'フレームワーク',
      level: 3,
      description: 'Next.jsの一部として使用。',
      displayOrder: 4,
      userId: admin.id,
    },
    {
      name: 'Tailwind CSS',
      category: 'CSSフレームワーク',
      level: 2,
      description: 'このポートフォリオサイトで使用。ユーティリティファーストのCSSフレームワーク。',
      displayOrder: 5,
      userId: admin.id,
    },
    {
      name: 'HTML/CSS',
      category: 'Web技術',
      level: 3,
      description: 'Web開発の基礎。',
      displayOrder: 6,
      userId: admin.id,
    },
    {
      name: 'Python',
      category: 'プログラミング言語',
      level: 2,
      description: '基礎文法を理解。データ分析でpandasを使用。',
      displayOrder: 7,
      userId: admin.id,
    },
    {
      name: 'Git/GitHub',
      category: 'ツール',
      level: 4,
      description: '日常的に使用。仕組みを理解している。ブランチ管理、プルリクエスト、マージ等の操作に慣れている。',
      displayOrder: 8,
      userId: admin.id,
    },
    {
      name: 'C言語',
      category: 'プログラミング言語',
      level: 1,
      description: '大学の授業で学習。',
      displayOrder: 9,
      userId: admin.id,
    },
    {
      name: 'Ruby',
      category: 'プログラミング言語',
      level: 1,
      description: '大学の授業で学習。',
      displayOrder: 10,
      userId: admin.id,
    },
    {
      name: 'データベース',
      category: 'インフラ',
      level: 2,
      description: '応用情報レベルの知識。Prisma + SQLite/PostgreSQLで使用経験あり。',
      displayOrder: 11,
      userId: admin.id,
    },
    {
      name: 'Vercel',
      category: 'インフラ',
      level: 3,
      description: 'Webアプリのデプロイで使用。',
      displayOrder: 12,
      userId: admin.id,
    },
    {
      name: 'Godot Engine',
      category: 'ゲーム開発',
      level: 1,
      description: '簡単なシューティングゲームを作成。',
      displayOrder: 13,
      userId: admin.id,
    },
    {
      name: 'Unity',
      category: 'ゲーム開発',
      level: 1,
      description: 'VRChat用ギミック実装で使用。',
      displayOrder: 14,
      userId: admin.id,
    },
  ]

  for (const skill of skills) {
    await prisma.skill.create({
      data: skill,
    })
  }

  console.log('スキルデータを作成しました')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
