import { describe, expect, it } from 'vitest'
import type { User } from 'oidc-client-ts'
import { parseUserClaims } from '../AuthContext'

function userWithProfile(profile: Record<string, unknown>): User {
  return { profile, access_token: '', expired: false } as unknown as User
}

describe('parseUserClaims', () => {
  it('accepts Keycloak JSON-string array claims', () => {
    const claims = parseUserClaims(userWithProfile({
      tid: 'tenant-1',
      enabled_modules: '["spaceos.crm", "spaceos.maintenance"]',
    }))

    expect(claims.tenantId).toBe('tenant-1')
    expect(claims.enabledModules).toEqual(['spaceos.crm', 'spaceos.maintenance'])
  })

  it('fails closed for a camelCase claim that violates the Keycloak contract', () => {
    const claims = parseUserClaims(userWithProfile({ enabledModules: ['spaceos.qa'] }))

    expect(claims.enabledModules).toEqual([])
  })
})
