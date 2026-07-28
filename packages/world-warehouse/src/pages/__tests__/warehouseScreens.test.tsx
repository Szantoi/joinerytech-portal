import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { warehouseHandlers, warehouseMockDb } from '../../mocks';
import { WarehouseDashboard } from '../WarehouseDashboard';
import { StockScreen } from '../StockScreen';
import { OffcutsScreen } from '../OffcutsScreen';
import { MovementsScreen } from '../MovementsScreen';
import { ProcurementScreen } from '../ProcurementScreen';
import { createWarehouseWrapper } from './warehouseTestUtils';

/**
 * Warehouse képernyő-tesztek (MSW seed-adatokkal) — a sikeres ágak MELLETT a
 * hibaágak (409-toast, SlideOver error-state) és az üres szűrő-állapotok is.
 * Megjegyzés: a DataTable dual-render (táblázat + kártyalista) miatt a
 * cellatartalom kétszer van a DOM-ban → getAllBy*-t használunk rá.
 */

const server = setupServer(...warehouseHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => warehouseMockDb.reset());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SMOKE_TIMEOUT = 20_000;
const JOB_A = 'c1111111-1111-4111-8111-aaaaaaaaaaaa';

/**
 * hu-HU pénzformátum a DOM-egyezéshez: a toLocaleString NBSP/NNBSP csoport-
 * elválasztót ad, amit a testing-library normalizálója sima szóközzé alakít —
 * a matcher-stringet ugyanígy normalizáljuk.
 */
function huFt(value: number): string {
  return `${value.toLocaleString('hu-HU')} Ft`.replace(/[\u00A0\u202F]/g, ' ');
}

describe('WarehouseDashboard', () => {
  it('KPI-k a valós inventory summary-ból (anyagtípus/alacsony készlet/készletérték)', async () => {
    render(<WarehouseDashboard />, { wrapper: createWarehouseWrapper() });
    expect(await screen.findByText('Aktív anyagtípusok')).toBeInTheDocument();
    expect(screen.getByText('4 típus')).toBeInTheDocument();
    // Rétegelt lemez 15mm: total 10 <= reorderMin 12 → 1 alacsony készletű
    expect(screen.getByText('Alacsony készletű anyagok')).toBeInTheDocument();
    const value = 56 * 12000 + 24 * 28500 + 33 * 22000 + 10 * 9800;
    expect(screen.getByText(huFt(value))).toBeInTheDocument();
    // Az alacsony készletű anyag nevesítve jelenik meg a spotlight-kártyán
    expect(screen.getByText('Rétegelt lemez 15mm')).toBeInTheDocument();
  }, SMOKE_TIMEOUT);

  it('a gyors műveletek NAVIGÁLNAK (nincs halott modal-gomb)', async () => {
    const onNavigateTab = vi.fn();
    render(<WarehouseDashboard onNavigateTab={onNavigateTab} />, { wrapper: createWarehouseWrapper() });
    fireEvent.click(await screen.findByRole('button', { name: 'Készletmozgás rögzítése →' }));
    expect(onNavigateTab).toHaveBeenCalledWith('inventory');
    fireEvent.click(screen.getByRole('button', { name: 'Offcut kezelés →' }));
    expect(onNavigateTab).toHaveBeenCalledWith('offcuts');
  }, SMOKE_TIMEOUT);
});

describe('StockScreen', () => {
  it('a lapozott stock-listát rendereli API-ból jövő egységárral és rendelési szinttel', async () => {
    render(<StockScreen />, { wrapper: createWarehouseWrapper() });
    expect((await screen.findAllByText('MDF 18mm')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(huFt(12000)).length).toBeGreaterThan(0);
    // 1 alacsony készletű + 3 rendben tétel (dual-render: ×2)
    expect(screen.getAllByText('Alacsony készlet').length).toBe(2);
    expect(screen.getAllByText('Rendben').length).toBe(6);
  }, SMOKE_TIMEOUT);

  it('üres keresési eredménynek kimondott állapota van', async () => {
    render(<StockScreen />, { wrapper: createWarehouseWrapper() });
    await screen.findAllByText('MDF 18mm');
    fireEvent.change(screen.getByLabelText('Keresés anyagtípusra'), { target: { value: 'nemletezo' } });
    expect(await screen.findByText('Nincs a keresésre („nemletezo") illeszkedő készlettétel.')).toBeInTheDocument();
  }, SMOKE_TIMEOUT);

  it('a bevételezés-modal nevesített aria-modal dialógus, Escape-re zár', async () => {
    render(<StockScreen />, { wrapper: createWarehouseWrapper() });
    await screen.findAllByText('MDF 18mm');
    fireEvent.click(screen.getByRole('button', { name: '+ Bevételezés' }));
    const dialog = await screen.findByRole('dialog', { name: 'Bevételezés rögzítése' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  }, SMOKE_TIMEOUT);
});

describe('OffcutsScreen — reserve→approve lánc valódi reservationId-val', () => {
  async function reserveAvailableOffcut() {
    fireEvent.click((await screen.findAllByRole('button', { name: 'Foglalás' }))[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Offcut foglalása munkalaphoz' });
    fireEvent.change(within(dialog).getByLabelText('Munkalap-azonosító (jobId)'), { target: { value: JOB_A } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Foglalás rögzítése' }));
    await screen.findByText('Offcut-foglalás létrehozva — jóváhagyásra vár');
  }

  it('a jobId-input validált UUID; hibás értékre inline hiba, foglalás után jóváhagyás-gomb', async () => {
    render(<OffcutsScreen />, { wrapper: createWarehouseWrapper() });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Foglalás' }))[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Offcut foglalása munkalaphoz' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // hibás (nem-UUID) jobId — a backend Guid-ot vár, a kliens elutasítja
    fireEvent.change(within(dialog).getByLabelText('Munkalap-azonosító (jobId)'), {
      target: { value: 'job-demo-001' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Foglalás rögzítése' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/UUID/);

    // valós UUID → foglalás létrejön, a sorban megjelenik a jóváhagyás-affordancia
    fireEvent.change(within(dialog).getByLabelText('Munkalap-azonosító (jobId)'), {
      target: { value: JOB_A },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Foglalás rögzítése' }));
    expect(await screen.findByText('Offcut-foglalás létrehozva — jóváhagyásra vár')).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: 'Foglalás jóváhagyása' })).length).toBeGreaterThan(0);
  }, SMOKE_TIMEOUT);

  it('a jóváhagyás a reserve válaszának reservationId-jával fut → a sor Reserved lesz', async () => {
    render(<OffcutsScreen />, { wrapper: createWarehouseWrapper() });
    await reserveAvailableOffcut();

    fireEvent.click((await screen.findAllByRole('button', { name: 'Foglalás jóváhagyása' }))[0]);
    expect(await screen.findByText('Offcut-foglalás jóváhagyva (Reserved)')).toBeInTheDocument();
    // két Reserved sor lett (a seed + az újonnan jóváhagyott) — dual-render: ×2
    await waitFor(() => expect(screen.getAllByText('Lefoglalva').length).toBe(4));
  }, SMOKE_TIMEOUT);

  it('üres szűrő-eredménynek saját, kimondott állapota van (L-2)', async () => {
    render(<OffcutsScreen />, { wrapper: createWarehouseWrapper() });
    await screen.findAllByText('MDF 18mm');
    server.use(
      http.get('/api/inventory/offcuts/', () =>
        HttpResponse.json({ offcuts: [], total: 0, page: 1, pageSize: 20 })),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Elérhető' }));
    expect(await screen.findByText('Nincs „Elérhető" státuszú offcut a készletben.')).toBeInTheDocument();
  }, SMOKE_TIMEOUT);

  it('SlideOver detail: hibaágnak saját állapota van (nem örök „betöltés")', async () => {
    render(<OffcutsScreen />, { wrapper: createWarehouseWrapper() });
    await screen.findAllByText('MDF 18mm');
    server.use(
      http.get('/api/inventory/offcuts/:offcutId', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Részletek' })[0]);
    expect(await screen.findByText('Az offcut-részletek betöltése nem sikerült.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Újra' })).toBeInTheDocument();
  }, SMOKE_TIMEOUT);
});

describe('MovementsScreen', () => {
  it('lapozott mozgáslista + típus-szűrő + kimondott üres állapot', async () => {
    render(<MovementsScreen />, { wrapper: createWarehouseWrapper() });
    expect((await screen.findAllByText('BEV-2026-001')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Bevételezések' }));
    // a szűrt lista betöltése után: csak Inbound sor marad
    await screen.findAllByText('BEV-2026-001');
    await waitFor(() => expect(screen.queryAllByText('WO-2026-042').length).toBe(0));

    server.use(
      http.get('/api/inventory/movements', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 })),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Offcut mozgások' }));
    expect(await screen.findByText('Nincs „Maradék (Offcut)" típusú mozgás rögzítve.')).toBeInTheDocument();
  }, SMOKE_TIMEOUT);
});

describe('ProcurementScreen — PO_FSM-vezérelt gombok + deliver-body', () => {
  /** A DataTable dual-render miatt a <tr>-t adó (táblázati) példányt keressük. */
  async function findTableRow(text: string): Promise<HTMLElement> {
    const cells = await screen.findAllByText(text);
    const row = cells.map((c) => c.closest('tr')).find((r): r is HTMLTableRowElement => Boolean(r));
    if (!row) throw new Error(`Nincs táblázati sor ehhez: ${text}`);
    return row;
  }

  it('a gomb-láthatóságot a PO_FSM tábla dönti státuszonként', async () => {
    render(<ProcurementScreen />, { wrapper: createWarehouseWrapper() });
    const confirmedRow = await findTableRow('Jácint Faipar Kft.');
    const submittedRow = await findTableRow('Erdőstér Kft.');

    // Confirmed: ship + deliver + cancel — submit/confirm nem
    expect(within(confirmedRow).getByRole('button', { name: 'Szállítás indítása' })).toBeInTheDocument();
    expect(within(confirmedRow).getByRole('button', { name: 'Leszállítás rögzítése' })).toBeInTheDocument();
    expect(within(confirmedRow).getByRole('button', { name: 'Megrendelés törlése' })).toBeInTheDocument();
    expect(within(confirmedRow).queryByRole('button', { name: 'Beküldés' })).not.toBeInTheDocument();
    expect(within(confirmedRow).queryByRole('button', { name: 'Visszaigazolás' })).not.toBeInTheDocument();

    // Submitted: confirm + cancel — deliver nem
    expect(within(submittedRow).getByRole('button', { name: 'Visszaigazolás' })).toBeInTheDocument();
    expect(within(submittedRow).queryByRole('button', { name: 'Leszállítás rögzítése' })).not.toBeInTheDocument();
  }, SMOKE_TIMEOUT);

  it('deliver-modal: kötelező pozitív mennyiség (blokk-indok), sikeres rögzítés → Delivered', async () => {
    render(<ProcurementScreen />, { wrapper: createWarehouseWrapper() });
    const confirmedRow = await findTableRow('Jácint Faipar Kft.');
    fireEvent.click(within(confirmedRow).getByRole('button', { name: 'Leszállítás rögzítése' }));

    const dialog = await screen.findByRole('dialog', { name: 'Leszállítás rögzítése' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // 0 mennyiség → blokk-indok (deliverQuantityBlockReason — poFsm.ts)
    fireEvent.change(within(dialog).getByLabelText('Átvett mennyiség (db)'), { target: { value: '0' } });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/receivedQuantity/);

    fireEvent.change(within(dialog).getByLabelText('Átvett mennyiség (db)'), { target: { value: '40' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Leszállítás rögzítése' }));
    expect(await screen.findByText('Leszállítás rögzítve (Delivered)')).toBeInTheDocument();
    expect((await screen.findAllByText('Leszállítva')).length).toBeGreaterThan(0);
  }, SMOKE_TIMEOUT);

  it('409-es tiltott átmenet a toastban státuszkód-tudatosan jelenik meg', async () => {
    render(<ProcurementScreen />, { wrapper: createWarehouseWrapper() });
    const submittedRow = await findTableRow('Erdőstér Kft.');
    server.use(
      http.post('/api/procurement/orders/:id/confirm', () =>
        HttpResponse.json(['Cannot confirm order in status Confirmed.'], { status: 409 })),
    );
    fireEvent.click(within(submittedRow).getByRole('button', { name: 'Visszaigazolás' }));
    expect(await screen.findByText(/Tiltott átmenet \/ ütközés \(409\)/)).toBeInTheDocument();
  }, SMOKE_TIMEOUT);

  it('a requisitions a QueryGate-ben van: hibája a képernyő hibaállapotát adja (P1-10)', async () => {
    server.use(
      http.get('/api/procurement/requisitions/', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    render(<ProcurementScreen />, { wrapper: createWarehouseWrapper() });
    expect(
      await screen.findByText(/Beszerzési megrendelések betöltése nem sikerült/),
    ).toBeInTheDocument();
    // a hibaállapot a QueryGate role=alert kerete, Újra gombbal
    expect(screen.getByRole('button', { name: 'Újra' })).toBeInTheDocument();
  }, SMOKE_TIMEOUT);
});
