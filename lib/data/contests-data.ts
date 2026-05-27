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
    problems: Array.from({ length: 90 }, (_, i) => ({
      id: `typical90_${String(i + 1).padStart(2, "0")}`,
      title: `問題 ${String(i + 1).padStart(2, "0")}`,
      url: `https://atcoder.jp/contests/typical90/tasks/typical90_${String(i + 1).padStart(2, "0")}`,
      order: i + 1,
    })),
  },
  {
    id: "math-and-algorithm",
    name: "アルゴリズムと数学 演習問題集",
    description: "数学的思考とアルゴリズムの基礎を固める問題集。",
    url: "https://atcoder.jp/contests/math-and-algorithm",
    difficulty: "intermediate",
    problems: Array.from({ length: 60 }, (_, i) => ({
      id: `math_${String(i + 1).padStart(2, "0")}`,
      title: `問題 ${String(i + 1).padStart(2, "0")}`,
      url: `https://atcoder.jp/contests/math-and-algorithm/tasks/math_and_algorithm_${String(i + 1).padStart(2, "0")}`,
      order: i + 1,
    })),
  },
  {
    id: "tessoku",
    name: "競技プログラミングの鉄則 演習問題集",
    description: "競技プログラミングの鉄則を学べる演習問題集。",
    url: "https://atcoder.jp/contests/tessoku",
    difficulty: "intermediate",
    problems: Array.from({ length: 100 }, (_, i) => ({
      id: `tessoku_${String(i + 1).padStart(3, "0")}`,
      title: `問題 ${String(i + 1).padStart(3, "0")}`,
      url: `https://atcoder.jp/contests/tessoku/tasks/tessoku_${String(i + 1).padStart(3, "0")}`,
      order: i + 1,
    })),
  },
]

export function getContestSeriesById(id: string): ContestSeries | undefined {
  return contestSeries.find(series => series.id === id)
}

export function getAllContestProblems(): ContestProblem[] {
  return contestSeries.flatMap(series => series.problems)
}
