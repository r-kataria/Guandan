// useGuandan.ts — React hook bridging the pure engine to the UI. Owns the GameState, the human's
// card selection, drives AI seats on a timer, and keeps a human-readable play log.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createGame,
  reduce,
  GameState,
  Action,
  Seat,
  Card,
  Combination,
  recognize,
  pickBest,
  canBeat,
  findHint,
  sortHand,
  cardLabel,
  comboKindLabel,
  teamOf,
} from '../engine'
import { chooseMove, Difficulty } from '../ai'

export const HUMAN_SEAT: Seat = 0

export interface LogEntry {
  seat: Seat
  text: string
}

export interface UseGuandan {
  state: GameState
  difficulty: Difficulty
  selected: string[]
  sortedHumanHand: Card[]
  preview: Combination | null
  canPlay: boolean
  canPass: boolean
  log: LogEntry[]
  isHumanTurn: boolean
  hint: Combination | null
  toggleCard: (id: string) => void
  clearSelection: () => void
  playSelected: () => string | null // returns error message or null on success
  pass: () => void
  showHint: () => void
  nextHand: () => void
  newGame: (difficulty?: Difficulty, seed?: string) => void
}

let seedCounter = 1

export function useGuandan(initialDifficulty: Difficulty = 'medium'): UseGuandan {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty)
  const [state, setState] = useState<GameState>(() => createGame({ seed: `seed-${seedCounter}` }))
  const [selected, setSelected] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [hint, setHint] = useState<Combination | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHumanTurn = state.phase === 'trickPlay' && state.trick.toAct === HUMAN_SEAT

  const appendLog = useCallback((entry: LogEntry) => {
    setLog((l) => [...l.slice(-40), entry])
  }, [])

  const apply = useCallback(
    (action: Action) => {
      setState((s) => {
        try {
          return reduce(s, action)
        } catch {
          return s
        }
      })
    },
    [],
  )

  // Drive AI seats.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (state.phase !== 'trickPlay') return
    const seat = state.trick.toAct
    if (seat === HUMAN_SEAT) return
    timer.current = setTimeout(() => {
      const action = chooseMove(state, seat, difficulty)
      if (action.type === 'play') {
        appendLog({ seat, text: `plays ${describeCombo(action.combo)}` })
        apply({ type: 'play', seat, combo: action.combo })
      } else {
        appendLog({ seat, text: 'passes' })
        apply({ type: 'pass', seat })
      }
    }, 750)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [state, difficulty, apply, appendLog])

  // Clear stale selection/hint whenever the turn or trick changes.
  useEffect(() => {
    setSelected([])
    setHint(null)
  }, [state.trick.toAct, state.handNumber, state.trick.current])

  const sortedHumanHand = useMemo(
    () => sortHand(state.hands[HUMAN_SEAT], state.level),
    [state.hands, state.level],
  )

  const selectedCards = useMemo(
    () => state.hands[HUMAN_SEAT].filter((c) => selected.includes(c.id)),
    [state.hands, selected],
  )

  // What would actually be played from the current selection (null if illegal/unplayable).
  const preview = useMemo<Combination | null>(() => {
    if (selectedCards.length === 0) return null
    const interps = recognize(selectedCards, state.level)
    const current = state.trick.current
    const valid = current === null ? interps : interps.filter((c) => canBeat(c, current, state.level))
    return pickBest(valid)
  }, [selectedCards, state.level, state.trick.current])

  const canPlay = isHumanTurn && preview !== null
  const canPass = isHumanTurn && state.trick.current !== null

  const toggleCard = useCallback((id: string) => {
    setHint(null)
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
  }, [])

  const clearSelection = useCallback(() => setSelected([]), [])

  const playSelected = useCallback((): string | null => {
    if (!isHumanTurn) return 'Not your turn.'
    if (selectedCards.length === 0) return 'Select cards to play.'
    const interps = recognize(selectedCards, state.level)
    if (interps.length === 0) return 'Those cards do not form a valid combination.'
    const current = state.trick.current
    const valid = current === null ? interps : interps.filter((c) => canBeat(c, current, state.level))
    const combo = pickBest(valid)
    if (!combo) {
      return current
        ? `That can't beat the current ${comboKindLabel(current.kind)}.`
        : 'Invalid combination.'
    }
    appendLog({ seat: HUMAN_SEAT, text: `you play ${describeCombo(combo)}` })
    apply({ type: 'play', seat: HUMAN_SEAT, combo })
    setSelected([])
    return null
  }, [isHumanTurn, selectedCards, state.level, state.trick.current, apply, appendLog])

  const pass = useCallback(() => {
    if (!canPass) return
    appendLog({ seat: HUMAN_SEAT, text: 'you pass' })
    apply({ type: 'pass', seat: HUMAN_SEAT })
    setSelected([])
  }, [canPass, apply, appendLog])

  const showHint = useCallback(() => {
    const h = findHint(state.hands[HUMAN_SEAT], state.trick.current, state.level)
    setHint(h)
    if (h) setSelected(h.cards.map((c) => c.id))
  }, [state.hands, state.trick.current, state.level])

  const nextHand = useCallback(() => {
    appendLog({ seat: HUMAN_SEAT, text: '— new hand —' })
    apply({ type: 'nextHand' })
  }, [apply, appendLog])

  const newGame = useCallback((diff?: Difficulty, seed?: string) => {
    if (diff) setDifficulty(diff)
    seedCounter += 1
    setState(createGame({ seed: seed ?? `seed-${seedCounter}` }))
    setSelected([])
    setLog([])
    setHint(null)
  }, [])

  return {
    state,
    difficulty,
    selected,
    sortedHumanHand,
    preview,
    canPlay,
    canPass,
    log,
    isHumanTurn,
    hint,
    toggleCard,
    clearSelection,
    playSelected,
    pass,
    showHint,
    nextHand,
    newGame,
  }
}

export function describeCombo(combo: Combination): string {
  const top = combo.cards.map(cardLabel).join(' ')
  return `${comboKindLabel(combo.kind)} (${top})`
}

export { teamOf }
