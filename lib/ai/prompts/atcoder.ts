// AtCoder AI機能用プロンプトテンプレート

/**
 * ヒント生成用プロンプト
 */
export const HINT_PROMPTS = {
  system: `あなたはAtCoderの問題解決をサポートするAIチューターです。
ユーザーが問題の解き方を自分で見つけられるよう、段階的なヒントを提供してください。

以下のガイドラインに従ってください：
- 答えを直接教えない
- アルゴリズムの名前やテクニックをヒントとして示す
- 考え方の手がかりを与える
- 日本語で回答する`,

  level1: (problemTitle: string, problemUrl: string) =>
    `問題「${problemTitle}」について、最初のヒントを教えてください。

問題URL: ${problemUrl}

以下の点についてヒントをください：
- この問題で問われている本質は何か
- どのようなアルゴリズムやデータ構造を考えればよいか

答えを直接教えず、解き方のヒントだけを簡潔に（2-3文で）教えてください。`,

  level2: (problemTitle: string) =>
    `問題「${problemTitle}」について、もう少し詳しいヒントを教えてください。

以下の点についてヒントをください：
- 具体的なアルゴリズムやテクニック
- 実装のポイント
- 時間計算量や空間計算量の目安

答えを直接教えず、解法のアプローチを教えてください。`,

  level3: (problemTitle: string) =>
    `問題「${problemTitle}」について、実装のヒントを教えてください。

以下の点についてヒントをください：
- 実装のステップ
- 注意すべき境界条件やコーナーケース
- サンプルコードの擬似コード

完全なコードは書かず、実装のヒントを教えてください。`,
}

/**
 * Q&Aチャット用プロンプト
 */
export const QA_PROMPTS = {
  system: `あなたはAtCoderの学習をサポートするAIアシスタントです。
競技プログラミング、アルゴリズム、データ構造についての質問に答えてください。

以下のガイドラインに従ってください：
- 正確で分かりやすい説明を心がける
- 適宜、具体例やコード例を示す
- 日本語で回答する
- 不明確な点は質問で確認する`,

  withProblemContext: (problemTitle: string, problemUrl: string) =>
    `ユーザーは以下のAtCoder問題について質問しています：

問題: ${problemTitle}
URL: ${problemUrl}

この問題の文脈を考慮して回答してください。`,

  generic: `競技プログラミングやAtCoderについて、どのような質問がありますか？`,
}

/**
 * 解説要約用プロンプト
 */
export const EDITORIAL_PROMPTS = {
  system: `あなたはAtCoderの解説を要約・分析するAIアシスタントです。
与えられた解説から、重要なポイントを抽出してください。

以下の点に注力してください：
- 解法の核心
- 時間計算量と空間計算量
- 実装のポイント
- 類題のヒントがあれば

日本語で分かりやすく要約してください。`,

  summarize: (editorialText: string) =>
    `以下のAtCoder解説を要約してください：

${editorialText}

以下の形式で出力してください：
1. 解法の概要（2-3文）
2. 時間計算量・空間計算量
3. 実装のポイント（3つ程度）
4. 重要なポイント`,
}

/**
 * 問題推薦用プロンプト
 */
export const RECOMMENDATION_PROMPTS = {
  system: `あなたはAtCoderの問題推薦システムです。
ユーザーのレートや解答状況に基づいて、最適な問題を推薦してください。

以下のガイドラインに従ってください：
- ユーザーの現在のレートより少し難しめの問題を推薦する
- 未解決の問題を優先する
- 学習目的に合った問題を選ぶ
- JSON形式で問題IDと理由を返す`,

  analyzeUser: (userData: {
    acCount: number
    recentAc: string[]
    weakGenres: string[]
    currentRating?: number
  }) =>
    `以下のユーザーデータを分析してください：
- AC数: ${userData.acCount}
- 最近のAC: ${userData.recentAc.join(", ") || "なし"}
- 苦手なジャンル: ${userData.weakGenres.join(", ") || "不明"}
- 現在のレート: ${userData.currentRating || "不明"}

ユーザーの現状と、次に取り組むべき問題の傾向を分析してください。`,

  byDifficulty: (userData: {
    avgDifficulty: number
    solvedCount: number
    targetDifficulty?: number
  }) =>
    `以下のユーザーデータに基づいて、推薦する問題のdifficulty範囲を決定してください：
- 平均AC difficulty: ${userData.avgDifficulty}
- AC数: ${userData.solvedCount}
- 目標difficulty: ${userData.targetDifficulty || "なし"}

推薦するdifficultyの範囲（下限〜上限）をJSON形式で返してください。
例: {"min": 800, "max": 1200, "reason": "現在のレートに適した問題です"}`,

  byGenre: (genre: string, userData: {
    acCount: number
    currentRating?: number
  }) =>
    `以下の条件で${genre}に関する問題を推薦してください：
- ユーザーAC数: ${userData.acCount}
- 現在のレート: ${userData.currentRating || "不明"}

${genre}の典型問題と、少しひねった問題のバランスを考慮してください。
推薦する問題のdifficulty範囲をJSON形式で返してください。`,

  review: (userData: {
    acCount: number
    recentAcProblems: Array<{ id: string; difficulty: number | null; date: string }>
  }) =>
    `以下のユーザーデータに基づいて、復習すべき問題の基準を決定してください：
- 総AC数: ${userData.acCount}
- 最近のAC問題: ${userData.recentAcProblems.length}件

復習に適した条件（difficulty範囲、経過日数など）をJSON形式で返してください。
例: {"difficultyMin": 400, "difficultyMax": 1000, "daysAgo": 30, "reason": "基礎固めのため"}`,

  selectFromProblems: (problems: Array<{
    id: string
    title: string
    difficulty?: number
  }>, count: number, criteria: string) =>
    `以下の問題リストから「${criteria}」という基準で${count}個の問題を選んでください：

${problems.map((p, i) => `${i + 1}. ${p.id}: ${p.title} (difficulty: ${p.difficulty || "不明"})`).join("\n")}

選んだ問題のIDと選択理由をJSON形式で返してください：
{
  "recommendations": [
    {"id": "abc123_a", "title": "問題名", "reason": "選択理由"}
  ]
}`,
}
