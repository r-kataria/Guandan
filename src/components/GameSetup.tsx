import { Difficulty } from '../ai'

const DIFFS: { key: Difficulty; label: string; blurb: string }[] = [
  { key: 'easy', label: 'Easy', blurb: 'Bots dump low cards and rarely bomb. Great for your first games.' },
  { key: 'medium', label: 'Medium', blurb: 'Bots conserve control cards, cooperate with partners, and bomb opponents who are nearly out.' },
  { key: 'hard', label: 'Hard', blurb: 'Bots manage bombs aggressively, feed their partner, and punish mistakes.' },
  { key: 'expert', label: 'Expert', blurb: 'Counts every played card, plans how to empty its hand, hoards guaranteed winners, and bombs to deny your run.' },
  { key: 'master', label: 'Master', blurb: 'Everything Expert does, plus tempo mastery: it knows which plays are unbeatable, detects guaranteed run-outs, keeps a safe closer for the endgame, and starves opponents who are nearly out. Our strongest mind.' },
]

export function DifficultyPicker({
  value,
  onChange,
  compact,
}: {
  value: Difficulty
  onChange: (d: Difficulty) => void
  compact?: boolean
}) {
  const seg = (
    <div className="seg">
      {DIFFS.map((d) => (
        <button
          key={d.key}
          className={value === d.key ? 'on' : ''}
          title={d.blurb}
          onClick={() => onChange(d.key)}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
  if (compact) return seg
  return (
    <div>
      {seg}
      <div className="kbd-hint">{DIFFS.find((d) => d.key === value)?.blurb}</div>
    </div>
  )
}
