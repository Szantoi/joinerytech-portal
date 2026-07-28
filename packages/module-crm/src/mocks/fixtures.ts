import type { Lead } from '../services/leads'
import type { Opportunity } from '../services/opportunities'
import type { CrmTask } from '../services/tasks'

/** CRM-owned deterministic fixtures; the in-memory DB clones before mutation. */
export const CRM_LEAD_FIXTURES = [
  { id: 'LEAD-2426-001', status: 'uj', source: 'webshop', owner: 'Szabó A.',
    company: '', contact: 'Kele Márton', email: 'kele.marton@gmail.com', phone: '+36 30 244 5512', city: 'Budapest',
    title: 'Konyhabútor felújítás (~3,2 fm)', interest: 'L-alakú konyha, tölgy front, beépített gépekkel.',
    estValue: 2_400_000, createdAt: '2026-04-27',
    activities: [{ at: '2026-04-27 09:14', kind: 'megjegyzes', who: 'Rendszer', text: 'Webshop érdeklődésből automatikusan létrehozva.' }] },
  { id: 'LEAD-2426-002', status: 'kapcsolat', source: 'kiallitas', owner: 'Kovács P.',
    company: 'Novitech Mérnökiroda Kft.', contact: 'Halmi Gábor', email: 'halmi@novitech.hu', phone: '+36 1 388 2210', city: 'Budapest',
    title: 'Iroda berendezés — 40 munkaállomás', interest: 'Új irodaszint teljes bútorozása, asztalok + tárolók + tárgyaló.',
    estValue: 11_500_000, createdAt: '2026-04-22',
    activities: [
      { at: '2026-04-22 15:40', kind: 'talalkozo', who: 'Kovács P.', text: 'Construma kiállításon felvett kapcsolat.' },
      { at: '2026-04-24 10:05', kind: 'email', who: 'Kovács P.', text: 'Bemutatkozó anyag + referenciák kiküldve.' },
    ] },
  { id: 'LEAD-2426-003', status: 'minosites', source: 'ajanlas', owner: 'Szabó A.',
    company: 'Bistro Central', contact: 'Reményi Dóra', email: 'remenyi@bistrocentral.hu', phone: '+36 70 119 4420', city: 'Budapest',
    title: 'Étterem beépített bútorzat + pult', interest: 'Vendégtér bútor + bárpult + kiszolgáló. Belváros Café ajánlására.',
    estValue: 5_800_000, createdAt: '2026-04-18', referredBy: 'Belváros Café',
    activities: [
      { at: '2026-04-18 11:00', kind: 'hivas', who: 'Szabó A.', text: 'Bejövő hívás — Belváros Café ajánlására.' },
      { at: '2026-04-20 14:20', kind: 'talalkozo', who: 'Szabó A.', text: 'Helyszíni egyeztetés, igények felmérve.' },
    ] },
  { id: 'LEAD-2426-004', status: 'nurturing', source: 'telefon', owner: 'Szabó A.',
    company: '', contact: 'Dr. Halász Péter', email: 'halasz.p@protonmail.com', phone: '+36 20 556 7781', city: 'Balatonfüred',
    title: 'Nyaraló konyha + gardrób', interest: 'Felújítás ősszel indul, addig tájékozódik.',
    estValue: 4_200_000, createdAt: '2026-03-30',
    activities: [
      { at: '2026-03-30 16:10', kind: 'hivas', who: 'Szabó A.', text: 'Érdeklődő hívás, projekt csak szeptemberben indul.' },
      { at: '2026-04-15 09:30', kind: 'email', who: 'Szabó A.', text: 'Katalógus + anyagminta-info kiküldve.' },
    ] },
  { id: 'LEAD-2426-005', status: 'elvetve', source: 'email', owner: 'Kovács P.',
    company: '', contact: 'Tarr Niké', email: 'nike.tarr@gmail.com', phone: '+36 30 901 2244', city: 'Szeged',
    title: 'Olcsó polcrendszer garázsba', interest: 'Tömeggyártott, alacsony árfekvésű megoldást keres.',
    estValue: 180_000, createdAt: '2026-04-12', lostReason: 'Nem a profilunk — tömegtermék.',
    activities: [
      { at: '2026-04-12 08:50', kind: 'email', who: 'Kovács P.', text: 'Beérkező megkeresés.' },
      { at: '2026-04-13 10:00', kind: 'megjegyzes', who: 'Kovács P.', text: 'Elvetve — nem illik a profilunkba.' },
    ] },
  { id: 'LEAD-2426-006', status: 'konvertalva', source: 'belsoepitesz', owner: 'Kovács P.',
    company: 'Vella Interior Design', contact: 'Vella Andrea', email: 'andrea@vellainterior.hu', phone: '+36 1 567 890', city: 'Budapest',
    title: 'Penthouse konyha + nappali bútor', interest: 'Belsőépítész partner közvetítésével, igényes egyedi konyha.',
    estValue: 6_500_000, createdAt: '2026-04-10', referredBy: 'Lakberendezés Plusz', oppId: 'OPP-2426-001',
    activities: [
      { at: '2026-04-10 13:00', kind: 'email', who: 'Kovács P.', text: 'Partner megkeresés + tervrajz.' },
      { at: '2026-04-14 11:30', kind: 'talalkozo', who: 'Kovács P.', text: 'Minősítve — lehetőséggé konvertálva.' },
    ] },
] satisfies Lead[]

export const CRM_OPPORTUNITY_FIXTURES = [
  { id: 'OPP-2426-001', status: 'nyitott', owner: 'Kovács P.',
    customer: 'Vella Interior Design', contact: 'Vella Andrea', phone: '+36 1 567 890', city: 'Budapest',
    title: 'Penthouse konyha + nappali bútor', value: 6_500_000,
    source: 'belsoepitesz', fromLead: 'LEAD-2426-006', expectedClose: '2026-06-15', isNewCustomer: false, createdAt: '2026-04-14',
    activities: [{ at: '2026-04-14 11:35', kind: 'megjegyzes', who: 'Kovács P.', text: 'Lehetőség létrehozva LEAD-2426-006-ból.' }] },
  { id: 'OPP-2426-002', status: 'igenyfelmeres', owner: 'Kovács P.',
    customer: 'Doorstar Hungary Zrt.', contact: 'Kis Zoltán', phone: '+36 27 123 456', city: 'Vác',
    title: 'Belső ajtó sorozat — 2. ütem (120 db)', value: 14_200_000,
    source: 'ajanlas', fromLead: null, expectedClose: '2026-05-30', isNewCustomer: false, createdAt: '2026-04-16',
    activities: [
      { at: '2026-04-16 09:00', kind: 'hivas', who: 'Kovács P.', text: 'Meglévő ügyfél jelezte a 2. ütem igényét.' },
      { at: '2026-04-23 14:00', kind: 'talalkozo', who: 'Kovács P.', text: 'Műszaki egyeztetés, mennyiségek pontosítva.' },
    ] },
  { id: 'OPP-2426-003', status: 'ajanlat', owner: 'Szabó A.',
    customer: 'Várdai Konyhastúdió', contact: 'Várdai Eszter', phone: '+36 52 234 124', city: 'Debrecen',
    title: 'Bemutatóterem bővítés — kiállító konyhák', value: 3_200_000,
    source: 'ajanlas', fromLead: null, expectedClose: '2026-05-12', isNewCustomer: false, createdAt: '2026-04-12', quoteId: 'Q-2426-057',
    activities: [
      { at: '2026-04-12 10:00', kind: 'email', who: 'Szabó A.', text: 'Igény beérkezett, paraméterek tisztázva.' },
      { at: '2026-04-25 16:30', kind: 'email', who: 'Szabó A.', text: 'Ajánlat (Q-2426-057) kiküldve.' },
    ] },
  { id: 'OPP-2426-004', status: 'targyalas', owner: 'Kovács P.',
    customer: 'Hegyi Lakberendezés', contact: 'Hegyi Krisztina', phone: '+36 99 312 444', city: 'Sopron',
    title: 'Nappali fal + médiabútor', value: 2_400_000,
    source: 'weboldal', fromLead: null, expectedClose: '2026-05-08', isNewCustomer: false, createdAt: '2026-04-08', quoteId: 'Q-2426-054',
    activities: [
      { at: '2026-04-21 11:00', kind: 'email', who: 'Kovács P.', text: 'Ajánlat (Q-2426-054) kiküldve.' },
      { at: '2026-04-26 15:00', kind: 'hivas', who: 'Kovács P.', text: 'Ügyfél kedvezményt kér, tárgyalás folyamatban.' },
    ] },
  { id: 'OPP-2426-005', status: 'megnyert', owner: 'Szabó A.',
    customer: 'Bognár Bútor Kft.', contact: 'Bognár István', phone: '+36 72 412 333', city: 'Pécs',
    title: 'Sorozat-gyártás keretszerződés (Q2)', value: 8_800_000,
    source: 'telefon', fromLead: null, expectedClose: '2026-04-26', isNewCustomer: false, createdAt: '2026-03-28', quoteId: 'Q-2426-058', wonAt: '2026-04-26',
    activities: [{ at: '2026-04-26 12:00', kind: 'megjegyzes', who: 'Szabó A.', text: 'Megnyert — keretszerződés aláírva.' }] },
  { id: 'OPP-2426-006', status: 'elveszett', owner: 'Szabó A.',
    customer: 'Pesti Ablakműhely', contact: 'Pesti Tamás', phone: '+36 1 422 100', city: 'Budapest',
    title: 'Raktári tárolók (selejtes ütem)', value: 1_100_000,
    source: 'weboldal', fromLead: null, expectedClose: '2026-04-20', isNewCustomer: false, createdAt: '2026-03-25', lostReason: 'Árban alulmaradtunk.', lostAt: '2026-04-20',
    activities: [{ at: '2026-04-20 09:00', kind: 'megjegyzes', who: 'Szabó A.', text: 'Elveszett — ár-alapú döntés.' }] },
] satisfies Opportunity[]

export const CRM_TASK_FIXTURES = [
  { id: 'CRMT-001', refType: 'opp', refId: 'OPP-2426-002', title: 'Helyszíni felmérés időpont egyeztetése', priority: 'magas', due: '2026-04-29', done: false, owner: 'Kovács P.' },
  { id: 'CRMT-002', refType: 'lead', refId: 'LEAD-2426-002', title: 'Visszahívás az iroda-projekt ajánlatáról', priority: 'magas', due: '2026-04-26', done: false, owner: 'Kovács P.' },
  { id: 'CRMT-003', refType: 'opp', refId: 'OPP-2426-004', title: 'Kedvezményes szerződés-tervezet küldése', priority: 'magas', due: '2026-04-28', done: false, owner: 'Kovács P.' },
  { id: 'CRMT-004', refType: 'lead', refId: 'LEAD-2426-004', title: 'Őszi újrakapcsolat — emlékeztető', priority: 'alacsony', due: '2026-09-01', done: false, owner: 'Szabó A.' },
  { id: 'CRMT-005', refType: 'opp', refId: 'OPP-2426-003', title: 'Ajánlat-utánkövetés (Várdai)', priority: 'kozepes', due: '2026-05-02', done: false, owner: 'Szabó A.' },
  { id: 'CRMT-006', refType: 'lead', refId: 'LEAD-2426-003', title: 'Étterem — anyagminták bemutatása', priority: 'kozepes', due: '2026-04-24', done: true, owner: 'Szabó A.' },
] satisfies CrmTask[]
