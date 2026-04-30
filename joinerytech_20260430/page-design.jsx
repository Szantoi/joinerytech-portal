// Tervezés (Design) world — parametric template editor + materials generator + catalog

const { useState: useStateD, useMemo: useMemoD } = React;

// ──────────────────────────────────────────────────────────────────────────
// Helpers — formula resolution
// ──────────────────────────────────────────────────────────────────────────
function resolveFormula(expr, ctx) {
  if (typeof expr === "number") return expr;
  if (expr == null) return 0;
  if (typeof expr === "string" && !/[{}]/.test(expr) && !/[+\-*×/]/.test(expr) && !/^\d/.test(expr.trim())) {
    // bare token like "EG-3303-18"
    return expr;
  }
  let s = String(expr);
  // Replace {var.t} → material thickness lookup
  s = s.replace(/\{([a-z_]+)\.t\}/gi, (_, k) => {
    const v = ctx[k];
    if (v && CATALOG_LOOKUP[v]) return CATALOG_LOOKUP[v].t;
    return 18;
  });
  // Replace {var}
  s = s.replace(/\{([a-z_]+)\}/gi, (_, k) => ctx[k] ?? 0);
  // × → *
  s = s.replace(/×/g, "*");
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("return (" + s + ")");
    const v = fn();
    return typeof v === "number" && isFinite(v) ? Math.round(v) : v;
  } catch {
    return s;
  }
}

function materialLabel(code) {
  return CATALOG_LOOKUP[code]?.name || code;
}
function materialColor(code) {
  return CATALOG_LOOKUP[code]?.color || "#cbb88e";
}

// ──────────────────────────────────────────────────────────────────────────
// Design Dashboard
// ──────────────────────────────────────────────────────────────────────────
function DesignDashboard({ onScreen }) {
  const stats = [
    { label: "Aktív sablonok",       value: 24, delta: "+3 e hónapban" },
    { label: "Generált anyaglisták", value: 142, delta: "+18 e héten" },
    { label: "Aktív projektek",      value: 2,   delta: "Doorstar, Bognár" },
    { label: "Sablon átlag rating",  value: "4.6 ★", delta: "76 értékelés" },
  ];
  const popular = PARAM_TEMPLATES.slice(0, 3);

  return (
    <div className="px-7 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{s.label}</div>
            <div className="text-[28px] font-semibold tracking-tight text-stone-900 mt-1">{s.value}</div>
            <div className="text-[10.5px] text-stone-500 mt-1">{s.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[14px] font-semibold text-stone-900">Népszerű sablonok</div>
              <div className="text-[11px] text-stone-500">A leggyakrabban használt parametrikus sablonok</div>
            </div>
            <button onClick={() => onScreen("editor")} className="text-[11.5px] text-amber-700 font-medium hover:underline">Sablonok megnyitása →</button>
          </div>
          <div className="space-y-2">
            {popular.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-stone-100 hover:border-stone-200 hover:bg-stone-50/40">
                <TemplateThumb kind={t.thumb} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-stone-900">{t.name}</div>
                  <div className="text-[11px] text-stone-500">{t.type} · v{t.version} · {t.author}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-amber-700">{t.uses}</div>
                  <div className="text-[10px] text-stone-500">felhasználás</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-stone-900">{t.rating} ★</div>
                  <div className="text-[10px] text-stone-500">értékelés</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[14px] font-semibold text-stone-900 mb-1">Aktív projektek</div>
          <div className="text-[11px] text-stone-500 mb-3">Tervezés alatt</div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-stone-100 hover:border-stone-200">
              <div className="text-[12.5px] font-medium text-stone-900">Doorstar — 12 ajtó beállítás</div>
              <div className="text-[10.5px] text-stone-500 mt-0.5">Belső ajtó · Tölgy · 7/12 kész</div>
              <div className="h-1 rounded-full bg-stone-100 mt-2 overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: "58%" }} />
              </div>
            </div>
            <div className="p-3 rounded-lg border border-stone-100 hover:border-stone-200">
              <div className="text-[12.5px] font-medium text-stone-900">Bognár — Konyhabútor</div>
              <div className="text-[10.5px] text-stone-500 mt-0.5">14 alsó szekrény + 8 felső · 22/22 kész</div>
              <div className="h-1 rounded-full bg-stone-100 mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TemplateThumb({ kind, size = 64 }) {
  const s = size;
  const stroke = "#a8a29e", fill = "#fef3c7";
  if (kind === "cabinet") return (
    <svg width={s} height={s} viewBox="0 0 64 64" className="rounded-md bg-amber-50/50">
      <rect x="10" y="8" width="44" height="48" rx="2" fill={fill} stroke={stroke} strokeWidth="1.4"/>
      <line x1="10" y1="22" x2="54" y2="22" stroke={stroke} strokeWidth="1.4"/>
      <line x1="10" y1="36" x2="54" y2="36" stroke={stroke} strokeWidth="1.4"/>
      <line x1="10" y1="50" x2="54" y2="50" stroke={stroke} strokeWidth="1.4"/>
    </svg>
  );
  if (kind === "drawer") return (
    <svg width={s} height={s} viewBox="0 0 64 64" className="rounded-md bg-amber-50/50">
      <rect x="10" y="10" width="44" height="44" rx="2" fill={fill} stroke={stroke} strokeWidth="1.4"/>
      <rect x="14" y="14" width="36" height="11" fill="#fff" stroke={stroke} strokeWidth="1.2"/>
      <rect x="14" y="27" width="36" height="11" fill="#fff" stroke={stroke} strokeWidth="1.2"/>
      <rect x="14" y="40" width="36" height="11" fill="#fff" stroke={stroke} strokeWidth="1.2"/>
      <circle cx="32" cy="19" r="1.2" fill={stroke}/>
      <circle cx="32" cy="32" r="1.2" fill={stroke}/>
      <circle cx="32" cy="45" r="1.2" fill={stroke}/>
    </svg>
  );
  if (kind === "door") return (
    <svg width={s} height={s} viewBox="0 0 64 64" className="rounded-md bg-amber-50/50">
      <rect x="20" y="6" width="24" height="52" rx="1" fill={fill} stroke={stroke} strokeWidth="1.4"/>
      <rect x="24" y="12" width="16" height="20" fill="#fff" stroke={stroke} strokeWidth="1"/>
      <rect x="24" y="36" width="16" height="16" fill="#fff" stroke={stroke} strokeWidth="1"/>
      <circle cx="40" cy="32" r="1.2" fill={stroke}/>
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" className="rounded-md bg-stone-100">
      <rect x="14" y="14" width="36" height="36" rx="2" fill="none" stroke={stroke} strokeWidth="1.4" strokeDasharray="3 3"/>
      <line x1="14" y1="14" x2="50" y2="50" stroke={stroke} strokeWidth="1" strokeDasharray="2 2"/>
      <line x1="50" y1="14" x2="14" y2="50" stroke={stroke} strokeWidth="1" strokeDasharray="2 2"/>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Template Editor — the parametric centerpiece
// ──────────────────────────────────────────────────────────────────────────
function TemplateEditor() {
  const [tplId, setTplId] = useStateD(PARAM_TEMPLATES[0].id);
  const tpl = PARAM_TEMPLATES.find(t => t.id === tplId);
  const [mode, setMode] = useStateD("simple");          // simple | advanced
  const [selectedPart, setSelectedPart] = useStateD(0);
  const [vars, setVars] = useStateD(() => Object.fromEntries(tpl.vars.map(v => [v.key, v.default])));
  const [showFormula, setShowFormula] = useStateD(null); // {partIdx, field}

  React.useEffect(() => {
    setVars(Object.fromEntries(tpl.vars.map(v => [v.key, v.default])));
    setSelectedPart(0);
  }, [tplId]);

  // Resolve every part with current vars
  const resolvedParts = useMemoD(() => {
    return tpl.parts.map(p => {
      const partCtx = { ...vars };
      // expose vars + their .t for material vars — handled in resolveFormula
      return {
        ...p,
        rMat:   resolveFormula(p.mat, vars),
        rW:     resolveFormula(p.w, vars),
        rH:     resolveFormula(p.h, vars),
        rT:     resolveFormula(p.t, vars),
        rQty:   resolveFormula(p.qty, vars),
      };
    });
  }, [tpl, vars]);

  const constraintResults = useMemoD(() => {
    return tpl.constraints.map(c => {
      try {
        let s = c.expr.replace(/\{([a-z_]+)\.t\}/gi, (_, k) => CATALOG_LOOKUP[vars[k]]?.t ?? 18);
        s = s.replace(/\{([a-z_]+)\}/gi, (_, k) => vars[k] ?? 0);
        s = s.replace(/×/g, "*");
        // eslint-disable-next-line no-new-func
        const ok = new Function("return (" + s + ")")();
        return { ...c, ok: !!ok };
      } catch { return { ...c, ok: false }; }
    });
  }, [tpl, vars]);
  const allConstraintsOk = constraintResults.every(c => c.ok);

  return (
    <div className="px-7 py-6">
      {/* template picker */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mr-2">Sablon:</div>
        {PARAM_TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setTplId(t.id)}
            className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition ${
              tplId === t.id
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
            }`}>
            {t.name}
          </button>
        ))}
        <span className="flex-1" />
        <div className="inline-flex p-0.5 bg-stone-100 rounded-lg">
          <button onClick={() => setMode("simple")}
            className={`px-2.5 h-7 text-[11px] rounded-md ${mode === "simple" ? "bg-white shadow-sm font-medium text-stone-900" : "text-stone-600"}`}>Egyszerű</button>
          <button onClick={() => setMode("advanced")}
            className={`px-2.5 h-7 text-[11px] rounded-md ${mode === "advanced" ? "bg-white shadow-sm font-medium text-stone-900" : "text-stone-600"}`}>Haladó <span className="text-amber-600">fx</span></button>
        </div>
      </div>

      {/* free-variable bar */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[12px] font-semibold text-stone-900">Szabad változók</div>
          <div className="text-[10.5px] text-stone-500">— állítsd be a sablon paramétereit</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tpl.vars.map(v => (
            <FreeVarControl key={v.key} v={v} value={vars[v.key]} onChange={(val) => setVars(p => ({ ...p, [v.key]: val }))} mode={mode} />
          ))}
        </div>

        {/* constraints */}
        {tpl.constraints.length > 0 && (
          <div className={`mt-4 p-3 rounded-lg text-[11.5px] ${allConstraintsOk ? "bg-emerald-50/60 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name={allConstraintsOk ? "check" : "alert"} size={13} />
              <span className="font-semibold">{allConstraintsOk ? "Minden megkötés rendben" : "Megkötés sérül"}</span>
            </div>
            <ul className="space-y-0.5 ml-5 list-disc">
              {constraintResults.map((c, i) => (
                <li key={i} className={c.ok ? "" : "font-medium"}>
                  {c.rule}
                  {mode === "advanced" && <span className="ml-2 font-mono text-[10.5px] opacity-60">{c.expr}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* Parts tree */}
        <Card className="col-span-12 lg:col-span-4 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-stone-900">Alkatrészek</div>
            <button className="text-[11px] text-stone-500 hover:text-stone-900 inline-flex items-center gap-1">
              <Icon name="plus" size={12} />Új alkatrész
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {tpl.parts.length === 0 && (
              <div className="px-4 py-8 text-center text-[11.5px] text-stone-500">
                Nincs alkatrész. Kattints az „Új alkatrész"-re.
              </div>
            )}
            {tpl.parts.map((p, i) => {
              const r = resolvedParts[i];
              const active = selectedPart === i;
              return (
                <button key={i} onClick={() => setSelectedPart(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-stone-50 last:border-0 text-left transition ${active ? "bg-amber-50/50" : "hover:bg-stone-50/50"}`}>
                  <div className="w-1 h-8 rounded-full" style={{ background: active ? "#d97706" : "transparent" }} />
                  <Icon name="cube" size={14} className="text-stone-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-stone-900 truncate">{p.name}</div>
                    <div className="text-[10.5px] text-stone-500 font-mono">{r.rW} × {r.rH} × {r.rT}mm</div>
                  </div>
                  <div className="text-[11px] font-semibold text-stone-900">{r.rQty}<span className="text-stone-400 font-normal text-[10px]"> db</span></div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detail */}
        <Card className="col-span-12 lg:col-span-5 p-5">
          {tpl.parts[selectedPart] ? (
            <PartDetail part={tpl.parts[selectedPart]} resolved={resolvedParts[selectedPart]} mode={mode} vars={vars} />
          ) : (
            <div className="text-center py-10 text-[12px] text-stone-500">Válassz alkatrészt</div>
          )}
        </Card>

        {/* Preview */}
        <Card className="col-span-12 lg:col-span-3 p-4">
          <div className="text-[12px] font-semibold text-stone-900 mb-2">Mintakép</div>
          <div className="aspect-square rounded-lg bg-gradient-to-br from-stone-50 to-amber-50/30 grid place-items-center mb-3 border border-stone-100">
            <TemplateThumb kind={tpl.thumb} size={120} />
          </div>
          <div className="text-[11px] text-stone-600 leading-relaxed">{tpl.note}</div>
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-stone-500">Típus</span><span className="font-medium text-stone-900">{tpl.type}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Verzió</span><span className="font-medium text-stone-900 font-mono">v{tpl.version}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Szerző</span><span className="font-medium text-stone-900">{tpl.author}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Frissítve</span><span className="font-medium text-stone-900 font-mono">{tpl.updated}</span></div>
          </div>
        </Card>
      </div>

      {/* Bottom — generated parts list */}
      <Card className="mt-4 p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[13px] font-semibold text-stone-900">Generált alkatrészlista</div>
            <div className="text-[11px] text-stone-500">{resolvedParts.length} alkatrész · az aktuális paraméterekkel</div>
          </div>
          <div className="flex gap-2">
            <button className="h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] font-medium text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5">
              <Icon name="plus" size={12} />Egyedi alkatrész
            </button>
            <button onClick={() => window.toast?.success?.("Anyaglista létrehozva — átirányítva a generátorba")}
              className="h-8 px-3 rounded-lg bg-amber-600 text-white text-[11.5px] font-medium hover:bg-amber-700 inline-flex items-center gap-1.5">
              <Icon name="bolt" size={12} />Anyaglista mentése
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">#</th>
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Alkatrész</th>
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Anyag</th>
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Méret</th>
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Vastagság</th>
                <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium text-right">Db</th>
              </tr>
            </thead>
            <tbody>
              {resolvedParts.map((r, i) => (
                <tr key={i} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/40">
                  <td className="px-5 py-2.5 text-stone-400 font-mono text-[11px]">{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-stone-900">{r.name}</td>
                  <td className="px-5 py-2.5 text-stone-700">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm border border-stone-300" style={{ background: materialColor(r.rMat) }} />
                      {materialLabel(r.rMat)}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-stone-700">{r.rW} × {r.rH}mm</td>
                  <td className="px-5 py-2.5 font-mono text-stone-700">{r.rT}mm</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-stone-900">{r.rQty}</td>
                </tr>
              ))}
              {resolvedParts.length === 0 && (
                <tr><td colSpan="6" className="px-5 py-8 text-center text-stone-500 text-[11.5px]">Nincs még alkatrész a sablonban.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// One free-variable control (slider, raster picker, material dropdown)
function FreeVarControl({ v, value, onChange, mode }) {
  if (v.kind === "material") {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{v.label}</div>
          {mode === "advanced" && <span className="text-[9.5px] text-stone-400 font-mono">{v.key}</span>}
        </div>
        <div className="relative">
          <select value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-stone-200 text-[12px] bg-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 appearance-none">
            {v.options.map(o => <option key={o} value={o}>{CATALOG_LOOKUP[o]?.name || o}</option>)}
          </select>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded border border-stone-300" style={{ background: materialColor(value) }} />
          <Icon name="chevron" size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 rotate-90" />
        </div>
      </div>
    );
  }

  // numeric (analog or raster)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{v.label}</div>
        <div className="flex items-center gap-1.5">
          {mode === "advanced" && <span className="text-[9.5px] text-stone-400 font-mono">{v.kind}</span>}
          <span className="text-[11px] font-semibold text-stone-900 font-mono tabular-nums">{value} <span className="text-[9.5px] font-normal text-stone-500">{v.unit}</span></span>
        </div>
      </div>
      <input type="range" min={v.min} max={v.max} step={v.step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-600 h-1.5" />
      <div className="flex justify-between text-[9.5px] text-stone-400 font-mono mt-0.5">
        <span>{v.min}</span>
        <span>{v.max}</span>
      </div>
    </div>
  );
}

function PartDetail({ part, resolved, mode, vars }) {
  const fields = [
    { key: "name", label: "Név",         value: part.name,                        resolved: part.name, raw: part.name },
    { key: "mat",  label: "Anyag",       value: materialLabel(resolved.rMat),     resolved: resolved.rMat,  raw: part.mat },
    { key: "w",    label: "Szélesség",   value: resolved.rW + " mm",              resolved: resolved.rW,    raw: part.w },
    { key: "h",    label: "Magasság",    value: resolved.rH + " mm",              resolved: resolved.rH,    raw: part.h },
    { key: "t",    label: "Vastagság",   value: resolved.rT + " mm",              resolved: resolved.rT,    raw: part.t },
    { key: "qty",  label: "Mennyiség",   value: resolved.rQty + " db",            resolved: resolved.rQty,  raw: part.qty },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Alkatrész</div>
          <div className="text-[16px] font-semibold tracking-tight text-stone-900 mt-0.5">{part.name}</div>
        </div>
        <button className="text-[11px] text-rose-600 hover:underline">Törlés</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.slice(1).map(f => (
          <div key={f.key} className="rounded-lg border border-stone-100 p-3 bg-stone-50/30">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">{f.label}</div>
              {mode === "advanced" && (
                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">fx</span>
              )}
            </div>
            <div className="text-[14px] font-semibold text-stone-900 font-mono mt-1">{f.value}</div>
            {mode === "advanced" && f.raw !== f.value && (
              <div className="text-[10.5px] font-mono text-stone-500 mt-1 truncate" title={String(f.raw)}>= {String(f.raw)}</div>
            )}
          </div>
        ))}
      </div>

      {mode === "advanced" && (
        <div className="mt-4 p-3 rounded-lg bg-stone-900 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto">
          <div className="text-stone-400 mb-1">// CNC deriválás preview</div>
          <div>PART {part.name.toUpperCase()}</div>
          <div>  MATERIAL = {resolved.rMat}</div>
          <div>  DIM      = {resolved.rW} x {resolved.rH} x {resolved.rT}</div>
          <div>  QUANTITY = {resolved.rQty}</div>
          <div>  EDGES    = TOP, BOTTOM, LEFT, RIGHT</div>
          <div className="text-stone-400 mt-1">// → Holzma optimizer</div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Materials Generator — pick template + vars + send to cutting
// ──────────────────────────────────────────────────────────────────────────
function MaterialsGenerator() {
  const [step, setStep] = useStateD(0); // 0: pick template, 1: configure, 2: review, 3: sent
  const [tplId, setTplId] = useStateD(PARAM_TEMPLATES[0].id);
  const tpl = PARAM_TEMPLATES.find(t => t.id === tplId);
  const [vars, setVars] = useStateD(() => Object.fromEntries(tpl.vars.map(v => [v.key, v.default])));
  const [extras, setExtras] = useStateD([]);
  const [orderRef, setOrderRef] = useStateD("JT-2426-0184");

  React.useEffect(() => {
    setVars(Object.fromEntries(tpl.vars.map(v => [v.key, v.default])));
  }, [tplId]);

  const resolved = tpl.parts.map(p => ({
    name: p.name,
    mat: resolveFormula(p.mat, vars),
    w: resolveFormula(p.w, vars),
    h: resolveFormula(p.h, vars),
    t: resolveFormula(p.t, vars),
    qty: resolveFormula(p.qty, vars),
  }));
  const allParts = [...resolved, ...extras];

  return (
    <div className="px-7 py-6">
      {/* stepper */}
      <div className="flex items-center gap-2 mb-6">
        {["Sablon választás", "Paraméterek", "Áttekintés", "Szabászatba küldve"].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 ${i === step ? "" : "opacity-60"}`}>
              <div className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold ${
                i < step ? "bg-emerald-600 text-white" : i === step ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-500"
              }`}>{i < step ? "✓" : i + 1}</div>
              <span className={`text-[12px] ${i === step ? "font-semibold text-stone-900" : "text-stone-600"}`}>{label}</span>
            </div>
            {i < 3 && <div className="flex-1 h-px bg-stone-200" />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div>
          <Card className="p-5">
            <div className="text-[13px] font-semibold mb-3">Válassz sablont</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PARAM_TEMPLATES.filter(t => t.id !== "T-04").map(t => (
                <button key={t.id} onClick={() => setTplId(t.id)}
                  className={`text-left p-3 rounded-xl border transition ${tplId === t.id ? "border-amber-400 bg-amber-50/50 shadow-sm" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
                  <TemplateThumb kind={t.thumb} size={64} />
                  <div className="text-[12.5px] font-semibold text-stone-900 mt-2">{t.name}</div>
                  <div className="text-[10.5px] text-stone-500">{t.type} · v{t.version}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-stone-500">
                    <span className="font-mono">{t.uses} használat</span>
                    <span>·</span>
                    <span>{t.rating} ★</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          <div className="flex justify-end mt-4">
            <button onClick={() => setStep(1)} className="h-9 px-5 bg-amber-600 text-white text-[12px] font-medium rounded-lg hover:bg-amber-700">Tovább →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[13px] font-semibold text-stone-900">{tpl.name}</div>
                <div className="text-[11px] text-stone-500">Paraméterek beállítása</div>
              </div>
              <button onClick={() => setStep(0)} className="text-[11px] text-stone-500 hover:text-stone-900">← Más sablon</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tpl.vars.map(v => (
                <FreeVarControl key={v.key} v={v} value={vars[v.key]} onChange={(val) => setVars(p => ({ ...p, [v.key]: val }))} mode="simple" />
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-[13px] font-semibold mb-2">Hozzárendelés rendeléshez</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1">Rendelés</div>
                <select value={orderRef} onChange={(e) => setOrderRef(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] bg-white">
                  <option>JT-2426-0184 — Bognár Bútor Kft.</option>
                  <option>JT-2426-0182 — Doorstar Hungary Zrt.</option>
                  <option>JT-2426-0180 — Hegyi Lakberendezés</option>
                </select>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500 font-medium mb-1">Mennyiség</div>
                <input type="number" defaultValue="1" min="1" className="w-full h-9 px-3 rounded-lg border border-stone-200 text-[12px] bg-white font-mono" />
              </div>
            </div>
          </Card>
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="h-9 px-4 border border-stone-200 text-[12px] rounded-lg hover:bg-stone-50">← Vissza</button>
            <button onClick={() => setStep(2)} className="h-9 px-5 bg-amber-600 text-white text-[12px] font-medium rounded-lg hover:bg-amber-700">Áttekintés →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold">Generált alkatrészlista — {tpl.name}</div>
                <div className="text-[11px] text-stone-500">{allParts.length} alkatrész · {orderRef}</div>
              </div>
              <button onClick={() => setExtras(p => [...p, { name: "Egyedi alkatrész " + (p.length + 1), mat: "EG-3303-18", w: 400, h: 400, t: 18, qty: 1 }])}
                className="h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] font-medium text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5">
                <Icon name="plus" size={12} />Egyedi hozzáadása
              </button>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 text-left">
                  <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Alkatrész</th>
                  <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Anyag</th>
                  <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium">Méret</th>
                  <th className="px-5 py-2.5 text-[10.5px] uppercase tracking-wide text-stone-500 font-medium text-right">Db</th>
                </tr>
              </thead>
              <tbody>
                {allParts.map((p, i) => (
                  <tr key={i} className="border-b border-stone-50 last:border-0">
                    <td className="px-5 py-2.5 font-medium text-stone-900">{p.name}{i >= resolved.length && <span className="ml-2 px-1.5 py-0.5 text-[9.5px] uppercase rounded bg-stone-100 text-stone-600">egyedi</span>}</td>
                    <td className="px-5 py-2.5 text-stone-700">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm border border-stone-300" style={{ background: materialColor(p.mat) }} />
                        {materialLabel(p.mat)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-mono text-stone-700">{p.w} × {p.h} × {p.t}mm</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-stone-900">{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="h-9 px-4 border border-stone-200 text-[12px] rounded-lg hover:bg-stone-50">← Paraméterek</button>
            <button onClick={() => { setStep(3); window.toast?.success?.("Szabászlistába küldve — Cutting backend"); }}
              className="h-9 px-5 bg-emerald-600 text-white text-[12px] font-medium rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1.5">
              <Icon name="bolt" size={12} />Szabászlistába küldés
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto mb-3">
            <Icon name="check" size={26} />
          </div>
          <div className="text-[18px] font-semibold tracking-tight text-stone-900">Szabászlistába küldve</div>
          <div className="text-[12.5px] text-stone-500 mt-1">{allParts.length} alkatrész elküldve a Cutting modulba — {orderRef}</div>
          <div className="text-[11px] text-stone-400 mt-1">Cutting Plan ID: <span className="font-mono">CP-184-{Math.random().toString(36).slice(2,5).toUpperCase()}</span></div>
          <div className="flex justify-center gap-2 mt-5">
            <button onClick={() => setStep(0)} className="h-9 px-4 border border-stone-200 text-[12px] rounded-lg hover:bg-stone-50">Új generálás</button>
            <button className="h-9 px-4 bg-stone-900 text-white text-[12px] rounded-lg hover:bg-stone-800">Megnyitás Gyártás → Szabászat</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Catalog screen — materials
// ──────────────────────────────────────────────────────────────────────────
function DesignCatalog() {
  const cats = ["Korpusz lemez", "Élzáró", "Vasalat", "Tömör fa", "Egyéb"];
  const [cat, setCat] = useStateD(0);
  const items = Object.entries(CATALOG_LOOKUP).map(([code, m]) => ({ code, ...m }));
  return (
    <div className="px-7 py-6">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {cats.map((c, i) => (
          <button key={c} onClick={() => setCat(i)}
            className={`px-3 h-8 rounded-lg text-[11.5px] font-medium border transition ${cat === i ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"}`}>{c}</button>
        ))}
        <span className="flex-1" />
        <button className="h-8 px-3 rounded-lg border border-stone-200 text-[11.5px] font-medium text-stone-700 hover:bg-stone-50 inline-flex items-center gap-1.5">
          <Icon name="plus" size={12} />Új tétel
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(m => (
          <Card key={m.code} className="p-4">
            <div className="aspect-[4/3] rounded-md mb-3 border border-stone-200" style={{ background: m.color }} />
            <div className="text-[12.5px] font-semibold text-stone-900">{m.name}</div>
            <div className="text-[10.5px] text-stone-500 font-mono mt-0.5">{m.code} · {m.kind}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
              <span className="text-[10.5px] text-stone-500">Vastagság</span>
              <span className="text-[12px] font-semibold text-stone-900 font-mono">{m.t}mm</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

window.DesignDashboard = DesignDashboard;
window.TemplateEditor = TemplateEditor;
window.MaterialsGenerator = MaterialsGenerator;
window.DesignCatalog = DesignCatalog;
