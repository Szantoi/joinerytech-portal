import { useState } from 'react'
import {
  Button, DataTable, DateField, QueryGate, SelectField, SlideOver, StatusPill, Tabs, TabPanel,
  type DataTableColumn,
} from '../../../components/ui'
import {
  useSafetyWalks, useScheduleWalk, useEhsLocations, locationNameMap,
  employeeName, CURRENT_EMPLOYEE_ID, EHS_EMPLOYEE_DIRECTORY,
  type SafetyWalkListItem,
} from '../services'
import { WALK_STATUS_LABELS, formatDateTime } from './labels'
import { EmployeeOptions } from './EmployeeOptions'
import { WalkDetailSlideOver } from './WalkDetailSlideOver'
import { CapaBoard } from './CapaBoard'

/**
 * Bejárások képernyő — bejárás-lista (FSM: ütemezett → folyamatban → intézkedés →
 * lezárt, +elmaradt) + egységes CAPA-tábla fül (task 4c: incidents+walks együtt).
 */

function ScheduleWalkForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const locations = useEhsLocations({ activeOnly: true })
  const schedule = useScheduleWalk()
  const [locationId, setLocationId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16))
  const [conductedBy, setConductedBy] = useState(CURRENT_EMPLOYEE_ID)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    schedule.mutate(
      { locationId, scheduledDate: new Date(scheduledDate).toISOString(), conductedBy },
      { onSuccess: onClose },
    )
  }

  return (
    <SlideOver open={open} onClose={onClose} title="Bejárás ütemezése" width={420}>
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <SelectField label="Helyszín" required value={locationId}
          onChange={(e) => setLocationId(e.target.value)}>
          <option value="">Válassz helyszínt…</option>
          {locations.data?.map((l) => (
            <option key={l.locationId} value={l.locationId}>{l.name}</option>
          ))}
        </SelectField>
        <DateField label="Időpont" type="datetime-local" required
          value={scheduledDate} onChange={setScheduledDate} />
        <SelectField label="Vezeti" required value={conductedBy}
          onChange={(e) => setConductedBy(e.target.value)}>
          <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
        </SelectField>
        <div className="flex gap-2">
          <Button type="submit"
            disabledReason={
              schedule.isPending ? 'Folyamatban…' : locationId === '' ? 'Válassz helyszínt.' : undefined
            }>
            Ütemezés
          </Button>
          <Button type="button" variant="quiet" onClick={onClose}>Mégse</Button>
        </div>
      </form>
    </SlideOver>
  )
}

export function WalksScreen({ initialTab = 'walks' }: { initialTab?: 'walks' | 'capa' }) {
  const [tab, setTab] = useState<string>(initialTab)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const walks = useSafetyWalks()
  const locations = useEhsLocations()
  const locNames = locationNameMap(locations.data)

  const columns: DataTableColumn<SafetyWalkListItem>[] = [
    {
      key: 'location', header: 'Helyszín', mobile: 'title',
      render: (w) => (
        <button
          onClick={() => setSelectedId(w.safetyWalkId)}
          className="rounded text-left text-[12.5px] font-semibold text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-world-ring"
        >
          {locNames.get(w.locationId) ?? '—'}
        </button>
      ),
    },
    {
      key: 'scheduledDate', header: 'Időpont', sortable: true,
      sortValue: (w) => w.scheduledDate,
      render: (w) => <span className="font-mono text-[12px]">{formatDateTime(w.scheduledDate)}</span>,
    },
    { key: 'conductedBy', header: 'Vezeti', mobile: 'hidden', render: (w) => employeeName(w.conductedBy) },
    { key: 'findings', header: 'Megállapítás', render: (w) => `${w.findingCount} db` },
    {
      key: 'status', header: 'Státusz',
      render: (w) => <StatusPill fsm="ehsBejaras" status={w.status} label={WALK_STATUS_LABELS[w.status]} />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">Bejárások</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Munkavédelmi bejárások és az egységes CAPA-tábla — megállapításból egy lépésben intézkedés
          </p>
        </div>
        <Button icon="plus" onClick={() => setScheduleOpen(true)}>Új bejárás</Button>
      </div>

      <Tabs
        idBase="ehs-walks"
        label="Bejárás nézetek"
        activeId={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: 'walks', label: 'Bejárások' },
          { id: 'capa', label: 'CAPA tábla' },
        ]}
      />

      <TabPanel idBase="ehs-walks" id="walks" active={tab === 'walks'}>
        <QueryGate isPending={walks.isPending} isError={walks.isError}
          onRetry={() => void walks.refetch()} resource="bejárások">
          <DataTable
            columns={columns}
            rows={walks.data ?? []}
            rowKey={(w) => w.safetyWalkId}
            caption="Munkavédelmi bejárások"
            emptyMessage="Nincs ütemezett bejárás."
            emptyAction={<Button size="sm" onClick={() => setScheduleOpen(true)}>Új bejárás</Button>}
          />
        </QueryGate>
      </TabPanel>

      <TabPanel idBase="ehs-walks" id="capa" active={tab === 'capa'}>
        <CapaBoard />
      </TabPanel>

      <WalkDetailSlideOver walkId={selectedId} onClose={() => setSelectedId(null)} />
      {scheduleOpen && <ScheduleWalkForm open onClose={() => setScheduleOpen(false)} />}
    </div>
  )
}
