import { describe, expect, it } from 'vitest'
import { WORLD_ORDER } from '../mocks/worlds'
import type { WorldKey } from '../types'
import { HIDDEN_LEGACY_WORLDS, isWorldEnabled, visibleWorlds, visibleWorldsForRoles, WORLD_MODULES } from './worldAccess'

describe('world access', () => {
  it('normalizes legacy module claim values for the seven platform worlds', () => {
    expect(isWorldEnabled('crm', ['crm'])).toBe(true)
    expect(isWorldEnabled('quality', ['qa'])).toBe(true)
    expect(isWorldEnabled('docs', ['dms'])).toBe(true)
    expect(visibleWorlds(
      ['crm', 'kontrolling', 'hr', 'maintenance', 'quality', 'ehs', 'docs'],
      ['crm', 'kontrolling', 'hr', 'maintenance', 'qa', 'ehs', 'dms'],
    )).toEqual(['crm', 'kontrolling', 'hr', 'maintenance', 'quality', 'ehs', 'docs'])
  })

  it('requires every entitlement for composite industry worlds', () => {
    expect(isWorldEnabled('production', ['cutting'])).toBe(false)
    expect(isWorldEnabled('production', ['cutting', 'joinery'])).toBe(true)
    expect(isWorldEnabled('warehouse', ['inventory'])).toBe(false)
    expect(isWorldEnabled('warehouse', ['inventory', 'procurement'])).toBe(true)
  })

  it('fails closed for unclassified worlds while retaining settings', () => {
    expect(visibleWorlds(['crm', 'sales', 'settings'], ['crm'])).toEqual(['crm', 'settings'])
  })

  it('intersects person roles with tenant entitlements', () => {
    const fullTenant = [
      'spaceos.crm', 'spaceos.controlling', 'spaceos.hr', 'spaceos.maintenance',
      'spaceos.qa', 'spaceos.ehs', 'spaceos.dms', 'joinerytech.cutting',
      'joinerytech.joinery', 'joinerytech.inventory', 'joinerytech.procurement',
    ]

    expect(visibleWorldsForRoles(WORLD_ORDER, fullTenant, ['Joiner']))
      .toEqual(['production', 'settings'])
    expect(visibleWorldsForRoles(WORLD_ORDER, fullTenant, ['Designer']))
      .toEqual(['production', 'warehouse', 'crm', 'maintenance', 'quality', 'ehs', 'docs', 'settings'])
  })

  it('az üzemi szerepek NEM kapnak üres rácsot (PLAN-05 F6)', () => {
    const fullTenant = ['joinerytech.cutting', 'joinerytech.joinery']

    // A szerep-szótár bővítésével ezek valódi szerepek lettek, és az
    // onboarding-profil létre is hoz ilyen felhasználókat — üres portállal
    // fogadni őket ugyanaz a csapda lenne, mint a Joiner→shopfloor volt.
    expect(visibleWorldsForRoles(WORLD_ORDER, fullTenant, ['production_manager']))
      .toEqual(['production', 'settings'])
    expect(visibleWorldsForRoles(WORLD_ORDER, fullTenant, ['machine_operator']))
      .toEqual(['production', 'settings'])
  })

  it('az entitlement továbbra is felülír: üzemi szerep sem lát meg nem vett világot', () => {
    // A `production` kompozit: cutting ÉS joinery kell hozzá. Fél entitlementtel
    // a szerep sem nyitja meg — a két tengely metszete marad a szabály.
    expect(visibleWorldsForRoles(WORLD_ORDER, ['joinerytech.cutting'], ['machine_operator']))
      .toEqual(['settings'])
  })

  it('a fejlesztői seed (Admin + üzemvezető) az Admin rácsát kapja', () => {
    expect(visibleWorldsForRoles(
      ['crm', 'production', 'settings'],
      ['spaceos.crm', 'joinerytech.cutting', 'joinerytech.joinery'],
      ['production_manager', 'Admin'],
    )).toEqual(['production', 'crm', 'settings'])
  })

  it('uses the highest recognized role regardless of claim ordering', () => {
    expect(visibleWorldsForRoles(
      ['crm', 'settings'],
      ['spaceos.crm'],
      ['Joiner', 'Admin'],
    )).toEqual(['crm', 'settings'])
  })

  it('fails closed when no recognized role is present', () => {
    expect(visibleWorldsForRoles(
      ['production', 'crm', 'settings'],
      ['joinerytech.cutting', 'joinerytech.joinery', 'spaceos.crm'],
      ['UnmappedRole'],
    )).toEqual([])
  })

  it('classifies every registered world as sellable, base, or hidden legacy', () => {
    const classified = new Set<WorldKey>([
      ...Object.keys(WORLD_MODULES) as WorldKey[],
      ...HIDDEN_LEGACY_WORLDS,
      'settings',
    ])

    expect(new Set(WORLD_ORDER)).toEqual(classified)
  })
})
