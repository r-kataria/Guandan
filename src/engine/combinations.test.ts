import { describe, it, expect, beforeEach } from 'vitest'
import { recognize, pickBest, Combination, ComboKind } from './combinations'
import { canBeat } from './compare'
import { buildDeck, NaturalRank } from './cards'
import { hand, resetCardCounter } from './testHelpers'

beforeEach(resetCardCounter)

function kindsOf(combos: Combination[]): ComboKind[] {
  return combos.map((c) => c.kind).sort()
}

function has(combos: Combination[], kind: ComboKind): Combination | undefined {
  return combos.find((c) => c.kind === kind)
}

const L2 = 2 as NaturalRank // level = 2 (first hand)
const L5 = 5 as NaturalRank

describe('deck', () => {
  it('builds exactly 108 unique cards with 4 jokers', () => {
    const deck = buildDeck()
    expect(deck.length).toBe(108)
    expect(new Set(deck.map((c) => c.id)).size).toBe(108)
    expect(deck.filter((c) => c.kind === 'joker').length).toBe(4)
  })
})

describe('recognize: basic shapes', () => {
  it('single', () => {
    expect(kindsOf(recognize(hand('S7'), L2))).toEqual(['single'])
  })
  it('pair', () => {
    expect(has(recognize(hand('S7', 'H7'), L2), 'pair')).toBeTruthy()
  })
  it('two jokers are NOT a pair', () => {
    expect(recognize(hand('JB', 'JB'), L2)).toEqual([])
  })
  it('triple', () => {
    expect(has(recognize(hand('S7', 'H7', 'D7'), L2), 'triple')).toBeTruthy()
  })
  it('full house', () => {
    const fh = has(recognize(hand('S7', 'H7', 'D7', 'S9', 'C9'), L2), 'fullhouse')
    expect(fh).toBeTruthy()
  })
  it('rejects a 4-card non-bomb mix', () => {
    expect(recognize(hand('S7', 'H7', 'D8', 'C9'), L2)).toEqual([])
  })
})

describe('recognize: straights', () => {
  it('5-card straight', () => {
    expect(has(recognize(hand('S3', 'H4', 'D5', 'C6', 'S7'), L2), 'straight')).toBeTruthy()
  })
  it('A-low straight A-2-3-4-5 top is 5', () => {
    const st = has(recognize(hand('SA', 'H2', 'D3', 'C4', 'S5'), L5), 'straight')
    expect(st?.rank).toBe(5)
  })
  it('A-high straight 10-J-Q-K-A top is 14', () => {
    const st = has(recognize(hand('S10', 'HJ', 'DQ', 'CK', 'SA'), L5), 'straight')
    expect(st?.rank).toBe(14)
  })
  it('same suit run is both a straight and a straight flush', () => {
    const combos = recognize(hand('S3', 'S4', 'S5', 'S6', 'S7'), L2)
    expect(has(combos, 'straight')).toBeTruthy()
    expect(has(combos, 'straightflush')).toBeTruthy()
  })
})

describe('recognize: tube and plate', () => {
  it('tube = 3 consecutive pairs', () => {
    const t = has(recognize(hand('S10', 'H10', 'SJ', 'HJ', 'SQ', 'HQ'), L2), 'tube')
    expect(t?.rank).toBe(12)
  })
  it('plate = 2 consecutive triples', () => {
    const p = has(recognize(hand('S4', 'H4', 'D4', 'S5', 'H5', 'D5'), L2), 'plate')
    expect(p?.rank).toBe(5)
  })
})

describe('recognize: bombs', () => {
  it('4-of-a-kind bomb', () => {
    const b = has(recognize(hand('S7', 'H7', 'D7', 'C7'), L2), 'bomb')
    expect(b?.bombLevel).toBe(4)
  })
  it('6-of-a-kind bomb', () => {
    const b = has(recognize(hand('S7', 'H7', 'D7', 'C7', 'S7', 'H7'), L2), 'bomb')
    expect(b?.bombLevel).toBe(6)
  })
  it('four jokers is the joker bomb', () => {
    const b = has(recognize(hand('JB', 'JB', 'JS', 'JS'), L2), 'jokerbomb')
    expect(b).toBeTruthy()
  })
})

describe('recognize: wild cards (level 5 => Heart-5 is wild)', () => {
  it('wild completes a pair', () => {
    // H5 is wild at level 5; with S9 it forms a pair of 9s.
    const p = has(recognize(hand('H5', 'S9'), L5), 'pair')
    expect(p?.rank).toBe(9)
    expect(p?.wildCount).toBe(1)
  })
  it('wild completes a straight in two possible windows', () => {
    // 3-4-6-7 + wild can be 3-4-5-6-7 (top 7) or 4-5-6-7-8? no (missing 8). Only one window.
    const combos = recognize(hand('S3', 'S4', 'H5', 'S6', 'S7'), L5)
    const straights = combos.filter((c) => c.kind === 'straight')
    expect(straights.length).toBeGreaterThanOrEqual(1)
    expect(straights.some((s) => s.rank === 7)).toBe(true)
  })
  it('two wilds + pair makes a 4-bomb', () => {
    const b = has(recognize(hand('H5', 'H5', 'SQ', 'HQ'), L5), 'bomb')
    expect(b?.bombLevel).toBe(4)
    expect(b?.rank).toBe(12)
  })
  it('two wild cards alone form a pair of the level rank', () => {
    const p = has(recognize(hand('H5', 'H5'), L5), 'pair')
    expect(p?.rank).toBeGreaterThan(14) // level rank is elevated above Ace
  })
})

describe('canBeat', () => {
  it('higher pair beats lower pair', () => {
    const lo = pickBest(recognize(hand('S7', 'H7'), L2), 'pair')!
    const hi = pickBest(recognize(hand('S9', 'C9'), L2), 'pair')!
    expect(canBeat(hi, lo, L2)).toBe(true)
    expect(canBeat(lo, hi, L2)).toBe(false)
  })
  it('a pair cannot beat a different-count pair, nor a triple', () => {
    const pair = pickBest(recognize(hand('S9', 'C9'), L2), 'pair')!
    const triple = pickBest(recognize(hand('S7', 'H7', 'D7'), L2), 'triple')!
    expect(canBeat(pair, triple, L2)).toBe(false)
  })
  it('any bomb beats a non-bomb', () => {
    const pair = pickBest(recognize(hand('SA', 'CA'), L2), 'pair')!
    const bomb = pickBest(recognize(hand('S3', 'H3', 'D3', 'C3'), L2), 'bomb')!
    expect(canBeat(bomb, pair, L2)).toBe(true)
    expect(canBeat(pair, bomb, L2)).toBe(false)
  })
  it('straight flush beats a 4-bomb and 5-bomb but loses to a 6-bomb', () => {
    const sf = pickBest(recognize(hand('S3', 'S4', 'S5', 'S6', 'S7'), L2), 'straightflush')!
    const fourBomb = pickBest(recognize(hand('SA', 'HA', 'DA', 'CA'), L2), 'bomb')!
    const fiveBomb = pickBest(recognize(hand('S2', 'H2', 'D2', 'C2', 'S2'), L5), 'bomb')!
    const sixBomb = pickBest(
      recognize(hand('S8', 'H8', 'D8', 'C8', 'S8', 'H8'), L2),
      'bomb',
    )!
    expect(canBeat(sf, fourBomb, L2)).toBe(true)
    expect(canBeat(sf, fiveBomb, L2)).toBe(true)
    expect(canBeat(sixBomb, sf, L2)).toBe(true)
    expect(canBeat(sf, sixBomb, L2)).toBe(false)
  })
  it('joker bomb beats everything', () => {
    const jb = pickBest(recognize(hand('JB', 'JB', 'JS', 'JS'), L2), 'jokerbomb')!
    const tenBomb = pickBest(
      recognize(hand('S9', 'H9', 'D9', 'C9', 'S9', 'H9', 'D9', 'C9', 'S9', 'H9'), L2),
      'bomb',
    )!
    expect(canBeat(jb, tenBomb, L2)).toBe(true)
    expect(canBeat(tenBomb, jb, L2)).toBe(false)
  })
  it('level-rank pair beats an Ace pair', () => {
    const acePair = pickBest(recognize(hand('SA', 'CA'), L5), 'pair')!
    const levelPair = pickBest(recognize(hand('S5', 'C5'), L5), 'pair')!
    expect(canBeat(levelPair, acePair, L5)).toBe(true)
  })
})
