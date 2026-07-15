import { useMemo, useState } from 'react'
import {
  Button, DataTable, StatusPill, Tabs, TabPanel, type DataTableColumn,
} from '../../components/ui'
import {
  usePpeItems, usePpeIssuances, usePpeTransition,
  PPE_ISSUANCE_FSM, transitionBlockReason,
  CURRENT_EMPLOYEE_ID, EHS_EMPLOYEE_DIRECTORY, employeeName,
  type PpeIssuance, type PpeItem, type PpeIssuanceAction,
} from '../../services/ehs'
import { PPE_CATEGORY_LABELS, PPE_STATUS_LABELS, formatDate } from './labels'
import { QueryGate } from './QueryGate'
import { SelectField } from './formFields'
import { PpeIssueForm } from './PpeIssueForm'

/**
 * EVE/PPE képernyő — kiadások dolgozónként (FSM: kiadva → átvett → visszavett|cserélve)
 * + katalógus fül. A tiltott FSM-akció NEM tűnik el: Button disabledReason
 * (aria-disabled + tooltip); szerver-oldali 409 → toast (usePpeTransition).
 */

const PPE_ACTION_LABELS: Record<PpeIssuanceAction, string> = {
  acknowledge: 'Átvétel',
  return: 'Visszavétel',
  replace: 'Csere',
}

function IssuanceActions({ issuance }: { issuance: PpeIssuance }) {
  const transition = usePpeTransition()
  const run = (action: PpeIssuanceAction) => {
    transition.mutate({
      id: issuance.issuanceId,
      action,
      payload: action === 'replace' ? { replacedBy: CURRENT_EMPLOYEE_ID } : undefined,
    })
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {(Object.keys(PPE_ACTION_LABELS) as PpeIssuanceAction[]).map((action) => (
        <Button
          key={action}
          size="sm"
          variant="secondary"
          disabledReason={
            transition.isPending
              ? 'Folyamatban…'
              : transitionBlockReason(PPE_ISSUANCE_FSM, action, issuance.status, PPE_STATUS_LABELS)
          }
          onClick={() => run(action)}
        >
          {PPE_ACTION_LABELS[action]}
        </Button>
      ))}
    </span>
  )
}

export function PpeScreen() {
  const [tab, setTab] = useState('issuances')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)

  const issuances = usePpeIssuances(employeeFilter ? { employeeId: employeeFilter } : {})
  const items = usePpeItems()
  const itemNames = useMemo(
    () => new Map((items.data ?? []).map((i) => [i.ppeItemId, i.name])),
    [items.data],
  )

  const issuanceColumns: DataTableColumn<PpeIssuance>[] = [
    {
      key: 'employee', header: 'Dolgozó', sortable: true, mobile: 'title',
      sortValue: (i) => employeeName(i.employeeId),
      render: (i) => <span className="text-[12.5px] font-semibold text-ink">{employeeName(i.employeeId)}</span>,
    },
    { key: 'item', header: 'Eszköz', render: (i) => itemNames.get(i.ppeItemId) ?? '—' },
    {
      key: 'issuedAt', header: 'Kiadva', sortable: true, mobile: 'hidden',
      sortValue: (i) => i.issuedAt,
      render: (i) => <span className="font-mono text-[12px]">{formatDate(i.issuedAt)}</span>,
    },
    {
      key: 'expiresAt', header: 'Lejárat', sortable: true,
      sortValue: (i) => i.expiresAt ?? '',
      render: (i) => (
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[12px]">{formatDate(i.expiresAt)}</span>
          {i.isExpired && <StatusPill size="sm" tone="danger" label="Lejárt" />}
        </span>
      ),
    },
    {
      key: 'status', header: 'Státusz',
      render: (i) => <StatusPill fsm="ehsPpeKiadas" status={i.status} label={PPE_STATUS_LABELS[i.status]} />,
    },
    { key: 'actions', header: 'Műveletek', render: (i) => <IssuanceActions issuance={i} /> },
  ]

  const itemColumns: DataTableColumn<PpeItem>[] = [
    {
      key: 'name', header: 'Megnevezés', sortable: true, mobile: 'title',
      sortValue: (i) => i.name,
      render: (i) => <span className="text-[12.5px] font-semibold text-ink">{i.name}</span>,
    },
    { key: 'category', header: 'Kategória', render: (i) => PPE_CATEGORY_LABELS[i.category] },
    { key: 'standard', header: 'Szabvány', render: (i) => i.standardRef ?? '—' },
    {
      key: 'lifetime', header: 'Élettartam', mobile: 'hidden',
      render: (i) => (i.defaultLifetimeMonths ? `${i.defaultLifetimeMonths} hónap` : '—'),
    },
    {
      key: 'active', header: 'Státusz',
      render: (i) => <StatusPill tone={i.isActive ? 'success' : 'terminal'} label={i.isActive ? 'Aktív' : 'Inaktív'} />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-7 md:py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink md:text-[24px]">EVE kiadások</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Egyéni védőeszközök dolgozónként — FSM: kiadva → átvett → visszavett | cserélve
          </p>
        </div>
        <Button icon="plus" onClick={() => setIssueOpen(true)}>Új kiadás</Button>
      </div>

      <Tabs
        idBase="ehs-ppe"
        label="EVE nézetek"
        activeId={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: 'issuances', label: 'Kiadások' },
          { id: 'catalog', label: 'Katalógus' },
        ]}
      />

      <TabPanel idBase="ehs-ppe" id="issuances" active={tab === 'issuances'}>
        <SelectField label="Dolgozó szerinti szűrés" value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)} className="mb-3 max-w-xs">
          <option value="">Minden dolgozó</option>
          {EHS_EMPLOYEE_DIRECTORY.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </SelectField>

        <QueryGate isPending={issuances.isPending} isError={issuances.isError}
          onRetry={() => void issuances.refetch()} resource="EVE-kiadások">
          <DataTable
            columns={issuanceColumns}
            rows={issuances.data ?? []}
            rowKey={(i) => i.issuanceId}
            caption="EVE kiadások dolgozónként"
            emptyMessage="Nincs kiadás a kiválasztott szűréssel."
          />
        </QueryGate>
      </TabPanel>

      <TabPanel idBase="ehs-ppe" id="catalog" active={tab === 'catalog'}>
        <QueryGate isPending={items.isPending} isError={items.isError}
          onRetry={() => void items.refetch()} resource="EVE-katalógus">
          <DataTable
            columns={itemColumns}
            rows={items.data ?? []}
            rowKey={(i) => i.ppeItemId}
            caption="EVE katalógus"
            emptyMessage="Üres a katalógus."
          />
        </QueryGate>
      </TabPanel>

      {issueOpen && <PpeIssueForm open onClose={() => setIssueOpen(false)} />}
    </div>
  )
}
