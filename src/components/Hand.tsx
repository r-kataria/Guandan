import { useEffect, useRef, useState, CSSProperties } from 'react'
import { Card as CardT, NaturalRank } from '../engine'
import { CardTile } from './Card'

interface Props {
  cards: CardT[]
  level: NaturalRank
  selected: string[]
  hintIds?: string[]
  onToggle: (id: string) => void
  interactive: boolean
  size?: 'md' | 'lg'
}

const CARD_WIDTHS = { md: 50, lg: 62 }
const MAX_ADVANCE = 46 // px between card left edges when there's plenty of room
const GAP = 24 // extra space opened to the right of a raised card
const LIFT_SELECTED = 26
const LIFT_HOVER = 16

// The hand is one row that always fits the available width: the per-card overlap is computed so
// 27 cards never wrap. When a card is raised (hovered/selected) it lifts AND pushes the cards to
// its right aside, so a raised card never hides a neighbour's rank index.
export function Hand({ cards, level, selected, hintIds = [], onToggle, interactive, size = 'md' }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const CARD_W = CARD_WIDTHS[size]

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const n = cards.length
  const avail = (width || 760) - 16
  const advance = n > 1 ? Math.min(MAX_ADVANCE, (avail - CARD_W) / (n - 1)) : MAX_ADVANCE
  const marginLeft = -(CARD_W - advance) // negative overlap applied to every card after the first

  let raisedBefore = 0

  return (
    <div className="hand-area" ref={wrapRef}>
      <div className="hand-row" onMouseLeave={() => setHovered(null)}>
        {cards.map((c, i) => {
          const isSelected = selected.includes(c.id)
          const isHovered = interactive && hovered === c.id
          const raised = isSelected || isHovered
          const shift = raisedBefore * GAP
          const lift = isSelected ? LIFT_SELECTED : isHovered ? LIFT_HOVER : 0
          if (raised) raisedBefore++

          const style: CSSProperties = { zIndex: raised ? 200 + i : i }
          if (i > 0) style.marginLeft = marginLeft
          if (shift || lift) style.transform = `translate(${shift}px, ${-lift}px)`

          return (
            <CardTile
              key={c.id}
              card={c}
              level={level}
              size={size}
              index={i}
              style={style}
              selectable={interactive}
              selected={isSelected}
              hinted={hintIds.includes(c.id)}
              onClick={interactive ? () => onToggle(c.id) : undefined}
              onMouseEnter={interactive ? () => setHovered(c.id) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
