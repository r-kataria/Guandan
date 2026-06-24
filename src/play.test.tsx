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
      render(
        <MemoryRouter initialEntries={['/play']}>
          <App />
        </MemoryRouter>,
      )

      // First hand: the human (seat 0) leads. Use Hint to auto-select a legal lead, then Play.
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Hint' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Play' }))
      })

      // The human's play should be logged.
      expect(screen.getByText(/you play/i)).toBeTruthy()

      // Advance the AI timer several times; opponents/partner should act.
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      // At least one non-human seat should now appear in the play log.
      const log = document.querySelector('.log')!
      expect(log.textContent).toMatch(/Right|Left|Partner/)
    } finally {
      vi.useRealTimers()
    }
  })
})
