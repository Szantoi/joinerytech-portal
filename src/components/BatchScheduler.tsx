import { useState, useEffect, useRef } from 'react'
import { Card, Icon } from './ui'
import { useApi, useMutation, API_BASE } from '../hooks/useApi'

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  roles: string[]
}

export interface Machine {
  id: string
  name: string
  type: string
}

export interface Batch {
  id: string
  planId: string
  planName: string
  status: 'pending' | 'assigned' | 'running' | 'done'
  partsCount: number
}

export interface AssignBatchRequest {
  batchId: string
  machineId: string
  operatorId: string
  priority: number
  startTime: string
}

interface BatchSchedulerProps {
  date: string
  batches: Batch[]
  onAssignSuccess?: () => void
}

// ─── Autocomplete Component ────────────────────────────────────────────────────

interface AutocompleteProps {
  value: string
  onChange: (value: string, selectedItem: User | null) => void
  placeholder: string
  options: User[]
  isLoading?: boolean
}

function Autocomplete({ value, onChange, placeholder, options, isLoading }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<User[]>(options)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (value === '') {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(opt => {
        const fullName = `${opt.firstName ?? ''} ${opt.lastName ?? ''}`.trim().toLowerCase()
        const username = opt.username.toLowerCase()
        const searchTerm = value.toLowerCase()
        return fullName.includes(searchTerm) || username.includes(searchTerm)
      })
      setFilteredOptions(filtered)
    }
  }, [value, options])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue, null)
    setIsOpen(true)
  }

  const handleSelectOption = (option: User) => {
    const displayName = `${option.firstName ?? ''} ${option.lastName ?? ''}`.trim() || option.username
    onChange(displayName, option)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[12.5px] border border-stone-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Icon name="more" size={14} className="text-stone-400 animate-spin" />
        </div>
      )}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => {
            const displayName = `${option.firstName ?? ''} ${option.lastName ?? ''}`.trim() || option.username
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-stone-50 border-b border-stone-100 last:border-0"
              >
                <div className="font-medium text-stone-900">{displayName}</div>
                <div className="text-[11px] text-stone-500">{option.email}</div>
              </button>
            )
          })}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && value !== '' && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2 text-[12.5px] text-stone-500">
          Nincs találat
        </div>
      )}
    </div>
  )
}

// ─── BatchCard Component ────────────────────────────────────────────────────────

interface BatchCardProps {
  batch: Batch
  machines: Machine[]
  onAssign: (request: AssignBatchRequest) => Promise<void>
}

function BatchCard({ batch, machines, onAssign }: BatchCardProps) {
  const [operatorName, setOperatorName] = useState('')
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [priority, setPriority] = useState(5)
  const [startTime, setStartTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: operators, isLoading: isLoadingOperators } = useApi<User[]>(
    `${API_BASE.identity}/api/users?role=machine_operator`
  )

  useEffect(() => {
    if (operators && operators.length > 0) {
      // Auto-fetch on mount - hook already provides data
    }
  }, [operators])

  const handleSubmit = async () => {
    if (!selectedOperator || !selectedMachine || !startTime) {
      alert('Kérem töltse ki az összes mezőt')
      return
    }

    setIsSubmitting(true)
    try {
      await onAssign({
        batchId: batch.id,
        machineId: selectedMachine,
        operatorId: selectedOperator.id,
        priority,
        startTime,
      })
      // Reset form
      setOperatorName('')
      setSelectedOperator(null)
      setSelectedMachine('')
      setPriority(5)
      setStartTime('')
    } catch (error) {
      console.error('Hozzárendelési hiba:', error)
      alert('Hiba történt a hozzárendelés során')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1">
          Batch hozzárendelés
        </div>
        <div className="text-[13px] font-semibold text-stone-900">{batch.planName}</div>
        <div className="text-[11px] text-stone-500 mt-0.5">
          {batch.partsCount} alkatrész · ID: {batch.id.slice(0, 8).toUpperCase()}
        </div>
      </div>

      <div className="space-y-3">
        {/* Operator autocomplete */}
        <div>
          <label className="block text-[11px] font-medium text-stone-700 mb-1">
            Operátor
          </label>
          <Autocomplete
            value={operatorName}
            onChange={(value, user) => {
              setOperatorName(value)
              setSelectedOperator(user)
            }}
            placeholder="Keresés név vagy felhasználónév alapján..."
            options={operators ?? []}
            isLoading={isLoadingOperators}
          />
        </div>

        {/* Machine selector */}
        <div>
          <label className="block text-[11px] font-medium text-stone-700 mb-1">
            Gép
          </label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full px-3 py-2 text-[12.5px] border border-stone-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Válasszon gépet...</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name} ({machine.type})
              </option>
            ))}
          </select>
        </div>

        {/* Priority selector */}
        <div>
          <label className="block text-[11px] font-medium text-stone-700 mb-1">
            Prioritás: {priority}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-stone-500 mt-1">
            <span>1 (Alacsony)</span>
            <span>10 (Magas)</span>
          </div>
        </div>

        {/* Start time picker */}
        <div>
          <label className="block text-[11px] font-medium text-stone-700 mb-1">
            Indítási idő
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 text-[12.5px] border border-stone-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedOperator || !selectedMachine || !startTime}
          className="w-full px-4 py-2.5 bg-teal-600 text-white text-[12.5px] font-medium rounded-lg hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? 'Hozzárendelés...' : 'Hozzárendelés'}
        </button>
      </div>
    </Card>
  )
}

// ─── Main BatchScheduler Component ──────────────────────────────────────────────

export function BatchScheduler({ date, batches, onAssignSuccess }: BatchSchedulerProps) {
  const { mutate } = useMutation()

  // Mock machines data (in real app, this would come from API)
  const machines: Machine[] = [
    { id: 'm1', name: 'Holzma HPP 380', type: 'Panel Saw' },
    { id: 'm2', name: 'Selco WN 750', type: 'Panel Saw' },
    { id: 'm3', name: 'Homag BMG 512', type: 'CNC Router' },
  ]

  const handleAssign = async (request: AssignBatchRequest) => {
    const url = `${API_BASE.cutting}/api/plans/${date}/assign-batch`
    await mutate(url, {
      method: 'POST',
      body: request,
    })
    onAssignSuccess?.()
  }

  const pendingBatches = batches.filter(b => b.status === 'pending')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-stone-900">Batch ütemezés</div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {pendingBatches.length} hozzárendelésre váró batch · {date}
          </div>
        </div>
      </div>

      {pendingBatches.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-[12.5px] text-stone-400">
            Nincs hozzárendelésre váró batch ezen a napon
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              machines={machines}
              onAssign={handleAssign}
            />
          ))}
        </div>
      )}
    </div>
  )
}
