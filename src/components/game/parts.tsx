// Shared presentational pieces for the full-screen game table (used by both Play vs AI and
// online multiplayer). Pure UI — no game logic.

import { Combination, NaturalRank, Seat, comboKindLabel, cardLabel } from '../../engine'
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

export function SeatChip({
  pos,
  name,
  relation,
  count,
  isTurn,
  isBot,
  finishedRank,
}: {
  pos: SeatPos
  name: string
  relation: Relation
  count: number
  isTurn: boolean
  isBot?: boolean
  finishedRank?: number
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
      </div>
      <MiniFan count={count} />
      <div className="seat-count">{count} cards</div>
    </div>
  )
}

export function YouChip({ name, count, isTurn }: { name: string; count: number; isTurn: boolean }) {
  return (
    <div className={`you-chip ${isTurn ? 'turn' : ''}`}>
      <span className="avatar-badge">{(name || 'Y').charAt(0).toUpperCase()}</span>
      <span>
        {name} <span className="sub">· {count} cards</span>
      </span>
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
  return (
    <div className="trick2">
      {combo && lastPlayerName ? (
        <>
          <div className="pile pop" key={combo.cards.map((c) => c.id).join(',')}>
            {combo.cards.map((c) => (
              <CardTile key={c.id} card={c} level={level} size="md" />
            ))}
          </div>
          <div className="trick-meta">
            {lastPlayerName} · {comboKindLabel(combo.kind)} ({combo.cards.map(cardLabel).join(' ')})
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
        {onHint && (
          <button className="ghost" disabled={!isMyTurn} onClick={onHint}>
            Hint
          </button>
        )}
        <button className="ghost" disabled={!hasSelection} onClick={onClear}>
          Clear
        </button>
        <button disabled={!canPass} onClick={onPass}>
          Pass
        </button>
        <button className="primary" disabled={!canPlay} onClick={onPlay}>
          Play
        </button>
      </div>
    </div>
  )
}
