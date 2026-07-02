// stats.ts — local player profile: lifetime results across solo and online games.

export interface Stats {
  gamesPlayed: number
  gamesWon: number
  handsPlayed: number
  handsWon: number
  bombsSeen: number // bombs you played (solo tracked; online approximated client-side)
  streak: number // current game win streak
  bestStreak: number
}

const KEY = 'guandan.stats.v1'

const EMPTY: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  handsPlayed: 0,
  handsWon: 0,
  bombsSeen: 0,
  streak: 0,
  bestStreak: 0,
}

export function getStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Stats>) }
  } catch {
    return { ...EMPTY }
  }
}

function write(s: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function recordHand(won: boolean): void {
  const s = getStats()
  s.handsPlayed += 1
  if (won) s.handsWon += 1
  write(s)
}

export function recordGame(won: boolean): void {
  const s = getStats()
  s.gamesPlayed += 1
  if (won) {
    s.gamesWon += 1
    s.streak += 1
    s.bestStreak = Math.max(s.bestStreak, s.streak)
  } else {
    s.streak = 0
  }
  write(s)
}

export function recordBomb(): void {
  const s = getStats()
  s.bombsSeen += 1
  write(s)
}
