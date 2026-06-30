// theme.ts — three visual themes applied via a data-theme attribute on <html>, persisted locally.

export type ThemeName = 'classic' | 'elegant' | 'futuristic'

export const THEMES: { key: ThemeName; label: string; blurb: string }[] = [
  { key: 'classic', label: 'Classic', blurb: 'Emerald felt & warm gold' },
  { key: 'elegant', label: 'Elegant', blurb: 'Clean light & refined' },
  { key: 'futuristic', label: 'Futuristic', blurb: 'Neon glass & cyan' },
]

const KEY = 'guandan.theme'

export function getStoredTheme(): ThemeName {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'classic' || t === 'elegant' || t === 'futuristic') return t
  } catch {
    /* ignore */
  }
  return 'classic'
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
}
