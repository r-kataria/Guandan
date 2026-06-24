// compare.ts — bomb classification and the canBeat() relation.

import { NaturalRank } from './cards'
import { Combination, ComboKind } from './combinations'

export function isBomb(c: Combination): boolean {
  return c.kind === 'bomb' || c.kind === 'straightflush' || c.kind === 'jokerbomb'
}

export function isBombKind(kind: ComboKind): boolean {
  return kind === 'bomb' || kind === 'straightflush' || kind === 'jokerbomb'
}

/** Cross-type bomb strength. Higher beats lower; ties broken by `rank`. */
export function bombLevel(c: Combination): number {
  // bombLevel is set for every bomb in recognize(); fall back defensively.
  return c.bombLevel ?? 0
}

/**
 * Can `candidate` legally beat `current`?
 *  - A bomb beats any non-bomb.
 *  - Between two bombs: higher bombLevel wins; equal level => higher rank.
 *  - Between two non-bombs: must be the SAME kind and SAME count, then higher rank.
 * `level` is accepted for signature symmetry; ranks already encode level strength.
 */
export function canBeat(
  candidate: Combination,
  current: Combination,
  _level: NaturalRank,
): boolean {
  const cb = isBomb(candidate)
  const ub = isBomb(current)

  if (cb && !ub) return true
  if (!cb && ub) return false

  if (cb && ub) {
    const lc = bombLevel(candidate)
    const lu = bombLevel(current)
    if (lc !== lu) return lc > lu
    return candidate.rank > current.rank
  }

  // Neither is a bomb: must match shape exactly.
  if (candidate.kind !== current.kind) return false
  if (candidate.count !== current.count) return false
  return candidate.rank > current.rank
}
