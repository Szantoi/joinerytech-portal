import { describe, it, expect } from 'vitest'
import { I18N, ORDERS, CUTTING_PLANS, MATERIALS, SUPPLIERS, ACTIVE_PO, USERS, SPARKS, NESTING } from '../data'
import { WORLDS, WORLD_ORDER, QUOTES, CUSTOMERS, SHOPFLOOR_MACHINES, SHOPFLOOR_OPERATORS, PARAM_TEMPLATES, CATALOG_LOOKUP } from '../worlds'
import { STAGES, FLOW_EPICS, WORKSTATIONS, AUDIT_LOG } from '../extra'
import { FACILITIES, PARTNERS, PARTNER_INVITES, TEMPLATES, NESTING_SHEETS, ROLE_MATRIX, ROLE_KEYS, PERMISSION_MODULES } from '../extra2'

describe('Mock data integrity', () => {
  it('has Hungarian i18n strings', () => {
    expect(I18N.hu).toBeDefined()
    expect(I18N.hu.brand).toBe('joinery/tech')
  })

  it('has 10 orders', () => {
    expect(ORDERS).toHaveLength(10)
    ORDERS.forEach((o) => {
      expect(o.id).toBeTruthy()
      expect(o.customer).toBeTruthy()
    })
  })

  it('has cutting plans', () => {
    expect(CUTTING_PLANS.length).toBeGreaterThan(0)
  })

  it('has materials', () => {
    expect(MATERIALS.length).toBeGreaterThan(0)
  })

  it('has suppliers', () => {
    expect(SUPPLIERS.length).toBe(5)
  })

  it('has active POs', () => {
    expect(ACTIVE_PO.length).toBe(4)
  })

  it('has users', () => {
    expect(USERS.length).toBe(6)
  })

  it('has sparks data', () => {
    expect(SPARKS.ordersToday.length).toBeGreaterThan(0)
    expect(SPARKS.capacity.length).toBeGreaterThan(0)
  })

  it('has nesting data', () => {
    expect(NESTING.parts.length).toBeGreaterThan(0)
    expect(NESTING.sheet.w).toBe(2800)
  })

  it('has 27 worlds', () => {
    expect(Object.keys(WORLDS)).toHaveLength(27)
    expect(WORLD_ORDER).toHaveLength(27)
  })

  it('has quotes', () => {
    expect(QUOTES.length).toBe(7)
  })

  it('has customers', () => {
    expect(CUSTOMERS.length).toBe(7)
  })

  it('has shopfloor machines', () => {
    expect(SHOPFLOOR_MACHINES.length).toBe(5)
  })

  it('has shopfloor operators with valid pins', () => {
    expect(SHOPFLOOR_OPERATORS.length).toBe(4)
    SHOPFLOOR_OPERATORS.forEach((op) => {
      expect(op.pin).toHaveLength(4)
    })
  })

  it('has parametric templates', () => {
    expect(PARAM_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('has catalog lookup entries', () => {
    expect(Object.keys(CATALOG_LOOKUP).length).toBe(10)
  })

  it('has stages', () => {
    expect(STAGES).toHaveLength(5)
  })

  it('has flow epics', () => {
    expect(FLOW_EPICS.length).toBe(13)
  })

  it('has workstations', () => {
    expect(WORKSTATIONS.length).toBe(6)
  })

  it('has audit log', () => {
    expect(AUDIT_LOG.length).toBe(8)
  })

  it('has facilities', () => {
    expect(FACILITIES).toHaveLength(3)
  })

  it('has partners', () => {
    expect(PARTNERS).toHaveLength(6)
  })

  it('has partner invites', () => {
    expect(PARTNER_INVITES).toHaveLength(3)
  })

  it('has templates', () => {
    expect(TEMPLATES).toHaveLength(6)
  })

  it('has nesting sheets', () => {
    expect(NESTING_SHEETS).toHaveLength(8)
    expect(NESTING_SHEETS[0]).toBeNull()
  })

  it('has role matrix for all roles', () => {
    ROLE_KEYS.forEach((role) => {
      expect(ROLE_MATRIX[role]).toBeDefined()
      PERMISSION_MODULES.forEach((mod) => {
        expect(['full', 'read', 'none']).toContain(ROLE_MATRIX[role][mod])
      })
    })
  })
})
