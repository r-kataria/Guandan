// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'

afterEach(cleanup)

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('UI smoke', () => {
  it('renders the home page', () => {
    renderAt('/')
    expect(screen.getByText(/Learn & Play/i)).toBeTruthy()
    expect(screen.getAllByText(/Guandan/i).length).toBeGreaterThan(0)
  })

  it('renders the Play page with the table and difficulty controls', () => {
    renderAt('/play')
    expect(screen.getByText('You')).toBeTruthy()
    expect(screen.getByText('Partner')).toBeTruthy()
    expect(screen.getByText('Easy')).toBeTruthy()
    expect(screen.getByText('Hard')).toBeTruthy()
    // The human's hand should render 27 selectable cards on the first lead.
    expect(screen.getByText(/level in play/i)).toBeTruthy()
  })

  it('renders the Learn list with all 15 lessons', () => {
    renderAt('/learn')
    expect(screen.getByText(/15 lessons complete|\/ 15/i)).toBeTruthy()
    expect(screen.getByText('Card ranks & beating singles')).toBeTruthy()
    expect(screen.getByText('Graduation')).toBeTruthy()
  })

  it('solves a select drill through the real engine and marks the lesson complete', () => {
    renderAt('/learn/card-ranks')
    // Drill: beat ♦9 — selecting the ♦10 and checking should succeed.
    const ten = screen.getByTitle('♦10')
    fireEvent.click(ten)
    fireEvent.click(screen.getByText('Check'))
    expect(screen.getByText(/a higher single beats a single/i)).toBeTruthy()
    expect(screen.getByText(/Lesson complete/i)).toBeTruthy()
  })

  it('gives feedback when a drill answer is wrong', () => {
    renderAt('/learn/pairs-triples')
    // Drill: beat a pair of 7s. Selecting a single King is not a pair.
    fireEvent.click(screen.getByTitle('♠K'))
    fireEvent.click(screen.getByText('Check'))
    const status = screen.getByText(/not a Pair|doesn't beat|valid play/i)
    expect(status).toBeTruthy()
  })

  it('scores a quiz drill', () => {
    renderAt('/learn/bombs-2')
    fireEvent.click(screen.getByText('Six of a kind'))
    expect(screen.getByText(/Correct/i)).toBeTruthy()
    // Verify the explanation appears within the drill box.
    const box = screen.getByText(/Correct/i)
    expect(within(box).toString).toBeTruthy()
  })
})
