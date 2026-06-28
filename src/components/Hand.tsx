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

export function Hand({ cards, level, selected, hintIds = [], onToggle, interactive }: Props) {
  return (
    <div className="hand-area">
      <div className="hand-row">
        {cards.map((c, i) => (
          <CardTile
            key={c.id}
            card={c}
            level={level}
            index={i}
            selectable={interactive}
            selected={selected.includes(c.id)}
            hinted={hintIds.includes(c.id)}
            onClick={interactive ? () => onToggle(c.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
