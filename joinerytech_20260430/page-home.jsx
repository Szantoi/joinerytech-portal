// Home screen + World shell with mini-sidebars
// Replaces the global single-sidebar app shell.

const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH } = React;

// ──────────────────────────────────────────────────────────────────────────
// World icon set — bigger, more illustrative than the Icon set
// ──────────────────────────────────────────────────────────────────────────
function WorldIcon({ name, size = 40, className = "" }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", className };
  const ICONS = {
    factory: <svg {...common}><path d="M6 40V22l8 5v-5l8 5v-5l8 5V14l8 -2v28z"/><path d="M6 40h36"/><path d="M14 32h2M22 32h2M30 32h2M38 28v6"/></svg>,
    briefcase: <svg {...common}><rect x="6" y="14" width="36" height="26" rx="2"/><path d="M18 14V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M6 24h36M22 22v4M26 22v4"/></svg>,
    ruler: <svg {...common}><path d="M8 8h32v8H32v6H24v6H16v6H8z"/><path d="M14 14v3M20 14v3M26 14v3M32 14v3"/><path d="M14 22v3M20 22v3M26 22v3"/><path d="M14 30v3M20 30v3"/></svg>,
    box: <svg {...common}><path d="M24 6 6 14v20l18 8 18-8V14z"/><path d="M6 14l18 8 18-8M24 22v20"/><path d="M14 10l18 8"/></svg>,
    wrench: <svg {...common}><path d="M30 6a8 8 0 0 1 8 12l-2 2 4 4 -8 8 -4 -4 -2 2a8 8 0 0 1 -12 -8"/><path d="M14 22 6 30v8h8l8-8"/><circle cx="32" cy="14" r="2.5"/></svg>,
    settings: <svg {...common}><circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4"/></svg>,
  };
  return ICONS[name] || ICONS.box;
}

// ──────────────────────────────────────────────────────────────────────────
// Home screen — module card grid
// ──────────────────────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  { type: "stock",     when: "10 perccel ezelőtt",  text: "Vasalat Blum CLIP top — készlet kritikus szint alá esett (4 db)",       world: "warehouse", screen: "inventory" },
  { type: "order",     when: "1 órája",              text: "Új ajánlat elfogadva: Doorstar Hungary Zrt. — JT-2426-0182 (12.4M Ft)", world: "sales",     screen: "orders" },
  { type: "machine",   when: "2 órája",              text: "Holzma HPP380 · CP-184-A elkészült · proof feltöltve",                  world: "production", screen: "cutting" },
  { type: "design",    when: "Tegnap",               text: "Új sablon publikálva: Konyhai alsó szekrény (fiókos) v2.1",            world: "design",    screen: "editor" },
  { type: "delivery",  when: "Tegnap",               text: "PO-2426-091 megérkezett — 30 db Tölgy 22mm",                            world: "warehouse", screen: "procurement" },
];

function HomeScreen({ enabledModules, onEnter, lang }) {
  const greeting = lang === "en" ? "Good morning" : "Jó reggelt";
  const me = lang === "en" ? "Peter Kovacs" : "Kovács Péter";
  const subtitle = lang === "en" ? "Choose a workspace" : "Válassz egy munkavilágot";
  const recent = lang === "en" ? "Recent activity" : "Legutóbbi tevékenység";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-teal-50/30">
      {/* Top brand strip */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-stone-200/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 grid place-items-center text-white">
            <span className="text-[16px] font-bold tracking-tighter">jt</span>
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">joinery<span className="text-teal-600">/</span>tech</div>
            <div className="text-[10.5px] text-stone-500 -mt-0.5">portál</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-stone-500">{lang === "en" ? "Logged in as" : "Bejelentkezve"}</div>
            <div className="text-[12px] font-medium text-stone-900">Kovács Péter · Admin</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 grid place-items-center text-[11px] font-semibold text-white">KP</div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-[1200px] mx-auto px-8 pt-12 pb-6">
        <div className="text-[12px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-2">{new Date().toLocaleDateString(lang === "en" ? "en-US" : "hu-HU", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 className="text-[44px] font-semibold tracking-tight text-stone-900 leading-tight">{greeting}, {me}.</h1>
        <p className="text-[16px] text-stone-500 mt-1">{subtitle}.</p>
      </div>

      {/* Module grid */}
      <div className="max-w-[1200px] mx-auto px-8 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WORLD_ORDER.filter(k => enabledModules.includes(k)).map((key) => {
            const w = WORLDS[key];
            const accent = ACCENT_MAP[w.accent] || ACCENT_MAP.teal;
            return (
              <button key={key} onClick={() => onEnter(key)}
                className={`group relative overflow-hidden rounded-2xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-[0_8px_24px_-6px_rgba(28,25,23,.12)] transition text-left p-6 min-h-[200px] flex flex-col`}>
                {/* corner glyph */}
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${accent.tint} opacity-50 group-hover:opacity-90 transition`} />

                <div className={`relative w-12 h-12 rounded-xl ${accent.iconBg} ${accent.iconFg} grid place-items-center mb-5`}>
                  <WorldIcon name={w.icon} size={24} />
                </div>

                <div className="relative">
                  <div className="text-[19px] font-semibold tracking-tight text-stone-900">{lang === "en" ? w.en : w.hu}</div>
                  <div className="text-[12px] text-stone-500 mt-1 leading-snug">{w.sub}</div>
                </div>

                <div className="flex-1" />

                <div className="relative flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
                  {w.badge ? (
                    <span className={`text-[11px] font-medium ${accent.fg}`}>{w.badge}</span>
                  ) : <span />}
                  <span className="text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition">
                    <Icon name="chevron" size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent activity */}
        <div className="mt-10">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-3">{recent}</div>
          <Card className="p-0 overflow-hidden">
            {NOTIFICATIONS.map((n, i) => (
              <button key={i} onClick={() => onEnter(n.world, n.screen)}
                className="w-full grid grid-cols-[20px_1fr_120px] gap-3 px-5 py-3 border-b border-stone-100 last:border-0 items-center text-left hover:bg-stone-50/70">
                <div className={`w-2 h-2 rounded-full ${
                  n.type === "stock" ? "bg-amber-500" :
                  n.type === "order" ? "bg-emerald-500" :
                  n.type === "machine" ? "bg-teal-500" :
                  n.type === "design" ? "bg-indigo-500" :
                  "bg-sky-500"
                }`} />
                <div className="text-[12.5px] text-stone-800 truncate">{n.text}</div>
                <div className="text-[10.5px] text-stone-400 font-mono text-right">{n.when}</div>
              </button>
            ))}
          </Card>
        </div>
      </div>

      <footer className="text-center py-6 text-[10.5px] text-stone-400 font-mono">v3.2.1 · 2026</footer>
    </div>
  );
}

// Color tokens per accent
const ACCENT_MAP = {
  teal:    { tint: "bg-teal-100",    iconBg: "bg-teal-100",    iconFg: "text-teal-700",    fg: "text-teal-700",    sideBg: "bg-teal-50/30",    sideAccent: "border-teal-600",    sideHover: "hover:bg-teal-50" },
  indigo:  { tint: "bg-indigo-100",  iconBg: "bg-indigo-100",  iconFg: "text-indigo-700",  fg: "text-indigo-700",  sideBg: "bg-indigo-50/30",  sideAccent: "border-indigo-600",  sideHover: "hover:bg-indigo-50" },
  amber:   { tint: "bg-amber-100",   iconBg: "bg-amber-100",   iconFg: "text-amber-700",   fg: "text-amber-700",   sideBg: "bg-amber-50/30",   sideAccent: "border-amber-600",   sideHover: "hover:bg-amber-50" },
  emerald: { tint: "bg-emerald-100", iconBg: "bg-emerald-100", iconFg: "text-emerald-700", fg: "text-emerald-700", sideBg: "bg-emerald-50/30", sideAccent: "border-emerald-600", sideHover: "hover:bg-emerald-50" },
  stone:   { tint: "bg-stone-100",   iconBg: "bg-stone-100",   iconFg: "text-stone-700",   fg: "text-stone-700",   sideBg: "bg-stone-50/40",   sideAccent: "border-stone-700",   sideHover: "hover:bg-stone-100" },
};

// ──────────────────────────────────────────────────────────────────────────
// World shell — sidebar + content frame, scoped to one world
// ──────────────────────────────────────────────────────────────────────────
function WorldShell({ world, screen, onScreen, onHome, lang, children, t }) {
  const w = WORLDS[world];
  const accent = ACCENT_MAP[w.accent] || ACCENT_MAP.teal;
  return (
    <div className="flex min-h-screen bg-stone-50/60">
      <WorldSidebar world={w} accent={accent} screen={screen} onScreen={onScreen} onHome={onHome} lang={lang} />
      <main className="flex-1 min-w-0 flex flex-col">
        <WorldTopBar world={w} accent={accent} screen={screen} onHome={onHome} lang={lang} />
        <div className="flex-1">{children}</div>
      </main>
      {/* small home pill in bottom-left for fast nav back */}
    </div>
  );
}

function WorldSidebar({ world, accent, screen, onScreen, onHome, lang }) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-stone-200/70 flex-col">
      <button onClick={onHome} className="px-4 py-4 border-b border-stone-200/70 flex items-center gap-2.5 hover:bg-stone-50 text-left">
        <div className="w-8 h-8 rounded-lg bg-stone-900 grid place-items-center text-white">
          <span className="text-[13px] font-bold tracking-tighter">jt</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold tracking-tight text-stone-900 leading-tight">joinery<span className="text-teal-600">/</span>tech</div>
          <div className="text-[10px] text-stone-500 truncate">{lang === "en" ? "← All workspaces" : "← Vissza a Home-ra"}</div>
        </div>
      </button>

      {/* world identity */}
      <div className={`px-4 py-3 border-b border-stone-200/70 ${accent.sideBg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${accent.iconBg} ${accent.iconFg} grid place-items-center`}>
            <WorldIcon name={world.icon} size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-stone-900">{lang === "en" ? world.en : world.hu}</div>
            <div className="text-[10px] text-stone-500">{lang === "en" ? "Workspace" : "Munkavilág"}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {world.screens.map((s) => {
          const active = screen === s.key;
          return (
            <button key={s.key} onClick={() => onScreen(s.key)}
              className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[12.5px] text-left transition ${active ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"}`}>
              <span className={`w-1 h-4 rounded-full ${active ? accent.sideAccent.replace("border-", "bg-") : "bg-transparent"}`} />
              <span className="flex-1 truncate">{lang === "en" && s.en ? s.en : s.hu}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-stone-200/70 text-[10.5px] text-stone-400 font-mono">v3.2.1</div>
    </aside>
  );
}

function WorldTopBar({ world, accent, screen, onHome, lang }) {
  const screenObj = world.screens.find(s => s.key === screen) || world.screens[0];
  const screenLabel = lang === "en" && screenObj?.en ? screenObj.en : screenObj?.hu;
  return (
    <header className="bg-white border-b border-stone-200/70">
      <div className="px-7 py-4 flex items-center gap-4">
        <button onClick={onHome}
          className="md:hidden inline-flex items-center gap-1.5 text-[11.5px] text-stone-600 hover:text-stone-900">
          <Icon name="chevron" size={14} className="rotate-180" />Home
        </button>
        <div className="hidden md:flex items-center gap-2 text-[11.5px] text-stone-500">
          <button onClick={onHome} className="hover:text-stone-900">Home</button>
          <Icon name="chevron" size={11} className="text-stone-300" />
          <span className={accent.fg + " font-medium"}>{lang === "en" ? world.en : world.hu}</span>
          {screenObj && (<>
            <Icon name="chevron" size={11} className="text-stone-300" />
            <span className="text-stone-700 font-medium">{screenLabel}</span>
          </>)}
        </div>
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <input placeholder={lang === "en" ? "Search…" : "Keresés…"}
              className="h-8 w-56 pl-8 pr-3 rounded-lg border border-stone-200 text-[12px] focus:border-stone-400 focus:ring-1 focus:ring-stone-300 outline-none bg-stone-50/40" />
            <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
          <button className="w-8 h-8 grid place-items-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 relative">
            <Icon name="bell" size={14} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>
      <div className="px-7 pb-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-stone-900">
          {screenLabel}
        </h1>
      </div>
    </header>
  );
}

window.HomeScreen = HomeScreen;
window.WorldShell = WorldShell;
window.WorldIcon = WorldIcon;
window.ACCENT_MAP = ACCENT_MAP;
