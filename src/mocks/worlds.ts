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
  crm: {
    key: "crm", hu: "CRM", en: "CRM",
    sub: "Lead pipeline, lehetőségek, ügyféljárás",
    icon: "briefcase", accent: "indigo",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "pipeline", hu: "Pipeline", en: "Pipeline" },
      { key: "leads", hu: "Leadek", en: "Leads" },
      { key: "opps", hu: "Lehetőségek", en: "Opportunities" },
      { key: "forecast", hu: "Forecast", en: "Forecast" },
    ],
    badge: "4 nyitott",
  },
  finance: {
    key: "finance", hu: "Pénzügy", en: "Finance",
    sub: "Számlák, kifizetések, kintlévőségek",
    icon: "receipt", accent: "emerald",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "outgoing", hu: "Kimenő számlák", en: "Outgoing" },
      { key: "incoming", hu: "Bejövő számlák", en: "Incoming" },
      { key: "payments", hu: "Kifizetések", en: "Payments" },
    ],
    badge: "3 lejárt",
  },
  projects: {
    key: "projects", hu: "Projektek", en: "Projects",
    sub: "Bútor projektek, szakág-koordináció, beépítési ütemezés",
    icon: "folder", accent: "violet",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "list", hu: "Projektlista", en: "Projects" },
      { key: "kanban", hu: "Kanban", en: "Kanban" },
    ],
    badge: "2 aktív",
  },
  logistics: {
    key: "logistics", hu: "Logisztika", en: "Logistics",
    sub: "Kiszállítások, telepítések, felmérések, beszállítások",
    icon: "truck", accent: "cyan",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "outgoing", hu: "Kiszállítások", en: "Outgoing" },
      { key: "incoming", hu: "Beszállítások", en: "Incoming" },
    ],
    badge: "2 úton",
  },
  mfgprep: {
    key: "mfgprep", hu: "Gyártás-előkészítés", en: "Mfg Prep",
    sub: "Release queue, munkalapok, gyártási jóváhagyás",
    icon: "clipboard", accent: "orange",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "queue", hu: "Release queue", en: "Queue" },
      { key: "datasheets", hu: "Munkalapok", en: "Datasheets" },
    ],
    badge: "2 függő",
  },
  supervisor: {
    key: "supervisor", hu: "Műszakvezető", en: "Supervisor",
    sub: "Élő műhely-monitor, napi terv vs. tény, blokkolók",
    icon: "eye", accent: "rose",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "floor", hu: "Műhely-floor", en: "Floor" },
      { key: "dayplan", hu: "Napi terv", en: "Day Plan" },
    ],
    badge: "1 blokkolt",
  },
  masterdata: {
    key: "masterdata", hu: "Törzsadatok", en: "Master Data",
    sub: "Termékek, anyagok, szállítók nyilvántartása",
    icon: "database", accent: "stone",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "products", hu: "Termékek", en: "Products" },
      { key: "materials", hu: "Anyagok", en: "Materials" },
      { key: "suppliers", hu: "Szállítók", en: "Suppliers" },
      { key: "templates", hu: "Sablonok", en: "Templates" },
    ],
    badge: "8 termék",
  },
  trade: {
    key: "trade", hu: "Kereskedelem", en: "Trade",
    sub: "Árajánlatok, megrendelések, partnerek",
    icon: "briefcase", accent: "teal",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "quotes", hu: "Árajánlatok", en: "Quotes" },
      { key: "pos", hu: "Megrendelések", en: "POs" },
      { key: "partners", hu: "Partnerek", en: "Partners" },
    ],
    badge: "2 nyitott",
  },
  interior: {
    key: "interior", hu: "Belső tér", en: "Interior",
    sub: "Szoba-konfigurációk, bútor elrendezés",
    icon: "home", accent: "violet",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "rooms", hu: "Szobák", en: "Rooms" },
      { key: "furniture", hu: "Bútor kártyák", en: "Furniture" },
    ],
    badge: "4 szoba",
  },
  maintenance: {
    key: "maintenance", hu: "Karbantartás", en: "Maintenance",
    sub: "Gépek, karbantartási jegyek, ütemezés",
    icon: "wrench", accent: "amber",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "assets", hu: "Eszközök" },
      { key: "tickets", hu: "Jegyek" },
      { key: "schedule", hu: "Ütemterv" },
    ],
    badge: "2 jegy",
  },
  quality: {
    key: "quality", hu: "Minőség", en: "Quality",
    sub: "NCR-ek, ellenőrzőlisták, auditok",
    icon: "check", accent: "emerald",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "ncr", hu: "NCR-ek" },
      { key: "templates", hu: "Sablonok" },
      { key: "audits", hu: "Auditok" },
    ],
    badge: "3 nyitott",
  },
  ehs: {
    key: "ehs", hu: "EHS", en: "EHS",
    sub: "Munkavédelem, balesetek, kockázatok",
    icon: "shield", accent: "rose",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "incidents", hu: "Események" },
      { key: "risks", hu: "Kockázatok" },
      { key: "actions", hu: "Intézkedések" },
    ],
    badge: "1 nyitott",
  },
  attendance: {
    key: "attendance", hu: "Jelenlét", en: "Attendance",
    sub: "Be/kilépések, műszakok, kivételek",
    icon: "calendar", accent: "sky",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "today", hu: "Mai műszak" },
      { key: "history", hu: "Előzmények" },
      { key: "exceptions", hu: "Kivételek" },
    ],
    badge: "1 késő",
  },
  tasks: {
    key: "tasks", hu: "Feladataim", en: "Tasks",
    sub: "Személyes és kereszt-világ feladatkezelés",
    icon: "clipboard", accent: "violet",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "mytasks", hu: "Saját feladatok" },
      { key: "kanban", hu: "Kanban tábla" },
    ],
    badge: "2 lejárt",
  },
  docs: {
    key: "docs", hu: "Dokumentumtár", en: "Docs",
    sub: "Verziózott dokumentumok, rajzok, szerződések",
    icon: "file", accent: "amber",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "files", hu: "Dokumentumok" },
    ],
    badge: "2 ellenőrzés",
  },
  ai: {
    key: "ai", hu: "AI munkaterület", en: "AI",
    sub: "Ágensek, receptek, memória, chat",
    icon: "sparkle", accent: "purple",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "chat", hu: "Chat" },
      { key: "agents", hu: "Ágensek" },
      { key: "skills", hu: "Receptek" },
    ],
    badge: "1 aktív",
  },
  execbi: {
    key: "execbi", hu: "Vezetői BI", en: "ExecBI",
    sub: "Kereszt-világ KPI cockpit, trendek, elemzések",
    icon: "chart", accent: "indigo",
    screens: [
      { key: "dash", hu: "Áttekintés" },
    ],
    badge: "BI",
  },
  shop: {
    key: 'shop', hu: 'Bolt', en: 'Shop',
    sub: 'B2B termékrendelés és kosárkezelés',
    icon: 'storefront', accent: 'emerald',
    badge: '3 nyitott',
    screens: [
      { key: 'dash', hu: 'Áttekintés' },
      { key: 'catalog', hu: 'Katalógus' },
      { key: 'cart', hu: 'Kosár' },
      { key: 'orders', hu: 'Rendelések' },
    ],
  },
  hr: {
    key: 'hr', hu: 'HR', en: 'HR',
    sub: 'Munkaerő-kapacitás, jelenlét, távollétek',
    icon: 'user', accent: 'amber',
    badge: '1 kérelem',
    screens: [
      { key: 'dash', hu: 'Áttekintés' },
      { key: 'people', hu: 'Dolgozók' },
      { key: 'capacity', hu: 'Kapacitás-naptár' },
      { key: 'absences', hu: 'Távollétek' },
    ],
  },
  kontrolling: {
    key: 'kontrolling', hu: 'Kontrolling', en: 'Controlling',
    sub: 'Projekt-jövedelmezőség, terv vs. tény',
    icon: 'analytics', accent: 'slate',
    badge: '4 projekt',
    screens: [
      { key: 'dash', hu: 'Áttekintés' },
      { key: 'projects', hu: 'Projekt-fedezet' },
    ],
  },
  service: {
    key: 'service', hu: 'Szerviz', en: 'Service',
    sub: 'Reklamáció, garancia, szerviz látogatások',
    icon: 'wrench', accent: 'orange',
    badge: '3 nyitott',
    screens: [
      { key: 'dash', hu: 'Áttekintés' },
      { key: 'tickets', hu: 'Jegyek' },
      { key: 'warranties', hu: 'Garanciák' },
      { key: 'visits', hu: 'Látogatások' },
    ],
  },
}

export const WORLD_ORDER: WorldKey[] = ["production", "sales", "design", "warehouse", "shopfloor", "crm", "finance", "projects", "logistics", "mfgprep", "supervisor", "masterdata", "trade", "interior", "maintenance", "quality", "ehs", "attendance", "hr", "kontrolling", "service", "tasks", "docs", "ai", "execbi", "shop", "settings"]

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

// ── CRM mock adatok ────────────────────────────────────────────────────────────
export type LeadStatus = 'uj' | 'kapcsolat' | 'minosites' | 'nurturing' | 'konvertalva' | 'elvetve'
export type OppStatus = 'nyitott' | 'igenyfelmeres' | 'osszeallitas' | 'ajanlat' | 'targyalas' | 'megnyert' | 'elveszett'
export type CrmSource = 'telefon' | 'ajanlas' | 'email' | 'kiallitas' | 'weboldal' | 'webshop' | 'belsoepitesz'
export type TaskPriority = 'magas' | 'kozepes' | 'alacsony'

export interface CrmActivity { at: string; kind: string; who: string; text: string }
export interface Lead {
  id: string; status: LeadStatus; source: CrmSource; owner: string
  company: string; contact: string; email: string; phone: string; city: string
  title: string; interest: string; estValue: number; createdAt: string
  activities: CrmActivity[]; referredBy?: string; oppId?: string; lostReason?: string
}
export interface Opportunity {
  id: string; status: OppStatus; owner: string; customer: string; contact: string
  phone: string; city: string; title: string; value: number; source: CrmSource
  fromLead: string | null; expectedClose: string; isNewCustomer: boolean; createdAt: string
  activities: CrmActivity[]; quoteId?: string; wonAt?: string; lostReason?: string; lostAt?: string
}
export interface CrmTask {
  id: string; refType: 'lead' | 'opp'; refId: string; title: string
  priority: TaskPriority; due: string; done: boolean; owner: string
}

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; pill: string; dot: string }> = {
  uj:          { label: "Új",                pill: "bg-stone-100 text-stone-700 border-stone-200",      dot: "bg-stone-400" },
  kapcsolat:   { label: "Kapcsolatfelvétel", pill: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
  minosites:   { label: "Minősítés",         pill: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500" },
  nurturing:   { label: "Nurturing",         pill: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  konvertalva: { label: "Konvertálva",       pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  elvetve:     { label: "Elvetve",           pill: "bg-stone-200 text-stone-500 border-stone-300",      dot: "bg-stone-400" },
}

export const OPP_STATUS_META: Record<OppStatus, { label: string; pill: string; dot: string; prob: number }> = {
  nyitott:       { label: "Nyitott",             pill: "bg-stone-100 text-stone-700 border-stone-200",      dot: "bg-stone-400",   prob: 0.10 },
  igenyfelmeres: { label: "Igényfelmérés",       pill: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500",     prob: 0.25 },
  osszeallitas:  { label: "Összeállítás alatt",  pill: "bg-cyan-50 text-cyan-700 border-cyan-200",          dot: "bg-cyan-500",    prob: 0.40 },
  ajanlat:       { label: "Ajánlat kiküldve",    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500",  prob: 0.55 },
  targyalas:     { label: "Tárgyalás",           pill: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   prob: 0.80 },
  megnyert:      { label: "Megnyert",            pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", prob: 1.0 },
  elveszett:     { label: "Elveszett",           pill: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500",    prob: 0 },
}

export const CRM_SOURCE_META: Record<CrmSource, { label: string; pill: string }> = {
  telefon:      { label: "Telefon",              pill: "bg-sky-50 text-sky-700 border-sky-200" },
  ajanlas:      { label: "Ajánlás",              pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  email:        { label: "Email",                pill: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  kiallitas:    { label: "Kiállítás",            pill: "bg-amber-50 text-amber-700 border-amber-200" },
  weboldal:     { label: "Weboldal",             pill: "bg-blue-50 text-blue-700 border-blue-200" },
  webshop:      { label: "Webshop",              pill: "bg-teal-50 text-teal-700 border-teal-200" },
  belsoepitesz: { label: "Belsőépítész",         pill: "bg-rose-50 text-rose-700 border-rose-200" },
}

export const LEADS: Lead[] = [
  { id: "LEAD-2426-001", status: "uj", source: "webshop", owner: "Szabó A.",
    company: "", contact: "Kele Márton", email: "kele.marton@gmail.com", phone: "+36 30 244 5512", city: "Budapest",
    title: "Konyhabútor felújítás (~3,2 fm)", interest: "L-alakú konyha, tölgy front, beépített gépekkel.",
    estValue: 2_400_000, createdAt: "2026-04-27",
    activities: [{ at: "2026-04-27 09:14", kind: "megjegyzes", who: "Rendszer", text: "Webshop érdeklődésből automatikusan létrehozva." }] },
  { id: "LEAD-2426-002", status: "kapcsolat", source: "kiallitas", owner: "Kovács P.",
    company: "Novitech Mérnökiroda Kft.", contact: "Halmi Gábor", email: "halmi@novitech.hu", phone: "+36 1 388 2210", city: "Budapest",
    title: "Iroda berendezés — 40 munkaállomás", interest: "Új irodaszint teljes bútorozása, asztalok + tárolók + tárgyaló.",
    estValue: 11_500_000, createdAt: "2026-04-22",
    activities: [
      { at: "2026-04-22 15:40", kind: "talalkozo", who: "Kovács P.", text: "Construma kiállításon felvett kapcsolat." },
      { at: "2026-04-24 10:05", kind: "email", who: "Kovács P.", text: "Bemutatkozó anyag + referenciák kiküldve." }] },
  { id: "LEAD-2426-003", status: "minosites", source: "ajanlas", owner: "Szabó A.",
    company: "Bistro Central", contact: "Reményi Dóra", email: "remenyi@bistrocentral.hu", phone: "+36 70 119 4420", city: "Budapest",
    title: "Étterem beépített bútorzat + pult", interest: "Vendégtér bútor + bárpult + kiszolgáló. Belváros Café ajánlására.",
    estValue: 5_800_000, createdAt: "2026-04-18", referredBy: "Belváros Café",
    activities: [
      { at: "2026-04-18 11:00", kind: "hivas", who: "Szabó A.", text: "Bejövő hívás — Belváros Café ajánlására." },
      { at: "2026-04-20 14:20", kind: "talalkozo", who: "Szabó A.", text: "Helyszíni egyeztetés, igények felmérve." }] },
  { id: "LEAD-2426-004", status: "nurturing", source: "telefon", owner: "Szabó A.",
    company: "", contact: "Dr. Halász Péter", email: "halasz.p@protonmail.com", phone: "+36 20 556 7781", city: "Balatonfüred",
    title: "Nyaraló konyha + gardrób", interest: "Felújítás ősszel indul, addig tájékozódik.",
    estValue: 4_200_000, createdAt: "2026-03-30",
    activities: [
      { at: "2026-03-30 16:10", kind: "hivas", who: "Szabó A.", text: "Érdeklődő hívás, projekt csak szeptemberben indul." },
      { at: "2026-04-15 09:30", kind: "email", who: "Szabó A.", text: "Katalógus + anyagminta-info kiküldve." }] },
  { id: "LEAD-2426-005", status: "elvetve", source: "email", owner: "Kovács P.",
    company: "", contact: "Tarr Niké", email: "nike.tarr@gmail.com", phone: "+36 30 901 2244", city: "Szeged",
    title: "Olcsó polcrendszer garázsba", interest: "Tömeggyártott, alacsony árfekvésű megoldást keres.",
    estValue: 180_000, createdAt: "2026-04-12", lostReason: "Nem a profilunk — tömegtermék.",
    activities: [
      { at: "2026-04-12 08:50", kind: "email", who: "Kovács P.", text: "Beérkező megkeresés." },
      { at: "2026-04-13 10:00", kind: "megjegyzes", who: "Kovács P.", text: "Elvetve — nem illik a profilunkba." }] },
  { id: "LEAD-2426-006", status: "konvertalva", source: "belsoepitesz", owner: "Kovács P.",
    company: "Vella Interior Design", contact: "Vella Andrea", email: "andrea@vellainterior.hu", phone: "+36 1 567 890", city: "Budapest",
    title: "Penthouse konyha + nappali bútor", interest: "Belsőépítész partner közvetítésével, igényes egyedi konyha.",
    estValue: 6_500_000, createdAt: "2026-04-10", referredBy: "Lakberendezés Plusz", oppId: "OPP-2426-001",
    activities: [
      { at: "2026-04-10 13:00", kind: "email", who: "Kovács P.", text: "Partner megkeresés + tervrajz." },
      { at: "2026-04-14 11:30", kind: "talalkozo", who: "Kovács P.", text: "Minősítve — lehetőséggé konvertálva." }] },
]

export const OPPS: Opportunity[] = [
  { id: "OPP-2426-001", status: "nyitott", owner: "Kovács P.",
    customer: "Vella Interior Design", contact: "Vella Andrea", phone: "+36 1 567 890", city: "Budapest",
    title: "Penthouse konyha + nappali bútor", value: 6_500_000,
    source: "belsoepitesz", fromLead: "LEAD-2426-006", expectedClose: "2026-06-15", isNewCustomer: false, createdAt: "2026-04-14",
    activities: [{ at: "2026-04-14 11:35", kind: "megjegyzes", who: "Kovács P.", text: "Lehetőség létrehozva LEAD-2426-006-ból." }] },
  { id: "OPP-2426-002", status: "igenyfelmeres", owner: "Kovács P.",
    customer: "Doorstar Hungary Zrt.", contact: "Kis Zoltán", phone: "+36 27 123 456", city: "Vác",
    title: "Belső ajtó sorozat — 2. ütem (120 db)", value: 14_200_000,
    source: "ajanlas", fromLead: null, expectedClose: "2026-05-30", isNewCustomer: false, createdAt: "2026-04-16",
    activities: [
      { at: "2026-04-16 09:00", kind: "hivas", who: "Kovács P.", text: "Meglévő ügyfél jelezte a 2. ütem igényét." },
      { at: "2026-04-23 14:00", kind: "talalkozo", who: "Kovács P.", text: "Műszaki egyeztetés, mennyiségek pontosítva." }] },
  { id: "OPP-2426-003", status: "ajanlat", owner: "Szabó A.",
    customer: "Várdai Konyhastúdió", contact: "Várdai Eszter", phone: "+36 52 234 124", city: "Debrecen",
    title: "Bemutatóterem bővítés — kiállító konyhák", value: 3_200_000,
    source: "ajanlas", fromLead: null, expectedClose: "2026-05-12", isNewCustomer: false, createdAt: "2026-04-12", quoteId: "Q-2426-057",
    activities: [
      { at: "2026-04-12 10:00", kind: "email", who: "Szabó A.", text: "Igény beérkezett, paraméterek tisztázva." },
      { at: "2026-04-25 16:30", kind: "email", who: "Szabó A.", text: "Ajánlat (Q-2426-057) kiküldve." }] },
  { id: "OPP-2426-004", status: "targyalas", owner: "Kovács P.",
    customer: "Hegyi Lakberendezés", contact: "Hegyi Krisztina", phone: "+36 99 312 444", city: "Sopron",
    title: "Nappali fal + médiabútor", value: 2_400_000,
    source: "weboldal", fromLead: null, expectedClose: "2026-05-08", isNewCustomer: false, createdAt: "2026-04-08", quoteId: "Q-2426-054",
    activities: [
      { at: "2026-04-21 11:00", kind: "email", who: "Kovács P.", text: "Ajánlat (Q-2426-054) kiküldve." },
      { at: "2026-04-26 15:00", kind: "hivas", who: "Kovács P.", text: "Ügyfél kedvezményt kér, tárgyalás folyamatban." }] },
  { id: "OPP-2426-005", status: "megnyert", owner: "Szabó A.",
    customer: "Bognár Bútor Kft.", contact: "Bognár István", phone: "+36 72 412 333", city: "Pécs",
    title: "Sorozat-gyártás keretszerződés (Q2)", value: 8_800_000,
    source: "telefon", fromLead: null, expectedClose: "2026-04-26", isNewCustomer: false, createdAt: "2026-03-28", quoteId: "Q-2426-058", wonAt: "2026-04-26",
    activities: [{ at: "2026-04-26 12:00", kind: "megjegyzes", who: "Szabó A.", text: "Megnyert — keretszerződés aláírva." }] },
  { id: "OPP-2426-006", status: "elveszett", owner: "Szabó A.",
    customer: "Pesti Ablakműhely", contact: "Pesti Tamás", phone: "+36 1 422 100", city: "Budapest",
    title: "Raktári tárolók (selejtes ütem)", value: 1_100_000,
    source: "weboldal", fromLead: null, expectedClose: "2026-04-20", isNewCustomer: false, createdAt: "2026-03-25", lostReason: "Árban alulmaradtunk.", lostAt: "2026-04-20",
    activities: [{ at: "2026-04-20 09:00", kind: "megjegyzes", who: "Szabó A.", text: "Elveszett — ár-alapú döntés." }] },
]

export const CRM_TASKS: CrmTask[] = [
  { id: "CRMT-001", refType: "opp",  refId: "OPP-2426-002", title: "Helyszíni felmérés időpont egyeztetése", priority: "magas",    due: "2026-04-29", done: false, owner: "Kovács P." },
  { id: "CRMT-002", refType: "lead", refId: "LEAD-2426-002", title: "Visszahívás az iroda-projekt ajánlatáról", priority: "magas",  due: "2026-04-26", done: false, owner: "Kovács P." },
  { id: "CRMT-003", refType: "opp",  refId: "OPP-2426-004", title: "Kedvezményes szerződés-tervezet küldése",   priority: "magas",  due: "2026-04-28", done: false, owner: "Kovács P." },
  { id: "CRMT-004", refType: "lead", refId: "LEAD-2426-004", title: "Őszi újrakapcsolat — emlékeztető",          priority: "alacsony", due: "2026-09-01", done: false, owner: "Szabó A." },
  { id: "CRMT-005", refType: "opp",  refId: "OPP-2426-003", title: "Ajánlat-utánkövetés (Várdai)",              priority: "kozepes", due: "2026-05-02", done: false, owner: "Szabó A." },
  { id: "CRMT-006", refType: "lead", refId: "LEAD-2426-003", title: "Étterem — anyagminták bemutatása",          priority: "kozepes", due: "2026-04-24", done: true,  owner: "Szabó A." },
]

// ── Finance mock adatok ────────────────────────────────────────────────────────
export type FinStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'void'
export type FinDir = 'out' | 'in'
export type FinKind = 'normal' | 'advance' | 'proforma'
export type PayMethod = 'bank' | 'cash' | 'card'

export interface FinInvoiceLine { name: string; qty: number; unit: string; unitPrice: number; vat: number }
export interface FinInvoice {
  id: string; dir: FinDir; kind: FinKind; party: string; orderRef: string
  status: FinStatus; issueDate: string; dueDate: string; currency: string
  issuer: string; lines: FinInvoiceLine[]; note?: string; fxRate?: number
  extNo?: string; submittedVia?: string; submittedAt?: string; voidReason?: string
}
export interface FinPayment {
  id: string; invoiceId: string; amount: number; method: PayMethod
  date: string; ref: string; who: string; note?: string
}

export const FIN_INV_TONE: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  draft:   { bg: "bg-stone-100",   fg: "text-stone-600",   dot: "bg-stone-400",   label: "Piszkozat" },
  issued:  { bg: "bg-sky-50",      fg: "text-sky-700",     dot: "bg-sky-500",     label: "Kiállítva" },
  partial: { bg: "bg-amber-50",    fg: "text-amber-700",   dot: "bg-amber-500",   label: "Részben fizetve" },
  paid:    { bg: "bg-emerald-50",  fg: "text-emerald-700", dot: "bg-emerald-500", label: "Fizetve" },
  overdue: { bg: "bg-rose-50",     fg: "text-rose-700",    dot: "bg-rose-500",    label: "Lejárt" },
  void:    { bg: "bg-stone-50",    fg: "text-stone-400",   dot: "bg-stone-300",   label: "Sztornó" },
}

export const FIN_KIND_META: Record<FinKind, { label: string; short: string; tone: string }> = {
  normal:   { label: "Számla",        short: "Számla",    tone: "bg-stone-100 text-stone-700" },
  advance:  { label: "Előleg-számla", short: "Előleg",    tone: "bg-violet-100 text-violet-700" },
  proforma: { label: "Díjbekérő",     short: "Díjbekérő", tone: "bg-teal-100 text-teal-700" },
}

export const FIN_PAY_METHOD: Record<PayMethod, { label: string; tone: string }> = {
  bank: { label: "Banki átutalás", tone: "bg-sky-50 text-sky-700" },
  cash: { label: "Készpénz",       tone: "bg-emerald-50 text-emerald-700" },
  card: { label: "Bankkártya",     tone: "bg-indigo-50 text-indigo-700" },
}

export const FIN_INVOICES_OUT: FinInvoice[] = [
  { id: "SZ-2426-0060", dir: "out", kind: "advance", party: "Nagy Anna", orderRef: "JT-2426-0184",
    status: "paid", issueDate: "2026-04-18", dueDate: "2026-04-25", currency: "HUF", issuer: "Szabó Anna",
    note: "Gyártási előleg (30%) — Petőfi u. 12. konyha + nappali.",
    lines: [{ name: "Gyártási előleg (30%) — Petőfi u. 12.", qty: 1, unit: "alk.", unitPrice: 810000, vat: 27 }] },
  { id: "SZ-2426-0061", dir: "out", kind: "normal", party: "Nagy Anna", orderRef: "JT-2426-0184",
    status: "issued", issueDate: "2026-04-16", dueDate: "2026-04-24", currency: "HUF", issuer: "Szabó Anna",
    note: "Gyártáskezdés — részszámla (40%).",
    lines: [{ name: "Gyártáskezdés — részszámla (40%) — Petőfi u. 12.", qty: 1, unit: "alk.", unitPrice: 1080000, vat: 27 }] },
  { id: "SZ-2426-0042", dir: "out", kind: "normal", party: "Bognár Bútor Kft.", orderRef: "JT-2426-0184",
    status: "issued", issueDate: "2026-04-20", dueDate: "2026-05-04", currency: "HUF", issuer: "Szabó Anna",
    lines: [
      { name: "Konyhabútor alsó sor (6 elem)", qty: 6, unit: "db", unitPrice: 185000, vat: 27 },
      { name: "Konyhabútor felső sor (8 elem)", qty: 8, unit: "db", unitPrice: 140000, vat: 27 },
      { name: "Szerelés, helyszíni beépítés", qty: 1, unit: "alk.", unitPrice: 320000, vat: 27 },
    ] },
  { id: "SZ-2426-0041", dir: "out", kind: "advance", party: "Doorstar Hungary Zrt.", orderRef: "JT-2426-0182",
    status: "issued", issueDate: "2026-04-15", dueDate: "2026-04-29", currency: "HUF", issuer: "Kovács Péter",
    note: "30% gyártási előleg a 12,4 M Ft-os ajtó-rendelésre.",
    lines: [{ name: "Gyártási előleg (30%) — JT-2426-0182", qty: 1, unit: "alk.", unitPrice: 2929134, vat: 27 }] },
  { id: "SZ-2426-0039", dir: "out", kind: "normal", party: "Hegyi Lakberendezés", orderRef: "JT-2426-0180",
    status: "issued", issueDate: "2026-04-09", dueDate: "2026-04-23", currency: "HUF", issuer: "Kovács Péter",
    lines: [{ name: "Gardrób szekrény-sor (egyedi)", qty: 1, unit: "alk.", unitPrice: 1685000, vat: 27 }] },
  { id: "SZ-2426-0038", dir: "out", kind: "normal", party: "Vella Interior Design", orderRef: "JT-2426-0178",
    status: "partial", issueDate: "2026-04-12", dueDate: "2026-04-26", currency: "HUF", issuer: "Szabó Anna",
    lines: [{ name: "Beépített nappali bútor", qty: 1, unit: "alk.", unitPrice: 3000000, vat: 27 }] },
  { id: "SZ-2426-0036", dir: "out", kind: "normal", party: "Tóth Konyha & Társa", orderRef: "JT-2426-0176",
    status: "paid", issueDate: "2026-04-05", dueDate: "2026-04-19", currency: "HUF", issuer: "Szabó Anna",
    lines: [
      { name: "Konyhabútor alsó elem (3 db)", qty: 3, unit: "db", unitPrice: 185000, vat: 27 },
      { name: "Hettich fiókcsúszó beépítés", qty: 1, unit: "alk.", unitPrice: 145000, vat: 27 },
    ] },
  { id: "SZ-2426-0043", dir: "out", kind: "normal", party: "Várdai Konyhastúdió", orderRef: "JT-2426-0183",
    status: "draft", issueDate: "2026-04-27", dueDate: "2026-05-11", currency: "HUF", issuer: "Szabó Anna",
    lines: [{ name: "Konyhastúdió bemutató bútor", qty: 1, unit: "alk.", unitPrice: 1535000, vat: 27 }] },
  { id: "SZ-2426-0035", dir: "out", kind: "normal", party: "Erdei Műbútor", orderRef: "JT-2426-0175",
    status: "void", issueDate: "2026-04-03", dueDate: "2026-04-17", currency: "HUF", issuer: "Kovács Péter",
    voidReason: "Hibás vevői adatok — új számla kiállítva.",
    lines: [{ name: "Egyedi műbútor", qty: 1, unit: "alk.", unitPrice: 598000, vat: 27 }] },
]

export const FIN_INVOICES_IN: FinInvoice[] = [
  { id: "SINV-2426-045", dir: "in", kind: "normal", party: "Falco Sopron Zrt.", orderRef: "PO-2426-094",
    extNo: "FA-26-2231", status: "draft", issueDate: "2026-04-26", dueDate: "2026-05-26", currency: "HUF",
    issuer: "Falco Sopron Zrt.", submittedVia: "supplier", submittedAt: "2026-04-26",
    lines: [{ name: "Tölgy 22mm bútorlap", qty: 20, unit: "tábla", unitPrice: 32100, vat: 27 }] },
  { id: "SINV-2426-044", dir: "in", kind: "normal", party: "Egger Faipari Kft.", orderRef: "PO-2426-091",
    extNo: "EG-2026-3391", status: "issued", issueDate: "2026-04-23", dueDate: "2026-05-23", currency: "HUF", issuer: "Tóth Kinga",
    lines: [{ name: "Tölgy 22mm tábla", qty: 30, unit: "tábla", unitPrice: 31800, vat: 27 }] },
  { id: "SINV-2426-041", dir: "in", kind: "normal", party: "Falco Sopron Zrt.", orderRef: "PO-2426-088",
    extNo: "FA-26-2204", status: "issued", issueDate: "2026-04-06", dueDate: "2026-04-20", currency: "HUF", issuer: "Nagy János",
    lines: [{ name: "Bükk 18mm tábla", qty: 40, unit: "tábla", unitPrice: 17900, vat: 27 }] },
  { id: "SINV-2426-040", dir: "in", kind: "normal", party: "Kronospan HU Zrt.", orderRef: "PO-2426-089",
    extNo: "KR-2026-1188", status: "paid", issueDate: "2026-04-04", dueDate: "2026-04-18", currency: "HUF", issuer: "Tóth Kinga",
    lines: [{ name: "MDF 19mm tábla", qty: 50, unit: "tábla", unitPrice: 9600, vat: 27 }] },
  { id: "SINV-2426-039", dir: "in", kind: "normal", party: "Hettich Hungary", orderRef: "PO-2426-086",
    extNo: "HE-2026-0912", status: "partial", issueDate: "2026-04-11", dueDate: "2026-05-11", currency: "HUF", issuer: "Tóth Kinga",
    lines: [{ name: "Hettich fiókcsúszó 500mm", qty: 120, unit: "db", unitPrice: 1180, vat: 27 }] },
]

export const FIN_PAYMENTS: FinPayment[] = [
  { id: "PMT-0009", invoiceId: "SZ-2426-0060", amount: 1028700, method: "card", date: "2026-04-19", ref: "ONLINE-7K2P", who: "Nagy Anna", note: "Online előleg-fizetés (portál)" },
  { id: "PMT-0008", invoiceId: "SZ-2426-0041", amount: 2929134, method: "bank", date: "2026-04-22", ref: "GIRO-9921", who: "Pénzügy", note: "Doorstar előleg — teljes" },
  { id: "PMT-0007", invoiceId: "SZ-2426-0038", amount: 1500000, method: "bank", date: "2026-04-20", ref: "GIRO-9874", who: "Pénzügy", note: "Vella — részfizetés 1/2" },
  { id: "PMT-0006", invoiceId: "SZ-2426-0036", amount: 889000,  method: "bank", date: "2026-04-17", ref: "GIRO-9810", who: "Pénzügy", note: "Tóth — teljes (1/1)" },
  { id: "PMT-0005", invoiceId: "SINV-2426-040", amount: 609600, method: "bank", date: "2026-04-16", ref: "UTAL-2261", who: "Pénzügy", note: "Kronospan — teljes" },
  { id: "PMT-0004", invoiceId: "SINV-2426-039", amount: 90000,  method: "bank", date: "2026-04-18", ref: "UTAL-2280", who: "Pénzügy", note: "Hettich — részfizetés" },
]
