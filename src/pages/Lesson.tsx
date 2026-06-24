import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { LESSONS, getLesson, lessonIndex } from '../learn/lessons'
import { Drill } from '../learn/Drill'
import { isComplete, markComplete } from '../learn/progress'

export function Lesson() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const lesson = id ? getLesson(id) : undefined
  const [solved, setSolved] = useState<boolean>(() => (id ? isComplete(id) : false))

  if (!lesson) {
    return (
      <div className="container">
        <p>Lesson not found.</p>
        <Link to="/learn">← Back to lessons</Link>
      </div>
    )
  }

  const idx = lessonIndex(lesson.id)
  const prev = idx > 0 ? LESSONS[idx - 1] : null
  const next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null
  const isLast = idx === LESSONS.length - 1

  const complete = () => {
    markComplete(lesson.id)
    setSolved(true)
  }

  return (
    <div className="container">
      <div className="steps">
        {LESSONS.map((l) => (
          <div
            key={l.id}
            className={`step-dot ${l.id === lesson.id ? 'on' : ''} ${isComplete(l.id) ? 'done' : ''}`}
            title={`${l.n}. ${l.title}`}
          />
        ))}
      </div>

      <div className="badge">{lesson.tier} · Lesson {lesson.n} of {LESSONS.length}</div>
      <h1 style={{ margin: '0.4rem 0 0.2rem' }}>{lesson.title}</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>{lesson.subtitle}</p>

      {lesson.body}

      {lesson.drill ? (
        <Drill drill={lesson.drill} onSolved={complete} />
      ) : (
        <div className="drill-box">
          <p style={{ fontWeight: 700 }}>Ready for your graduation challenge?</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/play">
              <button className="primary">Play vs the Hard AI →</button>
            </Link>
            {!solved && (
              <button className="ghost" onClick={complete}>
                Mark complete
              </button>
            )}
          </div>
        </div>
      )}

      {solved && (
        <div className="drill-status ok" style={{ marginTop: '0.5rem' }}>
          ✓ Lesson complete{next ? '' : ' — you finished the whole track! 🎓'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.5rem' }}>
        <div>
          {prev && (
            <button className="ghost" onClick={() => navigate(`/learn/${prev.id}`)}>
              ← {prev.title}
            </button>
          )}
        </div>
        <div>
          {next ? (
            <button className={solved ? 'primary' : 'ghost'} onClick={() => navigate(`/learn/${next.id}`)}>
              {next.title} →
            </button>
          ) : (
            !isLast && (
              <Link to="/learn">
                <button className="ghost">Back to lessons</button>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
