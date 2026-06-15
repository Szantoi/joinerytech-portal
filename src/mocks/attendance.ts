export type AttendanceStatus = 'present' | 'pending' | 'approved' | 'absent' | 'late'
export type ShiftType = 'morning' | 'afternoon' | 'night'

export interface AttendanceRecord {
  id: string
  employee: string
  date: string
  clockIn: string
  clockOut?: string
  status: AttendanceStatus
  hours?: number
  shift: ShiftType
  note?: string
}

export interface AttendanceEmployee {
  id: string
  name: string
  department: string
  pin: string
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, { label: string; bg: string; fg: string; dot: string }> = {
  present:  { label: 'Bent',        bg: 'bg-emerald-50', fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending:  { label: 'Függő',       bg: 'bg-stone-100',  fg: 'text-stone-600',   dot: 'bg-stone-400' },
  approved: { label: 'Jóváhagyva',  bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  absent:   { label: 'Hiányzó',     bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  late:     { label: 'Késő',        bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
}

export const SHIFT_META: Record<ShiftType, { label: string }> = {
  morning:   { label: 'Reggeli' },
  afternoon: { label: 'Délutáni' },
  night:     { label: 'Éjszakai' },
}

export const EMPLOYEES: AttendanceEmployee[] = [
  { id: 'EMP-001', name: 'Nagy János',     department: 'Szabászat',       pin: '1234' },
  { id: 'EMP-002', name: 'Tóth Kinga',     department: 'Élzárás / CNC',   pin: '2345' },
  { id: 'EMP-003', name: 'Kiss András',    department: 'Összszerelés',     pin: '3456' },
  { id: 'EMP-004', name: 'Horváth Éva',    department: 'CNC megmunkáló',  pin: '4567' },
  { id: 'EMP-005', name: 'Varga László',   department: 'Karbantartás',    pin: '5678' },
  { id: 'EMP-006', name: 'Fekete Péter',   department: 'Szabászat',       pin: '6789' },
  { id: 'EMP-007', name: 'Molnár Anna',    department: 'Minőségellenőrzés',pin: '7890' },
  { id: 'EMP-008', name: 'Balogh Zsolt',   department: 'Raktár',          pin: '8901' },
]

// Today: 2026-04-28
// 5 present, 1 late, 1 absent, 1 pending
export const ATTENDANCE_TODAY: AttendanceRecord[] = [
  { id: 'ATT-T-001', employee: 'Nagy János',   date: '2026-04-28', clockIn: '06:02', clockOut: undefined,  status: 'present',  hours: 7.8, shift: 'morning' },
  { id: 'ATT-T-002', employee: 'Tóth Kinga',   date: '2026-04-28', clockIn: '06:05', clockOut: undefined,  status: 'present',  hours: 7.7, shift: 'morning' },
  { id: 'ATT-T-003', employee: 'Kiss András',   date: '2026-04-28', clockIn: '06:15', clockOut: undefined,  status: 'present',  hours: 7.5, shift: 'morning' },
  { id: 'ATT-T-004', employee: 'Horváth Éva',   date: '2026-04-28', clockIn: '06:32', clockOut: undefined,  status: 'late',     hours: 7.2, shift: 'morning', note: 'Közlekedési dugó' },
  { id: 'ATT-T-005', employee: 'Varga László',  date: '2026-04-28', clockIn: '06:00', clockOut: undefined,  status: 'present',  hours: 7.9, shift: 'morning' },
  { id: 'ATT-T-006', employee: 'Fekete Péter',  date: '2026-04-28', clockIn: '',       clockOut: undefined,  status: 'absent',   shift: 'morning', note: 'Beteg' },
  { id: 'ATT-T-007', employee: 'Molnár Anna',   date: '2026-04-28', clockIn: '06:03', clockOut: undefined,  status: 'present',  hours: 7.7, shift: 'morning' },
  { id: 'ATT-T-008', employee: 'Balogh Zsolt',  date: '2026-04-28', clockIn: '',       clockOut: undefined,  status: 'pending',  shift: 'morning' },
]

// 5-day history: 2026-04-24..28 (Mon–Fri)
export const ATTENDANCE_HISTORY: AttendanceRecord[] = [
  // 2026-04-24 (Mon)
  { id: 'ATT-24-001', employee: 'Nagy János',   date: '2026-04-24', clockIn: '06:01', clockOut: '14:05', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-24-002', employee: 'Tóth Kinga',   date: '2026-04-24', clockIn: '06:00', clockOut: '14:02', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-24-003', employee: 'Kiss András',   date: '2026-04-24', clockIn: '06:10', clockOut: '14:15', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-24-004', employee: 'Horváth Éva',   date: '2026-04-24', clockIn: '06:05', clockOut: '14:00', status: 'approved', hours: 7.9, shift: 'morning' },
  { id: 'ATT-24-005', employee: 'Varga László',  date: '2026-04-24', clockIn: '06:00', clockOut: '14:10', status: 'approved', hours: 8.2, shift: 'morning' },
  { id: 'ATT-24-006', employee: 'Fekete Péter',  date: '2026-04-24', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-24-007', employee: 'Molnár Anna',   date: '2026-04-24', clockIn: '06:02', clockOut: '14:08', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-24-008', employee: 'Balogh Zsolt',  date: '2026-04-24', clockIn: '06:05', clockOut: '14:00', status: 'approved', hours: 7.9, shift: 'morning' },
  // 2026-04-25 (Tue)
  { id: 'ATT-25-001', employee: 'Nagy János',   date: '2026-04-25', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-25-002', employee: 'Tóth Kinga',   date: '2026-04-25', clockIn: '06:30', clockOut: '14:30', status: 'late',     hours: 7.5, shift: 'morning', note: 'Késő' },
  { id: 'ATT-25-003', employee: 'Kiss András',   date: '2026-04-25', clockIn: '06:05', clockOut: '14:10', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-25-004', employee: 'Horváth Éva',   date: '2026-04-25', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-25-005', employee: 'Varga László',  date: '2026-04-25', clockIn: '',       clockOut: undefined, status: 'absent', shift: 'morning', note: 'Szabadság' },
  { id: 'ATT-25-006', employee: 'Fekete Péter',  date: '2026-04-25', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-25-007', employee: 'Molnár Anna',   date: '2026-04-25', clockIn: '06:00', clockOut: '14:05', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-25-008', employee: 'Balogh Zsolt',  date: '2026-04-25', clockIn: '06:10', clockOut: '14:15', status: 'approved', hours: 8.1, shift: 'morning' },
  // 2026-04-26 (Wed)
  { id: 'ATT-26-001', employee: 'Nagy János',   date: '2026-04-26', clockIn: '06:00', clockOut: '14:02', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-002', employee: 'Tóth Kinga',   date: '2026-04-26', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-003', employee: 'Kiss András',   date: '2026-04-26', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-004', employee: 'Horváth Éva',   date: '2026-04-26', clockIn: '06:45', clockOut: '14:45', status: 'late',     hours: 7.0, shift: 'morning', note: 'Késő' },
  { id: 'ATT-26-005', employee: 'Varga László',  date: '2026-04-26', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-006', employee: 'Fekete Péter',  date: '2026-04-26', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-007', employee: 'Molnár Anna',   date: '2026-04-26', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-26-008', employee: 'Balogh Zsolt',  date: '2026-04-26', clockIn: '',       clockOut: undefined, status: 'absent', shift: 'morning', note: 'Beteg' },
  // 2026-04-27 (Thu)
  { id: 'ATT-27-001', employee: 'Nagy János',   date: '2026-04-27', clockIn: '06:00', clockOut: '14:05', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-27-002', employee: 'Tóth Kinga',   date: '2026-04-27', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-27-003', employee: 'Kiss András',   date: '2026-04-27', clockIn: '06:05', clockOut: '14:10', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-27-004', employee: 'Horváth Éva',   date: '2026-04-27', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-27-005', employee: 'Varga László',  date: '2026-04-27', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-27-006', employee: 'Fekete Péter',  date: '2026-04-27', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  { id: 'ATT-27-007', employee: 'Molnár Anna',   date: '2026-04-27', clockIn: '06:00', clockOut: '14:05', status: 'approved', hours: 8.1, shift: 'morning' },
  { id: 'ATT-27-008', employee: 'Balogh Zsolt',  date: '2026-04-27', clockIn: '06:00', clockOut: '14:00', status: 'approved', hours: 8.0, shift: 'morning' },
  // 2026-04-28 (Fri - today)
  ...ATTENDANCE_TODAY,
]
