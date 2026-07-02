import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CardTile } from '../components/Card'
import { buildCards } from '../learn/cards'
import { getStats } from '../stats'
import { THEMES, ThemeName, getStoredTheme, applyTheme } from '../theme'

// ---------------------------------------------------------------------------
// Hero: floating cards drift around the headline for a cinematic, layered feel.
// ---------------------------------------------------------------------------

const FLOATERS: { spec: string; cls: string }[] = [
  { spec: 'SA', cls: 'f1' },
  { spec: 'HK', cls: 'f2' },
  { spec: 'DQ', cls: 'f3' },
  { spec: 'CJ', cls: 'f4' },
  { spec: 'H10', cls: 'f5' },
  { spec: 'JB', cls: 'f6' },
]

function FloatingCards() {
  return (
    <div className="ld-floats" aria-hidden>
      {FLOATERS.map(({ spec, cls }) => {
        const [card] = buildCards([spec])
        return (
          <div key={spec} className={`ld-float ${cls}`}>
            <CardTile card={card} size="lg" />
          </div>
        )
      })}
    </div>
  )
}

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

// ---------------------------------------------------------------------------
// Marquee ribbon
// ---------------------------------------------------------------------------

const RIBBON = ['108 cards', '♠', '2 decks', '♥', '9 bomb types', '♦', '13 levels', '♣', '15 lessons', '♠', '4 AI tiers', '♥', 'online rooms', '♦', 'wild cards', '♣', 'tribute', '♠', 'straight flushes', '♥']

function Ribbon() {
  const row = RIBBON.map((t, i) => (
    <span key={i} className={t.length === 1 ? 'suit' : ''}>{t}</span>
  ))
  return (
    <div className="ld-ribbon" aria-hidden>
      <div className="ld-ribbon-track">
        <div className="ld-ribbon-row">{row}</div>
        <div className="ld-ribbon-row">{row}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Live theme showcase — clicking a tile re-skins the whole site.
// ---------------------------------------------------------------------------

function ThemeShowcase() {
  const [active, setActive] = useState<ThemeName>(() => getStoredTheme())
  const pick = (t: ThemeName) => {
    applyTheme(t)
    setActive(t)
  }
  return (
    <div className="ld-themes">
      {THEMES.map((t) => (
        <button
          key={t.key}
          className={`ld-theme-tile ${t.key} ${active === t.key ? 'on' : ''}`}
          onClick={() => pick(t.key)}
        >
          <span className="ld-theme-table">
            <span className="ld-theme-card c1" />
            <span className="ld-theme-card c2" />
            <span className="ld-theme-card c3" />
          </span>
          <span className="ld-theme-name">{t.label}</span>
          <span className="ld-theme-blurb">{t.blurb}</span>
          {active === t.key && <span className="badge done">live</span>}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function Home() {
  return (
    <div className="landing">
      {/* HERO */}
      <section className="ld-hero">
        <FloatingCards />
        <div className="ld-hero-inner">
          <div className="badge ld-kicker">掼蛋 · China's most-played partnership card game</div>
          <h1 className="ld-title">
            <span>Climb.</span> <span className="bomb">Bomb.</span> <span className="gold">Conquer.</span>
          </h1>
          <p className="ld-sub">
            Guandan is the four-player climbing game sweeping the world — bombs, wild cards and a
            race from level 2 to Ace. Learn it in an evening. Master it for life.
          </p>
          <div className="cta-row">
            <Link to="/play"><button className="primary ld-cta">Play now — it's free</button></Link>
            <Link to="/learn"><button className="ghost ld-cta">Learn in 15 lessons →</button></Link>
          </div>
          <StatsStrip />
        </div>
      </section>

      <Ribbon />

      {/* MODES */}
      <section className="container ld-section">
        <h2 className="ld-h2">Three ways to play</h2>
        <p className="ld-lead">From your first pair to tournament-grade instincts.</p>
        <div className="ld-modes">
          <Link to="/learn" className="ld-mode">
            <span className="ld-mode-num">01</span>
            <h3>Learn</h3>
            <p>Fifteen bite-size lessons with hands-on drills checked by the real engine. Zero to pro — no rulebook required.</p>
            <span className="ld-arrow">→</span>
          </Link>
          <Link to="/play" className="ld-mode featured">
            <span className="ld-mode-num">02</span>
            <h3>Play vs AI</h3>
            <p>Five difficulty tiers ending at Master — a bot that counts every card, locks in guaranteed finishes, and plays like a strong human.</p>
            <span className="ld-arrow">→</span>
          </Link>
          <Link to="/online" className="ld-mode">
            <span className="ld-mode-num">03</span>
            <h3>Play online</h3>
            <p>Create a room, share a 4-letter code, drag names to set the teams. Bots fill empty seats. Turn timers optional.</p>
            <span className="ld-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* AI SPOTLIGHT */}
      <section className="container ld-section">
        <div className="ld-split">
          <div className="ld-split-copy">
            <h2 className="ld-h2">Meet the Master</h2>
            <p className="ld-lead">Our strongest AI doesn't guess — it counts.</p>
            <ul className="ld-list">
              <li><b>Card memory.</b> Tracks all 108 cards to know which of its own are unbeatable.</li>
              <li><b>Hand planning.</b> Decomposes its hand into the fewest plays needed to go out.</li>
              <li><b>Team instincts.</b> Feeds its partner, hoards bombs, and denies your run at the perfect moment.</li>
            </ul>
            <Link to="/play"><button className="primary">Challenge the Master</button></Link>
          </div>
          <div className="ld-split-visual" aria-hidden>
            <div className="ld-score">
              <span className="ld-score-big">20<span>/20</span></span>
              <span className="ld-score-sub">games won vs the Hard bot in head-to-head testing</span>
            </div>
          </div>
        </div>
      </section>

      {/* THEMES */}
      <section className="container ld-section">
        <h2 className="ld-h2">Three tables. One game.</h2>
        <p className="ld-lead">Classic felt, elegant daylight, or neon glass — tap one to try it live.</p>
        <ThemeShowcase />
      </section>

      {/* FINAL CTA */}
      <section className="container ld-section">
        <div className="ld-final">
          <h2>Your seat is waiting.</h2>
          <p>Full official rules · sound & motion · themes · online rooms · zero sign-up.</p>
          <div className="cta-row">
            <Link to="/play"><button className="primary ld-cta">Deal me in →</button></Link>
          </div>
        </div>
      </section>

      <footer className="ld-footer">
        <span>Guandan 掼蛋 — Learn &amp; Play</span>
        <nav>
          <Link to="/learn">Learn</Link>
          <Link to="/play">Play</Link>
          <Link to="/online">Online</Link>
          <Link to="/reference">Rules</Link>
        </nav>
      </footer>
    </div>
  )
}
