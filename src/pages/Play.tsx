import { useGuandan, HUMAN_SEAT } from '../game/useGuandan'
import { Seat, teamOf, levelLabel, comboKindLabel } from '../engine'
import { ScoreChip, SeatChip, YouChip, TrickPile, ActionBar, TributeBanner, SeatPos, Relation, SEAT_NAMES } from '../components/game/parts'
import { Hand } from '../components/Hand'
import { DifficultyPicker } from '../components/GameSetup'
import { HandEndOverlay, GameOverOverlay } from '../components/Overlays'

const US = teamOf(HUMAN_SEAT)
// Screen position for each absolute seat (you at the bottom).
const POS: Record<Seat, SeatPos | 'bottom'> = { 0: 'bottom', 1: 'right', 2: 'top', 3: 'left' }

function relation(seat: Seat): Relation {
  if (seat === HUMAN_SEAT) return 'me'
  return teamOf(seat) === US ? 'partner' : 'opp'
}

export function Play() {
  const g = useGuandan('medium')
  const s = g.state
  const them = US === 0 ? 1 : 0
  const trick = s.trick
  const inPlay = s.phase === 'trickPlay'

  const previewLabel = g.preview
    ? `Will play: ${comboKindLabel(g.preview.kind)}`
    : g.isHumanTurn
      ? trick.current
        ? 'Beat it with a higher combo, or pass'
        : 'Select cards to lead'
      : 'Waiting for other players…'

  return (
    <div className="table-screen">
      <ScoreChip
        usLevel={levelLabel(s.teamLevels[US])}
        themLevel={levelLabel(s.teamLevels[them])}
        handNumber={s.handNumber + 1}
        levelInPlay={levelLabel(s.level)}
      />

      <div className="hud hud-tr">
        <DifficultyPicker value={g.difficulty} onChange={(d) => g.newGame(d)} compact />
        <button className="ghost" onClick={() => g.newGame()}>New game</button>
      </div>

      {([1, 2, 3] as Seat[]).map((seat) => (
        <SeatChip
          key={seat}
          pos={POS[seat] as SeatPos}
          name={SEAT_NAMES[seat]}
          relation={relation(seat)}
          count={s.hands[seat].length}
          isTurn={inPlay && trick.toAct === seat}
          finishedRank={s.finished.indexOf(seat)}
        />
      ))}

      <TributeBanner plan={s.lastTribute} handNumber={s.handNumber} nameOf={(seat) => SEAT_NAMES[seat]} />

      <TrickPile
        combo={trick.current}
        level={s.level}
        leaderName={SEAT_NAMES[trick.leader]}
        lastPlayerName={trick.lastPlayer !== null ? SEAT_NAMES[trick.lastPlayer] : null}
        inPlay={inPlay}
      />

      <div className="bottom-bar">
        <YouChip name={SEAT_NAMES[HUMAN_SEAT]} count={s.hands[HUMAN_SEAT].length} isTurn={g.isHumanTurn} />
        <ActionBar
          isMyTurn={g.isHumanTurn}
          canPlay={g.canPlay}
          canPass={g.canPass}
          hasSelection={g.selected.length > 0}
          previewLabel={previewLabel}
          onPlay={() => g.playSelected()}
          onPass={g.pass}
          onClear={g.clearSelection}
          onHint={g.showHint}
        />
      </div>

      <div className="hand-dock">
        <Hand
          cards={g.sortedHumanHand}
          level={s.level}
          size="lg"
          selected={g.selected}
          hintIds={g.hint ? g.hint.cards.map((c) => c.id) : []}
          onToggle={g.toggleCard}
          interactive={g.isHumanTurn}
        />
      </div>

      {s.phase === 'handEnd' && <HandEndOverlay state={s} onNext={g.nextHand} />}
      {s.phase === 'gameOver' && <GameOverOverlay state={s} onNewGame={() => g.newGame()} />}
    </div>
  )
}
