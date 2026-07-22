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
      { key: "orders", hu: "Ajtórendelések", en: "Door orders" },
      { key: "quotes", hu: "Árajánlatok", en: "Quotes" },
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
    icon: "briefcase", accent: "blue",
    screens: [
      { key: "dash", hu: "Áttekintés", en: "Overview" },
      { key: "pipeline", hu: "Pipeline", en: "Pipeline" },
      { key: "leads", hu: "Leadek", en: "Leads" },
      { key: "opps", hu: "Lehetőségek", en: "Opportunities" },
      { key: "tasks", hu: "Feladatok", en: "Tasks" },
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
    sub: "Eszközök, munkalapok, megelőző karbantartás",
    icon: "wrench", accent: "cyan",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "assets", hu: "Eszközök" },
      { key: "workorders", hu: "Munkalapok" },
      { key: "schedule", hu: "Ütemterv" },
    ],
    badge: "5 nyitott",
  },
  quality: {
    key: "quality", hu: "Minőség", en: "Quality",
    sub: "Átvizsgálások, hibajegyek, minőség-trend",
    icon: "check", accent: "lime",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "inspections", hu: "Átvizsgálások" },
      { key: "tickets", hu: "Hibajegyek" },
      { key: "trend", hu: "Trend" },
    ],
    badge: "4 nyitott",
  },
  ehs: {
    key: "ehs", hu: "EHS", en: "EHS",
    sub: "Munkavédelem, balesetek, kockázatok",
    icon: "shield", accent: "red",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "incidents", hu: "Események" },
      { key: "risks", hu: "Kockázatok" },
      { key: "sds", hu: "Veszélyes anyagok" },
      { key: "ppe", hu: "EVE kiadások" },
      { key: "walks", hu: "Bejárások" },
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
    sub: "Verziózott dokumentumok, jóváhagyás-folyam, lejárat-figyelés",
    icon: "file", accent: "violet",
    screens: [
      { key: "dash", hu: "Áttekintés" },
      { key: "library", hu: "Könyvtár" },
      { key: "expiring", hu: "Lejáró / felülvizsgálat" },
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
      { key: 'capacity', hu: 'Kapacitás', en: 'Capacity' },
      { key: 'absences', hu: 'Távollét', en: 'Absence' },
      { key: 'skills', hu: 'Készségek', en: 'Skills' },
      { key: 'timelogs', hu: 'Munkaidő', en: 'Time log' },
    ],
  },
  kontrolling: {
    key: 'kontrolling', hu: 'Kontrolling', en: 'Controlling',
    sub: 'Projekt-jövedelmezőség, terv vs. tény',
    icon: 'analytics', accent: 'slate',
    badge: '6 projekt',
    screens: [
      { key: 'dash', hu: 'Áttekintés', en: 'Overview' },
      { key: 'portfolio', hu: 'Portfólió', en: 'Portfolio' },
      { key: 'projects', hu: 'Projekt-fedezet', en: 'Margin' },
      { key: 'variance', hu: 'Eltérés-elemzés', en: 'Variance' },
      { key: 'adjustments', hu: 'Utókalkuláció', en: 'Adjustments' },
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
