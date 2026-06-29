import { useState } from 'react'
import { Card as CardT, NaturalRank } from '../engine'
import { CardTile } from './Card'

interface Props {
  cards: CardT[]
  level: NaturalRank
  selected: string[]
  hintIds?: string[]
  onToggle: (id: string) => void
  interactive: boolean
}

// When a card is raised (hovered/selected) it would otherwise paint over its right neighbour's
// rank index. To keep every card readable we lift the raised card AND push the cards to its right
// aside by a gap, so nothing is ever hidden.
const GAP = 22
const LIFT_SELECTED = 24
const LIFT_HOVER = 14

export function Hand({ cards, level, selected, hintIds = [], onToggle, interactive }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  let raisedBefore = 0

  return (
    <div className="hand-area">
      <div className="hand-row" onMouseLeave={() => setHovered(null)}>
        {cards.map((c, i) => {
          const isSelected = selected.includes(c.id)
          const isHovered = interactive && hovered === c.id
          const raised = isSelected || isHovered
          const shift = raisedBefore * GAP
          const lift = isSelected ? LIFT_SELECTED : isHovered ? LIFT_HOVER : 0
          if (raised) raisedBefore++

          const style: React.CSSProperties = { zIndex: raised ? 200 + i : i }
          if (shift || lift) style.transform = `translate(${shift}px, ${-lift}px)`

          return (
            <CardTile
              key={c.id}
              card={c}
              level={level}
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
