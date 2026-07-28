import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requireEnv, summarizeDrift, formatReportRow } from '../gateHelpers';
import { z } from 'zod';

describe('warehouse gateHelpers', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('requireEnv', () => {
    it('visszaadja az env változó értékét, ha az létezik és nem üres', () => {
      process.env.TEST_ENV_VAR = 'http://localhost:3000';
      expect(requireEnv('TEST_ENV_VAR')).toBe('http://localhost:3000');
    });

    it('hibát dob, ha az env változó hiányzik vagy üres', () => {
      delete process.env.TEST_ENV_VAR;
      expect(() => requireEnv('TEST_ENV_VAR')).toThrow('[warehouse-contract-gate] Hiányzó kötelező env: TEST_ENV_VAR.');

      process.env.TEST_ENV_VAR = '   ';
      expect(() => requireEnv('TEST_ENV_VAR')).toThrow('[warehouse-contract-gate] Hiányzó kötelező env: TEST_ENV_VAR.');
    });
  });

  describe('summarizeDrift', () => {
    it('formázza a zod hibalistát mező-útvonal és hibakód párokra', () => {
      const testSchema = z.object({
        name: z.string(),
        count: z.number(),
      });
      const result = testSchema.safeParse({ name: 123 });
      if (!result.success) {
        const drift = summarizeDrift(result.error);
        expect(drift).toContain('name:invalid_type');
        expect(drift).toContain('count:invalid_type');
      } else {
        throw new Error('Expected validation failure');
      }
    });
  });

  describe('formatReportRow', () => {
    it('tiszta egysoros riport-sztringet képez', () => {
      const row = formatReportRow({
        route: '/api/inventory/stock',
        method: 'GET',
        httpStatus: 200,
        schemaResult: 'PASS',
        drift: [],
        durationMs: 12,
      });
      expect(row).toContain('GET');
      expect(row).toContain('/api/inventory/stock');
      expect(row).toContain('HTTP=200');
      expect(row).toContain('schema=PASS');
      expect(row).toContain('drift=[-]');
      expect(row).toContain('12ms');
    });
  });
});
