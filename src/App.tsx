import { useState, useEffect } from 'react'
import type { AccountRisk, SaveEmail } from './types/index.ts'
import { loadAccounts } from './lib/accounts.ts'
import { scoreAll } from './lib/churnScorer.ts'
import AccountList from './components/AccountList.tsx'
import AccountCard from './components/AccountCard.tsx'
import EmailPreview from './components/EmailPreview.tsx'
import WatchdogStatus from './components/WatchdogStatus.tsx'
import type { WatchdogState } from './components/WatchdogStatus.tsx'

export default function App() {
  const [accountRisks, setAccountRisks] = useState<AccountRisk[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [emails, setEmails] = useState<Record<string, SaveEmail>>({})
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [watchdogState, setWatchdogState] = useState<WatchdogState>('idle')
  const [atRiskCount, setAtRiskCount] = useState(0)

  useEffect(() => {
    const scored = scoreAll(loadAccounts())
    setAccountRisks(scored)
    autoSendHighRisk(scored, {})
  }, [])

  const selectedRisk = accountRisks.find((ar) => ar.account.id === selectedId) ?? null

  async function autoSendHighRisk(scored: typeof accountRisks, currentEmails: Record<string, SaveEmail>) {
    const targets = scored.filter(
      (ar) =>
        (ar.riskLevel === 'critical' || ar.riskLevel === 'high') &&
        currentEmails[ar.account.id]?.status !== 'sent'
    )
    if (targets.length === 0) return

    // Mark all targets as sending immediately
    setEmails((prev) => {
      const next = { ...prev }
      for (const ar of targets) {
        next[ar.account.id] = { to: ar.account.email, subject: '', body: '', status: 'sending' }
      }
      return next
    })

    await Promise.allSettled(
      targets.map(async (ar) => {
        const id = ar.account.id
        try {
          // Draft
          const draftRes = await fetch('http://localhost:3333/api/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account: ar.account, accountRisk: ar }),
          })
          const { email: draft } = (await draftRes.json()) as { email: SaveEmail }

          // Send
          const sendRes = await fetch('http://localhost:3333/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account: ar.account, accountRisk: ar, draft }),
          })
          const { email: sent } = (await sendRes.json()) as { email: SaveEmail }

          setEmails((prev) => ({ ...prev, [id]: sent }))
        } catch {
          setEmails((prev) => ({
            ...prev,
            [id]: { to: ar.account.email, subject: '', body: '', status: 'failed' },
          }))
        }
      })
    )
  }

  function handleScanAll() {
    setWatchdogState('scanning')
    setTimeout(() => {
      const rescored = scoreAll(loadAccounts())
      setAccountRisks(rescored)
      const count = rescored.filter(
        (ar) => ar.riskLevel === 'critical' || ar.riskLevel === 'high'
      ).length
      setAtRiskCount(count)
      setWatchdogState('done')
      setEmails((currentEmails) => {
        autoSendHighRisk(rescored, currentEmails)
        return currentEmails
      })
    }, 1200)
  }

  async function handleDraft(ar: AccountRisk) {
    const id = ar.account.id
    setLoadingEmailId(id)
    setEmails((prev) => ({
      ...prev,
      [id]: { to: ar.account.email, subject: '', body: '', status: 'draft' },
    }))
    try {
      const res = await fetch('http://localhost:3333/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: ar.account, accountRisk: ar }),
      })
      const data = (await res.json()) as { email: SaveEmail }
      setEmails((prev) => ({ ...prev, [id]: data.email }))
    } catch {
      setEmails((prev) => {
        const existing = prev[id] ?? { to: ar.account.email, subject: '', body: '' }
        return { ...prev, [id]: { ...existing, status: 'failed' as const } }
      })
    } finally {
      setLoadingEmailId(null)
    }
  }

  function handleEditEmail(id: string, fields: Partial<Pick<SaveEmail, 'to' | 'subject' | 'body'>>) {
    setEmails((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      return { ...prev, [id]: { ...existing, ...fields } }
    })
  }

  async function handleSend(ar: AccountRisk) {
    const id = ar.account.id
    const draft = emails[id]
    setSendingId(id)

    // Use the existing draft (with any edits) — mark as sending
    setEmails((prev) => ({
      ...prev,
      [id]: { ...(draft ?? { to: ar.account.email, subject: '', body: '' }), status: 'sending' },
    }))
    try {
      const res = await fetch('http://localhost:3333/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: ar.account, accountRisk: ar, draft }),
      })
      const data = (await res.json()) as { email: SaveEmail }
      // Preserve edited content — only update sentAt and status from server
      setEmails((prev) => ({
        ...prev,
        [id]: { ...(draft ?? data.email), sentAt: data.email.sentAt, status: data.email.status },
      }))
    } catch {
      setEmails((prev) => {
        const existing = prev[id] ?? { to: ar.account.email, subject: '', body: '' }
        return { ...prev, [id]: { ...existing, status: 'failed' as const } }
      })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-80 shrink-0 bg-black border-r border-white/[0.08] flex flex-col">

        {/* Logo row */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {/* Mondrian mark: solid white square */}
            <div className="w-5 h-5 bg-white flex items-center justify-center shrink-0">
              <span className="text-black text-[12px] font-black font-mono leading-none select-none">V</span>
            </div>
            <span className="text-[13px] font-heading font-bold text-white tracking-tight">
              Vigil
            </span>
          </div>
          <WatchdogStatus
            state={watchdogState}
            totalAccounts={accountRisks.length}
            atRiskCount={atRiskCount}
          />
        </div>

        <AccountList
          accounts={accountRisks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onScanAll={handleScanAll}
          isScanning={watchdogState === 'scanning'}
        />
      </aside>

      {/* ── Main panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {selectedRisk ? (
          <>
            {/* Account detail */}
            <div className="shrink-0 border-b border-white/[0.06] overflow-y-auto max-h-[75vh]">
              <AccountCard
                accountRisk={selectedRisk}
                isSending={sendingId === selectedRisk.account.id}
                onDraft={() => handleDraft(selectedRisk)}
                onSend={() => handleSend(selectedRisk)}
              />
            </div>

            {/* Email preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <EmailPreview
                email={emails[selectedRisk.account.id] ?? null}
                isLoading={loadingEmailId === selectedRisk.account.id}
                riskLevel={selectedRisk.riskLevel}
                onEdit={(fields) => handleEditEmail(selectedRisk.account.id, fields)}
              />
            </div>
          </>
        ) : (
          /* Empty state — pure black, one line */
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[12px] font-mono uppercase tracking-[0.18em] text-white/30">
              Select an account
            </span>
          </div>
        )}
      </main>

    </div>
  )
}
