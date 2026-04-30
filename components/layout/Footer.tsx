export function Footer() {
  return (
    <footer className="border-t border-emerald-200/50 bg-gradient-to-b from-muted/30 to-background py-8 md:py-12 dark:border-emerald-900/50">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          電気通信大学 情報理工学域2類
        </p>
        <p className="text-sm text-muted-foreground">
          Built with Next.js & TypeScript
        </p>
      </div>
    </footer>
  )
}
