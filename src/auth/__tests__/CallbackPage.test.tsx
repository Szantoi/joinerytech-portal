import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CallbackPage } from '../CallbackPage'

// oidc-client-ts is mocked globally in test-setup.ts

describe('CallbackPage', () => {
  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <CallbackPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Bejelentkezés...')).toBeTruthy()
  })
})
