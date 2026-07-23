export const WIZARD_INCIDENT_TYPES = ['near-miss', 'injury', 'property'] as const
export type WizardIncidentType = typeof WIZARD_INCIDENT_TYPES[number]

/**
 * A legacy ingest wire-kulcsok megjelenítési szótára. A kulcsok API-értékek,
 * ezért nem fordíthatók; csak a címke és a magyarázat kerül a felületre.
 */
export const INCIDENT_TYPE_COPY: Record<WizardIncidentType, {
  label: string
  description: string
}> = {
  'near-miss': {
    label: 'Kvázibaleset',
    description: 'Olyan esemény, amely sérülést okozhatott volna, de végül nem okozott.',
  },
  injury: {
    label: 'Személyi sérülés',
    description: 'Sérüléssel vagy egészségkárosodással járó esemény.',
  },
  property: {
    label: 'Anyagi kár',
    description: 'Berendezésben, eszközben vagy létesítményben keletkezett kár.',
  },
}

export const INCIDENT_SUBMIT_ERROR =
  'A bejelentés elküldése nem sikerült. Az adatokat helyben megőriztük; próbáld újra később.'

