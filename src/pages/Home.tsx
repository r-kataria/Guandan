import { Link } from 'react-router-dom'
import { CardTile } from '../components/Card'
import { buildCards } from '../learn/cards'
import { getStats } from '../stats'

function StatsStrip() {
  const s = getStats()
  if (s.gamesPlayed === 0 && s.handsPlayed === 0) return null
  const rate = s.gamesPlayed > 0 ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0
  return (
    <div className="stats-strip fade-up">
      <div className="stat"><b>{s.gamesPlayed}</b><span>games</span></div>
      <div className="stat"><b>{s.gamesWon}</b><span>wins</span></div>
      <div className="stat"><b>{rate}%</b><span>win rate</span></div>
      <div className="stat"><b>{s.handsWon}</b><span>hands won</span></div>
      <div className="stat"><b>{s.bestStreak}</b><span>best streak</span></div>
    </div>
  )
}

const FAN = buildCards(['S10', 'HJ', 'DQ', 'CK', 'SA'])

function HeroFan() {
  const mid = (FAN.length - 1) / 2
  return (
    <div className="card-fan" aria-hidden>
      {FAN.map((c, i) => {
        const off = i - mid
        return (
          <CardTile
            key={c.id}
            card={c}
            size="lg"
            style={{ transform: `rotate(${off * 7}deg) translateY(${Math.abs(off) * 9}px)` }}
          />
        )
      })}
    </div>
  )
}

export function Home() {
  return (
    <div className="container">
      <div className="hero fade-up">
        <div className="badge" style={{ marginBottom: '1rem' }}>4 players · 2 teams · 108 cards</div>
        <h1>
          Learn &amp; Play <span className="cn">掼蛋</span> Guandan
        </h1>
        <p>
          A four-player partnership card game from Jiangsu, China — climbing combinations, bombs,
          wild cards and team levels. Learn it from zero, sharpen up against ruthless AI, and play
          online with friends.
        </p>
        <HeroFan />
        <StatsStrip />
        <div className="cta-row">
          <Link to="/learn">
            <button className="primary">Start learning →</button>
          </Link>
          <Link to="/play">
            <button className="ghost">Play vs AI</button>
          </Link>
          <Link to="/online">
            <button className="ghost">Play online with friends</button>
          </Link>
        </div>
      </div>

      <div className="grid-cards">
        <div className="feature">
          <span className="ico">📚</span>
          <h3>Zero → Pro lessons</h3>
          <p>
            Fifteen bite-size lessons unlock the game one idea at a time — ranks, pairs, straights,
            bombs, the level system, wild cards, tribute, and real strategy. Each ends with an
            interactive drill validated by the real game engine.
          </p>
        </div>
        <div className="feature">
          <span className="ico">🤖</span>
          <h3>AI from gentle to brutal</h3>
          <p>
            Four difficulties. The <b>Master</b> bot counts every card played, plans how to empty
            its hand, hoards guaranteed winners, and bombs to deny your run — it plays like a strong
            human.
          </p>
        </div>
        <div className="feature">
          <span className="ico">🌐</span>
          <h3>Online rooms</h3>
          <p>
            Create a room, share the code, and play with 1–4 friends. Empty seats are filled by
            bots, and with two players you're placed on opposite teams.
          </p>
        </div>
        <div className="feature">
          <span className="ico">🧭</span>
          <h3>A coach at your side</h3>
          <p>
            A live coach panel explains what to think about on every turn, highlights legal moves,
            and offers hints — so you keep learning while you play.
          </p>
        </div>
      </div>
    </div>
  )
}
