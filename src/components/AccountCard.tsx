import type { AccountRisk, RiskLevel } from '../types/index.ts'
import RiskBadge from './RiskBadge.tsx'

interface Props {
  accountRisk: AccountRisk
  isSending: boolean
  onDraft: () => void
  onSend: () => void
}

// The score is the hero — risk color makes urgency impossible to miss
const scoreTextColor: Record<RiskLevel, string> = {
  critical: 'text-red-500',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-white/50',
}

// Signal dot: yellow → orange → red severity gradient
function signalColor(weight: number): string {
  if (weight >= 35) return 'bg-red-500'
  if (weight >= 25) return 'bg-orange-500'
  if (weight >= 20) return 'bg-yellow-400'
  return 'bg-white/20'
}

const signalLabels: Record<string, string> = {
  login_gap:             'Login gap',
  unresolved_tickets:    'Open tickets',
  seat_downgrade:        'Seat downgrade',
  low_nps:               'Low NPS',
  low_seat_utilization:  'Seat utilization',
}

export default function AccountCard({ accountRisk, isSending, onDraft, onSend }: Props) {
  const { account, riskLevel, score, signals, daysUntilRenewal } = accountRisk
  const canSend = true
  const utilizationPct = Math.round((account.seatsActive / account.seats) * 100)

  return (
    <div className="p-6 pb-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-8 mb-6">
        <div className="min-w-0">
          <h2 className="text-[45px] font-heading font-bold text-white leading-tight tracking-tight">
            {account.company}
          </h2>
          <p className="text-[30px] text-white/65 mt-1">{account.name}</p>
          <p className="text-[25px] font-mono text-white/40 mt-0.5">{account.email}</p>
        </div>

        {/* Score block — the visual anchor */}
        <div className="text-right shrink-0">
          <p className={`text-[72px] font-mono font-black tabular-nums leading-none ${scoreTextColor[riskLevel]}`}>
            {score}
          </p>
          <div className="mt-2 flex justify-end">
            <RiskBadge level={riskLevel} />
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="border-y border-white/[0.07] mb-6">
        <div className="flex">
          {[
            { label: 'MRR',         value: `$${account.mrr.toLocaleString()}` },
            { label: 'Renewal',     value: `${daysUntilRenewal}d` },
            { label: 'Seats',       value: `${account.seatsActive} / ${account.seats}` },
            { label: 'Utilization', value: `${utilizationPct}%` },
            { label: 'Tickets',     value: `${account.unresolvedTickets}` },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 py-3 px-3 ${i > 0 ? 'border-l border-white/[0.07]' : ''}`}
            >
              <p className="text-[11px] uppercase tracking-[0.13em] text-white/40 mb-1.5">
                {stat.label}
              </p>
              <p className="text-[13px] font-mono font-medium text-white/80">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Churn signals ── */}
      {signals.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.13em] text-white/40 mb-3">
            Churn signals
          </p>
          <div className="flex flex-col gap-1.5">
            {signals.map((signal) => (
              <div key={signal.type} className="flex items-center gap-3">
                <span className={`shrink-0 w-[5px] h-[5px] ${signalColor(signal.weight)}`} />
                <span className="flex-1 text-[18px] text-white/75">
                  {signalLabels[signal.type] ?? signal.label}
                </span>
                <span className="text-[18px] font-mono text-white/55">
                  {signal.value}
                </span>
                <span className="text-[16px] font-mono text-white/35 w-8 text-right">
                  +{signal.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {account.notes && (
        <p className="text-[20px] text-white/50 leading-relaxed mb-6 pl-3 border-l border-white/[0.20]">
          {account.notes}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDraft}
          disabled={isSending}
          className="text-[18px] px-4 py-2 font-medium text-white/60 border border-white/[0.20] hover:text-white/90 hover:border-white/[0.40] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Preview email
        </button>

        {canSend && (
          <button
            onClick={onSend}
            disabled={isSending}
            className={`text-[18px] px-4 py-2 font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
              riskLevel === 'critical'
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : riskLevel === 'high'
                ? 'bg-orange-500 hover:bg-orange-400 text-white'
                : riskLevel === 'medium'
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/70 border border-white/[0.15]'
            }`}
          >
            {isSending ? 'Sending…' : 'Send save email'}
          </button>
        )}

        <span className="text-[12px] font-mono text-white/35 ml-auto uppercase tracking-wider">
          {account.accountManager}
        </span>
      </div>

    </div>
  )
}
