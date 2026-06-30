// Shared presentational pieces for the full-screen game table (used by both Play vs AI and
// online multiplayer). Pure UI — no game logic.

import { useEffect, useState } from 'react'
import {
  Combination,
  NaturalRank,
  Seat,
  TributePlan,
  comboKindLabel,
  cardLabel,
  sortHand,
  cardLabelFromId,
} from '../../engine'
import { CardTile } from '../Card'

export type SeatPos = 'top' | 'left' | 'right'
export type Relation = 'me' | 'partner' | 'opp'

/** Fixed seat names for the solo (vs AI) game, where the human is always seat 0. */
export const SEAT_NAMES: Record<Seat, string> = {
  0: 'You',
  1: 'Right (Opp)',
  2: 'Partner',
  3: 'Left (Opp)',
}

function MiniFan({ count }: { count: number }) {
  const shown = Math.min(count, 14)
  return (
    <div className="mini-fan">
      {Array.from({ length: shown }, (_, i) => (
        <div className="mini-back" key={i} />
      ))}
    </div>
  )
}

export function ScoreChip({
  usLevel,
  themLevel,
  handNumber,
  levelInPlay,
}: {
  usLevel: string
  themLevel: string
  handNumber: number
  levelInPlay: string
}) {
  return (
    <div className="hud hud-tl">
      <div className="score-chip">
        <div className="team us">
          <span className="lbl">You</span>
          <span className="lvl">{usLevel}</span>
        </div>
        <span className="vs">vs</span>
        <div className="team them">
          <span className="lbl">Them</span>
          <span className="lvl">{themLevel}</span>
        </div>
        <div className="meta">
          Hand <b>{handNumber}</b>
          <br />
          Level <b>{levelInPlay}</b>
        </div>
      </div>
    </div>
  )
}

function TimerBadge({ secondsLeft }: { secondsLeft?: number | null }) {
  if (secondsLeft === undefined || secondsLeft === null) return null
  return <span className={`timer-badge ${secondsLeft <= 5 ? 'low' : ''}`}>{secondsLeft}s</span>
}

export function SeatChip({
  pos,
  name,
  relation,
  count,
  isTurn,
  isBot,
  finishedRank,
  secondsLeft,
}: {
  pos: SeatPos
  name: string
  relation: Relation
  count: number
  isTurn: boolean
  isBot?: boolean
  finishedRank?: number
  secondsLeft?: number | null
}) {
  return (
    <div className={`seat2 ${pos} ${relation} ${isTurn ? 'turn' : ''}`}>
      <div className="who">
        <span className="avatar-badge">{(name || '?').charAt(0).toUpperCase()}</span>
        <span>{name}</span>
        {isBot && <span className="badge">bot</span>}
        {finishedRank !== undefined && finishedRank >= 0 && (
          <span className="badge done">#{finishedRank + 1}</span>
        )}
        {isTurn && <TimerBadge secondsLeft={secondsLeft} />}
      </div>
      <MiniFan count={count} />
      <div className="seat-count">{count} cards</div>
    </div>
  )
}

export function YouChip({
  name,
  count,
  isTurn,
  secondsLeft,
}: {
  name: string
  count: number
  isTurn: boolean
  secondsLeft?: number | null
}) {
  return (
    <div className={`you-chip ${isTurn ? 'turn' : ''}`}>
      <span className="avatar-badge">{(name || 'Y').charAt(0).toUpperCase()}</span>
      <span>
        {name} <span className="sub">· {count} cards</span>
      </span>
      {isTurn && <TimerBadge secondsLeft={secondsLeft} />}
    </div>
  )
}

/** A transient banner shown at the start of a hand explaining the tribute exchange. */
export function TributeBanner({
  plan,
  handNumber,
  nameOf,
}: {
  plan: TributePlan | null
  handNumber: number
  nameOf: (seat: Seat) => string
}) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    setShow(true)
    const t = setTimeout(() => setShow(false), 7000)
    return () => clearTimeout(t)
  }, [handNumber])

  if (!plan || handNumber === 0 || !show) return null

  return (
    <div className="tribute-banner">
      <div className="tb-title">Tribute</div>
      {plan.cancelled ? (
        <div className="tb-row">Anti-tribute — the losing side held both Big Jokers, so tribute is cancelled.</div>
      ) : (
        <>
          {plan.payments.map((p, i) => (
            <div className="tb-row" key={`p${i}`}>
              <b>{nameOf(p.from)}</b> paid <span className="tb-card">{cardLabelFromId(p.cardId)}</span> to{' '}
              <b>{nameOf(p.to)}</b>
            </div>
          ))}
          {plan.returns.map((r, i) => (
            <div className="tb-row dim" key={`r${i}`}>
              <b>{nameOf(r.from)}</b> returned <span className="tb-card">{cardLabelFromId(r.cardId)}</span> to{' '}
              <b>{nameOf(r.to)}</b>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export function TrickPile({
  combo,
  level,
  leaderName,
  lastPlayerName,
  inPlay,
}: {
  combo: Combination | null
  level: NaturalRank
  leaderName: string
  lastPlayerName: string | null
  inPlay: boolean
}) {
  const cards = combo ? sortHand(combo.cards, level) : []
  return (
    <div className="trick2">
      {combo && lastPlayerName ? (
        <>
          <div className="pile pop" key={cards.map((c) => c.id).join(',')}>
            {cards.map((c) => (
              <CardTile key={c.id} card={c} level={level} size="md" />
            ))}
          </div>
          <div className="trick-meta">
            {lastPlayerName} · {comboKindLabel(combo.kind)} ({cards.map(cardLabel).join(' ')})
          </div>
        </>
      ) : (
        <div className="trick-empty">{inPlay ? `${leaderName} to lead` : 'Hand over'}</div>
      )}
    </div>
  )
}

export function ActionBar({
  isMyTurn,
  canPlay,
  canPass,
  hasSelection,
  previewLabel,
  onPlay,
  onPass,
  onClear,
  onHint,
}: {
  isMyTurn: boolean
  canPlay: boolean
  canPass: boolean
  hasSelection: boolean
  previewLabel: string
  onPlay: () => void
  onPass: () => void
  onClear: () => void
  onHint?: () => void
}) {
  return (
    <div className={`action-bar ${isMyTurn ? 'active' : ''}`}>
      <div className={`ab-preview ${canPlay ? 'ok' : ''}`}>{previewLabel}</div>
      <div className="ab-buttons">
        <button disabled={!canPass} onClick={onPass}>
          Pass
        </button>
        <button className="ghost" disabled={!hasSelection} onClick={onClear}>
          Clear
        </button>
        {onHint && (
          <button className="ghost" disabled={!isMyTurn} onClick={onHint}>
            Hint
          </button>
        )}
        <button className="primary" disabled={!canPlay} onClick={onPlay}>
          Play
        </button>
      </div>
    </div>
  )
}
