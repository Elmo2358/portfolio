# Portfolio Hub - プロジェクト固有の指示

**最終更新**: 2026-05-07

---

## 🔴 最優先：必ず最初に読む

コーディング作業を開始する前に、必ず以下の順番でドキュメントを確認してください：

1. **docs/GUIDELINES.md** - 設計方針・開発ガイドライン
2. **docs/STATUS.md** - 現状の実装内容
3. **docs/ROADMAP.md** - 実装待ち機能（必要な場合）

**作業手順**:
1. 新機能追加 → `GUIDELINES.md` で設計方針を確認
2. 既存機能修正 → `STATUS.md` で現状を確認
3. 新機能計画 → `ROADMAP.md` と重複ないか確認

**変更時のルール**:
- 機能追加完了 → `STATUS.md` の「実装済み機能」を更新
- 設計変更 → `GUIDELINES.md` の該当セクションを更新
- 新機能予定 → `ROADMAP.md` に追加

---

## 🎯 よくある間違いを防ぐための注意点

### icon渡し（最重要）
```tsx
// ❌ 悪い例
<ClientComponent icon={Code} />

// ✅ 良い例
<ClientComponent icon={<Code className="..." />} />
```

### カラーシステム
- Emeraldベースを守る（`bg-emerald-50`, `text-emerald-600`, etc.）
- ライト/ダークモード両方を考慮（`dark:bg-emerald-950`, etc.）

### Server/Client Component
- データ取得はServer Component
- インタラクションはClient Component（`"use client"`）

---

## Development Workflow

### Cache Management（重要）

- APIルートやデータベーススキーマを変更した後は、必ず`.next`キャッシュをクリアし、devサーバーを再起動してください
- 手順: devサーバー停止 → `.next/cache`を削除 → サーバー再起動
- これを怠ると、古いデータが表示され続ける問題が発生します

---

## Testing

### Filtering Logicの検証

- フィルタリングロジックを実装時は、API → component props → client-side rendering の全データフローを確認してください
- 必ず実際のデータでテストし、フィルターが期待通り動作することを確認してください
- コンポーネントがどこから呼び出されているか、どのpropsが渡されているかをトレースしてください

---

## Database

### PostgreSQL互換性

- PostgreSQLの互換性問題を避けるため、生のSQLではなく常にPrismaクエリを使用してください
- データベース固有の構文問題を回避できます

---

## Next.js Configuration

### Metadata API

- Next.js 14+では、非推奨のmetaタグではなくモダンなmetadata APIを使用してください

### shadcn/uiコンポーネント

- shadcn/uiコンポーネントとその依存関係（`@radix-ui/react-dialog`など）が正しくインストールされていることを確認してください
- UI機能実装前に、必要なコンポーネントと依存関係をリストアップし、不足している場合は先にインストールしてください
