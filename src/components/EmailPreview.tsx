import type { SaveEmail, RiskLevel } from '../types/index.ts'

interface Props {
  email: SaveEmail | null
  isLoading: boolean
  riskLevel?: RiskLevel
  onEdit?: (fields: Partial<Pick<SaveEmail, 'to' | 'subject' | 'body'>>) => void
}

const riskAccentBg: Record<RiskLevel, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-400',
  low:      'bg-white/10',
}

const fieldBase = 'bg-transparent outline-none w-full transition-colors'
const fieldEditable = 'border-b border-transparent hover:border-white/[0.12] focus:border-white/30'
const fieldReadonly = 'cursor-default select-text'

function SentConfirmation({ email }: { email: SaveEmail }) {
  const sentAt = email.sentAt
    ? new Date(email.sentAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="flex-1 p-6 overflow-y-auto">

      {/* Sent banner */}
      <div className="border border-white/[0.10] mb-5 overflow-hidden">
        <div className="bg-white/[0.04] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Solid dot — static, email is done */}
            <span className="w-2 h-2 rounded-full bg-white shrink-0" />
            <span className="text-[13px] font-medium text-white tracking-tight">
              Sent to {email.to}
            </span>
          </div>
          {sentAt && (
            <span className="text-[12px] font-mono text-white/40 shrink-0">{sentAt}</span>
          )}
        </div>
        <div className="h-[1px] bg-white/[0.06]" />
        <div className="px-5 py-2.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/25">
            Subject — {email.subject}
          </span>
        </div>
      </div>

      {/* Email content — read-only, dimmed to signal locked state */}
      <div className="relative border border-white/[0.06] overflow-hidden opacity-60">
        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/20" />

        <div className="bg-white/[0.02] pl-5 pr-5 py-4 border-b border-white/[0.05] space-y-2.5">
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] uppercase tracking-[0.13em] text-white/40 w-12 shrink-0">To</span>
            <span className="text-[12px] font-mono text-white/60">{email.to}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] uppercase tracking-[0.13em] text-white/40 w-12 shrink-0">Subject</span>
            <span className="text-[13px] font-medium text-white/70">{email.subject}</span>
          </div>
        </div>

        <div className="pl-5 pr-5 py-5">
          <p className="text-[13px] text-white/60 leading-[1.8] whitespace-pre-wrap">{email.body}</p>
        </div>
      </div>

    </div>
  )
}

export default function EmailPreview({ email, isLoading, riskLevel, onEdit }: Props) {

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
          </span>
          <span className="text-[12px] font-mono uppercase tracking-wider text-yellow-400/60">
            Drafting…
          </span>
        </div>

        <div className="border border-white/[0.08] overflow-hidden animate-pulse">
          <div className="bg-white/[0.03] px-5 py-4 border-b border-white/[0.06] space-y-3">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-2 bg-white/[0.06]" />
              <div className="h-2 bg-white/[0.04] w-2/5" />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-2 bg-white/[0.06]" />
              <div className="h-2 bg-white/[0.04] w-3/5" />
            </div>
          </div>
          <div className="px-5 py-5 space-y-2.5">
            <div className="h-2 bg-white/[0.04] w-full" />
            <div className="h-2 bg-white/[0.04] w-5/6" />
            <div className="h-2 bg-white/[0.04] w-4/5" />
            <div className="h-2 bg-white/[0.04] w-2/3" />
            <div className="h-2 bg-white/[0.04] w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-[11px] font-mono uppercase tracking-wider text-white/[0.12]">
          No draft
        </span>
      </div>
    )
  }

  // Sent state — persistent, dedicated layout
  if (email.status === 'sent') {
    return <SentConfirmation email={email} />
  }

  const accentClass = riskLevel ? riskAccentBg[riskLevel] : 'bg-white/10'
  const editable = email.status === 'draft' && !!onEdit
  const isSending = email.status === 'sending'

  return (
    <div className="flex-1 p-6 overflow-y-auto">

      {/* Row: label + status + edit hint */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
          Outreach email
        </span>
        <div className="flex items-center gap-3">
          {editable && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/20">
              Click any field to edit
            </span>
          )}
          {isSending && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
              </span>
              <span className="text-[12px] font-mono uppercase tracking-wider text-yellow-400">Sending…</span>
            </div>
          )}
          {email.status === 'draft' && (
            <span className="text-[12px] font-mono uppercase tracking-wider text-white/30">Draft</span>
          )}
          {email.status === 'failed' && (
            <span className="text-[12px] font-mono uppercase tracking-wider text-red-400">Failed</span>
          )}
        </div>
      </div>

      {/* Email card */}
      <div className="relative border border-white/[0.08] overflow-hidden">
        <span className={`absolute left-0 top-0 bottom-0 w-[2px] ${accentClass}`} />

        <div className="bg-white/[0.03] pl-5 pr-5 py-4 border-b border-white/[0.06] space-y-2.5">
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] uppercase tracking-[0.13em] text-white/40 w-12 shrink-0">To</span>
            {editable ? (
              <input
                type="text"
                value={email.to}
                onChange={(e) => onEdit({ to: e.target.value })}
                className={`text-[12px] font-mono text-white/65 ${fieldBase} ${fieldEditable}`}
              />
            ) : (
              <span className={`text-[12px] font-mono text-white/65 ${fieldBase} ${fieldReadonly}`}>{email.to}</span>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-[11px] uppercase tracking-[0.13em] text-white/40 w-12 shrink-0">Subject</span>
            {editable ? (
              <input
                type="text"
                value={email.subject}
                onChange={(e) => onEdit({ subject: e.target.value })}
                className={`text-[13px] font-medium text-white/80 ${fieldBase} ${fieldEditable}`}
              />
            ) : (
              <span className={`text-[13px] font-medium text-white/80 ${fieldBase} ${fieldReadonly}`}>{email.subject}</span>
            )}
          </div>
        </div>

        <div className="pl-5 pr-5 py-5">
          {editable ? (
            <textarea
              value={email.body}
              onChange={(e) => onEdit({ body: e.target.value })}
              rows={10}
              className={`text-[13px] text-white/75 leading-[1.8] resize-none ${fieldBase} ${fieldEditable}`}
            />
          ) : (
            <p className="text-[13px] text-white/75 leading-[1.8] whitespace-pre-wrap">{email.body}</p>
          )}
        </div>
      </div>

      {email.status === 'failed' && (
        <p className="mt-3 text-[12px] font-mono uppercase tracking-wider text-red-500/50">
          Delivery failed — check server logs
        </p>
      )}

    </div>
  )
}
