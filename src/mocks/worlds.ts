import type { World, WorldKey, Quote, QuoteTone, QuoteStatus, Customer, Machine, ShopFloorTask, ShopFloorOperator, CatalogLookupEntry, ParamTemplate } from '../types'

export const WORLDS: Record<string, World> = {
  production: {
    key: "production", hu: "Gyártás", en: "Manufacturing",
    sub: "Termelés vezetés és műhely operáció",
    icon: "factory", accent: "teal",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "cutting", hu: "Szabászat", en: "Cutting" },
      { key: "machining", hu: "Megmunkálás", en: "Machining" },
      { key: "workflow", hu: "Munkafolyamat", en: "Workflow" },
      { key: "analytics", hu: "Elemzések", en: "Analytics" },
    ],
    badge: "7 aktív",
  },
  sales: {
    key: "sales", hu: "Értékesítés", en: "Sales",
    sub: "Ajánlatok, megrendelések, ügyfelek",
    icon: "briefcase", accent: "indigo",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "orders", hu: "Rendelések", en: "Orders" },
      { key: "quotes", hu: "Árajánlatok", en: "Quotes" },
      { key: "customers", hu: "Ügyfelek", en: "Customers" },
    ],
    badge: "3 ajánlat",
  },
  design: {
    key: "design", hu: "Tervezés", en: "Design",
    sub: "Parametrikus sablonok, anyaglista, katalógus",
    icon: "ruler", accent: "amber",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "editor", hu: "Sablon szerkesztő", en: "Template editor" },
      { key: "generate", hu: "Anyaglista generálás", en: "Materials generator" },
      { key: "catalog", hu: "Katalógus", en: "Catalog" },
    ],
    badge: "2 projekt",
  },
  warehouse: {
    key: "warehouse", hu: "Raktár", en: "Warehouse",
    sub: "Készlet, beszerzés, mozgások",
    icon: "box", accent: "stone",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "inventory", hu: "Készlet", en: "Inventory" },
      { key: "procurement", hu: "Beszerzés", en: "Procurement" },
      { key: "movements", hu: "Mozgások", en: "Movements" },
    ],
    badge: "1 riadat",
  },
  shopfloor: {
    key: "shopfloor", hu: "Üzem", en: "Shop Floor",
    sub: "Tablet-first műhely terminál — gépkezelőknek",
    icon: "wrench", accent: "emerald",
    screens: [],
    badge: "3 gép",
  },
  settings: {
    key: "settings", hu: "Beállítások", en: "Settings",
    sub: "Cég, felhasználók, jogosultságok, integrációk",
    icon: "settings", accent: "stone",
    screens: [
      { key: "company", hu: "Cégadatok" },
      { key: "users", hu: "Felhasználók" },
      { key: "facilities", hu: "Részlegek" },
      { key: "machines", hu: "Géppark" },
      { key: "partners", hu: "Partnerek" },
      { key: "workflow", hu: "Munkafolyamat" },
      { key: "integrations", hu: "Integrációk" },
      { key: "catalog", hu: "Katalógus" },
      { key: "audit", hu: "Napló" },
      { key: "roles", hu: "Jogosultságok" },
    ],
  },
}

export const WORLD_ORDER: WorldKey[] = ["production", "sales", "design", "warehouse", "shopfloor", "settings"]

export const PARAM_TEMPLATES: ParamTemplate[] = [
  {
    id: "T-01", name: "Polcos szekrény (2 polcos)", type: "Szekrény",
    author: "Kovács P.", version: "1.4", rating: 4.7, uses: 142, updated: "2026-04-18", thumb: "cabinet",
    note: "Standard polcos szekrény, 2 db állítható polccal, hátlapos kivitel.",
    vars: [
      { key: "width", label: "Szélesség", unit: "mm", min: 400, max: 1200, step: 50, default: 800, kind: "raster" },
      { key: "height", label: "Magasság", unit: "mm", min: 600, max: 2400, step: 1, default: 1800, kind: "analog" },
      { key: "depth", label: "Mélység", unit: "mm", min: 300, max: 600, step: 50, default: 400, kind: "raster" },
      { key: "body", label: "Korpusz anyag", kind: "material", default: "EG-3303-18", options: ["EG-3303-18", "EG-1133-18", "EG-3327-18", "MDF-019"] },
      { key: "back", label: "Hátlap anyag", kind: "material", default: "HDF-003", options: ["HDF-003", "MDF-006"] },
      { key: "shelves", label: "Polcok", unit: "db", min: 0, max: 5, step: 1, default: 2, kind: "raster" },
    ],
    parts: [
      { name: "Bal oldallap", qty: 1, mat: "{body}", w: "{depth}", h: "{height}", t: "{body.t}" },
      { name: "Jobb oldallap", qty: 1, mat: "{body}", w: "{depth}", h: "{height}", t: "{body.t}" },
      { name: "Felső lap", qty: 1, mat: "{body}", w: "{width} - 2 * {body.t}", h: "{depth}", t: "{body.t}" },
      { name: "Alsó lap", qty: 1, mat: "{body}", w: "{width} - 2 * {body.t}", h: "{depth}", t: "{body.t}" },
      { name: "Polc", qty: "{shelves}", mat: "{body}", w: "{width} - 2 * {body.t}", h: "{depth} - 20", t: "{body.t}" },
      { name: "Hátlap", qty: 1, mat: "{back}", w: "{width} - 2 * {body.t}", h: "{height} - 2 * {body.t}", t: "{back.t}" },
    ],
    constraints: [
      { rule: "polc szélesség min 200mm", expr: "{width} - 2 * {body.t} >= 200" },
      { rule: "hátlap vastagság <= 8mm", expr: "{back.t} <= 8" },
    ],
  },
  {
    id: "T-02", name: "Konyhai alsó szekrény (fiókos)", type: "Szekrény",
    author: "Szabó A.", version: "2.1", rating: 4.9, uses: 318, updated: "2026-04-22", thumb: "drawer",
    note: "3 fiókos alsó szekrény, Blum Tandembox vasalattal.",
    vars: [
      { key: "width", label: "Szélesség", unit: "mm", min: 300, max: 1200, step: 50, default: 600, kind: "raster" },
      { key: "depth", label: "Mélység", unit: "mm", min: 480, max: 580, step: 10, default: 560, kind: "raster" },
      { key: "drawers", label: "Fiók szám", unit: "db", min: 1, max: 4, step: 1, default: 3, kind: "raster" },
      { key: "body", label: "Korpusz", kind: "material", default: "EG-3303-18", options: ["EG-3303-18", "EG-1133-18"] },
      { key: "front", label: "Front anyag", kind: "material", default: "EG-3327-19", options: ["EG-3327-19", "EG-3303-19"] },
    ],
    parts: [
      { name: "Bal oldallap", qty: 1, mat: "{body}", w: "{depth}", h: 720, t: 18 },
      { name: "Jobb oldallap", qty: 1, mat: "{body}", w: "{depth}", h: 720, t: 18 },
      { name: "Alsó lap", qty: 1, mat: "{body}", w: "{width} - 36", h: "{depth}", t: 18 },
      { name: "Front", qty: "{drawers}", mat: "{front}", w: "{width} - 4", h: 230, t: 19 },
    ],
    constraints: [
      { rule: "min 1 fiók", expr: "{drawers} >= 1" },
    ],
  },
  {
    id: "T-03", name: "Belső ajtó — bélelt", type: "Ajtó",
    author: "Nagy J.", version: "1.0", rating: 4.5, uses: 76, updated: "2026-04-10", thumb: "door",
    note: "Bélelt belső ajtó, tölgy vagy bükk furnérral.",
    vars: [
      { key: "width", label: "Szélesség", unit: "mm", min: 600, max: 1000, step: 50, default: 800, kind: "raster" },
      { key: "height", label: "Magasság", unit: "mm", min: 1900, max: 2200, step: 1, default: 2050, kind: "analog" },
      { key: "body", label: "Anyag", kind: "material", default: "TL-040", options: ["TL-040", "BK-040"] },
    ],
    parts: [
      { name: "Ajtólap", qty: 1, mat: "{body}", w: "{width}", h: "{height}", t: 40 },
      { name: "Tok bal", qty: 1, mat: "{body}", w: 80, h: "{height}", t: 30 },
      { name: "Tok jobb", qty: 1, mat: "{body}", w: 80, h: "{height}", t: 30 },
      { name: "Tok felső", qty: 1, mat: "{body}", w: "{width}", h: 80, t: 30 },
    ],
    constraints: [],
  },
]

export const CATALOG_LOOKUP: Record<string, CatalogLookupEntry> = {
  "EG-3303-18": { name: "Egger 3303 ST10 18mm", t: 18, kind: "korpusz", color: "#dcc4a3" },
  "EG-1133-18": { name: "Egger 1133 ST10 18mm", t: 18, kind: "korpusz", color: "#a18166" },
  "EG-3327-18": { name: "Egger 3327 ST22 18mm", t: 18, kind: "korpusz", color: "#3d3631" },
  "EG-3327-19": { name: "Egger 3327 ST22 19mm", t: 19, kind: "front", color: "#3d3631" },
  "EG-3303-19": { name: "Egger 3303 ST10 19mm", t: 19, kind: "front", color: "#dcc4a3" },
  "MDF-019": { name: "MDF 19mm", t: 19, kind: "korpusz", color: "#c8b8a0" },
  "HDF-003": { name: "HDF 3mm fehér", t: 3, kind: "hátlap", color: "#f0ebe1" },
  "MDF-006": { name: "MDF 6mm", t: 6, kind: "hátlap", color: "#c8b8a0" },
  "TL-040": { name: "Tölgy 40mm", t: 40, kind: "tömör", color: "#b08560" },
  "BK-040": { name: "Bükk 40mm", t: 40, kind: "tömör", color: "#d6b596" },
}

export const QUOTES: Quote[] = [
  { id: "Q-2426-058", customer: "Bognár Bútor Kft.", date: "2026-04-26", expires: "2026-05-10", value: 4_280_000, status: "sent", items: 18, owner: "Szabó A." },
  { id: "Q-2426-057", customer: "Várdai Konyhastúdió", date: "2026-04-25", expires: "2026-05-09", value: 1_950_000, status: "draft", items: 7, owner: "Szabó A." },
  { id: "Q-2426-056", customer: "Doorstar Hungary Zrt.", date: "2026-04-24", expires: "2026-05-08", value: 12_400_000, status: "approved", items: 42, owner: "Kovács P." },
  { id: "Q-2426-055", customer: "Pesti Ablakműhely", date: "2026-04-22", expires: "2026-05-06", value: 680_000, status: "sent", items: 4, owner: "Szabó A." },
  { id: "Q-2426-054", customer: "Hegyi Lakberendezés", date: "2026-04-21", expires: "2026-05-05", value: 2_140_000, status: "approved", items: 11, owner: "Kovács P." },
  { id: "Q-2426-053", customer: "Tóth Konyha & Társa", date: "2026-04-19", expires: "2026-05-03", value: 1_220_000, status: "rejected", items: 5, owner: "Szabó A." },
  { id: "Q-2426-052", customer: "Vella Interior Design", date: "2026-04-18", expires: "2026-05-02", value: 3_810_000, status: "expired", items: 14, owner: "Kovács P." },
]

export const QUOTE_TONE: Record<QuoteStatus, QuoteTone> = {
  draft: { bg: "bg-stone-100", fg: "text-stone-700", dot: "bg-stone-400", label: "Vázlat" },
  sent: { bg: "bg-sky-50", fg: "text-sky-700", dot: "bg-sky-500", label: "Kiküldve" },
  approved: { bg: "bg-emerald-50", fg: "text-emerald-700", dot: "bg-emerald-500", label: "Elfogadva" },
  rejected: { bg: "bg-rose-50", fg: "text-rose-700", dot: "bg-rose-500", label: "Elutasítva" },
  expired: { bg: "bg-amber-50", fg: "text-amber-700", dot: "bg-amber-500", label: "Lejárt" },
}

export const CUSTOMERS: Customer[] = [
  { id: "C-001", name: "Bognár Bútor Kft.", city: "Pécs", contact: "Bognár István", email: "bognar@bognarbutor.hu", phone: "+36 72 412 333", openOrders: 2, ltv: 18_400_000, since: "2022" },
  { id: "C-002", name: "Várdai Konyhastúdió", city: "Debrecen", contact: "Várdai Eszter", email: "evardai@vardakonyha.hu", phone: "+36 52 234 124", openOrders: 1, ltv: 9_200_000, since: "2023" },
  { id: "C-003", name: "Doorstar Hungary Zrt.", city: "Vác", contact: "Kis Zoltán", email: "kis.z@doorstar.hu", phone: "+36 27 123 456", openOrders: 4, ltv: 84_000_000, since: "2019" },
  { id: "C-004", name: "Pesti Ablakműhely", city: "Budapest", contact: "Pesti Tamás", email: "info@pestiablak.hu", phone: "+36 1 422 100", openOrders: 1, ltv: 2_400_000, since: "2024" },
  { id: "C-005", name: "Hegyi Lakberendezés", city: "Sopron", contact: "Hegyi Krisztina", email: "hegyi.k@hegyilakk.hu", phone: "+36 99 312 444", openOrders: 1, ltv: 6_120_000, since: "2023" },
  { id: "C-006", name: "Vella Interior Design", city: "Budapest", contact: "Vella Andrea", email: "andrea@vellainterior.hu", phone: "+36 1 567 890", openOrders: 0, ltv: 12_700_000, since: "2022" },
  { id: "C-007", name: "Tóth Konyha & Társa", city: "Szeged", contact: "Tóth Béla", email: "info@tothkonyha.hu", phone: "+36 62 555 333", openOrders: 0, ltv: 3_800_000, since: "2024" },
]

export const SHOPFLOOR_MACHINES: Machine[] = [
  { id: "M-HOLZMA-01", name: "Holzma HPP380", kind: "Szabászat", facility: "Vác — főüzem", operator: "Nagy J.", state: "running" },
  { id: "M-BIESSE-01", name: "Biesse Selco", kind: "Szabászat", facility: "Vác — főüzem", operator: "Tóth K.", state: "running" },
  { id: "M-HOMAG-01", name: "Homag KAL 310", kind: "Élzárás", facility: "Vác — főüzem", operator: "Kiss A.", state: "idle" },
  { id: "M-BIESSE-02", name: "Biesse Rover", kind: "CNC", facility: "Vác — főüzem", operator: "—", state: "idle" },
  { id: "M-HOLZMA-02", name: "Holzma CNC", kind: "CNC", facility: "Sopron telephely", operator: "Horváth É.", state: "running" },
]

export const SHOPFLOOR_QUEUE: Record<string, ShopFloorTask[]> = {
  "M-HOLZMA-01": [
    { id: "CP-184-A", kind: "cutting", order: "JT-2426-0184", customer: "Bognár Bútor Kft.", material: "Bükk 18mm", sheets: 8, currentSheet: 3, util: 87, runtime: 24, parts: [
      { name: "Oldallap", w: 800, h: 560, qty: 2 },
      { name: "Fiókfront", w: 600, h: 140, qty: 4 },
      { name: "Polc", w: 590, h: 560, qty: 8 },
    ]},
    { id: "CP-184-B", kind: "cutting", order: "JT-2426-0184", customer: "Bognár Bútor Kft.", material: "Tölgy 22mm", sheets: 4, currentSheet: 0, util: 79, runtime: 0, parts: [
      { name: "Felső lap", w: 1200, h: 380, qty: 4 },
      { name: "Alsó lap", w: 1200, h: 380, qty: 4 },
    ]},
  ],
  "M-BIESSE-01": [
    { id: "CP-182-A", kind: "cutting", order: "JT-2426-0182", customer: "Doorstar Hungary Zrt.", material: "Tölgy 40mm", sheets: 22, currentSheet: 14, util: 84, runtime: 86, parts: [
      { name: "Ajtólap", w: 800, h: 2050, qty: 8 },
      { name: "Tok", w: 80, h: 2080, qty: 16 },
    ]},
  ],
  "M-HOMAG-01": [
    { id: "EB-184-1", kind: "edgeband", order: "JT-2426-0184", customer: "Bognár Bútor Kft.", sheets: 1, currentSheet: 0, runtime: 0, parts: 14, edge: "ABS 2mm tölgy színazonos" },
  ],
  "M-BIESSE-02": [
    { id: "CN-184-1", kind: "cnc", order: "JT-2426-0184", customer: "Bognár Bútor Kft.", sheets: 1, currentSheet: 0, runtime: 0, parts: 24, program: "DRILL_CABINET_v2.cnc" },
  ],
  "M-HOLZMA-02": [
    { id: "CN-182-1", kind: "cnc", order: "JT-2426-0182", customer: "Doorstar Hungary Zrt.", sheets: 1, currentSheet: 0, runtime: 14, parts: 32, program: "DOOR_HINGE_M3.cnc" },
  ],
}

export const SHOPFLOOR_OPERATORS: ShopFloorOperator[] = [
  { name: "Nagy János", pin: "1234", initials: "NJ", machines: ["M-HOLZMA-01"] },
  { name: "Tóth Kinga", pin: "2345", initials: "TK", machines: ["M-BIESSE-01", "M-HOMAG-01"] },
  { name: "Kiss András", pin: "3456", initials: "KA", machines: ["M-HOMAG-01", "M-BIESSE-02"] },
  { name: "Horváth Éva", pin: "4567", initials: "HE", machines: ["M-HOLZMA-02"] },
]
