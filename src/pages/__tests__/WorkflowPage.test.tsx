import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowPage } from '../WorkflowPage'

describe('WorkflowPage', () => {
  it('renders title', () => {
    render(<WorkflowPage />)
    expect(screen.getByText('Munkafolyamat')).toBeTruthy()
  })

  it('renders stage columns', () => {
    render(<WorkflowPage />)
    expect(screen.getByText(/rt\u00e9kes\u00edt\u00e9s/)).toBeTruthy()
    expect(screen.getByText(/Sz\u00e1ll\u00edt\u00e1s/)).toBeTruthy()
  })

  it('renders flow cards', () => {
    render(<WorkflowPage />)
    expect(screen.getByText(/16-fi\u00f3kos/)).toBeTruthy()
  })

  it('opens detail panel on card click', () => {
    render(<WorkflowPage />)
    fireEvent.click(screen.getByText(/16-fi\u00f3kos/))
    expect(screen.getByText(/llapotvonal/)).toBeTruthy()
  })
})
