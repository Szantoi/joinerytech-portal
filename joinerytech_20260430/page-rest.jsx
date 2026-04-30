// Pages: Inventory, Procurement, Analytics, Settings
const { useState: useStateX } = React;

function InventoryPage({ t, initialTab }) {
  const [tab, setTab] = useStateX(initialTab || "materials");
  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5 w-fit mb-4">
        {[
          { k: "materials", label: "Anyagok", count: MATERIALS.length },
          { k: "offcuts",   label: t.inv.offcuts, count: 8 },
          { k: "movements", label: t.inv.movements, count: 24 },
        ].map(x => (
          <button key={x.k} onClick={() => setTab(x.k)}
            className={`px-3 h-8 rounded-md text-[12.5px] font-medium inline-flex items-center gap-1.5 ${tab === x.k ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
            {x.label}
            <span className={`text-[10px] tabular-nums ${tab === x.k ? "text-white/60" : "text-stone-400"}`}>{x.count}</span>
          </button>
        ))}
      </div>

      {tab === "materials" && (<>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: "Anyagok", value: MATERIALS.length, sub: "katalógusban" },
          { label: "Riasztások", value: MATERIALS.filter(m => m.trend !== "ok").length, sub: "alacsony / kritikus", tone: "text-amber-700" },
          { label: "Becsült érték", value: "8.4M Ft", sub: "raktáron" },
        ].map((x, i) => (
          <Card key={i} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{x.label}</div>
            <div className={`text-[24px] font-semibold mt-1 tabular-nums ${x.tone || "text-stone-900"}`}>{x.value}</div>
            <div className="text-[11.5px] text-stone-500">{x.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MATERIALS.map(m => {
          const pct = Math.min(100, (m.onHand / (m.min * 2)) * 100);
          const toneBar = m.trend === "critical" ? "bg-rose-500" : m.trend === "low" ? "bg-amber-500" : "bg-teal-600";
          return (
            <Card key={m.code} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-stone-900 truncate">{m.name}</div>
                  <div className="text-[10.5px] font-mono text-stone-400">{m.code}</div>
                </div>
                <StatusPill status={m.trend} label={t.status[m.trend]} />
              </div>
              <div className="aspect-[4/2] bg-stone-100 rounded-lg mb-3 grid place-items-center text-stone-400 text-[10px]" style={{ background: "repeating-linear-gradient(45deg,#f5f5f4,#f5f5f4 6px,#e7e5e4 6px,#e7e5e4 7px)" }}>
                <span className="font-mono">{m.unit}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-semibold tabular-nums text-stone-900">{fmtNum(m.onHand)}</span>
                <span className="text-[11px] text-stone-500">{m.unit} {t.inv.onHand}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${toneBar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10.5px] text-stone-500 tabular-nums">{t.inv.reorder} {m.min}</span>
              </div>
              <div className="mt-2 text-[11px] text-stone-500 tabular-nums">{fmtHUF(m.price)} / {m.unit}</div>
            </Card>
          );
        })}
      </div>
      </>)}

      {tab === "offcuts" && <OffcutsPanel />}

      {tab === "movements" && (
        <Card className="p-0">
          <div className="grid grid-cols-[110px_140px_minmax(0,1fr)_100px_120px_120px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-200/80 bg-stone-50/40">
            <div>Dátum</div><div>Típus</div><div>Anyag</div><div className="text-right">Mennyiség</div><div>Forrás / Cél</div><div>Felelős</div>
          </div>
          {[
            { date: "2026-04-27 14:32", type: "Kivét",  src: "CP-184-A",  who: "Nagy J.",   mat: "Bükk 18mm 2440×1830",  qty: -8, unit: "tábla" },
            { date: "2026-04-27 09:15", type: "Bevét",  src: "PO-2426-088", who: "Raktár",    mat: "MDF 19mm 2440×1830",   qty: +50, unit: "tábla" },
            { date: "2026-04-26 16:48", type: "Maradék",src: "CP-184-A",  who: "Nagy J.",   mat: "Bükk 18mm 1200×380 ",  qty: +1, unit: "darab" },
            { date: "2026-04-26 11:02", type: "Kivét",  src: "CP-182-A",  who: "Tóth K.",   mat: "Tölgy 40mm 2440×1830", qty: -22, unit: "tábla" },
            { date: "2026-04-25 13:20", type: "Bevét",  src: "PO-2426-091", who: "Raktár",    mat: "Tölgy 22mm 2440×1830", qty: +30, unit: "tábla" },
            { date: "2026-04-25 08:55", type: "Korr.",  src: "Leltár",    who: "Szabó A.",  mat: "Csavar Spax 4×40",     qty: -120, unit: "db" },
          ].map((r, i) => (
            <div key={i} className="grid grid-cols-[110px_140px_minmax(0,1fr)_100px_120px_120px] gap-3 px-5 py-2.5 border-b border-stone-100 last:border-0 items-center text-[12px]">
              <div className="font-mono text-stone-500 text-[11px]">{r.date}</div>
              <div>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium ${
                  r.type === "Bevét" ? "bg-emerald-50 text-emerald-700" :
                  r.type === "Kivét" ? "bg-stone-100 text-stone-700" :
                  r.type === "Maradék" ? "bg-sky-50 text-sky-700" :
                  "bg-amber-50 text-amber-700"
                }`}>{r.type}</span>
              </div>
              <div className="text-stone-900 truncate">{r.mat}</div>
              <div className={`text-right font-mono tabular-nums font-medium ${r.qty > 0 ? "text-emerald-700" : "text-stone-700"}`}>{r.qty > 0 ? "+" : ""}{r.qty} {r.unit}</div>
              <div className="font-mono text-[11px] text-teal-700">{r.src}</div>
              <div className="text-stone-600 text-[11.5px]">{r.who}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function ProcurementPage({ t }) {
  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-8 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-stone-900">{t.proc.activePO}</div>
            <PrimaryBtn icon="plus">{t.proc.newPO}</PrimaryBtn>
          </div>
          <div className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 border-b border-stone-100 bg-stone-50/40">
            <div className="truncate">ID</div><div>Szállító</div><div>Anyag</div><div className="text-right">Db</div><div>{t.common.eta}</div><div>Státusz</div>
          </div>
          {ACTIVE_PO.map(p => (
            <div key={p.id} className="grid grid-cols-[100px_minmax(0,1.4fr)_minmax(0,1fr)_60px_90px_120px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/60">
              <div className="text-[11.5px] font-mono text-stone-500 truncate">{p.id}</div>
              <div className="text-[12.5px] font-medium text-stone-900 truncate">{p.supplier}</div>
              <div className="text-[12px] text-stone-600 truncate">{p.material}</div>
              <div className="text-[12px] tabular-nums text-right">{p.qty}</div>
              <div className="text-[11.5px] font-mono text-stone-500">{p.eta}</div>
              <div className="min-w-0"><StatusPill status={p.status} label={t.status[p.status]} /></div>
            </div>
          ))}
        </Card>

        <Card className="col-span-4 p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 text-[12.5px] font-semibold text-stone-900">{t.proc.suppliers}</div>
          {SUPPLIERS.map(s => (
            <div key={s.name} className="px-5 py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/60">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-stone-900 truncate">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-medium text-amber-600 tabular-nums">★ {s.rating}</div>
                  <div className="text-[10.5px] text-stone-500 tabular-nums">{s.reliability}% {t.proc.reliability.toLowerCase()}</div>
                </div>
              </div>
              <div className="mt-1.5 text-[10.5px] text-stone-400 font-mono">{t.proc.lastOrder}: {s.lastOrder}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function AnalyticsPage({ t }) {
  const cards = [
    { label: t.ana.waste, value: "7.1%", delta: -9, color: "#0d9488", spark: SPARKS.wasteRate },
    { label: t.ana.capacity, value: "82%", delta: 7, color: "#0d9488", spark: SPARKS.capacity },
    { label: t.ana.oee, value: "81%", delta: 4, color: "#0d9488", spark: SPARKS.oee },
    { label: t.ana.daily, value: "284", unit: t.common.pieces, delta: 12, color: "#b45309", spark: [240, 252, 261, 268, 274, 279, 284] },
  ];
  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
          {[t.common.today, t.common.week, t.common.month].map((p, i) => (
            <button key={i} className={`px-2.5 h-7 rounded-md text-[12px] ${i === 1 ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>{p}</button>
          ))}
        </div>
        <div className="flex-1" />
        <GhostBtn icon="download">CSV</GhostBtn>
        <GhostBtn icon="download">PDF</GhostBtn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {cards.map(c => (
          <Card key={c.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{c.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] font-semibold tabular-nums text-stone-900">{c.value}</span>
              {c.unit && <span className="text-[12px] text-stone-500">{c.unit}</span>}
            </div>
            <div className={`text-[11px] mt-0.5 inline-flex items-center gap-0.5 ${c.delta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              <Icon name={c.delta >= 0 ? "up" : "down"} size={11} />{Math.abs(c.delta)}%
            </div>
            <div className="mt-3" style={{ color: c.color }}>
              <Sparkline data={c.spark} width={220} height={48} stroke={c.color} fill={c.color} strokeWidth={1.8} responsive />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="text-[12.5px] font-semibold text-stone-900 mb-1">Gép-szintű hulladék arány (utolsó 30 nap)</div>
        <div className="text-[11.5px] text-stone-500 mb-4">Anyag és gép kombinációjára lebontva</div>
        <div className="space-y-2.5">
          {[
            { name: "Holzma HPP380 · Bükk 18mm",  pct: 6.4 },
            { name: "Holzma HPP380 · MDF 19mm",   pct: 5.2 },
            { name: "Biesse Selco · Tölgy 40mm",  pct: 8.2 },
            { name: "Biesse Selco · Tölgy 22mm",  pct: 7.8 },
            { name: "Holzma HPP380 · MDF 16mm",   pct: 5.9 },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px] gap-3 items-center">
              <div className="flex items-center gap-3">
                <div className="text-[12px] font-mono text-stone-700 w-[260px] shrink-0 truncate">{row.name}</div>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600" style={{ width: `${row.pct * 8}%` }} />
                </div>
              </div>
              <div className="text-[12px] tabular-nums text-stone-700 text-right">{row.pct}%</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SettingsPage({ t, initialTab }) {
  const [tab, setTab] = useStateX(initialTab || "users");
  const tabs = ["company", "users", "facilities", "machines", "partners", "workflow", "integrations", "catalog", "audit", "roles"];
  return (
    <div className="px-7 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 mb-5 border-b border-stone-200/80">
        {tabs.map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 h-9 text-[12.5px] font-medium border-b-2 transition ${tab === k ? "border-teal-600 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
            {t.set.tabs[k]}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card className="p-0">
          <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-stone-900">{USERS.length} felhasználó</div>
            <PrimaryBtn icon="plus">{t.set.inviteUser}</PrimaryBtn>
          </div>
          {USERS.map(u => (
            <div key={u.email} className="px-5 py-3 border-b border-stone-100 last:border-0 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[11px] font-semibold text-white">{u.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-stone-900">{u.name}</div>
                <div className="text-[11px] text-stone-500 font-mono">{u.email}</div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">{t.set.role[u.role]}</span>
              <button className="text-stone-400 hover:text-stone-700"><Icon name="chevron" size={14} /></button>
            </div>
          ))}
        </Card>
      )}

      {tab === "company" && (
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4 max-w-[640px]">
            {[
              { label: "Cégnév", value: "Doorstar Hungary Zrt." },
              { label: "Adószám", value: "12345678-2-13" },
              { label: "Cím", value: "2600 Vác, Ipari park 14." },
              { label: "Bank", value: "OTP · 11774012-12345678" },
              { label: "Kapcsolat", value: "info@doorstar.hu" },
              { label: "Telefon", value: "+36 27 123 456" },
            ].map((f, i) => (
              <div key={i}>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 mb-1">{f.label}</div>
                <input defaultValue={f.value} className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12.5px]" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "machines" && <MachineParkPanel />}
      {tab === "catalog" && <CatalogPanel />}
      {tab === "audit" && <AuditPanel />}
      {tab === "facilities" && <FacilitiesPanel />}
      {tab === "partners" && <PartnersPanel lang={t === I18N.en ? "en" : "hu"} />}
      {tab === "roles" && <RolesPanel t={t} />}
      {tab === "workflow" && <StageChainEditor t={t} />}

      {tab === "integrations" && (
        <Card className="p-8 text-center">
          <div className="text-[13px] font-medium text-stone-700">{t.set.tabs[tab]}</div>
          <div className="text-[11.5px] text-stone-500 mt-1">Tartalom placeholder — ehhez a fülhöz design-folyamat van.</div>
        </Card>
      )}
    </div>
  );
}

window.InventoryPage = InventoryPage;
window.ProcurementPage = ProcurementPage;
window.AnalyticsPage = AnalyticsPage;
window.SettingsPage = SettingsPage;
