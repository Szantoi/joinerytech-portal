import { createContext, useContext } from 'react'
import type { Tone } from '../../theme/statusTones'

/**
 * Egy sor a megerősítés strukturált összefoglalójában (PLAN-05 F4).
 *
 * Miért ADAT és nem `ReactNode`: így a dialógus kinézete a design-systemé
 * marad, nem a hívóé — különben minden fogyasztó újra feltalálná az
 * összefoglaló-elrendezést, és a szemantika (definíciós lista) elveszne.
 */
export interface ConfirmDetail {
  /** Mit ír le a sor — pl. „Célgép". */
  label: string
  /** A fő érték — pl. a gép neve. */
  value: string
  /** Másodlagos sor, ha a fő érték magában kevés — pl. „Kapacitás: 100 egység". */
  hint?: string
  /**
   * Ha van, az érték tónusos pillként jelenik meg. A szám/szöveg így is
   * olvasható marad: a szín soha nem az egyetlen jelzés (spec 1.6).
   */
  tone?: Tone
}

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
  /**
   * Strukturált összefoglaló: mire mond igent a felhasználó. Definíciós
   * listaként jelenik meg, és a `description` MELLETT él (nem helyette) —
   * a szöveges indoklás és a tételes összefoglaló két külön dolog.
   */
  details?: readonly ConfirmDetail[]
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
