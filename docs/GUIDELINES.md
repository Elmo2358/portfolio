# 設計方針・開発ガイドライン (GUIDELINES)

**最終更新**: 2026-05-07

このファイルは開発者が常に参照すべき設計方針と、AIエージェントが従うべきルールを記述しています。

---

## 🎨 デザインシステム

### カラーパレット

#### Emeraldベースの緑系
| 用途 | クラス | ライト | ダーク |
|------|--------|--------|--------|
| メイン背景 | `bg-emerald-50` | #f0fdf4 | `bg-emerald-950` |
| カード背景 | `bg-emerald-100` | #d1fae5 | `bg-emerald-900` |
| ボーダー | `border-emerald-500` | #10b981 | `border-emerald-600` |
| テキスト | `text-emerald-600` | #059669 | `text-emerald-400` |
| ホバー | `hover:bg-emerald-700` | #047857 | `hover:bg-emerald-800` |

#### 使用ルール
- **カード**: `bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-500 dark:border-emerald-600`
- **ボタン**: `bg-emerald-600 hover:bg-emerald-700 text-white`
- **見出し**: `text-emerald-600 dark:text-emerald-400`

### アニメーション

#### Framer Motion（優先）
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

#### CSSアニメーション（globals.css）
```css
.animate-fadeIn { animation: fadeIn 0.5s ease-out; }
.animate-slideUp { animation: slideUp 0.5s ease-out; }
```

#### ページ遷移
- `template.tsx` で `PageTransition` コンポーネントを使用
- フェードイン・フェードアウト（0.3秒）

---

## 🏗️ アーキテクチャ

### Server Component vs Client Component

#### Server Component（デフォルト）
- データ取得（Prisma）
- ページコンポーネント
- 一覧表示

#### Client Component（"use client"）
- インタラクション（onClick, onChange）
- フォーム
- アニメーション（Framer Motion）
- ブラウザAPI（Notification, localStorage）

### コンポーネント間のデータ渡し

#### iconの渡し方（重要！）
```tsx
// ❌ 悪い例（Server→Clientでエラー）
<ClientComponent icon={Code} />

// ✅ 良い例（JSXとして渡す）
<ClientComponent icon={<Code className="h-12 w-12 text-white" />} />

// Client Component側
interface Props {
  icon: ReactNode  // LucideIcon ではなく ReactNode
}

export function ClientComponent({ icon }: Props) {
  return (
    <div>
      {typeof icon === 'object' && 'type' in icon
        ? <icon.type {...icon.props} className="..." />
        : icon
      }
    </div>
  )
}
```

---

## 📁 ファイル命名規則

### ページ
- `app/[page-name]/page.tsx` - ページコンポーネント
- `app/[page-name]/layout.tsx` - ページ固有のレイアウト

### コンポーネント
- `components/[category]/[name].tsx` - カテゴリ別に整理
  - `components/layout/` - レイアウト関連
  - `components/hub/` - ハブ用
  - `components/dashboard/` - ダッシュボード用
  - `components/ui/` - shadcn/ui

### API
- `app/api/[category]/[resource]/route.ts` - REST API

---

## 🔐 認証・認可

### ページ保護
```tsx
// ハブ内ページは自動的に認証チェック（hub/layout.tsx）
export default function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  return <div>{children}</div>
}
```

### API保護
```tsx
// Server Component内から呼ぶため、認証は不要
// 必要に応じて session.userId でユーザー識別
```

---

## 🗄️ データベース操作

### Prisma使用ルール
```tsx
// Server Componentのみで使用
import { prisma } from "@/lib/prisma"

const items = await prisma.item.findMany({
  where: { userId: session.user.id },
  orderBy: { createdAt: 'desc' }
})
```

### スキーマ変更手順
1. `prisma/schema.prisma` を編集
2. `npx prisma migrate dev --name [description]`
3. 型が自動生成される

---

## 🌐 外部API連携

### AtCoder Problems API (Kenkoooo API)
```typescript
// lib/atcoder.ts
// リクエスト間に1秒以上のスリープを入れる
await new Promise(resolve => setTimeout(resolve, 1000))
```

### CLIST API
- 認証が必要（APIキー）
- モックデータフォールバック実装済み

### Google Calendar API
- アクセストークン直入力（OAuth未実装）
- `/api/hub/atcoder/calendar` でイベント追加

---

## 🔔 通知システム

### リマインダー設定
```tsx
// ReminderButton コンポーネントを使用
<ReminderButton
  itemId={item.id}
 itemType="task"
  defaultReminders={item.reminders}
/>
```

### 通知送信
- Cronジョブ：15分ごとにチェック
- 通知タイミング：24時間前、1時間前
- 通知方法：アプリ内（Toast）+ ブラウザ（Web Push）

---

## 📱 PWA対応

### manifest.json
- name, short_name
- display: standalone
- shortcuts: Hubへのクイックアクセス

### Metaタグ
```tsx
// app/layout.tsx
<mobile-web-app-capable="yes">
<apple-mobile-web-app-capable="yes">
<apple-mobile-web-app-status-bar-style="default">
```

---

## 🧪 テスト・デバッグ

### 開発用API
- `/api/debug/cron` - Cronジョブ手動実行
- `/api/debug/trigger-notifications` - 通知手動送信
- `/api/debug/check-reminders` - リマインダー確認

### デバッグ手順
1. `.next` キャッシュ削除：`rm -rf .next`
2. サーバー再起動：`npm run dev`
3. ブラウザDevToolsで確認

---

## 🚀 デプロイ

### Vercel環境変数（必須）
```
DATABASE_URL=...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=...
CRON_SECRET=...
```

### Cronジョブ
- `vercel.json` で自動設定
- デプロイ後自動実行開始

---

## 📝 コミットルール

### コミットメッセージ形式
```
feat: 新機能
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
style: フォーマット
chore: その他
```

---

## 🎯 AIエージェントへの指示

### 常に従うべきルール
1. **icon渡し**: Server→ClientではJSXとして渡す
2. **カラーシステム**: Emeraldベースを守る
3. **ファイル構成**: カテゴリ別に整理
4. **認証**: hub内は自動保護
5. **DB操作**: Server Componentのみ
6. **アニメーション**: Framer Motionを優先

### 変更時の更新ルール
- 機能追加 → `STATUS.md` の「実装済み機能」を更新
- 設計変更 → `GUIDELINES.md` の該当セクションを更新
- 新機能予定 → `ROADMAP.md` に追加

### ファイル変更前の確認
1. `STATUS.md` で現状を確認
2. `GUIDELINES.md` で設計方針を確認
3. `ROADMAP.md` で重複ないか確認

---

## 🔗 関連ファイル

- [STATUS.md](STATUS.md) - 現状の実装内容
- [ROADMAP.md](ROADMAP.md) - 実装待ち機能
