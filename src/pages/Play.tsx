import { useMemo } from 'react'
import { useGuandan } from '../game/useGuandan'
import { coachTip } from '../game/coach'
import { Table } from '../components/Table'
import { Hand } from '../components/Hand'
import { Controls } from '../components/Controls'
import { LevelTracker } from '../components/LevelTracker'
import { CoachPanel, LogPanel } from '../components/SidePanels'
import { DifficultyPicker } from '../components/GameSetup'
import { HandEndOverlay, GameOverOverlay } from '../components/Overlays'

export function Play() {
  const g = useGuandan('medium')
  const tip = useMemo(() => coachTip(g.state), [g.state])
  const hintIds = g.hint ? g.hint.cards.map((c) => c.id) : []

  return (
    <div className="container">
      <div className="setup-row">
        <DifficultyPicker value={g.difficulty} onChange={(d) => g.newGame(d)} />
        <div className="spacer" style={{ flex: 1 }} />
        <button className="ghost" onClick={() => g.newGame()}>
          New game
        </button>
      </div>

      <div className="play-layout">
        <div>
          <Table state={g.state} level={g.state.level} />
          <Hand
            cards={g.sortedHumanHand}
            level={g.state.level}
            selected={g.selected}
            hintIds={hintIds}
            onToggle={g.toggleCard}
            interactive={g.isHumanTurn}
          />
          <Controls g={g} />
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LevelTracker state={g.state} />
          <CoachPanel tip={tip} />
          <LogPanel log={g.log} />
        </aside>
      </div>

      {g.state.phase === 'handEnd' && <HandEndOverlay state={g.state} onNext={g.nextHand} />}
      {g.state.phase === 'gameOver' && <GameOverOverlay state={g.state} onNewGame={() => g.newGame()} />}
    </div>
  )
}
