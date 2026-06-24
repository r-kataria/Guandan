import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="container">
      <div className="hero">
        <h1>
          Learn &amp; Play <span className="cn">掼蛋</span> Guandan
        </h1>
        <p>
          Guandan is a four-player partnership card game from Jiangsu, China — a game of climbing
          combinations, bombs, wild cards and team levels. Go from total beginner to confident
          player with guided lessons and hands-on drills, then test yourself against AI opponents.
        </p>
        <div className="cta-row">
          <Link to="/learn">
            <button className="primary">Start learning →</button>
          </Link>
          <Link to="/play">
            <button className="ghost">Jump into a game</button>
          </Link>
        </div>
      </div>

      <div className="grid-cards">
        <div className="feature">
          <h3>📚 Zero → Pro lessons</h3>
          <p>
            Fifteen bite-size lessons unlock the game one idea at a time — ranks, pairs, straights,
            bombs, the level system, wild cards, tribute, and real strategy. Each ends with an
            interactive drill validated by the real game engine.
          </p>
        </div>
        <div className="feature">
          <h3>🤖 AI opponents</h3>
          <p>
            Play full games against three bots with Easy, Medium and Hard difficulty. They manage
            bombs, conserve control cards, and cooperate with their partner — just like real players.
          </p>
        </div>
        <div className="feature">
          <h3>🧭 A coach at your side</h3>
          <p>
            A live coach panel explains what to think about on every turn, highlights legal moves,
            and offers hints — so you keep learning while you play.
          </p>
        </div>
        <div className="feature">
          <h3>📖 Full rules reference</h3>
          <p>
            Every combination, the complete bomb hierarchy, and the tribute and scoring rules are a
            click away in the Reference whenever you need a refresher.
          </p>
        </div>
      </div>
    </div>
  )
}
