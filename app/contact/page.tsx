import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Github, ExternalLink } from "lucide-react"

export default function ContactPage() {
  const contacts = [
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/Elmo2358',
      description: 'コードやプロジェクトを公開しています',
      color: 'bg-slate-900 dark:bg-slate-700'
    },
    {
      name: 'Qiita',
      icon: ExternalLink,
      url: 'https://qiita.com/Elmo2358',
      description: '技術記事を投稿しています',
      color: 'bg-green-600 dark:bg-green-500'
    },
    {
      name: 'Zenn',
      icon: ExternalLink,
      url: 'https://zenn.dev/elmo2358',
      description: '技術ブログを公開しています',
      color: 'bg-blue-600 dark:bg-blue-500'
    }
  ]

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center animate-fadeIn">
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-emerald-600 dark:bg-emerald-500">
              <Mail className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            連絡先
          </h1>
          <p className="text-xl text-emerald-800 dark:text-emerald-200">Contact & Links</p>
        </div>

        <div className="space-y-6 stagger-200">
          {/* Email */}
          <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-emerald-700 dark:text-emerald-300">メールアドレス</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-800 dark:text-emerald-200">
                現在準備中です。近日中に公開予定です。
              </p>
            </CardContent>
          </Card>

          {/* SNS Links */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
              SNS・コード共有サイト
            </h2>
            {contacts.map((contact, index) => {
              const Icon = contact.icon
              return (
                <Card
                  key={contact.name}
                  className={`hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-600 animate-slideUp`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${contact.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-emerald-700 dark:text-emerald-300">{contact.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{contact.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500"
                        asChild
                      >
                        <Link href={contact.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          開く
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
