// coach.ts — contextual coaching tips shown during play. Pure: derives a short tip from the
// current game state + the human's options, so a learner always knows what to think about.

import {
  GameState,
  Seat,
  Combination,
  comboKindLabel,
  generateResponses,
  findHint,
  isBomb,
  cardLabel,
} from '../engine'
import { HUMAN_SEAT } from './useGuandan'

export function coachTip(state: GameState, humanSeat: Seat = HUMAN_SEAT): string {
  if (state.phase === 'gameOver') {
    return state.winnerTeam === 0
      ? 'You reached level A and won the game. 🎉 Try Hard difficulty next!'
      : 'The opponents reached A first. Review the strategy lessons and try again.'
  }
  if (state.phase === 'handEnd') {
    const r = state.results[state.results.length - 1]
    const youWon = r.winningTeam === 0
    return youWon
      ? `Your team finished first and gained ${r.gain} level(s). The previous loser pays tribute next hand.`
      : `Opponents won this hand (+${r.gain}). You'll likely pay tribute — your highest card goes to them.`
  }

  const hand = state.hands[humanSeat]
  const current = state.trick.current

  if (state.trick.toAct !== humanSeat) {
    return 'Watch how the bots play — notice when they hold back bombs and when they spend control cards.'
  }

  if (current === null) {
    return 'You lead this trick. Leading low singles or pairs "probes" opponents while keeping your bombs and high cards for later.'
  }

  const responses = generateResponses(hand, current, state.level)
  if (responses.length === 0) {
    return `You can't beat this ${comboKindLabel(current.kind)}. Pass — you'll get another chance when the trick resets.`
  }

  const hint = findHint(hand, current, state.level)
  if (hint && isBomb(hint) && responses.every((r) => isBomb(r))) {
    const oppMin = Math.min(
      ...([1, 3] as Seat[]).filter((s) => !state.finished.includes(s)).map((s) => state.hands[s].length),
    )
    if (oppMin <= 5) {
      return 'Only a bomb can beat this — and an opponent is nearly out. This is a good moment to drop it.'
    }
    return 'Only a bomb beats this. Bombs are precious — usually better to pass unless an opponent is about to finish.'
  }

  if (hint) {
    return `You can answer with a ${comboKindLabel(hint.kind)} (${hint.cards.map(cardLabel).join(' ')}). Use Hint to auto-select it.`
  }
  return 'Select cards that match the current combination type but rank higher, or pass.'
}

export function coachForCombo(combo: Combination | null): string {
  if (!combo) return ''
  return `${comboKindLabel(combo.kind)} · ${combo.count} card(s)`
}
