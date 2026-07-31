/**
 * EmployeeAvatar — monogram-korong a dolgozó törzsadat-színével.
 * Dekoratív (aria-hidden): a nevet mindig látható szöveg hordozza mellette.
 *
 * A betűszín a háttér relatív luminanciájából SZÁRMAZTATOTT (avatarInk.ts) —
 * a fix fehér monogram világos törzsadat-színen 4.5:1 alá esett (axe).
 */
import { avatarInkFor } from './avatarInk'

export function EmployeeAvatar({
  color,
  initials,
  size = 32,
}: {
  color: string
  initials: string
  size?: number
}) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, background: color, color: avatarInkFor(color), fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}
