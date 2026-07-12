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
  const percentage = (value / max) * 100

  return (
    <div className="mt-2">
      {showLabel && (
        <label className="text-sm text-stone-600">
          Priority: <span className="font-semibold">{value}</span>
        </label>
      )}
      <input
        type="range"
        min="1"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        style={{
          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-stone-400 font-mono mt-0.5">
        <span>1</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
