import { Difficulty } from '../ai'

const DIFFS: { key: Difficulty; label: string; blurb: string }[] = [
  { key: 'easy', label: 'Easy', blurb: 'Bots dump low cards and rarely bomb. Great for your first games.' },
  { key: 'medium', label: 'Medium', blurb: 'Bots conserve control cards, cooperate with partners, and bomb opponents who are nearly out.' },
  { key: 'hard', label: 'Hard', blurb: 'Bots manage bombs aggressively, feed their partner, and punish mistakes.' },
]

export function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty
  onChange: (d: Difficulty) => void
}) {
  return (
    <div>
      <div className="seg">
        {DIFFS.map((d) => (
          <button key={d.key} className={value === d.key ? 'on' : ''} onClick={() => onChange(d.key)}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="kbd-hint">{DIFFS.find((d) => d.key === value)?.blurb}</div>
    </div>
  )
}
