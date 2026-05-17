// AtCoderレートゾーン定義とユーティリティ

export const ATCODER_RATING_ZONES = {
  GRAY: { min: 0, max: 399, color: 'gray', name: '灰色', next: 'BROWN', nameEn: 'Gray' },
  BROWN: { min: 400, max: 799, color: 'brown', name: '茶色', next: 'GREEN', nameEn: 'Brown' },
  GREEN: { min: 800, max: 1199, color: 'green', name: '緑色', next: 'CYAN', nameEn: 'Green' },
  CYAN: { min: 1200, max: 1599, color: 'cyan', name: '水色', next: 'BLUE', nameEn: 'Cyan' },
  BLUE: { min: 1600, max: 1999, color: 'blue', name: '青色', next: 'YELLOW', nameEn: 'Blue' },
  YELLOW: { min: 2000, max: 2399, color: 'yellow', name: '黄色', next: 'ORANGE', nameEn: 'Yellow' },
  ORANGE: { min: 2400, max: 2799, color: 'orange', name: '橙色', next: 'RED', nameEn: 'Orange' },
  RED: { min: 2800, max: 9999, color: 'red', name: '赤色', next: null, nameEn: 'Red' },
} as const

export type RatingZone = keyof typeof ATCODER_RATING_ZONES

export type RatingZoneInfo = typeof ATCODER_RATING_ZONES[RatingZone]

export function getRatingZone(rating: number): RatingZone {
  if (rating >= 2800) return 'RED'
  if (rating >= 2400) return 'ORANGE'
  if (rating >= 2000) return 'YELLOW'
  if (rating >= 1600) return 'BLUE'
  if (rating >= 1200) return 'CYAN'
  if (rating >= 800) return 'GREEN'
  if (rating >= 400) return 'BROWN'
  return 'GRAY'
}

export function getNextZone(currentZone: RatingZone): RatingZone | null {
  const next = ATCODER_RATING_ZONES[currentZone].next
  return next ? (next as RatingZone) : null
}

export function getNextZoneTarget(currentRating: number): number | null {
  const zone = getRatingZone(currentRating)
  const next = getNextZone(zone)
  if (!next) return null
  return ATCODER_RATING_ZONES[next].min
}

export function getZoneInfo(zone: RatingZone): RatingZoneInfo {
  return ATCODER_RATING_ZONES[zone]
}

export function getZoneByColor(color: string): RatingZone | null {
  const entry = Object.entries(ATCODER_RATING_ZONES).find(([_, info]) => info.color === color)
  return entry ? (entry[0] as RatingZone) : null
}
