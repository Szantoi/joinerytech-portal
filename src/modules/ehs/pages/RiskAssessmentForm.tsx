import { useState, type FormEvent } from 'react'
import { Button, DateField, SelectField, TextAreaField } from '../../../components/ui'
import { addDays, formatDay, parseDay, todayIso } from '../../../services/dateUtils'
import {
  CURRENT_EMPLOYEE_ID,
  RISK_LIKELIHOODS,
  RISK_SEVERITIES,
  type CreateRiskAssessmentPayload,
  type RiskLikelihood,
  type RiskSeverity,
  type UpdateRiskAssessmentPayload,
} from '../services'

export interface RiskLocationOption {
  locationId: string
  name: string
}

interface CommonRiskAssessmentFormProps {
  locations?: RiskLocationOption[]
  isSubmitting?: boolean
  onCancel?: () => void
}

interface CreateRiskAssessmentFormProps extends CommonRiskAssessmentFormProps {
  mode: 'create'
  initialValues?: Partial<Omit<CreateRiskAssessmentPayload, 'assessedBy'>>
  onSubmit: (payload: CreateRiskAssessmentPayload) => void
}

interface UpdateRiskAssessmentFormProps extends CommonRiskAssessmentFormProps {
  mode: 'update'
  initialValues: UpdateRiskAssessmentPayload
  onSubmit: (payload: UpdateRiskAssessmentPayload) => void
}

export type RiskAssessmentFormProps =
  | CreateRiskAssessmentFormProps
  | UpdateRiskAssessmentFormProps

const SEVERITY_LABELS: Record<RiskSeverity, string> = {
  elhanyagolhato: 'Elhanyagolható (1)',
  enyhe: 'Enyhe (2)',
  kozepes: 'Közepes (3)',
  sulyos: 'Súlyos (4)',
  katasztrofalis: 'Katasztrofális (5)',
}

const LIKELIHOOD_LABELS: Record<RiskLikelihood, string> = {
  ritka: 'Ritka (1)',
  valoszinutlen: 'Valószínűtlen (2)',
  lehetseges: 'Lehetséges (3)',
  valoszinu: 'Valószínű (4)',
  szinte_biztos: 'Szinte biztos (5)',
}

/**
 * A dátummező nap-kulcsot kezel, az API viszont DateTimeOffset értéket vár.
 * A szöveges összeállítás szándékos: `Date#toISOString()` helyi éjfélből a
 * megelőző UTC-napot adhatná, ezért nem engedjük át a napot UTC-konverzión.
 */
function toReviewDateTime(day: string): string {
  return `${formatDay(parseDay(day))}T00:00:00.000Z`
}

function initialReviewDay(value: string | undefined, fallback: string): string {
  return value ? formatDay(parseDay(value)) : fallback
}

/** Create és draft-update módban is használható, mutációtól független űrlap. */
export function RiskAssessmentForm(props: RiskAssessmentFormProps) {
  const minReviewDate = addDays(todayIso(), 1)
  const defaultReviewDate = addDays(todayIso(), 30)
  const initialValues = props.initialValues

  const [hazardDescription, setHazardDescription] = useState(
    initialValues?.hazardDescription ?? '',
  )
  const [severity, setSeverity] = useState<RiskSeverity | ''>(initialValues?.severity ?? '')
  const [likelihood, setLikelihood] = useState<RiskLikelihood | ''>(
    initialValues?.likelihood ?? '',
  )
  const [locationId, setLocationId] = useState(initialValues?.locationId ?? '')
  const [reviewDueDate, setReviewDueDate] = useState(() =>
    initialReviewDay(initialValues?.reviewDueDate, defaultReviewDate),
  )

  const isValid = hazardDescription.trim().length > 0 &&
    hazardDescription.length <= 1000 && severity !== '' && likelihood !== '' &&
    reviewDueDate >= minReviewDate

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || props.isSubmitting) return

    const commonPayload: UpdateRiskAssessmentPayload = {
      hazardDescription: hazardDescription.trim(),
      severity,
      likelihood,
      reviewDueDate: toReviewDateTime(reviewDueDate),
      locationId: locationId || null,
    }

    if (props.mode === 'create') {
      props.onSubmit({ ...commonPayload, assessedBy: CURRENT_EMPLOYEE_ID })
    }
    else {
      props.onSubmit(commonPayload)
    }
  }

  const disabledReason = props.isSubmitting
    ? undefined
    : isValid ? undefined : 'Töltsd ki helyesen a kötelező mezőket.'

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextAreaField
        label="Veszély leírása"
        required
        maxLength={1000}
        value={hazardDescription}
        disabled={props.isSubmitting}
        onChange={(event) => setHazardDescription(event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Súlyosság"
          required
          value={severity}
          disabled={props.isSubmitting}
          onChange={(event) => setSeverity(event.target.value as RiskSeverity | '')}
        >
          <option value="">Válassz súlyosságot…</option>
          {RISK_SEVERITIES.map((value) => (
            <option key={value} value={value}>{SEVERITY_LABELS[value]}</option>
          ))}
        </SelectField>

        <SelectField
          label="Bekövetkezési valószínűség"
          required
          value={likelihood}
          disabled={props.isSubmitting}
          onChange={(event) => setLikelihood(event.target.value as RiskLikelihood | '')}
        >
          <option value="">Válassz valószínűséget…</option>
          {RISK_LIKELIHOODS.map((value) => (
            <option key={value} value={value}>{LIKELIHOOD_LABELS[value]}</option>
          ))}
        </SelectField>
      </div>

      <SelectField
        label="Helyszín"
        value={locationId}
        disabled={props.isSubmitting}
        onChange={(event) => setLocationId(event.target.value)}
      >
        <option value="">Nincs megadva</option>
        {(props.locations ?? []).map((location) => (
          <option key={location.locationId} value={location.locationId}>{location.name}</option>
        ))}
      </SelectField>

      <DateField
        label="Felülvizsgálat határideje"
        required
        min={minReviewDate}
        value={reviewDueDate}
        disabled={props.isSubmitting}
        onChange={setReviewDueDate}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={props.isSubmitting}
          disabledReason={disabledReason}
        >
          {props.mode === 'create' ? 'Kockázatértékelés létrehozása' : 'Módosítások mentése'}
        </Button>
        {props.onCancel && (
          <Button
            type="button"
            variant="quiet"
            disabled={props.isSubmitting}
            onClick={props.onCancel}
          >
            Mégse
          </Button>
        )}
      </div>
    </form>
  )
}
