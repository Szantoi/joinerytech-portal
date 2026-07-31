/**
 * EmployeeAvatar — származtatott monogram-szín (A11Y-AXE-FIXES 2.).
 *
 * Az axe 7 kontraszt-sértést mért: a fix fehér monogram világos törzsadat-
 * színen 4.5:1 alá esett. A betűszín mostantól a háttér relatív
 * luminanciájából jön; a 0.179-es küszöb a fehér/fekete metszéspont, ahol a
 * kontraszt 4.58:1 — tehát BÁRMELY háttérre ≥ 4.5:1 (AA).
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmployeeAvatar } from '../EmployeeAvatar'
import { avatarInkFor } from '../avatarInk'

describe('avatarInkFor', () => {
  it('világos háttérre fekete monogramot ad', () => {
    expect(avatarInkFor('#fbbf24')).toBe('#000000') // amber-400 — az axe-lelet osztálya
    expect(avatarInkFor('#fff')).toBe('#000000') // 3 jegyű hex is
  })

  it('sötét háttérre fehéret', () => {
    expect(avatarInkFor('#1d4ed8')).toBe('#ffffff') // blue-700
    expect(avatarInkFor('#000000')).toBe('#ffffff')
  })

  it('nem-hex színre a korábbi fehér marad (dokumentált fallback)', () => {
    expect(avatarInkFor('tomato')).toBe('#ffffff')
    expect(avatarInkFor('')).toBe('#ffffff')
  })
})

describe('EmployeeAvatar', () => {
  it('a renderelt monogram a származtatott színt viseli', () => {
    const { container } = render(<EmployeeAvatar color="#fbbf24" initials="KA" />)
    const badge = container.querySelector('span[aria-hidden="true"]') as HTMLElement
    expect(badge.style.color).toBe('rgb(0, 0, 0)')
    expect(badge.style.background).toBe('rgb(251, 191, 36)')
  })
})
