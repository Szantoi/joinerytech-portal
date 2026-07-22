import type { Employee, PayGrade } from '../services/employees'

type EmployeeWithoutHourlyRate = Omit<Employee, 'hourlyRate'>

/** Mock-only rate card used to materialize the canonical Employee contract. */
export const HR_PAY_GRADE_HOURLY_RATES = {
  seged: 2600,
  szakmunkas: 3800,
  mester: 5200,
  mernok: 6400,
  vezeto: 8000,
} satisfies Record<PayGrade, number>

/** Module-owned employee roster; no legacy shell type or fixture dependency. */
export const HR_EMPLOYEE_FIXTURES = [
  {
    id: 'emp-nagyj', name: 'Nagy János', initials: 'NJ',
    role: 'Beépítő vezető / sofőr', dept: 'szereles', payGrade: 'mester',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 412 5511', email: 'nagy.janos@joinerytech.hu', startedAt: '2019-03-01',
    active: true, color: '#d97706',
    skills: [{ key: 'szerel', level: 3 }, { key: 'szallit', level: 3 }, { key: 'osszeszereles', level: 2 }],
  },
  {
    id: 'emp-kissa', name: 'Kiss András', initials: 'KA',
    role: 'Élzáró / CNC operátor', dept: 'gyartas', payGrade: 'szakmunkas',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 553 2210', email: 'kiss.andras@joinerytech.hu', startedAt: '2021-06-14',
    active: true, color: '#0d9488',
    skills: [{ key: 'elzaras', level: 3 }, { key: 'cnc', level: 2 }, { key: 'szerel', level: 2 }],
  },
  {
    id: 'emp-tothk', name: 'Tóth Kinga', initials: 'TK',
    role: 'Szabász operátor', dept: 'gyartas', payGrade: 'szakmunkas',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 221 7788', email: 'toth.kinga@joinerytech.hu', startedAt: '2020-09-01',
    active: true, color: '#0284c7',
    skills: [{ key: 'szabas', level: 3 }, { key: 'elzaras', level: 2 }, { key: 'szerel', level: 1 }],
  },
  {
    id: 'emp-horvg', name: 'Horváth Gábor', initials: 'HG',
    role: 'Beépítő szerelő', dept: 'szereles', payGrade: 'szakmunkas',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 118 4402', email: 'horvath.gabor@joinerytech.hu', startedAt: '2022-02-07',
    active: true, color: '#7c3aed',
    skills: [{ key: 'szerel', level: 3 }, { key: 'osszeszereles', level: 3 }, { key: 'szallit', level: 2 }],
  },
  {
    id: 'emp-feketep', name: 'Fekete Péter', initials: 'FP',
    role: 'Felmérő / sofőr', dept: 'logisztika', payGrade: 'szakmunkas',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 904 6633', email: 'fekete.peter@joinerytech.hu', startedAt: '2023-01-09',
    active: true, color: '#0284c7',
    skills: [{ key: 'felmer', level: 3 }, { key: 'szallit', level: 3 }],
  },
  {
    id: 'emp-horve', name: 'Horváth Éva', initials: 'HE',
    role: 'CNC operátor', dept: 'gyartas', payGrade: 'szakmunkas',
    weeklyHours: 32, employment: 'part',
    phone: '+36 30 667 2231', email: 'horvath.eva@joinerytech.hu', startedAt: '2022-11-21',
    active: true, color: '#0d9488',
    skills: [{ key: 'cnc', level: 3 }, { key: 'szabas', level: 2 }],
  },
  {
    id: 'emp-szaboa', name: 'Szabó Anna', initials: 'SA',
    role: 'Értékesítő', dept: 'ertekesites', payGrade: 'mernok',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 442 9100', email: 'szabo.anna@joinerytech.hu', startedAt: '2020-04-01',
    active: true, color: '#4f46e5',
    skills: [{ key: 'ertekesites', level: 3 }, { key: 'tervezes', level: 1 }],
  },
  {
    id: 'emp-kovacsp', name: 'Kovács Péter', initials: 'KP',
    role: 'Tervező / ügyvezető', dept: 'tervezes', payGrade: 'vezeto',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 111 2233', email: 'kovacs.peter@joinerytech.hu', startedAt: '2017-01-02',
    active: true, color: '#7c3aed',
    skills: [{ key: 'tervezes', level: 3 }, { key: 'ertekesites', level: 2 }],
  },
  {
    id: 'emp-vargal', name: 'Varga László', initials: 'VL',
    role: 'Felületkezelő / lakkozó', dept: 'gyartas', payGrade: 'szakmunkas',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 778 1245', email: 'varga.laszlo@joinerytech.hu', startedAt: '2021-10-04',
    active: true, color: '#0d9488',
    skills: [{ key: 'felulet', level: 3 }, { key: 'osszeszereles', level: 2 }],
  },
  {
    id: 'emp-balogm', name: 'Balogh Márk', initials: 'BM',
    role: 'Betanított segéd', dept: 'gyartas', payGrade: 'seged',
    weeklyHours: 40, employment: 'full',
    phone: '+36 30 330 9981', email: 'balogh.mark@joinerytech.hu', startedAt: '2024-08-19',
    active: true, color: '#57534e',
    skills: [{ key: 'osszeszereles', level: 1 }, { key: 'elzaras', level: 1 }],
  },
] satisfies EmployeeWithoutHourlyRate[]
