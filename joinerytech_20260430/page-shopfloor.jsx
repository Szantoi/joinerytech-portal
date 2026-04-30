// Üzem (Shop Floor) world — full-screen tablet kiosk
// Self-contained: own header, no app sidebar.
// States: pin → machine pick → task view → task complete → next

const { useState: useStateF, useEffect: useEffectF } = React;

function ShopFloor({ onExit, lang }) {
  // stages: "pin" | "machine" | "task" | "problem" | "done"
  const [stage, setStage] = useStateF("pin");
  const [op, setOp] = useStateF(null);
  const [machineId, setMachineId] = useStateF(null);
  const [taskIdx, setTaskIdx] = useStateF(0);
  const [completedIds, setCompletedIds] = useStateF([]);

  const machine = SHOPFLOOR_MACHINES.find(m => m.id === machineId);
  const queue = (SHOPFLOOR_QUEUE[machineId] || []).filter(t => !completedIds.includes(t.id));
  const task = queue[taskIdx];

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col">
      {/* top strip — minimal */}
      <header className="bg-stone-800 border-b border-stone-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 grid place-items-center">
            <Icon name="wrench" size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-semibold tracking-tight">joinery<span className="text-emerald-400">/</span>tech · ÜZEM</div>
            <div className="text-[10.5px] text-stone-400">{op ? op.name : "—"} {machine ? "· " + machine.name : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {op && (
            <button onClick={() => { setOp(null); setMachineId(null); setStage("pin"); }}
              className="h-9 px-3 rounded-lg bg-stone-700 hover:bg-stone-600 text-[11.5px] inline-flex items-center gap-1.5">
              <Icon name="logout" size={13} />Kijelentkezés
            </button>
          )}
          <button onClick={onExit} className="h-9 px-3 rounded-lg bg-stone-700 hover:bg-stone-600 text-[11.5px]">Vissza a portálra</button>
        </div>
      </header>

      <div className="flex-1 flex">
        {stage === "pin" && <PinStage onLogin={(o) => { setOp(o); setStage("machine"); }} />}
        {stage === "machine" && op && <MachinePickStage op={op} onPick={(id) => { setMachineId(id); setStage("task"); }} />}
        {stage === "task" && machine && (
          task
            ? <TaskStage task={task} machine={machine} taskIdx={taskIdx} totalTasks={queue.length}
                onPrev={() => setTaskIdx(i => Math.max(0, i - 1))}
                onNext={() => setTaskIdx(i => Math.min(queue.length - 1, i + 1))}
                onDone={() => {
                  setCompletedIds(p => [...p, task.id]);
                  setTaskIdx(0);
                  window.toast?.success?.("Feladat lezárva — esemény: " + (task.kind === "cutting" ? "PanelCompleted" : task.kind === "edgeband" ? "EdgeBandingCompleted" : "CncCompleted"));
                }}
                onProblem={() => setStage("problem")}
              />
            : <NoMoreTasks onChangeMachine={() => setStage("machine")} />
        )}
        {stage === "problem" && <ProblemStage onCancel={() => setStage("task")} onSubmit={() => { setStage("task"); window.toast?.warning?.("Probléma jelezve — műszakvezetőnek értesítés ment"); }} />}
      </div>
    </div>
  );
}

// ─── Stage: PIN login ─────────────────────────────────────────────────
function PinStage({ onLogin }) {
  const [pin, setPin] = useStateF("");
  const [error, setError] = useStateF("");
  const press = (digit) => {
    setError("");
    if (pin.length < 4) setPin(p => p + digit);
  };
  const submit = (val = pin) => {
    const found = SHOPFLOOR_OPERATORS.find(o => o.pin === val);
    if (found) onLogin(found);
    else { setError("Helytelen PIN"); setPin(""); }
  };
  useEffectF(() => {
    if (pin.length === 4) setTimeout(() => submit(pin), 200);
  }, [pin]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 grid place-items-center mx-auto mb-4">
            <Icon name="user" size={32} className="text-white" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight">Bejelentkezés</h1>
          <p className="text-[13px] text-stone-400 mt-1">Add meg a 4 jegyű PIN-kódodat</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-12 h-14 rounded-xl border-2 grid place-items-center text-[28px] font-semibold ${
              pin.length > i ? "border-emerald-500 bg-emerald-500/10" : "border-stone-700 bg-stone-800"
            }`}>
              {pin.length > i ? "•" : ""}
            </div>
          ))}
        </div>
        {error && <div className="text-center text-[12px] text-rose-400 mb-3">{error}</div>}
        {!error && <div className="text-center text-[11px] text-stone-500 mb-3 font-mono">próbáld: 1234, 2345, 3456, 4567</div>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => press(String(n))}
              className="h-16 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-[26px] font-semibold transition border border-stone-700">{n}</button>
          ))}
          <button onClick={() => setPin("")} className="h-16 rounded-xl bg-stone-800 hover:bg-stone-700 text-[12px] uppercase tracking-wide text-stone-400 border border-stone-700">Töröl</button>
          <button onClick={() => press("0")} className="h-16 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-[26px] font-semibold transition border border-stone-700">0</button>
          <button className="h-16 rounded-xl bg-stone-800 hover:bg-stone-700 grid place-items-center text-stone-400 border border-stone-700" title="QR-kód olvasó">
            <Icon name="qr" size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stage: Machine pick ──────────────────────────────────────────────
function MachinePickStage({ op, onPick }) {
  const allowed = SHOPFLOOR_MACHINES.filter(m => op.machines.includes(m.id));
  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="text-[12px] uppercase tracking-[0.2em] text-stone-400">Üdv,</div>
          <h1 className="text-[32px] font-semibold tracking-tight mt-1">{op.name}</h1>
          <p className="text-[13px] text-stone-400 mt-2">Válaszd ki a gépet vagy szkennelj QR kódot a gépen</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allowed.map(m => (
            <button key={m.id} onClick={() => onPick(m.id)}
              className="text-left p-5 rounded-2xl bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-emerald-600/50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 grid place-items-center">
                  {m.kind === "Szabászat" ? <Icon name="cut" size={22} /> : m.kind === "Élzárás" ? <Icon name="layers" size={22} /> : <Icon name="cpu" size={22} />}
                </div>
                <span className={`px-2 h-6 inline-flex items-center rounded-full text-[10.5px] font-medium ${m.state === "running" ? "bg-emerald-500/20 text-emerald-300" : "bg-stone-700 text-stone-400"}`}>
                  {m.state === "running" ? "🟢 fut" : "⚪ szabad"}
                </span>
              </div>
              <div className="text-[16px] font-semibold">{m.name}</div>
              <div className="text-[11.5px] text-stone-400 mt-0.5">{m.kind} · {m.facility}</div>
              <div className="mt-3 pt-3 border-t border-stone-700 text-[11px] text-stone-500">
                Várakozó: <span className="text-stone-200 font-semibold">{(SHOPFLOOR_QUEUE[m.id] || []).length} feladat</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stage: Single task view ──────────────────────────────────────────
function TaskStage({ task, machine, taskIdx, totalTasks, onPrev, onNext, onDone, onProblem }) {
  // For cutting tasks, show nesting SVG; for edgeband/cnc, show alternative.
  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-[1400px] mx-auto w-full">
      {/* Task header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] text-stone-400 uppercase tracking-wide mb-1">
            <span className="px-2 h-6 inline-flex items-center rounded bg-stone-800 border border-stone-700">
              {task.kind === "cutting" ? "🔪 Szabászat" : task.kind === "edgeband" ? "📏 Élzárás" : "🤖 CNC"}
            </span>
            <span>·</span>
            <span>Feladat {taskIdx + 1} / {totalTasks}</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight">{task.id}</h1>
          <div className="text-[13px] text-stone-400 mt-0.5">
            {task.order} · {task.customer}
          </div>
        </div>

        {task.kind === "cutting" && (
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Anyag</div>
              <div className="text-[14px] font-semibold">{task.material}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Tábla</div>
              <div className="text-[20px] font-semibold font-mono">{(task.currentSheet || 0) + 1} / {task.sheets}</div>
            </div>
          </div>
        )}
      </div>

      {/* Visual area + parts list side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1">
        <div className="rounded-2xl bg-stone-800 border border-stone-700 p-4 overflow-hidden flex items-center justify-center min-h-[420px]">
          {task.kind === "cutting" && <NestingDarkSvg material={task.material} />}
          {task.kind === "edgeband" && <EdgebandViz task={task} />}
          {task.kind === "cnc" && <CncViz task={task} />}
        </div>

        <div className="rounded-2xl bg-stone-800 border border-stone-700 p-5 overflow-y-auto">
          {task.kind === "cutting" && (
            <>
              <div className="text-[12.5px] font-semibold mb-3">Alkatrészek ezen a táblán</div>
              <div className="space-y-2">
                {task.parts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/60 border border-stone-700">
                    <div className="w-8 h-8 rounded-md bg-emerald-600/20 text-emerald-400 grid place-items-center text-[10.5px] font-mono">{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="text-[11px] text-stone-400 font-mono">{p.w} × {p.h}mm</div>
                    </div>
                    <div className="text-[16px] font-semibold font-mono">{p.qty}<span className="text-[10px] font-normal text-stone-400 ml-0.5">db</span></div>
                  </div>
                ))}
              </div>
            </>
          )}
          {task.kind === "edgeband" && (
            <>
              <div className="text-[12.5px] font-semibold mb-3">Élzárási utasítás</div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-700">
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Él anyag</div>
                  <div className="text-[14px] font-semibold mt-0.5">{task.edge}</div>
                </div>
                <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-700">
                  <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Alkatrészek</div>
                  <div className="text-[18px] font-semibold mt-0.5 font-mono">{task.parts} db</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-700/40 text-amber-200 text-[11.5px]">
                  ⚠ Hőfok ellenőrzése: 195–205°C közötti tartomány
                </div>
              </div>
            </>
          )}
          {task.kind === "cnc" && (
            <>
              <div className="text-[12.5px] font-semibold mb-3">CNC program</div>
              <div className="p-3 rounded-lg bg-black border border-stone-700 font-mono text-[11px] text-emerald-300 mb-2">
                <div className="text-stone-500 text-[10.5px] mb-1">// program betöltve</div>
                <div>{task.program}</div>
                <div className="text-stone-500 text-[10.5px] mt-1">// {task.parts} alkatrész</div>
              </div>
              <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-700">
                <div className="text-[10.5px] uppercase tracking-wide text-stone-500">Alkatrészek száma</div>
                <div className="text-[22px] font-semibold mt-0.5 font-mono">{task.parts}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Big action buttons */}
      <div className="flex items-center gap-3">
        <button onClick={onPrev} disabled={taskIdx === 0}
          className="h-20 px-8 rounded-2xl bg-stone-800 border border-stone-700 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-[16px] font-medium inline-flex items-center gap-2.5">
          <Icon name="chevron" size={20} className="rotate-180" />
          Előző
        </button>
        <button onClick={onDone}
          className="flex-1 h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[20px] font-bold inline-flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/40">
          <Icon name="check" size={28} />
          KÉSZ — feladat lezárása
        </button>
        <button onClick={onNext} disabled={taskIdx >= totalTasks - 1}
          className="h-20 px-8 rounded-2xl bg-stone-800 border border-stone-700 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-[16px] font-medium inline-flex items-center gap-2.5">
          Következő
          <Icon name="chevron" size={20} />
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-3">
        <button onClick={onProblem}
          className="flex-1 h-14 rounded-xl bg-rose-600/20 border border-rose-700/40 hover:bg-rose-600/30 text-rose-200 text-[14px] font-medium inline-flex items-center justify-center gap-2">
          <Icon name="alert" size={18} />Probléma jelzés
        </button>
        <button className="flex-1 h-14 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-200 text-[14px] font-medium inline-flex items-center justify-center gap-2">
          <Icon name="camera" size={18} />Fotó csatolás (proof)
        </button>
      </div>
    </div>
  );
}

function NestingDarkSvg({ material }) {
  // dark nesting visualization
  const sheetW = 2800, sheetH = 2070;
  const parts = [
    { x: 50, y: 50,    w: 800, h: 560, label: "OL 800×560" },
    { x: 870, y: 50,   w: 800, h: 560, label: "OL 800×560" },
    { x: 50, y: 630,   w: 600, h: 140, label: "FF" },
    { x: 670, y: 630,  w: 600, h: 140, label: "FF" },
    { x: 50, y: 790,   w: 600, h: 140, label: "FF" },
    { x: 670, y: 790,  w: 600, h: 140, label: "FF" },
    { x: 50, y: 950,   w: 590, h: 560, label: "Polc" },
    { x: 660, y: 950,  w: 590, h: 560, label: "Polc" },
    { x: 1270, y: 950, w: 590, h: 560, label: "Polc" },
    { x: 1880, y: 950, w: 590, h: 560, label: "Polc" },
    { x: 50, y: 1530,   w: 590, h: 480, label: "Polc" },
    { x: 660, y: 1530,  w: 590, h: 480, label: "Polc" },
  ];
  return (
    <div className="w-full h-full max-h-[480px] flex flex-col items-center justify-center">
      <svg viewBox={`0 0 ${sheetW} ${sheetH}`} className="w-full h-full max-h-[420px]" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width={sheetW} height={sheetH} fill="#1c1917" stroke="#44403c" strokeWidth="6" />
        {parts.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h}
              fill={i < 2 ? "#0d9488" : i < 6 ? "#7c2d12" : i < 10 ? "#ca8a04" : "#0d9488"} fillOpacity="0.5"
              stroke={i < 2 ? "#5eead4" : i < 6 ? "#fb923c" : i < 10 ? "#fbbf24" : "#5eead4"} strokeWidth="3" />
            <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 12} fill="white" fontSize="40" fontFamily="ui-monospace, monospace" textAnchor="middle" fontWeight="600">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="text-[11px] text-stone-500 mt-2 font-mono">{material} · {sheetW} × {sheetH}mm · 87% hasznosítás</div>
    </div>
  );
}

function EdgebandViz({ task }) {
  return (
    <div className="text-center">
      <div className="w-48 h-48 mx-auto mb-4 rounded-2xl bg-amber-700/20 border-2 border-amber-700/40 grid place-items-center relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col">
          <div className="h-2 bg-amber-500" />
          <div className="flex-1 bg-stone-700/40" />
          <div className="h-2 bg-amber-500" />
        </div>
        <div className="relative text-stone-200 text-[12px] font-medium">Alkatrész</div>
      </div>
      <div className="text-[14px] font-semibold">Élzárás művelet</div>
      <div className="text-[11.5px] text-stone-400 mt-1">{task.parts} db alkatrész · {task.edge}</div>
    </div>
  );
}

function CncViz({ task }) {
  return (
    <div className="text-center w-full">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-black border-2 border-stone-700 p-6 font-mono text-[11px] text-left text-emerald-300">
        <div className="text-stone-500">// CNC program betöltve</div>
        <div className="text-emerald-200 text-[13px] mt-1 mb-2">▶ {task.program}</div>
        <div>G54 G90 G17 G21 G40</div>
        <div>T1 M6</div>
        <div>S18000 M3</div>
        <div>G0 X0 Y0 Z50</div>
        <div>...</div>
        <div className="text-stone-500 mt-2">// {task.parts} darabszám</div>
      </div>
      <div className="text-[14px] font-semibold mt-3">CNC megmunkálás</div>
    </div>
  );
}

function NoMoreTasks({ onChangeMachine }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-600/20 grid place-items-center mx-auto mb-5">
          <Icon name="check" size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight">Nincs több feladat</h1>
        <p className="text-[13px] text-stone-400 mt-2">Minden feladat lezárva ezen a gépen.</p>
        <button onClick={onChangeMachine} className="mt-6 h-12 px-6 bg-stone-700 hover:bg-stone-600 rounded-xl text-[14px] font-medium">
          Másik gép kiválasztása
        </button>
      </div>
    </div>
  );
}

// ─── Stage: Problem reporter ──────────────────────────────────────────
function ProblemStage({ onCancel, onSubmit }) {
  const [type, setType] = useStateF(null);
  const reasons = [
    { key: "material", label: "Anyaghiány",        icon: "box" },
    { key: "machine",  label: "Gépi probléma",     icon: "wrench" },
    { key: "quality",  label: "Minőségi hiba",     icon: "alert" },
    { key: "drawing",  label: "Hiányos rajz",      icon: "ruler" },
    { key: "other",    label: "Egyéb",             icon: "more" },
  ];
  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 grid place-items-center mx-auto mb-3">
            <Icon name="alert" size={28} className="text-white" />
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Probléma jelzése</h1>
          <p className="text-[13px] text-stone-400 mt-1">A műszakvezető azonnal értesítést kap</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {reasons.map(r => (
            <button key={r.key} onClick={() => setType(r.key)}
              className={`p-5 rounded-xl border text-left transition ${
                type === r.key ? "bg-rose-600/20 border-rose-500" : "bg-stone-800 border-stone-700 hover:border-stone-600"
              }`}>
              <Icon name={r.icon} size={22} className="text-rose-300 mb-3" />
              <div className="text-[14px] font-medium">{r.label}</div>
            </button>
          ))}
        </div>

        <textarea placeholder="Részletek (opcionális)…"
          className="w-full h-24 rounded-xl bg-stone-800 border border-stone-700 p-3 text-[13px] outline-none focus:border-rose-500" />

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 h-14 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-[14px] font-medium">Mégse</button>
          <button onClick={onSubmit} disabled={!type}
            className="flex-1 h-14 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-bold">
            Küldés a műszakvezetőnek
          </button>
        </div>
      </div>
    </div>
  );
}

window.ShopFloor = ShopFloor;
