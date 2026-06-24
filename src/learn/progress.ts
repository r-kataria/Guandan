// learn/progress.ts — persist lesson completion in localStorage.

const KEY = 'guandan.progress.v1'

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function write(set: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    /* ignore quota / private mode */
  }
}

export function getCompleted(): Set<string> {
  return read()
}

export function isComplete(id: string): boolean {
  return read().has(id)
}

export function markComplete(id: string): void {
  const set = read()
  set.add(id)
  write(set)
}

export function resetProgress(): void {
  write(new Set())
}
