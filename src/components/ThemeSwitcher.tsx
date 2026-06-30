import { useState } from 'react'
import { THEMES, ThemeName, getStoredTheme, applyTheme } from '../theme'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme())
  const change = (t: ThemeName) => {
    setTheme(t)
    applyTheme(t)
  }
  return (
    <div className="theme-switch" role="group" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.key}
          className={`theme-dot ${t.key} ${theme === t.key ? 'on' : ''}`}
          title={`${t.label} — ${t.blurb}`}
          aria-label={t.label}
          aria-pressed={theme === t.key}
          onClick={() => change(t.key)}
        />
      ))}
    </div>
  )
}
