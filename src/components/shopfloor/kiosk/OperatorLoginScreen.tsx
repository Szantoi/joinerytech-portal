import { useState } from 'react'
import { Icon } from '../../ui/Icon'
import { useWorkstations } from '../../../hooks/useWorkstations'
import type { OperatorSession } from '../../../types/shopfloor'

interface Props {
  onLogin: (session: OperatorSession) => void
}

export function OperatorLoginScreen({ onLogin }: Props) {
  const [pin, setPin] = useState('')
  const [workstationId, setWorkstationId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { workstations } = useWorkstations()

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/cutting/api/shopfloor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorPin: pin, workstationId }),
      })

      if (!response.ok) {
        throw new Error('Hibás PIN vagy gép kiválasztás')
      }

      const session: OperatorSession = await response.json()
      onLogin(session)
    } catch (err: any) {
      setError(err.message)

      // Mock fallback for development
      if (pin === '1234') {
        const mockSession: OperatorSession = {
          sessionId: 'session-' + Date.now(),
          operatorId: 'op-001',
          operatorName: 'Nagy József',
          operatorPin: pin,
          workstationId,
          workstationName: workstations.find(ws => ws.id === workstationId)?.name || 'Szabász gép #1',
          loginTime: new Date().toISOString(),
        }
        onLogin(mockSession)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePinInput = (digit: string) => {
    setError(null)
    if (pin.length < 4) {
      setPin(pin + digit)
    }
  }

  const clearPin = () => {
    setPin('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-800 rounded-lg shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="user" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Operátor bejelentkezés</h1>
        </div>

        {/* Workstation selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Gép kiválasztása</label>
          <select
            value={workstationId}
            onChange={(e) => setWorkstationId(e.target.value)}
            className="w-full px-4 py-3 bg-stone-700 text-white rounded-md border border-stone-600 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Válasszon gépet...</option>
            {workstations.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* PIN display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">PIN kód</label>
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 bg-stone-700 rounded-md flex items-center justify-center border ${
                  error
                    ? 'border-red-500'
                    : i < pin.length
                    ? 'border-emerald-500'
                    : 'border-stone-600'
                }`}
              >
                {i < pin.length ? <div className="w-3 h-3 bg-emerald-500 rounded-full" /> : null}
              </div>
            ))}
          </div>

          {/* PIN pad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinInput(String(digit))}
                className="h-16 bg-stone-700 hover:bg-stone-600 text-white text-xl font-semibold rounded-md transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={clearPin}
              className="h-16 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors text-sm"
            >
              Törlés
            </button>
            <button
              onClick={() => handlePinInput('0')}
              className="h-16 bg-stone-700 hover:bg-stone-600 text-white text-xl font-semibold rounded-md transition-colors"
            >
              0
            </button>
            <button
              onClick={handleLogin}
              disabled={pin.length !== 4 || !workstationId || loading}
              className="h-16 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
            >
              {loading ? 'Bejelentkezés...' : 'OK'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-md p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-300">
            Vissza a portálra
          </a>
        </div>

        <div className="mt-4 text-center text-[10px] text-stone-600 font-mono">
          Tipp: PIN 1234 | v1.0.0 · Kiosk mód
        </div>
      </div>
    </div>
  )
}
