interface PrioritySliderProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  showLabel?: boolean
}

export function PrioritySlider({
  value,
  max,
  onChange,
  disabled = false,
  showLabel = true,
}: PrioritySliderProps) {
  return (
    <div className="mt-2">
      {showLabel && (
        <label className="text-sm text-ink-soft">
          Prioritás: <span className="font-semibold">{value}</span>
        </label>
      )}
      {/* A kitöltött sáv az `accent-color`-ból jön, nem inline gradiensből: a
          korábbi beégetett hex-ek (#f59e0b/#e5e7eb) dark módban nem váltottak. */}
      <input
        type="range"
        min="1"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-400"
      />
      <div className="flex justify-between text-xs text-ink-muted font-mono mt-0.5">
        <span>1</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
