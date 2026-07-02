// feedback.ts — shared sound + stats side-effects for both the solo and online boards.
// Watches primitive snapshots of the game and fires on transitions, so the boards stay dumb.

import { useEffect, useRef } from 'react'
import { sfx } from '../sound'
import { recordGame, recordHand } from '../stats'

export interface FeedbackSnapshot {
  phase: string
  handNumber: number
  /** Stable identity of the current trick combo (joined card ids), or null. */
  comboKey: string | null
  comboIsBomb: boolean
  isMyTurn: boolean
  /** Did my team win — only read when phase is handEnd / gameOver. */
  wonHand: boolean | null
  wonGame: boolean | null
}

export function useGameFeedback(s: FeedbackSnapshot): void {
  const prev = useRef<FeedbackSnapshot | null>(null)

  useEffect(() => {
    const p = prev.current
    prev.current = s
    if (!p) return

    // A new combo hit the table.
    if (s.comboKey && s.comboKey !== p.comboKey) {
      sfx(s.comboIsBomb ? 'bomb' : 'card')
    }
    // It just became my turn.
    if (s.phase === 'trickPlay' && s.isMyTurn && !p.isMyTurn) {
      sfx('turn')
    }
    // New hand dealt.
    if (s.handNumber !== p.handNumber) {
      sfx('deal')
    }
    // Hand finished.
    if (s.phase === 'handEnd' && p.phase !== 'handEnd' && s.wonHand !== null) {
      recordHand(s.wonHand)
    }
    // Game finished.
    if (s.phase === 'gameOver' && p.phase !== 'gameOver' && s.wonGame !== null) {
      recordHand(s.wonGame) // the final hand also counts
      recordGame(s.wonGame)
      sfx(s.wonGame ? 'win' : 'lose')
    }
  }, [s.phase, s.handNumber, s.comboKey, s.comboIsBomb, s.isMyTurn, s.wonHand, s.wonGame]) // eslint-disable-line react-hooks/exhaustive-deps
}
