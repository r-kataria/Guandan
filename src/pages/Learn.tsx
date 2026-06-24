import { Link } from 'react-router-dom'
import { LESSONS } from '../learn/lessons'
import { Tier } from '../learn/types'
import { getCompleted, resetProgress } from '../learn/progress'
import { useState } from 'react'

const TIER_ORDER: Tier[] = ['Basics', 'Combinations', 'Bombs', 'Levels & Wilds', 'Strategy']

export function Learn() {
  const [completed, setCompleted] = useState<Set<string>>(() => getCompleted())
  const doneCount = LESSONS.filter((l) => completed.has(l.id)).length

  return (
    <div className="container">
      <div className="hero" style={{ paddingBottom: '0.5rem' }}>
        <h1>Learn Guandan</h1>
        <p>
          Fifteen lessons from the basics to real strategy. Each unlocks the game one idea at a time
          and ends with a hands-on drill checked by the real game engine.
        </p>
        <p>
          <b>{doneCount}</b> / {LESSONS.length} lessons complete
          {doneCount > 0 && (
            <>
              {' · '}
              <button
                className="ghost"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => {
                  resetProgress()
                  setCompleted(new Set())
                }}
              >
                reset progress
              </button>
            </>
          )}
        </p>
      </div>

      {TIER_ORDER.map((tier) => {
        const lessons = LESSONS.filter((l) => l.tier === tier)
        if (lessons.length === 0) return null
        return (
          <div key={tier} style={{ marginTop: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--muted)' }}>{tier}</h3>
            <div className="lesson-list">
              {lessons.map((l) => {
                const done = completed.has(l.id)
                return (
                  <Link to={`/learn/${l.id}`} className="lesson-item" key={l.id}>
                    <div className={`num ${done ? 'done' : ''}`}>{done ? '✓' : l.n}</div>
                    <div className="meta">
                      <div className="t">{l.title}</div>
                      <div className="d">{l.subtitle}</div>
                    </div>
                    {done && <span className="badge done">done</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
