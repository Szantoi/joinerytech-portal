const pad = (value: number) => String(value).padStart(2, '0')

/** UTC/offset ISO érték → a böngésző helyi datetime-local értéke. */
export function toLocalDateTimeInput(iso: string): string {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return ''
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
    `T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

/** datetime-local érték → offsettel rendelkező, API-kompatibilis UTC ISO érték. */
export function fromLocalDateTimeInput(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Érvénytelen helyi dátum és idő.')
  }
  return parsed.toISOString()
}

/** A magyar üzemekhez rögzített, determinisztikus review-formázás. */
export function formatIncidentDateTime(iso: string): string {
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Budapest',
  }).format(new Date(iso))
}

