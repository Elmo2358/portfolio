export interface ContestProblem {
  id: string
  title: string
  url: string
  order: number
}

export interface ContestSeries {
  id: string
  name: string
  description: string
  url: string
  difficulty: "beginner" | "intermediate" | "advanced"
  problems: ContestProblem[]
}

export const contestSeries: ContestSeries[] = [
  {
    id: "abs",
    name: "AtCoder Beginners Selection",
    description: "プログラミング初心者向けの問題セット。基本的なアルゴリズムを学習できます。",
    url: "https://atcoder.jp/contests/ABS",
    difficulty: "beginner",
    problems: [
      { id: "practice_a", title: "Welcome to AtCoder", url: "https://atcoder.jp/contests/practice/tasks/practice_1", order: 1 },
      { id: "abc086_a", title: "Product", url: "https://atcoder.jp/contests/abc086/tasks/abc086_a", order: 2 },
      { id: "abc081_a", title: "Placing Marbles", url: "https://atcoder.jp/contests/abc081/tasks/abc081_a", order: 3 },
      { id: "abc081_b", title: "Shift only", url: "https://atcoder.jp/contests/abc081/tasks/abc081_b", order: 4 },
      { id: "abc087_b", title: "Coins", url: "https://atcoder.jp/contests/abc087/tasks/abc087_b", order: 5 },
      { id: "abc083_b", title: "Some Sums", url: "https://atcoder.jp/contests/abc083/tasks/abc083_b", order: 6 },
      { id: "abc088_b", title: "Card Game for Two", url: "https://atcoder.jp/contests/abc088/tasks/abc088_b", order: 7 },
      { id: "abc085_b", title: "Kagami Mochi", url: "https://atcoder.jp/contests/abc085/tasks/abc085_b", order: 8 },
      { id: "abc085_c", title: "Otoshidama", url: "https://atcoder.jp/contests/abc085/tasks/abc085_c", order: 9 },
      { id: "abc049_c", title: "Daydream", url: "https://atcoder.jp/contests/abc049/tasks/abc049_c", order: 10 },
      { id: "abc086_c", title: "Traveling", url: "https://atcoder.jp/contests/abc086/tasks/abc086_c", order: 11 },
    ],
  },
  {
    id: "typical90",
    name: "競プロ典型90問",
    description: "競技プログラミングで頻出の90問。典型テクニックを習得できます。",
    url: "https://atcoder.jp/contests/typical90",
    difficulty: "intermediate",
    problems: [
      { id: "abc070_c", title: "01 - Multiple of 9 and 10", url: "https://atcoder.jp/contests/abc070/tasks/abc070_c", order: 1 },
      { id: "abc085_b", title: "02 - Encyclopedia of Parentheses", url: "https://atcoder.jp/contests/abc085/tasks/abc085_b", order: 2 },
      { id: "abc009_c", title: "03 - Longest Circular Road", url: "https://atcoder.jp/contests/abc009/tasks/abc009_3", order: 3 },
      { id: "abc237_d", title: "04 - Sum of Divisors", url: "https://atcoder.jp/contests/abc237/tasks/abc237_d", order: 4 },
      { id: "abc077_c", title: "05 - Lucas Number", url: "https://atcoder.jp/contests/arc084/tasks/arc084_a", order: 5 },
      { id: "abc022_d", title: "06 - Rearranging Problems", url: "https://atcoder.jp/contests/abc022/tasks/abc022_d", order: 6 },
      { id: "abc045_c", title: "07 - Many Formulas", url: "https://atcoder.jp/contests/abc045/tasks/arc061_a", order: 7 },
      { id: "abc054_c", title: "08 - AtCoder Quiz", url: "https://atcoder.jp/contests/abc054/tasks/abc054_c", order: 8 },
      { id: "abc076_c", title: "09 - Three Point Angle", url: "https://atcoder.jp/contests/abc076/tasks/abc076_c", order: 9 },
      { id: "abc004_d", title: "10 - Score Sum Queries", url: "https://atcoder.jp/contests/abc004/tasks/abc004_3", order: 10 },
      // 他80問（実際にはデータベースから取得するか、スクレイピングが必要）
      // とりあえず最初の10問のみ表示
    ],
  },
  {
    id: "math-and-algorithm",
    name: "アルゴリズムと数学 演習問題集",
    description: "数学的思考とアルゴリズムの基礎を固める問題集。",
    url: "https://atcoder.jp/contests/math-and-algorithm",
    difficulty: "intermediate",
    problems: [
      { id: "abc212_a", title: "問題1 - A座標", url: "https://atcoder.jp/contests/abc212/tasks/abc212_a", order: 1 },
      { id: "abc179_c", title: "問題2 - A座標", url: "https://atcoder.jp/contests/abc179/tasks/abc179_c", order: 2 },
      { id: "abc165_b", title: "問題3 - A座標", url: "https://atcoder.jp/contests/abc165/tasks/abc165_b", order: 3 },
      { id: "abc233_b", title: "問題4 - A座標", url: "https://atcoder.jp/contests/abc233/tasks/abc233_b", order: 4 },
      { id: "abc208_b", title: "問題5 - Factorial Yen Coin", url: "https://atcoder.jp/contests/abc208/tasks/abc208_b", order: 5 },
      { id: "abc258_c", title: "問題6 - A座標", url: "https://atcoder.jp/contests/abc258/tasks/abc258_c", order: 6 },
      { id: "abc238_c", title: "問題7 - A座標", url: "https://atcoder.jp/contests/abc238/tasks/abc238_c", order: 7 },
      { id: "abc256_c", title: "問題8 - A座標", url: "https://atcoder.jp/contests/abc256/tasks/abc256_c", order: 8 },
      { id: "abc295_c", title: "問題9 - A座標", url: "https://atcoder.jp/contests/abc295/tasks/abc295_c", order: 9 },
      { id: "abc243_c", title: "問題10 - A座標", url: "https://atcoder.jp/contests/abc243/tasks/abc243_c", order: 10 },
      // その他の問題（実際のデータが必要）
    ],
  },
  {
    id: "tessoku",
    name: "競技プログラミングの鉄則 演習問題集",
    description: "競技プログラミングの鉄則を学べる演習問題集。",
    url: "https://atcoder.jp/contests/tessoku",
    difficulty: "intermediate",
    problems: [
      { id: "abc262_a", title: "問題01 - World Cup Finals", url: "https://atcoder.jp/contests/abc262/tasks/abc262_a", order: 1 },
      { id: "abc259_c", title: "問題02 - XX to XXX", url: "https://atcoder.jp/contests/abc259/tasks/abc259_c", order: 2 },
      { id: "abc264_b", title: "問題03 - AtCoder Condominium", url: "https://atcoder.jp/contests/abc264/tasks/abc264_b", order: 3 },
      { id: "abc258_b", title: "問題04 - Rectangle Guide", url: "https://atcoder.jp/contests/abc258/tasks/abc258_b", order: 4 },
      { id: "abc261_a", title: "問題05 - Intersection", url: "https://atcoder.jp/contests/abc261/tasks/abc261_a", order: 5 },
      { id: "abc255_b", title: "問題06 - Light It Up", url: "https://atcoder.jp/contests/abc255/tasks/abc255_b", order: 6 },
      { id: "abc257_b", title: "問題07 - A座標", url: "https://atcoder.jp/contests/abc257/tasks/abc257_b", order: 7 },
      { id: "abc263_a", title: "問題08 - A座標", url: "https://atcoder.jp/contests/abc263/tasks/abc263_a", order: 8 },
      { id: "abc267_b", title: "問題09 - Split?", url: "https://atcoder.jp/contests/abc267/tasks/abc267_b", order: 9 },
      { id: "abc260_a", title: "問題10 - A座標", url: "https://atcoder.jp/contests/abc260/tasks/abc260_a", order: 10 },
      // その他の問題（実際のデータが必要）
    ],
  },
]

export function getContestSeriesById(id: string): ContestSeries | undefined {
  return contestSeries.find(series => series.id === id)
}

export function getAllContestProblems(): ContestProblem[] {
  return contestSeries.flatMap(series => series.problems)
}
