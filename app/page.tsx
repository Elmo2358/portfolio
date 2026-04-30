import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Radio, Network, Database, User, Award, Briefcase, FolderOpen, Sparkles, Code, Mail } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative container flex min-h-[calc(100vh-4rem)] items-center justify-center py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 -z-10" />

        {/* Decorative gradient blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob dark:bg-blue-900" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 dark:bg-purple-900" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 dark:bg-indigo-900" />

        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full border-2 border-emerald-500 bg-emerald-100 px-4 py-1.5 text-sm dark:border-emerald-600 dark:bg-emerald-900 animate-fadeIn">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse dark:bg-emerald-500"></span>
            2024年入学 | 情報理工学域Ⅱ類 3年
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl text-emerald-600 dark:text-emerald-400 animate-fadeIn delay-100">
            Elmo
          </h1>
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl animate-fadeIn delay-200">
            電気通信大学 情報理工学域Ⅱ類 情報通信工学プログラム
          </p>
          <p className="mb-12 text-lg text-muted-foreground animate-fadeIn delay-300">
            通信技術の未来を創造したい。情報通信工学を学んでいます。
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-fadeIn delay-400">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/about">自己紹介を見る</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500" asChild>
              <Link href="/projects">プロジェクトを見る</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Skills Overview */}
      <section className="border-t bg-gradient-to-b from-muted/50 to-background py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
            専攻分野
          </h2>
          <div className="grid gap-6 md:grid-cols-3 stagger-300">
            <div className="animate-slideUp delay-100">
              <Card className="border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                      <Radio className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-700 dark:text-emerald-300">無線通信</CardTitle>
                      <CardDescription className="text-emerald-600 dark:text-emerald-400">Wireless Communication</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    無線通信技術の基礎から応用まで幅広く学習しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">5G/6G</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">アンテナ</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">信号処理</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="animate-slideUp delay-200">
              <Card className="border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-600">
                      <Network className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-700 dark:text-emerald-300">通信工学</CardTitle>
                      <CardDescription className="text-emerald-600 dark:text-emerald-400">Communication Engineering</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    通信ネットワークと信号処理について研究しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">ネットワーク</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">プロトコル</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">伝送</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="animate-slideUp delay-300">
              <Card className="border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-600">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-emerald-700 dark:text-emerald-300">情報理論</CardTitle>
                      <CardDescription className="text-emerald-600 dark:text-emerald-400">Information Theory</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    情報の符号化と伝送効率について学習しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">符号化</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">情報量</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">通信路</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            コンテンツ
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/about" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">自己紹介</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">About Me</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    経歴や趣味・興味について
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/qualifications" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">資格・試験</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">Qualifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">TOEIC</Badge>
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400">技術者試験</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/skills" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">技術スタック</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">Skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    使用できる技術一覧
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">プロジェクト</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">Projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    制作したプロジェクトや作品
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/contact" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">連絡先</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">Contact</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    SNSや連絡先情報
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/internships" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-600 dark:hover:bg-emerald-900">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-500">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">実習</CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">Internships</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    参加したインターンシップや実習
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
