# 実装待ち機能・開発ロードマップ (ROADMAP)

**最終更新**: 2026-05-09

---

## 🚀 現在のフェーズ

### 第4フェーズ：サイトの拡張・外部連携
**目的**: サイトを閉じなくても通知を受け取れる仕組みを構築

| ステップ | ステータス | 説明 |
|----------|----------|------|
| ステップ1: Chrome拡張機能基本実装 | ✅ | 通知、クイックアクセス |
| ステップ2: Google OAuth 2.0連携 | ✅ | Googleアカウント認証、アクセストークン管理 |
| ステップ3: Google Tasks同期 | ✅ | タスクの双方向同期、タスクリスト選択 |
| ステップ4: 通知機能の強化 | 🔲 | 通知音、カスタマイズ、アクションボタン |
| ステップ5: パッケージ化と配布 | 🔲 | Chrome Web Store提出 |
| ステップ6: Notion連携 | 🔲 | データベース同期、タスク管理 |
| ステップ7: パフォーマンス最適化 | 🔲 | ヒートマップ、遅延読み |

---

## 🔲 実装待ち機能

### 優先度：高（1週間以内）

#### 1. 通知機能の強化
**説明**: より高度な通知機能を実装

**機能**:
- [ ] 通知音の設定
- [ ] 通知時間のカスタマイズ（即時・1時間前・1日前など）
- [ ] アクションボタン（通知から直接タスク完了、コンテストページを開く）
- [ ] 通知履歴の保持期間設定

**技術的ポイント**:
- Audio API for通知音
- chrome.notifications API forボタン
- NotificationLogモデルの拡張

**関連ファイル**:
- `extension/background.js`
- `components/layout/notification-icon.tsx`

---

#### 2. Chrome拡張機能のパッケージ化
**説明**: Chrome Web Store提出準備

**タスク**:
- [ ] PNGアイコン作成（16x16, 48x48, 128x128）
- [ ] スクリーンショット撮影（1280x800px）
- [ ] プライバシーポリシー作成
- [ ] ストア説明作成（日本語・英語）
- [ ] 本番URLのhost_permissions設定

**関連ファイル**:
- `extension/manifest.json`
- `extension/README.md`

---

### 優先度：中（2週間以内）

#### 3. パフォーマンス最適化
**説明**: サイト全体のパフォーマンスを改善

**タスク**:
- [ ] ヒートマップの最適化
  - [ ] 仮想スクロール
  - [ ] データのキャッシング
  - [ ] 必要に応じてCanvasレンダリング
- [ ] 画像の遅延読み（next/image活用）
- [ ] コード分割（動的インポート）

**技術的ポイント**:
- React Virtual for仮想スクロール
- next/image with placeholder
- dynamic import forルートベース分割

**関連ファイル**:
- `components/hub/atcoder/heatmap.tsx`
- `next.config.js`

---

#### 4. 他サービス連携（オプション）
**説明**: Notionと連携

**Notion API連携**:
- [ ] タスクをNotionデータベースに同期
- [ ] Notionの更新をサイトに反映
- [ ] OAuth 2.0認証フロー

**Google Tasks API連携**: ✅ 完了
- [x] Google Tasksとタスク管理アプリを同期
- [x] Googleカレンダーとの統合強化

**技術的ポイント**:
- OAuth 2.0 for認証 ✅
- APIレート制限対応
- 競合解消（双方向同期時のコンフリクト回避）

---

### 優先度：低（1ヶ月以内）

#### 5. メール通知（オプション）
**説明**: サイトを開いていなくても通知

**タスク**:
- [ ] Resend/SendGrid統合
- [ ] 通知テンプレート作成
- [ ] 配信設定（即時、1日1回、1週1回）
- [ ] 配信停止機能

---

#### 6. データインポート機能
**説明**: エクスポートしたデータを復元

**タスク**:
- [ ] JSON/CSVからのインポート
- [ ] データ検証
- [ ] 衝突解決（上書き/スキップ/マージ）

---

#### 7. グラフ・レポート機能（拡張）
**説明**: より詳細な分析機能

**タスク**:
- [ ] Rechartsでの高度なグラフ
- [ ] 月次・年次レポート
- [ ] PDF出力
- [ ] カスタムレポート作成

---

## 📋 過去のフェーズ（完了）

### 第1フェーズ：MVP ✅
- ポートフォリオサイト
- アプリケーションハブ（6アプリ）
- 認証システム

### 第2フェーズ：AtCoder連携 ✅
- AtCoder Problems API連携
- 定期同期
- 統計ダッシュボード
- ヒートマップ

### 第3フェーズ：習慣化・通知 ✅
- コンテストスケジュール
- リマインダーシステム
- ブラウザ通知
- Google Calendar連携
- PWA対応

---

## 🎯 今後の長期計画

### 第5フェーズ：AI連携（将来）

#### 概要
AtCoder学習サポートLLM機能を実装し、ユーザーの競プロ学習をAIで支援する。

#### 機能1: 問題推薦システム
**説明**: ユーザーのレート・解答状況・学習履歴から最適な問題を推薦

**実装内容**:
- [ ] ユーザーのAC状況・苦手なジャンルを分析
- [ ] レートに応じた問題推薦（abc-c/abc-d/arc-a等）
- [ ] 学習目的に応じたカリキュラum生成
  - DP強化
  - グラフ理論
  - 文字列/正規表現
  - 数学・数論
- [ ] 過去の類似問題を推薦（復習支援）

**技術的ポイント**:
- Claude API / OpenAI API使用
- AtCoder Problems APIで問題メタデータ取得
- ユーザーの提出履歴を分析
- タグベースの問題分類（difficulty/algorithm）

**関連ファイル**:
- `app/api/hub/atcoder/recommendations/`
- `components/hub/atcoder/recommendation-card.tsx`

---

#### 機能2: コード分析・改善提案
**説明**: 提出コードをLLMが分析し、改善点を提案

**実装内容**:
- [ ] 提出コードの自動取得
- [ ] LLMによるコードレビュー
  - バグ発見
  - 計算量分析
  - 実装の簡素化提案
  - Python/C++のベストプラクティス
- [ ] 改善コードの生成
- [ ] 公式解説との比較

**技術的ポイント**:
- AtCoder APIから提出ソース取得
- GitHub Copilot API / Claude Code Analysis API
- AST（抽象構文木）を使用したコード解析
- タイムスタンプ・メモリ使用量の分析

**関連ファイル**:
- `app/api/hub/atcoder/analyze/[submissionId]/route.ts`
- `components/hub/atcoder/code-review.tsx`

---

#### 機能3: 学習アドバイス・Q&A
**説明**: ユーザーの疑問をLLMが回答

**実装内容**:
- [ ] 問題文に対するヒント生成
- [ ] 解法の説明生成
  - アルゴリズムの選択理由
  - 時間計算量・空間計算量の解説
- [ ] 間違えた問題の解説
- [ ] チャットボット形式での質問応答

**技術的ポイント**:
- RAG（検索拡張生成）で公式解説・過去の質問を参照
- Vector Database（Pinecone/Qdrant）で解説をembed
- LangChain / Vercel AI SDK

**関連ファイル**:
- `app/api/ai/qa/route.ts`
- `components/hub/atcoder/qa-chat.tsx`

---

#### 機能4: 学習プラン自動生成
**説明**: 目標（色・レート・期間）から学習計画を生成

**実装内容**:
- [ ] 目標入力（例: 3ヶ月で水色になる）
- [ ] 現在のレート・AC状況の分析
- [ ] 日次・週次学習タスクの生成
- [ ] 進捗管理とプランの動的調整

**技術的ポイント**:
- ユーザーの過去の成長速度から実現可能性を判断
- Virtual Contestの作成支援
- 学習時間の記録・分析

**関連ファイル**:
- `app/api/ai/learning-plan/route.ts`
- `app/hub/learning-plan/`

---

#### 技術スタック
| カテゴリ | 技術選択 |
|----------|----------|
| LLM API | Claude 3.5 Sonnet / GPT-4o |
| Vector DB | Pinecone / Qdrant Cloud |
| AI SDK | Vercel AI SDK / LangChain |
| Frontend | AI SDK Components (useChat, useCompletion) |
| RAG | AtCoder公式解説、ユーザー投稿解説 |

---

#### 実装スケジュール（予定）

**Phase 1: 問題推薦システム（2週間）**
- ユーザー分析ロジック実装
- Claude APIで推薦ロジック実装
- UI/UX実装

**Phase 2: コード分析（2週間）**
- 提出コード取得
- LLM分析パイプライン構築
- 結果表示UI

**Phase 3: 学習アドバイス（1週間）**
- Q&Aチャット実装
- RAGシステム構築
- ヒント生成機能

**Phase 4: 学習プラン生成（1週間）**
- 目標設定UI
- プラン生成ロジック
- 進捗管理機能

---

#### コスト見積もり（月間）
| サービス | 利用想定 | 概算費用 |
|----------|----------|----------|
| Claude API | 100万tokens/月 | ~$15 |
| Pinecone | 1万ベクトル | ~$20 |
| 合計 | - | ~$35/月 |

---

#### 参考資料
- [AtCoder Problems API](https://kenkoooo.com/atcoder/resources/)
- [AtCoderヒント集 - GitHub](https://github.com/kenkoooo/AtCoderProblems)
- [公式解説アーカイブ](https://github.com/atcoder/library_checker)

---

## 📊 進捗管理

### 完了基準
各機能は以下が完了したら「完了」とする：
1. [ ] 実装完了
2. [ ] テスト完了
3. [ ] ドキュメント更新（STATUS.md）
4. [ ] 動作確認

### 進捗更新ルール
- 機能実装完了 → STATUS.mdの「実装済み機能」に移動
- 設計変更 → GUIDELINES.mdを更新
- 新機能発見 → このROADMAP.mdに追加

---

## 🔗 関連ファイル

- [STATUS.md](STATUS.md) - 現状の実装内容
- [GUIDELINES.md](GUIDELINES.md) - 設計方針・開発ガイドライン
