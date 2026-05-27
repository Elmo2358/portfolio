// APG4b (AtCoder Programming Guide for beginners) 静的データ

export interface Apg4bChapterData {
  chapterId: string
  title: string
  section: string
  order: number
  problemId: string
  description?: string
}

export interface Apg4bLessonData {
  lessonId: string
  title: string
  problemId: string
  chapterId: string
  order: number
}

// 第1章
const chapter1: Apg4bChapterData = {
  chapterId: "1.00",
  title: "はじめに",
  section: "1",
  order: 0,
  problemId: "APG4b_a",
  description: "AtCoderの基本操作とコードテスト",
}

// 第1章 練習問題
const chapter1Lessons: Apg4bLessonData[] = [
  { lessonId: "EX1", title: "コードテストと出力の練習", problemId: "APG4b_EX1", chapterId: "1.00", order: 1 },
]

// 第1.01章
const chapter101: Apg4bChapterData = {
  chapterId: "1.01",
  title: "出力とコメント",
  section: "1",
  order: 2,
  problemId: "APG4b_b",
  description: "coutでの出力とコメントの書き方",
}

// 第1.02章
const chapter102: Apg4bChapterData = {
  chapterId: "1.02",
  title: "プログラムの書き方とエラー",
  section: "1",
  order: 4,
  problemId: "APG4b_c",
  description: "セミコロンやインデントの重要性",
}

// 第1章 練習問題
const chapter1Practice: Apg4bLessonData[] = [
  { lessonId: "EX2", title: "整数と文字列の出力", problemId: "APG4b_EX2", chapterId: "1.02", order: 5 },
  { lessonId: "EX3", title: "コメントアウト", problemId: "APG4b_EX3", chapterId: "1.02", order: 6 },
]

// 第1.03章
const chapter103: Apg4bChapterData = {
  chapterId: "1.03",
  title: "演算子",
  section: "1",
  order: 7,
  problemId: "APG4b_d",
  description: "四則演算と modulo 演算子",
}

// 第1章 練習問題
const chapter103Practice: Apg4bLessonData[] = [
  { lessonId: "EX4", title: "◯年は何秒？", problemId: "APG4b_EX4", chapterId: "1.03", order: 8 },
  { lessonId: "EX5", title: "A足すB問題", problemId: "APG4b_EX5", chapterId: "1.03", order: 9 },
  { lessonId: "EX6", title: "A掛けるB問題", problemId: "APG4b_EX6", chapterId: "1.03", order: 10 },
]

// 第1.04章
const chapter104: Apg4bChapterData = {
  chapterId: "1.04",
  title: "変数と型",
  section: "1",
  order: 11,
  problemId: "APG4b_e",
  description: "変数の宣言と基本的な型",
}

// 第1章 練習問題
const chapter104Practice: Apg4bLessonData[] = [
  { lessonId: "EX7", title: "変数の練習", problemId: "APG4b_EX7", chapterId: "1.04", order: 12 },
  { lessonId: "EX8", title: " swapping", problemId: "APG4b_EX8", chapterId: "1.04", order: 13 },
]

// 第1.05章
const chapter105: Apg4bChapterData = {
  chapterId: "1.05",
  title: "実行順序と入力",
  section: "1",
  order: 14,
  problemId: "APG4b_f",
  description: "cinによる入力",
}

// 第1章 練習問題
const chapter105Practice: Apg4bLessonData[] = [
  { lessonId: "EX9", title: "入力と出力の練習", problemId: "APG4b_EX9", chapterId: "1.05", order: 15 },
  { lessonId: "EX10", title: "合計点", problemId: "APG4b_EX10", chapterId: "1.05", order: 16 },
]

// 第1.06章
const chapter106: Apg4bChapterData = {
  chapterId: "1.06",
  title: "if文・if-else文",
  section: "1",
  order: 17,
  problemId: "APG4b_g",
  description: "条件分岐の基本",
}

// 第1章 練習問題
const chapter106Practice: Apg4bLessonData[] = [
  { lessonId: "EX11", title: "閾値の設定", problemId: "APG4b_EX11", chapterId: "1.06", order: 18 },
  { lessonId: "EX12", title: "合格判定", problemId: "APG4b_EX12", chapterId: "1.06", order: 19 },
]

// 第1.07章
const chapter107: Apg4bChapterData = {
  chapterId: "1.07",
  title: "for文・while文",
  section: "1",
  order: 20,
  problemId: "APG4b_h",
  description: "繰り返し処理",
}

// 第1章 練習問題
const chapter107Practice: Apg4bLessonData[] = [
  { lessonId: "EX13", title: "繰り返しの練習", problemId: "APG4b_EX13", chapterId: "1.07", order: 21 },
  { lessonId: "EX14", title: "九九の表示", problemId: "APG4b_EX14", chapterId: "1.07", order: 22 },
]

// 第1.08章
const chapter108: Apg4bChapterData = {
  chapterId: "1.08",
  title: "配列",
  section: "1",
  order: 23,
  problemId: "APG4b_i",
  description: "配列の基本",
}

// 第1章 練習問題
const chapter108Practice: Apg4bLessonData[] = [
  { lessonId: "EX15", title: "配列の練習", problemId: "APG4b_EX15", chapterId: "1.08", order: 24 },
  { lessonId: "EX16", title: "階乗の計算", problemId: "APG4b_EX16", chapterId: "1.08", order: 25 },
]

// 第2章
const chapter2: Apg4bChapterData = {
  chapterId: "2.01",
  title: "関数",
  section: "2",
  order: 26,
  problemId: "APG4b_j",
  description: "関数の定義と呼び出し",
}

// 第2章 練習問題
const chapter2Practice: Apg4bLessonData[] = [
  { lessonId: "EX17", title: "関数の練習", problemId: "APG4b_EX17", chapterId: "2.01", order: 27 },
  { lessonId: "EX18", title: "再帰関数の練習", problemId: "APG4b_EX18", chapterId: "2.01", order: 28 },
]

// 第3章
const chapter3: Apg4bChapterData = {
  chapterId: "3.01",
  title: "構造体・クラス",
  section: "3",
  order: 29,
  problemId: "APG4b_k",
  description: "構造体とクラスの基本",
}

// 第3章 練習問題
const chapter3Practice: Apg4bLessonData[] = [
  { lessonId: "EX19", title: "構造体の練習", problemId: "APG4b_EX19", chapterId: "3.01", order: 30 },
]

// 第4章
const chapter4: Apg4bChapterData = {
  chapterId: "4.01",
  title: "ライブラリ",
  section: "4",
  order: 31,
  problemId: "APG4b_l",
  description: "標準ライブラリの活用",
}

// 第4章 練習問題
const chapter4Practice: Apg4bLessonData[] = [
  { lessonId: "EX20", title: "ソート", problemId: "APG4b_EX20", chapterId: "4.01", order: 32 },
  { lessonId: "EX21", title: "二分探索", problemId: "APG4b_EX21", chapterId: "4.01", order: 33 },
]

// 付録
const appendix1: Apg4bChapterData = {
  chapterId: "AP1",
  title: "bitset",
  section: "appendix",
  order: 34,
  problemId: "APG4b_m",
  description: "ビットセットの使い方",
}

// 付録 練習問題
const appendixPractice: Apg4bLessonData[] = [
  { lessonId: "EX22", title: "ビット演算の練習", problemId: "APG4b_EX22", chapterId: "AP1", order: 35 },
  { lessonId: "EX23", title: "部分集合の列挙", problemId: "APG4b_EX23", chapterId: "AP1", order: 36 },
  { lessonId: "EX24", title: "bitsetの練習", problemId: "APG4b_EX24", chapterId: "AP1", order: 37 },
]

const appendix2: Apg4bChapterData = {
  chapterId: "AP2",
  title: "累積和",
  section: "appendix",
  order: 38,
  problemId: "APG4b_n",
  description: "累積和の考え方と実装",
}

const appendix2Practice: Apg4bLessonData[] = [
  { lessonId: "EX25", title: "累積和の練習", problemId: "APG4b_EX25", chapterId: "AP2", order: 39 },
]

const appendix3: Apg4bChapterData = {
  chapterId: "AP3",
  title: "スタック・キュー",
  section: "appendix",
  order: 40,
  problemId: "APG4b_AP1",
  description: "データ構造の活用",
}

const appendix3Practice: Apg4bLessonData[] = [
  { lessonId: "EX26", title: "スタックとキューの練習", problemId: "APG4b_EX26", chapterId: "AP3", order: 41 },
]

const appendix4: Apg4bChapterData = {
  chapterId: "AP4",
  title: "再帰関数",
  section: "appendix",
  order: 42,
  problemId: "APG4b_AP2",
  description: "再帰の考え方",
}

const appendix5: Apg4bChapterData = {
  chapterId: "AP5",
  title: "bitset(続き)",
  section: "appendix",
  order: 43,
  problemId: "APG4b_AP3",
  description: "bitsetの応用",
}

const appendix6: Apg4bChapterData = {
  chapterId: "AP6",
  title: "動的計画法",
  section: "appendix",
  order: 44,
  problemId: "APG4b_AP4",
  description: "DP入門",
}

export const APG4B_CHAPTERS: Apg4bChapterData[] = [
  chapter1,
  chapter101,
  chapter102,
  chapter103,
  chapter104,
  chapter105,
  chapter106,
  chapter107,
  chapter108,
  chapter2,
  chapter3,
  chapter4,
  appendix1,
  appendix2,
  appendix3,
  appendix4,
  appendix5,
  appendix6,
]

export const APG4B_LESSONS: Apg4bLessonData[] = [
  ...chapter1Lessons,
  ...chapter1Practice,
  ...chapter103Practice,
  ...chapter104Practice,
  ...chapter105Practice,
  ...chapter106Practice,
  ...chapter107Practice,
  ...chapter108Practice,
  ...chapter2Practice,
  ...chapter3Practice,
  ...chapter4Practice,
  ...appendixPractice,
  ...appendix2Practice,
  ...appendix3Practice,
]

// ヘルパー関数
export function getChapterById(chapterId: string): Apg4bChapterData | undefined {
  return APG4B_CHAPTERS.find(c => c.chapterId === chapterId)
}

export function getLessonsByChapterId(chapterId: string): Apg4bLessonData[] {
  return APG4B_LESSONS.filter(l => l.chapterId === chapterId)
}

export function getAllApg4bData(): {
  chapters: Apg4bChapterData[]
  lessons: Apg4bLessonData[]
} {
  return {
    chapters: APG4B_CHAPTERS,
    lessons: APG4B_LESSONS,
  }
}
