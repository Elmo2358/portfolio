import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Radio, Network, Database, User, Award, Briefcase, FolderOpen, Sparkles, Code, Mail } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Dark Teal Band */}
      <section className="relative bg-mongo-teal-deep text-on-dark min-h-[calc(100vh-4rem)] flex items-center py-hero">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center rounded-full border border-mongo-green bg-mongo-green/10 px-4 py-1.5 text-micro-uppercase text-mongo-green animate-fadeIn">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-mongo-green animate-pulse"></span>
              2024年入学 | 情報理工学域Ⅱ類 3年
            </div>
            <h1 className="mb-6 text-[56px] font-medium leading-[1.15] tracking-tight sm:text-[64px] md:text-[72px] text-on-dark animate-fadeIn delay-100">
              Elmo
            </h1>
            <p className="mb-8 text-subtitle text-on-dark-muted animate-fadeIn delay-200">
              電気通信大学 情報理工学域Ⅱ類 情報通信工学プログラム
            </p>
            <p className="mb-12 text-body-md text-on-dark-muted animate-fadeIn delay-300">
              通信技術の未来を創造したい。情報通信工学を学んでいます。
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center animate-fadeIn delay-400">
              <Button size="lg" className="bg-mongo-green text-mongo-teal-deep hover:bg-mongo-green-mid" asChild>
                <Link href="/about">自己紹介を見る</Link>
              </Button>
              <Button size="lg" className="bg-mongo-green text-mongo-teal-deep hover:bg-mongo-green-mid" asChild>
                <Link href="/projects">プロジェクトを見る</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Atmospheric gradient depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-mongo-teal via-mongo-teal-deep to-mongo-teal-mid opacity-50" />
      </section>

      {/* Skills Overview */}
      <section className="border-t border-border bg-muted/30 py-section">
        <div className="container">
          <h2 className="mb-12 text-center text-heading-2 text-foreground animate-fadeIn">
            専攻分野
          </h2>
          <div className="grid gap-6 md:grid-cols-3 stagger-300">
            <div className="animate-slideUp delay-100">
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-mongo-green/10">
                      <Radio className="h-6 w-6 text-mongo-green-dark" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">無線通信</CardTitle>
                      <CardDescription className="text-mongo-green-dark">Wireless Communication</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    無線通信技術の基礎から応用まで幅広く学習しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">5G/6G</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">アンテナ</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">信号処理</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="animate-slideUp delay-200">
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-mongo-green/10">
                      <Network className="h-6 w-6 text-mongo-green-dark" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">通信工学</CardTitle>
                      <CardDescription className="text-mongo-green-dark">Communication Engineering</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    通信ネットワークと信号処理について研究しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">ネットワーク</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">プロトコル</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">伝送</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="animate-slideUp delay-300">
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-mongo-green/10">
                      <Database className="h-6 w-6 text-mongo-green-dark" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">情報理論</CardTitle>
                      <CardDescription className="text-mongo-green-dark">Information Theory</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    情報の符号化と伝送効率について学習しています
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">符号化</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">情報量</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">通信路</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-section">
        <div className="container">
          <h2 className="mb-12 text-center text-heading-2 text-foreground">
            コンテンツ
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/about" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <User className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">自己紹介</CardTitle>
                  <CardDescription className="text-mongo-green-dark">About Me</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    経歴や趣味・興味について
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/qualifications" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">資格・試験</CardTitle>
                  <CardDescription className="text-mongo-green-dark">Qualifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">TOEIC</Badge>
                    <Badge className="bg-mongo-green-soft text-mongo-green-dark hover:bg-mongo-green-soft/80">技術者試験</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/skills" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <Code className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">技術スタック</CardTitle>
                  <CardDescription className="text-mongo-green-dark">Skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    使用できる技術一覧
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/projects" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <FolderOpen className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">プロジェクト</CardTitle>
                  <CardDescription className="text-mongo-green-dark">Projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    制作したプロジェクトや作品
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/contact" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">連絡先</CardTitle>
                  <CardDescription className="text-mongo-green-dark">Contact</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    SNSや連絡先情報
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/internships" className="group">
              <Card className="h-full transition-all hover:shadow-xl hover:-translate-y-1 border-border">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-mongo-green/10 group-hover:scale-110 transition-transform">
                    <Briefcase className="h-6 w-6 text-mongo-green-dark" />
                  </div>
                  <CardTitle className="text-foreground">実習</CardTitle>
                  <CardDescription className="text-mongo-green-dark">Internships</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
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
