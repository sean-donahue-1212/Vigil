export type WatchdogState = 'idle' | 'scanning' | 'done'

interface Props {
  state: WatchdogState
  totalAccounts: number
  atRiskCount: number
}

export default function WatchdogStatus({ state, totalAccounts, atRiskCount }: Props) {
  if (state === 'scanning') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-70" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
        </span>
        <span className="text-[12px] font-mono text-yellow-400/70 uppercase tracking-wider">Scanning</span>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        <span className="text-[12px] font-mono text-red-400/80 uppercase tracking-wider">
          {atRiskCount} at risk
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/30" />
      </span>
      <span className="text-[12px] font-mono text-white/40 uppercase tracking-wider">
        {totalAccounts} accounts
      </span>
    </div>
  )
}
