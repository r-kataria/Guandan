import { useEffect, useMemo, useState } from 'react'
import {
  recognize,
  pickBest,
  canBeat,
  sortHand,
  levelLabel,
  comboKindLabel,
  isBomb,
  Combination,
  Seat,
} from '../../engine'
import { UseRoom } from '../../net/useRoom'
import { useGameFeedback } from '../../game/feedback'
import { Hand } from '../Hand'
import { ScoreChip, SeatChip, YouChip, TrickPile, ActionBar, TributeBanner, LevelTrack, SeatPos, Relation } from '../game/parts'

/** Live seconds remaining until `endsAt` (epoch ms), or null. Ticks while active. */
function useCountdown(endsAt: number | null): number | null {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(id)
  }, [endsAt])
  if (endsAt === null) return null
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}

export function NetBoard({ room, onCodeTap }: { room: UseRoom; onCodeTap?: () => void }) {
  const view = room.view!
  const me = view.youSeat
  const level = view.level
  const usTeam = view.seats[me].team
  const themTeam = usTeam === 0 ? 1 : 0
  const trick = view.trick
  const inPlay = view.phase === 'trickPlay'
  const isMyTurn = inPlay && trick.toAct === me

  const [selected, setSelected] = useState<string[]>([])
  const secondsLeft = useCountdown(inPlay ? view.turnEndsAt : null)
  const lastResult = view.results[view.results.length - 1]

  useGameFeedback({
    phase: view.phase,
    handNumber: view.handNumber,
    comboKey: trick.current ? trick.current.cards.map((c) => c.id).join(',') : null,
    comboIsBomb: trick.current ? isBomb(trick.current) : false,
    isMyTurn,
    wonHand: lastResult ? lastResult.winningTeam === usTeam : null,
    wonGame: view.winnerTeam !== null ? view.winnerTeam === usTeam : null,
  })

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

  // Keyboard shortcuts: Enter = Play, P = Pass, C = Clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'enter' && canPlay && preview) {
        room.play(preview.cards.map((c) => c.id))
        setSelected([])
      } else if (k === 'p' && canPass) room.pass()
      else if (k === 'c') setSelected([])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canPlay, canPass, preview, room])

  // Screen direction of a seat relative to me (for the card fly-in).
  const posOf = (seat: Seat): 'top' | 'left' | 'right' | 'bottom' => {
    const off = (seat - me + 4) % 4
    return off === 0 ? 'bottom' : off === 1 ? 'left' : off === 2 ? 'top' : 'right'
  }

  return (
    <div className="table-screen">
      <ScoreChip
        usLevel={levelLabel(view.teamLevels[usTeam])}
        themLevel={levelLabel(view.teamLevels[themTeam])}
        handNumber={view.handNumber + 1}
        levelInPlay={levelLabel(level)}
      />

      <div className="hud hud-tr">
        <span className="room-pill" onClick={onCodeTap}>{view.code}</span>
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
          secondsLeft={inPlay && trick.toAct === seat ? secondsLeft : null}
        />
      ))}

      <TributeBanner plan={view.lastTribute} handNumber={view.handNumber} nameOf={(s) => view.seats[s].name} />

      <TrickPile
        combo={trick.current}
        level={level}
        leaderName={view.seats[trick.leader].name}
        lastPlayerName={trick.lastPlayer !== null ? view.seats[trick.lastPlayer].name : null}
        inPlay={inPlay}
        fromPos={trick.lastPlayer !== null ? posOf(trick.lastPlayer) : null}
        isBomb={trick.current ? isBomb(trick.current) : false}
      />

      <div className="bottom-bar">
        <YouChip name={view.seats[me].name} count={view.handCounts[me]} isTurn={isMyTurn} secondsLeft={isMyTurn ? secondsLeft : null} />
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
            <LevelTrack usLevel={view.teamLevels[usTeam]} themLevel={view.teamLevels[themTeam]} />
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
