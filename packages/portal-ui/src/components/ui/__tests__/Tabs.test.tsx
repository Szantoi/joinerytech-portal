import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabPanel, type TabItem } from '../Tabs'

const TABS: TabItem[] = [
  { id: 'a', label: 'Alfa' },
  { id: 'b', label: 'Béta' },
  { id: 'c', label: 'Gamma' },
]

function Harness({ onChange }: { onChange?: (id: string) => void }) {
  const [active, setActive] = useState('a')
  return (
    <>
      <Tabs
        idBase="t"
        label="Teszt fülek"
        tabs={TABS}
        activeId={active}
        onChange={(id) => {
          setActive(id)
          onChange?.(id)
        }}
      />
      {TABS.map((t) => (
        <TabPanel key={t.id} idBase="t" id={t.id} active={active === t.id}>
          Panel {t.label}
        </TabPanel>
      ))}
    </>
  )
}

describe('Tabs', () => {
  it('renders a labelled tablist with correct tab/panel ARIA wiring', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Teszt fülek' })).toBeTruthy()
    const alfa = screen.getByRole('tab', { name: 'Alfa' })
    expect(alfa).toHaveAttribute('aria-selected', 'true')
    expect(alfa).toHaveAttribute('aria-controls', 't-panel-a')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 't-tab-a')
    expect(panel).toHaveAttribute('tabindex', '0')
  })

  it('has a single tab stop (roving tabindex on the active tab)', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Alfa' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Béta' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowRight moves focus WITHOUT activating (manual activation)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    screen.getByRole('tab', { name: 'Alfa' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Béta' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: 'Alfa' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Béta' })).toHaveAttribute('aria-selected', 'false')
  })

  it('Enter activates the focused tab', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)

    screen.getByRole('tab', { name: 'Alfa' }).focus()
    await user.keyboard('{ArrowRight}{Enter}')

    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.getByRole('tab', { name: 'Béta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel Béta')).toBeVisible()
  })

  it('arrow navigation wraps at both ends', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('tab', { name: 'Alfa' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Gamma' }))

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Alfa' }))
  })

  it('Home/End jump to first/last tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('tab', { name: 'Alfa' }).focus()
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Gamma' }))

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Alfa' }))
  })

  it('click activates a tab and shows its panel', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('tab', { name: 'Gamma' }))
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Panel Gamma')).toBeVisible()
    expect(screen.getByText('Panel Alfa')).not.toBeVisible()
  })

  it('skips disabled tabs during arrow navigation', async () => {
    const user = userEvent.setup()
    function DisabledHarness() {
      const [active, setActive] = useState('a')
      return (
        <Tabs
          idBase="d"
          label="Fülek"
          tabs={[TABS[0], { ...TABS[1], disabled: true }, TABS[2]]}
          activeId={active}
          onChange={setActive}
        />
      )
    }
    render(<DisabledHarness />)
    screen.getByRole('tab', { name: 'Alfa' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Gamma' }))
  })
})
