import { useState } from 'react'
import { UseGuandan, describeCombo } from '../game/useGuandan'

export function Controls({ g }: { g: UseGuandan }) {
  const [err, setErr] = useState<string | null>(null)

  const play = () => {
    const e = g.playSelected()
    setErr(e)
  }

  return (
    <div className="controls">
      <button className="primary" disabled={!g.canPlay} onClick={play}>
        Play
      </button>
      <button disabled={!g.canPass} onClick={() => { setErr(null); g.pass() }}>
        Pass
      </button>
      <button className="ghost" disabled={!g.isHumanTurn} onClick={() => { setErr(null); g.showHint() }}>
        Hint
      </button>
      <button className="ghost" disabled={g.selected.length === 0} onClick={() => { setErr(null); g.clearSelection() }}>
        Clear
      </button>

      {err ? (
        <span className="err">{err}</span>
      ) : g.preview ? (
        <span className="preview">Will play: {describeCombo(g.preview)}</span>
      ) : g.isHumanTurn ? (
        <span className="preview">
          {g.state.trick.current ? 'Select a higher combo of the same type, or pass.' : 'Select cards to lead.'}
        </span>
      ) : (
        <span className="preview">Waiting for other players…</span>
      )}
    </div>
  )
}
