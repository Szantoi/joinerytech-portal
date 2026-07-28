import { createContext, useContext } from 'react'

/**
 * Confirm context + típusok (PLAN-05 F3).
 *
 * A Toast provider/hook szétválasztás mintájára külön modul, hogy a
 * komponens-fájl csak komponenst exportáljon (react-refresh); a fogyasztók a
 * ui barrelből importálnak.
 *
 * Miért nem `window.confirm`: az blokkolja a fő szálat, nem stílusozható, nem
 * fókuszcsapdázott, mobil böngészőkben elnyomható, és a szövege nem
 * lokalizálható. A promise-alapú `ask()` ugyanazt a hívási kényelmet adja
 * (`if (await ask(...))`), portál-fókuszkezeléssel.
 */

export interface ConfirmOptions {
  /** A dialógus címe — lokalizált szöveg. */
  title: string
  /** Magyarázó szöveg (mit von maga után a művelet). */
  description?: string
  /** A megerősítő gomb felirata — lokalizált szöveg. */
  confirmLabel: string
  /** A mégse gomb felirata — lokalizált szöveg. */
  cancelLabel: string
  /** `danger`: visszavonhatatlan/romboló művelet (piros megerősítő gomb). */
  tone?: 'default' | 'danger'
}

export interface ConfirmContextValue {
  /** Megnyitja a dialógust; a promise a felhasználó döntésével oldódik fel. */
  ask: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
