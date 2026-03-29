# Vigil — Claude Code context

## What this is
Vigil is an AI agent that watches your customer accounts continuously, detects churn signals using rule-based scoring, and autonomously sends a personalized save email via Gmail before any human notices the account is at risk.

Tagline: "Vigil watches your customers so you don't have to."

## Rules for all code
- Always TypeScript, never plain JS
- Dark theme: bg-zinc-900 base, border-zinc-700, text-zinc-100
- Frontend runs on port 5173 (Vite)
- Server runs on port 3001 (Express)
- ANTHROPIC_API_KEY and GMAIL_ACCOUNT live in .env — never expose to frontend
- All AI calls go through Express proxy
- Model: claude-sonnet-4-20250514
- Fonts: DM Sans (body), Syne (headings), DM Mono (mono) from Google Fonts
- Gmail MCP URL: https://gmail.mcp.claude.com/mcp

## Tech stack
- Frontend: React + TypeScript + Tailwind CSS, Vite
- Backend: Node.js + Express + ts-node
- AI: Anthropic Claude API with Gmail MCP for real email sending
- CRM data: static seed/accounts.json (no external API)
- No database — all state in memory at runtime

## File structure
```
Vigil/
  src/
    types/index.ts
    lib/churnScorer.ts        — rule-based churn signal detector
    lib/accounts.ts           — loads and manages account data
    components/AccountList.tsx — sidebar list of monitored accounts
    components/AccountCard.tsx — single account with signal breakdown
    components/RiskBadge.tsx  — colored risk level badge
    components/EmailPreview.tsx — shows drafted + sent email
    components/WatchdogStatus.tsx — shows agent is running/scanning
    App.tsx
    main.tsx
    index.css
  server/
    index.ts                  — Express proxy, calls Claude with Gmail MCP
  seed/
    accounts.json             — 8 fake CRM accounts with behavioral data
  CLAUDE.md
  .env
  .gitignore
  tailwind.config.js
  index.html
```

## Data models
```typescript
interface Account {
  id: string
  name: string
  company: string
  email: string
  accountManager: string
  mrr: number
  renewalDate: string
  seats: number
  seatsActive: number
  lastLogin: string        // ISO date string
  loginFrequency: 'daily' | 'weekly' | 'monthly' | 'none'
  openTickets: number
  unresolvedTickets: number
  seatChangeLastMonth: number  // negative = downgrade
  npsScore: number | null
  notes: string
}

type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

interface ChurnSignal {
  type: 'login_gap' | 'unresolved_tickets' | 'seat_downgrade' | 'low_nps' | 'low_seat_utilization'
  label: string
  value: string
  weight: number
}

interface AccountRisk {
  account: Account
  riskLevel: RiskLevel
  score: number
  signals: ChurnSignal[]
  daysUntilRenewal: number
}

interface SaveEmail {
  to: string
  subject: string
  body: string
  sentAt?: Date
  status: 'draft' | 'sending' | 'sent' | 'failed'
}
```

## Churn scoring rules (in churnScorer.ts)
Score each account 0-100. Higher = more at risk.

Signals and weights:
- Last login > 14 days ago: +25 points
- Last login > 30 days ago: +40 points (replaces above)
- Unresolved tickets >= 2: +20 points
- Unresolved tickets >= 4: +35 points (replaces above)
- Seat downgrade last month (seatChangeLastMonth < 0): +25 points
- Seat utilization < 50% (seatsActive/seats): +15 points
- NPS score < 6: +20 points
- Days until renewal < 60: +10 points (urgency multiplier)

Risk levels:
- 0-24: low (green)
- 25-49: medium (amber)
- 50-74: high (orange)
- 75+: critical (red)

## Server endpoint

### POST /api/scan
- Body: { account: Account, accountRisk: AccountRisk }
- Calls Claude API with Gmail MCP attached
- Claude drafts a personalized save email and sends it via Gmail MCP
- System prompt tells Claude: you are an account manager at [company], write a warm personal save email, keep it under 150 words, do not sound automated
- Returns: { email: SaveEmail }

### POST /api/draft
- Body: { account: Account, accountRisk: AccountRisk }
- Same as above but does NOT send — just returns the draft
- Used for previewing before sending

## Gmail MCP integration
In server/index.ts, attach MCP server to the Claude API call:
```typescript
mcp_servers: [
  {
    type: "url",
    url: "https://gmail.mcp.claude.com/mcp",
    name: "gmail"
  }
]
```
Claude will use the gmail MCP tool to send the email autonomously.

## UI layout
Two columns:
- Left (320px): Vigil header + watchdog status indicator + AccountList sorted by risk score descending
- Right (flex): Selected account detail — AccountCard with signal breakdown + EmailPreview

## Account list behavior
- Sorted by risk score, highest first
- Critical accounts have a pulsing red left border
- Clicking an account shows detail on right
- "Scan All" button at top runs churn scorer across all accounts
- "Send Save Email" button on critical/high accounts triggers /api/scan

## Watchdog status
Shows in sidebar header:
- Green pulsing dot + "Watching 8 accounts" when idle
- Amber + "Scanning..." when running
- After scan: "3 accounts at risk" with count

## Seed data (seed/accounts.json)
Create 8 accounts. Mix of risk levels:
- 2 critical: haven't logged in 35+ days, multiple unresolved tickets, seat downgrade
- 2 high: 20+ days no login, 1-2 unresolved tickets
- 2 medium: weekly login but low NPS or seat underutilization
- 2 low: healthy, active, good NPS

Make them feel real: real-sounding names, companies, MRR between $2k-$15k/month, renewal dates in next 30-90 days.

## Demo script (60 seconds)
1. Open Vigil — show 8 accounts sorted by risk, 2 glowing red
2. Click a critical account — show signal breakdown: "Last login: 38 days ago, 3 unresolved tickets, -2 seat downgrade"
3. Hit "Send Save Email"
4. Watch agent draft + send via Gmail in real time
5. Show the sent email in EmailPreview
6. Check Gmail inbox live — email is actually there

Pitch line: "Vigil noticed this account was dying 6 weeks before renewal. It sent the email. Nobody asked it to."

## Constraints
- No auth, no persistent DB
- No API key in frontend
- Gmail MCP handles all email sending — do not use nodemailer or SMTP
- Keep save emails under 150 words, warm and personal, never sound automated
- Mobile layout not required

## Design rules
- No generic AI aesthetics — no purple gradients, no glassmorphism, no floating orbs
- No cookie-cutter layouts — no centered hero with a subtitle and a CTA button
- Typography must be intentional — pair a distinctive display font with a refined body font
- Colors must encode meaning — not decoration
- Every component must look like it was designed for this specific product, not copied from a template
- Spacing must be deliberate — generous whitespace OR controlled density, never the default
- No rounded everything — use border radius purposefully
- Animations only if they communicate state — not for decoration
- If it looks like it came from a Tailwind UI kit, redo it
- Reference aesthetic: Linear, Vercel, Raycast — precise, opinionated, confident
- When in doubt, do less. Restraint beats decoration every time.