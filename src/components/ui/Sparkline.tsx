interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  strokeWidth?: number
  responsive?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.5,
  responsive = false,
}: SparklineProps) {
  if (!data || !data.length) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 4) - 2
    return [x, y] as const
  })

  const d = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const area = fill !== 'none' ? `${d} L${width},${height} L0,${height} Z` : null

  const sizeProps = responsive
    ? { width: '100%', height, preserveAspectRatio: 'none' as const }
    : { width, height }

  const lastPoint = points[points.length - 1]

  return (
    <svg {...sizeProps} viewBox={`0 0 ${width} ${height}`} className="block">
      {area && <path d={area} fill={fill} opacity="0.18" />}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2.2" fill={stroke} />
    </svg>
  )
}
