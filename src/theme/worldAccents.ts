/**
 * Világ-akcent bekötés — portál világ-kulcs → `data-world` attribútum érték.
 *
 * A CSS akcent-tokenek ([data-world="…"] szelektorok az index.css-ben,
 * DESIGN_SYSTEM_SPEC_V1 1.3) a spec kanonikus világ-neveit használják.
 * A portál `quality` és `docs` kulcsai a spec `qa` / `dms` neveire képződnek.
 *
 * Csak a 7 platform-modul kap data-world attribútumot; a többi világ a
 * :root fallback (brand teal) akcentet örökli.
 */

export const WORLD_DATA_ATTR: Record<string, string | undefined> = {
  crm: 'crm',                    // blue
  kontrolling: 'kontrolling',    // slate
  hr: 'hr',                      // amber
  maintenance: 'maintenance',    // cyan
  quality: 'qa',                 // lime
  ehs: 'ehs',                    // red
  docs: 'dms',                   // violet
}
