import { useState } from 'react'
import { Button, Input, SlideOver } from '../../../components/ui'
import {
  useIssuePpe, usePpeItems, CURRENT_EMPLOYEE_ID, EHS_EMPLOYEE_DIRECTORY,
} from '../services'
import { EmployeeOptions, SelectField } from './formFields'

/**
 * Új EVE-kiadás rögzítése (FSM belépő: Issued/kiadva).
 * A lejárat üresen hagyható — ilyenkor a backend a katalógus-elem
 * defaultLifetimeMonths értékéből származtatja.
 */
export function PpeIssueForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = usePpeItems({ activeOnly: true })
  const issue = useIssuePpe()

  const [employeeId, setEmployeeId] = useState(EHS_EMPLOYEE_DIRECTORY[0].id)
  const [ppeItemId, setPpeItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    issue.mutate(
      {
        employeeId,
        ppeItemId,
        issuedBy: CURRENT_EMPLOYEE_ID,
        quantity,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <SlideOver open={open} onClose={onClose} title="EVE kiadás rögzítése"
      subtitle="Egyéni védőeszköz kiadása dolgozónak" width={420}>
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <SelectField label="Dolgozó" required value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}>
          <EmployeeOptions employees={EHS_EMPLOYEE_DIRECTORY} />
        </SelectField>

        <SelectField label="Védőeszköz" required value={ppeItemId}
          onChange={(e) => setPpeItemId(e.target.value)}>
          <option value="">Válassz eszközt…</option>
          {items.data?.map((item) => (
            <option key={item.ppeItemId} value={item.ppeItemId}>
              {item.name}{item.standardRef ? ` (${item.standardRef})` : ''}
            </option>
          ))}
        </SelectField>

        <Input label="Mennyiség" type="number" min={1} required value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))} />

        <Input label="Lejárat (üresen: alapértelmezett élettartam)" type="date" value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)} />

        <div className="flex gap-2">
          <Button type="submit"
            disabledReason={
              issue.isPending ? 'Folyamatban…' : ppeItemId === '' ? 'Válassz védőeszközt.' : undefined
            }>
            Kiadás rögzítése
          </Button>
          <Button type="button" variant="quiet" onClick={onClose}>Mégse</Button>
        </div>
      </form>
    </SlideOver>
  )
}
