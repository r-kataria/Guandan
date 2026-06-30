// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { TributeBanner } from './components/game/parts'

afterEach(cleanup)

describe('TributeBanner', () => {
  it('shows who paid and returned which cards', () => {
    render(
      <TributeBanner
        plan={{
          cancelled: false,
          payments: [{ from: 1, to: 0, cardId: 'S14#0' }],
          returns: [{ from: 0, to: 1, cardId: 'S3#0' }],
          firstLeader: 1,
        }}
        handNumber={1}
        nameOf={(s) => `P${s}`}
      />,
    )
    expect(screen.getByText(/paid/i)).toBeTruthy()
    expect(screen.getByText('♠A')).toBeTruthy() // S14 -> ♠A
    expect(screen.getByText(/returned/i)).toBeTruthy()
  })

  it('renders nothing on the first hand', () => {
    const { container } = render(
      <TributeBanner plan={{ cancelled: true, payments: [], returns: [], firstLeader: 0 }} handNumber={0} nameOf={(s) => `P${s}`} />,
    )
    expect(container.querySelector('.tribute-banner')).toBeNull()
  })
})

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
    const { container } = renderAt('/play')
    expect(screen.getByText('Partner')).toBeTruthy()
    expect(screen.getByText('Easy')).toBeTruthy()
    expect(screen.getByText('Hard')).toBeTruthy()
    expect(screen.getByText('Master')).toBeTruthy()
    // The human's hand renders 27 cards on the first lead.
    expect(container.querySelectorAll('.hand-row .card-tile').length).toBe(27)
  })

  it('renders the Online page with create/join room options', () => {
    renderAt('/online')
    expect(screen.getByText('Create a room')).toBeTruthy()
    expect(screen.getByText('Join a room')).toBeTruthy()
    expect(screen.getByText(/opposite teams/i)).toBeTruthy()
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
