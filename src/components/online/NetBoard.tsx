import { useEffect, useMemo, useState } from 'react'
import {
  recognize,
  pickBest,
  canBeat,
  sortHand,
  levelLabel,
  comboKindLabel,
  Combination,
  Seat,
} from '../../engine'
import { UseRoom } from '../../net/useRoom'
import { Hand } from '../Hand'
import { ScoreChip, SeatChip, YouChip, TrickPile, ActionBar, SeatPos, Relation } from '../game/parts'

export function NetBoard({ room }: { room: UseRoom }) {
  const view = room.view!
  const me = view.youSeat
  const level = view.level
  const usTeam = view.seats[me].team
  const themTeam = usTeam === 0 ? 1 : 0
  const trick = view.trick
  const inPlay = view.phase === 'trickPlay'
  const isMyTurn = inPlay && trick.toAct === me

  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected([])
  }, [trick.toAct, view.handNumber, trick.current])

  const sortedHand = useMemo(() => sortHand(view.yourHand, level), [view.yourHand, level])
  const selectedCards = useMemo(
    () => view.yourHand.filter((c) => selected.includes(c.id)),
    [view.yourHand, selected],
  )
  const preview = useMemo<Combination | null>(() => {
    if (selectedCards.length === 0) return null
    const interps = recognize(selectedCards, level)
    const valid = trick.current === null ? interps : interps.filter((c) => canBeat(c, trick.current!, level))
    return pickBest(valid)
  }, [selectedCards, level, trick.current])

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const canPlay = isMyTurn && preview !== null
  const canPass = isMyTurn && trick.current !== null

  const relation = (seat: Seat): Relation => {
    if (seat === me) return 'me'
    return view.seats[seat].team === usTeam ? 'partner' : 'opp'
  }
  const seatRing: { seat: Seat; pos: SeatPos }[] = [
    { seat: ((me + 2) % 4) as Seat, pos: 'top' },
    { seat: ((me + 1) % 4) as Seat, pos: 'left' },
    { seat: ((me + 3) % 4) as Seat, pos: 'right' },
  ]

  const previewLabel = preview
    ? `Will play: ${comboKindLabel(preview.kind)}`
    : isMyTurn
      ? trick.current
        ? 'Beat it with a higher combo, or pass'
        : 'Select cards to lead'
      : `Waiting for ${view.seats[trick.toAct].name}…`

  const lastResult = view.results[view.results.length - 1]

  return (
    <div className="table-screen">
      <ScoreChip
        usLevel={levelLabel(view.teamLevels[usTeam])}
        themLevel={levelLabel(view.teamLevels[themTeam])}
        handNumber={view.handNumber + 1}
        levelInPlay={levelLabel(level)}
      />

      <div className="hud hud-tr">
        <span className="room-pill">{view.code}</span>
        <button className="ghost" onClick={room.leave}>Leave</button>
      </div>

      {seatRing.map(({ seat, pos }) => (
        <SeatChip
          key={seat}
          pos={pos}
          name={view.seats[seat].name}
          relation={relation(seat)}
          count={view.handCounts[seat]}
          isTurn={inPlay && trick.toAct === seat}
          isBot={view.seats[seat].kind === 'bot'}
          finishedRank={view.finished.indexOf(seat)}
        />
      ))}

      <TrickPile
        combo={trick.current}
        level={level}
        leaderName={view.seats[trick.leader].name}
        lastPlayerName={trick.lastPlayer !== null ? view.seats[trick.lastPlayer].name : null}
        inPlay={inPlay}
      />

      <div className="bottom-bar">
        <YouChip name={view.seats[me].name} count={view.handCounts[me]} isTurn={isMyTurn} />
        <ActionBar
          isMyTurn={isMyTurn}
          canPlay={canPlay}
          canPass={canPass}
          hasSelection={selected.length > 0}
          previewLabel={previewLabel}
          onPlay={() => {
            if (preview) {
              room.play(preview.cards.map((c) => c.id))
              setSelected([])
            }
          }}
          onPass={room.pass}
          onClear={() => setSelected([])}
        />
      </div>

      <div className="hand-dock">
        <Hand
          cards={sortedHand}
          level={level}
          size="lg"
          selected={selected}
          onToggle={toggle}
          interactive={isMyTurn}
        />
      </div>

      {view.phase === 'handEnd' && lastResult && (
        <div className="overlay">
          <div className="modal">
            <h2>{lastResult.winningTeam === usTeam ? 'Your team won the hand! 🎉' : 'Opponents won the hand'}</h2>
            <p>Finish order: {lastResult.finishOrder.map((s, i) => `${i + 1}. ${view.seats[s].name}`).join('  ·  ')}</p>
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
