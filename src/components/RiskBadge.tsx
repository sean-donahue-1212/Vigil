import type { RiskLevel } from '../types/index.ts'

interface Props {
  level: RiskLevel
  size?: 'sm' | 'md'
}

// Solid color blocks — Mondrian primary colors as urgency signals
const styles: Record<RiskLevel, string> = {
  critical: 'bg-red-500 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-yellow-400 text-black',
  low:      'bg-white/[0.08] text-white/60',
}

const labels: Record<RiskLevel, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}

export default function RiskBadge({ level, size = 'md' }: Props) {
  const sizeClass = size === 'sm'
    ? 'text-[12px] px-1.5 py-px'
    : 'text-[11px] px-2 py-0.5'
  return (
    <span className={`inline-block font-mono font-semibold tracking-wide ${sizeClass} ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}
