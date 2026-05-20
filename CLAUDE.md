# Portfolio Hub - プロジェクト固有の指示

**最終更新**: 2026-05-19

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

## 🛠️ 利用可能なリソース

### グローバルスキル（全プロジェクトで使用可能）

- **/deploy**: デプロイ前チェックからGitHubプッシュまでの自動デプロイワークフロー
- **/api-debug**: 外部API統合のデバッグワークフロー

### プロジェクト固有スキル

- **/atcoder-test**: AtCoder関連機能のテスト・検証ワークフロー

### グローバルエージェント（自律マルチエージェントシステム）

`C:\Users\kerox\.claude\agents\` に配置された自律エージェントが使用可能です：

- **TDD Pipeline Agent**: テスト駆動開発の自動化
- **Refactoring Squad Agent**: アーキテクチャ分析とリファクタリング提案
- **Enhanced Deployment Agent**: 自己修復機能付きデプロイメントシステム

詳細は `C:\Users\kerox\.claude\agents\advanced-multi-agent-system.md` を参照してください。

---

## 📚 汎用的な開発ガイドライン

以下のガイドラインは `C:\Users\kerox\.claude\templates\CLAUDE-GENERIC.md` に詳細が記載されています：

- **Cache Management**: API/DB変更後のキャッシュクリア手順
- **Pre-deployment Checklist**: 本番デプロイ前の4ステップ確認
- **Testing**: フィルタリングロジックの検証手順
- **Database**: PostgreSQL互換性とスキーマ変更手順
- **TypeScript/JavaScript**: 日本語文字列のエスケープ注意点
- **API Integration**: 外部APIデバッグの手順
- **Next.js 14+**: Metadata APIとshadcn/uiの使用法

プロジェクトをまたいだ開発規約はグローバルテンプレートを参照してください。

---

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

### Pre-deployment Checklist（本番デプロイ前のチェックリスト）

Vercelへの本番デプロイ前に、必ず以下の手順で確認してください：

1. **TypeScriptの型チェック**

   ```bash
   pnpm type-check
   ```

   全ての警告を修正してから進めてください

2. **キャッシュクリア**

   ```bash
   rm -rf .next
   ```

3. **ビルド検証**

   ```bash
   pnpm build
   ```

   ビルドが成功することを確認してください

4. **デプロイ実行**

   上記全てが成功した後のみ、Vercelにデプロイしてください

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

## TypeScript/JavaScript

### 日本語文字列のエスケープ

- テンプレートリテラル内で日本語を含む文字列を使用する場合、バッククォートや特殊文字のエスケープに注意してください
- 特に、バッククォートを含む日本語文字列ではエスケープ処理が必要です

```tsx
// ❌ 問題例
const message = ``こんにちは``; // バッククォートが競合

// ✅ 正しい例
const message = `\`こんにちは\``; // エスケープする
// または
const message = '`こんにちは`'; // シングルクォートを使用
```

---

## Next.js Configuration

### Metadata API

- Next.js 14+では、非推奨のmetaタグではなくモダンなmetadata APIを使用してください

### shadcn/uiコンポーネント

- shadcn/uiコンポーネントとその依存関係（`@radix-ui/react-dialog`など）が正しくインストールされていることを確認してください
- UI機能実装前に、必要なコンポーネントと依存関係をリストアップし、不足している場合は先にインストールしてください
