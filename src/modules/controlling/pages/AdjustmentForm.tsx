import { useState } from 'react'
import { Button, Input, SelectField, SlideOver, TextAreaField } from '../../../components/ui'
import {
  CONTROLLING_CURRENT_USER, COST_CATEGORIES, useCreateAdjustment, useProjects,
  type AdjustmentScope, type CostCategory,
} from '../services'
import { CATEGORY_LABELS, SCOPE_LABELS } from './labels'

/**
 * Új utókalkulációs korrekció rögzítése — a backend CostAdjustment
 * invariánsainak kliens-oldali tükre (kötelező indok, nem-nulla előjeles
 * összeg, projekt-hatálynál projekt): a tiltott beküldés NEM rejtett, hanem
 * disabledReason-nel magyarázott (aria-disabled + tooltip).
 */
export function AdjustmentForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useProjects()
  const create = useCreateAdjustment()

  const [scope, setScope] = useState<AdjustmentScope>('project')
  const [projectId, setProjectId] = useState('')
  const [category, setCategory] = useState<CostCategory>('anyag')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const parsedAmount = Number(amount)
  const blockReason = create.isPending
    ? 'Rögzítés folyamatban…'
    : scope === 'project' && projectId === ''
      ? 'Válassz projektet.'
      : amount === '' || !Number.isFinite(parsedAmount) || parsedAmount === 0
        ? 'Adj meg nullától eltérő összeget.'
        : reason.trim() === ''
          ? 'Az indok kötelező (audit trail).'
          : undefined

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (blockReason) return
    create.mutate(
      {
        scope,
        projectId: scope === 'project' ? projectId : null,
        category,
        amount: parsedAmount,
        reason: reason.trim(),
        createdBy: CONTROLLING_CURRENT_USER,
      },
      { onSuccess: () => { setAmount(''); setReason(''); onClose() } },
    )
  }

  return (
    <SlideOver open={open} onClose={onClose} title="Új korrekció"
      subtitle="Utókalkulációs tétel — a kategória tény-költségét módosítja" width={420}>
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <SelectField label="Hatály" required value={scope}
          onChange={(e) => setScope(e.target.value as AdjustmentScope)}>
          {(Object.keys(SCOPE_LABELS) as AdjustmentScope[]).map((s) => (
            <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
          ))}
        </SelectField>

        {scope === 'project' && (
          <SelectField label="Projekt" required value={projectId}
            onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Válassz projektet…</option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </SelectField>
        )}

        <SelectField label="Költség-kategória" required value={category}
          onChange={(e) => setCategory(e.target.value as CostCategory)}>
          {COST_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </SelectField>

        <Input label="Összeg (Ft — negatív: jóváírás)" type="number" required step={1000}
          value={amount} onChange={(e) => setAmount(e.target.value)} />

        <TextAreaField label="Indok" required value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Pl. beszállítói jóváírás, garanciális utómunka…" />

        <div className="flex gap-2">
          <Button type="submit" disabledReason={blockReason}>Korrekció rögzítése</Button>
          <Button type="button" variant="quiet" onClick={onClose}>Mégse</Button>
        </div>
      </form>
    </SlideOver>
  )
}
