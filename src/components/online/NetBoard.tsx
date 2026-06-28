import { useEffect, useMemo, useState } from 'react'
import {
  recognize,
  pickBest,
  canBeat,
  findHint,
  sortHand,
  levelLabel,
  comboKindLabel,
  teamOf,
  Combination,
} from '../../engine'
import { UseRoom } from '../../net/useRoom'
import { NetTable } from './NetTable'
import { Hand } from '../Hand'

export function NetBoard({ room }: { room: UseRoom }) {
  const view = room.view!
  const me = view.youSeat
  const level = view.level
  const [selected, setSelected] = useState<string[]>([])
  const [hintIds, setHintIds] = useState<string[]>([])

  const isMyTurn = view.phase === 'trickPlay' && view.trick.toAct === me

  // Reset selection whenever the turn or trick changes.
  useEffect(() => {
    setSelected([])
    setHintIds([])
  }, [view.trick.toAct, view.handNumber, view.trick.current])

  const sortedHand = useMemo(() => sortHand(view.yourHand, level), [view.yourHand, level])
  const selectedCards = useMemo(
    () => view.yourHand.filter((c) => selected.includes(c.id)),
    [view.yourHand, selected],
  )

  const preview = useMemo<Combination | null>(() => {
    if (selectedCards.length === 0) return null
    const interps = recognize(selectedCards, level)
    const valid = view.trick.current === null
      ? interps
      : interps.filter((c) => canBeat(c, view.trick.current!, level))
    return pickBest(valid)
  }, [selectedCards, level, view.trick.current])

  const toggle = (id: string) => {
    setHintIds([])
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const doPlay = () => {
    if (!preview) return
    room.play(preview.cards.map((c) => c.id))
    setSelected([])
  }
  const doHint = () => {
    const h = findHint(view.yourHand, view.trick.current, level)
    if (h) {
      setHintIds(h.cards.map((c) => c.id))
      setSelected(h.cards.map((c) => c.id))
    }
  }

  const usTeam = teamOf(me)
  const themTeam = usTeam === 0 ? 1 : 0
  const lastResult = view.results[view.results.length - 1]

  const turnText = () => {
    if (view.phase !== 'trickPlay') return ''
    if (isMyTurn) return 'Your turn'
    return `Waiting for ${view.seats[view.trick.toAct].name}…`
  }

  return (
    <div className="container">
      <div className="setup-row">
        <span className="room-code" style={{ fontSize: '1rem', letterSpacing: 3, padding: '0.3rem 0.7rem' }}>{view.code}</span>
        <span className={`turn-banner ${isMyTurn ? 'you' : ''}`}>{turnText()}</span>
        <div style={{ flex: 1 }} />
        <button className="ghost" onClick={room.leave}>Leave</button>
      </div>

      <div className="play-layout">
        <div>
          <NetTable view={view} />
          <Hand
            cards={sortedHand}
            level={level}
            selected={selected}
            hintIds={hintIds}
            onToggle={toggle}
            interactive={isMyTurn}
          />
          <div className="controls">
            <button className="primary" disabled={!isMyTurn || !preview} onClick={doPlay}>Play</button>
            <button disabled={!isMyTurn || view.trick.current === null} onClick={room.pass}>Pass</button>
            <button className="ghost" disabled={!isMyTurn} onClick={doHint}>Hint</button>
            <button className="ghost" disabled={selected.length === 0} onClick={() => setSelected([])}>Clear</button>
            {room.error ? (
              <span className="err">{room.error}</span>
            ) : preview ? (
              <span className="preview">Will play: {comboKindLabel(preview.kind)}</span>
            ) : isMyTurn ? (
              <span className="preview">{view.trick.current ? 'Beat it with a higher combo, or pass.' : 'Select cards to lead.'}</span>
            ) : (
              <span className="preview">Watching…</span>
            )}
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="panel">
            <h3>Levels</h3>
            <div className="levels">
              <div className="level-card us">
                <div className="who">Your team</div>
                <div className="big">{levelLabel(view.teamLevels[usTeam])}</div>
              </div>
              <div className="level-card them">
                <div className="who">Opponents</div>
                <div className="big">{levelLabel(view.teamLevels[themTeam])}</div>
              </div>
            </div>
            <div className="kbd-hint">Hand #{view.handNumber + 1} · level in play: <b>{levelLabel(level)}</b></div>
          </div>
          <div className="panel">
            <h3>Players</h3>
            <div className="log">
              {([0, 1, 2, 3] as const).map((s) => (
                <div className="row" key={s}>
                  {view.seats[s].name} — {view.handCounts[s]} cards{teamOf(s) === usTeam ? ' (your team)' : ''}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {view.phase === 'handEnd' && lastResult && (
        <div className="overlay">
          <div className="modal">
            <h2>{lastResult.winningTeam === usTeam ? 'Your team won the hand! 🎉' : 'Opponents won the hand'}</h2>
            <p>
              Finish order: {lastResult.finishOrder.map((s, i) => `${i + 1}. ${view.seats[s].name}`).join('  ·  ')}
            </p>
            <p>Next hand starting shortly…</p>
          </div>
        </div>
      )}

      {view.phase === 'gameOver' && (
        <div className="overlay">
          <div className="modal">
            <h2>{view.winnerTeam === usTeam ? 'Your team wins the game! 🏆' : 'Opponents win the game'}</h2>
            <p>Reached level A first. Good game!</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {view.isHost && <button className="primary" onClick={room.rematch}>Rematch</button>}
              <button className="ghost" onClick={room.leave}>Leave room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
