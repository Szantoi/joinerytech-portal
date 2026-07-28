/**
 * EmployeeAvatar — monogram-korong a dolgozó törzsadat-színével.
 * Dekoratív (aria-hidden): a nevet mindig látható szöveg hordozza mellette.
 */
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
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}
