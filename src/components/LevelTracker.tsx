import { GameState, levelLabel, teamOf } from '../engine'
import { HUMAN_SEAT } from '../game/useGuandan'

export function LevelTracker({ state }: { state: GameState }) {
  const usTeam = teamOf(HUMAN_SEAT)
  const themTeam = usTeam === 0 ? 1 : 0
  return (
    <div className="panel">
      <h3>Levels</h3>
      <div className="levels">
        <div className="level-card us">
          <div className="who">You &amp; Partner</div>
          <div className="big">{levelLabel(state.teamLevels[usTeam])}</div>
          {state.declarerTeam === usTeam && <span className="badge">declarer</span>}
        </div>
        <div className="level-card them">
          <div className="who">Opponents</div>
          <div className="big">{levelLabel(state.teamLevels[themTeam])}</div>
          {state.declarerTeam === themTeam && <span className="badge">declarer</span>}
        </div>
      </div>
      <div className="kbd-hint">
        Hand #{state.handNumber + 1} · level in play: <b>{levelLabel(state.level)}</b>
      </div>
    </div>
  )
}
