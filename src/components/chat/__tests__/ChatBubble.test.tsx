import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatBubble } from '../ChatBubble'

describe('ChatBubble', () => {
  it('renders the bubble button', () => {
    const { container } = render(<ChatBubble />)
    const btn = container.querySelector('button') as HTMLElement
    expect(btn).toBeTruthy()
  })

  it('opens chat panel on click', () => {
    render(<ChatBubble page="dashboard" />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    expect(screen.getByText('JoineryTech AI')).toBeTruthy()
  })

  it('shows default context page', () => {
    render(<ChatBubble page="Gyártás / dash" />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    expect(screen.getByText(/Gyártás/)).toBeTruthy()
  })
})
