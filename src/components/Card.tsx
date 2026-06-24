import { Card as CardT, NaturalRank, rankLabel, suitLabel, isRed, isWild } from '../engine'
import { buildCards } from '../learn/cards'

interface Props {
  card: CardT
  level?: NaturalRank
  selectable?: boolean
  selected?: boolean
  hinted?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

const SIZES = {
  sm: { cw: '34px', ch: '48px' },
  md: { cw: '50px', ch: '70px' },
}

export function CardTile({ card, level, selectable, selected, hinted, size = 'md', onClick }: Props) {
  const red = isRed(card)
  const wild = level !== undefined && isWild(card, level)
  const sz = SIZES[size]

  const classes = [
    'card-tile',
    red ? 'red' : 'black',
    card.kind === 'joker' ? 'joker' : '',
    selectable ? 'selectable' : '',
    selected ? 'selected' : '',
    hinted ? 'hinted' : '',
    wild ? 'wild' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const style = { ['--cw' as string]: sz.cw, ['--ch' as string]: sz.ch }

  if (card.kind === 'joker') {
    return (
      <div className={classes} style={style} onClick={onClick} title={card.joker === 'BIG' ? 'Big Joker' : 'Small Joker'}>
        <div className="corner">{card.joker === 'BIG' ? '★' : '☆'}</div>
        <div className="pip">JOKER</div>
        <div className="corner bottom">{card.joker === 'BIG' ? '★' : '☆'}</div>
      </div>
    )
  }

  const r = rankLabel(card.rank)
  const s = suitLabel(card.suit)
  return (
    <div className={classes} style={style} onClick={onClick} title={`${s}${r}${wild ? ' (wild)' : ''}`}>
      <div className="corner">
        {r}
        <div>{s}</div>
      </div>
      <div className="pip">{s}</div>
      <div className="corner bottom">
        {r}
        <div>{s}</div>
      </div>
    </div>
  )
}

export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sz = SIZES[size]
  return <div className="card-tile back" style={{ ['--cw' as string]: sz.cw, ['--ch' as string]: sz.ch }} />
}

/** Inline, span-based card chip for use inside prose (valid HTML inside <p>). */
export function InlineCard({ card, level }: { card: CardT; level?: NaturalRank }) {
  const red = isRed(card)
  const wild = level !== undefined && isWild(card, level)
  const cls = `ic ${red ? 'red' : 'black'} ${wild ? 'wild' : ''}`
  if (card.kind === 'joker') {
    return <span className={cls} title={card.joker === 'BIG' ? 'Big Joker' : 'Small Joker'}>{card.joker === 'BIG' ? '★JKR' : '☆JKR'}</span>
  }
  return <span className={cls} title={`${suitLabel(card.suit)}${rankLabel(card.rank)}`}>{rankLabel(card.rank)}{suitLabel(card.suit)}</span>
}

/** Render a row of inline card chips from short specs (e.g. ["S7","H7"]). */
export function InlineCards({ specs, level }: { specs: string[]; level?: NaturalRank }) {
  return (
    <span className="inline-cards">
      {buildCards(specs).map((c) => (
        <InlineCard key={c.id} card={c} level={level} />
      ))}
    </span>
  )
}
