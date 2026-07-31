import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ConfirmProvider } from '@spaceos/portal-ui'
import { parseUserClaims } from '@spaceos/portal-core'
import { addDays, isoDate } from '@spaceos/portal-ui'
import { SchedulingPage } from '../SchedulingPage'
import * as useApiModule from '../../hooks/useApi'
import * as useAuthModule from '../../auth'
import type { Batch, Machine, Operator, Execution } from '../../types/scheduling.types'

// Mock data
const mockOperators: Operator[] = [
  { id: 'op-1', name: 'John Operator', email: 'john@example.com', role: 'machine_operator' },
]

const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    name: 'Frame Assembly',
    materialType: 'Oak',
    quantity: 50,
    priority: 3,
    status: 'Unassigned',
    estimatedMinutes: 120,
  },
]

const mockMachines: Machine[] = [
  { id: 'machine-1', name: 'Saw Station', type: 'Cutting', capacity: 100, status: 'Available' },
]

/**
 * A gép-lista tesztenként felülírható: a megerősítő „Gép állapota" sora a
 * státusztól függ, és az alap-mock mindig `Available`-t ad.
 */
let machinesData: Machine[] = mockMachines

const mockExecutions: Execution[] = [
  {
    id: 'exec-1', batchId: 'batch-0', batchName: 'Tegnapi hátlapok',
    machineId: 'machine-1', operatorId: 'op-1', priority: 4,
    startTime: '2026-07-29T07:00:00', estimatedMinutes: 150, status: 'InProgress',
  },
]

/**
 * Melyik napra van kész válaszunk. Ha be van állítva, a mock MÁS napra
 * pendinget ad — ez a `useApi` url-váltás ágának szerződése a fogyasztó felől
 * nézve (magának a hooknak a viselkedését a `useApi.test.ts` méri).
 */
let loadedExecutionsDate: string | null = null

/**
 * A lekérések állapotát tesztenként felülírhatóvá tesszük: az M3-bekötés lényege
 * épp az, hogy a pending és az error NEM ugyanaz, mint az „üres adat".
 */
interface QueryOverride {
  isPending?: boolean
  error?: string
}
let overrides: Record<string, QueryOverride> = {}
const refetchSpy = vi.fn()

function resourceOf(url: string | null): 'batches' | 'machines' | 'executions' | 'operators' | null {
  if (url?.includes('/batches')) return 'batches'
  if (url?.includes('/machines')) return 'machines'
  if (url?.includes('/executions')) return 'executions'
  if (url?.includes('/users')) return 'operators'
  return null
}

/**
 * A lap a közös `useConfirm`-öt használja (PLAN-05 F4), ezért providerrel
 * kell renderelni — provider nélkül a hook szándékosan dob.
 */
function renderPage() {
  return render(
    <ConfirmProvider>
      <SchedulingPage />
    </ConfirmProvider>,
  )
}

/** Operátor kiválasztása a valódi úton: gépelés → találat → kattintás. */
function selectOperator() {
  fireEvent.focus(screen.getByPlaceholderText('Operátor keresése…'))
  fireEvent.mouseDown(screen.getByText('John Operator'))
}

/**
 * Szerep-mock a VALÓDI úton (PLAN-05 F6).
 *
 * Nem a `roles` kimenetet állítjuk be, hanem egy realm-claimet, és a
 * `parseUserClaims` állítja elő belőle a szerepeket — pontosan úgy, ahogy
 * élesben. Ez azért kikötés, mert a korábbi teszt közvetlenül
 * `roles: ['machine_operator']`-t mockolt, olyan szerepet, amit az éles szűrő
 * KIEJTETT: a teszt zöld volt, a képernyő meg mindenkinek csak-olvasható.
 * Így egy jövőbeli szűrő-szigorítás bukik, nem rejtőzik el.
 */
function mockAuthWithRealmRoles(realmRoles: string[]) {
  const payload = { realm_access: { roles: realmRoles } }
  const accessToken = `header.${btoa(JSON.stringify(payload))}.signature`
  const { roles } = parseUserClaims({ access_token: accessToken, profile: {} } as never)

  vi.mocked(useAuthModule.useAuth).mockReturnValue({
    user: null, isAuthenticated: true, isLoading: false,
    login: vi.fn(), logout: vi.fn(), token: 'mock-token',
    tenantId: 'tenant-1', roles, enabledModules: ['production'],
    facilityId: 'facility-1', facilityName: 'Main Facility',
  })
  return roles
}

/** Köteg ejtése a gépre — a drop-handler JSON-t olvas a dataTransferből. */
function dropBatchOnMachine(batchId = 'batch-1') {
  const zone = screen.getAllByText('Saw Station')[0].closest('div')!
  fireEvent.drop(zone, {
    dataTransfer: { getData: () => JSON.stringify({ batchId }) },
  })
}

describe('SchedulingPage', () => {
  beforeEach(() => {
    overrides = {}
    machinesData = mockMachines
    loadedExecutionsDate = null
    refetchSpy.mockClear()
    vi.spyOn(useAuthModule, 'useAuth')
    mockAuthWithRealmRoles(['machine_operator'])

    vi.spyOn(useApiModule, 'useApi').mockImplementation((url: string | null) => {
      const key = resourceOf(url)
      const override = key ? overrides[key] ?? {} : {}
      const isPending = override.isPending ?? false
      const error = override.error ?? null
      // Betöltés vagy hiba esetén a hook adata NULL — a fogyasztó ilyenkor nem
      // állíthatja, hogy „nincs találat".
      // Az url-váltás ága: ha másik napra kérdezünk, mint amire kész válaszunk
      // van, a hook pendinget ad — a régi nap adata NEM maradhat kint.
      const urlDate = /plans\/([^/]+)\/executions/.exec(url ?? '')?.[1] ?? null
      const staleDay =
        key === 'executions' && loadedExecutionsDate !== null && urlDate !== loadedExecutionsDate

      const loaded =
        key === 'batches' ? mockBatches
        : key === 'machines' ? machinesData
        : key === 'executions' ? mockExecutions
        : key === 'operators' ? mockOperators
        : null
      const pending = isPending || staleDay
      return {
        data: pending || error ? null : loaded,
        isLoading: pending,
        isPending: pending,
        error,
        refetch: refetchSpy,
      }
    })

    vi.spyOn(useApiModule, 'useMutation').mockReturnValue({
      mutate: vi.fn().mockResolvedValue({ executionId: 'exec-1', status: 'Planned' }),
      isLoading: false,
      error: null,
    })
  })

  it('világ-képernyőként NEM rendel saját h1-et', () => {
    renderPage()

    // A dokumentum-főcímet a WorldShell adja (WorldShell.tsx:247). Ha a lap
    // visszakapná a sajátját, a böngésző-kapu „route-onként pontosan egy h1"
    // ellenőrzése bukna — ezt jsdom-ban itt fogjuk meg, olcsóbban.
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0)
    expect(screen.getByText(/Rendeld a kötegeket gépekhez/)).toBeTruthy()
  })

  it('displays operator autocomplete', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Operátor keresése…')).toBeTruthy()
  })

  it('displays unassigned batches', () => {
    renderPage()
    expect(screen.getByText('Frame Assembly')).toBeTruthy()
  })

  it('displays machine drop zones', () => {
    renderPage()
    expect(screen.getAllByText('Saw Station')[0]).toBeTruthy()
  })

  it('displays execution timeline', () => {
    renderPage()
    expect(screen.getByText('Végrehajtási idősáv')).toBeTruthy()
  })

  it('displays batch count in header', () => {
    renderPage()
    expect(screen.getByText('Kiosztatlan kötegek (1)')).toBeTruthy()
  })

  // ── Jogosultság a PORTÁL szerep-szótárával ──────────────────────────────────
  // A korábbi tesztek `machine_operator`/`viewer` szerepet mockoltak — olyanokat,
  // amiket a `parseUserClaims` kiszűr. A zöld teszt így egy nem létező világot
  // állított, és elfedte, hogy a képernyő MINDENKINEK csak-olvasható volt.

  it('a gépkezelő kioszthat, de a prioritás-plafonja 5', () => {
    // A szerep a realm-claimből, a szűrőn át érkezik — ha a szűrő kiejtené,
    // ez a teszt AZONNAL bukna, nem rejtőzne el mögötte.
    expect(mockAuthWithRealmRoles(['machine_operator'])).toContain('machine_operator')

    renderPage()

    const slider = screen.getByRole('slider') as HTMLInputElement
    expect(slider.max).toBe('5')
    expect(slider.disabled).toBe(false)
    expect(screen.queryByText(/Csak megtekintés/i)).toBeNull()
  })

  it('az üzemvezető a teljes 1-10 skálát adhatja', () => {
    mockAuthWithRealmRoles(['production_manager'])

    renderPage()

    expect((screen.getByRole('slider') as HTMLInputElement).max).toBe('10')
  })

  it('az Admin is oszthat, teljes skálával', () => {
    mockAuthWithRealmRoles(['Admin'])

    renderPage()

    expect((screen.getByRole('slider') as HTMLInputElement).max).toBe('10')
    expect(screen.queryByText(/Csak megtekintés/i)).toBeNull()
  })

  it('a Designer csak nézheti (nem oszthat ki)', () => {
    mockAuthWithRealmRoles(['Designer'])

    renderPage()

    expect(screen.getByText(/Csak megtekintés/i)).toBeTruthy()
  })

  it('ismeretlen realm-szerep NEM ad kiosztási jogot (a szűrő kiejti)', () => {
    // Negatív eset: a realm bármit küldhet — ami nincs a szótárban, az nem jog.
    const roles = mockAuthWithRealmRoles(['offline_access', 'uma_authorization', 'valami_uj'])
    expect(roles).toEqual([])

    renderPage()

    expect(screen.getByText(/Csak megtekintés/i)).toBeTruthy()
  })

  // ── M3-bekötés: pending és error átvételi feltétel ──────────────────────────
  // A primitívek `emptyLabel`-je NEM hibaállapot-jelzés: amíg nincs válasz,
  // a képernyő nem állíthatja, hogy üres.

  describe('betöltés alatt (pending)', () => {
    it('az idősáv helyén skeleton áll, nem üres rács', () => {
      overrides = { machines: { isPending: true }, executions: { isPending: true } }

      renderPage()

      expect(screen.getByLabelText('végrehajtási idősáv betöltése')).toBeTruthy()
      // Sem a rács, sem a „nincs gép" felirat nem villanhat fel.
      expect(screen.queryByText('Végrehajtási idősáv')).toBeNull()
      expect(screen.queryByText('Nincs elérhető gép')).toBeNull()
    })

    it('a köteg-darabszám nem hazudik nullát, amíg nincs válasz', () => {
      overrides = { batches: { isPending: true } }

      renderPage()

      expect(screen.getByText('Kiosztatlan kötegek')).toBeTruthy()
      expect(screen.queryByText('Kiosztatlan kötegek (0)')).toBeNull()
    })
  })

  describe('hiba esetén (error)', () => {
    it('hibaüzenetet mutat ÉS elrejti az idősávot', () => {
      overrides = { executions: { error: 'HTTP 500' } }

      renderPage()

      expect(screen.getByRole('alert').textContent).toContain(
        'A(z) végrehajtási idősáv betöltése nem sikerült.'
      )
      // A részlegesen betöltött terv félrevezető — a rács nem maradhat kint.
      expect(screen.queryByText('Végrehajtási idősáv')).toBeNull()
    })

    it('az Újra gomb újratölti mindkét idősáv-lekérést', () => {
      overrides = { executions: { error: 'HTTP 500' } }

      renderPage()
      // A mount-effektek már elindították a három lekérést — a spy közös, ezért
      // innen mérjük: minket CSAK a gombnyomás hatása érdekel.
      refetchSpy.mockClear()

      fireEvent.click(screen.getByRole('button', { name: 'Újra' }))

      // gépek + végrehajtások: az idősáv kettőből áll össze
      expect(refetchSpy).toHaveBeenCalledTimes(2)
    })

    it('a gépek hibája nem rejti el a köteg-listát (lekérésenként külön kapu)', () => {
      overrides = { machines: { error: 'HTTP 503' } }

      renderPage()

      expect(screen.getByText('Frame Assembly')).toBeTruthy()
      expect(screen.queryByText('Saw Station')).toBeNull()
    })
  })

  // ── PLAN-05 F5: dátumválasztó ───────────────────────────────────────────────

  describe('terv napja', () => {
    it('a kezdőérték HELYI dátum, nem UTC', () => {
      renderPage()

      // A `toISOString()` Budapesten éjfél után még a tegnapi napot adná —
      // éjszakai műszakban pont az látná rosszul, aki akkor dolgozik.
      const input = screen.getByLabelText('Terv napja') as HTMLInputElement
      expect(input.value).toBe(isoDate(new Date()))
    })

    it('a léptetés naptári napot lép', () => {
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: 'Következő nap' }))

      const input = screen.getByLabelText('Terv napja') as HTMLInputElement
      expect(input.value).toBe(isoDate(addDays(new Date(), 1)))
    })

    it('a „Ma" visszaugrik a mai napra', () => {
      renderPage()

      fireEvent.click(screen.getByRole('button', { name: 'Előző nap' }))
      fireEvent.click(screen.getByRole('button', { name: 'Ma' }))

      expect((screen.getByLabelText('Terv napja') as HTMLInputElement).value)
        .toBe(isoDate(new Date()))
    })

    it('napváltáskor a régi nap adata NEM marad a képernyőn az új napé gyanánt', async () => {
      loadedExecutionsDate = isoDate(new Date())

      renderPage()
      // Ma: kész adat, a tegnapi végrehajtás látszik.
      expect(screen.getByText('Végrehajtási idősáv')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'Következő nap' }))

      // Az új napra még nincs válasz → skeleton, és a RÉGI nap tartalma eltűnik.
      await waitFor(() =>
        expect(screen.getByLabelText('végrehajtási idősáv betöltése')).toBeTruthy())
      expect(screen.queryByText('Végrehajtási idősáv')).toBeNull()
    })
  })

  // ── PLAN-05 F4: a megerősítés a közös dialóguson megy ───────────────────────

  describe('kiosztás megerősítése', () => {
    it('operátor nélkül nem nyit dialógust, hanem szól', async () => {
      renderPage()
      dropBatchOnMachine()

      await waitFor(() => expect(screen.getByText('Előbb válassz operátort')).toBeTruthy())
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    it('a dialógus valódi alertdialog, és tételesen mutatja, mire mondunk igent', async () => {
      renderPage()
      selectOperator()
      dropBatchOnMachine()

      const dialog = await screen.findByRole('alertdialog')

      // A kézzel írt overlay-nek nem volt szerepe és kötése — ez a lényeg.
      expect(dialog.getAttribute('aria-modal')).toBe('true')
      expect(dialog.getAttribute('aria-describedby')).toBeTruthy()

      // A köteg neve a listában is szerepel — a dialóguson BELÜL keresünk.
      const inDialog = within(dialog)

      // A négy tétel címke→érték párként, nem összefolyó szövegként.
      for (const label of ['Köteg', 'Célgép', 'Kijelölt operátor', 'Prioritás']) {
        expect(inDialog.getByText(label).tagName).toBe('DT')
      }
      expect(inDialog.getByText('Frame Assembly')).toBeTruthy()
      expect(inDialog.getByText('Anyag: Oak · Mennyiség: 50')).toBeTruthy()
      expect(inDialog.getByText('3 — alacsony')).toBeTruthy()
    })

    // A gép-zóna állapot-független: a Karbantartás alatt lévő gépre is ejthető
    // köteg, és a megerősítő eddig HALLGATOTT erről — az operátor egy Szabad
    // gép adataival megegyező dialógust látott. A státusz-sor a csendet
    // szünteti meg; hogy az ilyen kiosztás sorba állítás-e vagy tiltandó, az
    // nyitott termékdöntés, ezért a dialógus nem tilt és nem is magyaráz.

    it('karbantartás alatt lévő gépnél a dialógus kimondja a gép állapotát', async () => {
      machinesData = [{ ...mockMachines[0], status: 'Maintenance' }]

      renderPage()
      selectOperator()
      dropBatchOnMachine()

      const inDialog = within(await screen.findByRole('alertdialog'))
      expect(inDialog.getByText('Gép állapota').tagName).toBe('DT')
      expect(inDialog.getByText('Karbantartás alatt')).toBeTruthy()
    })

    it('foglalt gépnél is megjelenik az állapot, és a kiosztás NEM tiltott', async () => {
      machinesData = [{ ...mockMachines[0], status: 'Busy' }]
      const mutate = vi.fn().mockResolvedValue({ executionId: 'exec-1', status: 'Planned' })
      vi.mocked(useApiModule.useMutation).mockReturnValue({ mutate, isLoading: false, error: null })

      renderPage()
      selectOperator()
      dropBatchOnMachine()

      const inDialog = within(await screen.findByRole('alertdialog'))
      expect(inDialog.getByText('Foglalt')).toBeTruthy()

      // „Nem tiltás, csak a csend kivétele": a megerősítés ugyanúgy végigmegy.
      fireEvent.click(inDialog.getByRole('button', { name: 'Kiosztás megerősítése' }))
      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    })

    it('szabad gépnél NINCS állapot-sor — a normál eset kiírása zaj lenne', async () => {
      renderPage()
      selectOperator()
      dropBatchOnMachine()

      const inDialog = within(await screen.findByRole('alertdialog'))
      expect(inDialog.queryByText('Gép állapota')).toBeNull()
    })

    it('Mégse esetén NEM történik kiosztás', async () => {
      const mutate = vi.fn().mockResolvedValue({ executionId: 'exec-1', status: 'Planned' })
      vi.mocked(useApiModule.useMutation).mockReturnValue({ mutate, isLoading: false, error: null })

      renderPage()
      selectOperator()
      dropBatchOnMachine()

      fireEvent.click(await screen.findByRole('button', { name: 'Mégse' }))

      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
      expect(mutate).not.toHaveBeenCalled()
    })

    it('megerősítés után elindul a kiosztás és frissülnek az adatok', async () => {
      const mutate = vi.fn().mockResolvedValue({ executionId: 'exec-1', status: 'Planned' })
      vi.mocked(useApiModule.useMutation).mockReturnValue({ mutate, isLoading: false, error: null })

      renderPage()
      selectOperator()
      dropBatchOnMachine()

      fireEvent.click(await screen.findByRole('button', { name: 'Kiosztás megerősítése' }))

      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
      const [, options] = mutate.mock.calls[0]
      expect(options.body).toMatchObject({
        batchId: 'batch-1',
        machineId: 'machine-1',
        operatorId: 'op-1',
        priority: 3,
      })
    })
  })
})
