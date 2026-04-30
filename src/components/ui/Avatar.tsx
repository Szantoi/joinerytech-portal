interface AvatarProps {
  id: string
  size?: number
}

const AVATAR_NAMES: Record<string, string> = {
  NJ: 'Nagy János',
  TK: 'Tóth Kinga',
  KA: 'Kiss András',
  SA: 'Szabó Anna',
  HE: 'Horváth Éva',
  KP: 'Kovács Péter',
}

const GRADIENTS = [
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-violet-400 to-violet-600',
  'from-sky-400 to-sky-600',
]

function gradientFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % GRADIENTS.length
  return GRADIENTS[hash]
}

export function Avatar({ id, size = 24 }: AvatarProps) {
  const label = AVATAR_NAMES[id] ?? id
  const gradient = gradientFor(id)

  return (
    <div
      title={label}
      className={`rounded-md bg-gradient-to-br ${gradient} grid place-items-center text-white font-semibold`}
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.4) }}
    >
      {id.slice(0, 2).toUpperCase()}
    </div>
  )
}
