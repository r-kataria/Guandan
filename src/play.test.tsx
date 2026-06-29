// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'

afterEach(cleanup)

describe('Play loop', () => {
  it('human leads, then AI seats take their turns on the timer', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(
        <MemoryRouter initialEntries={['/play']}>
          <App />
        </MemoryRouter>,
      )

      const handCount = () => container.querySelectorAll('.hand-row .card-tile').length
      expect(handCount()).toBe(27)

      // First hand: the human (seat 0) leads. Hint auto-selects a legal lead, then Play.
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Play' }))
      })

      // The human played, so their hand shrank.
      expect(handCount()).toBeLessThan(27)

      // Advance the AI timer; at least one opponent should act (their card count drops below 27).
      act(() => {
        vi.advanceTimersByTime(4000)
      })
      const oppCounts = [...container.querySelectorAll('.seat-count')].map((e) =>
        parseInt(e.textContent || '27', 10),
      )
      expect(oppCounts.some((c) => c < 27)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
