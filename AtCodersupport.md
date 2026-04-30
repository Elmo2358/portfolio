# AI駆動型AtCoder学習支援および問題管理アプリケーションの最適設計・実装計画

## 1. 序論およびプロジェクトビジョン
競技プログラミング、特にAtCoderを利用したアルゴリズム学習は、ソフトウェアエンジニアの論理的思考力および実装力を飛躍的に向上させる。しかし、プラットフォーム単体では個人の詳細な学習履歴の管理、苦手分野の分析、およびパーソナライズされた学習パスの提供には限界がある。

ユーザーが要望する「自身のWebホームページに統合されたAtCoder問題管理アプリケーション」は、単なるCRUD（作成、読み取り、更新、削除）ベースの記録ツールにとどまらず、行動心理学に基づいた習慣化メカニズムと、大規模言語モデル（LLM）を活用した高度な自動チュータリングシステムを統合したプラットフォームとして設計されるべきである。

本報告書は、自律型コーディングエージェントが本アプリケーションを実装するための完全なアーキテクチャ設計、機能要件、およびデータ連携の戦略を提示する。要求された基本機能（問題登録、ステータス管理、統計ダッシュボード）を網羅した上で、手動入力の負荷を排除するAPI自動同期機構、C++の段階的学習をガイドするLLMアーキテクチャ、およびライブコンテストへの参加を促進する外部カレンダー連携機能の詳細な実装方針を定義する。

---

## 2. コア機能の要件定義と拡張機能の提案
ユーザーが提示した基本要件には、問題タイトル、コンテスト名（ABC、ARC、AGCなど）、難易度（A〜Fなど）、URL、ステータス（未着手、途中、AC、復習中など）、およびメモの管理が含まれている。また、コンテスト別や難易度別のフィルタリング、AC数の統計ダッシュボードも要求されている。これらの要件を満たしつつ、アプリケーションの継続的利用を担保するためには、以下の拡張機能が必須であると分析される。

### 2.1 自動化による状態管理の高度化とステータスの拡張
ユーザーが手動で「未着手」から「AC（Accepted）」へステータスを変更する設計は、初期段階では機能するものの、解いた問題数が増加するにつれて運用負荷が増大し、最終的にアプリケーションの放棄につながる。したがって、AtCoderの非公式APIである「AtCoder Problems API（通称Kenkoooo API）」を活用した自動同期機能の追加が不可欠である。

さらに、競技プログラミングの学習において最も重要な「アップソルブ（コンテスト中に解けなかった問題を後から解き直すこと）」のプロセスを正確に追跡するため、ステータスの分類をより詳細に拡張することが推奨される。

| 拡張ステータス定義 | 移行条件・データ駆動の要件 |
| :--- | :--- |
| **未着手 (Unattempted)** | 提出履歴が一切存在しない状態。初期状態。 |
| **途中 (In Progress)** | 提出履歴はあるが、ACに達していない状態（WA、TLE、REなど）。APIから非ACの提出を検知した際に自動移行。 |
| **コンテスト内AC (In-Contest AC)** | ライブコンテストの制限時間内にACを獲得した状態。提出時間とコンテストの開催時間を比較して判定。 |
| **アップソルブAC (Upsolved AC)** | コンテスト終了後に解説などを参考にACを獲得した状態。コンテスト終了後の時間帯でのAC提出を検知。 |
| **復習中 (Needs Review)** | AC済みだが、計算量や実装の最適化（例: $\mathcal{O}(N^2)$から$\mathcal{O}(N \log N)$への改善）が必要な状態。ユーザーが手動でフラグを設定、またはLLMがコードを分析して提案。 |

このステータス分類により、ユーザーは「過去に躓いたがまだACしていない問題」や「コンテスト中に解けなかった問題」を瞬時にダッシュボードで抽出し、効率的な復習サイクルを回すことが可能となる。

### 2.2 アルゴリズムタグの導入によるフィルタリングの強化
難易度別（AtCoderではA, B, Cなどの課題番号のほか、問題ごとの数値的な難易度が設定されている）およびコンテスト別のフィルタリングに加え、問題が要求するアルゴリズムの概念（例：動的計画法、グラフ理論、セグメント木、二分探索）に基づくタグ付け機能を追加すべきである。

AtCoder Problemsのデータセット（`merged-problems.json`など）や有志のタグ付けデータを利用することで、特定分野の集中的な訓練が可能となる。タグの自動付与機能は、後述するLLMによる学習パス生成においても、ユーザーの弱点分野を特定するための重要なメタデータとして機能する。

---

## 3. 実装における優先順位とフェーズ分け
コーディングエージェントが複雑なシステムを構築する際、機能の依存関係を無視して実装を進めると、アーキテクチャの破綻やデバッグの困難化を招く。したがって、以下の4つのフェーズに分割し、明確な優先順位を設定して実装を計画する。

| 実装フェーズ | 重点開発領域 | 具体的な実装コンポーネント |
| :--- | :--- | :--- |
| **第1フェーズ (MVP)** | 基盤構築と手動CRUD | データベース設計、認証システム、手動での問題登録・編集・削除機能、一覧表示UI。 |
| **第2フェーズ** | 自動同期と統計ダッシュボード | Kenkoooo APIの統合、提出履歴の定期フェッチ処理、AC数・言語別統計のグラフ化。 |
| **第3フェーズ** | 習慣化とライブコンテスト連携 | CLIST APIによるスケジュール取得、Google Calendar連携、ヒートマップ表示、ストリーク計算。 |
| **第4フェーズ** | AI連携とパーソナライズ | OpenAI API（Structured Outputs）の統合、C++学習パスの自動生成、コード分析機能。 |

最も優先すべきは、基盤となるCRUD機能とデータベース設計（第1フェーズ）である。この基盤が安定していなければ、後続のAPI連携やLLMによる自動評価は機能しない。次に優先すべきは手動入力の負担をなくす自動同期（第2フェーズ）であり、これが完成することでアプリケーションは実用的な価値を持ち始める。習慣化機能（第3フェーズ）とLLM機能（第4フェーズ）は、持続的な学習を促進するための高度な付加価値として段階的に導入されるべきである。

---

## 4. データ統合パイプラインと外部API連携の設計
アプリケーションを動的かつ最新の状態に保つためには、外部APIとの堅牢なデータ連携パイプラインを構築する必要がある。本セクションでは、データ取得元と同期のメカニズムについて詳述する。

### 4.1 AtCoder Problems APIの活用とレートリミット制約
ユーザーの提出履歴や問題のメタデータを取得するためには、公式APIが存在しないAtCoderにおいてデファクトスタンダードとなっている「AtCoder Problems API」を利用する。このAPIは、ユーザーの指定した時点以降の提出履歴を最大500件まで返す `/v3/user/submissions` エンドポイントを提供している。

**コーディングエージェントに対する極めて重要な指示として**、このAPIへのアクセスには厳格なレートリミット（リクエスト間に必ず1秒以上のスリープを挟むこと）を実装しなければならない。これを怠った場合、IPアドレスがブロックされ、アプリケーションの機能が完全に停止するリスクがある。

### 4.2 バックグラウンド同期アーキテクチャ
データの同期処理は、ユーザーのブラウザセッションに依存せず、サーバーサイドで定期的に実行されるべきである。Next.jsとSupabaseの技術スタックを想定した場合、Supabase Edge FunctionsとCronジョブを組み合わせてこのパイプラインを構築する。

具体的な同期アルゴリズムは以下の手順で実行される。
1. まず、ローカルデータベースの提出履歴テーブルから、記録されている最新の提出のUNIXタイムスタンプ（`epoch_second`）を取得する。
2. 次に、このタイムスタンプを `from_second` パラメータとしてKenkoooo APIにリクエストを送信する。
3. APIから新しい提出データ（問題ID、使用言語、結果、実行時間など）が返却された場合、それらをデータベースにバルクインサートする。
4. 同時に、データベースのトリガー機能を用いて、ユーザーの「問題ステータス」を自動的に更新する（例：結果が「AC」であれば、対応する問題のステータスを即座に「AC」に変更する）。

この差分同期（Delta Sync）手法により、APIへの不要なリクエストを最小限に抑えつつ、アプリケーションの状態を常に最新に保つことができる。

---

## 5. データベースアーキテクチャの定義
本アプリケーションのバックエンドには、堅牢なリレーショナルデータモデリングが可能なPostgreSQL（Supabase経由）を採用する。以下に、コーディングエージェントが構築すべき主要なテーブル設計を定義する。

### 5.1 Problems（問題メタデータ）テーブル
AtCoder上のすべての問題の静的情報を保持する。このデータは `merged-problems.json` や `contests.json` から定期的に同期される。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | 問題の一意のID（例：`abc250_a`）。 |
| `contest_id` | VARCHAR(50) | INDEX | 所属するコンテストのID（例：`abc250`）。 |
| `title` | VARCHAR(255) | NOT NULL | 問題のタイトル。 |
| `difficulty` | INTEGER | NULL | 推定難易度（レーティング値）。 |
| `tags` | TEXT | NULL | アルゴリズムやデータ構造のタグ配列。 |
| `url` | TEXT | NOT NULL | AtCoder上の問題ページへのURL。 |

### 5.2 User_Problems（ユーザーステータス）テーブル
ユーザーごとの問題の進捗状況とメモを管理する。ユーザーが要求したCRUD操作の主な対象となる。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | FOREIGN KEY | 認証ユーザーのID。 |
| `problem_id` | VARCHAR(50) | FOREIGN KEY | Problems テーブルへの参照。 |
| `status` | VARCHAR(20) | NOT NULL | 拡張されたステータス（Unattempted, In Progress, AC, Review）。 |
| `memo` | TEXT | NULL | ユーザーが作成したMarkdown形式のメモ・備考。 |
| `last_attempted` | TIMESTAMPTZ | NULL | 最後に提出を行った日時。 |

### 5.3 Submissions（提出履歴）テーブル
Kenkoooo APIからフェッチした生の詳細な提出ログを保存する。LLMによる分析やヒートマップの生成に利用される。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `submission_id` | BIGINT | PRIMARY KEY | AtCoderの提出ID。 |
| `user_id` | UUID | FOREIGN KEY | 認証ユーザーのID。 |
| `problem_id` | VARCHAR(50) | FOREIGN KEY | Problems テーブルへの参照。 |
| `language` | VARCHAR(50) | NOT NULL | 使用されたプログラミング言語（例：`C++ (GCC 9.2.1)`）。 |
| `result` | VARCHAR(10) | NOT NULL | 提出結果（AC, WA, TLE, REなど）。 |
| `execution_time` | INTEGER | NULL | 実行時間（ミリ秒単位）。 |
| `epoch_second` | BIGINT | INDEX | 提出のUNIXタイムスタンプ。同期処理の基準となる。 |

この正規化されたスキーマにより、ユーザーは「特定のタグを持つ問題のうち、自分がWAを出したまま放置しているもの」をSQLクエリを通じて瞬時に抽出することが可能となる。

---

## 6. LLMを活用したC++パーソナライズ学習パスの構築
ユーザーの要望にある「C++を学びながらプログラミング経験を積んでいくにあたって、どんな順番で進んでいくべきかを考えてくれるLLM機能」は、本アプリケーションの中核的な差別化要因である。汎用的なチャットボットインターフェースではなく、ユーザーの提出データに基づき、構造化された学習パスを動的に生成するシステムとして設計する必要がある。

### 6.1 競技プログラミングにおけるC++学習フェーズの定義
LLMに適切な指導を行わせるためには、システム側に基準となるカリキュラムの概念を組み込む必要がある。競技プログラミングにおけるC++の習得は、主にStandard Template Library（STL）の理解度とアルゴリズムの適用能力に直結する。学習フェーズは以下のように構造化されるべきである。

* **フェーズ1：** 基本構文と入出力の高速化。変数の型、ループ制御、マクロの活用、および `std::cin` / `std::cout` の高速化手法の習得。
* **フェーズ2：** STLコンテナの基礎。`std::vector`、`std::string`、`std::pair`、`std::map`、`std::set` の挙動と、それぞれの要素アクセスにおける時間計算量（O(1) と O(logN) の違い）の理解。
* **フェーズ3：** STLアルゴリズムとイテレータ。`<algorithm>` ヘッダに含まれる `std::sort`、`std::lower_bound`（二分探索）、`std::next_permutation` などの活用。
* **フェーズ4：** 中級データ構造とグラフ表現。`std::priority_queue` を用いた優先度付きキュー、Union-Find（素集合データ構造）、および隣接リストを用いたグラフの表現。
* **フェーズ5：** 高度なパラダイム。動的計画法（DP）、深さ優先探索（DFS）、幅優先探索（BFS）、ダイクストラ法などのアルゴリズムのC++による効率的な実装。

### 6.2 OpenAI Structured Outputsによるアーキテクチャ設計
教育的なLLMアプリケーションにおいて、単なるテキストのやり取りではUIへの統合が困難であり、AIの出力がブレる（ハルシネーション）リスクがある。これを解決するため、OpenAI APIが提供する「Structured Outputs（構造化出力）」機能を活用する。この機能は、開発者が提供したJSON SchemaにLLMの出力を厳密に準拠させるものであり、`gpt-4o-2024-08-06` 以降のモデルで完全にサポートされている。

アプリケーションは、LLMからの応答を以下のJSON Schemaで受け取るよう設計される。

| JSONプロパティ | データ型 | 説明 |
| :--- | :--- | :--- |
| `current_assessment` | String | ユーザーの直近の提出履歴とエラー傾向（WA、TLEなど）に基づく現状分析。 |
| `next_cpp_topic` | String | 次に学ぶべきC++の機能やアルゴリズム（例：`std::set` の活用）。 |
| `learning_rationale` | String | なぜそのトピックを推奨するのかという論理的根拠（例：「直近の提出で線形探索によるTLEが多発しているため」）。 |
| `recommended_problem_ids` | Array | 推奨されるAtCoderの問題IDの配列（例：`["abc250_c", "abc251_b"]`）。 |

### 6.3 プロンプトエンジニアリングとコンテキスト管理
LLMは状態を持たない（ステートレス）ため、APIリクエストごとにユーザーの学習文脈（コンテキスト）を再構築してプロンプトに埋め込む必要がある。

バックエンドは、ユーザーが「次の学習パスを生成」ボタンを押下した際、Submissions テーブルから直近50件の提出履歴を取得し、エラーの分類（エラータクソノミー）を実行する。例えば、難易度Cの問題で「TLE（時間切れ）」が頻発している場合、それは $\mathcal{O}(N^2)$ のアルゴリズムを記述しているか、適切なSTLコンテナを使用していない証拠であるとシステムは推論する。

**システムプロンプトの設計例：**
> 「あなたは競技プログラミングとC++に精通したエキスパートコーチです。ユーザーは現在C++学習フェーズ2にいます。直近20回の提出データによると、難易度300の問題において40%の確率でTLEを発生させており、ソースコードの傾向から `std::vector` に対する $\mathcal{O}(N)$ の検索処理がボトルネックになっていると推測されます。提供されたJSON Schemaに厳密に従い、検索計算量を $\mathcal{O}(\log N)$ に削減できる `std::lower_bound` または `std::set` の学習を提案し、その練習に最適なAtCoderの過去問題IDを3つ出力してください。」

この構造化された出力結果をフロントエンド（Next.js）で受け取ることで、単なるチャットテキストではなく、「次の目標」「推奨問題への直接リンクボタン」「解説」といったリッチなUIコンポーネントとしてユーザーに提示することが可能となる。

---

## 7. ライブコンテスト参加の習慣化と行動心理学の実装
過去問題（過去問）を解きながら学習を進めることは重要であるが、実際のライブコンテストに参加する習慣をつけることは、時間制限下でのパフォーマンス向上や、コミュニティ内でのモチベーション維持において不可欠である。ユーザーのこの要望に応えるため、アプリケーションには行動心理学に基づいたリマインダーとゲーミフィケーション（習慣化メカニズム）を組み込む。

### 7.1 コンテストスケジュールの自動取得とカレンダー連携
ユーザーがAtCoderの公式ページを毎回確認する手間を省くため、アプリケーション内に直近のコンテストスケジュールを常に表示する。データソースとしては、プログラミングコンテストの情報を集約しているCLIST API（`/api/v1/contest/`）を利用するか、あるいはAtCoderのコンテストページ（`#contest-table-upcoming` 要素）を定期的にスクレイピングしてローカルデータベースにキャッシュする手法が考えられる。

さらに、Google Calendar APIとの統合を実装する。ユーザーがOAuth認証を通じてGoogleアカウントを連携させると、アプリケーションは取得したAtCoder Beginner Contest (ABC) などの予定をユーザーのカレンダーに自動登録する。単に予定を追加するだけでなく、APIの `reminders` 配列オブジェクトを活用し、コンテスト開始の24時間前にメール通知、1時間前にポップアップ通知を強制的に設定することで、参加の機会損失を完全に防ぐことができる。

### 7.2 学習の可視化：ヒートマップの実装
毎日の学習継続を視覚的にフィードバックするために、GitHubスタイルのコントリビューションヒートマップをダッシュボードの中央に配置する。ヒートマップは「進捗の可視化」という人間の根源的な欲求を満たし、エンゲージメントを劇的に向上させる。

実装としては、Submissions テーブルから日別の提出数またはAC数を集計するSQLクエリを発行する。この際、AtCoderのコンテストのタイムゾーンに合わせて、UNIXタイムスタンプを日本標準時（JST）の日付に変換してグループ化する必要がある。集計された数値は、色の濃淡（例：0件はグレー、1〜2件は薄い緑、3件以上は濃い緑）としてフロントエンドのコンポーネントにマッピングされる。

### 7.3 ストリーク（連続記録）メカニクスと倫理的設計
ストリーク（連続して課題を達成した日数）は、損失回避性（Loss Aversion）と見逃しの恐怖（FOMO）を利用した強力な行動形成メカニズムである。ユーザーはストリークが途切れることを恐れ、毎日少なくとも1問はACを取ろうとする習慣が形成される。

ストリーク日数をリレーショナルデータベース上で正確に計算するためには、SQLの高度なウィンドウ関数である `ROW_NUMBER()` と `LAG()` を駆使したCommon Table Expression (CTE) を構築する。具体的には、ユーザーがACを獲得した日付のリストを取得し、そこから連続する行番号を引くことで、連続した日付を同一のグループIDとしてクラスタリングし、その最大カウントを取得するロジックとなる。

しかし、過度なストリーク設計は「一度途切れたらモチベーションが完全に消失し、アプリ自体を放棄する（シェイムスパイラル）」という致命的な副作用を持つ。したがって、倫理的かつ長期的な利用を前提とする本アプリケーションでは、「ストリークフリーズ」という概念を導入する。これは、週に1日程度の学習の空白日があっても、システム上はストリークが途切れていないと見なす寛容なロジックであり、ユーザーの心理的負担を軽減しつつ継続的な利用を担保する。

---

## 8. コーディングエージェント向け実装仕様と技術選定
最終的な実装を自律型コーディングエージェントに委譲するための、具体的な技術スタックとステップバイステップの指示を以下に総括する。

### 8.1 技術スタックの推奨
* **フロントエンド:** Next.js (App Router), TypeScript, Tailwind CSS。高速なページ遷移と型安全な開発を実現する。
* **UIコンポーネント:** shadcn/ui。アクセシビリティに優れ、カスタマイズが容易なダッシュボードUIを迅速に構築する。
* **バックエンド / データベース:** Supabase (PostgreSQL)。認証、Row Level Security (RLS) によるデータ保護、およびCronジョブ実行環境（Edge Functions）をワンストップで提供する。
* **AI統合:** OpenAI SDK (`gpt-4o-2024-08-06`) および Pydantic/Zod（JSON Schema検証用）。

### 8.2 エージェントへの実行フェーズ指示
1.  **インフラストラクチャの初期化:** `create-next-app` を用いてボイラープレートを生成し、Supabaseクライアントを統合せよ。データベースにセクション5で定義した Problems, User_Problems, Submissions テーブルを作成し、外部キー制約とインデックスを正確に設定せよ。
2.  **Kenkoooo APIクライアントの実装:** `fetch` 関数をラップし、リクエスト間に必ず1000ミリ秒以上の待機処理（Sleep）を挿入するAPIクライアントクラスを作成せよ。過去データの初期ロード機能と、`epoch_second` に基づく差分更新Cronジョブを実装せよ。
3.  **CRUD機能とUIの構築:** ユーザーが任意の問題を検索し、User_Problems テーブルにメモやステータスを手動で保存できるインターフェースを構築せよ。ダッシュボードには、難易度およびタグに基づくフィルタリング機能を備えたテーブルコンポーネントを配置せよ。
4.  **ゲーミフィケーションの統合:** SQL CTEを用いてユーザーの現在のストリークを計算するビュー（View）を作成せよ。また、Google Calendar APIのOAuthフローを実装し、CLIST APIから取得した直近のAtCoderコンテスト情報を自動登録し、リマインダーを設定するバックグラウンド処理を構築せよ。
5.  **LLMチューターの統合:** OpenAI APIのStructured Outputsを利用し、ユーザーのエラータクソノミー（WA/TLE率）を分析するシステムプロンプトを構築せよ。生成された学習パスのJSONをパースし、次に学ぶべきC++の概念と推奨問題へのリンクをフロントエンドの「学習アドバイス」コンポーネントにレンダリングせよ。

---

## 9. 結論
本報告書で定義されたアーキテクチャは、単なるAtCoder問題の記録ツールという初期要件を大きく超え、自律的な学習支援プラットフォームとしての完成度を提供する。Kenkoooo APIによるデータ入力の完全自動化は運用上の摩擦を排除し、Google Calendar連携やヒートマップ、ストリーク設計といった行動心理学的アプローチは、ライブコンテストへの参加と日々の学習習慣を強力に後押しする。

さらに、OpenAIの構造化出力を活用したLLM統合により、ユーザーの弱点に即したC++の体系的なカリキュラムが動的に生成される。コーディングエージェントが本計画に沿って各フェーズを厳格に実装することで、競技プログラミングの学習効率を最大化する、極めて高度かつ実用的なパーソナルアプリケーションが実現される。

---

### 参考リンク
* [AtCoderProblems/doc/api.md at master - GitHub](https://github.com/kenkoooo/AtCoderProblems/blob/master/doc/api.md)
* [Competrace - CP ContestTracker - Apps on Google Play](https://play.google.com/)
* [Important tools to boost performance during contests - Naukri Code 360](https://www.naukri.com/)
* [TACO: Topics in Algorithmic COde generation dataset - arXiv](https://arxiv.org/)
* [Supabase & Next.js App Router Starter Template for Auth - Vercel](https://vercel.com/)
* [Open-Source Supabase Production Boilerplate (Next.JS and/or Flutter)! - Reddit](https://www.reddit.com/)
* [Nan-Do/atcoder_abc_contests · Datasets at Hugging Face](https://huggingface.co/)
* [Training Resources - Princeton Competitive Programming](https://competitive-programming.cs.princeton.edu/)
* [C++ STL Crash Course for Competitive Programming | by Srivaths P | TLE Community](https://www.youtube.com/)
* [Where to learn C++ algorithms and data structures for competitive programming? - Reddit](https://www.reddit.com/)
* [Best way to learn c++ specifically for competitive programming? : r/codeforces - Reddit](https://www.reddit.com/)
* [Introducing Structured Outputs in the API - OpenAI](https://openai.com/)
* [How to use structured outputs with Azure OpenAI in Microsoft Foundry Models](https://learn.microsoft.com/)
* [Conversation state | OpenAI API](https://developers.openai.com/)
* [How do you maintain historical context in repeat API calls? - OpenAI Developer Community](https://community.openai.com/)
* [Evaluating and Improving LLM-based Competitive Program Generation - arXiv](https://arxiv.org/)
* [Understanding Structured Output in LLMs - Progress Software](https://www.progress.com/)
* [Introductory Guide to Competitive Programming with C++ - DEV Community](https://dev.to/)
* [CLIST API Walkthrough - Medium](https://medium.com/)
* [Present Contests - AtCoder](https://atcoder.jp/)
* [Building an API Server for Upcoming AtCoder Contests - Zenn](https://zenn.dev/)
* [AtCoder Calendar - Chrome Web Store](https://chromewebstore.google.com/)
* [penicillin0/AtCoder-Google-Calender: Add a contest schedule to your Google Calendar - GitHub](https://github.com/)
* [Reminders & notifications | Google Calendar](https://developers.google.com/)
* [Google Calendar - custom 'Reminders' integration - Questions - n8n Community](https://community.n8n.io/)
* [Daily Habit Tracker & Streaks - App Store](https://apps.apple.com/)
* [What are some habit-building apps/tools that have helped you develop good and consistent habits? - Reddit](https://www.reddit.com/)
* [Designing A Streak System: The UX And Psychology Of Streaks - Smashing Magazine](https://www.smashingmagazine.com/)
* [Habit-forming product - GeeksforGeeks](https://www.geeksforgeeks.org/)
* [How Streaks and Daily Rewards Engineer Habit Loops and User Obligation | Bootcamp](https://medium.com/)
* [Need help calculating user streaks : r/SQL - Reddit](https://www.reddit.com/)
* [How to find consecutive streaks in data using SQL window functions (and identify cheaters in Halo 5) - YouTube](https://www.youtube.com/)
* [sql - How do I calculate length of streak? - Stack Overflow](https://stackoverflow.com/)
* [Get streak count and streak type from win-loss-tie data - Database Administrators Stack Exchange](https://dba.stackexchange.com/)
* [The Psychology of Hot Streak Game Design: How to Keep Players Coming Back Every Day Without Shame - UX Magazine](https://uxmag.com/)
* [Best Next.js Boilerplates in 2026 - supastarter](https://supastarter.dev/)
* [Best Next.js Boilerplates (2026): 15 Starter Templates Ranked - DesignRevision](https://designrevision.com/)
* [salmandotweb/nextjs-supabase-boilerplate - GitHub](https://github.com/)
* [JSON prompting for LLMs - IBM Developer](https://developer.ibm.com/)
