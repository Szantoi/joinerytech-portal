import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CallbackPage } from '../CallbackPage'
import { userManager } from '../AuthContext'

// A userManager a test-setup.ts modul-mockjából jön. A vi.clearAllMocks csak a
// hívástörténetet törli, az implementációt NEM — ezért itt minden teszt előtt
// explicit determinisztikus defaultot állítunk, hogy egyik teszt beállítása se
// szivárogjon át a következőbe.

const originalLocation = window.location
const replaceMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(userManager.signinRedirectCallback as Mock).mockRejectedValue(new Error('default: no oidc code'))
  ;(userManager.getUser as Mock).mockResolvedValue(null)
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, replace: replaceMock },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  })
})

describe('CallbackPage', () => {
  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <CallbackPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Bejelentkezés...')).toBeTruthy()
  })

  it('sikeres callback után /w-re visz, és StrictMode dupla-effekt alatt is EGYSZER váltja be a kódot', async () => {
    ;(userManager.signinRedirectCallback as Mock).mockResolvedValue(undefined)
    render(
      <StrictMode>
        <MemoryRouter>
          <CallbackPage />
        </MemoryRouter>
      </StrictMode>
    )
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/w'))
    // a régi kód StrictMode alatt kétszer hívta → a második futás hibája
    // visszadobott /login-ra egy SIKERES bejelentkezés után
    expect(userManager.signinRedirectCallback).toHaveBeenCalledTimes(1)
    expect(replaceMock).not.toHaveBeenCalledWith('/login')
  })

  it('ha a kód beváltása elhasal, de a user már el van mentve, akkor is beenged', async () => {
    ;(userManager.signinRedirectCallback as Mock).mockRejectedValue(new Error('code already used'))
    ;(userManager.getUser as Mock).mockResolvedValue({ expired: false, access_token: 't' })
    render(
      <MemoryRouter>
        <CallbackPage />
      </MemoryRouter>
    )
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/w'))
  })

  it('valódi hibánál NEM dob némán /login-ra: látható hibát és visszalépő linket ad', async () => {
    ;(userManager.signinRedirectCallback as Mock).mockRejectedValue(new Error('invalid state'))
    ;(userManager.getUser as Mock).mockResolvedValue(null)
    render(
      <MemoryRouter>
        <CallbackPage />
      </MemoryRouter>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/bejelentkezés megerősítése nem sikerült/i)
    expect(screen.getByRole('link', { name: /Vissza a bejelentkezéshez/ })).toHaveAttribute('href', '/login')
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
