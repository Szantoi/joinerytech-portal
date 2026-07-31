/**
 * A monogram-korong betűszíne a háttér relatív luminanciájából (axe:
 * color-contrast — a fix fehér monogram világos törzsadat-színen 4.5:1 alá
 * esett). Külön modul: a komponens-fájl csak komponenst exportálhat
 * (react-refresh), és a származtatás önállóan tesztelendő.
 */

/** WCAG relatív luminancia egy #rgb/#rrggbb hex-színre; érvénytelenre null. */
function relativeLuminance(hex: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const raw = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  const channel = (i: number) => {
    const c = parseInt(raw.slice(i * 2, i * 2 + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

/**
 * Sötét vagy világos monogram a nagyobb kontraszt felé. A küszöb a fehér és a
 * FEKETE szöveg kontraszt-metszéspontja: (L+0.05)² = 1.05·0.05 → L ≈ 0.179.
 * Fekete kell, nem "majdnem fekete": a metszéspontban a kontraszt 4.58:1 —
 * bármely háttérszínre ≥ 4.5:1 (AA); egy stone-950-nel a worst case 4.4 alá
 * esne. Nem hex színre (névtelen CSS-szín) a korábbi fehér marad.
 */
export function avatarInkFor(color: string): string {
  const lum = relativeLuminance(color)
  if (lum === null) return '#ffffff'
  return lum > 0.179 ? '#000000' : '#ffffff'
}
