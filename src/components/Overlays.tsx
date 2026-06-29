import { GameState, levelLabel } from '../engine'
import { SEAT_NAMES } from './game/parts'

export function HandEndOverlay({ state, onNext }: { state: GameState; onNext: () => void }) {
  const r = state.results[state.results.length - 1]
  if (!r) return null
  const youWon = r.winningTeam === 0
  return (
    <div className="overlay">
      <div className="modal">
        <h2>{youWon ? 'Hand won! 🎉' : 'Hand lost'}</h2>
        <p>
          Finish order:{' '}
          {r.finishOrder.map((s, i) => `${i + 1}. ${SEAT_NAMES[s]}`).join('  ·  ')}
        </p>
        <p>
          {youWon ? 'Your team' : 'The opponents'} advanced <b>+{r.gain}</b> to level{' '}
          <b>{levelLabel(r.levelsAfter[r.winningTeam])}</b>.
        </p>
        <button className="primary" onClick={onNext}>
          Next hand →
        </button>
      </div>
    </div>
  )
}

export function GameOverOverlay({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const youWon = state.winnerTeam === 0
  return (
    <div className="overlay">
      <div className="modal">
        <h2>{youWon ? 'You win the game! 🏆' : 'Opponents win'}</h2>
        <p>
          {youWon
            ? 'Your team reached level A and took first place. You are officially a Guandan player!'
            : 'The opponents reached A and won. Revisit the strategy lessons and rematch.'}
        </p>
        <button className="primary" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  )
}
