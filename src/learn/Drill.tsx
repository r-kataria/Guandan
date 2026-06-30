import { useMemo, useState } from 'react'
import {
  recognize,
  pickBest,
  canBeat,
  comboKindLabel,
  sortHand,
  Combination,
} from '../engine'
import { CardTile } from '../components/Card'
import { buildCards } from './cards'
import { Drill as DrillT, SelectDrill, QuizDrill } from './types'

export function Drill({ drill, onSolved }: { drill: DrillT; onSolved: () => void }) {
  if (drill.type === 'quiz') return <QuizRunner drill={drill} onSolved={onSolved} />
  return <SelectRunner drill={drill} onSolved={onSolved} />
}

function QuizRunner({ drill, onSolved }: { drill: QuizDrill; onSolved: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const chosen = picked !== null ? drill.options[picked] : null

  return (
    <div className="drill-box">
      <div className="badge">Quiz</div>
      <p style={{ fontWeight: 700 }}>{drill.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {drill.options.map((o, i) => (
          <button
            key={i}
            className={picked === i ? (o.correct ? 'primary' : 'danger') : 'ghost'}
            style={{ textAlign: 'left' }}
            onClick={() => {
              setPicked(i)
              if (o.correct) onSolved()
            }}
          >
            {o.text}
          </button>
        ))}
      </div>
      {chosen && (
        <div className={`drill-status ${chosen.correct ? 'ok' : 'no'}`}>
          {chosen.correct ? '✓ Correct. ' : '✗ Not quite. '}
          {chosen.why}
        </div>
      )}
    </div>
  )
}

function SelectRunner({ drill, onSolved }: { drill: SelectDrill; onSolved: () => void }) {
  const handCards = useMemo(() => buildCards(drill.hand), [drill])
  const currentCombo = useMemo<Combination | null>(() => {
    if (!drill.current) return null
    return pickBest(recognize(buildCards(drill.current), drill.level))
  }, [drill])

  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const toggle = (id: string) => {
    setResult(null)
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const submit = () => {
    const cards = handCards.filter((c) => selected.includes(c.id))
    if (cards.length === 0) {
      setResult({ ok: false, msg: 'Select some cards first.' })
      return
    }
    const interps = recognize(cards, drill.level)
    if (interps.length === 0) {
      setResult({ ok: false, msg: "Those cards don't form a valid combination. Try again." })
      return
    }
    let pool = drill.requireKind ? interps.filter((c) => c.kind === drill.requireKind) : interps
    if (drill.requireKind && pool.length === 0) {
      setResult({
        ok: false,
        msg: `That's a valid play, but not a ${comboKindLabel(drill.requireKind)}. ${drill.hint ?? ''}`,
      })
      return
    }
    if (drill.exactCount && cards.length !== drill.exactCount) {
      setResult({ ok: false, msg: `Use exactly ${drill.exactCount} cards. ${drill.hint ?? ''}` })
      return
    }
    if (drill.mustBeat && currentCombo) {
      pool = pool.filter((c) => canBeat(c, currentCombo, drill.level))
      if (pool.length === 0) {
        setResult({ ok: false, msg: `That doesn't beat the current play. ${drill.hint ?? ''}` })
        return
      }
    }
    setResult({ ok: true, msg: drill.successMsg })
    onSolved()
  }

  return (
    <div className="drill-box">
      <div className="badge">Drill</div>
      <p style={{ fontWeight: 700 }}>{drill.prompt}</p>

      {currentCombo && (
        <div style={{ margin: '0.5rem 0' }}>
          <div className="kbd-hint">On the table ({comboKindLabel(currentCombo.kind)}):</div>
          <div className="card-row" style={{ gap: 4, marginTop: 4 }}>
            {sortHand(currentCombo.cards, drill.level).map((c) => (
              <CardTile key={c.id} card={c} level={drill.level} size="sm" />
            ))}
          </div>
        </div>
      )}

      <div className="kbd-hint" style={{ marginTop: 8 }}>Your cards — tap to select:</div>
      <div className="card-row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6, paddingTop: 14 }}>
        {handCards.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            level={drill.level}
            selectable
            selected={selected.includes(c.id)}
            onClick={() => toggle(c.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
        <button className="primary" onClick={submit}>
          Check
        </button>
        <button className="ghost" onClick={() => { setSelected([]); setResult(null) }}>
          Clear
        </button>
        {drill.hint && (
          <button className="ghost" onClick={() => setResult({ ok: false, msg: drill.hint! })}>
            Hint
          </button>
        )}
      </div>

      {result && <div className={`drill-status ${result.ok ? 'ok' : 'no'}`}>{result.msg}</div>}
    </div>
  )
}
