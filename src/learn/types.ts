import { ReactNode } from 'react'
import { NaturalRank, ComboKind } from '../engine'

export interface QuizOption {
  text: string
  correct: boolean
  why?: string
}

export interface QuizDrill {
  type: 'quiz'
  question: string
  options: QuizOption[]
}

export interface SelectDrill {
  type: 'select'
  level: NaturalRank
  /** The learner's hand (card specs). */
  hand: string[]
  /** Optional combination already on the table that the learner must beat. */
  current?: string[]
  prompt: string
  /** Require the played combination to be this kind. */
  requireKind?: ComboKind
  /** Require the played combination to beat `current`. */
  mustBeat?: boolean
  /** Exact number of cards expected (extra guard for teaching). */
  exactCount?: number
  hint?: string
  successMsg: string
}

export type Drill = QuizDrill | SelectDrill

export type Tier = 'Basics' | 'Combinations' | 'Bombs' | 'Levels & Wilds' | 'Strategy'

export interface LessonDef {
  id: string
  n: number
  title: string
  subtitle: string
  tier: Tier
  body: ReactNode
  drill?: Drill
}
