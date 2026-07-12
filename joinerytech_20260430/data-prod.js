// Production scheduling mock data + reactive store for supervisor terminal

// ──────────────────────────────────────────────────────────────────────────
// Production task store — reactive state for live shop floor monitoring
// ──────────────────────────────────────────────────────────────────────────
const __prodTaskListeners = new Set();
const __prodTasksState = {
  tasks: [],
};

window.sim = {
  get prodTasks() { return __prodTasksState.tasks; },
  set prodTasks(val) {
    __prodTasksState.tasks = val;
    __prodTaskListeners.forEach(fn => fn());
  },
  scheduleProdTask(id, opts) {
    const idx = __prodTasksState.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    __prodTasksState.tasks[idx] = { ...__prodTasksState.tasks[idx], ...opts, status: 'utemezve' };
    __prodTaskListeners.forEach(fn => fn());
  },
  unscheduleProdTask(id) {
    const idx = __prodTasksState.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const t = __prodTasksState.tasks[idx];
    __prodTasksState.tasks[idx] = { ...t, machineId: null, date: null, status: 'uj' };
    __prodTaskListeners.forEach(fn => fn());
  },
  setProdTaskPrio(id, prio) {
    const idx = __prodTasksState.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    __prodTasksState.tasks[idx] = { ...__prodTasksState.tasks[idx], prio };
    __prodTaskListeners.forEach(fn => fn());
  },
};

function useSim() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force(x => x + 1);
    __prodTaskListeners.add(fn);
    return () => __prodTaskListeners.delete(fn);
  }, []);
  return window.sim;
}

// ──────────────────────────────────────────────────────────────────────────
// Production constants
// ──────────────────────────────────────────────────────────────────────────
window.PROD_TODAY = "2026-04-28";
window.PROD_WEEK_MONDAY = "2026-04-28";

window.PROD_KINDS = {
  cutting: { label: "Szabászat", icon: "cut", accent: "#0d9488" },
  edgeband: { label: "Élzárás", icon: "layers", accent: "#0891b2" },
  cnc: { label: "CNC", icon: "cpu", accent: "#8b5cf6" },
  assembly: { label: "Összeszerelés", icon: "wrench", accent: "#f59e0b" },
};

window.PROD_STATUS = {
  uj: { label: "Új", pill: "bg-stone-100 text-stone-600 border-stone-200", dot: "bg-stone-400" },
  utemezve: { label: "Ütemezve", pill: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  folyamatban: { label: "Folyamatban", pill: "bg-teal-100 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  blokkolt: { label: "Blokkolt", pill: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  kesz: { label: "Kész", pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

window.PROD_OPERATORS = [
  { name: "Kovács Péter", initials: "KP", role: "szabász", pin: "1234" },
  { name: "Nagy János", initials: "NJ", role: "élzárás", pin: "2345" },
  { name: "Szabó Anna", initials: "SA", role: "CNC", pin: "3456" },
  { name: "Tóth István", initials: "TI", role: "operátor", pin: "4567" },
];

// ──────────────────────────────────────────────────────────────────────────
// Production stations (machines)
// ──────────────────────────────────────────────────────────────────────────
window.PROD_STATIONS = [
  { id: "m-hpw", name: "Holzma HPW", kind: "cutting", facility: "Vác", dailyHours: 8 },
  { id: "m-selco", name: "Biesse Selco", kind: "cutting", facility: "Vác", dailyHours: 8 },
  { id: "m-edge1", name: "Brandt KDF-660", kind: "edgeband", facility: "Vác", dailyHours: 10 },
  { id: "m-edge2", name: "Brandt KDN-350", kind: "edgeband", facility: "Budapest", dailyHours: 8 },
  { id: "m-cnc1", name: "Biesse Rover A", kind: "cnc", facility: "Vác", dailyHours: 6 },
  { id: "m-cnc2", name: "Holzma CNC", kind: "cnc", facility: "Vác", dailyHours: 6 },
];

// ──────────────────────────────────────────────────────────────────────────
// Production tasks — mock data with scheduling info
// ──────────────────────────────────────────────────────────────────────────
const INITIAL_PROD_TASKS = [
  // Running tasks
  { id: "PT-001", title: "Konyhaszekrény oldallap", kind: "cutting", order: "ORD-482", machineId: "m-hpw", assignee: "Kovács Péter", date: "2026-04-28", hours: 2, status: "folyamatban", running: true, prio: 0, log: [{ ts: "2026-04-28 08:00", text: "Indítva", who: "Kovács Péter" }] },
  { id: "PT-002", title: "Fiók front élzárás", kind: "edgeband", order: "ORD-482", machineId: "m-edge1", assignee: "Nagy János", date: "2026-04-28", hours: 1.5, status: "folyamatban", running: true, prio: 0, log: [{ ts: "2026-04-28 09:15", text: "Indítva", who: "Nagy János" }] },
  { id: "PT-003", title: "Ajtólap CNC fúrás", kind: "cnc", order: "ORD-485", machineId: "m-cnc1", assignee: "Szabó Anna", date: "2026-04-28", hours: 2.5, status: "folyamatban", running: true, prio: 0, log: [{ ts: "2026-04-28 07:30", text: "Indítva", who: "Szabó Anna" }] },

  // Scheduled tasks
  { id: "PT-004", title: "Polc szabászat", kind: "cutting", order: "ORD-483", machineId: "m-selco", assignee: null, date: "2026-04-28", hours: 1, status: "utemezve", running: false, prio: 0, log: [] },
  { id: "PT-005", title: "Hátlap vágás", kind: "cutting", order: "ORD-483", machineId: "m-hpw", assignee: null, date: "2026-04-28", hours: 1.5, status: "utemezve", running: false, prio: 0, log: [] },
  { id: "PT-006", title: "Korpusz élzárás", kind: "edgeband", order: "ORD-484", machineId: "m-edge1", assignee: null, date: "2026-04-28", hours: 2, status: "utemezve", running: false, prio: 0, log: [] },
  { id: "PT-007", title: "Polc élzárás", kind: "edgeband", order: "ORD-483", machineId: "m-edge2", assignee: null, date: "2026-04-28", hours: 1, status: "utemezve", running: false, prio: 1, log: [] },
  { id: "PT-008", title: "Front CNC mart", kind: "cnc", order: "ORD-486", machineId: "m-cnc2", assignee: null, date: "2026-04-28", hours: 3, status: "utemezve", running: false, prio: 0, log: [] },

  // Overloaded machine (túlterhelt)
  { id: "PT-009", title: "Szekrény oldal", kind: "cutting", order: "ORD-487", machineId: "m-hpw", assignee: null, date: "2026-04-28", hours: 3, status: "utemezve", running: false, prio: 0, log: [] },
  { id: "PT-010", title: "Asztal lap", kind: "cutting", order: "ORD-488", machineId: "m-hpw", assignee: null, date: "2026-04-28", hours: 2, status: "utemezve", running: false, prio: 1, log: [] },

  // Unscheduled (backlog)
  { id: "PT-011", title: "Fiók alj vágás", kind: "cutting", order: "ORD-489", machineId: null, assignee: null, date: null, hours: 0.5, status: "uj", running: false, prio: 0, log: [] },
  { id: "PT-012", title: "Tok elem élzárás", kind: "edgeband", order: "ORD-490", machineId: null, assignee: null, date: null, hours: 1, status: "uj", running: false, prio: 0, log: [] },
  { id: "PT-013", title: "Fiókeleje mart", kind: "cnc", order: "ORD-491", machineId: null, assignee: null, date: null, hours: 1.5, status: "uj", running: false, prio: 1, log: [] },
  { id: "PT-014", title: "Szekrény hátlap", kind: "cutting", order: "ORD-492", machineId: null, assignee: null, date: null, hours: 1, status: "uj", running: false, prio: 0, log: [] },

  // Blocked task
  { id: "PT-015", title: "Ajtó front", kind: "edgeband", order: "ORD-493", machineId: "m-edge1", assignee: null, date: "2026-04-28", hours: 1.5, status: "blokkolt", running: false, prio: 1, log: [{ ts: "2026-04-28 06:45", text: "Anyag hiány: ABS élszalag", who: "Rendszer" }] },

  // Done task
  { id: "PT-016", title: "Polc vágás kész", kind: "cutting", order: "ORD-481", machineId: "m-selco", assignee: "Tóth István", date: "2026-04-28", hours: 1, status: "kesz", running: false, prio: 0, log: [{ ts: "2026-04-28 06:00", text: "Befejezve", who: "Tóth István" }] },
];

// Initialize store
window.sim.prodTasks = INITIAL_PROD_TASKS;

// ──────────────────────────────────────────────────────────────────────────
// ProdSchedEngine — scheduling calculations for supervisor terminal
// ──────────────────────────────────────────────────────────────────────────
window.ProdSchedEngine = {
  weekDays(monday) {
    // Return 5 working days starting from monday
    const d = new Date(monday);
    return Array.from({ length: 5 }, (_, i) => {
      const next = new Date(d);
      next.setDate(d.getDate() + i);
      const iso = next.toISOString().slice(0, 10);
      const dayNames = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
      return { date: iso, day: dayNames[i] };
    });
  },

  dayLoad(tasks, stationId, date) {
    // Sum hours for all tasks scheduled on this station on this date
    return tasks
      .filter(t => t.machineId === stationId && t.date === date && t.status !== 'kesz')
      .reduce((sum, t) => sum + (t.hours || 0), 0);
  },

  isOverloaded(tasks, stationId, date) {
    const st = window.PROD_STATIONS.find(s => s.id === stationId);
    if (!st) return false;
    const load = this.dayLoad(tasks, stationId, date);
    return load > st.dailyHours;
  },

  conflicts(tasks, monday) {
    // Return list of { stationId, date } where load > capacity
    const days = this.weekDays(monday);
    const result = [];
    window.PROD_STATIONS.forEach(st => {
      days.forEach(d => {
        if (this.isOverloaded(tasks, st.id, d.date)) {
          result.push({ stationId: st.id, date: d.date, station: st.name });
        }
      });
    });
    return result;
  },

  unscheduled(tasks) {
    // Return tasks with no machineId
    return tasks.filter(t => !t.machineId && t.status !== 'kesz');
  },

  operatorStats(tasks) {
    // Calculate stats per operator: { who, minutes, done, active }
    const byOp = {};
    tasks.forEach(t => {
      if (!t.assignee) return;
      if (!byOp[t.assignee]) byOp[t.assignee] = { who: t.assignee, minutes: 0, done: 0, active: 0 };
      if (t.status === 'kesz') {
        byOp[t.assignee].minutes += (t.hours || 0) * 60;
        byOp[t.assignee].done++;
      }
      if (t.running) byOp[t.assignee].active++;
    });
    return Object.values(byOp).sort((a, b) => b.minutes - a.minutes);
  },

  operatorEfficiency(opStat) {
    // Simplified efficiency: assume plan time = actual time, return 100%
    // In real system: (planHours / actualHours) * 100
    return 1.0; // 100%
  },

  fmtDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}ó`;
    return `${h}ó ${m}m`;
  },
};

Object.assign(window, { useSim });
