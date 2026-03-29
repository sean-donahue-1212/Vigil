import type { AccountRisk, RiskLevel } from '../types/index.ts'
import RiskBadge from './RiskBadge.tsx'

interface Props {
  accounts: AccountRisk[]
  selectedId: string | null
  onSelect: (id: string) => void
  onScanAll: () => void
  isScanning: boolean
}

// Left accent bar — the primary risk signal in the list
const accentBg: Record<RiskLevel, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-400',
  low:      'bg-white/[0.06]',
}

function formatMrr(mrr: number): string {
  return mrr >= 1000 ? `$${(mrr / 1000).toFixed(0)}k` : `$${mrr}`
}

export default function AccountList({
  accounts, selectedId, onSelect, onScanAll, isScanning,
}: Props) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-[15px] uppercase tracking-[0.14em] text-white/40 font-medium">
          Accounts
        </span>
        <button
          onClick={onScanAll}
          disabled={isScanning}
          className="text-[12px] px-2.5 py-1 font-mono font-medium uppercase tracking-wider text-white/50 border border-white/[0.18] hover:text-white/80 hover:border-white/[0.35] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isScanning ? 'Scanning…' : 'Scan all'}
        </button>
      </div>

      {/* Account rows */}
      <div className="flex-1 overflow-y-auto">
        {accounts.map((ar) => {
          const isSelected = ar.account.id === selectedId
          const isCritical = ar.riskLevel === 'critical'

          return (
            <button
              key={ar.account.id}
              onClick={() => onSelect(ar.account.id)}
              className={`relative w-full text-left border-b border-white/[0.05] pl-[15px] pr-4 py-3 transition-colors ${
                isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Left risk accent */}
              <span
                className={`absolute left-0 top-0 h-full w-[3px] ${accentBg[ar.riskLevel]} ${
                  isCritical ? 'animate-pulse' : ''
                }`}
              />

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-[20px] font-medium truncate transition-colors ${
                    isSelected ? 'text-white' : 'text-white/75'
                  }`}>
                    {ar.account.company}
                  </p>
                  <p className="text-[17px] text-white/50 truncate mt-0.5">
                    {ar.account.name}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <RiskBadge level={ar.riskLevel} size="sm" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] font-mono text-white/40">
                  {formatMrr(ar.account.mrr)}/mo
                </span>
                <span className="text-white/[0.12]">·</span>
                <span className="text-[12px] font-mono text-white/40">
                  {ar.daysUntilRenewal}d
                </span>
                {ar.signals.length > 0 && (
                  <>
                    <span className="text-white/[0.12]">·</span>
                    <span className="text-[12px] font-mono text-white/40">
                      {ar.signals.length}s
                    </span>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
