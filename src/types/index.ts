export interface Account {
  id: string
  name: string
  company: string
  email: string
  accountManager: string
  mrr: number
  renewalDate: string
  seats: number
  seatsActive: number
  lastLogin: string
  loginFrequency: 'daily' | 'weekly' | 'monthly' | 'none'
  openTickets: number
  unresolvedTickets: number
  seatChangeLastMonth: number
  npsScore: number | null
  notes: string
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface ChurnSignal {
  type: 'login_gap' | 'unresolved_tickets' | 'seat_downgrade' | 'low_nps' | 'low_seat_utilization'
  label: string
  value: string
  weight: number
}

export interface AccountRisk {
  account: Account
  riskLevel: RiskLevel
  score: number
  signals: ChurnSignal[]
  daysUntilRenewal: number
}

export interface SaveEmail {
  to: string
  subject: string
  body: string
  sentAt?: Date
  status: 'draft' | 'sending' | 'sent' | 'failed'
}
