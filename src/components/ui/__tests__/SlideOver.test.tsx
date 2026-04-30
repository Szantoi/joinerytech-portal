import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlideOver } from '../SlideOver'

describe('SlideOver', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <SlideOver open={false} onClose={() => {}} title="Test">
        <div>Content</div>
      </SlideOver>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and children when open', () => {
    render(
      <SlideOver open={true} onClose={() => {}} title="Teszt panel">
        <div>Tartalom</div>
      </SlideOver>,
    )
    expect(screen.getByText('Teszt panel')).toBeTruthy()
    expect(screen.getByText('Tartalom')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    render(
      <SlideOver open={true} onClose={() => {}} title="Cím" subtitle="Alcím">
        <div>x</div>
      </SlideOver>,
    )
    expect(screen.getByText('Alcím')).toBeTruthy()
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <SlideOver open={true} onClose={onClose} title="Panel">
        <div>x</div>
      </SlideOver>,
    )
    const backdrop = container.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders footer when provided', () => {
    render(
      <SlideOver open={true} onClose={() => {}} title="Panel" footer={<button>Mentés</button>}>
        <div>x</div>
      </SlideOver>,
    )
    expect(screen.getByText('Mentés')).toBeTruthy()
  })
})
