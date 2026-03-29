import type { Account, AccountRisk, ChurnSignal, RiskLevel } from '../types/index.ts'

export function scoreAccount(account: Account): AccountRisk {
  let score = 0
  const signals: ChurnSignal[] = []

  const today = new Date()
  const lastLogin = new Date(account.lastLogin)
  const daysSinceLogin = Math.floor(
    (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLogin > 30) {
    score += 40
    signals.push({
      type: 'login_gap',
      label: 'No login in 30+ days',
      value: `${daysSinceLogin} days ago`,
      weight: 40,
    })
  } else if (daysSinceLogin > 14) {
    score += 25
    signals.push({
      type: 'login_gap',
      label: 'No login in 14+ days',
      value: `${daysSinceLogin} days ago`,
      weight: 25,
    })
  }

  if (account.unresolvedTickets >= 4) {
    score += 35
    signals.push({
      type: 'unresolved_tickets',
      label: 'Critical ticket backlog',
      value: `${account.unresolvedTickets} unresolved`,
      weight: 35,
    })
  } else if (account.unresolvedTickets >= 2) {
    score += 20
    signals.push({
      type: 'unresolved_tickets',
      label: 'Unresolved tickets',
      value: `${account.unresolvedTickets} unresolved`,
      weight: 20,
    })
  }

  if (account.seatChangeLastMonth < 0) {
    score += 25
    signals.push({
      type: 'seat_downgrade',
      label: 'Seat downgrade last month',
      value: `${account.seatChangeLastMonth} seats`,
      weight: 25,
    })
  }

  const utilization = account.seatsActive / account.seats
  if (utilization < 0.5) {
    score += 15
    signals.push({
      type: 'low_seat_utilization',
      label: 'Low seat utilization',
      value: `${Math.round(utilization * 100)}%`,
      weight: 15,
    })
  }

  if (account.npsScore !== null && account.npsScore < 6) {
    score += 20
    signals.push({
      type: 'low_nps',
      label: 'Low NPS score',
      value: `NPS ${account.npsScore}`,
      weight: 20,
    })
  }

  const renewalDate = new Date(account.renewalDate)
  const daysUntilRenewal = Math.floor(
    (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilRenewal < 60 && daysUntilRenewal > 0) {
    score += 10
  }

  score = Math.min(score, 100)

  const riskLevel: RiskLevel =
    score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'

  return { account, riskLevel, score, signals, daysUntilRenewal }
}

export function scoreAll(accounts: Account[]): AccountRisk[] {
  return accounts
    .map(scoreAccount)
    .sort((a, b) => b.score - a.score)
}
